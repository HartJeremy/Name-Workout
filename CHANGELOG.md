# v11 — Better Max + timed side-switch cue

## v12 - Max Easter egg expansion
- Restored Max's original hidden-character tone.
- Expanded the Max Easter egg to 40 short electrical/workout lines.
- Kept the switch-sides timer behavior from v11.
- Bumped the PWA cache to `amped-v21`.

- Rewrote Max's Easter-egg messages with a shorter, drier funny/motivational voice.
- Timed exercises marked `Split half` or `Per side` now flash a full-screen switch cue at the halfway point.
- Switch cue uses vibration when enabled.
- Timed `Per side` exercises now correctly include both sides in the total countdown.
- Timed split details explicitly show seconds per side.
- Service-worker cache bumped to `amped-v20`.

## Version 2.8

- Adds iPhone/iOS safe-area spacing at the top of the app so the AMPED header and Settings button sit below the status bar, battery, notch, and Dynamic Island when launched from the Home Screen.
- Expands Max's hidden Easter-egg messages into a larger funny-but-motivational rotation.
- Prevents Max from immediately repeating the same message twice.
- Bumps the PWA cache to v19.

# AMPED changelog

## v9 — Mobile brand fix
- Keeps **AMPED** on one line in the top bar on mobile.
- Removes the previous stacked AMP / ED treatment.
- Tightens mobile brand spacing while keeping the Max icon and AMPED branding.
- Bumps the PWA cache to `amped-v18`.

## v8 — Max Easter egg

- Named the AMPED bulb mascot **Max** without changing the app name or primary branding.
- Added a hidden tap target over the bulb artwork that reveals rotating Max messages.
- Added accessible labeling so the mascot has a real identity without adding visible UI clutter.
- Bumped the service-worker cache to `amped-v17`.

## v7 — AMPED branding

- Renamed the public app from **WOD Lab** to **AMPED**.
- Updated install metadata, page title, header branding, reminders, workflow labels, and exercise export filename.
- Updated the app icon from **WOD** to **AMPED** while retaining the bulb character and black/gold theme.
- Kept the existing `/Name-Workout/` deployment path and legacy browser-storage / notification keys so current installs and preferences continue working.
- Bumped the service-worker cache to `amped-v16`.


## v6 — WOD Lab branding

- Renamed the public app from **Name WOD** to **WOD Lab**.
- Updated the header, install/PWA metadata, notification titles, and user-facing copy.
- Kept the existing `/Name-Workout/` GitHub Pages path and legacy storage/notification identifiers for backward compatibility.
- Bumped the service-worker cache to `wod-lab-v15`.


## Version 2.1

- Replaces Calf Raises with 12 Reverse Snow Angels in both the D20 exercise pool and the default A-Z library to improve upper-back/posture balance.
- Preserves customized V exercises while automatically migrating untouched v2 Calf Raises installs.
- Bumps the exercise-library version to v3 and the PWA cache to v14.

## Version 2.0

- Adds D20 as a fourth workout source alongside Name, Letters, and Word.
- Adds Exercise by Roll with a selectable 1-20 roll count and manual or automatic rolling.
- Adds Workout by Roll with 20 distinct full-body workout templates and a Roll Again action.
- Adds an animated D20 graphic with roll history and result feedback.
- Rebalances the default A-Z exercise library across upper body, lower body, core, cardio, and posterior-chain movements.
- Migrates untouched legacy exercise defaults while preserving user-customized letter exercises.
- Automatically hides the Name tab once the dated name schedule has no current or future entries; Letters, Word, and D20 remain available.
- Bumps the PWA cache version so deployed devices receive the update.


## Version 1.0

- Shows every workout move in the preview.
- Removes the collapsed “+ more moves” row.
- Removes the duplicate totals chips below the move list.
- Adds Tomorrow's Name WOD when tomorrow has a dated schedule entry.
- Keeps parenthetical schedule notes separate from workout letters.
- Keeps the recent-name shortcut list limited to six names.
- Uses the dated schedule for today's default name.
- Leaves the name blank when today has no schedule entry.
- Preserves per-device notification enable/disable and reminder-time settings.

## D20 POC refinement
- D20 is now the default startup workout mode unless the user selects another default.
- Added a Default workout mode selector in Settings (D20, Name, Letters, Word).
- If the scheduled-name list is exhausted, Name is hidden and an obsolete Name default falls back to D20.
- Replaced the native share action with a one-tap Copy workout clipboard action.
- Added Copy completed workout directly to the completion screen for easy paste into group text.
- Bumped the service-worker cache to v11.

- Made the hero tagline mode-aware: Roll/Spell/Draw/Pick it. Sweat it. Build it.
- Replaced the fixed CONQUERED completion headline with rotating motivational finish messages.
- Bumped the PWA cache to v13.
