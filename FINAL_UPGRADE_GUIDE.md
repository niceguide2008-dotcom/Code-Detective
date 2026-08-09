# Code Detective — Final Upgrade Guide

## 1. Supabase setup

Run `FINAL_UPGRADE.sql` once in Supabase SQL Editor.

It adds/repairs:

- `public.is_admin()` and `public.is_admin(uuid)`
- `public.assignments`
- `public.assignment_recipients`
- `notifications.assignment_id`
- Admin notification/assignment deletion permissions
- Assignment recipient RLS
- Realtime publication entries
- `public.admin_streak_at_risk()`
- `public.send_streak_reminders()`
- Daily streak reminder automation at **6:00 PM IST** (12:30 UTC)

If the rest of the schema is already installed, `AUTOMATED_STREAK_NOTIFICATIONS.sql` can be used for the streak automation portion.

## 2. Frontend

The latest `home.html` and `admin.js` are already updated.

### Home

- Crime Scene renderer no longer crashes when legacy banner elements are absent.
- Evidence Locker/Suspect Lineup continue to use the existing working game logic.
- Notification details support complete long messages.
- Assignment notifications can open the assignment area.
- Assignments load from Supabase when the upgraded tables are available.
- Assignment submission status syncs to Supabase.
- Assignment realtime refresh is enabled.
- Dashboard stat cards have improved spacing/responsive behavior.
- Profile modal rendering regression is repaired.

### Admin

- Home button restored.
- Notification composer redesigned and placed near the top.
- Notification targeting: students, everyone, admins, or selected students.
- Notification history with admin delete.
- Assignment create/edit/delete.
- Assignment targeting: all students or selected students.
- Assignment notifications contain complete assignment details.
- Streak Protection panel with manual reminders.
- Automated daily streak reminders are handled server-side by Supabase cron.

## 3. Local testing

```bash
npm install
npm run dev
```

Open the Vite URL and test:

1. Admin → Home
2. Admin → Send Notification
3. Admin → Create Assignment
4. Student → notification bell
5. Student → View Details
6. Student → Assignment submission
7. Crime Scene → Evidence → Suspect → Root Cause → Fix
8. Admin → Streak Protection

## 4. Android

The Capacitor Android project remains in `android/`.

After the web build is stable:

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
./gradlew bundleRelease
```

On Windows use `gradlew.bat`.

Keep your Android signing keystore private.
