# AMPED Changelog

## v22 - 2026-10-03
- Fixed active-workout mobile layout after the skip-state UI was added.
- Runner grid now gives the flexible vertical space to the exercise area instead of the status summary.
- Keeps progress summary and status dots directly under the header while vertically centering the current exercise.
- PWA cache bumped to `amped-v31`.

# Changelog

## v20 - Wake control + Max exercise guides
- Replaced the ambiguous sun wake-lock control with a monitor-style keep-awake toggle that shows on/off state.
- Added visible runner feedback when keep-awake is enabled, disabled, unsupported, or cannot be acquired.
- Preserved the user's keep-awake choice across app visibility changes during a workout.
- Added an info button to each workout preview row and active workout screen.
- Added Max's Quick Guide bottom sheet with how-to directions, a form cue, and an easier option.
- Added a dedicated exercise-guides.js module covering all 26 built-in exercise names.
- Added validation that every default exercise has a guide and that HTML ids are unique.
- Removed a duplicate Export all button id found during validation.
- Service-worker cache bumped to amped-v29.

# v19 — Explicit skip states and end-of-workout review

- Workout runner now tracks each move explicitly as `remaining`, `completed`, or `skipped`.
- Swiping left or tapping Skip marks an unfinished move as skipped; swiping right only navigates back.
- Added live workout status counts and per-move state dots so skipped moves stay visible.
- Added a brief “SKIPPED — you can come back” cue when a move is skipped.
- When the last remaining move is processed, skipped exercises trigger a review screen instead of silently completing the workout.
- Review offers **Do skipped exercise(s)** or **Finish without it/them**.
- Completing a skipped move clears its skipped state; skipped-review mode moves only through skipped exercises.
- Completed-workout copy omits skipped exercises while reporting the honest completion count (for example, `5 of 6`).
- Bumped the PWA cache to `amped-v28`.

# v18 — Architecture and maintainability pass

- Centralized app, mascot, storage, notification, dictionary, and D20 timing configuration in `config.js`.
- Mascot identity is now a single value: `APP_CONFIG.mascot.name`. Easter-egg copy and accessibility labels are generated from it.
- Renamed mascot DOM/CSS hooks to generic names so future mascot renames do not require structural code edits.
- Moved exercise libraries and Workout-by-Roll templates into `workout-data.js`.
- Expanded package validation to enforce 26 A–Z entries, 20 D20 exercises, 20 six-move D20 workout templates, valid roll references, and unique storage keys.
- Added new modules to the offline cache and gated the disabled OneSignal service-worker import.
- Preserved existing local-storage key strings and deployment path for backward compatibility.

# v17 — Max returns + Roll Again focus

- Switched the hidden bulb mascot back from Burnie to **Max** in the active app and documentation.
- Updated **Roll again** so it returns the user to the D20, centers/focuses the die, then starts the next roll.
- Preserved the slower v16 D20 pacing, 950 ms multi-roll pause, 3D flick/drag/tap controls, swipe workout navigation, timers, settings, and workout libraries.
- Bumped the PWA cache to `amped-v26`.

# v16 — D20 roll pacing

- Slowed the D20 tumble and settling animation so each result is easier to watch.
- Added a 950 ms pause between automatic D20 rolls so each result remains visible before the next throw.
- Kept manual roll, flick/drag/tap controls, swipe workout navigation, settings, workout libraries, Burnie Easter eggs, and all timer behavior unchanged.
- Bumped the PWA cache to `amped-v25`.

# v15 — Burnie the Bulb

- Renamed the hidden bulb mascot from Max to **Burnie**.
- Updated Burnie’s Easter-egg messages, accessibility label, tap target, toast identifiers, and current documentation.
- Kept the 3D D20, flick/drag/tap roll, swipe workout navigation, switch-sides timer, settings, libraries, and workout logic unchanged.
- Bumped the PWA cache to `amped-v24`.

# v11 — Better Max + timed side-switch cue

## v14 — D20 visual + swipe navigation

- Replaced the flat SVG die with a self-contained canvas-rendered 3D D20.
- Added tactile drag/flick control; flick direction and speed influence the throw.
- Tap-to-roll, auto-roll, manual multi-roll, workout-by-roll, history, settings, and saved libraries remain intact.
- Added swipe navigation to the active workout runner: swipe left for next/skip, swipe right for back.
- Swipe navigation never marks a move complete; DONE remains the completion action.
- Added subtle runner swipe guidance and transition animation.
- Bumped the PWA cache to `amped-v23`.


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

## v13 — D20 library + workout rebalance
- Added a D20 → Exercise editor in Settings alongside A–Z → Exercise.
- D20 customizations now drive both Exercise by Roll and Workout by Roll.
- Exercise export/import now includes both A–Z and D20 libraries, while still accepting older A–Z-only exports.
- Rebalanced the Workout-by-Roll templates to reduce repetitive shoulder/plank and cardio stacking.
- Added a fun title to every D20 workout while retaining the plain grouping in parentheses.
- Cache bumped to `amped-v22`.


## v21 — Cleaner exercise preview
- Removed the redundant `D20 exercise #` subtext from D20 exercise preview rows.
- Preserved useful per-side timing/detail subtext where present.
- Cache bumped to `amped-v30`.
