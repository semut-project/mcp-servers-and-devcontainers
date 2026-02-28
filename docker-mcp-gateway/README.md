# Docker MCP Gateway

## What
MCP Gateway is a bridge that exposes multiple MCP servers through one endpoint.

Purpose:
- Give clients one stable URL instead of connecting to each server separately.
- Centralize server routing (for example: `puppeteer`, `context7`) behind a single gateway.
- Simplify local setup and operations (start/stop/restart in one place with Docker Compose).

This project runs MCP Gateway in Docker.

Current setup in `compose.yaml`:
- Image: `docker/mcp-gateway:latest`
- Transport: `streaming`
- Port: `8090`
- Enabled servers: `puppeteer,context7`

## How

### 1) Up the gateway
```bash
docker compose up -d
```

### 2) Check status
```bash
docker compose ps
```

### 3) See logs
```bash
docker compose logs -f mcp-gateway
```

### 4) Down the gateway
```bash
docker compose down
```

## Manage Servers (Gateway)
Server list is defined in `compose.yaml`:

```yaml
command:
  - --servers=puppeteer,context7
```

### View servers
```bash
rg --line-number -- '--servers=' compose.yaml
```

### Add a server
1. Edit `compose.yaml` and append server name in `--servers=...`
2. Restart:
```bash
docker compose up -d
```

Example:
```yaml
- --servers=puppeteer,context7,openaiDeveloperDocs
```

### Remove a server
1. Edit `compose.yaml` and remove server name from `--servers=...`
2. Restart:
```bash
docker compose up -d
```

## Setup Codex Using CLI

### 1) Install Codex CLI
Option A (npm):
```bash
npm install -g @openai/codex
```

Option B (Homebrew):
```bash
brew install codex
```

### 2) Login
```bash
codex
```
Then sign in with ChatGPT account or API key when prompted.

### 3) Manage MCP servers from Codex CLI
View servers:
```bash
codex mcp list
```

Add Docker MCP Gateway:
```bash
codex mcp add gateway --url http://localhost:8090
```

## References
- https://developers.openai.com/codex/quickstart/#setup
- https://developers.openai.com/codex/cli/reference/#codex-mcp
