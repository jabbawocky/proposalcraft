# ProposalCraft — Product Hunt Launch Package

**Product:** ProposalCraft — MCP server for freelancers  
**Version:** 1.0.2  
**Live URLs:** https://bradshawprojects.github.io/proposalcraft/ | https://github.com/bradshawprojects/proposalcraft  
**Pricing:** Free (5 drafts/mo) | Pro $19/mo  
**PH Target:** Tuesday, June 10, 2026 (see rationale below)

---

## 1. Tagline (60 chars max — 3 A/B options, ranked by predicted conversion)

**Option A (recommended — outcome-first):**
> Draft client proposals in your voice, from your past wins

57 chars. Leads with the outcome and the differentiator ("your voice," "your past wins") in one sentence. No jargon. Works for freelancers who've never heard of MCP.

**Option B (pain-point hook):**
> Stop writing proposals from scratch. Let your wins do it.

57 chars. Addresses the specific behaviour (starting blank) everyone hates. "Let your wins do it" is memorable. Slightly cryptic — may lose non-freelancers faster.

**Option C (category-defining, for the MCP-aware audience):**
> The MCP server that turns your best proposals into a template

60 chars exactly. Explicit on MCP — good for PH's tech-forward audience. Ranks lower because "template" undersells what it does (it's not just a template).

**Recommendation:** Launch with Option A. If you A/B test two listings (not possible on PH natively), run Option B in the first comment for the social hook.

---

## 2. Description (260 chars)

> ProposalCraft plugs into Claude Desktop as an MCP server. Paste a client brief — it drafts a proposal in your voice, learned from your past winning work. Unlike ChatGPT or web apps, your proposals stay local. Free: 5 drafts/mo. Pro: $19/mo.

259 chars. Hits: what it is, how it works, why it's different from ChatGPT/web apps, pricing. The "unlike ChatGPT or web apps" clause is doing heavy lifting for PH voters who'll reflexively think "why not just use ChatGPT."

---

## 3. First Comment (Founder Comment — post the moment voting opens)

This is the most important asset. PH votes heavily on the founder comment in the first 2 hours. It needs a story, not a feature list.

---

**Founder comment (150–300 words):**

I built this because I tracked my hours for one month and found I was spending 9–12 hours of unbilled time on proposals for every deal I closed.

Not because proposals are hard to write — but because every one starts from scratch. You stare at a blank page and try to remember: how did I phrase the pricing section last time? What structure did that client love? What did I leave out that cost me the deal?

ChatGPT and Claude are great at proposal writing in general. They're useless at proposal writing *in your voice*, because they don't know which of your past proposals actually won, which ones got ghosted, or why.

ProposalCraft fixes that. It's an MCP server — it plugs into Claude Desktop (one JSON config block) and gives Claude persistent access to your proposal library. When you draft a new proposal, it loads 3–5 of your winning examples into context. The output reads like you wrote it, because it's structurally based on proposals that already worked.

The `analyze_brief` tool is what freelancers actually use first — paste a client email, get back: budget signals, scope creep red flags, and the 5 questions you should ask before quoting. Saves you from writing a 2-hour proposal for a client who wanted a $500 fix.

Free tier is 5 drafts/month — enough to test it on a real brief. Pro is $19/mo for unlimited.

Nothing leaves your machine. No cloud database, no extra API key, no accounts.

Would love to hear from anyone who's tried it — what's working and what's missing.

---

## 4. Maker Intro (30–50 words)

> I'm Mat, a freelancer and solo developer. I built ProposalCraft because I was losing 10+ hours per closed deal to proposal writing. It's an MCP server that drafts in your voice from your past wins — free to try, $19/mo Pro.

43 words. Leads with identity (freelancer, not just developer), immediately ties to the problem the product solves.

---

## 5. Topics/Tags (PH lets you pick 3)

Ranked by fit:

