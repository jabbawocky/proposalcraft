# Changelog

All notable changes to ProposalCraft are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions follow [Semantic Versioning](https://semver.org/).

---

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

[1.0.4]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.0.4
[1.0.3]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.0.3
[1.0.2]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.0.2
[1.0.1]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.0.1
[1.0.0]: https://github.com/jabbawocky/proposalcraft/releases/tag/v1.0.0
