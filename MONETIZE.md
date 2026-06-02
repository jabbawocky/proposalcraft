# ProposalCraft — Monetisation Playbook

**Revenue Strategist assessment · 2026-06-03**

---

## The problem we're solving

ProposalCraft has been distributed with zero revenue mechanism. The "paid plan coming" placeholder is not a revenue strategy — it's a conversion killer. Every user who arrives from r/freelance and sees "Free while in beta, paid plan coming" either:
1. Installs for free and never upgrades (no upgrade path exists)
2. Bounces because "beta" signals unfinished

**Fix: MCPize.** It's a payment wrapper for MCP servers. ProposalCraft already works — we just need to add billing.

---

## Option 1: MCPize (recommended, do this first)

**What it is:** Marketplace + billing platform specifically for MCP servers. Handles Stripe, subscriptions, per-call pricing, hosting.

**Revenue share:** 85% to you (Founding Member rate — expires June 10, 2026. After that it drops to 80%.)

**Bonus:** 0% platform fee for the first month — confirmed from MCPize developers page June 2026.

**You keep:** $16.15 of every $19/mo Pro subscription (vs $15.20 at standard 80% rate).

**Steps (~30 minutes):**

1. Go to **https://mcpize.com** → "Become a Developer"
2. Create account + verify email
3. Dashboard → Connect Stripe (your existing Stripe account)
4. Create a new server listing:
   - Name: ProposalCraft
   - GitHub: https://github.com/bradshawprojects/proposalcraft
   - Category: Productivity / Business
   - Description: "MCP server for freelancers — paste a client brief, get a proposal drafted in your voice from your past winning work."
5. Set pricing tiers:
   - **Free**: 5 drafts/month (keeps install frictionless)
   - **Pro**: $19/mo — unlimited drafts + analyze_brief tool
6. Deploy to MCPize infrastructure (they handle hosting)
7. Get your MCPize listing URL
8. Update landing page pricing CTA to point to MCPize checkout

**After setup:**
- Update `docs/index.html` "Join the waitlist" button → real MCPize checkout URL
- Add MCPize badge to README (required for the punkpeye awesome-mcp-servers PR to merge)
- Update STATUS.md with live MCPize URL and revenue tracking

---

## Option 2: Direct Gumroad (fast, simpler, lower ceiling)

Already partially in place: `docs/index.html` has a Gumroad link for the Starter Pack.

**ProposalCraft Pro Pack on Gumroad:**
- Price: $49 one-time (no recurring friction)
- What's included: ProposalCraft Pro install guide + 50 proposal templates + analyze_brief walkthrough
- Time to set up: 2 hours
- Expected revenue: ~$50-150/month at current distribution scale

**Steps:**
1. Create product on https://gumroad.com (free)
2. Upload a PDF with the 50 templates + setup guide
3. Set price $49
4. Update Gumroad URL in `docs/index.html` starter-pack section (currently a placeholder)
5. Fire r/freelance post — link drives to free install + $49 upsell

---

## Option 3: Revenue Rescue MCP (new product, higher ceiling)

**What:** MCP server for Stripe ops — dispute responses, refund analysis, churn prediction, revenue forecasting.

**Who pays:** SaaS founders and e-commerce operators who hate their Stripe dashboard. Clear $100-500/mo willingness to pay.

**Time to build:** 7-10 days

**Revenue model:** $49/mo via MCPize

**Blocker:** Needs Mat's go-ahead on Stripe write access (write scope = can issue refunds, modify subscriptions). Read-only scope is safe and unblocks the analysis tools immediately.

---

## Revenue Strategist ranking

| Rank | Opportunity | Time to Revenue | Difficulty | Ceiling |
|------|------------|-----------------|-----------|---------|
| **#1** | MCPize ProposalCraft | 1-3 days | 2/5 | $3-10k/mo |
| **#2** | Gumroad Starter Pack | Same day | 1/5 | $150/mo |
| **#3** | Revenue Rescue MCP | 7-10 days | 3/5 | $5-20k/mo |

**Winner: MCPize.** The product exists. The only missing piece is a payment layer. MCPize is that layer. The Founding Member deadline (June 10) creates real urgency — 5 days to lock in 85% vs. 80% forever. At $19/mo with 100 Pro users that's $1,615/mo vs $1,520/mo — not life-changing, but the rate locks in permanently.

Do the Gumroad Starter Pack *as well* — it's one afternoon and creates an immediate upsell for free installers.

---

## What the team needs from Mat

1. **Register on MCPize** (~30 min) — https://mcpize.com
2. **Connect your Stripe account** to MCPize dashboard
3. **Set pricing tiers** as above
4. **Send MCPize listing URL** back to the team → they'll update the landing page CTA and README badge
5. **Create Gumroad starter pack** (~2 hrs) — 50 templates already exist in `starter-pack/` directory

That's it. Revenue goes live before the r/freelance post.

---

## Revenue calculator — what the math looks like

**Conversion benchmark:** 8% free-to-paid is achievable at this price point (validated by Indie Hacker Analyst tick 10). Need 26 paid users at $19/mo for $500 MRR.

**Distribution channels now active:**
- 6 awesome-list PRs open (~90k+ combined stars — when merged, passive installs begin)
- Content assets ready: LinkedIn, Dev.to article, 4 newsletter pitches, r/ClaudeAI, Discord
- r/freelance + Show HN queued (fire after payment path live)

**Conservative scenario (1% conversion, small distribution):**

| Users install/month | 1% convert to Pro | Monthly revenue (85%) |
|---|---|---|
| 100 | 1 | $16 |
| 500 | 5 | $80 |
| 1,000 | 10 | $162 |
| 2,600 | 26 | **$420/mo** |

**Optimistic scenario (8% conversion, awesome-list traffic merges):**

| Users install/month | 8% convert | Monthly revenue |
|---|---|---|
| 500 | 40 | **$646/mo** |
| 1,000 | 80 | **$1,292/mo** |

**Gumroad Starter Pack on top (one-time $19):**
Every r/freelance-driven install = potential $19 upsell. Even 10 sales/month = $190 passive.

**The ask to get here:** 30 min on MCPize (or 5 min on Gumroad). Product, freemium gate, and 8 tools already exist and are working.
