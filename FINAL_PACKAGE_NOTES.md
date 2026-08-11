# Final Package Notes

This package is the updated source/master build of Code Detective.

## Required one-time backend step

Run `FINAL_UPGRADE.sql` in the project's Supabase SQL Editor. The frontend intentionally expects the upgraded assignment and streak-protection schema when those features are used.

## What was fixed

- Crime Scene rendering regression caused by missing legacy banner elements.
- Profile modal renderer regression.
- Admin → Home navigation.
- Notification detail positioning and complete long-message display.
- Notification search/filter/read behavior.
- Admin notification history and deletion.
- Supabase-backed assignment create/edit/delete/distribution.
- Assignment submission synchronization and realtime refresh.
- Improved Admin send-notification and assignment UI.
- Dashboard stat-card spacing and live assignment/case/XP/streak values.
- Streak-at-risk admin panel and manual reminders.
- Daily server-side streak reminder automation at 6:00 PM IST.
- Machine-specific Android Gradle distribution URL.

## APK/AAB

The Capacitor Android project is preserved. A release APK/AAB was not regenerated in this environment because the Android SDK/signing configuration belongs to the development machine. After the backend setup and web testing are complete, build with `gradlew.bat assembleRelease` and `gradlew.bat bundleRelease` from `android/`.

Do not commit `android/local.properties`; use `android/local.properties.example`.


## Features 5–8 implementation
Run `AUTH_ADMIN_SECURITY_UPGRADE.sql` after `FINAL_UPGRADE.sql`. Enable Google provider in Supabase Auth and add the deployed `index.html` and `reset-password.html` URLs to the Auth redirect allow-list.
