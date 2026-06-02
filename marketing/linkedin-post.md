# LinkedIn Post — ProposalCraft Launch

**Target audience:** Freelancers, independent consultants, agency owners

**Character count:** ~1,400 (under the 3,000 limit; optimised for mobile)

**Best time to post:** Tuesday or Wednesday, 8–10am local time

---

## POST:

I used to spend 2 hours writing every client proposal.

Win rate: about 25%. So for every deal I closed, I wrote 3 proposals that paid me nothing. That's 6+ hours of unpaid work per deal.

I got annoyed enough to build something about it.

**ProposalCraft** is an MCP server for Claude Desktop. Here's the 30-second version of how it works:

1. Save 2-3 of your past winning proposals
2. Paste in a new client brief
3. Ask Claude to draft a proposal

It uses your own past work as the style guide — so the output sounds like you, not generic AI copy.

Everything runs locally. No subscription, no cloud storage, no API key. Your proposals stay on your machine.

This week I shipped a brief analysis tool too — before drafting, it flags budget signals, scope creep risks, and the questions you should ask before saying yes.

Three years ago I would have paid $50/mo for this. It's free, open source, MIT licensed.

Install is one JSON block in your Claude config. Full steps on the landing page:
👉 https://jabbawocky.github.io/proposalcraft/

If you use Claude Desktop and write client proposals, try it. Happy to answer questions in the comments.

---

**First comment to add (3-5 minutes after posting):**

For context on the technical side: it's distributed as an MCP (Model Context Protocol) server, which means zero backend, zero ops. One JSON config block and it's running. I specifically didn't build a web app because I didn't want to maintain a database of your proposals — local-first felt right for client-sensitive work.

GitHub if you want to look under the hood: https://github.com/jabbawocky/proposalcraft

---

## HASHTAGS (add at end or in first comment):

#freelance #consulting #productivity #AI #MCP #claudeAI #automation #freelancing #clientwork

---

## FOLLOW-UP COMMENT TEMPLATE (respond to anyone who asks "does it work with ChatGPT?"):

It's built for Claude Desktop specifically — it uses MCP (Model Context Protocol), which is Claude's plugin system. Claude Desktop is free to try at claude.ai/download. The tool itself has no subscription either.
