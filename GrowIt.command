#!/usr/bin/env bash
# GrowIt one-tap launcher for macOS.
# Save this anywhere (Desktop, Dock) and double-click it — no terminal needed.
set -e
cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "📦 First run — installing dependencies (this can take a minute)..."
  npm install
fi

echo "🌱 Starting GrowIt..."
# Launch browser after a short delay so the server is ready
( sleep 5 && open http://localhost:3000 ) &
npm run dev