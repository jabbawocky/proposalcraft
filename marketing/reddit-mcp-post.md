# r/mcp — ProposalCraft launch post

**Subreddit:** r/mcp (89k members)
**Category:** Free-to-fire NOW — no payment path needed
**Best time:** Tuesday or Wednesday 9–11am AEST (aligns with US morning, r/mcp's peak)
**Note:** This community BUILDS MCP servers. Lead with architecture decisions, not features.
Talk to them like engineers. They will look at the source code. Make it worth looking at.
**Priority:** HIGH — only MCP-specific subreddit at this scale. Every member already has Claude Desktop + MCP configured. This is the highest-density ICP on Reddit.

---

**Title:** Show r/mcp: I built a freemium MCP server for freelancers — 8 tools, local-only storage, TypeScript, MIT

**Body:**

Been lurking here a while. Time to share.

**ProposalCraft** — an MCP server that drafts client proposals from your past winning work, without touching a cloud or requiring an Anthropic API key.

**Why it's interesting for this community:**

The design constraint I gave myself: everything has to work with zero additions to the user's existing Claude Desktop setup. No extra API key, no backend, no cloud storage. Just the MCP protocol + Claude's existing context window.

That means:
- Proposals stored as local `.md` files in `~/.proposalcraft/`
- Tools pass file content as context into the Claude session doing the drafting
- Usage tracking via a local `~/.proposalcraft/usage.json` (for the freemium gate)
- No Anthropic SDK in the dependency tree — Claude does all the inference

**The 8 tools:**

| Tool | What it does |
|---|---|
| `analyze_brief` | Extracts budget signals, red flags, scope risks, clarifying questions from a new brief |
| `draft_proposal` | Loads saved proposals as style examples + drafts against the brief |
| `save_proposal` | Saves a winning proposal to the local library |
| `load_examples` | Bulk-loads starter templates into your library (solves cold-start) |
| `get_proposal` | Reads a specific saved proposal by name |
| `list_proposals` | Lists saved proposals with metadata |
| `delete_proposal` | Removes a proposal from the library |
| `usage_status` | Shows X/5 drafts used this month |

**The monetisation layer:**

`draft_proposal` is gated at 5 calls/month. Everything else is unrestricted. Usage is tracked locally — no phone-home, no server-side auth. The gate is pure client-side trust but for this use case (professional freelancers), honour system is fine. Pro at $19/mo removes the gate.

Curious how others here have handled freemium gates in MCP — client-side trust vs some kind of token validation?

**Source + install:**

```json
{
  "mcpServers": {
    "proposalcraft": {
      "command": "npx",
      "args": ["-y", "github:bradshawprojects/proposalcraft"]
    }
  }
}
```

GitHub (MIT, TypeScript): https://github.com/bradshawprojects/proposalcraft
Landing: https://bradshawprojects.github.io/proposalcraft/

Happy to talk through any of the design decisions — especially the "no SDK" choice and the local-file-as-context-injection pattern. It's a pattern that generalises well for any tool that manages user content.

---

**Prepared responses for likely threads:**

**"How does the freemium gate work without a server?"**
> Entirely local. `~/.proposalcraft/usage.json` tracks `{ month: "YYYY-MM", count: N }`. On each `draft_proposal` call it checks count vs limit, resets if the month has rolled over. No server-side validation. For a tool targeting professional freelancers, the assumption is they're not going to hack a local JSON file to avoid $19/mo — but I'm curious if others have done this differently.

**"Why not publish to npm?"**
> Package name `proposalcraft` is unclaimed. I'm holding off until a payment path is wired (MCPize or Gumroad) so the npm publish coincides with a bigger distribution push rather than landing without monetisation. The GitHub install via `npx github:...` works clean in the meantime.

**"Have you submitted to Smithery/Glama?"**
> smithery.yaml is committed. `mcpservers.org` submitted (ID 2974). `mcp.directory` submitted. Still working on Glama — need to get the listing URL first, then it unblocks a PR on punkpeye's awesome-mcp-servers list.

**"What's the plan for Smithery indexing?"**
> smithery.yaml is there but Smithery doesn't crawl repos — requires a manual submission at smithery.ai/new. On the list. If anyone knows the current SLA on their review queue, I'd appreciate the intel.

**"Why local files instead of a vector DB or embedded store?"**
> Simplicity for v1. The proposal library is small (5-20 files), doesn't need semantic search — Claude can read all of them in context. A vector DB adds a dependency, a build step, and platform assumptions. If the library grows to 100+ proposals, that changes, but that's a good problem to have.

**"Is the Dockerfile just for Glama?"**
> Yes. Added it to satisfy Glama's automated smoke test — they require either Docker or a hosted endpoint. The MCP server itself runs fine without it.

---

**Additional targeting notes:**

- Post in r/mcp AND consider cross-posting to r/ClaudeAI (different audiences, not redundant)
- r/mcp mods have historically been fine with "Show r/mcp" posts for real tools
- The freemium gate question at the end is genuine — this community will have good answers and it keeps the thread alive past the initial post
- Flair: "Project" or "Show r/mcp" if available
