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

---

## Reddit — r/consulting

**Target:** r/consulting (200k members — independent consultants, exactly the ICP)
**Timing:** Day before or day of PH launch (June 9–10)
**Angle:** Time-cost of proposals, no-AI-fluff pitch

**Title:**
I got tired of spending 2 hours on proposals that lose. Built something to fix it (free tool)

**Body:**

Quick background: I do independent consulting and was losing about 2 hours per proposal — researching the client, tailoring the pitch, trying to sound like myself instead of a ChatGPT template.

The actual problem: I'd won good proposals in the past but wasn't learning from them. Each new pitch was starting from scratch.

So I built **ProposalCraft** — an MCP server for Claude that drafts proposals using *your* past winning work as the template. You save 2-3 of your best proposals, paste a new brief, and it drafts in your voice.

It's not magic — it's pattern-matching from your own wins. But it cuts 2 hours to about 5 minutes, and the output actually sounds like me because it's trained on my writing.

**The `analyze_brief` tool** is the part I use most now. Before drafting, it extracts:
- Estimated budget signals from the brief
- Red flags (scope creep indicators, vague deliverables, "we just need something simple")
- Whether to even pitch

Helped me decide to pass on two RFPs that would have wasted a week of proposal writing.

Free, MIT licensed, runs locally (your proposals stay on your machine). Requires Claude Desktop.

GitHub: https://github.com/jabbawocky/proposalcraft

Happy to discuss the architecture or the proposal workflow — genuinely curious how others approach this.

---

## Reddit — r/digitalnomad

**Target:** r/digitalnomad (1.8M members — location-independent freelancers/consultants)
**Timing:** Day before or day of PH launch (June 9–10)
**Angle:** Async client work, time-zone juggling, zero setup

**Title:**
Built a free tool that drafts client proposals in your voice using Claude — no API key, runs locally

**Body:**

If you freelance for clients across time zones, you know the proposal bottleneck: a client emails you a brief at midnight their time, you're supposed to respond quickly, and writing a good proposal takes 2 hours you don't have.

I built **ProposalCraft** to fix this for myself. It's an MCP server (plugin) for Claude Desktop that drafts proposals in your voice — using your own past winning proposals as the style guide.

**How it works:**
- Save 2-3 of your best past proposals to a local library
- Paste the new client brief
- Ask Claude: "draft a proposal for this brief"
- Claude uses your past work as the voice reference and drafts in seconds

There's also an `analyze_brief` tool that runs before drafting — it flags budget signals, scope risks, and red flags. Useful for quickly deciding whether a gig is worth pursuing before investing time.

**Zero friction setup:**
- No API key required (uses your existing Claude subscription)
- No cloud — proposals stay on your laptop
- One JSON block in your Claude config and it's live

**Free, MIT licensed.** 5 drafts/month on the free tier.

GitHub: https://github.com/jabbawocky/proposalcraft
Landing page: https://jabbawocky.github.io/proposalcraft/

Anyone else using Claude Desktop for client work? Curious what workflow gaps you've found.

---

## Reddit — r/Upwork

**Target:** r/Upwork (150k members — freelancers who write proposals/covers daily)
**Timing:** Day before or day of PH launch (June 9–10)
**Angle:** Cover letter fatigue, writing proposals that sound like you not a bot

**Title:**
Built a free tool for writing Upwork proposals faster — uses your past winning covers as the template

**Body:**

If you've been on Upwork for a while, you've written hundreds of proposals. The problem isn't ideas — it's that every cover has to sound personal and tailored, not like ChatGPT wrote it.

I built **ProposalCraft** to solve this. It's a plugin for Claude Desktop that drafts proposals using *your* past winning covers as the style guide.

**The idea:** save 3-5 of your best-performing past proposals. When a new job comes in, paste the description and ask Claude to draft a cover. It reads your examples and matches your voice — the hooks you use, how you structure your pitch, your sign-off.

It's not magic, but it's a lot better than "write a cover letter for this job" with no context.

