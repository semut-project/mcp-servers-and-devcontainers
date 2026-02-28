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

### 1) Clone this repo
```bash
git clone https://github.com/semut-project/mcp-servers-and-devcontainers
cd mcp-servers-and-devcontainers/docker-mcp-gateway
```

### 2) Activate MCP Gateway
```bash
docker compose up -d
```

Check status:
```bash
docker compose ps
```

Check startup logs:
```bash
docker compose logs --tail=100 mcp-gateway
```

### 3) Setup Codex client
Install Codex CLI (choose one):

Option A (npm):
```bash
npm install -g @openai/codex
```

Option B (Homebrew):
```bash
brew install codex
```

Login:
```bash
codex
```
Then sign in with ChatGPT account or API key when prompted.

Connect Codex client to MCP Gateway:
```bash
codex mcp list
codex mcp add gateway --url http://localhost:8090
```

Create global links for all local gateway skills.

WSL/Linux:
```bash
mkdir -p ~/.codex/skills
for d in .codex/skills/*; do
  [ -d "$d" ] || continue
  ln -sfn "$(pwd)/$d" ~/.codex/skills/"$(basename "$d")"
done
```

Windows (PowerShell):
```powershell
$repoSkills = Join-Path (Get-Location) ".codex\skills"
$globalSkills = Join-Path $HOME ".codex\skills"
New-Item -ItemType Directory -Force -Path $globalSkills | Out-Null
Get-ChildItem $repoSkills -Directory | ForEach-Object {
  $target = $_.FullName
  $link = Join-Path $globalSkills $_.Name
  if (Test-Path $link) { Remove-Item $link -Force }
  New-Item -ItemType SymbolicLink -Path $link -Target $target | Out-Null
}
```

### 4) Verification

List all MCP Tools available in MCP Gateway.

```bash
codex "list all mcp tools awailable in MCP Gateway"
```


This prompt will use either puppeteer or Playwright.

```bash
codex "Open https://hub.docker.com/ and find first 5 mcp server and give me description each server."
```

This prompt will use Paper Search

```bash
codex "find 3 research paper about Tiny Recursive Model and give me summarize of each paper"

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

## Setup Codex Using CLI (Optional Details)

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

### 3) Connect to MCP Gateway
Use the commands in `How -> 3) Setup Codex client`.

## References
- https://developers.openai.com/codex/quickstart/#setup
- https://developers.openai.com/codex/cli/reference/#codex-mcp
