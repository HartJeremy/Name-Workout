# AMPED code review — v19

## Summary

The codebase is appropriate for a small offline-first PWA. v18 separated change-prone configuration and workout data from `app.js`; v19 adds an explicit workout-runner state model so completion, skipping, review, and copy/share behavior all use the same source of truth.

## Maintainability

Implemented:
- Centralized application configuration in `config.js`.
- Mascot identity is a single setting: `APP_CONFIG.mascot.name`.
- Storage keys are centralized while retaining their existing string values for installed-user compatibility.
- Workout data moved to `workout-data.js` rather than being mixed with UI logic.
- Package validation checks structural invariants, not just file existence.
- Deployment documentation now reflects the current notification feature flag.

Remaining technical debt:
- `app.js` is still the primary behavior module. If it grows materially beyond the current scope, split D20 rendering, workout runner, and settings/editor behavior into their own modules.

## Scalability

Implemented:
- D20 exercise definitions and D20 workout templates are data-driven.
- A-Z and D20 exercise libraries remain independently versioned and persisted.
- Validation enforces exactly 26 A-Z exercises, 20 D20 exercises, and 20 valid D20 workout templates.
- New behavior modules can be added without moving core data again.

Recommended threshold:
- Split `app.js` when a major new feature adds another substantial state machine or when the file approaches roughly 1,500 behavior lines again.

## Reusability

Implemented:
- Configuration, exercise data, workout templates, and labeling helpers are importable modules.
- Mascot message templates are reusable with any mascot name.
- Workout templates reference D20 exercise numbers rather than duplicating exercise objects.

## Flexibility

Implemented:
- Mascot rename requires one configuration change.
- D20 timing values are centralized in configuration.
- Notification integration is feature-gated.
- Existing storage key strings and `/Name-Workout/` deployment path are intentionally preserved so architecture cleanup does not break installed PWAs.

## Readability

Implemented:
- Configuration and workout data no longer crowd the top of `app.js`.
- Mascot-related DOM IDs, CSS classes, variables, and functions are generic rather than tied to a specific character name.
- README documents module responsibilities and the one-line mascot rename procedure.

Remaining technical debt:
- The D20 renderer contains compact mathematical code. It is isolated and commented, so expanding it further is preferable to rewriting it solely for formatting.
- The stylesheet is compact. If multiple contributors begin editing visual design regularly, reformatting/splitting the stylesheet would be the next readability improvement.

## Runner state

Implemented in v19:
- Each workout move has one explicit state: `remaining`, `completed`, or `skipped`.
- Runner progress, skip review, end-of-workout decisions, and completed-workout copy all read from that same state array.
- Skipping is an action, not an inference: swipe-left/Skip marks the move skipped; back navigation does not.
- Completing a previously skipped move replaces the skipped state with completed.
- The skipped-review queue operates only on skipped moves, so it does not replay completed work.

This is preferable to parallel `completedMoves` / `skippedMoves` sets because mutually exclusive state cannot drift between collections.
