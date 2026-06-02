# ProposalCraft — 30-Day Growth Plan

**Goal:** 100 GitHub stars, 50 installs, first $49/mo paid subscriber by day 30.
**Differentiator:** Free, local, no API key, MCP-native — vs Proposal Genie ($7.99/mo cloud), PouncerAI (Upwork-only).

---

## Week 1 — Launch Blitz (Days 1–7)

### Day 1: Community Launch

Fire all posts in this order (morning, before 10am AEST / 8pm EST prior day):

| Channel | Post | Priority |
|---------|------|----------|
| r/freelance (800k) | See LAUNCH_POSTS.md | HIGH |
| r/SideProject | See LAUNCH_POSTS.md | HIGH |
| Indie Hackers | See LAUNCH_POSTS.md | HIGH |
| Hacker News Show HN | See LAUNCH_POSTS.md | HIGH |
| X/Twitter thread | See LAUNCH_POSTS.md | MED |
| r/webdev | See LAUNCH_POSTS.md | MED |

**Critical:** Respond to every comment within 2 hours on launch day. Engagement signals boost Reddit/HN ranking.

### Day 2-3: MCP Ecosystem Listings

ProposalCraft belongs in every MCP server directory — these get qualified traffic from Claude Desktop users who are already the target buyer.

- [ ] Submit to https://mcpservers.org (or equivalent directory)
- [ ] Submit to https://smithery.ai/server listing
- [ ] Submit to awesome-mcp-servers GitHub repos (search "awesome mcp servers" for current lists)
- [ ] Post in Claude/Anthropic Discord servers about the launch
- [ ] Submit to glama.ai MCP directory

**Message:** "Free MCP server that drafts client proposals in your voice. No API key, no cloud, one JSON config block."

### Day 4-5: Product Hunt Launch

Requires prep before submitting:
- [ ] Create 3-4 screenshots/GIFs of the install + proposal generation in action
- [ ] Write the hunter's comment (see LAUNCH_POSTS.md — Product Hunt section)
- [ ] Find a hunter with 1k+ followers to hunt it (post in IH/PH Discord first)
- [ ] Schedule for Tuesday or Wednesday (peak PH traffic days)

Target: Top 5 in "Developer Tools" or "Productivity" category.

### Day 6-7: Niche Subreddits

| Subreddit | Members | Angle |
|-----------|---------|-------|
| r/consulting | 200k | "Consultants — how long do you spend on proposals?" |
| r/Upwork | 150k | "Not just Upwork — works for any client type" |
| r/digitalnomad | 1.8M | MCP + remote freelance angle |
| r/learnprogramming | 4M | MCP server build story |
| r/ClaudeAI | 80k+ | Native Claude tool angle |

---

## Week 2 — Amplify & Content (Days 8–14)

### SEO Content (zero-cost, long-tail)

Write 3 posts targeting high-intent search queries:

1. **"How to write a client proposal faster"** — target r/freelance, IH, personal blog
2. **"MCP server for freelancers — what is it and how does it help?"** — explains the Claude Desktop ecosystem for non-technical audience
3. **"ProposalCraft vs Proposal Genie vs PouncerAI"** — comparison post, lands on people comparing tools

Post to: dev.to, Hashnode, IH, personal GitHub Pages blog.

### Dev Community Outreach

The MCP angle is genuinely interesting to developers:

- [ ] Post to Lobsters (similar to HN but smaller, more engaged)
- [ ] Post to r/programming about "building with MCP SDK"
- [ ] Write a short technical post: "Why I removed the Anthropic SDK from my MCP server (and why you probably should too)" — story of the API key fix this week
- [ ] Submit to JS Weekly / Node Weekly newsletters (free, editors pick interesting OSS)

---

## Week 3 — Conversion Optimization (Days 15–21)

### Feedback Loop

By now we should have GitHub issues, Reddit comments, and IH replies.

- [ ] Identify the top 3 requested features from user feedback
- [ ] Ship one of them and announce ("v0.2: [feature] based on your feedback")
- [ ] Update the landing page with a user quote if any appear organically

### Paid Tier Setup

To unlock paid conversion by week 4:
- [ ] Design the team plan feature (shared proposal library via a simple sync — S3 or GitHub private repo)
- [ ] Set up Stripe payment link (free, no code needed via Stripe dashboard)
- [ ] Add `/upgrade` or CTA to README pointing to payment page
- [ ] Consider Paddle as Stripe alternative (better for global SaaS)

**Pricing model:**
- Free: local storage, single user (current)
- Pro $19/mo: sync via GitHub private repo (shared library across machines)
- Team $49/mo: shared library, 5 users, analytics on which proposals win

---

## Week 4 — Revenue Push (Days 22–30)

### Outbound (warm, not cold)

Rule: no cold DMs. Warm outreach only:

- [ ] Reply to freelance threads on Reddit/IH/HN where people mention proposal pain points — add value, mention ProposalCraft naturally
- [ ] Engage in Indie Hackers "What are you working on" threads
- [ ] Comment on Product Hunt in similar tool categories (genuine, not spam)

### Newsletter Outreach

Find newsletters that cover indie tools / developer productivity:

- [ ] TLDR Newsletter — submit to "Cool Projects" section (free)
- [ ] Bytes.dev — JS-focused, MCP angle works here
- [ ] The Pragmatic Engineer newsletter reader Q&A
- [ ] Untools / Tools for Thought newsletters

### Metrics to watch

| Metric | Target (Day 30) |
|--------|-----------------|
| GitHub stars | 100 |
| npm weekly downloads (once published) | 50 |
| Landing page unique visits | 500 |
| Paid subscribers | 1 |
| Reddit/HN upvotes combined | 100+ |

---

## Distribution Priority Stack

If limited to one channel per day, this is the order:

1. HN Show HN (highest quality installs, developer-heavy)
2. r/freelance (largest relevant audience)
3. MCP directories (pre-qualified Claude Desktop users)
4. Indie Hackers (best for ICP: indie devs/consultants)
5. Product Hunt (needs prep, higher ceiling)
6. r/SideProject (good for stars/engagement)
7. X/Twitter (lowest conversion, highest reach)

---

## What NOT to do

- Do not post in Upwork forums — ToS violation
- Do not cold DM freelancers
- Do not pay for ads (free-tier only, also CAC > LTV at this stage)
- Do not build a web version yet — MCP distribution is zero-ops and the right test first
- Do not split attention across two products until this has 100 stars or first paying customer
