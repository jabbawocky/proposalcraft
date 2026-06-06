# What is an MCP server? (And why freelancers should care)

*Cross-post to: IH, dev.to, Hashnode, personal blog — target: non-technical freelancers curious about Claude Desktop*

---

If you've started using Claude for work, you may have seen the term "MCP server" appear and wondered what it means. This post explains it in plain English — and why it matters if you write client proposals.

## Claude Desktop is more powerful than the browser version

Most people use Claude at claude.ai in their browser. Claude Desktop (the downloadable app) looks similar but has one major difference: it can connect to **tools on your local machine**.

These tools are called **MCP servers**. MCP stands for Model Context Protocol — Anthropic's standard for giving Claude Desktop access to external capabilities.

Think of it like browser extensions for Chrome. You install one, and your browser can do things it couldn't before. MCP servers work the same way for Claude Desktop.

## What an MCP server actually does

An MCP server is a small program that runs on your computer and exposes **tools** to Claude. When you chat with Claude Desktop, it can call those tools during your conversation.

The tools can do things like:
- Read files from your computer
- Search a database
- Call an API
- Return structured data that Claude uses in its response

The server doesn't generate AI responses itself. It fetches data or performs an action, then hands the result back to Claude, who uses it to answer you. Claude is still doing the thinking — the MCP server is just giving it better information to work with.

## A concrete example

**Without an MCP server:**

> You: "Draft a proposal for this web design client."
> Claude: *generates a generic proposal based only on what you typed*

**With ProposalCraft (an MCP server):**

> You: "Draft a proposal for this web design client." [pastes brief]
> Claude: *calls the ProposalCraft tool, which loads your 3 past winning proposals from your local machine, then drafts a new proposal using your actual voice, structure, and pricing format*

The difference is context. Claude has your past work to reference — not just the brief you pasted.

## Why "runs locally" matters

ProposalCraft runs on your computer, not on someone else's server. Your proposals never leave your machine (except when you send a message to Claude, same as anything you type).

This is different from web apps like Bonsai or Qwilr, which store your documents in their cloud. With an MCP server:
- No account required
- No subscription to manage
- Your data stays on your machine
- It works even offline (except for the Claude chat itself)

## How you install an MCP server

It's simpler than it sounds. You add one block to Claude Desktop's configuration file:

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

Restart Claude Desktop. The tool is now available in every conversation.

No download. No installer. No account. The `npx` command fetches the server from GitHub the first time you use it.

## Do you need to be technical to use this?

No. The JSON block above is the most technical thing involved. If you can copy-paste, you can install an MCP server.

The [full install guide](https://jabbawocky.github.io/proposalcraft/) has step-by-step screenshots for Mac and Windows. It takes about 2 minutes.

## What ProposalCraft specifically does

Once installed, you get 8 tools available in every Claude conversation:

- **`analyze_brief`** — paste a client brief, get back: budget signals, red flags, scope creep risks, and the 5 questions you should ask before quoting
- **`draft_proposal`** — draft a proposal in your voice, using your saved winning proposals as style references
- **`save_proposal`** / **`load_examples`** — build your proposal library, or load 12 starter templates if you're starting from scratch
- **`check_usage`** — see how many free drafts you have left this month

The free tier gives you 5 proposal drafts per month — enough to evaluate whether it's useful before committing to anything.

## The short version

- MCP servers are plugins for Claude Desktop
- They give Claude access to your local data and tools
- ProposalCraft is one that drafts proposals using your past wins as the style guide
- Free, local, no account, 2-minute install

If you write proposals for clients and use Claude, [it's worth 2 minutes to try](https://jabbawocky.github.io/proposalcraft/).

---

**ProposalCraft** — free, MIT licensed, no API key.  
GitHub: https://github.com/jabbawocky/proposalcraft  
Install guide: https://jabbawocky.github.io/proposalcraft/
