---
name: gateway-server-markitdown
description: Use this skill for converting documents and mixed-content files into markdown/text for downstream analysis. Use when requests in this repository should be routed to the 'markitdown' MCP server through Docker MCP Gateway.
---

# Gateway Server MarkItDown

## Overview

Use this skill for converting documents and mixed-content files into markdown/text for downstream analysis.

## Quick Decision Rules

- Use when: Task requires document conversion or extraction into markdown.
- Do not use when: Task is browser automation or code API lookup.

## Workflow

1. Confirm 'markitdown' is present in `--servers=` in `compose.yaml`.
2. Use the corresponding MCP tools for the user task.
3. If tool calls fail unexpectedly, validate gateway state and restart if needed.

## Troubleshooting

- Check server list entry for 'markitdown' in `compose.yaml`.
- Reapply config with `docker compose up -d`.
- Inspect logs with `docker compose logs --tail=100 mcp-gateway`.

## References

- Shared gateway operations: `../../references/docker-mcp-gateway-operations.md`
