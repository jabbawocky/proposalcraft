# Launch Posts — ready to fire

**Live URLs:**
- Landing page: https://bradshawprojects.github.io/proposalcraft/
- GitHub repo: https://github.com/bradshawprojects/proposalcraft

---

## Reddit — r/freelance

**Title:** I built an MCP server that writes proposals in your voice (free, open source)

**Body:**
Freelancers — I got tired of writing proposals from scratch and built this.

**ProposalCraft** is an MCP server for Claude Desktop. You paste a client brief, it drafts a ready-to-send proposal in *your* voice — learned from the proposals that already won you work.

Install is one JSON block in your Claude config:

```json
{
  "mcpServers": {
    "proposalcraft": {
      "command": "npx",
      "args": ["-y", "github:bradshawprojects/proposalcraft"],
      "env": { "ANTHROPIC_API_KEY": "sk-ant-YOUR_KEY" }
    }
  }
}
```

No cloud storage — proposals live locally on your machine. MIT licensed.

Repo: https://github.com/bradshawprojects/proposalcraft

Happy to answer questions on how it works.

---

## Reddit — r/SideProject

**Title:** Show r/SideProject: ProposalCraft — MCP server that drafts client proposals in your voice

**Body:**
Built this: **ProposalCraft**, an MCP server that plugs into Claude Desktop and turns client briefs into ready-to-send proposals.

The hook: it learns from *your* past proposals, so the output sounds like you wrote it.

- All local — no cloud DB, no accounts
- MIT licensed
- One JSON config block to install

Landing page: https://bradshawprojects.github.io/proposalcraft/
GitHub: https://github.com/bradshawprojects/proposalcraft

Would love feedback on what else would make this useful.

---

## Indie Hackers

**Title:** Shipped: ProposalCraft — free MCP server that writes proposals in your voice

**Body:**
Quick build (3 days) — sharing because it's a bit different from the usual SaaS.

**What:** MCP server for Claude Desktop. Saves your best proposals, then generates new ones matched to client briefs. Sounds like you because it's trained on your work.

**Why MCP:** Zero friction. No OAuth, no onboarding, no dashboard to maintain. One JSON config block and it's running. MCP is underrated for zero-op tools.

**Business model:** Free open-source now. Paid plan at $49/mo for a team version (shared proposal library, multi-user). Freelance market is massive — they already pay for Bonsai, Honeybook, etc. This just plugs into Claude.

**What I'd build next:** Browser extension that auto-detects job posts and pre-fills proposals on Upwork/Toptal.

Landing page: https://bradshawprojects.github.io/proposalcraft/
GitHub: https://github.com/bradshawprojects/proposalcraft

---

## Hacker News — Show HN

**Title:** Show HN: ProposalCraft – MCP server that drafts client proposals in your voice

**Body:**
I built ProposalCraft, an MCP server for Claude Desktop that generates client proposals based on your past winning work.

How it works:
1. Save your best proposals via the `save_proposal` MCP tool
2. Paste a client brief into Claude
3. Ask it to draft a proposal — it uses your examples as style/structure guides

Everything runs locally. MIT licensed. Needs an Anthropic API key (free to get at console.anthropic.com).

Install: one JSON block in `claude_desktop_config.json` pointing to `npx -y github:bradshawprojects/proposalcraft`.

Repo: https://github.com/bradshawprojects/proposalcraft
Landing page: https://bradshawprojects.github.io/proposalcraft/

Motivation: proposal writing is one of those high-value but annoying tasks perfect for AI-assist. Existing tools (Bonsai, Honeybook) are full CRMs with proposal as an afterthought. This is the opposite — just the proposal, nothing else.

Would appreciate feedback on whether the MCP distribution model makes sense, or if a standalone CLI / web UI would get more traction.

---

## Product Hunt

**Name:** ProposalCraft
**Tagline:** Draft winning proposals in your voice — free MCP server for Claude Desktop
**Topics:** Developer Tools, Productivity, Freelancing

**Description:**
ProposalCraft is an open-source MCP server that turns client briefs into ready-to-send proposals in 30 seconds.

Save your 2-3 best past proposals → paste a new brief → Claude drafts a new one in your voice. No API key, no subscription, no cloud storage. Everything runs locally.

**Why it's different from Proposal Genie / PouncerAI / BidPilot:**
- Free, MIT licensed (not $8-15/mo)
- Works for any client, not just Upwork
- Learns from YOUR proposals (not generic templates)
- Local-only — your proposals never leave your machine

**Maker's first comment:**
Hi PH! Built this because the proposal math is brutal — most freelancers win ~25% of pitches, so you're writing 3-4 proposals for every deal you close. ProposalCraft turns 2 hours → 30 seconds.

The MCP distribution model is a deliberate bet: zero infrastructure, zero ops, plugs directly into Claude Desktop. Trade-off is you need Claude Desktop, which cuts the TAM vs a web app. But it also means zero backend costs and a much tighter ICP: freelancers who already use AI daily.

One thing I shipped this week: I removed the Anthropic SDK dependency entirely. The original version made its own API calls (needed your API key). The new version passes context to Claude and lets your existing session handle the drafting — so you only pay for one subscription (Claude), not two (Claude + API).

Would love honest feedback: is the MCP distribution the right call, or should I build a web version next?

GitHub: https://github.com/bradshawprojects/proposalcraft
Landing: https://bradshawprojects.github.io/proposalcraft/

---

## X/Twitter thread

**Post 1:**
I built a free tool that writes client proposals in your own voice.

No subscription. No cloud. Learns from your own winning proposals.

Here's the 30-second install 🧵

**Post 2:**
The problem: freelancers spend 2-4h per proposal and win ~25% of pitches.

That's 6-12h unpaid per deal closed.

Existing tools charge $8-15/mo, store your data on their servers, and most only work on Upwork.

**Post 3:**
ProposalCraft is an MCP server for Claude Desktop.

Save 2-3 of your past winning proposals. Paste a new brief. Ask Claude to draft it.

It uses YOUR proposals as the style guide — so the output sounds like you, not generic AI.

**Post 4:**
Everything runs locally. Your proposals stay on your machine.

No API key. No account. No subscription.

Install = one JSON block in your Claude config:

{
  "mcpServers": {
    "proposalcraft": {
      "command": "npx",
      "args": ["-y", "github:bradshawprojects/proposalcraft"]
    }
  }
}

**Post 5:**
Free, MIT licensed.

Landing page + docs: https://bradshawprojects.github.io/proposalcraft/
GitHub: https://github.com/bradshawprojects/proposalcraft

If you're a freelancer using Claude Desktop — try it and tell me what's missing.
