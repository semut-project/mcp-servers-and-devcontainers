---
name: gateway-server-javadocs
description: Use this skill for Java/JVM API symbol lookup, javadoc navigation, and artifact-based reference checks. Use when requests in this repository should be routed to the 'javadocs' MCP server through Docker MCP Gateway.
---

# Gateway Server JavaDocs

## Overview

Use this skill for Java/JVM API symbol lookup, javadoc navigation, and artifact-based reference checks.

## Quick Decision Rules

- Use when: Task requires Java class/method/package documentation.
- Do not use when: Task is not Java ecosystem documentation.

## Workflow

1. Confirm 'javadocs' is present in `--servers=` in `compose.yaml`.
2. Use the corresponding MCP tools for the user task.
3. If tool calls fail unexpectedly, validate gateway state and restart if needed.

## Troubleshooting

- Check server list entry for 'javadocs' in `compose.yaml`.
- Reapply config with `docker compose up -d`.
- Inspect logs with `docker compose logs --tail=100 mcp-gateway`.

## References

- Shared gateway operations: `../../references/docker-mcp-gateway-operations.md`
