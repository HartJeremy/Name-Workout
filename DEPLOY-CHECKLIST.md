# Deployment checklist

1. Extract the ZIP locally so hidden folders are retained.
2. Upload every file and folder to the repository root, including `config.js` and `workout-data.js`.
3. Confirm `.github/workflows/daily-name-wod.yml` exists in GitHub if scheduled-name automation is still in use.
4. Enable GitHub Pages from the default branch and repository root.
5. Open the deployed app and confirm `/Name-Workout/sw.js` loads as JavaScript.
6. Reload once after deployment so the updated service worker (`amped-v27`) can replace the old cache.
7. Install/update the PWA on a test device and verify D20, Settings, workout start, timer, swipe navigation, and copy-to-text.
8. Confirm existing customized A-Z and D20 exercise libraries are still present after the update.
9. Notifications are currently disabled in `config.js`. Only configure OneSignal secrets and notification testing if `APP_CONFIG.notifications.enabled` is intentionally turned on again.
10. Run `node scripts/validate-package.mjs` before deployment when editing the package locally.