1. **Productivity** — Primary. PH's largest category. Freelancers searching for productivity tools will find this.
2. **Artificial Intelligence** — Mandatory. Claude/MCP is the differentiator. AI tag drives significant PH traffic.
3. **Developer Tools** — Tertiary. MCP is a developer-adjacent install. The Claude Desktop user is more developer than the average freelancer. This tag captures them.

**Alternate to Developer Tools if you want pure freelance ICP:** "Freelance" — PH has a freelance category with an engaged niche audience who upvote tools directly useful to them.

---

## 6. Gallery Image Suggestions

PH requires images or GIFs. These should show the tool in action, not the landing page or README. Specific concepts:

**Image 1 — Before/After Still (most important):**
Two-panel screenshot. Left: a messy client email ("Hi, we need a website redesign for our startup, budget TBD"). Right: formatted `analyze_brief` output showing budget signal ("Budget: likely $5k–$15k based on 'startup' + no timeline"), red flags, and 3 scoped questions. Caption: "Paste brief → instant risk analysis." Shows value before the user has to install anything.

**Image 2 — GIF: Core loop in 15 seconds:**
GIF showing: Claude Desktop open → user types "draft a proposal for this brief: [2-line brief]" → ProposalCraft tools activate → 400-word proposal appears in the user's voice. Runs 10–15 seconds. No voiceover needed — the tool names (`analyze_brief`, `draft_proposal`) visible in Claude's tool call window are the copy. Caption: "30 seconds. Ready to send."

**Image 3 — Install simplicity still:**
The JSON config block on a dark background with a single annotation: "Paste this in Claude Desktop. Restart. Done." This is 3 lines of JSON — it's the anti-complexity signal that converts PH's technical audience. Nothing says "low friction" like a 3-line install.

**Image 4 — Freemium gate / pricing clarity:**
Clean screenshot of the `draft_proposal` response footer: "Draft complete. 3 of 5 free drafts used this month. Upgrade to Pro ($19/mo) for unlimited drafts → [URL]." Contextualises the free tier without needing a pricing page screenshot. Voters see the business model clearly.

**Production note:** Record the GIF with Claude Desktop on a Mac with a clean desktop. Use QuickTime screen recording → ezgif.com for compression. Keep under 5MB for PH upload limits. The `analyze_brief` output is visually richer than `draft_proposal` — lead with it in Image 1.

---

## 7. Hunter Strategy

**Option A: Self-hunt (recommended for this launch)**

Self-hunting is completely acceptable and increasingly the norm on PH. You get full control over launch timing, the first comment, and the description. PH no longer requires a "top hunter" to surface on the front page — a well-prepared self-launch with strong first-hour upvotes outperforms a lazy famous-hunter launch.

Steps: Create a Product Hunt account at producthunt.com/posts/new. Fill in all fields. Schedule it to go live at 12:01am PT on your chosen Tuesday (PH day resets at midnight Pacific time). Set a reminder to post the founder comment the moment it goes live.

**Option B: Find a top PH hunter (worth exploring in parallel)**

A hunter with 1,000+ followers gives you free distribution — their followers get notified. This can add 50–200 early upvotes. Best path to find one:

1. Go to producthunt.com and search for recently launched MCP, Claude, or developer productivity tools. Look at who hunted them.
2. Check the hunter's follower count on their PH profile. Hunters with 500–2,000 followers are active and reachable; the top 10 (10k+ followers) are too busy.
3. DM them on Twitter/X: "Launching ProposalCraft on PH [date] — MCP server for freelancers. Would you be interested in hunting it? Happy to answer any questions. [landing page URL]"
4. Give yourself 5–7 days of lead time. Most hunters will respond within 48 hours if they're interested.

Good hunter targets to look up: anyone who has recently hunted tools in "productivity for developers," "AI writing tools," or "MCP/Claude ecosystem."

**Verdict:** Start the self-hunt process now (so you have the listing ready). Reach out to 3–4 potential hunters in parallel. If a hunter responds positively before June 9, hand it to them. If not, self-hunt.

---

## 8. Recommended Launch Day

