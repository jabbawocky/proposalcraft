# 💼 Money Machine — Mission Status: June 7, 2026 (tick 24)

**Phase**: DEPLOY

**What shipped:**
- ✅ **Star campaign written** (`marketing/star-campaign.md`) — pre-launch GitHub star ask for Mat's close contacts. 3 copy-paste message variants (text/WhatsApp, Slack DM, email), target audience guidance, timing (Jun 9 evening before PH midnight). Stars before launch help PH ranking + directory listings. Goal: 20 stars before midnight PST Jun 9. Distinct from personal outreach email (that asks for installs; this asks for stars — different audience overlap and much lower friction: 10 seconds per star).
- ✅ **Duplicate actions cleaned** — 4 duplicates from Status Monitor tick resolved.
- ✅ **Landing page verified live** — jabbawocky.github.io/proposalcraft/ loads correctly. All credibility bar items showing. Stars counter at 0 — star campaign needed.
- ✅ **PR statuses checked** — punkpeye #7404 still open (clean/mergeable), all 4 other awesome-mcp PRs still open. No merges or new activity since last tick.
- ✅ **v1.0.4 GitHub Release published** — https://github.com/jabbawocky/proposalcraft/releases/tag/v1.0.4. Covers ticks 20-22: 12 bundled templates, upsell copy fix, dead Gumroad link fix, personal outreach email. Notifies repo watchers 3 days before PH launch; shows recent activity to directory bots.
- ✅ **Launch-day guide cleaned up** — OG image step marked done (was showing as an open task but was shipped tick 17). Night-before checklist now accurately reflects remaining human gates only.
- ✅ **Starter Pack section fixed** (`docs/index.html`) — removed broken `proposalcraft.gumroad.com/l/starter-pack` dead link. Section now accurately says "Free — bundled with ProposalCraft" with a `load_examples` CTA. No dead links on launch day.
- ✅ **Personal outreach email template** (`marketing/personal-outreach-email.md`) — 3 variants (standard, short, past-client angle) + subject lines + tips for sending to personal network. Highest-conversion channel for first installs.
- ✅ **Upsell copy corrected** (`src/index.ts` + `docs/index.html`) — `load_examples` success message no longer pitches "Want 12 templates?" to a user who just loaded all 12 templates. Pro upsell copy now correctly focuses on unlimited drafts (the real differentiator). Landing page Free tier now shows "12 bundled industry templates" as included (accurate). Rebuilt dist/. This closes a confusing UX loop created when all 12 templates were bundled last tick.
- ✅ **12 starter pack templates completed** (`sample-proposals/`) — all 11 missing templates written: mobile MVP, SaaS build, brand identity, SEO audit, API integration, e-commerce, content retainer, data dashboard, paid ads, tech consulting, video production (+ the existing web redesign). `load_examples` now ships full value on day 1. Starter Pack product is now real and deliverable. Templates ship in npm package (in `files` config).
- ✅ **Community response kit** (`marketing/community-response-kit.md`) — 15 pre-written replies covering setup, privacy, pricing objections, differentiation, HN/IH-specific pushback. Copy-paste ready for Jun 10 launch threads. Saves Mat 30-60 min of real-time typing on launch day.
- ✅ **Glama signup attempted** — email path hit bot detection (Cloudflare Turnstile, no OTP delivered). GitHub OAuth = browser login gate. Glama indexing remains a Mat gate (5-min GitHub OAuth).
- ✅ **Gumroad setup guide** (`docs/gumroad-setup.md`) — 5-min step-by-step for Mat to create ProposalCraft Pro at $19/mo on Gumroad (or Stripe Payment Link). Unblocks MCPize blocker without any architecture change. Once Mat posts the URL, worker runs `activate-pro.js` immediately.
- ✅ **OG image PNG generated** — `docs/og-image.png` (1200×630) created autonomously using orbitos-browser + pure-Python PNG crop. `og:image` and `twitter:image` in docs/index.html updated from `.svg` → `.png`. Twitter large-card images are now fully wired — no action needed from Mat.
- ✅ **MCPize architecture flag** — MCPize's "Quick Deploy" path hosts the server on their cloud (changes local-install architecture). Flagged for Mat's decision: MCPize as cloud host vs. Gumroad/Stripe Payment Link for local npm license. NOT deployed autonomously.
- ✅ **Twitter card fix** — changed `twitter:card` from `summary` to `summary_large_image` and added `twitter:image` meta tag.
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

**Blockers / needs Mat (⚠️ June 10 = PH launch, 3 days away — TODAY IS JUN 7):**
1. 🚧 **Pro checkout URL** — Gumroad OR Stripe Payment Link ($19/mo). Guide: `docs/gumroad-setup.md`. Once URL posted in any orbitos-task issue comment, worker runs `activate-pro.js` + pushes immediately.
2. 🚧 **GoDaddy domain renewal** — urgent; second notice Jun 4. Domain must be live on launch day.
3. 🚧 **NPM_TOKEN** → npmjs.com → Automation token → jabbawocky/proposalcraft → Settings → Secrets → Actions → NPM_TOKEN → re-run publish workflow
4. 🚧 **Official MCP registry** → `mcp-publisher login github && mcp-publisher publish` (5 min browser OAuth; server.json is valid)
5. 🚧 **Glama signup** → glama.ai/sign-up → GitHub OAuth → Add Server → paste `https://github.com/jabbawocky/proposalcraft`. Gets ProposalCraft indexed + quality score → unblocks punkpeye PR #7404 merge.
6. 🚧 **PH gallery image capture** → open `docs/ph-gallery/` in Chrome (~10 mins); see README
7. 🚧 **PH hunter DM** → `marketing/ph-hunter-outreach.md`
8. 🚧 **Nimbalyst + Agensi.io** → LinkedIn DM to Karl Wirth; Agensi.io web form

**Next autonomous action:**
All launch assets complete. Star campaign written (the final marketing gap). 3 days to PH launch. All remaining work requires Mat: Pro URL, GoDaddy, GitHub 2FA, NPM_TOKEN, MCP registry, Glama OAuth. Worker watching for any newly unblocked items each tick.
