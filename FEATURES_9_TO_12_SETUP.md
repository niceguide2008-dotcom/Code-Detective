# Code Detective — Features 9–12

Implemented:
9. Notes + AI Tutor
10. Admin AI Homework Generator
11. Admin AI Assignment Generator
12. Android Push Notification registration and FCM delivery path

## Supabase SQL
Run once:
- `AI_NOTES_SETUP.sql`
- `ANDROID_PUSH_SETUP.sql`
- keep the existing `notifications_schema.sql` for in-app notifications.

## AI Edge Functions
Deploy:
- `supabase/functions/ai-tutor`
- `supabase/functions/admin-ai`

### OpenRouter configuration
All three AI features use the same OpenRouter provider:
- AI Tutor
- AI Homework Generator
- AI Assignment Generator

Set these Supabase Edge Function secrets:
- `OPENROUTER_API_KEY` — required
- `OPENROUTER_MODEL` — optional; defaults to `openrouter/free`
- `APP_URL` — optional; used as the OpenRouter HTTP Referer

Do not place the OpenRouter key in browser JavaScript, HTML, localStorage, or the mobile app bundle.

## Admin AI
AI Homework:
- topic, subject, difficulty, count, due date/time
- generates questions + teacher-facing answers
- Create & Send to Students uses the existing assignment + notification workflow

AI Assignment:
- topic, subject, difficulty, count
- generates questions only
- Use in Assignment Form; answers are not included

## Android Push
The project now declares `@capacitor/push-notifications` and requests Android 13+ notification permission.

Because Firebase configuration is unique to your app, add the real Firebase `google-services.json` before producing a new APK.

Android application ID:
`com.codedetective.app`

After adding the Firebase Android app:
```bash
npm install
npx cap sync android
```

Run `ANDROID_PUSH_SETUP.sql`. The app stores FCM tokens in `public.device_push_tokens`.

Deploy `supabase/functions/send-push` and set:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Admin broadcasts save the in-app notification first, then attempt native push delivery.

## Package lock
The uploaded project did not already contain the Capacitor Push Notifications package. This ZIP updates `package.json`; run `npm install` once after extraction so npm records the dependency in `package-lock.json`.

## Security
- AI and Firebase secrets remain server-side in Supabase Edge Function secrets.
- Admin AI and push endpoints verify admin authorization.
- Notes and push tokens use per-user RLS.
