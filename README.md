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

No API key required — ProposalCraft uses your existing Claude session.

---

## Quick start

### 1. Save a winning proposal (do this first)

The more examples you give it, the better it matches your voice.

> "Save this proposal to proposalcraft" — then paste your proposal text

Or point `PROPOSALS_DIR` at a folder of `.md`/`.txt` files you already have.

### 2. Analyze a brief before committing

> "Analyze this brief with proposalcraft: [paste brief]"

Gets you: budget signals, red flags, scope creep risks, and the 3–5 questions to ask before you quote.

### 3. Draft a proposal

> "Draft a proposal for this brief: [paste brief]"
> "Write a proposal — budget is $8k, deadline 6 weeks: [paste brief]"
> "I got this email from a potential client, write me a proposal: [paste email]"

---

## Tools

| Tool | What it does |
|---|---|
| `analyze_brief` | Pre-proposal intel: budget signals, red flags, scope risks, go/no-go |
| `draft_proposal` | Drafts a proposal from a brief + your saved examples |
| `save_proposal` | Adds a winning proposal to your reference library |
| `list_proposals` | Shows all saved proposals |
| `get_proposal` | Reads the full content of a saved proposal |
| `delete_proposal` | Removes a proposal from the library |

---

## Custom proposals directory

Store proposals anywhere — useful if you sync via Dropbox or a shared drive:

```json
{
  "mcpServers": {
    "proposalcraft": {
      "command": "npx",
      "args": ["-y", "github:bradshawprojects/proposalcraft"],
      "env": {
        "PROPOSALS_DIR": "/Users/you/Dropbox/Proposals/winning"
      }
    }
  }
}
```

---

## Privacy

Your proposals are stored locally (`~/.proposalcraft/proposals/`). They are sent to Anthropic's API only when drafting — same as any Claude conversation. Nothing is stored externally.

---

## Requirements

- Node.js 18+
- Claude Desktop or Claude Code

---

## License

MIT
