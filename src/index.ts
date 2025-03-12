#!/usr/bin/env node

/**
 * This is an MCP server that implements a notification system.
 * It allows the LLM to send notifications to the user via Telegram
 * when it has a question that needs a response.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

// Environment variables for Telegram configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Validate required environment variables
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  throw new Error(
    "Missing required environment variables. Please ensure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set."
  );
}

// Telegram API base URL
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Create an MCP server with capabilities for tools (to send notifications)
 */
const server = new Server(
  {
    name: "telegram-mcp",
    version: "0.1.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

/**
 * Handler that lists available tools.
 * Exposes tools for sending notifications and checking for responses.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "send_notification",
        description: "Send a text message notification to the user",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "The message to send to the user"
            },
            project: {
              type: "string",
              description: "The name of the project the LLM is working on"
            },
            urgency: {
              type: "string",
              enum: ["low", "medium", "high"],
              description: "The urgency of the notification"
            }
          },
          required: ["message", "project"]
        }
      },
      {
        name: "check_notification_response",
        description: "Check if the user has responded to a notification",
        inputSchema: {
          type: "object",
          properties: {
            message_id: {
              type: "number",
              description: "The ID of the message to check for responses"
            },
            timeout_seconds: {
              type: "number",
              description: "How long to wait for a response before giving up (default: 30)"
            }
          },
          required: ["message_id"]
        }
      }
    ]
  };
});

/**
 * Helper function to wait for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Handler for the notification tools.
 * Handles both sending notifications and checking for responses.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "send_notification": {
      const message = String(request.params.arguments?.message);
      const project = String(request.params.arguments?.project);
      const urgency = String(request.params.arguments?.urgency || "medium");

      if (!message || !project) {
        throw new Error("Message and project are required");
      }

      // Format the message with project name and urgency
      let urgencyPrefix = "";
      if (urgency === "high") {
        urgencyPrefix = "🚨 URGENT: ";
      } else if (urgency === "medium") {
        urgencyPrefix = "⚠️ ";
      }

      const formattedMessage = `${urgencyPrefix}LLM Question (${project}):\n\n${message}`;

      try {
        // Send the message using Telegram Bot API
        const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
          chat_id: TELEGRAM_CHAT_ID,
          text: formattedMessage,
          parse_mode: 'Markdown'
        });

        console.error(`Notification sent via Telegram. Message ID: ${response.data.result.message_id}`);

        if (!response.data.ok) {
          return {
            content: [{
              type: "text",
              text: `Failed to send Telegram notification. Error: ${response.data.description}`
            }],
            isError: true
          };
        }

        // After sending notification, wait for response
        console.error(`Waiting for response to message ID: ${response.data.result.message_id}`);

        const timeoutSeconds = 30; // 30 second timeout
        const startTime = Date.now();
        const timeoutMs = timeoutSeconds * 1000;

        while (Date.now() - startTime < timeoutMs) {
          // Get updates from Telegram
          const updatesResponse = await axios.get(`${TELEGRAM_API_URL}/getUpdates`, {
            params: {
              offset: -1,
              limit: 10
            }
          });

          if (updatesResponse.data.ok) {
            // Look for messages with higher IDs
            const newMessages = updatesResponse.data.result
              .filter((update: any) => update.message && update.message.message_id > response.data.result.message_id)
              .sort((a: any, b: any) => a.message.message_id - b.message.message_id);

            if (newMessages.length > 0) {
              const latestMessage = newMessages[newMessages.length - 1];
              console.error(`Got response: ${latestMessage.message.text}`);

              return {
                content: [{
                  type: "text",
                  text: latestMessage.message.text
                }]
              };
            }
          }

          // Wait before checking again
          await sleep(2000);
        }

        // If we get here, we timed out waiting for a response
        return {
          content: [{
            type: "text",
            text: "User not available. Please stop and wait for the user to restart Cline."
          }]
        };
      } catch (error) {
        // Log detailed error information
        console.error("Error sending Telegram notification:", error);

        let errorMessage = "Unknown error occurred";

        if (axios.isAxiosError(error) && error.response) {
          // Extract Telegram API error details if available
          const telegramError = error.response.data;
          errorMessage = `Telegram API error: ${telegramError.description || error.message}`;
          console.error(`Telegram error details:`, telegramError);
        } else if (error instanceof Error) {
          errorMessage = error.message;
        } else {
          errorMessage = String(error);
        }

        return {
          content: [{
            type: "text",
            text: `Failed to send notification. ${errorMessage}`
          }],
          isError: true
        };
      }
    }

    case "check_notification_response": {
      const messageId = Number(request.params.arguments?.message_id);
      const timeoutSeconds = Number(request.params.arguments?.timeout_seconds || 30);  // Default to 30 seconds

      if (isNaN(messageId) || messageId <= 0) {
        throw new Error("Valid message_id is required");
      }

      console.error(`Checking for responses to message ID: ${messageId}`);

      // Poll for updates with a timeout
      const startTime = Date.now();
      const timeoutMs = timeoutSeconds * 1000;

      try {
        // First try to get all recent updates to debug
        const debugResponse = await axios.get(`${TELEGRAM_API_URL}/getUpdates`, {
          params: {
            limit: 100  // Get more updates for debugging
          }
        });

        if (debugResponse.data.ok) {
          console.error(`Debug: Found ${debugResponse.data.result.length} updates`);

          // Look for messages with higher IDs than our notification
          const recentMessages = debugResponse.data.result
            .filter((update: any) => update.message && update.message.message_id > messageId)
            .sort((a: any, b: any) => a.message.message_id - b.message.message_id);

          // Log messages for debugging
          for (const update of recentMessages) {
            console.error(`Debug: Message ID: ${update.message.message_id}, Text: ${update.message.text}`);
          }

          if (recentMessages.length > 0) {
            const latestMessage = recentMessages[recentMessages.length - 1];
            console.error(`Found message with higher ID than ${messageId}: ${latestMessage.message.text}`);

            return {
              content: [{
                type: "text",
                text: latestMessage.message.text
              }]
            };
          }
        }

        // If we couldn't find any responses in the initial check, poll for updates
        while (Date.now() - startTime < timeoutMs) {
          // Get updates from Telegram
          const response = await axios.get(`${TELEGRAM_API_URL}/getUpdates`, {
            params: {
              offset: -1,  // Get the most recent updates
              limit: 10    // Limit to 10 updates
            }
          });

          if (response.data.ok && response.data.result.length > 0) {
            // Look for messages with higher IDs
            const newMessages = response.data.result
              .filter((update: any) => update.message && update.message.message_id > messageId)
              .sort((a: any, b: any) => a.message.message_id - b.message.message_id);

            if (newMessages.length > 0) {
              const latestMessage = newMessages[newMessages.length - 1];
              console.error(`Found new message with higher ID than ${messageId}: ${latestMessage.message.text}`);

              return {
                content: [{
                  type: "text",
                  text: latestMessage.message.text
                }]
              };
            }
          }

          // Wait a bit before checking again
          await sleep(2000);
        }

        // If we get here, we timed out waiting for a response
        return {
          content: [{
            type: "text",
            text: "User not available. Please stop and wait for the user to restart Cline."
          }]
        };
      } catch (error) {
        console.error("Error checking for notification responses:", error);

        let errorMessage = "Unknown error occurred";

        if (axios.isAxiosError(error) && error.response) {
          const telegramError = error.response.data;
          errorMessage = `Telegram API error: ${telegramError.description || error.message}`;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        } else {
          errorMessage = String(error);
        }

        return {
          content: [{
            type: "text",
            text: `Failed to check for responses. ${errorMessage}`
          }],
          isError: true
        };
      }
    }

    default:
      throw new Error("Unknown tool");
  }
});

/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Telegram MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
