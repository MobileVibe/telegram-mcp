@echo off
REM This script helps test the Telegram MCP server locally
REM It runs the server and then uses the MCP Inspector to interact with it

REM Check if required environment variables are set
if "%TELEGRAM_BOT_TOKEN%"=="" (
  echo Error: TELEGRAM_BOT_TOKEN environment variable is required
  echo.
  echo Please set it before running this script:
  echo set TELEGRAM_BOT_TOKEN=your_bot_token
  echo set TELEGRAM_CHAT_ID=your_chat_id
  exit /b 1
)

if "%TELEGRAM_CHAT_ID%"=="" (
  echo Error: TELEGRAM_CHAT_ID environment variable is required
  echo.
  echo Please set it before running this script:
  echo set TELEGRAM_BOT_TOKEN=your_bot_token
  echo set TELEGRAM_CHAT_ID=your_chat_id
  exit /b 1
)

REM Build the server
echo Building the server...
call npm run build

REM Start the server in a new window
echo Starting the server...
start "Telegram MCP Server" cmd /c "node build\index.js"

REM Give the server a moment to start
timeout /t 2 /nobreak > nul

echo Server started in a new window
echo Starting MCP Inspector to interact with the server...
echo Close the server window when done

REM Run the MCP Inspector
npx @modelcontextprotocol/inspector build\index.js

echo Done
