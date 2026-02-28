---
name: gateway-server-aws-diagram-mcp-server
description: Use this skill for generating or refining AWS architecture diagrams from requirements. Use when requests in this repository should be routed to the 'aws-diagram-mcp-server' MCP server through Docker MCP Gateway.
---

# Gateway Server AWS Diagram

## Overview

Use this skill for generating or refining AWS architecture diagrams from requirements.

## Quick Decision Rules

- Use when: Task requests AWS architecture diagramming or infrastructure visualization.
- Do not use when: Task is unrelated to AWS architecture depiction.

## Workflow

1. Confirm 'aws-diagram-mcp-server' is present in `--servers=` in `compose.yaml`.
2. Use the corresponding MCP tools for the user task.
3. If tool calls fail unexpectedly, validate gateway state and restart if needed.

## Troubleshooting

- Check server list entry for 'aws-diagram-mcp-server' in `compose.yaml`.
- Reapply config with `docker compose up -d`.
- Inspect logs with `docker compose logs --tail=100 mcp-gateway`.

## References

- Shared gateway operations: `../../references/docker-mcp-gateway-operations.md`
