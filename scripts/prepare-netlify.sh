#!/bin/sh
set -eu
cp index.html dist/index.html
cp home.html dist/home.html
cp auth.js dist/auth.js
cp supabase.js dist/supabase.js
mkdir -p dist/assets
cp -R assets dist/ 2>/dev/null || true
