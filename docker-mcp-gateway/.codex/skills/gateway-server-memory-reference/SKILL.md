---
name: gateway-server-memory-reference
description: Use this skill for memory-backed retrieval of previously captured references and working context. Use when requests in this repository should be routed to the 'memory-reference' MCP server through Docker MCP Gateway.
---

# Gateway Server Memory Reference

## Overview

Use this skill for memory-backed retrieval of previously captured references and working context.

## Quick Decision Rules

- Use when: Task needs persisted context recall or reference retrieval.
- Do not use when: Task is fresh one-off processing without memory needs.

## Workflow

1. Confirm 'memory-reference' is present in `--servers=` in `compose.yaml`.
2. Use the corresponding MCP tools for the user task.
3. If tool calls fail unexpectedly, validate gateway state and restart if needed.

## Troubleshooting

- Check server list entry for 'memory-reference' in `compose.yaml`.
- Reapply config with `docker compose up -d`.
- Inspect logs with `docker compose logs --tail=100 mcp-gateway`.

## References

- Shared gateway operations: `../../references/docker-mcp-gateway-operations.md`