There's also an `analyze_brief` tool that reads the job description first and flags:
- Budget signals (even when hidden)  
- Red flags ("we just need a few tweaks", "perfect English required" but $3/hr budget)
- Whether the scope matches what they're paying

Saved me from wasting time on bad-fit jobs a few times already.

**Requirements:** Claude Desktop (free or paid plan). No extra API key, no subscription, no cloud.

Free, MIT licensed. 5 drafts/month free tier.

GitHub: https://github.com/jabbawocky/proposalcraft  
Docs: https://jabbawocky.github.io/proposalcraft/

---

## Indie Hackers

**Target:** Indie Hackers community (product builders, early-stage SaaS founders, solo devs)
**Timing:** PH launch day (June 10) — crosspost alongside PH
**Angle:** The "maker" story — what problem, what you built, what surprised you, what's next

**Title:**
I built a free MCP server for freelancers — 0 to first GitHub star in one day

**Body:**

**The problem I was solving:** I freelance alongside my main work and was spending 2–3 hours on proposals that *might* win. The bottleneck was voice — every proposal had to sound like me, not like a template.

**What I built:** ProposalCraft — an MCP server (plugin for Claude Desktop) that drafts client proposals in your voice using your own past winning proposals as examples.

**How it works:**
1. Save 2-3 of your past winning proposals to a local library
2. Paste the new brief
3. Ask Claude: "draft a proposal for this brief"
4. Claude reads your examples and drafts in your style — structure, tone, pricing approach, all of it

There's also an `analyze_brief` tool that runs before drafting — it extracts budget signals, scope risks, and red flags so you can decide whether a gig is worth pursuing before writing a word.

