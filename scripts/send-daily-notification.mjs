import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const TIMEZONE = 'America/New_York';
const APP_URL = 'https://hartjeremy.github.io/Name-Workout/';
const LOOKBACK_MINUTES = 15;
const SLOT_MINUTES = 5;
const appId = process.env.ONESIGNAL_APP_ID;
const apiKey = process.env.ONESIGNAL_REST_API_KEY;

if (!appId || !apiKey) {
  throw new Error('Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY.');
}

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric', month: '2-digit', day: '2-digit'
});
const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIMEZONE,
  hour: '2-digit', minute: '2-digit', hour12: false
});

const schedule = JSON.parse(
  await readFile(new URL('../notify-schedule.json', import.meta.url), 'utf8')
);

function deterministicUuid(value) {
  const bytes = createHash('sha1').update(value).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

function floorToSlot(date) {
  const floored = new Date(date);
  floored.setUTCSeconds(0, 0);
  floored.setUTCMinutes(
    floored.getUTCMinutes() - (floored.getUTCMinutes() % SLOT_MINUTES)
  );
  return floored;
}

function recentSlots(now) {
  const latest = floorToSlot(now);
  const slots = [];
  for (let offset = 0; offset <= LOOKBACK_MINUTES; offset += SLOT_MINUTES) {
    slots.push(new Date(latest.getTime() - offset * 60_000));
  }
  return slots;
}

async function sendSlot(slot) {
  const date = dateFormatter.format(slot);
  const time = timeFormatter.format(slot);
  const matches = schedule.filter(entry => entry.date === date);

  if (matches.length === 0) {
    console.log(`No Name WOD scheduled for ${date}; skipped ${time}.`);
    return;
  }
  if (matches.length > 1) {
    throw new Error(`Expected at most one schedule entry for ${date}; found ${matches.length}.`);
  }

  const entry = matches[0];
  const operationKey = deterministicUuid(`name-wod:${date}:${time}`);
  const response = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      app_id: appId,
      target_channel: 'push',
      filters: [
        { field: 'tag', key: 'name_wod_notifications', relation: '=', value: '1' },
        { operator: 'AND' },
        { field: 'tag', key: 'name_wod_time', relation: '=', value: time }
      ],
      headings: { en: entry.title },
      contents: { en: entry.message },
      url: APP_URL,
      web_url: APP_URL,
      name: `name-wod-${date}-${time.replace(':', '')}`,
      idempotency_key: operationKey
    })
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`OneSignal ${response.status}: ${JSON.stringify(result)}`);
  }
  if (!result.id && result.recipients !== 0) {
    throw new Error(`OneSignal returned an unexpected result: ${JSON.stringify(result)}`);
  }

  console.log(
    `Processed ${date} ${time}: ${entry.name}; ` +
    `recipients=${result.recipients ?? 'unknown'}; id=${result.id ?? 'none'}`
  );
}

for (const slot of recentSlots(new Date())) {
  await sendSlot(slot);
}
