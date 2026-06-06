# ProposalCraft — Launch Day Execution Guide

**Launch date:** Tuesday June 10, 2026  
**Total time required:** ~3–4 hours (can be split morning/afternoon)

---

## Night Before (Jun 9 evening)

- [ ] **MCPize** — if not already done: mcpize.com → account → list ProposalCraft → connect Stripe (~30 min). Founding rate expires Jun 10.
- [ ] **NPM_TOKEN** — npmjs.com → Access Tokens → Automation → copy. GitHub → jabbawocky/proposalcraft → Settings → Secrets → Actions → NPM_TOKEN → paste. Then: Actions tab → Publish to npm → Re-run failed jobs.
- [ ] **MCP registry** — `mcp-publisher login github && mcp-publisher publish` (5 min, needs browser for OAuth)
- [ ] **PH gallery** — open `docs/ph-gallery/` HTML files in Chrome, screenshot each one. Upload to PH product page.
- [ ] **OG image PNG** — Twitter requires PNG/JPEG for `summary_large_image` cards (SVG is ignored). Open `docs/og-image.svg` in Chrome → right-click → "Save as" PNG, or use `rsvg-convert -f png -o docs/og-image.png docs/og-image.svg` then update `og:image` and `twitter:image` to point to `.png`. ~5 min. Without this, Twitter shares show text-only.
- [ ] **Verify everything is live:** landing page loads, GitHub release shows, Glama badge renders.

---

## Launch Morning (Jun 10, ~8am AEST / 6pm EST Jun 9)

Sequence matters — do in this order.

### 1. Product Hunt (10 min)
Submit or schedule at producthunt.com. Copy from `marketing/producthunt-launch.md`.  
- Name: ProposalCraft  
- Tagline: Draft client proposals in your voice. No API key, no cloud.  
- Gallery: use screenshots from PH gallery step above  
- First comment: see producthunt-launch.md hunter's comment section

### 2. Hacker News Show HN (2 min)
Submit at news.ycombinator.com/submit.  
Copy from `LAUNCH_POSTS.md → ## Hacker News — Show HN` (the detailed version, further down the file).  
**Tip:** HN front page = first hour engagement matters most. Have responses ready.

### 3. r/freelance (5 min)
Post from `LAUNCH_POSTS.md → ## Reddit — r/freelance`.  
⚠️ This post references the $19/mo Pro tier — only fire if MCPize or another payment link is live.  
If not live yet, use r/SideProject first instead.

### 4. r/SideProject (2 min)
Post from `LAUNCH_POSTS.md → ## Reddit — r/SideProject`.  
No payment reference — safe to fire regardless.

### 5. Indie Hackers (5 min)
Post from `LAUNCH_POSTS.md → ## Indie Hackers` (the detailed version with maker story).

### 6. r/ClaudeAI (2 min)
Post from `LAUNCH_POSTS.md → ## Reddit — r/ClaudeAI`.

### 7. X/Twitter thread (5 min)
Post thread from `LAUNCH_POSTS.md → ## X/Twitter thread` (5 posts in sequence).

---

## Mid-Morning (2–3 hours after launch)

### 8. r/consulting (2 min)
Post from `LAUNCH_POSTS.md → ## Reddit — r/consulting`.

### 9. r/digitalnomad (2 min)
Post from `LAUNCH_POSTS.md → ## Reddit — r/digitalnomad`.

### 10. r/Upwork (2 min)
Post from `LAUNCH_POSTS.md → ## Reddit — r/Upwork`.

### 11. r/webdev (2 min)
Post from `LAUNCH_POSTS.md → ## Reddit — r/webdev`.

### 12. Newsletter pitches (20 min)
Send from Mat's personal email (not team address). Copy from `marketing/newsletter-pitches.md`:
- JS Weekly: peter@cooperpress.com
- Node Weekly: peter@cooperpress.com (same editor, separate email)
- TLDR Newsletter: submit form at tldr.tech/tech/newsletter
- Console.dev: submit at console.dev/tools/
- Changelog: news@changelog.com
- Indie Dev Monday: newsletter@indiedevmonday.com

---

## Afternoon (Day of)

### 13. Roundup DM/form targets
Copy from `marketing/roundup-outreach.md`:
- Nimbalyst (Karl Wirth) — LinkedIn DM: linkedin.com/in/karlwirth
- Agensi.io — web form: agensi.io/contact
- Toolradar — X DM: @LouisCorneloupe
- The Rundown AI — submit form: rundown.ai/submit

### 14. PH hunter DM
Send DM to target hunter. Copy from `marketing/ph-hunter-outreach.md`.

### 15. dev.to / Hashnode blog posts (30 min)
Post from `marketing/blog-sdk-removal.md` to dev.to + Hashnode.  
Secondary: `marketing/blog-mcp-explainer.md` (can schedule for day 2).

---

## Day After (Jun 11)

- [ ] r/learnprogramming — post from `LAUNCH_POSTS.md → ## Reddit — r/learnprogramming`
- [ ] Respond to all Reddit/HN/IH comments from yesterday (engagement boosts ranking)
- [ ] Post comparison blog (`marketing/blog-comparison.md`) to dev.to + IH
- [ ] Check PH ranking and comment activity
- [ ] Check MCPize for any signups

---

## Engagement rules (launch day)

- Respond to every comment within 2 hours — Reddit/HN ranking is engagement-weighted
- Don't cross-promote between posts ("also posted on r/...") — gets flagged as spam
- If HN/Reddit comments ask for feature X, note it — ship a fast follow within 48h and reply "shipped this"
- GitHub stars are a vanity metric — focus on installs and Pro conversions

---

## Success metrics (end of day)

| Metric | Target |
|---|---|
| GitHub stars | 20+ |
| PH votes | 50+ |
| Pro signups | 1+ |
| Reddit karma from posts | positive (no downvotes) |

---

## Emergency contacts / fallbacks

- If MCPize isn't ready by launch: use a manual Gumroad product page as the Pro payment link (5 min setup)
- If PH gallery images aren't ready: use the GitHub README screenshots
- If npm publish fails again: direct install via `npx -y github:jabbawocky/proposalcraft` still works — note it in posts
