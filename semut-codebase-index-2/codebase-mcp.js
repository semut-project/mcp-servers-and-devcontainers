#!/usr/bin/env node
console.error('SERVER STARTED');
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { QdrantClient } from "@qdrant/js-client-rest";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from "@modelcontextprotocol/sdk/types.js";

console.error("[DEBUG] Imports loaded successfully");
// Debug: Log module loading
// console.log("[DEBUG] Loaded all imports successfully");

// Setup MCP server with modern SDK
const server = new Server(
  {
    name: "semut-indexing-mcp",
    version: "1.0.1",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// console.log("[DEBUG] MCP Server initialized with modern SDK");

// Register tools with modern MCP schemas
// console.log("[DEBUG] Registering tools/list handler");

// Register tools list
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error("[DEBUG] tools/list handler called");
  return {
    tools: [
      {
        name: "indexCodebase",
        description: "Index all files in a directory",
        inputSchema: {
          type: "object",
          properties: {
            dir: { type: "string", description: "Directory to index" }
          },
          required: ["dir"]
        }
      },
      {
        name: "searchCodebase",
        description: "Semantic search over codebase",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            topK: { type: "number", description: "Number of results to return", default: 5 }
          },
          required: ["query"]
        }
      }
    ]
  };
});
// console.log("[DEBUG] tools/list handler registered successfully");

// Register tools/call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error("[DEBUG] tools/call handler invoked, name:", request.params.name);
  const { name, arguments: args } = request.params;

  switch (name) {
      case "indexCodebase": {
        console.error("[DEBUG] indexCodebase called with dir:", args?.dir);
        const { dir } = args || {};
        if (!dir) {
        throw new McpError(ErrorCode.InvalidParams, "dir parameter required");
      }

      try {
        const fileCount = await indexDirectory(dir);
        const result = { status: "indexed", fileCount, dir };
        console.error("[DEBUG] indexCodebase result:", result);
        return result;
      } catch (error) {
        console.error("[ERROR] indexCodebase failed:", error);
        throw new McpError(ErrorCode.InternalError, `Failed to index directory: ${error.message}`);
      }
    }

    case "searchCodebase": {
      console.error("[DEBUG] searchCodebase called with query:", args?.query);
      const { query, topK = 5 } = args || {};
      if (!query) {
        throw new McpError(ErrorCode.InvalidParams, "query parameter required");
      }

      try {
        const results = await searchDirectory(query, topK);
        console.error("[DEBUG] searchCodebase found", results.length, "results");
        return results;
      } catch (error) {
        console.error("[ERROR] searchCodebase failed:", error);
        throw new McpError(ErrorCode.InternalError, `Failed to search codebase: ${error.message}`);
      }
    }

    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }
});
// console.log("[DEBUG] tools/call handler registered successfully");

// Simple in-memory storage for demo
const indexedFiles = new Map();

async function indexDirectory(dir) {
  console.error("[DEBUG] Starting to index directory:", dir);
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let count = 0;

  // Create collection if it doesn't exist
  try {
    await qdrant.createCollection(COLLECTION, {
      vectors: { size: 768, distance: "Cosine" }
    });
    console.error("[DEBUG] Created Qdrant collection:", COLLECTION);
  } catch (error) {
    if (!error.message.includes("already exists")) {
      console.error("[ERROR] Failed to create collection:", error);
      throw error;
    }
  }

  for (const file of files) {
    if (file.isDirectory()) continue;

    try {
      const content = fs.readFileSync(path.join(dir, file.name), "utf8");
      const chunks = chunkText(content);
      console.error(`[DEBUG] Processing ${file.name} with ${chunks.length} chunks`);

      for (const chunk of chunks) {
        if (!chunk.trim()) continue;

        console.error("[DEBUG] Getting embedding for chunk of length:", chunk.length);
        const embedding = await getEmbedding(chunk);

        if (embedding && embedding.length > 0) {
          console.error("[DEBUG] Upserting chunk to Qdrant, embedding length:", embedding.length);
          await qdrant.upsert(COLLECTION, {
            wait: true,
            points: [
              {
                id: Date.now() + Math.random(),
                vector: embedding,
                payload: {
                  file: path.join(dir, file.name),
                  text: chunk,
                  timestamp: new Date().toISOString()
                }
              }
            ]
          });
        }
      }

      count++;
    } catch (error) {
      console.error(`[ERROR] Failed to process file ${file.name}:`, error);
    }
  }

  console.error(`[DEBUG] Successfully indexed ${count} files`);
  return count;
}

