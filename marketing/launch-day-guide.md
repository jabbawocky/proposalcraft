# ProposalCraft — Launch Day Execution Guide

**Launch date:** Tuesday June 10, 2026  
**Total time required:** ~3–4 hours (can be split morning/afternoon)

---

## 🚨 URGENT — Do These RIGHT NOW (Jun 9)

- [ ] **Chris Messina PH thread** — "Chris Messina started a thread!" email arrived in mathewcarter@gmail.com at 02:13 UTC Jun 9. He is Hunter #3 on our list. Check producthunt.com notifications and DM him about hunting ProposalCraft on Jun 10. **This is a same-day opportunity — do not miss it.**
- [ ] **Star campaign** — Send the star-ask messages tonight (copy in `marketing/star-campaign.md`). Zero stars is a conversion killer. Target: 20+ stars before midnight.
- [ ] **PH hunter DM** — Send DM to @imrohanchaubey on X (Template A in `marketing/ph-hunter-outreach.md`). Deadline: tonight.
- [ ] **PH listing** — Create or confirm ProposalCraft listing is live at producthunt.com. Full copy/gallery in `marketing/producthunt-launch.md` and `docs/ph-gallery/`.

---

## Night Before (Jun 9 evening)

- [ ] **MCPize** — mcpize.com → sign in with GitHub (jabbawocky) → list ProposalCraft → connect Stripe. Founding rate expires Jun 10.
- [ ] **NPM_TOKEN** — npmjs.com → Access Tokens → Automation → copy. GitHub → jabbawocky/proposalcraft → Settings → Secrets → Actions → NPM_TOKEN → paste. Then: Actions tab → Publish to npm → Re-run failed jobs.
- [ ] **MCP registry** — `mcp-publisher login github && mcp-publisher publish` (5 min, needs browser for OAuth; binary at `/tmp/mcp-publisher/mcp-publisher`)
- [x] **PH gallery** — ✅ Done (ticks 40 + 77). All 4 images ready in `docs/ph-gallery/`: image1.png, image3.png, image4.png (static PNGs), image2-core-loop.gif (animated, 80KB). Upload directly from that folder to PH. No screen capture needed.
- [x] **OG image PNG** — ✅ Done. `docs/og-image.png` (1200×630) live at jabbawocky.github.io/proposalcraft/og-image.png. Nothing to do.
- [ ] **Glama OAuth** — glama.ai → Sign Up with GitHub (jabbawocky) → Add Server → select jabbawocky/proposalcraft. Unblocks punkpeye #7404 merge.
- [ ] **Mastodon hCaptcha** — Visit https://mastodon.social/auth/confirmation?confirmation_token=u_3fue8n_-sc1LkwQmix&redirect_to_app=true and solve hCaptcha once. Account: proposalcraft@mastodon.social / ProposalCraft2026!
- [ ] **Verify everything is live:** landing page loads (jabbawocky.github.io/proposalcraft), GitHub release shows, og:image renders.

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

### 12. Newsletter pitches
✅ **Already sent (tick 50):** JS Weekly, Node Weekly, TLDR AI, Console.dev, Changelog, Indie Dev Monday, DeployHQ, Toolradar, ShareUHack, The Rundown AI, Agensi.io, PulseMCP (12 total). No action needed — these are in editors' inboxes.

**Remaining (not yet sent):** Nimbalyst/Karl Wirth (LinkedIn DM only — linkedin.com/in/karlwirth), dev.to article (needs GitHub OAuth login — see step 15).

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
