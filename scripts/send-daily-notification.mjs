import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const TIMEZONE = 'America/New_York';
const APP_URL = 'https://hartjeremy.github.io/Name-Workout/';
const WORKFLOW_FILE = 'daily-name-wod.yml';
const FALLBACK_LOOKBACK_MINUTES = 15;
const MAX_LOOKBACK_MINUTES = 24 * 60;
const SLOT_MINUTES = 5;

const appId = process.env.ONESIGNAL_APP_ID;
const apiKey = process.env.ONESIGNAL_REST_API_KEY;
const githubToken = process.env.GITHUB_TOKEN;
const githubRepository = process.env.GITHUB_REPOSITORY;
const githubApiUrl = process.env.GITHUB_API_URL || 'https://api.github.com';
const currentRunId = process.env.GITHUB_RUN_ID;

if (!appId || !apiKey) {
  throw new Error('Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY.');
}

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  hourCycle: 'h23'
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

function clampCheckpoint(checkpoint, now) {
  const oldestAllowed = new Date(now.getTime() - MAX_LOOKBACK_MINUTES * 60_000);
  if (checkpoint < oldestAllowed) {
    console.warn(
      `Previous successful run is more than ${MAX_LOOKBACK_MINUTES} minutes old; ` +
      `limiting catch-up to the past 24 hours.`
    );
    return oldestAllowed;
  }
  return checkpoint;
}

function slotsAfter(checkpoint, now) {
  const slots = [];
  let slot = floorToSlot(now);

  while (slot > checkpoint) {
    slots.push(new Date(slot));
    slot = new Date(slot.getTime() - SLOT_MINUTES * 60_000);
  }

  return slots.reverse();
}

async function getPreviousSuccessfulRunStart(now) {
  const fallback = new Date(now.getTime() - FALLBACK_LOOKBACK_MINUTES * 60_000);

  if (!githubToken || !githubRepository) {
    console.warn(
      'GitHub run history is unavailable; using the 15-minute fallback window.'
    );
    return fallback;
  }

  const workflow = encodeURIComponent(WORKFLOW_FILE);
  const url =
    `${githubApiUrl}/repos/${githubRepository}/actions/workflows/${workflow}/runs` +
    '?status=success&per_page=30';

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'name-wod-notification-runner'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    const previous = (result.workflow_runs || [])
      .filter(run => String(run.id) !== String(currentRunId || ''))
      .filter(run => run.conclusion === 'success')
      .map(run => ({
        ...run,
        checkpoint: new Date(run.run_started_at || run.created_at)
      }))
      .filter(run => !Number.isNaN(run.checkpoint.getTime()) && run.checkpoint < now)
      .sort((a, b) => b.checkpoint - a.checkpoint)[0];

    if (!previous) {
      console.warn(
        'No previous successful workflow run was found; using the 15-minute fallback window.'
      );
      return fallback;
    }

    console.log(
      `Previous successful run: ${previous.id} at ${previous.checkpoint.toISOString()}.`
    );
    return clampCheckpoint(previous.checkpoint, now);
  } catch (error) {
    console.warn(
      `Could not read GitHub workflow history (${error.message}); ` +
      'using the 15-minute fallback window.'
    );
    return fallback;
  }
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

const now = new Date();
const checkpoint = await getPreviousSuccessfulRunStart(now);
const dueSlots = slotsAfter(checkpoint, now);

console.log(
  `Checking reminder slots after ${checkpoint.toISOString()} through ${now.toISOString()}.`
);

if (dueSlots.length === 0) {
  console.log('No five-minute reminder slots are due.');
} else {
  console.log(`Processing ${dueSlots.length} reminder slot(s).`);
  for (const slot of dueSlots) {
    await sendSlot(slot);
  }
}
