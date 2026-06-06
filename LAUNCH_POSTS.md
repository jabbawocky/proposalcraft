# Launch Posts — ready to fire

**Live URLs:**
- Landing page: https://jabbawocky.github.io/proposalcraft/
- GitHub repo: https://github.com/jabbawocky/proposalcraft

---

## Reddit — r/freelance

**⚠️ Fire AFTER MCPize or Gumroad is live — this post references the $19/mo Pro tier**

**Title:** I built an MCP server that drafts proposals in your voice — free tier, $19/mo Pro

**Body:**
Freelancers — I got tired of spending 2+ hours on proposals that might not win, and built something about it.

**ProposalCraft** is an MCP server for Claude Desktop. You paste a client brief, it drafts a ready-to-send proposal in *your* voice — learned from the proposals that already won you work.

**What it actually does:**
- `analyze_brief` — before you even draft, it extracts budget signals, red flags, scope creep risks, and the 3–5 questions you should ask the client first
- `draft_proposal` — generates a full proposal matched to your tone, structure, and pricing format
- `save_proposal` / `load_examples` — build a proposal library from your past wins, or load 12 starter templates

Nothing leaves your machine. No cloud DB, no API key, no accounts.

Install is one JSON block in your Claude config:

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

**Pricing:** Free tier is 5 draft_proposal calls/month — enough to test on a real brief. Pro is $19/mo for unlimited drafts + all 8 tools.

Landing page: https://jabbawocky.github.io/proposalcraft/
Repo: https://github.com/jabbawocky/proposalcraft

Happy to answer questions on how it works or what's on the roadmap.

---

**Prepared responses:**

**"Why Claude Desktop? I don't use that."**
> Fair — it does require Claude Desktop (or any MCP-compatible client). The trade-off for the MCP design: zero ops, no backend, your proposals stay local. If you're on a different AI setup, this won't work for you yet. CLI version is on the roadmap.

**"$19/mo just for proposals?"**
> Free tier covers 5 drafts/month — that's probably 1-2 client opportunities. If you win even one extra deal because you sent a better proposal faster, it's paid for itself many times over. At $150/hr, one hour saved = $150. The tool costs $19.

**"Why not just prompt Claude directly?"**
> You can — but you'd need to paste your past proposals into every conversation manually, remember to run the brief analysis step, and maintain your own system prompts. ProposalCraft makes the workflow persistent and repeatable. Your proposal library stays saved between sessions.

---

## Reddit — r/SideProject

**Title:** Show r/SideProject: ProposalCraft — MCP server that drafts client proposals in your voice

**Body:**
Built this: **ProposalCraft**, an MCP server that plugs into Claude Desktop and turns client briefs into ready-to-send proposals.

The hook: it learns from *your* past proposals, so the output sounds like you wrote it.

- All local — no cloud DB, no accounts
- MIT licensed
- One JSON config block to install

Landing page: https://jabbawocky.github.io/proposalcraft/
GitHub: https://github.com/jabbawocky/proposalcraft

Would love feedback on what else would make this useful.

---

## Indie Hackers

**Title:** Shipped: ProposalCraft — free MCP server that writes proposals in your voice

**Body:**
Quick build (3 days) — sharing because it's a bit different from the usual SaaS.

**What:** MCP server for Claude Desktop. Saves your best proposals, then generates new ones matched to client briefs. Sounds like you because it's trained on your work.

**Why MCP:** Zero friction. No OAuth, no onboarding, no dashboard to maintain. One JSON config block and it's running. MCP is underrated for zero-op tools.

**Business model:** Free tier is 5 draft_proposal calls/month. Pro is $19/mo for unlimited drafts + all 8 tools. Freelance market is massive — they already pay for Bonsai, HoneyBook, etc. This just plugs into Claude.

**What I'd build next:** Standup/progress reports MCP — same pattern, daily habit instead of monthly.

Landing page: https://jabbawocky.github.io/proposalcraft/
GitHub: https://github.com/jabbawocky/proposalcraft

---

## Hacker News — Show HN

**Title:** Show HN: ProposalCraft – MCP server that drafts client proposals in your voice

**Body:**
I built ProposalCraft, an MCP server for Claude Desktop that generates client proposals based on your past winning work.

How it works:
1. Save your best proposals via the `save_proposal` MCP tool
2. Paste a client brief into Claude
3. Ask it to draft a proposal — it uses your examples as style/structure guides

Everything runs locally. MIT licensed. No API key — it uses your existing Claude Desktop session.

Install: one JSON block in `claude_desktop_config.json` pointing to `npx -y github:jabbawocky/proposalcraft`.

Repo: https://github.com/jabbawocky/proposalcraft
Landing page: https://jabbawocky.github.io/proposalcraft/

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

GitHub: https://github.com/jabbawocky/proposalcraft
Landing: https://jabbawocky.github.io/proposalcraft/

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
      "args": ["-y", "github:jabbawocky/proposalcraft"]
    }
  }
}

**Post 5:**
Free, MIT licensed.

Landing page + docs: https://jabbawocky.github.io/proposalcraft/
GitHub: https://github.com/jabbawocky/proposalcraft

If you're a freelancer using Claude Desktop — try it and tell me what's missing.

---

## Reddit — r/ClaudeAI

**Target:** r/ClaudeAI (80k+ members — Claude Desktop users, power users, early adopters)
**Timing:** Day of PH launch (June 10) or day before
**Angle:** MCP server for freelancers — zero setup, works inside Claude Desktop

**Title:**
Built an MCP server that drafts client proposals in your voice — free, no API key

**Body:**

If you freelance or consult, you've probably used Claude to help write proposals. This takes it further.

**ProposalCraft** is an MCP server that connects directly to Claude Desktop. Once installed, Claude gets 8 new tools — the main one drafts a proposal in *your voice*, from *your past winning work*.

**How it works:**
1. Save 2-3 of your best past proposals to a local library (`save_proposal`)
2. Paste a new client brief and ask Claude to draft it
3. Claude reads your examples and drafts in your style — not generic templates

There's also `analyze_brief` which pulls out budget signals, red flags, and scope risks *before* you draft. Useful for deciding whether to even pitch.

**Why MCP instead of a web app:**
- Your proposals never leave your machine — local storage only
- No API key needed (uses your existing Claude session)
- No extra subscription — if you have Claude Desktop, you have this

**Install is one JSON block:**

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

5 free drafts/month on the free tier. MIT licensed.

GitHub: https://github.com/jabbawocky/proposalcraft
Landing page: https://jabbawocky.github.io/proposalcraft/

Happy to answer questions about the MCP architecture if that's interesting — removing the Anthropic SDK and letting Claude handle the drafting was a non-obvious call.
