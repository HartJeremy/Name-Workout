# Name WOD

Mobile-first PWA that turns a first name, random letters, or a dictionary word into a workout.

## Ready-to-deploy files

Upload the complete contents of this package to the root of the `Name-Workout` GitHub repository, including the hidden `.github` directory.

Required files:

- `index.html`
- `app.js`
- `styles.css`
- `sw.js`
- `manifest.webmanifest`
- `notify-schedule.json`
- `icon-192.png`
- `icon-512.png`
- `wod-hero.jpg`
- `scripts/send-daily-notification.mjs`
- `.github/workflows/daily-name-wod.yml`

## Daily workout names

`notify-schedule.json` contains 64 dated entries from July 9 through September 10, 2026.

- The app fills today's scheduled first name when the on-screen daily-name setting is enabled.
- If today's date is absent, the name field remains blank.
- Parenthetical clarifiers are stored as an optional `note` and never count as workout letters.
- The notification workflow sends nothing on dates without a schedule entry.

## Notification controls

- Users can turn reminders on or off in the app.
- Users can select a reminder time in five-minute increments.
- Times are interpreted in `America/New_York`.
- Preferences are stored as OneSignal tags.
- The workflow runs every five minutes and safely retries the most recent 15 minutes. OneSignal idempotency keys prevent the same scheduled slot from being sent twice.

## GitHub setup

Add these repository secrets under **Settings > Secrets and variables > Actions**:

- `ONESIGNAL_APP_ID`
- `ONESIGNAL_REST_API_KEY`

The REST API key must remain in GitHub Secrets. Never place it in the public app files.

Enable GitHub Actions and publish GitHub Pages from the repository's default branch and root directory.

## OneSignal setup

Configure the OneSignal web app for:

- Site origin: `https://hartjeremy.github.io`
- App path: `/Name-Workout/`
- Service worker: `/Name-Workout/sw.js`

The deployed service worker must be reachable at:

`https://hartjeremy.github.io/Name-Workout/sw.js`

## iPhone setup

On iPhone or iPad, add the site to the Home Screen, open the installed app, turn reminders on, and grant notification permission. Web push requires iOS/iPadOS 16.4 or later.

## Updating the schedule

Add one object per date:

```json
{
  "date": "2026-09-11",
  "name": "Alex",
  "title": "Today's Name WOD: ALEX",
  "message": "Today's workout name is ALEX. Open the app to start.",
  "note": "optional clarification"
}
```

The `note` field is optional and is not used as part of the workout.

## Version 1.0 preview behavior

- The workout preview shows every letter and move.
- Tomorrow's scheduled name appears below the move list when one exists.
- Parenthetical notes in the schedule are for clarification only and are never counted as workout letters.
- No dated entry means no automatic name and no scheduled notification for that date.
