# AMPED

> **Compatibility note:** The public app name is **AMPED**. The existing GitHub repository/path `Name-Workout`, workflow filename, OneSignal tag keys, and browser storage keys are intentionally retained so current installs, URLs, preferences, and notifications keep working.

Mobile-first PWA with D20 as the default workout mode. Mode-aware tagline: D20 “Roll it. Sweat it. Build it.”; Name “Spell it. Sweat it. Build it.”; Letters “Draw it. Sweat it. Build it.”; Word “Pick it. Sweat it. Build it.” Name, random letters, and dictionary word modes remain available.

The bulb mascot is **Max**, kept intentionally subtle as an Easter egg. Tapping the bulb artwork reveals one of Max’s rotating funny-but-motivational messages without changing the main AMPED branding. The mobile layout also respects iOS safe areas so the header controls remain below the status bar when installed to the Home Screen.

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
- When the schedule has no current or future names remaining, the Name tab is hidden automatically while Letters, Word, and D20 remain available.
- Parenthetical clarifiers are stored as an optional `note` and never count as workout letters.
- The notification workflow sends nothing on dates without a schedule entry.


## D20 workout modes

- **Exercise by roll:** choose 1-20 rolls. Auto-roll can build the full workout in one tap, or it can be disabled to roll each movement manually.
- **Workout by roll:** one D20 roll chooses one of 20 complete balanced bodyweight workouts. Roll Again produces a new selection.
- The D20 exercise table and the A-Z letter table both mix upper body, lower body, core, cardio, and posterior-chain work.

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
  "title": "AMPED: ALEX",
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


## Timed side changes
For any timed exercise configured as Split half or Per side, AMPED flashes a SWITCH SIDES/LEGS/etc. cue at the halfway point and vibrates when vibration is enabled.

### Max Easter egg
Tap the bulb artwork to reveal one of Max's rotating hidden electrical/workout jokes.

### D20 exercise library
Settings now includes separate **A–Z → Exercise** and **D20 → Exercise** editors. Changes to the D20 map affect both individual exercise rolls and the 20 preset Workout-by-Roll templates. Each preset displays a fun title followed by its descriptive grouping in parentheses.


### D20 interaction

The D20 can be tapped, dragged, or flicked. Flick direction and speed influence the visual throw while the secure random roll still determines the result. During an active workout, swipe left to skip/advance and swipe right to go back. DONE marks a move completed; an unfinished move advanced with swipe-left or Skip is explicitly marked skipped.

## Workout skip/review flow

- Active workouts track each move as **remaining**, **completed**, or **skipped**.
- The runner shows live counts plus move-state dots so skipped exercises remain visible.
- At the end, any skipped moves open a review screen instead of completing silently.
- **Do skipped exercise(s)** jumps directly into the skipped-only queue.
- **Finish without it/them** completes the workout with those moves still marked skipped.
- Completed-workout copy excludes skipped exercises and reports the original completion count (for example, `5 of 6`).

## Code organization

AMPED keeps change-prone configuration separate from behavior:

- `config.js` — app settings, storage keys, mascot identity/messages, intensity labels, and D20 timing.
- `workout-data.js` — A–Z exercises, D20 exercises, and the 20 Workout-by-Roll templates.
- `app.js` — UI behavior, workout generation, timers, runner navigation, and persistence.
- `styles.css` — presentation and responsive layout.
- `sw.js` — offline caching/service-worker behavior.

To rename the bulb mascot, change only `APP_CONFIG.mascot.name` in `config.js`. The UI accessibility label and Easter-egg messages are generated from that value. Existing local-storage key strings remain intentionally unchanged for backward compatibility with installed users.

## Workout guidance
Each built-in exercise has a reusable guide in `exercise-guides.js`. The preview list and active workout runner expose the guide through an info button. The guide panel uses the configured mascot name from `APP_CONFIG`, so renaming Max still requires only the single mascot configuration change. Custom exercise names without a matching built-in guide receive a safe generic fallback.

## Keep-awake control
The workout runner requests the Screen Wake Lock API when a workout starts. The top-right monitor control shows the actual active state and provides visible feedback when toggled. If the platform releases the wake lock while the app is hidden, AMPED reacquires it when the app becomes visible only if the user still wants keep-awake enabled.
