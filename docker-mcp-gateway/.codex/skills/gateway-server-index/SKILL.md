---
name: gateway-server-index
description: Use when the user needs to choose, route, or troubleshoot Docker MCP Gateway servers in this repository, including deciding which gateway-server-* skill to apply for a specific task.
---

# Gateway Server Index

## Overview

Route requests to the correct Docker MCP Gateway server skill for this repository.

## Server Selection Matrix

- Browser automation and page interaction: `gateway-server-puppeteer` or `gateway-server-playwright`.
- Library/framework docs lookup: `gateway-server-context7`.
- AWS architecture diagrams: `gateway-server-aws-diagram-mcp-server`.
- Persistent note/context retrieval: `gateway-server-memory-reference`.
- Java API/javadoc lookup: `gateway-server-javadocs`.
- Document/text conversion: `gateway-server-markitdown`.
- Media processing workflows: `gateway-server-ffmpeg`.
- Hugging Face docs/repos/spaces tasks: `gateway-server-hugging-face`.
- Microsoft Learn docs and code samples: `gateway-server-microsoft-learn`.
- Academic paper discovery workflows: `gateway-server-paper-search`.

## Workflow

1. Identify the user task category.
2. Select one primary server skill from the matrix.
3. If task spans multiple domains, chain server skills in sequence.
4. For server availability or startup issues, apply shared gateway operations.

## Troubleshooting

- If a server tool is unavailable, verify it is included in `--servers=` in `compose.yaml`.
- If routing fails globally, restart the gateway and check logs.
- If behavior is unclear, validate the active server list before deeper debugging.

## References

- Shared gateway operations: `../../references/docker-mcp-gateway-operations.md`