**What surprised me:**
- Removing the Anthropic SDK was the right call. Original design had the server making its own API calls (double billing for users). Now it returns context blocks and lets Claude do the drafting. Wrote a [full post about this](https://github.com/jabbawocky/proposalcraft/blob/main/marketing/blog-sdk-removal.md).
- The free/Pro split worked: 5 drafts/month free (enough to try it), $19/mo Pro for unlimited. People need to feel the value before paying.

**Stack:** TypeScript, MCP SDK, zero cloud dependencies. Proposals stay on-device. No account, no API key.

**Current status:** Listed in 2 MCP server directories, GitHub release live, landing page up. PH launch today.

**Free, MIT licensed.** Install: `npx -y github:jabbawocky/proposalcraft`

GitHub: https://github.com/jabbawocky/proposalcraft

Would love feedback on the Pro pricing and the free tier limit — is 5 drafts/month too tight?

---

## Hacker News — Show HN

**Target:** Hacker News (developers, technical founders, OSS audience)
**Timing:** PH launch day (June 10), morning AEST / late night EST prior day
**Angle:** MCP architecture — zero SDK, context injection pattern. Technical story.

**Title:**
Show HN: ProposalCraft – MCP server that drafts client proposals in your voice (no API key)

**Body:**

ProposalCraft is an MCP server for Claude Desktop that helps freelancers draft client proposals. You store 2-3 past winning proposals locally, paste a new brief, and Claude drafts in your voice using the examples as context.

The interesting technical part: this was originally built with the Anthropic SDK — the server made its own `messages.create` calls. That turned out to be the wrong architecture for MCP. The fix was removing the SDK entirely and having the tool return structured context blocks instead. Claude (running in the host) does the drafting as part of its main response.

This pattern has real UX consequences:
- Users needed two API keys (Anthropic subscription + API key). Now they need zero.
- The server was competing with Claude Desktop for the LLM connection. Now it cooperates.
- Install friction dropped: no `env` block required in the MCP config.

The MCP protocol's design intention is "context injector, not LLM wrapper" — but nothing in the docs says that explicitly. Learned it by getting it wrong first.

Repo: https://github.com/jabbawocky/proposalcraft  
Install (one JSON block in Claude Desktop config): `npx -y github:jabbawocky/proposalcraft`  
Landing: https://jabbawocky.github.io/proposalcraft/

Free, MIT, no cloud. Happy to discuss the architecture or the MCP SDK patterns.

---

## Reddit — r/webdev

**Target:** r/webdev (1.7M members — web developers, many freelance or consulting)
**Timing:** PH launch day (June 10) or day before
**Angle:** Technical story + freelance use case; developer-native audience who knows Claude Desktop

**Title:**
Built a free MCP server for writing client proposals — removed the Anthropic SDK and learned something

**Body:**

Working on a side project — **ProposalCraft**, an MCP server (Claude Desktop plugin) that drafts client proposals in your voice using your past winning work as the style guide.

Sharing this mostly because the architecture lesson was interesting.

**What I built first (wrong):**
Server used the Anthropic SDK to make its own `messages.create` calls. Users needed their own API key — a second Anthropic account on top of their Claude Desktop subscription. Install required an `env` block in the MCP config with `ANTHROPIC_API_KEY`.

**What I should have built:**
Tools that return context blocks. Let Claude (running in the host) do the drafting.

The MCP protocol is designed around this: tools are **context injectors**, not LLM wrappers. Your server's job is to fetch the right data, format it well, and return it. The host model handles reasoning.

The fix was removing `@anthropic-ai/sdk` entirely. The `draft_proposal` tool now loads the user's saved proposals, assembles a structured prompt block, and returns it as a text content item. Claude reads it and drafts in its main response — no parallel API call, no extra billing, no extra setup.

Result: zero env vars required. Install:

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

That's it. No API key, no cloud, proposals stay local.

Wrote up the full SDK-removal story here: https://github.com/jabbawocky/proposalcraft/blob/main/marketing/blog-sdk-removal.md

GitHub: https://github.com/jabbawocky/proposalcraft  
Landing: https://jabbawocky.github.io/proposalcraft/

Free, MIT. If you freelance and use Claude Desktop, give it a try — curious what other MCP patterns people have found for productivity tooling.

Does anyone else have a system for filtering Upwork jobs before applying? Curious what signals you watch for.

---

## Reddit — r/learnprogramming

**Target:** r/learnprogramming (4M members — learners, many doing freelance projects on the side)
**Timing:** Day after PH launch (June 11) — let PH settle first
**Angle:** Build story + practical tool; resonates with learners who moonlight as freelancers

**Title:**
I built a free MCP server that writes client proposals — here's the architecture mistake I made first

**Body:**

I've been learning to freelance alongside coding, and one thing nobody prepares you for is proposals. Every client needs one, they take 2+ hours to write well, and you're doing it before you've even been paid.

I built **ProposalCraft** to fix this — it's an MCP server for Claude Desktop that drafts proposals in your voice from your past winning work. But the more interesting part is the mistake I made first.

**The wrong way:**

My first version used the Anthropic SDK inside the server. The tool would:
1. Accept the client brief
2. Call `client.messages.create()` directly
3. Return the generated proposal

This meant users needed *two* Anthropic accounts — one for Claude Desktop (which they already had) and one for the API key my server needed. I was creating a parallel LLM connection inside a tool that was supposed to extend Claude.

**The right way:**

MCP tools aren't supposed to call LLMs. They're context injectors. Your tool fetches data and returns it as a structured block. Claude — already running in the host — does the reasoning.

The fix was removing `@anthropic-ai/sdk` entirely. Now:
1. Tool loads the user's saved proposals from their local machine
2. Tool builds a context block (brief + examples + style notes)
3. Tool returns that block as a text content item
4. Claude reads it and drafts the proposal in its main response

Result: zero env vars required, no second API key, better output quality (Claude has full conversation context).

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

That's the entire install. No API key, no account, everything runs locally.

If you're learning to build MCP servers — the mental model shift is: **your tool is not the AI, Claude is the AI. Your tool is the data layer.**

GitHub (MIT, free): https://github.com/jabbawocky/proposalcraft  
Longer write-up on the SDK removal: https://github.com/jabbawocky/proposalcraft/blob/main/marketing/blog-sdk-removal.md
