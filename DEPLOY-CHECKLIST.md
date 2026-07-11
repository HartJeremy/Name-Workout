# Deployment checklist

1. Extract the ZIP locally so hidden folders are retained.
2. Upload every file and folder to the repository root.
3. Confirm `.github/workflows/daily-name-wod.yml` exists in GitHub.
4. Add `ONESIGNAL_APP_ID` and `ONESIGNAL_REST_API_KEY` as Actions secrets.
5. Enable GitHub Pages from the default branch and repository root.
6. Enable GitHub Actions.
7. Open the deployed app and confirm `/Name-Workout/sw.js` loads as JavaScript.
8. Install the PWA on the test device.
9. Turn reminders on, choose a time, and grant permission.
10. In OneSignal, confirm the subscription and these tags:
   - `name_wod_notifications` = `1`
   - `name_wod_time` = selected `HH:MM`
   - `name_wod_timezone` = `America/New_York`
11. Run the workflow manually from GitHub Actions to inspect the logs.
