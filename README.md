# ProposalCraft — MCP Proposal Generator

Draft winning proposals in your voice, in 30 seconds.

Paste a client brief. ProposalCraft reads your past winning proposals, learns your voice and format, and drafts a new proposal ready to send.

**For freelancers, consultants, and agencies who write proposals to win work.**

---

## Why

The average freelancer spends 2–4 hours writing a proposal and wins ~25% of pitches. That means you're spending 6–12 hours of unbilled time for every deal you close. ProposalCraft turns that into a 30-second job.

---

## Install

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "proposalcraft": {
      "command": "npx",
      "args": ["-y", "github:bradshawprojects/proposalcraft"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add proposalcraft npx -- -y github:bradshawprojects/proposalcraft
```

No API key required — ProposalCraft uses your existing Claude session to draft proposals.

> **npm package coming soon** — once published on npm, the install simplifies to `npx proposalcraft`.

---

## Usage

### 1. Save your winning proposals (do this first)

The more examples you give it, the better it matches your voice.

Ask Claude:
> "Save this proposal to proposalcraft" — then paste your proposal text

Or: point `PROPOSALS_DIR` at a folder of `.md`/`.txt` files you already have.

### 2. Draft a proposal

Ask Claude:
> "Draft a proposal for this brief: [paste brief]"
> "Write a proposal — budget is $8k, deadline is 6 weeks: [paste brief]"
> "I got this email from a potential client, write me a proposal: [paste email]"

### 3. List your library

> "List my saved proposals in proposalcraft"

---

## Tools

| Tool | What it does |
|---|---|
| `draft_proposal` | Drafts a proposal from a brief + your saved examples |
| `save_proposal` | Adds a winning proposal to your reference library |
| `list_proposals` | Shows all saved proposals |
| `delete_proposal` | Removes a proposal from the library |

---

## Pricing

**$49/month** — [proposalcraft.ai](https://proposalcraft.ai) *(coming soon)*

Free 7-day trial. No credit card required.

---

## Privacy

Your proposals are stored locally on your machine (in `~/.proposalcraft/proposals/`). They are sent to Anthropic's API when drafting — same as any Claude conversation. Nothing is stored on our servers.

---

## Requirements

- Node.js 18+
- Anthropic API key ([get one here](https://console.anthropic.com))

---

## Custom proposals directory

Store proposals anywhere — useful if you use a shared Dropbox/Google Drive folder:

```json
{
  "env": {
    "ANTHROPIC_API_KEY": "sk-ant-...",
    "PROPOSALS_DIR": "/Users/you/Dropbox/Proposals/winning"
  }
}
```

---

## License

MIT
