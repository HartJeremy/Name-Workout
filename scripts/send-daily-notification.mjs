// Reads notify-schedule.json, finds the entry matching today's date
// (in the given timezone), and sends it as a OneSignal push notification.
// Requires env vars: ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY

import { readFileSync } from 'fs';

const TIMEZONE = 'America/New_York';

const appId = process.env.ONESIGNAL_APP_ID;
const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

if (!appId || !restApiKey) {
  console.error('Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY env vars.');
  process.exit(1);
}

const todayISO = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date()); // en-CA gives YYYY-MM-DD

const schedule = JSON.parse(readFileSync(new URL('../notify-schedule.json', import.meta.url)));
const todaysEntry = schedule.find(e => e.date === todayISO);

if (!todaysEntry) {
  console.log(`No entry for ${todayISO}. Nothing to send.`);
  process.exit(0);
}

const response = await fetch('https://onesignal.com/api/v1/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    Authorization: `Basic ${restApiKey}`
  },
  body: JSON.stringify({
    app_id: appId,
    included_segments: ['Subscribed Users'],
    headings: { en: 'Name Workout Challenge' },
    contents: { en: todaysEntry.message }
  })
});

const result = await response.json();
if (!response.ok) {
  console.error('OneSignal API error:', result);
  process.exit(1);
}
console.log(`Sent for ${todayISO}:`, todaysEntry.message, '\u2014', result);
