#!/usr/bin/env node

/**
 * Example of how to use the Telegram MCP server programmatically
 * 
 * This script demonstrates how to:
 * 1. Start the MCP server
 * 2. Connect to it using the MCP client
 * 3. Send a notification
 * 4. Check for a response
 */

import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { PipeClientTransport } from '@modelcontextprotocol/sdk/client/pipe.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to the MCP server executable
const serverPath = path.resolve(__dirname, '../build/index.js');

async function main() {
  console.log('Starting Telegram MCP server...');
  
  // Start the MCP server as a child process
  const serverProcess = spawn('node', [serverPath], {
    env: {
      ...process.env,
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Log server output for debugging
  serverProcess.stdout.on('data', (data) => {
    console.log(`Server stdout: ${data}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`Server stderr: ${data}`);
  });
  
  // Create an MCP client
  const client = new Client();
  
  try {
    // Connect to the server using pipe transport
    const transport = new PipeClientTransport({
      stdin: serverProcess.stdin,
      stdout: serverProcess.stdout
    });
    
    await client.connect(transport);
    console.log('Connected to MCP server');
    
    // List available tools
    const tools = await client.listTools();
    console.log('Available tools:', tools.map(t => t.name));
    
    // Send a notification
    console.log('Sending notification...');
    const result = await client.callTool('send_notification', {
      message: 'This is a test notification from the example script',
      project: 'Example Project',
      urgency: 'medium'
    });
    
    console.log('Notification result:', result);
    
    // Wait for user to respond
    console.log('Waiting for user response...');
    
    // Clean up
    await client.disconnect();
    serverProcess.kill();
    console.log('Disconnected from server');
  } catch (error) {
    console.error('Error:', error);
    serverProcess.kill();
  }
}

// Check for required environment variables
if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
  console.error('Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables are required');
  process.exit(1);
}

main().catch(console.error);
