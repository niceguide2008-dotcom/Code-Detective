# Code Detective - fixes applied

## Fixed
- Corrected login entry filename from `index.html.html` to `index.html`.
- Fixed Netlify configuration to publish the Vite output folder: `dist`.
- Removed the Windows-only PowerShell post-build step from `npm run build`.
- Added a Vite multi-page build so both `index.html` and `home.html` are processed and Supabase imports are bundled correctly.
- Fixed login/signup redirects to `home.html`.
- Added an authentication guard to `home.html`; unauthenticated users are sent back to the login page.
- Improved login-page responsiveness for phones and short screens.

## Deploy
1. Delete any old `node_modules` and `dist` folders if present.
2. Run: `npm install`
3. Run: `npm run build`
4. Commit/push the project to the repository connected to Netlify, or redeploy it in Netlify.
5. Netlify will use `netlify.toml` and publish `dist` automatically.

Do not manually copy the raw `supabase.js` into `dist`; Vite must process it because it imports `@supabase/supabase-js`.

## Notification fixes applied (2026-08-08)

- Admin custom notifications are now inserted into the real Supabase `notifications` table and only recorded as successful admin history after delivery succeeds.
- New assignments now create real `assignment` notifications for the student audience instead of relying only on browser `localStorage`.
- The admin notification composer is moved to the top of the Admin console, immediately after the hero/header area.
- The Home page loads notifications from Supabase, refreshes on visibility/focus and when the notification panel is opened, and subscribes to Supabase Realtime for new/updated/deleted notifications.
- A newly received notification produces a Home-page toast and updates the notification/activity UI immediately.
- Mobile notification dropdown sizing/positioning was adjusted to remain inside narrow viewports and wrap long content.
- `notifications_schema.sql` includes an idempotent Supabase Realtime publication step for `public.notifications`.

### Rebuild after extracting this fixed source

```bash
npm install
npm run build
npx cap sync android
```

Then reopen Android Studio with:

```bash
npx cap open android
```

The uploaded `dist/` directory in this archive is the previous build artifact; rebuild it with the commands above so the generated bundle contains the fixes.
