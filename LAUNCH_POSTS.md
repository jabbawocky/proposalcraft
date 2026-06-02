# Launch Posts — ready to fire on deploy

## Reddit — r/freelance

**Title:** I built an MCP server that writes proposals for you (free, open source)

**Body:**
Freelancers — I got tired of writing proposals from scratch and built this.

**ProposalCraft** is an MCP server for Claude Desktop. You paste a client brief, it drafts a ready-to-send proposal in *your* voice. It learns from your own winning proposals so it doesn't sound generic.

Install is one block of JSON in your Claude config. No API keys, no accounts, no cloud storage — proposals live locally on your machine.

`npx proposalcraft` via MCP.

Happy to answer questions on how it works. Feedback welcome.

---

## Reddit — r/webdev / r/SideProject

**Title:** Show HN / Show r/webdev: ProposalCraft — MCP server that drafts client proposals in your voice

**Body:**
Built this weekend project: **ProposalCraft**, an MCP server that plugs into Claude Desktop and turns client briefs into ready-to-send proposals.

The hook: it learns from *your* past proposals, so the output sounds like you wrote it, not ChatGPT.

- No API keys
- No cloud database — all local
- MIT licensed
- One-line install (JSON config block)

Would love feedback on what else would make this useful. What do you waste the most time on in client comms?

---

## Indie Hackers

**Title:** Shipped: ProposalCraft — free MCP server that writes proposals in your voice

**Body:**
Quick build (3 days) — thought I'd share since it's a bit different from the usual SaaS.

**What:** MCP server for Claude. Saves your best proposals, then generates new ones matched to client briefs. Sounds like you because it's trained on your work.

**Why MCP:** Zero friction. No OAuth, no onboarding, no dashboard to maintain. One JSON config block and it's running. MCP is underrated for zero-op tools.

**Business model:** Free beta now. Paid plan at $49/mo for a team version (shared proposal library, multi-user). Freelance market is massive and they already pay for Bonsai, Honeybook, etc — this just plugs into Claude.

**What I'd build next:** Browser extension version that auto-detects job posts and pre-fills proposals on Upwork/Toptal. Curious if anyone's done something similar.

---

## Hacker News — Show HN

**Title:** Show HN: ProposalCraft – MCP server that drafts client proposals in your voice

**Body:**
I built ProposalCraft, an MCP server for Claude Desktop that generates client proposals based on your past winning work.

How it works:
1. Save your best proposals via the `save_proposal` MCP tool
2. Paste a client brief into Claude
3. Ask it to draft a proposal — it uses your examples as style/structure guides

Everything runs locally. No database, no API keys beyond your Claude subscription, MIT licensed.

Install: add one JSON block to ~/.config/claude/claude_desktop_config.json pointing to `npx proposalcraft`.

Motivation: proposal writing is one of those high-value but deeply annoying tasks that's perfect for AI-assist. Existing tools (Bonsai, Honeybook) are full CRMs with proposal as an afterthought. This is the opposite — just the proposal, nothing else.

Would appreciate feedback on whether the MCP distribution model makes sense, or if a standalone CLI / web UI would get more adoption.
