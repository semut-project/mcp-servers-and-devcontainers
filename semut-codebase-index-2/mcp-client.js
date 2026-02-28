#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * MCP Client for connecting to codebase-mcp.js server
 * Provides functionality to list and test tools
 *
 * Usage:
 *   - Programmatic: const serverPath = path.resolve(__dirname, 'codebase-mcp.js'); const client = new MCPClient(serverPath); await client.connect();
 *   - CLI: node mcp-client.js [command] [args]
 *
 * Commands:
 *   - list-tools: List available tools
 *   - index [directory]: Index a directory (e.g., node mcp-client.js index ./src)
 *   - search [query] [topK]: Search codebase (e.g., node mcp-client.js search "function handler" 10)
 */

class MCPClient {
  constructor(serverPath) {
    this.serverPath = serverPath;
    console.error('CONSTRUCTOR: serverPath parameter is:', serverPath);
    console.error('CONSTRUCTOR: this.serverPath set to:', this.serverPath);
    this.client = null;
    this.transport = null;
    this.serverProcess = null;
  }

  /**
   * Connect to the MCP server using stdio transport
   * This spawns the server process and establishes connection
   */
  async connect() {
    console.log(`[CLIENT] Connecting to MCP server at ${this.serverPath}...`);

    try {
      console.log('[DEBUG] serverPath is:', this.serverPath);
      console.log('[DEBUG] Spawning with:', 'node', [this.serverPath]);
      console.error('SPAWN: about to spawn with serverPath:', this.serverPath);
      // Spawn the server process
      this.serverProcess = spawn('node', [this.serverPath], {
        stdio: ['pipe', 'pipe', 'inherit'],
        cwd: __dirname
      });

      this.serverProcess.stdout.on('data', (data) => console.log('[SERVER STDOUT]', data.toString()));
      this.serverProcess.stderr.on('data', (data) => console.error('[SERVER STDERR]', data.toString()));

      // Create the stdio transport
      this.transport = new StdioClientTransport(
        this.serverProcess.stdin,
        this.serverProcess.stdout,
        this.serverProcess.stderr
      );

      // Initialize the client
      this.client = new Client(
        {
          name: "codebase-mcp-client",
          version: "1.0.0",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      // Connect the client to the transport
      await this.client.connect(this.transport);
      console.log('[CLIENT] Successfully connected to MCP server');

      // Handle server process events for logging
      this.serverProcess.on('close', (code) => {
        console.log(`[CLIENT] Server process closed with code ${code}`);
        console.log('[DEBUG] Server process close event, code:', code);
      });

      this.serverProcess.on('error', (error) => {
        console.error('[CLIENT] Server process error:', error);
        console.log('[DEBUG] Server process error event, error:', error);
        this.disconnect();
      });

    } catch (error) {
      console.error('[CLIENT] Connection failed:', error.message);
      this.disconnect();
      throw error;
    }
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    console.log('[CLIENT] Disconnecting...');
    if (this.client && typeof this.client.close === 'function') {
      try {
        this.client.close();
      } catch (error) {
        console.error('[CLIENT] Error during disconnect:', error.message);
      }
    }
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
    this.client = null;
    this.transport = null;
    this.serverProcess = null;
    console.log('[CLIENT] Disconnected');
  }

  /**
   * List all available tools from the.server
   */
  async listTools() {
    if (!this.client) {
      throw new Error('Not connected to server. Call connect() first.');
    }

    console.log('[CLIENT] Requesting tools list...');
    try {
      const response = await this.client.request(
        { method: "tools/list", params: {} },
        null
      );
      console.log('[CLIENT] Tools list received:');
      console.log(JSON.stringify(response, null, 2));
      return response.tools;
    } catch (error) {
      console.error('[CLIENT] Failed to list tools:', error.message);
      throw error;
    }
  }

  /**
   * Call the indexCodebase tool
   * @param {string} directory - Directory path to index
   */
  async indexCodebase(directory) {
    if (!this.client) {
      throw new Error('Not connected to server. Call connect() first.');
    }

    console.log(`[CLIENT] IndexCodebase: indexing directory "${directory}"...`);
    try {
      const response = await this.client.request(
        {
          method: "tools/call",
          params: {
            name: "indexCodebase",
            arguments: { dir: directory }
          }
        },
        null
      );
      console.log('[CLIENT] IndexCodebase result:');
      console.log(JSON.stringify(response, null, 2));
      return response.content[0].text || response;
    } catch (error) {
      console.error('[CLIENT] IndexCodebase failed:', error.message);
      throw error;
    }
  }

  /**
   * Call the searchCodebase tool
   * @param {string} query - Search query string
   * @param {number} topK - Number of results to return (default: 5)
   */
  async searchCodebase(query, topK = 5) {
    if (!this.client) {
      throw new Error('Not connected to server. Call connect() first.');
    }

    console.log(`[CLIENT] SearchCodebase: searching for "${query}" with topK=${topK}...`);
    try {
      const response = await this.client.request(
        {
          method: "tools/call",
          params: {
            name: "searchCodebase",
            arguments: { query, topK }
          }
        },
        null
      );
      console.log('[CLIENT] SearchCodebase result:');
      console.log(JSON.stringify(response, null, 2));
      return response.content[0].text || response;
    } catch (error) {
      console.error('[CLIENT] SearchCodebase failed:', error.message);
      throw error;
    }
  }

  /**
   * Generic method to call any tool
   * @param {string} toolName - Name of the tool to call
   * @param {object} args - Arguments for the tool
   */
  async callTool(toolName, args) {
    if (!this.client) {
      throw new Error('Not connected to server. Call connect() first.');
    }

    console.log(`[CLIENT] Calling tool "${toolName}" with args:`, args);
    try {
      const response = await this.client.request(
        {
          method: "tools/call",
          params: {
            name: toolName,
            arguments: args
          }
        },
        null
      );
      console.log(`[CLIENT] Tool "${toolName}" result:`, response);
      return response;
    } catch (error) {
      console.error(`[CLIENT] Tool "${toolName}" failed:`, error.message);
      throw error;
    }
  }
}

// CLI interface
if (process.argv[1] === __filename) {
  // Running as CLI script
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`
MCP Client CLI Usage:
  node mcp-client.js <command> [args...]

Commands:
  list-tools                         - List available tools from the server
  index <directory>                  - Index a directory (e.g., node mcp-client.js index ./src)
  search <query> [topK]              - Search codebase (e.g., node mcp-client.js search "function handler" 10)
  help                               - Show this help message

Examples:
  node mcp-client.js list-tools
  node mcp-client.js index ./src
  node mcp-client.js search "async function"
  node mcp-client.js search "class definition" 5

Make sure the MCP server (codebase-mcp.js) is available and the required dependencies are running (Qdrant, Ollama).
    `);
    process.exit(0);
  }

  const command = args[0].toLowerCase();
  const serverPath = path.resolve(__dirname, 'codebase-mcp.js');
  const client = new MCPClient(serverPath);

  async function runCLI() {
    try {
      await client.connect();

      switch (command) {
        case 'list-tools':
        case 'list':
          await client.listTools();
          break;

        case 'index':
          if (!args[1]) {
            console.error('Error: Directory path required for index command');
            process.exit(1);
          }
          await client.indexCodebase(args[1]);
          break;

        case 'search':
          if (!args[1]) {
            console.error('Error: Query required for search command');
            process.exit(1);
          }
          const topK = args[2] ? parseInt(args[2]) : 5;
          await client.searchCodebase(args[1], topK);
          break;

        case 'help':
          // Help is handled above
          break;

        default:
          console.error(`Unknown command: ${command}`);
          console.log('Use "node mcp-client.js help" to see available commands');
          process.exit(1);
      }
    } catch (error) {
      console.error('CLI Error:', error.message);
      process.exit(1);
    } finally {
      client.disconnect();
      setTimeout(() => process.exit(0), 100); // Allow time for cleanup
    }
  }

  runCLI().catch((error) => {
    console.error('Unhandled CLI error:', error);
    process.exit(1);
  });
}

export default MCPClient;