# r/n8n + r/n8n_ai_agents — ProposalCraft post

**NEW CHANNEL — not previously targeted.**

| Subreddit | Members | Audience |
|---|---|---|
| r/n8n | ~100k | Workflow automation builders |
| r/n8n_ai_agents | Smaller, active | AI agent + n8n power users |

**Why this channel:** People in these communities are actively building n8n workflows to automate client proposal writing (confirmed: Medium article "How I Put My Upwork Proposals on Autopilot Using an AI Agent" was shared to r/n8n_ai_agents). ProposalCraft does the same thing natively in Claude Desktop — no n8n setup, no workflow maintenance, no nodes to debug. We're the simpler path for their actual goal.

**Free to fire NOW:** Yes — builder/dev audience, no payment path required.
**Best time:** Tuesday–Thursday 9am–12pm UTC

---

## Post for r/n8n

**Title:** Replaced my n8n proposal workflow with an MCP server — way less to maintain

**Body:**

Built n8n automations for a few client-facing workflows. They work, but every time Claude updates something or an API changes, I'm back in the node editor fixing the chain.

Finally just built a dedicated MCP server for the part I touched most: client proposals.

**ProposalCraft** connects directly to Claude Desktop — paste a brief, it drafts in your voice using your past winning proposals as examples. No n8n workflow to maintain, no external API calls, nothing breaks.

The flow:
1. `save_proposal` — load 1–3 past proposals that won work
2. Paste client brief into Claude
3. `analyze_brief` — extracts budget signals, red flags, scope creep risks, questions to ask
4. `draft_proposal` — generates a full proposal matching your style and the brief

Everything runs locally. Proposals stored as files on your machine. No cloud backend.

Install is one JSON config block:

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

8 tools total — free tier covers most of it (draft_proposal gates at 5/month, everything else unlimited). Repo: https://github.com/bradshawprojects/proposalcraft

For anyone maintaining n8n proposal pipelines — happy to compare approaches. Curious how others are handling the "AI updated and broke my workflow" problem.

---

## Post for r/n8n_ai_agents (shorter variant)

**Title:** MCP alternative to n8n proposal automation — anyone tried this approach?

**Body:**

Saw the Upwork proposal autopilot post here a while back. Same pain point, different approach — I built an MCP server instead of an n8n workflow.

**ProposalCraft:** paste a client brief into Claude Desktop, it drafts a proposal in your voice from your past work. `analyze_brief` tool extracts red flags + scope risks first. Everything local, no backend.

GitHub: https://github.com/bradshawprojects/proposalcraft

The main difference from n8n: nothing to maintain. No nodes, no webhook endpoints, no "it worked last week" debugging sessions. Tradeoff: requires Claude Desktop (not browser/API).

Curious if others have gone down the dedicated MCP server route vs wiring n8n to Claude. What's your setup?

---

## Prepared responses

**"Why not just use n8n with Claude?"**
> You can — and if you're already in n8n, that's probably the right call. The MCP approach makes sense when: (1) you want the tool available in every Claude conversation without manually triggering a webhook, (2) you don't want to maintain the workflow when Claude updates, or (3) you care about proposals staying local and not passing through a cloud backend. Different tradeoffs, same goal.

**"Does it work with other AI models?"**
> Claude Desktop only right now — MCP is Anthropic's protocol, though the spec is open. The model sees your proposals via context injection, not an external API call, so there's no API key or billing separate from your Claude subscription.

**"What makes it better than just prompting Claude directly?"**
> Persistence. The tools maintain a local library of your proposals, run structured brief analysis every time, and track monthly usage. You could replicate it with a long system prompt, but ProposalCraft makes it repeatable without remembering to paste context every session.

---

## Why this channel hasn't been used yet

The previous growth work focused on MCP-specific awesome-lists and freelancer communities. r/n8n and r/n8n_ai_agents sit at the intersection: technical enough to understand MCP, already feeling the pain of maintaining AI workflows, actively looking for simpler alternatives. It's an unclaimed space.

Estimated time to post: 3 minutes per subreddit.
