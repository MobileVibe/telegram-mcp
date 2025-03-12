#!/bin/bash

# This script helps test the Telegram MCP server locally
# It runs the server and then uses the MCP Inspector to interact with it

# Check if required environment variables are set
if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
  echo "Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables are required"
  echo ""
  echo "Please set them before running this script:"
  echo "export TELEGRAM_BOT_TOKEN=your_bot_token"
  echo "export TELEGRAM_CHAT_ID=your_chat_id"
  exit 1
fi

# Build the server
echo "Building the server..."
npm run build

# Start the server in the background
echo "Starting the server..."
node build/index.js > server.log 2>&1 &
SERVER_PID=$!

# Give the server a moment to start
sleep 1

# Check if the server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
  echo "Error: Server failed to start. Check server.log for details."
  exit 1
fi

echo "Server started with PID $SERVER_PID"
echo "Starting MCP Inspector to interact with the server..."
echo "Press Ctrl+C to stop the server when done"

# Run the MCP Inspector
npx @modelcontextprotocol/inspector build/index.js

# Clean up
kill $SERVER_PID
echo "Server stopped"
