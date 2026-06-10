# Changelog

All notable changes to ProposalCraft are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions follow [Semantic Versioning](https://semver.org/).

---

## [1.1.7] — 2026-06-10

### Added
- `budget_proposal` tool — when a client says your quote is too high, generates a revised proposal with a reduced scope at a lower price — not a rate cut. Holds your rate while giving the client a path forward. Clearly separates what stays vs. what becomes a Phase 2 add-on. Counts against the monthly draft limit.

[1.1.7]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.1.7

## [1.1.6] — 2026-06-10

### Added
- `rejection_response` tool — writes a professional reply when a client picks another provider. Gracious, brief (≤80 words), keeps the door open without grovelling. Closes the full proposal lifecycle: pitch → rejection → gracious response → future opportunity. Does not count against the monthly draft limit.

[1.1.6]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.1.6

## [1.1.5] — 2026-06-10

### Added
- `cold_pitch` tool — writes a cold outbound pitch email to a potential client you've identified. Takes the company, contact name, what you do, and the specific signal you spotted (a problem on their site, a job listing, a recent launch). Generates a subject line and a ≤120-word email that opens on them, not on you. Completes the full BD loop alongside the inbound proposal tools. Does not count against the monthly draft limit.

[1.1.5]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.1.5

## [1.1.4] — 2026-06-10

### Added
- `invoice_reminder` tool — writes a polite but firm reminder for an overdue invoice. Pass `reminder_number` 1, 2, or 3 to get the right escalating tone: #1 assumes an oversight, #2 asks for confirmation of payment date, #3 flags next steps without threats. Generates a subject line and email body under 120 words. Does not count against the monthly draft limit.

[1.1.4]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.1.4

## [1.1.3] — 2026-06-10

### Added
- `rate_increase_email` tool — writes the email every freelancer dreads: telling a client your rates are going up. States the new rate plainly, no apology, no over-explanation, warm tone. Under 150 words. Does not count against the monthly draft limit.

[1.1.3]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.1.3

## [1.1.2] — 2026-06-10

### Added
- `retainer_proposal` tool — drafts a proposal for an ongoing monthly retainer engagement. Covers monthly scope, explicit exclusions, how-it-works (task prioritisation, rollover policy), payment terms, and a 30-day rolling termination clause. Structurally different from project proposals — designed for freelancers who want to lock in recurring monthly revenue. Counts against the monthly draft limit.

[1.1.2]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.1.2

## [1.1.1] — 2026-06-10

### Added
- `testimonial_request` tool — writes a short, personal email asking a client for a testimonial after project delivery. Under 150 words, no filler openers, no "no pressure." Completes the full post-delivery loop. Does not count against the monthly draft limit.

[1.1.1]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.1.1

## [1.1.0] — 2026-06-10

### Added
- `discovery_call_prep` tool — prepares a discovery call guide from a client brief. Generates a call agenda, the 3 must-confirm items before proposing, grouped questions (budget, timeline, problem, scope, competitor), tone notes, and red flags to probe. Closes the gap between `analyze_brief` and `draft_proposal`. Does not count against the monthly draft limit.

[1.1.0]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.1.0

## [1.0.9] — 2026-06-10

### Added
- `change_order` tool — generates a formal change order document when a client requests work outside the original project scope. Defines what was agreed, what is being added, additional cost, timeline impact, and includes a client sign-off block. Protects you from unbounded scope creep. Does not count against the monthly draft limit.

[1.0.9]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.0.9

## [1.0.8] — 2026-06-10

### Added
- `project_kickoff_email` tool — writes a professional project kickoff email to send immediately after winning a project. Confirms deliverables, timeline, and price; introduces your working process; lists the next 2–3 immediate actions. Completes the full workflow: brief → proposal → win → kickoff → scope of work. Does not count against the monthly draft limit.

[1.0.8]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.0.8

## [1.0.7] — 2026-06-10

### Added
- `proposal_to_email` tool — converts a full proposal into a ≤150-word pitch email with subject line. Distills problem, solution, price, and call to action into something a client can read in 60 seconds and forward to decision-makers. Does not count against the monthly draft limit.

[1.0.7]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.0.7

## [1.0.6] — 2026-06-10

### Added
- `scope_of_work` tool — converts an accepted proposal into a formal SOW with deliverables table, milestone timeline, payment schedule, revision policy, change-order clause, and signature block. Does not count against the monthly draft limit.
- Tools reference table in README (was a bullet list) — now shows all 11 tools with descriptions and whether each counts against the free-tier limit.

[1.0.6]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.0.6

## [1.0.5] — 2026-06-10

### Added
- `improve_proposal` tool — reviews a proposal draft and returns structured critique: strengths, critical fixes with drop-in revised text, and polish suggestions. Optional `focus` parameter targets a specific section (pricing, opening hook, why-me, scope). Does not count against the monthly draft limit.
- `client_followup` tool — writes a short, non-pushy follow-up for proposals awaiting a response. Adapts urgency and tone to elapsed time. No filler openers, no apologies.
- `CHANGELOG.md` — full version history in Keep a Changelog format
- `SECURITY.md` — responsible disclosure policy and security model documentation
- Animated demo GIF in README — visual of the brief→proposal workflow
- Fazier backlink in landing page footer

## [1.0.4] — 2026-06-06

### Added
- 12 bundled industry proposal templates (web redesign, mobile MVP, SaaS build, brand identity, SEO audit, API integration, e-commerce, content retainer, data dashboard, paid ads, tech consulting, video production) — loaded via `load_examples` with no upsell
- Docker MCP registry manifest (`servers/proposalcraft/server.yaml`) for Docker Desktop MCP catalog

### Fixed
- `load_examples` success message no longer pitches templates to a user who just loaded them — Pro upsell now focuses on unlimited drafts
- Landing page Free tier copy now correctly states "12 bundled industry templates" as included
- Removed dead link to `proposalcraft.gumroad.com/l/starter-pack`
- Pro upgrade CTAs now point to `PRO_URL` instead of hard-coded `PRO_MAILTO`
- Version mismatch between `package.json` and `src/index.ts` corrected

## [1.0.3] — 2026-06-05

### Added
- `server.json` for submission to the official MCP registry (modelcontextprotocol.io)
- Glama badge in README
- Product Hunt gallery assets (`docs/ph-gallery/`) — 4 images including animated core-loop GIF
- OG image and Twitter large-card meta tags for landing page
- CONTRIBUTING.md — setup guide, code style, security contact
- GitHub issue templates (bug report, feature request)
- GitHub Discussions enabled
- 20 npm keywords for improved registry discoverability

### Changed
- All repository URLs updated to `jabbawocky/proposalcraft` after ownership transfer
- Pro upgrade prompt copy sharpened with founding-rate urgency
- CI updated to Node 22 LTS ahead of GitHub's forced Node 20 deprecation (Jun 16)

### Fixed
- `server.json` description trimmed to 84 chars (was 205, failing registry validation with 422)
- Repository homepage URL corrected from old `bradshawprojects.github.io` URL

## [1.0.2] — 2026-06-04

### Added
- 5 drafts/month free tier gate — usage tracked in `~/.proposalcraft/usage.json`
- `usage_status` tool — lets Claude report remaining free drafts mid-conversation
- README pricing section: Free (5 drafts/mo) · Pro ($19/mo) with Tally early-access link

### Fixed
- Off-by-one error in remaining-drafts message

## [1.0.1] — 2026-06-03

### Added
- `load_examples` tool — bootstraps new users with bundled sample proposals so the library is never empty on first install
- Automated npm publish workflow (GitHub Actions)
- Tally Pro waitlist form wired into `activate-pro.js`

### Changed
- Security hardening pass

## [1.0.0] — 2026-06-02

### Added
- `analyze_brief` — pre-proposal intel: budget signals, red flags, scope risks, go/no-go recommendation
- `draft_proposal` — draft a proposal from a client brief using your saved examples as style reference
- `save_proposal` — add a winning proposal to your reference library
- `list_proposals` — list all saved proposals
- `get_proposal` — read the full content of a saved proposal
- `delete_proposal` — remove a proposal from the library
- Local-only storage in `~/.proposalcraft/` — no API key, no cloud, no data sent anywhere
- Claude Desktop config snippet in README

[1.0.5]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.0.5
[1.0.4]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.0.4
[1.0.3]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.0.3
[1.0.2]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.0.2
[1.0.1]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.0.1
[1.0.0]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.0.0
