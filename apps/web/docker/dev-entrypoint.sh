#!/bin/sh
set -e

# Start the shared package watcher in the background
echo "🔄 Starting @famly/shared watcher..."
cd /app
pnpm --filter @famly/shared dev &

# Wait a moment for the initial build
sleep 2

# Start the web dev server in the foreground
echo "🚀 Starting web dev server..."
cd /app/apps/web
exec pnpm dev
