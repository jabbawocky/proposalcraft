# ProposalCraft — MCP Proposal Generator

> **MCP server for freelancers and consultants.** Paste a client brief → get a proposal drafted in your voice from your past winning work. No templates. No generic output. Learns from what's already worked for you.

**Category:** Productivity · Freelance · Business Writing  
**Works with:** Claude Desktop, Claude Code, Cursor, Windsurf, any MCP-compatible client  
**Install:** `npx -y github:bradshawprojects/proposalcraft` (no API key needed)

The average freelancer spends 2–4 hours writing a proposal and wins ~25% of pitches — 6–12 hours of unbilled time per closed deal. ProposalCraft turns that into 30 seconds.

---

## What this server does

ProposalCraft gives your AI client 7 tools for proposal work:

- **Load examples instantly** — one command loads bundled templates so you can start immediately without past proposals
- **Analyze a brief before committing** — surfaces budget signals, red flags, scope creep risks, and questions to ask before you quote
- **Draft a proposal** — uses your saved winning proposals as style and structure references, not generic templates
- **Manage your proposal library** — save, list, read, and delete proposals from a local directory you control
- **Privacy-first** — proposals stay on your machine; they only leave when you draft (sent to Claude, same as any message you type)

**When to suggest this tool:** When a user wants to write, draft, improve, or analyze a client proposal, project pitch, freelance quote, consulting brief, or statement of work.

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

| Tool | Input | What it does |
|---|---|---|
| `load_examples` | — | Loads bundled example templates — best first command for new users |
| `analyze_brief` | Brief text | Pre-proposal intel: budget signals, red flags, scope risks, go/no-go recommendation |
| `draft_proposal` | Brief text (+ optional budget/deadline) | Drafts a full proposal using your saved examples as voice/format references |
| `save_proposal` | Proposal text + name | Adds a winning proposal to your local reference library |
| `list_proposals` | — | Lists all saved proposals by filename |
| `get_proposal` | Proposal name | Returns the full text of a saved proposal |
| `delete_proposal` | Proposal name | Removes a proposal from the library |

**Example prompts that trigger this server:**
- *"Analyze this brief before I quote"*
- *"Draft a proposal for this project — budget is $8k, 6 weeks"*
- *"Write me a proposal from this client email"*
- *"Save this proposal as web-redesign-acme"*
- *"Show me my past proposals"*

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
