// Reads notify-schedule.json, finds the entry matching today's date
// in the Eastern time zone, and sends it through OneSignal.
//
// Required environment variables:
// ONESIGNAL_APP_ID
// ONESIGNAL_REST_API_KEY
//
// Optional:
// APP_URL

import { readFileSync } from 'fs';

const TIMEZONE = 'America/New_York';

const appId = process.env.ONESIGNAL_APP_ID;
const restApiKey = process.env.ONESIGNAL_REST_API_KEY;
const appUrl = process.env.APP_URL;

if (!appId || !restApiKey) {
  console.error(
    'Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY environment variables.'
  );
  process.exit(1);
}

const todayISO = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());

const schedule = JSON.parse(
  readFileSync(
    new URL('../notify-schedule.json', import.meta.url),
    'utf8'
  )
);

const todaysEntry = schedule.find(entry => entry.date === todayISO);

if (!todaysEntry) {
  console.log(`No entry for ${todayISO}. Nothing to send.`);
  process.exit(0);
}

const message =
  todaysEntry.message ||
  (todaysEntry.name
    ? `${todaysEntry.name}'s workout is ready.`
    : 'Your workout is ready.');

const payload = {
  app_id: appId,
  target_channel: 'push',
  included_segments: ['Subscribed Users'],
  headings: {
    en: 'Name Workout Challenge'
  },
  contents: {
    en: message
  }
};

if (appUrl) {
  payload.url = appUrl;
}

const response = await fetch(
  'https://api.onesignal.com/notifications',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${restApiKey}`
    },
    body: JSON.stringify(payload)
  }
);

const result = await response.json();

if (!response.ok) {
  console.error('OneSignal API error:', result);
  process.exit(1);
}

console.log(
  `Sent for ${todayISO}:`,
  message,
  JSON.stringify(result, null, 2)
);
