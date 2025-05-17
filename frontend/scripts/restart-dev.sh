#!/bin/bash

# Next.js Server Restart Script
# This script helps to properly restart the Next.js development server

# Function to find and kill processes
kill_processes() {
  local PATTERN=$1
  local PIDS=$(ps aux | grep "$PATTERN" | grep -v grep | awk '{print $2}')
  
  if [ -n "$PIDS" ]; then
    echo "🛑 Stopping processes matching '$PATTERN' (PIDs: $PIDS)..."
    kill $PIDS 2>/dev/null
    sleep 2
    
    # Check if processes are still running and force kill if needed
    for PID in $PIDS; do
      if ps -p $PID > /dev/null 2>&1; then
        echo "⚠️ Force terminating stubborn process $PID..."
        kill -9 $PID 2>/dev/null
      fi
    done
  else
    echo "ℹ️ No processes matching '$PATTERN' found"
  fi
}

# Current directory
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$FRONTEND_DIR"

echo "🔄 Restarting Next.js Development Server"
echo "Working directory: $FRONTEND_DIR"

# Kill any running Next.js processes
kill_processes "node.*next"

# Also kill any running Next.js processes with turbopack
kill_processes "turbopack"

# Clear next.js cache
echo "🧹 Clearing Next.js cache..."
rm -rf .next/cache

# Validate .env.local file
if [ -f .env.local ]; then
  echo "✅ .env.local file found"
else
  echo "⚠️ .env.local file not found, your environment might not be properly configured!"
fi

# Check if we're in CI environment
if [ -z "$CI" ]; then
  # Start Next.js in the background and open browser
  echo "🚀 Starting Next.js development server..."
  npm run dev &
  
  # Wait for server to start
  echo "⌛ Waiting for server to start..."
  sleep 5
  
  # Try to open browser based on platform
  echo "🌐 Opening browser..."
  if [ "$(uname)" == "Darwin" ]; then
    open http://localhost:3000
  elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    xdg-open http://localhost:3000
  elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ]; then
    start http://localhost:3000
  fi
else
  # In CI environment, just run normally
  echo "🚀 Starting Next.js development server in CI environment..."
  npm run dev
fi

echo "✅ Next.js server restarted!"
echo "📝 Run 'npm run check:api' to test API connectivity"
echo "📝 Run 'npm run check:google-auth' to verify Google OAuth setup"