async function searchDirectory(query, topK) {
  console.error("[DEBUG] Searching Qdrant for query:", query, "with topK:", topK);

  try {
    console.error("[DEBUG] Getting embedding for search query");
    const embedding = await getEmbedding(query);
    console.error("[DEBUG] Query embedding length:", embedding?.length);

    if (!embedding || embedding.length === 0) {
      throw new Error("Failed to generate embedding for query");
    }

    console.error("[DEBUG] Performing vector search in Qdrant");
    const searchResults = await qdrant.search(COLLECTION, {
      vector: embedding,
      limit: topK,
      with_payload: true,
      with_vector: false
    });

    console.error("[DEBUG] Found", searchResults.length, "results from Qdrant");

    const results = searchResults.map(result => ({
      file: result.payload?.file || "",
      text: result.payload?.text || "",
      score: result.score
    }));

    return results;
  } catch (error) {
    console.error("[ERROR] Qdrant search failed:", error);
    // Fallback to simple text search if Qdrant is not working
    console.error("[INFO] Falling back to simple in-memory search");
    const results = [];
    for (const [filePath, content] of indexedFiles.entries()) {
      if (content.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          file: filePath,
          text: content.substring(0, 200) + "...",
          score: 1.0 // Default score for simple match
        });
        if (results.length >= topK) break;
      }
    }
    return results;
  }
}

// Qdrant config
// console.log("[DEBUG] Initializing Qdrant client");
const qdrant = new QdrantClient({
  url: "http://localhost:6333",
  checkCompatibility: false
});
// console.log("[DEBUG] Qdrant client initialized successfully");

const COLLECTION = "codebase_index";
// console.log("[DEBUG] Using collection:", COLLECTION);

// Ollama embedding
async function getEmbedding(text) {
  console.error("[DEBUG] Getting embedding for text length:", text?.length);
  try {
    const res = await fetch("http://localhost:11434/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "nomic-embed-text", input: text })
    });

    if (!res.ok) {
      console.error("[ERROR] Ollama fetch failed with status:", res.status);
      throw new Error(`Ollama API error: ${res.status}`);
    }

    const data = await res.json();
    console.error("[DEBUG] Received embedding of length:", data.embedding?.length);
    return data.embedding;
  } catch (error) {
    console.error("[ERROR] getEmbedding failed:", error.message);
    throw error;
  }
}

// Chunk helper
function chunkText(text, size = 512) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size).join(" "));
  }
  return chunks;
}

// Server startup with modern MCP transport
async function main() {
console.error("[DEBUG] main() function entered");
  // console.log("[DEBUG] Starting MCP server...");

  try {
    const transport = new StdioServerTransport();
    // console.log("[DEBUG] Created StdioServerTransport");

    await server.connect(transport);
    // console.log("[DEBUG] Server connected to transport");

    // Keep the process alive to listen for requests
    process.on('SIGINT', () => {
      console.error("[INFO] Received SIGINT, shutting down gracefully...");
      process.exit(0);
    });

    // // console.log("Codebase MCP is running (stdio mode)");
  } catch (error) {
    console.error("[ERROR] Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error("[ERROR] Unhandled error:", error);
  process.exit(1);
});

// // console.log("Codebase MCP is running (stdio mode)");
