# ProposalCraft — Community Response Kit

Pre-written replies for launch-day threads (Reddit, IH, HN, X). Copy, lightly personalise, post.

---

## Setup & Technical

### "What is an MCP server? / How does this work?"

> Good question — MCP (Model Context Protocol) is Anthropic's plugin system for Claude Desktop.
> Once you add ProposalCraft to your `claude_desktop_config.json`, Claude gets new tools:
> `load_examples`, `draft_proposal`, `analyze_brief`. You just describe the job and Claude uses
> your templates and style to write the proposal — no switching apps, no copy-pasting.
>
> Setup takes about 5 minutes: https://jabbawocky.github.io/proposalcraft/

---

### "Does this work on Windows / Linux?"

> Yes — Claude Desktop runs on Windows and Mac, so ProposalCraft works on both.
> Linux support is pending Claude Desktop's Linux release (Anthropic has it on their roadmap).
> The npm package itself is cross-platform.

---

### "How do I install it?"

> `npx -y github:jabbawocky/proposalcraft` in your terminal, then add the config block to
> `claude_desktop_config.json`. Full instructions with the exact config path for Mac and Windows:
> https://jabbawocky.github.io/proposalcraft/#install

---

### "It didn't work / I'm getting an error"

> Sorry to hear that! A few common fixes:
> 1. **Restart Claude Desktop** after adding the config — it doesn't hot-reload.
> 2. **Check the config path** — Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`,
>    Windows: `%APPDATA%\Claude\claude_desktop_config.json`
> 3. **Node.js version** — needs Node 18+. `node -v` to check.
>
> If those don't help, open an issue at https://github.com/jabbawocky/proposalcraft/issues
> and paste the error — I'll look at it same day.

---

## Privacy & Safety

### "Is my data safe? Are you sending proposals to a server somewhere?"

> ProposalCraft runs **entirely on your machine** — it's a local npm package. No server, no cloud,
> no data leaves your computer. The MCP tools talk directly to Claude Desktop; nothing goes anywhere
> else. The code is fully open source if you want to verify:
> https://github.com/jabbawocky/proposalcraft

---

### "Do you store my client names / proposal content?"

> Nothing is stored or transmitted. ProposalCraft is just a local process that Claude Desktop
> spawns — it lives and dies with the Claude Desktop session. Zero telemetry.

---

## Pricing & Value

### "Why is there a limit on the free tier?"

> The 5-draft/month limit keeps the free tier sustainable while the project is early.
> Most freelancers will know within a proposal or two whether it fits their workflow.
> If you're doing more volume, Pro ($19/mo) is unlimited — roughly the value of one extra
> client project per year.

---

### "How is $19/mo justified?"

> Fair challenge. If one extra proposal win per year is worth $200+, the math works easily.
> Most users who've used it regularly say it saves 1–2 hours per proposal on research and
> first-draft time.
>
> If you're on the fence, the free tier gives you 5 proposals to find out.

---

### "$19 seems steep for what is basically a prompt wrapper"

> It's a fair comparison to make. A few things that go beyond prompt wrapping:
> - `load_examples` pulls from your real past proposals — Claude adapts to *your* style, not generic
> - `analyze_brief` reads the actual job posting and flags what matters
> - Local-only, open-source, no SaaS account to create
>
> That said, totally fine if the free tier covers your volume — it's designed to be useful, not
> just a teaser.

---

### "Will you raise the price later?"

> The founding rate ($19/mo) is locked for early subscribers — if pricing ever changes,
> existing subscribers keep their rate.

---

## Differentiation

### "How is this different from just prompting Claude directly?"

> Three things make the difference:
> 1. **Context integration** — `load_examples` gives Claude your actual past proposals. When you
>    say "write like my usual intro," Claude has the examples to model from.
> 2. **Brief analysis** — `analyze_brief` reads the job posting and extracts the budget, timeline,
>    and key requirements so you don't miss anything.
> 3. **No copy-pasting** — the draft lands in Claude Desktop directly in your conversation.
>
> You could replicate most of it with careful manual prompting. ProposalCraft just makes it fast
> and consistent.

---

### "How is this different from Proposal Genie / PouncerAI / other tools?"

> The main difference is **local-first**. Proposal Genie and PouncerAI are SaaS — your proposals
> go through their servers. ProposalCraft runs on your machine; nothing leaves it.
>
> Also: it's free to start, open-source, and you're not locked into a web UI — it lives inside
> Claude Desktop where you're already working.

---

## Feature Requests

### "Can you add [feature X]?"

> Good idea — please open a feature request at https://github.com/jabbawocky/proposalcraft/issues.
> I'm actively building based on what early users actually need, so real use cases jump the queue.

---

### "Does it work for [consulting / agencies / specific use case]?"

> Yes — the `analyze_brief` tool works on any RFP or project brief, not just freelance platforms.
> The main thing to try: paste your brief into the job description field and run `draft_proposal`.
> If the output doesn't fit your format, open an issue with an example and I'll look at it.

---

### "Will you support [other Claude clients / ChatGPT / other AI]?"

> Right now it's Claude Desktop only — MCP is Anthropic's protocol. ChatGPT doesn't support MCP.
> If other clients add MCP support (some already are, like Cursor and Zed), ProposalCraft should
> work with them with no changes. I'll update the docs when that's confirmed.

---

## Launch / Origin

### "Why did you build this?"

> I was tired of spending 2 hours on proposals that paid $0. The actual *work* was 15 minutes;
> the proposal was the bottleneck. Figured if I was dealing with it, other freelancers were too.

---

### "Is this maintained / will you keep supporting it?"

> Yes — I'm actively using it for my own client work, so it gets fixed when it breaks.
> Open source, MIT license, so it's not going anywhere regardless.

---

## HN-specific (in case it gets picky)

### "MCP is just an API wrapper. This is a solved problem."

> You're not wrong that MCP is fundamentally tool-calling. What ProposalCraft adds is the
> *context* — it loads your actual examples so the model has something to work from, and
> it structures the brief analysis so you don't have to prompt-engineer that every time.
>
> If you already have a working Claude setup that does this, you don't need it. It's for people
> who haven't set that up (most freelancers don't).

---

### "Why GitHub install instead of npm?"

> Simpler for a first release — no npm account needed to install, and the install UX
> (`npx -y github:jabbawocky/proposalcraft`) is identical for the user. npm publish is coming
> (it's already configured, just needs a token added to CI).

---

*Last updated: Jun 7, 2026 | Tick 19*
