Copy-Item -Force index.html dist/index.html
Copy-Item -Force home.html dist/home.html
Copy-Item -Force auth.js dist/auth.js
Copy-Item -Force supabase.js dist/supabase.js
if (Test-Path 'assets') {
  Copy-Item -Recurse -Force assets dist/
}
