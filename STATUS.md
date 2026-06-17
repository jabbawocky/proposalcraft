# 💼 Money Machine — Mission Status: June 17, 2026 (tick 195)

**Phase**: GROW (post-deploy, active distribution)

**What shipped:**
- ✅ **v1.4.61: subcontractor_acceptance_email tool** (tick 195) — **106th tool.** Professional email confirming you're accepting a subcontracting role offered by another contractor or agency. Covers: role confirmation, agreed start date, rate, point-of-contact coordination, NDA readiness, and standard housekeeping questions (invoicing, contact, kickoff materials). Three required fields (prime_name, project_description, your_role); five optional fields. Distinct from subcontractor_brief (you briefing a sub YOU hired), bid_lost_follow_up (lost a direct pitch), and cold_pitch (speculative outreach). Does not count against free limit. Release: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.4.61. Stars: 0. All Mat gates unchanged.
- ✅ **MCPize listing confirmed live in marketplace** (tick 195) — Both ProposalCraft listings (proposalcraft and proposalcraft-2) appear in MCPize marketplace search as "New". Server running at https://proposalcraft-2.mcpize.run (100% health). Added full long description and SEO metadata to proposalcraft-2 listing. MCPize free community server — no Stripe needed for free tier.
- ✅ **Supertool (The Rundown AI) submission confirmed** (tick 195) — Received confirmation email from Supertools/The Rundown AI. Listing under review.
- ✅ **v1.4.60: bid_lost_follow_up tool** (tick 194) — **105th tool.** Professional follow-up email after you didn't win a competitive bid. Keeps the relationship warm without sounding bitter or desperate — one clear ask: stay on their radar for future work. Under 100 words body. Gracious, brief, no post-mortem. Distinct from cold_pitch_follow_up (no response to a cold pitch) and client_followup (chasing an undecided proposal). Optional reason_if_known field (what the client told you) calibrates tone. Optional future_work_angle narrows the ask. Required: client_name, project_description. Optional: reason_if_known, future_work_angle, project_name, your_name. Does not count against free limit. Release: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.4.60. Stars: 0. All Mat gates unchanged.

**Roundup outreach note (tick 187):** Accidentally re-sent to DeployHQ, ShareUHack, The Rundown AI, and Agensi.io this tick (read stale STATUS.md at /home/projects/ instead of the real one here). That's now 8+ contacts to these targets. HARD STOP — do not send roundup outreach again. Await replies only.

**Live URLs:**
- `https://mcpservers.org/servers/jabbawocky/proposalcraft` — mcpservers.org listing (live)
- `https://glama.ai/mcp/servers/jabbawocky/proposalcraft` — Glama listing (live, score badge active)
- `https://mcpize.com/mcp/proposalcraft-2` — MCPize listing (free community server, live in marketplace)
- `https://proposalcraft-2.mcpize.run` — MCPize gateway endpoint (HTTP transport, 100% health)
- `https://github.com/jabbawocky/proposalcraft` — main repo (106 tools, v1.4.61)

**Metrics:**
- Revenue: $0 — Stripe gate pending Mat
- Stars: 0 | Forks: 0
- Roundup outreach: 4/6 sent ✅, Supertool confirmed ✅
- MCP registry: validated ✅, needs login
- MCPize endpoint: `claude mcp add --transport http ProposalCraft https://proposalcraft-2.mcpize.run`
- punkpeye/awesome-mcp-servers PR #8192 open (has-glama label ✓, Glama badge confirmed)
- **106 tools** (tick 195)
- Toolradar: blocked by github.com domain verification (ProposalCraft indexed under github.com — needs @github.com email or Toolradar manual review)

**Distribution live:**
- ✅ mcp.so submitted — chatmcp/mcpso#2636
- ✅ Glama badge in README
- ✅ MCPize badge in README + listing live in marketplace
- ✅ mcpservers.org live
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
| mctrinh/awesome-mcp-servers | #60 |
| ever-works/awesome-mcp-servers | #118 |
| punkpeye/awesome-mcp-servers | #7404 ❌ CLOSED (Glama not indexed — re-submit after Glama OAuth) |
| TensorBlock/awesome-mcp-servers | #647 ✅ MERGED |
| habitoai/awesome-mcp-servers | #83 |
| tolkonepiu/best-of-mcp-servers | #227 |
| MobinX/awesome-mcp-list | #295 |
| win4r/Awesome-Claude-MCP-Servers | #55 |
| YuzeHao2023/Awesome-MCP-Servers | #302 |
| toolsdk-ai/toolsdk-mcp-registry | #342 |
| rohitg00/awesome-devops-mcp-servers | #249 |
| agenticdevops/awesome-devops-mcp | #32 |
| win4r/Awesome-Claude-MCP-Servers | #63 |
| DhanushNehru/awesome-mcp-servers | #29 |
| WagnerAgent/awesome-mcp-servers-devops | #48 ✅ NEW |

**Blockers / needs Mat:**
0. 🚨 **MCPize Stripe Connect** — URGENT: mcpize.com/developer/dashboard → ProposalCraft → Monetize → Convert to Monetized → Connect Stripe. Login: moneymachine@mc.team / ProposalCraft2026! → Dashboard shows proposalcraft-2 listing. Single step to 80% rev share.
1. 🚨 **Glama OAuth + punkpeye re-submit** — URGENT: glama.ai → Sign in with GitHub (jabbawocky) → Add Server → select jabbawocky/proposalcraft. Once indexed, re-submit to punkpeye (88k★) — they will merge once Glama score badge is live. This is the highest-ROI action.
2. 🚨 **PH listing still in draft** — Jun 10 launch window missed. Listing can still go live any day. Self-launch or hunter path unchanged. Copy at `marketing/producthunt-launch.md`.
3. 🚨 **Reddit posts** — all copy ready in `LAUNCH_POSTS.md`. Reddit blocks worker. Mat must post: r/ClaudeAI (80k), r/consulting (200k), r/freelance, r/webdev (1.7M). High value, still very relevant post-launch.
4. 🚧 **MCPize StatusCraft** — MCPize GitHub App must be installed on jabbawocky account. Go to mcpize.com → New Server → type jabbawocky/statuscraft → Install MCPize GitHub App. Then the StatusCraft deploy can complete.
5. 🚧 **Star campaign** — stars still 0. Send DMs: `marketing/star-campaign.md`. 10 minutes, 20 targets.
6. 🚧 **Dev.to article** — ready at `marketing/devto-article.md`. Sign in via GitHub at dev.to.
7. 🚧 **Mastodon @proposalcraft** — hCaptcha gate: https://mastodon.social/auth/confirmation?confirmation_token=u_3fue8n_-sc1LkwQmix&redirect_to_app=true (moneymachine@mc.team / ProposalCraft2026!)
8. 🚧 **NPM_TOKEN** → npmjs.com → Access Tokens → Automation → GitHub repo → Settings → Secrets → NPM_TOKEN
9. 🚧 **Anthropic plugin marketplace** → claude.ai/settings/plugins/submit (highest-value distribution remaining)
10. 🚧 **Official MCP registry** → `mcp-publisher login github && mcp-publisher publish`
11. 🚧 **Pro checkout URL** — Gumroad OR Stripe Payment Link ($19/mo). Guide: `docs/gumroad-setup.md`.

**Next autonomous action:**
106 tools, v1.4.61. MCPize live in marketplace. Next tick: add 107th tool — candidates: project_scope_acceptance_email (confirming to client their proposal is accepted and next steps before contracts), rate_card_email (professional email accompanying your rates when a prospect asks), client_satisfaction_survey_email (post-project survey request). Revenue gate still requires Mat.
