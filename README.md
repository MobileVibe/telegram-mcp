# Telegram MCP Server

A Model Context Protocol (MCP) server that enables LLMs to send notifications via Telegram and receive user responses.

## Features

- Send text notifications to a Telegram chat with customizable urgency levels
- Wait for and retrieve user responses
- Integrates with Cline and other MCP-compatible LLM applications

## Prerequisites

- Node.js 16 or higher
- A Telegram bot token (obtained from [@BotFather](https://t.me/botfather))
- Your Telegram chat ID

## Installation

### From npm (recommended)

```bash
npm install -g telegram-mcp
```

### From GitHub

```bash
git clone https://github.com/CHarrisTech/telegram-mcp.git
cd telegram-mcp
npm install
npm run build
```

## Configuration

The server requires two environment variables:

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `TELEGRAM_CHAT_ID`: Your Telegram chat ID

### Getting a Telegram Bot Token

1. Start a chat with [@BotFather](https://t.me/botfather) on Telegram
2. Send the command `/newbot`
3. Follow the instructions to create a new bot
4. BotFather will provide you with a token for your new bot

### Finding Your Chat ID

1. Start a chat with your new bot
2. Send a message to the bot
3. Visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for the `chat` object in the response and note the `id` field

## Usage

### Running Standalone

```bash
# Set environment variables
export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_CHAT_ID="your_chat_id"

# Run the server
telegram-mcp
```

### Integrating with Cline

Add the following to your Cline MCP settings file:

```json
{
  "mcpServers": {
    "telegram-mcp": {
      "command": "node",
      "args": ["path/to/telegram-mcp/build/index.js"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "your_bot_token",
        "TELEGRAM_CHAT_ID": "your_chat_id"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Integrating with Claude Desktop

Add the following to your Claude Desktop config file:

```json
{
  "mcpServers": {
    "telegram-mcp": {
      "command": "node",
      "args": ["path/to/telegram-mcp/build/index.js"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "your_bot_token",
        "TELEGRAM_CHAT_ID": "your_chat_id"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Available Tools

### send_notification

Sends a notification message to the configured Telegram chat.

Parameters:
- `message` (required): The message to send to the user
- `project` (required): The name of the project the LLM is working on
- `urgency` (optional): The urgency level ("low", "medium", or "high")

### check_notification_response

Checks if the user has responded to a previously sent notification.

Parameters:
- `message_id` (required): The ID of the message to check for responses
- `timeout_seconds` (optional): How long to wait for a response before giving up (default: 30)

## Development

```bash
# Clone the repository
git clone https://github.com/CHarrisTech/telegram-mcp.git
cd telegram-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Watch for changes during development
npm run watch

# Test with the MCP Inspector
npm run inspector
```

### Testing Locally

The repository includes scripts to help you test the server locally:

#### Windows
```cmd
# Set environment variables
set TELEGRAM_BOT_TOKEN=your_bot_token
set TELEGRAM_CHAT_ID=your_chat_id

# Run the test script
test-server.bat
```

#### macOS/Linux
```bash
# Set environment variables
export TELEGRAM_BOT_TOKEN=your_bot_token
export TELEGRAM_CHAT_ID=your_chat_id

# Make the script executable (first time only)
chmod +x test-server.sh

# Run the test script
./test-server.sh
```

## Examples

The `examples` directory contains sample code demonstrating how to use the Telegram MCP server:

- `programmatic-usage.js`: Shows how to use the server programmatically in your own Node.js applications

To run an example:

```bash
# Set required environment variables
export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_CHAT_ID="your_chat_id"

# Run the example
node examples/programmatic-usage.js
```

## License

MIT
