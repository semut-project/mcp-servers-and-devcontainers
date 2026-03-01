## Unified Specification: MCP Gateway–Hosted Discovery and Skill Packages (Docker Compose)

### 1. Purpose

Provide a simple, consistent way for an AI client to retrieve **MCP tools** and their **correlated skills** over **HTTP** from an **MCP Gateway** running in **Docker Compose**.

This must work for:

* **Discovery-capable MCP Servers** (they provide their own tool metadata), and
* **Non-discovery MCP Servers** (the Gateway provides discovery on their behalf).

---

### 2. Scope

This specification defines:

* HTTP endpoints exposed by the **MCP Gateway**
* How the Gateway builds a **capability manifest**
* How **skills** are packaged and served
* How to handle servers that **do not** provide discovery

---

### 3. Definitions

**Tool**: An MCP callable function with name, schema, and an invocation endpoint.
**Skill**: Guidance for correct tool usage (workflow, constraints, examples).
**Capability Manifest**: A versioned, cacheable JSON document listing tools and correlated skills.
**Discovery-Capable Server**: MCP server that provides tool metadata (manifest or introspection).
**Non-Discovery Server**: MCP server that does not provide tool metadata.

---

### 4. Architecture (Docker Compose)

* The **AI Client** communicates only with the **MCP Gateway** over HTTP.
* The **MCP Gateway** connects to multiple MCP servers inside the Docker Compose network.

```
AI Client  →  MCP Gateway (HTTP)  →  MCP Servers (Compose services)
```

---

### 5. Gateway Responsibilities

The MCP Gateway MUST:

1. Expose a **single discovery endpoint** for the AI client
2. Provide **tool invocation endpoints**
3. Provide **skill retrieval endpoints**
4. Aggregate capabilities across MCP servers
5. Support **two discovery modes** per server:

   * **Server-Provided Discovery**
   * **Gateway-Provided Discovery** (for non-discovery servers)

---

### 6. Discovery Modes

#### 6.1 Server-Provided Discovery Mode

If an MCP server provides discovery, the Gateway MUST:

* fetch (or proxy) that server’s tool metadata, and
* normalize it into the Gateway’s unified manifest format.

#### 6.2 Gateway-Provided Discovery Mode (Non-Discovery Servers)

If an MCP server does not provide discovery, the Gateway MUST:

* define that server’s tools in a **Gateway configuration file** (or registry), and
* publish those tools in the unified manifest as if they were discovered.

This configuration MUST include at least:

* tool name
* description
* input schema (JSON Schema)
* invocation mapping (where/how the Gateway calls the server)

---

### 7. HTTP Interface (Gateway)

#### 7.1 Unified Discovery Endpoint (Single Entry Point)

The Gateway MUST expose:

`GET /.well-known/mcp/capabilities`

Returns a JSON manifest containing all servers, tools, and skills known to the Gateway.

#### 7.2 Tool Invocation Endpoint

The Gateway MUST expose:

`POST /mcp/{server_id}/tools/{tool_name}`

The Gateway proxies or translates the call to the underlying MCP server.

#### 7.3 Skill Retrieval Endpoint

The Gateway MUST expose:

`GET /mcp/{server_id}/skills/{skill_id}`

Skills may be stored by the Gateway or proxied from the server.

---

### 8. Capability Manifest Format (Gateway Output)

The Gateway MUST return a manifest in this structure:

```json
{
  "gateway_version": "1.0.0",
  "generated_at": "2026-03-01T00:00:00Z",
  "servers": [
    {
      "server_id": "payments-mcp",
      "version": "1.2.0",
      "discovery_mode": "server|gateway",
      "tools": [
        {
          "name": "create_invoice",
          "description": "Create a customer invoice",
          "input_schema": {},
          "endpoint": "/mcp/payments-mcp/tools/create_invoice"
        }
      ],
      "skills": [
        {
          "id": "invoice_workflow",
          "description": "Invoice creation workflow and constraints",
          "tool_refs": ["create_invoice"],
          "content_type": "text/markdown",
          "href": "/mcp/payments-mcp/skills/invoice_workflow",
          "hash": "sha256:..."
        }
      ]
    }
  ]
}
```

Requirements:

* `discovery_mode` MUST be `"server"` or `"gateway"`
* Each skill MUST declare `tool_refs`
* Each skill MUST include `href` and a stable `hash` for caching

---

### 9. Skill & Tool Packaging Rules

#### 9.1 Logical Packaging

Each MCP server is treated as one **Capability Package** consisting of:

* tool list
* correlated skills
* metadata (`server_id`, `version`, etc.)

#### 9.2 Physical Packaging Options

Skills MAY be stored:

* inside the MCP server container, or
* inside the Gateway container, or
* in a shared Docker volume mounted into the Gateway

Regardless of storage location, skills MUST be retrievable through the Gateway’s HTTP endpoints.

---

### 10. Gateway Configuration for Non-Discovery Servers

For any non-discovery MCP server, the Gateway MUST have a configuration entry like:

* `server_id`
* connection info (service name/port in Compose)
* tool definitions (name, schema, description)
* optional skills mapping

Example (conceptual, format not mandated):

* `servers/payments-mcp/tools/*.json`
* `servers/payments-mcp/skills/*.md`

The configuration is the source of truth for discovery in `"gateway"` mode.

---

### 11. Versioning and Caching

* Each server entry MUST include a `version`
* Each skill MUST include a `hash`
* AI clients SHOULD cache:

  * the manifest by `gateway_version` + server `version`
  * skill files by `hash` (or HTTP ETag if provided)

