#!/usr/bin/env bash
# GrowIt quick launcher — starts the dev server and opens the browser in one step.
# Usage:
#   ./start.sh            (or double-click start.command on Mac)
set -e
cd "$(dirname "$0")"

# Install deps if missing (first run)
if [ ! -d node_modules ]; then
  echo "📦 First run — installing dependencies..."
  npm install
fi

echo "🌱 Starting GrowIt at http://localhost:3000"
echo "   (the page auto-reloads when you save files — no need to restart)"

# Open the browser after the server is ready
( sleep 4 && (open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null || echo "   → open http://localhost:3000 in your browser") ) &

# Run the dev server in the foreground
npm run dev