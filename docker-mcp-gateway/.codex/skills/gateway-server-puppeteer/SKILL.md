---
name: gateway-server-puppeteer
description: Use this skill for CSS-selector based browser navigation, form filling, click flows, and page screenshots. Use when requests in this repository should be routed to the 'puppeteer' MCP server through Docker MCP Gateway.
---

# Gateway Server Puppeteer

## Overview

Use this skill for CSS-selector based browser navigation, form filling, click flows, and page screenshots.

## Quick Decision Rules

- Use when: Task asks for browser automation with selector-driven actions.
- Do not use when: Task is documentation lookup or non-browser data processing.

## Workflow

1. Confirm 'puppeteer' is present in `--servers=` in `compose.yaml`.
2. Use the corresponding MCP tools for the user task.
3. If tool calls fail unexpectedly, validate gateway state and restart if needed.

## Troubleshooting

- Check server list entry for 'puppeteer' in `compose.yaml`.
- Reapply config with `docker compose up -d`.
- Inspect logs with `docker compose logs --tail=100 mcp-gateway`.

## References

- Shared gateway operations: `../../references/docker-mcp-gateway-operations.md`
