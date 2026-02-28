# Docker MCP Gateway Operations

## Core Commands

Use these commands from the repository root.

```bash
docker compose up -d
```
Start or refresh the gateway container after config changes.

```bash
docker compose ps
```
Confirm container state and port mapping.

```bash
docker compose logs -f mcp-gateway
```
Stream startup/runtime logs for troubleshooting.

```bash
docker compose down
```
Stop and remove gateway resources.

```bash
rg --line-number -- '--servers=' compose.yaml
```
Inspect the configured server list in `compose.yaml`.

## Common Diagnostics

1. Verify the server list in `compose.yaml` includes the intended server names.
2. Re-run `docker compose up -d` after changing `compose.yaml`.
3. Check `docker compose ps` for `mcp-gateway` healthy/running state.
4. Inspect `docker compose logs --tail=100 mcp-gateway` for startup errors.
5. Confirm the gateway is reachable at `http://localhost:8090`.
