# Repository Guidelines

## Project Structure & Module Organization
This repository is intentionally small and operationally focused:
- `compose.yaml`: single source of truth for the MCP Gateway container configuration (image, transport, port, enabled servers, Docker socket mount).
- `README.md`: operator-facing usage guide (startup, logs, server list management, Codex CLI integration).
- `AGENTS.md`: contributor guide for consistent changes.

When adding files, keep top-level clutter low. Prefer `docs/` for additional documentation and only introduce code directories if executable logic is actually added.

## Build, Test, and Development Commands
Primary workflow is Docker Compose:
- `docker compose up -d`: start/update the gateway in the background.
- `docker compose ps`: verify container health and port mapping.
- `docker compose logs -f mcp-gateway`: stream runtime logs for troubleshooting.
- `docker compose down`: stop and remove resources.
- `rg --line-number -- '--servers=' compose.yaml`: quickly inspect enabled MCP servers.

If you change `compose.yaml`, always run `docker compose up -d` again to apply updates.

## Coding Style & Naming Conventions
- Use 2-space indentation for YAML.
- Keep Compose keys grouped logically: `image`, `command`, `environment`, `volumes`, `ports`.
- Use lowercase, hyphenated names for service identifiers and docs filenames.
- Keep docs concise, command-first, and copy/paste-ready.

## Testing Guidelines
There is no formal test suite yet. Validate changes with lightweight operational checks:
1. `docker compose up -d`
2. `docker compose ps` (service should be running)
3. `docker compose logs --tail=100 mcp-gateway` (no startup errors)

For server-list changes, confirm the updated `--servers=...` value is present and that the gateway restarts cleanly.

## Commit & Pull Request Guidelines
Current history is minimal (`initial commit`), so follow a simple, consistent format:
- Commit subject in imperative mood, short and specific (example: `Add playwright server to compose config`).
- One logical change per commit.

PRs should include:
1. What changed and why.
2. Exact validation commands run.
3. Relevant log snippets or command output when behavior changes.

## Security & Configuration Tips
`/var/run/docker.sock` is a privileged mount. Do not broaden mounts or expose additional ports without a clear need and explicit justification in the PR.
