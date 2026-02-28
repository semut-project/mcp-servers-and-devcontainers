---
name: gateway-server-hugging-face
description: Use this skill for Hugging Face documentation, repository discovery, space lookup, and model/dataset research tasks. Use when requests in this repository should be routed to the 'hugging-face' MCP server through Docker MCP Gateway.
---

# Gateway Server Hugging Face

## Overview

Use this skill for Hugging Face documentation, repository discovery, space lookup, and model/dataset research tasks.

## Quick Decision Rules

- Use when: Task is about Hugging Face models, datasets, spaces, or docs.
- Do not use when: Task is unrelated to the Hugging Face ecosystem.

## Workflow

1. Confirm 'hugging-face' is present in `--servers=` in `compose.yaml`.
2. Use the corresponding MCP tools for the user task.
3. If tool calls fail unexpectedly, validate gateway state and restart if needed.

## Troubleshooting

- Check server list entry for 'hugging-face' in `compose.yaml`.
- Reapply config with `docker compose up -d`.
- Inspect logs with `docker compose logs --tail=100 mcp-gateway`.

## References

- Shared gateway operations: `../../references/docker-mcp-gateway-operations.md`
