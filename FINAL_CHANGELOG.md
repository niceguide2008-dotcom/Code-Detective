# Code Detective Final Upgrade — Change Log

## Fixed regressions

- Restored Crime Scene rendering after a missing legacy banner element caused `renderCrimeScene()` to terminate early.
- Restored profile modal rendering so dashboard refreshes no longer throw `renderProfileModal is not defined`.
- Restored Admin → Home navigation.
- Removed the dependency on local-only assignment data when the Supabase assignment schema is available.

## Notifications

- Complete assignment notification content.
- Responsive notification center.
- Search and filters.
- Full notification detail modal.
- Assignment deep-link to the assignment section.
- Read/unread synchronization.
- Admin notification history and deletion.

## Assignments

- Supabase-backed assignments and recipient records.
- Admin create/edit/delete.
- All-student or selected-student targeting.
- Submission state synchronization.
- Realtime assignment refresh.

## Streak protection

- Admin at-risk streak list.
- Manual individual/bulk reminders.
- Server-side daily reminder function.
- Daily automation scheduled for 6:00 PM IST.
- Duplicate same-day reminders are prevented.

## UI

- Improved dashboard hero/stat-card spacing.
- Redesigned Admin operations console.
- Responsive Admin controls.

## Android

- Existing Capacitor Android project preserved for later APK/AAB release packaging.
