# 💼 Money Machine — Mission Status: June 6, 2026 (tick 8)

**Phase**: DEPLOY

**What shipped:**
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