When a server version changes, clients MUST refresh related tools/skills.

---

### 12. Minimal AI Client Flow

1. `GET /.well-known/mcp/capabilities`
2. Pick tool(s) for a task
3. Fetch correlated skill(s) via `href`
4. Call tool via `POST /mcp/{server_id}/tools/{tool_name}`
5. Cache using `version/hash`

---

### 13. Summary Requirements

The system MUST provide:

* One Gateway discovery endpoint
* Gateway-hosted skills retrieval
* Tool invocation through Gateway
* Support for MCP servers **with or without discovery**, using `discovery_mode`
* Docker Compose–friendly deployment

---

# Example
Below is a **simple, working pattern** for Docker Compose where:

* **MCP Gateway** is the only HTTP entrypoint for the AI client
* Gateway serves discovery at **`GET /.well-known/mcp/capabilities`**
* Gateway proxies tool calls to a single **Puppeteer MCP Server**
* **Discovery is provided by the Gateway** (useful when the MCP Server itself doesn’t expose discovery)

This example uses **Nginx as the Gateway** (static discovery + reverse proxy). The Puppeteer MCP server shown is a Docker-deployable Puppeteer MCP implementation that exposes HTTP ports (example docs show container ports 3000/50051). ([William Zujkowski][1])

---

## Folder layout

```txt
mcp-stack/
  docker-compose.yml
  gateway/
    nginx.conf
    capabilities.json
```

---

## docker-compose.yml

```yaml
services:
  mcp-gateway:
    image: nginx:alpine
    container_name: mcp-gateway
    ports:
      - "8080:80"
    volumes:
      - ./gateway/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./gateway/capabilities.json:/usr/share/nginx/html/.well-known/mcp/capabilities:ro
    depends_on:
      - puppeteer-mcp

  puppeteer-mcp:
    # Example: a Docker-deployable Puppeteer MCP server implementation
    # (If you use a different image, adjust ports and proxy target accordingly.)
    image: williamzujkowski/puppeteer-mcp:latest
    container_name: puppeteer-mcp
    expose:
      - "3000"
    environment:
      # optional; depends on the server implementation
      - PUPPETEER_MCP_AUTH_TOKEN=dev-token
```

Notes:

* The gateway is published on **[http://localhost:8080](http://localhost:8080)**
* The puppeteer server is only reachable inside the Compose network
* The puppeteer MCP server image/ports vary by implementation; this example follows the “Docker deployment” style that exposes HTTP on 3000. ([William Zujkowski][1])

---

## gateway/nginx.conf

```nginx
events {}

http {
  server {
    listen 80;

    # 1) Discovery served by the Gateway
    location = /.well-known/mcp/capabilities {
      default_type application/json;
      alias /usr/share/nginx/html/.well-known/mcp/capabilities;
    }

    # 2) Proxy tool calls through the Gateway to the Puppeteer MCP server
    # Adjust the upstream path if your puppeteer server uses a different route scheme.
    location /mcp/puppeteer/ {
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header Connection "";

      # If your MCP server requires auth, forward it:
      proxy_set_header Authorization $http_authorization;

      # Upstream service name = "puppeteer-mcp" from docker-compose
      proxy_pass http://puppeteer-mcp:3000/;
    }
  }
}
```

---

## gateway/capabilities.json (Gateway-provided discovery)

This manifest is what your AI client fetches from:

**`GET http://localhost:8080/.well-known/mcp/capabilities`**

```json
{
  "gateway_version": "1.0.0",
  "generated_at": "2026-03-01T00:00:00Z",
  "servers": [
    {
      "server_id": "puppeteer",
      "version": "1.0.0",
      "discovery_mode": "gateway",
      "tools": [
        {
          "name": "puppeteer_navigate",
          "description": "Navigate to a URL in the browser",
          "input_schema": {
            "type": "object",
            "properties": {
              "url": { "type": "string" }
            },
            "required": ["url"]
          },
          "endpoint": "/mcp/puppeteer/tools/puppeteer_navigate"
        },
        {
          "name": "puppeteer_screenshot",
          "description": "Take a screenshot of the current page",
          "input_schema": {
            "type": "object",
            "properties": {
              "selector": { "type": "string" }
            }
          },
          "endpoint": "/mcp/puppeteer/tools/puppeteer_screenshot"
        }
      ],
      "skills": [
        {
          "id": "basic_browser_workflow",
          "description": "Recommended workflow: navigate → wait/verify → screenshot/evaluate",
          "tool_refs": ["puppeteer_navigate", "puppeteer_screenshot"],
          "content_type": "text/markdown",
          "href": "/mcp/puppeteer/skills/basic_browser_workflow",
          "hash": "sha256:replace-with-real-hash"
        }
      ]
    }
  ]
}
```

Tool names like `puppeteer_navigate` / `puppeteer_screenshot` match common Puppeteer MCP tool naming used by the “mcp/puppeteer” server listing. ([Docker Hub][2])

---

## Quick test

```bash
docker compose up -d

# Discovery (from gateway)
curl http://localhost:8080/.well-known/mcp/capabilities

# Tool call (example shape; actual tool route/body depends on your puppeteer MCP server API)
curl -X POST http://localhost:8080/mcp/puppeteer/tools/puppeteer_navigate \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

---

## Why this solves your requirement

* Gateway provides discovery even if the MCP Server doesn’t (the manifest is mounted/configured in Compose).
* AI client only talks to the Gateway over HTTP:

  * `/.well-known/mcp/capabilities` for discovery
  * `/mcp/puppeteer/...` for tool calls

---
