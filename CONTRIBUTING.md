# Contributing to ProposalCraft

Thanks for your interest in contributing. ProposalCraft is an MCP server — contributions to the tool itself, the documentation, and the example proposal library are all welcome.

## What we need most

- **Bug reports** — if `draft_proposal` or `analyze_brief` behaves unexpectedly, open an issue with your input and the actual output
- **New tool ideas** — what would make the proposal workflow significantly better? Open a discussion
- **Example proposals** — anonymised winning proposals in `examples/` help new users understand what the library style learns from
- **Language/locale PRs** — the README and landing page are English-only; translations welcome

## Getting started

```bash
git clone https://github.com/jabbawocky/proposalcraft
cd proposalcraft
npm install
npm run build
```

To test locally, add the local path to your Claude Desktop config:

```json
{
  "mcpServers": {
    "proposalcraft": {
      "command": "node",
      "args": ["/path/to/proposalcraft/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop, then test with `draft_proposal` or `analyze_brief`.

## Making a change

1. Fork the repo and create a branch: `git checkout -b fix/your-fix`
2. Make your change
3. Run `npm run build` — the `dist/` directory must be committed
4. Open a PR with a clear description of what changed and why

## Code style

- TypeScript strict mode
- No Anthropic SDK in the dependency tree — all inference goes through the MCP protocol
- Local file storage only (`~/.proposalcraft/`) — no network calls from tools

## Reporting security issues

Email mathew.carter@knowfirst.ai directly. Don't open a public issue for security vulnerabilities.
