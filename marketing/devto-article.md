# I Built an MCP Server That Drafts Client Proposals in My Voice — Here's Why MCP Was the Right Call

**Tags:** `mcp` `claude` `freelance` `productivity` `typescript`

**Cover image suggestion:** Screenshot of a proposal being drafted in Claude Desktop

---

Freelance math is brutal.

You win roughly 1 in 4 pitches. That means for every client you close, you've written 3 proposals that earned you nothing. At 1-2 hours per proposal, you're spending 6-12 hours **unpaid** per deal closed.

I got tired of it. So I built [ProposalCraft](https://github.com/bradshawprojects/proposalcraft) — an MCP server that drafts client proposals in 30 seconds, in my voice, using my past winning work as the template.

Here's how I built it, why I chose MCP over a web app, and what I'd do differently.

---

## What It Does

ProposalCraft is a [Model Context Protocol](https://modelcontextprotocol.io/) server for Claude Desktop. The workflow:

1. Save 2-3 of your past winning proposals with the `save_proposal` tool
2. When a new brief comes in, paste it into Claude
3. Ask Claude to draft a proposal — ProposalCraft retrieves your examples as style guides

The output sounds like you wrote it, because it learned from you.

```
You: "Here's a brief from a startup wanting a Shopify redesign. Draft a proposal using my past work."

Claude: [ProposalCraft retrieves your saved proposals, drafts a proposal in your voice, 
         matching your structure, tone, and pricing approach]
```

Seven tools total: `draft_proposal`, `analyze_brief`, `save_proposal`, `get_proposal`, `list_proposals`, `delete_proposal`, `load_examples`.

---

## Why MCP Instead of a Web App

This was the key design decision. My options were:

- **Web app** — OAuth, database, frontend, hosting, ops. 4-6 weeks. Monthly server costs.
- **CLI tool** — simpler, but isolated. No AI context. User has to pipe output manually.
- **MCP server** — plugs directly into Claude Desktop. Zero backend. Zero ops. Proposes to client, stays in conversation context.

MCP won because of two things:

**1. Zero infrastructure.** The server runs locally on the user's machine via `npx`. There's no database to manage, no cloud costs, no auth system. My entire backend is the filesystem.

**2. Context stays intact.** With a web app, the user writes a prompt in Claude, switches tabs to a proposal tool, copies output, pastes back. With MCP, the whole flow happens in one Claude conversation. Claude can analyze the brief *and* draft the proposal *and* iterate based on follow-up questions — all in context.

The trade-off: users need Claude Desktop. That cuts the TAM vs a web app. But it also means I'm targeting the exact right ICP — freelancers who already use AI daily.

---

## How I Built It

The stack: TypeScript, the official `@modelcontextprotocol/sdk`, and the filesystem.

**Project structure:**
```
proposalcraft/
  src/
    index.ts      # MCP server + tool definitions
  dist/           # Compiled output (committed so npx works from GitHub)
  sample-proposals/
  smithery.yaml
```

**Key pattern — tool registration:**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "proposalcraft",
  version: "1.0.1"
});

server.tool(
  "draft_proposal",
  "Draft a client proposal in your voice based on saved winning proposals",
  {
    brief: z.string().describe("The client brief or project description"),
    proposal_name: z.string().optional().describe("Name for saving the draft")
  },
  async ({ brief, proposal_name }) => {
    const proposals = await loadSavedProposals();
    const context = proposals.map(p => `--- ${p.name} ---\n${p.content}`).join('\n\n');
    
    return {
      content: [{
        type: "text",
        text: `I found ${proposals.length} saved proposals to use as style guides.\n\n` +
              `Brief: ${brief}\n\n` +
              `Your past proposals:\n${context}\n\n` +
              `Please draft a new proposal in the same voice and structure as these examples.`
      }]
    };
  }
);
```

The tool doesn't call any external APIs — it retrieves context and lets Claude's existing session handle the actual drafting. That's how we avoid needing an `ANTHROPIC_API_KEY`.

**Install is one JSON block:**

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

That goes in `~/Library/Application Support/Claude/claude_desktop_config.json` on Mac. Restart Claude Desktop and the tools appear automatically.

---

## What I'd Do Differently

**Ship the `analyze_brief` tool earlier.** This turned out to be the most valuable tool — it reads a brief and extracts budget signals, red flags, scope creep risks, and clarifying questions *before* drafting. Freelancers told me they'd use this alone even without the drafting step.

**Don't commit node_modules, do commit dist/.** First version had this backwards. For `npx github:user/repo` to work without a build step, you need `dist/` in the repo. Nothing else.

**Fix the path traversal bug on day 1.** I discovered a security issue: `get_proposal` and `delete_proposal` were joining user-supplied filenames directly to the proposals directory, which allowed `../../../etc/passwd`-style reads. Fixed with a `safeFilepath()` check in v1.0.1. If you build any MCP server that reads local files, sanitise filenames before every filesystem call.

---

## Results So Far

Honest state: just launched, pre-distribution. PRs open on several awesome-mcp-servers lists. GitHub stars: 0 (baseline). Revenue: $0, free tier only for now.

What's working: the MCP distribution model is genuinely zero-friction. No auth, no onboarding, no dashboard. First-time users go from "never heard of it" to drafting a proposal in under 3 minutes.

---

## Try It

- **GitHub:** https://github.com/bradshawprojects/proposalcraft
- **Landing page:** https://bradshawprojects.github.io/proposalcraft/

If you're a freelancer using Claude Desktop, try it and tell me what's missing. The whole thing is MIT licensed.

Next build: **StandupCraft** — same pattern but for daily standups and weekly client progress reports. If the freelance MCP niche has legs, that's the natural extension.

---

*Built with TypeScript, the MCP SDK, and the filesystem. No API keys. No cloud costs. No ops.*