**Tuesday, June 10, 2026.**

Rationale:

- **Day of week:** Tuesday and Wednesday are PH's highest-traffic days. Tuesday is the single best day — PH voting resets at midnight PT and Tuesday gets the full workday traffic window of the West Coast US (largest PH user concentration).
- **MCPize deadline alignment:** June 10 is the MCPize founding rate deadline (85% rev share vs. 80%). Launching on exactly this date creates a concrete urgency hook — in the first comment you can legitimately say "Pro plan just went live today." This is not manufactured urgency; it's real and meaningful.
- **Window fit:** June 10 is 7 days from now. That's the minimum comfortable prep window: 4 days to build gallery images + GIFs, 2 days to prep outreach list, 1 day to schedule the PH listing.
- **Alternative:** Wednesday June 11 if June 10 gets crowded with other launches. Check PH the week before — if two or three high-profile tools launch June 10, push to June 11. PH front page fits ~10 products/day; you want a quieter day.
- **Avoid:** June 9 (Monday — worst traffic day), June 12–16 (Thursday–Tuesday — rapidly diminishing returns), June 17 (following Tuesday — too far out, loses MCPize timing hook).

---

## 9. Launch Day Strategy

### Pre-launch (June 8–9)

- **Outreach prep:** Compile a list of 30–50 people who should know about the launch and can upvote. Include: past freelance clients or contacts, anyone who's starred the GitHub repo, anyone you've discussed the tool with, colleagues who freelance. DM format: "Launching ProposalCraft on Product Hunt Tuesday — built it to solve [problem]. Would mean a lot if you checked it out and gave it an upvote. [PH listing URL once scheduled]."
- **Hunter outreach:** Send DMs to 3–4 potential PH hunters (see above).
- **Community pre-warm:** Post in Claude/Anthropic Discord #mcp-servers on June 8: "Launching ProposalCraft on Product Hunt this Tuesday — if you've been curious about it, PH launch day is a good time to try it." This primes the most MCP-native audience for a voting event, not a cold product announcement.
- **Schedule the listing:** Log into PH and pre-fill your listing. PH lets you schedule launches. Set it for 12:01am PT June 10. Confirm gallery images all upload correctly.

### Morning of launch (June 10, 12:01am–2:00am PT)

- The PH listing goes live at 12:01am PT. If you're on Australian Eastern Time, that's 5pm–7pm June 10 AEST — perfectly within waking hours.
- **Post the founder comment immediately** (the 250-word story above). This comment needs to be up within the first 5 minutes of the listing going live. Early visitors who arrive via PH notifications will read it before upvoting.
- **Fire the notification batch:** Send the pre-written DMs to your 30–50 outreach list. These people should land on the PH listing within the first 30–60 minutes. The first 2 hours determine whether PH's algorithm surfaces you on the front page.

### Social posts — morning of launch (June 10, 9am–10am PT / 2am–3am AEST)

**Twitter/X — post this as a standalone tweet, link to PH listing:**

> ProposalCraft is live on Product Hunt today.
>
> It's the MCP server that drafts client proposals in your voice — learned from your past wins.
>
> If you're a freelancer using Claude Desktop, this is the day to try it.
>
> Free: 5 drafts/month. Pro: $19/mo.
>
> 👉 [PH listing URL]

Pin this tweet for 24 hours.

**LinkedIn — post this from Mat's personal profile:**

> Launched ProposalCraft on Product Hunt today.
>
> Built it after realising I was spending 9–12 hours of unbilled time on proposals for every deal I closed. You know the situation: you write two hours into a proposal, send it, and hear nothing.
>
> ProposalCraft is an MCP server for Claude Desktop that learns from your past winning proposals and drafts new ones in your voice. Paste a client brief. Get a ready-to-send draft back.
>
> Free to try (5 drafts/month). If you're a freelancer or consultant using Claude, I'd love your feedback.
>
> Check it out on Product Hunt: [PH listing URL]

### Communities to notify on launch day

