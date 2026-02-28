---
name: gateway-server-playwright
description: Use this skill for robust browser automation, interactive snapshots, and multi-step UI-flow debugging. Use when requests in this repository should be routed to the 'playwright' MCP server through Docker MCP Gateway.
---

# Gateway Server Playwright

## Overview

Use this skill for robust browser automation, interactive snapshots, and multi-step UI-flow debugging.

## Quick Decision Rules

- Use when: Task needs rich browser interactions, accessibility snapshots, or network/debug visibility.
- Do not use when: Task is purely docs retrieval or non-browser processing.

## Workflow

1. Confirm 'playwright' is present in `--servers=` in `compose.yaml`.
2. Use the corresponding MCP tools for the user task.
3. If tool calls fail unexpectedly, validate gateway state and restart if needed.

## Troubleshooting

- Check server list entry for 'playwright' in `compose.yaml`.
- Reapply config with `docker compose up -d`.
- Inspect logs with `docker compose logs --tail=100 mcp-gateway`.

## References

- Shared gateway operations: `../../references/docker-mcp-gateway-operations.md`
