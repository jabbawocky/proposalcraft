# ProposalCraft vs Proposal Genie vs PouncerAI: which proposal tool is right for you?

*Cross-post to: dev.to, Hashnode, IH, personal blog*

---

If you've searched for ways to speed up proposal writing, you've probably landed on a few tools. I built one of them — [ProposalCraft](https://github.com/jabbawocky/proposalcraft) — so take this with appropriate scepticism. That said, I'll try to give you an honest read of who each tool is actually for.

## The tools

**ProposalCraft** — MCP server (plugin) for Claude Desktop. Free, MIT licensed, runs locally. Uses your past winning proposals as the style guide for new ones.

**Proposal Genie** — $7.99/month browser extension and web app. Reads job postings and generates proposal text using templates.

**PouncerAI** — Upwork-specific tool. Automatically applies to Upwork jobs on your behalf using an AI-written cover letter. Pricing varies by plan (~$15–49/mo).

---

## What they're actually solving

These tools target different bottlenecks:

| | ProposalCraft | Proposal Genie | PouncerAI |
|---|---|---|---|
| **Primary problem** | Writing takes too long | Writing takes too long | Volume — not enough bids sent |
| **Platform** | Any client (not platform-specific) | Browser-based, any job board | Upwork only |
| **Voice/style** | Learns from your past work | Template-based | AI-generated, not personalized |
| **Price** | Free (5/mo) · $19/mo Pro | $7.99/mo | ~$15–49/mo |
| **Setup** | Claude Desktop + one JSON block | Browser extension install | Account + Upwork API auth |
| **Data privacy** | Local only | Cloud | Cloud |
| **API key needed** | No | No | No |

---

## Who should use which

**Use ProposalCraft if:**
- You write proposals for direct clients (not just via Upwork)
- You already have Claude Desktop (or use Claude regularly)
- You care about sounding like yourself, not like AI
- You want zero recurring cost to start
- Your proposals are worth >$1,000 — where quality matters more than volume

The core premise: you paste a client brief, and Claude drafts a proposal in *your* voice using your past winning proposals as examples. The output is tailored because it draws from work that already won you business — your pricing structure, your hooks, your sign-off.

There's also an `analyze_brief` tool that runs before drafting — it surfaces budget signals, red flags, and scope creep risks so you can decide whether a job is worth your time before investing in a proposal.

**Use Proposal Genie if:**
- You want something that works in your browser without changing your Claude setup
- You don't mind template-driven output
- You're on a tight budget and $7.99/mo works better than setting up an MCP server

**Use PouncerAI if:**
- You're primarily on Upwork
- Your strategy is high volume — bidding on as many jobs as possible
- You're in a lower-rate market where volume bidding works
- You're comfortable with auto-apply (it bids without you reviewing each one)

PouncerAI and ProposalCraft are solving different problems. PouncerAI is volume automation — it fires proposals so you don't have to. ProposalCraft is quality assistance — you're still deciding which jobs to pursue, but the writing is faster and better.

---

## What ProposalCraft doesn't do

Honest limitations:

- **No auto-apply.** You review and send every proposal. If your Upwork strategy is "bid on 200 jobs and see what sticks," use PouncerAI.
- **Requires Claude Desktop.** If you don't use Claude, this isn't for you. It's not a web app with its own UI.
- **Free tier is 5 drafts/month.** Enough to test it properly. Pro ($19/mo) removes the cap.
- **Your past proposals must be worth learning from.** If you don't have past wins, use `load_examples` to seed a starter library (12 templates included), but the output improves significantly when it's learning from your actual work.

---

## The setup difference

**ProposalCraft install:**

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

Paste that into Claude Desktop's config file. One restart. Done.

**Proposal Genie:** Install browser extension → create account → connect.

**PouncerAI:** Create account → link Upwork → configure auto-apply filters → go.

All three are under 10 minutes to set up.

---

## The pricing math for a typical freelancer

Say you win 3 proposals per month at $2,500 average. That's $7,500/month in revenue from proposals.

- **ProposalCraft free:** $0. 5 drafts/month — fine if you're selective.
- **ProposalCraft Pro:** $19/mo. Unlimited. Breakeven if it helps you win one extra gig per year.
- **Proposal Genie:** $7.99/mo.
- **PouncerAI:** $15–49/mo depending on plan.

None of these are meaningful costs if they save you even 30 minutes of proposal writing per week.

---

## Bottom line

| You want... | Use |
|---|---|
| Free, local, learns your voice | ProposalCraft |
| Browser extension, no Claude needed | Proposal Genie |
| Upwork auto-apply, high volume | PouncerAI |

If you're a freelancer or consultant who writes proposals for direct clients and already uses Claude, ProposalCraft is free to try and there's no risk. If you're purely on Upwork and care more about bid volume than proposal quality, PouncerAI makes more sense.

---

**ProposalCraft** is free, MIT licensed, no API key required. Install takes 2 minutes.

GitHub: https://github.com/jabbawocky/proposalcraft  
Landing: https://jabbawocky.github.io/proposalcraft/
