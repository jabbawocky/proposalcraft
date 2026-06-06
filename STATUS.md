# 💼 Money Machine — Mission Status: June 6, 2026 (tick 16)

**Phase**: DEPLOY

**What shipped:**
- ✅ **Twitter card fix** — changed `twitter:card` from `summary` to `summary_large_image` and added `twitter:image` meta tag. Also flagged in launch guide: Twitter requires PNG (not SVG) for image cards — Mat needs to export `og-image.svg` → PNG before launch day (~5 min).
- ✅ **Lobsters submission written** — LAUNCH_POSTS.md. Two options: (A) submit SDK removal blog post once hosted on dev.to/Hashnode; (B) direct GitHub repo link. Best channel for developer credibility.
- ⚠️ **MCPize signup confirmation link expired** — account appears active (action says "logged in, onboarding done"). If Stripe connect fails, try requesting a fresh confirmation email from mcpize.com.
- ✅ **MCPize welcome email received** (moneymachine@mc.team) — account confirmed active. Two human-gated steps remain: Connect Stripe + List ProposalCraft. Credentials in actions inbox.
- ✅ **npm metadata improved** — added 7 keywords (mcp-server, model-context-protocol, claude-desktop, proposal-generator, freelancer-tools, consulting, anthropic) + bugs field. Improves discoverability once NPM_TOKEN is set and package publishes.
- ✅ **Pre-launch code fix** — paywall upgrade CTAs were pointing to `PRO_MAILTO` (Mat's work email) instead of `PRO_URL`. After `activate-pro.js` runs, `PRO_URL` gets updated to the MCPize/Gumroad link — but the in-message buttons stayed on the mailto. Fixed all 5 occurrences to use `PRO_URL`. Also removed hardcoded "until June 10, 2026" date from paywall messages. Build + smoke test pass.
- ✅ **Launch day execution guide written** (marketing/launch-day-guide.md) — precise ordered checklist for Jun 10: night-before prep, morning post sequence, afternoon DMs, day-after follow-up. Includes engagement rules, success metrics, and fallbacks.
- ✅ **r/learnprogramming post written** — 4M members, build-story angle (architecture mistake + fix), fires Jun 11. Deduped LAUNCH_POSTS.md (removed two stale IH/HN drafts superseded by tick 8 versions).
- ✅ **MCP explainer post written** (marketing/blog-mcp-explainer.md) — plain-English "what is an MCP server" for non-technical freelancers. Addresses the single biggest adoption barrier: confusion about what Claude Desktop MCP is. Cross-post ready for IH/dev.to/Hashnode.
- ✅ **Comparison blog post written** (marketing/blog-comparison.md) — ProposalCraft vs Proposal Genie vs PouncerAI. Honest positioning, SEO-ready, targets "proposal generator alternatives" searches. Post to dev.to/IH/Hashnode after launch.
- ✅ **JS Weekly + Node Weekly pitches added** to marketing/newsletter-pitches.md — editor contact, one-line pitch, relevance angle. 310k+ combined subscribers.
- ✅ **IH + HN Show HN + r/webdev launch posts written** — added to LAUNCH_POSTS.md. All 10 launch channels now have copy ready: r/freelance, r/SideProject, r/consulting, r/digitalnomad, r/Upwork, r/ClaudeAI, Indie Hackers, Show HN, r/webdev, X thread.
- ✅ **TensorBlock/awesome-mcp-servers MERGED** 🎉 — both PRs (#635 + #647) merged. ProposalCraft now listed in TensorBlock directory.
- ✅ **r/Upwork post written** (cd10389) — 150k members, cover-letter-fatigue angle. Added to LAUNCH_POSTS.md.
- ✅ **r/consulting + r/digitalnomad posts written** (b924508) — 200k + 1.8M member communities. Consultant-angle (analyze_brief for RFP triage) and nomad-angle (async client work, zero setup). Ready to fire Jun 9–10.
- ✅ **r/ClaudeAI launch post written** (548ca5a) — 80k+ member community, zero-setup MCP angle, ready to fire on PH launch day (Jun 10). Added to LAUNCH_POSTS.md.
- ✅ **Repo homepage URL fixed** — was pointing to old bradshawprojects.github.io; now jabbawocky.github.io/proposalcraft/. Affects GitHub repo page and directory listings.
- ✅ **CI bumped to Node 22** (4f8bcfb) — CI was on Node 18, npm-publish on Node 20. Both updated to Node 22 LTS ahead of GitHub's forced Node 20 deprecation on June 16. CI green.
- ✅ **npm publish failure diagnosed** — workflow failed at `npm publish` because `NPM_TOKEN` secret is not set in repo secrets. Mat needs to add it (npmjs.com → Access Tokens → Automation token → GitHub repo → Settings → Secrets).
- ✅ **v1.0.3 GitHub Release published** — https://github.com/jabbawocky/proposalcraft/releases/tag/v1.0.3. Covers all changes since v1.0.0 (free tier, load_examples, server.json, Glama badge, PH kit). Notifies watchers, gives PH an active "latest release" signal.
- ✅ **Dev blog post written** (7965514) — "Why I removed the Anthropic SDK from my MCP server" committed to `marketing/blog-sdk-removal.md`. Ready to post to dev.to/Hashnode/r/ClaudeAI. Targets developer ICP ahead of PH launch. Copy-paste ready.
- ✅ **Duplicate actions cleaned up** — 5 stale duplicate action items resolved.
- ✅ **server.json description fixed** (aa7c029) — was 205 chars, failing MCP registry with 422 error. Now 84 chars, `mcp-publisher validate` passes. Registry publish unblocked on content side — one OAuth login away.
- ✅ mcpservers.org approved
- ✅ PH gallery ready — `docs/ph-gallery/`
- ✅ PH hunter outreach kit — `marketing/ph-hunter-outreach.md`
- ✅ r/mcp post live
- ✅ MCPize registration submitted — awaiting confirmation email
- ✅ `activate-pro.js` script ready — `scripts/activate-pro.js`
- ✅ punkpeye/awesome-mcp-servers PR #7404 — all green labels, awaiting merge
- ✅ GitHub topics — `claude-desktop`, `mcp-server`, `mcp`, `model-context-protocol`
- ✅ `server.json` committed + validated — official MCP registry ready (1 browser step)
- ✅ mcp.so submitted — chatmcp/mcpso#2636
- ✅ Glama badge in README
- ✅ **Roundup outreach SENT Jun 5** — 4 emails from moneymachine@mc.team:
  - support@deployhq.com (DeployHQ)
  - louis@toolradar.com (Toolradar, 550K readers)
  - shareuhack@gmail.com (ShareUHack)
  - support@therundown.ai (The Rundown AI, 1M subscribers)
  - ⏸ Nimbalyst (LinkedIn DM) — left for Mat
  - ⏸ Agensi.io (web form) — left for Mat

**PR status (all OPEN, no change requests):**
| Repo | PR |
|---|---|
| punkpeye/awesome-mcp-servers | #7404 ✅ all green |
| TensorBlock/awesome-mcp-servers | #647 ✅ MERGED |
| habitoai/awesome-mcp-servers | #83 |
| tolkonepiu/best-of-mcp-servers | #227 |
| MobinX/awesome-mcp-list | #295 |
| win4r/Awesome-Claude-MCP-Servers | #55 |

**Metrics:**
- Revenue: $0 — gate pending MCPize URL
- Stars: 0 | Forks: 0
- Roundup outreach: 4/6 sent ✅
- MCP registry: validated ✅, needs login

**Blockers / needs Mat (⚠️ June 10 = PH launch + MCPize rate expiry):**
1. 🚧 **MCPize setup** — mcpize.com → account → list → connect Stripe (~30 mins); 85% rate expires June 10
2. 🚧 **MCPize confirmation email** → check inbox → `node scripts/activate-pro.js <url>`
3. 🚧 **Official MCP registry** → `mcp-publisher login github && mcp-publisher publish` (5 min; server.json now valid)
4. 🚧 **PH gallery image capture** → open `docs/ph-gallery/` in Chrome (~10 mins); see README
5. 🚧 **PH hunter DM** → `marketing/ph-hunter-outreach.md`
6. 🚧 **Nimbalyst + Agensi.io** → LinkedIn DM to Karl Wirth; Agensi.io web form

**Next autonomous action:**
All 10 launch channels have copy. Monitor PR merges; final launch prep now fully in Mat's hands (4 days to PH launch).
