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
