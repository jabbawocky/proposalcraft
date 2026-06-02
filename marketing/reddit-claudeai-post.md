# r/ClaudeAI — ProposalCraft launch post

**Subreddit:** r/ClaudeAI (80k members)
**Category:** Free-to-fire NOW — no payment path needed
**Best time:** Tuesday or Wednesday 9–11am AEST
**Note:** This community knows MCP. Lead with the MCP angle hard. No need to explain what Claude Desktop is.

---

**Title:** I built a free MCP server for freelancers — paste a brief, get a proposal in your voice

**Body:**

Been using Claude Desktop for a while and finally built something worth sharing.

**ProposalCraft** is an MCP server that drafts client proposals from your past winning work.

The flow:
1. `save_proposal` — paste in 1–3 proposals that won you work
2. Paste a new client brief into Claude
3. Ask it to draft — it uses your saved examples as the style guide

The output sounds like you because it's learning from you, not generic templates.

**8 tools:** `draft_proposal`, `analyze_brief`, `load_examples`, `get_proposal`, `save_proposal`, `list_proposals`, `delete_proposal`, `usage_status`

`analyze_brief` is probably the most useful day-to-day — it extracts budget signals, red flags, scope creep risks, and the 3–5 questions you should ask before you write anything.

**Free tier:** 5 draft_proposal calls/month. Pro ($19/mo) is unlimited. Everything else — analyze_brief, save_proposal, etc. — is unrestricted.

**Nothing leaves your machine.** No cloud DB, no API key, no Anthropic SDK in the dependency tree. Your proposals are stored as local files. It passes context to your existing Claude session to do the drafting.

Install is one JSON block:

```json
{
  "mcpServers": {
    "proposalcraft": {
      "command": "npx",
      "args": ["-y", "github:jabbawocky/proposalcraft"]
    }
  }
}
```

GitHub: https://github.com/jabbawocky/proposalcraft
Landing: https://jabbawocky.github.io/proposalcraft/

Happy to answer questions on the architecture — the "no SDK" design decision in particular was an interesting tradeoff.

---

**Prepared responses for common threads:**

**"Why not just prompt Claude directly?"**
> You can — and that's basically what this does under the hood. The value is the tooling layer: `analyze_brief` runs structured extraction on every new brief before you draft, `save_proposal` builds a persistent library of your style, and `usage_status` tracks your monthly quota. You could replicate it with careful prompting every time, but ProposalCraft makes it repeatable and consistent without maintaining a 500-word system prompt in your head.

**"Why MCP over a web app?"**
> Zero ops. No auth, no backend, no cloud costs, no subscriptions except Claude. The trade-off is you need Claude Desktop — cuts the TAM but means everyone who installs it is already a power user. I'd rather have 200 installs from people who'll actually use it than 2,000 from people who clicked "try it" on a landing page.

**"What does the Pro tier actually get you?"**
> Unlimited `draft_proposal` calls. The free tier gates that tool at 5/month — enough to evaluate it, but heavy users hit it fast. Everything else (`analyze_brief`, `save_proposal`, `load_examples`) has no limit either way.

**"Any plans for team/agency features?"**
> Yes — shared proposal library, multi-user roles, brand voice profiles. On the roadmap after the solo version proves out. If that's your use case, comment or open a GitHub issue — it helps prioritise.
