# Why I removed the Anthropic SDK from my MCP server (and why you probably should too)

*Cross-post to: dev.to, Hashnode, r/ClaudeAI, r/mcp*

---

When I first built [ProposalCraft](https://github.com/jabbawocky/proposalcraft) — an MCP server that drafts client proposals in your voice from your past winning work — the architecture felt obvious: use the Anthropic SDK to make API calls directly from the server.

It was a mistake. Here's what I learned.

## The original design

Version 0.x looked like this:

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await client.messages.create({
  model: "claude-opus-4",
  max_tokens: 2048,
  messages: [{ role: "user", content: prompt }],
});
```

Simple enough. The `draft_proposal` tool would call the SDK, get a response, return it. Done.

## The problem

Three problems surfaced immediately once I shared it:

**1. Users needed two API keys.** They already had a Claude Desktop subscription — that's why they installed an MCP server in the first place. But to use ProposalCraft, they also needed an `ANTHROPIC_API_KEY` from the API console. That's a second Anthropic account, a credit card, and a confusing "wait, I'm already paying for Claude" conversation.

**2. The install friction was brutal.** `npx -y github:jabbawocky/proposalcraft` was the pitch. But then: "also set `ANTHROPIC_API_KEY` in your MCP config." Every extra env var is a drop-off point.

**3. I was duplicating what Claude Desktop already does.** The whole point of MCP is that the host (Claude Desktop) manages the LLM connection. My server was spinning up its own parallel connection. It worked, but it was architecturally backwards.

## The fix: let Claude do the thinking

The MCP protocol has a clean answer to this. Your tools don't need to call an LLM. They return data. Claude — already running in the host — decides what to do with it.

The new `draft_proposal` tool looks like this:

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "draft_proposal") {
    const { brief, style_notes } = request.params.arguments as {
      brief: string;
      style_notes?: string;
    };

    // Load saved proposals from local storage
    const examples = loadProposalExamples();
    
    // Return structured context — Claude does the drafting
    return {
      content: [
        {
          type: "text",
          text: buildDraftingPrompt(brief, examples, style_notes),
        },
      ],
    };
  }
});
```

`buildDraftingPrompt` assembles a rich context block: the client brief, 2-3 of the user's past winning proposals (loaded from `~/.proposalcraft/proposals/`), and any style notes. It returns that as a text block.

Claude sees the tool result, reads the context, and drafts the proposal in its response — using the user's existing Claude session, with no extra API call, no extra billing, no extra setup.

## What changed

- **Zero env vars required.** The MCP config went from this:

```json
{
  "mcpServers": {
    "proposalcraft": {
      "command": "npx",
      "args": ["-y", "github:jabbawocky/proposalcraft"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

to this:

```json
{
  "mcpServers": {
    "proposalcraft": {
      "command": "npx",
      "args": ["-y", "github:jabbawocky/proposalcraft"]
    }
  }
}
```

- **One subscription, not two.** Users pay for Claude Desktop. That's it.
- **Better output quality.** When Claude does the drafting as part of its main response, it has full context about the conversation. The SDK approach made isolated API calls that couldn't see the broader session.

## The trade-off

Your tool no longer controls the model, temperature, or max tokens. You're trusting Claude to interpret the context block correctly.

In practice, for a drafting use case, this is fine — Claude is good at following structured prompts. But if you need precise output format control (e.g., returning JSON that gets parsed downstream), you'll want to be explicit in your prompt about the expected format.

## The broader principle

MCP tools are best thought of as **context injectors**, not LLM wrappers. Your job is to fetch the right data, format it well, and hand it back. Let the host model do the reasoning.

If you find yourself reaching for `@anthropic-ai/sdk` inside an MCP server, ask: is this actually a tool, or is it a feature that belongs in the system prompt?

---

**ProposalCraft** is free, MIT licensed, no API key, one-line install. If you write proposals for clients, [give it a try](https://github.com/jabbawocky/proposalcraft).

*Built this? Questions? GitHub issues or open a discussion.*