Fire these in the following order (notifications first, then community posts):

1. **Personal DM batch** (30–50 contacts) — immediately at launch
2. **Anthropic Discord #mcp-servers** — post that it's live on PH, link to the listing, ask for feedback (not explicitly for upvotes — PH discourages upvote-begging in posts)
3. **Peak Freelance Slack** — "ProposalCraft launched on PH today — free to try for anyone who writes client proposals. [link]"
4. **r/SideProject** — "Launched ProposalCraft on Product Hunt today — if you've been following along, this is the moment." Short post, link to PH. Do NOT post the full product pitch — just the PH link.
5. **Indie Hackers** — same as r/SideProject. IH community is PH-native and will upvote without being asked.

**Do NOT on launch day:**
- Post in r/freelance asking for upvotes (PH rule violation + Reddit ban risk)
- Ask for upvotes directly in your Discord post (PH monitors referral traffic)
- Post in every channel at once — stagger by 30–60 minutes so each community feels like a fresh notification, not a broadcast

### First 2-hour critical window (how PH algorithm works)

PH ranks products on the front page by a combination of: upvotes, comments, and recency. The first 2 hours are disproportionately weighted — getting to 30–50 upvotes in the first 2 hours triggers front-page placement for the rest of the day. After that, organic PH discovery takes over.

Target: 30 upvotes by 2:00am PT. This is achievable with a 30-person warm outreach list.

### Responding to comments throughout the day

Be present in the PH comments for the full day. Respond to every comment within 30 minutes during business hours. PH voters upvote products where the maker is active. Specifically prepare for these questions:

- "What's the difference from just using Claude?" — Answer: ProposalCraft maintains a persistent local library of your past winning proposals across sessions. Claude alone has no memory of your prior work.
- "Why not a web app?" — Answer: Zero ops. No database, no auth, no backend. Your proposals stay on your machine. Trade-off is Claude Desktop dependency, but that audience already pays for AI tools.
- "Does this work with GPT?" — Answer: Not currently. MCP is a Claude Desktop standard. Cursor and Windsurf also support it.
- "Is it really free?" — Answer: 5 draft_proposal calls/month free, forever. Pro is $19/mo for unlimited. No credit card required to start.

---

## 10. Timing Note: MCPize + PH Alignment

Launching ProposalCraft on Product Hunt on June 10 aligns with the MCPize founding rate deadline in a way that's useful for the narrative: "We launched on Product Hunt today and the Pro plan powered by MCPize just went live." This is a legitimate milestone, not manufactured urgency. If MCPize registration happens before June 10, the PH launch becomes the moment you announce the full commercial product — free tier + working Pro checkout — which is a much stronger PH listing than a "freemium gated but no payment path yet" product.

**Ideal sequence:**
1. MCPize registration: June 7–8 (3–4 days to go, founding rate still applies)
2. Confirm Pro checkout works end-to-end: June 8–9
3. PH listing scheduled: June 9 (goes live midnight PT June 10)
4. Launch day: June 10

If MCPize registration doesn't happen before June 10, the Gumroad Starter Pack ($19 one-time) is live and counts as a payment path — the landing page already has a real buy button. Don't delay the PH launch waiting for MCPize if it's the only blocker.

---

## Checklist — Pre-launch requirements

- [ ] MCPize or Gumroad payment path live and tested end-to-end
- [ ] PH account created (producthunt.com)
- [ ] Gallery images/GIFs created (min 3: before/after still, core-loop GIF, install block)
- [ ] PH listing pre-filled: tagline, description, gallery, tags
- [ ] Listing scheduled for 12:01am PT June 10
- [ ] Outreach list compiled (30–50 warm contacts)
- [ ] DMs drafted and ready to fire
- [ ] Twitter/X and LinkedIn posts drafted and ready to schedule
- [ ] Founder comment saved and ready to paste (above)
- [ ] Hunter outreach sent (optional but worth trying by June 7)
- [ ] Anthropic Discord pre-warm post done June 8–9
