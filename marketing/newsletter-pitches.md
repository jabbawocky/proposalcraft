# Newsletter Submission Pitches

Ready-to-send email submissions for newsletter features. Send from Mat's personal email.

---

## Indie Dev Monday

**To:** newsletter@indiedevmonday.com
**Subject:** Indie dev here — built an MCP server for freelance proposals

Hi Josh,

Long-time reader. I built something that might be a good fit for a future issue.

**ProposalCraft** is an open-source MCP server for Claude Desktop that drafts client proposals in your voice. You save 2-3 of your past winning proposals, paste a new brief, and Claude drafts the new one using your examples as a style guide. 30 seconds vs 2 hours.

Unusual part: it's distributed as an MCP server, not a web app. Zero backend, zero ops — installs via one JSON block in Claude's config. Everything runs locally, proposals never leave the machine.

- GitHub: https://github.com/jabbawocky/proposalcraft
- Landing: https://jabbawocky.github.io/proposalcraft/
- License: MIT, free to use

Happy to do a quick write-up on the build story (why MCP over a web app, the path traversal bug I had to fix, etc.) if you think it'd fit.

Cheers,
Mat

---

## TLDR Newsletter (developer audience, 1M+ subscribers)

**Submission form:** https://tldr.tech/tech/newsletter  
**Category:** Open source / Dev tools

**One-line pitch:**
ProposalCraft — free MCP server for Claude Desktop that turns client briefs into ready-to-send proposals in 30 seconds, using your past winning proposals as style guides. MIT licensed.

**Link:** https://github.com/jabbawocky/proposalcraft

---

## Console.dev (devtools-focused newsletter)

**Submission:** https://console.dev/tools/
**Category:** Productivity / AI

**Tool name:** ProposalCraft
**Description:** Open-source MCP server for Claude Desktop. Freelancers and consultants save their past winning proposals; ProposalCraft drafts new ones in the same voice when given a client brief. Runs entirely locally — no API key, no cloud storage, no subscription.
**URL:** https://github.com/jabbawocky/proposalcraft
**What's interesting:** Uses MCP (Model Context Protocol) as distribution — zero backend, plugs directly into Claude Desktop's context. Opposite approach to SaaS proposal tools like Bonsai or Qwilr.

---

## Changelog.com (software podcast + newsletter)

**Contact:** news@changelog.com
**Subject:** Open source tool: ProposalCraft MCP server

ProposalCraft is a new open-source MCP server (TypeScript, MIT) that plugs into Claude Desktop and generates client proposals from past winning examples. It's a practical demonstration of MCP as a zero-ops distribution model — no server, no auth, no API key required. 

Repo: https://github.com/jabbawocky/proposalcraft

Might be of interest given the MCP ecosystem is picking up steam (97M monthly SDK downloads as of March 2026).
