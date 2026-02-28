---
name: gateway-server-microsoft-learn
description: Use this skill for Microsoft Learn documentation and official code sample retrieval. Use when requests in this repository should be routed to the 'microsoft-learn' MCP server through Docker MCP Gateway.
---

# Gateway Server Microsoft Learn

## Overview

Use this skill for Microsoft Learn documentation and official code sample retrieval.

## Quick Decision Rules

- Use when: Task needs Azure/Microsoft product docs or Microsoft code samples.
- Do not use when: Task is not in Microsoft ecosystem scope.

## Workflow

1. Confirm 'microsoft-learn' is present in `--servers=` in `compose.yaml`.
2. Use the corresponding MCP tools for the user task.
3. If tool calls fail unexpectedly, validate gateway state and restart if needed.

## Troubleshooting

- Check server list entry for 'microsoft-learn' in `compose.yaml`.
- Reapply config with `docker compose up -d`.
- Inspect logs with `docker compose logs --tail=100 mcp-gateway`.

## References

- Shared gateway operations: `../../references/docker-mcp-gateway-operations.md`
