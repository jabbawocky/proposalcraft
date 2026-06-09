# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅        |

## Reporting a Vulnerability

If you discover a security vulnerability in ProposalCraft, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Email: **mathew.carter@knowfirst.ai** with subject line `[ProposalCraft Security]`.

You can expect:
- Acknowledgement within 48 hours
- A status update within 7 days
- Credit in the release notes if you'd like

## Security Model

ProposalCraft is a **local-only MCP server**. It:

- Runs entirely on your machine via Claude Desktop
- Stores proposal drafts and templates in `~/.proposalcraft/` (your local filesystem only)
- Makes **no network requests** — no data is sent to external servers
- Requires no API keys or credentials
- Has no authentication surface (it is a local stdio process, not a web server)

The primary attack surface is the local filesystem. ProposalCraft reads and writes only within `~/.proposalcraft/`. It does not execute arbitrary code from proposal content.

## Dependencies

ProposalCraft has zero runtime dependencies beyond the Node.js standard library and the MCP SDK. Run `npm audit` to check for known vulnerabilities in the MCP SDK dependency.
