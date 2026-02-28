---
name: gateway-server-paper-search
description: Use this skill for scholarly paper search across supported providers and research discovery workflows. Use when requests in this repository should be routed to the 'paper-search' MCP server through Docker MCP Gateway.
---

# Gateway Server Paper Search

## Overview

Use this skill for scholarly paper search across supported providers and research discovery workflows.

## Quick Decision Rules

- Use when: Task asks for academic paper discovery or paper metadata collection.
- Do not use when: Task is operational and does not involve scholarly literature.

## Workflow

1. Confirm 'paper-search' is present in `--servers=` in `compose.yaml`.
2. Use the corresponding MCP tools for the user task.
3. If tool calls fail unexpectedly, validate gateway state and restart if needed.

## Troubleshooting

- Check server list entry for 'paper-search' in `compose.yaml`.
- Reapply config with `docker compose up -d`.
- Inspect logs with `docker compose logs --tail=100 mcp-gateway`.

## References

- Shared gateway operations: `../../references/docker-mcp-gateway-operations.md`
