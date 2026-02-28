---
name: gateway-server-context7
description: Use this skill for retrieving current library/framework documentation with Context7 tooling. Use when requests in this repository should be routed to the 'context7' MCP server through Docker MCP Gateway.
---

# Gateway Server Context7

## Overview

Use this skill for retrieving current library/framework documentation with Context7 tooling.

## Quick Decision Rules

- Use when: Task needs SDK/framework docs, APIs, or usage patterns.
- Do not use when: Task is UI automation, media conversion, or academic paper search.

## Workflow

1. Confirm 'context7' is present in `--servers=` in `compose.yaml`.
2. Use the corresponding MCP tools for the user task.
3. If tool calls fail unexpectedly, validate gateway state and restart if needed.

## Troubleshooting

- Check server list entry for 'context7' in `compose.yaml`.
- Reapply config with `docker compose up -d`.
- Inspect logs with `docker compose logs --tail=100 mcp-gateway`.

## References

- Shared gateway operations: `../../references/docker-mcp-gateway-operations.md`
