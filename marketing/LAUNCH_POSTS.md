# ProposalCraft — Launch Day Posts

**Launch:** Tuesday June 10, 2026 — fire in the order listed in `launch-day-guide.md`.

---

## Hacker News — Show HN

**Title (max 80 chars):**
> Show HN: ProposalCraft – MCP server that drafts proposals in your voice from past wins

**Body (paste as the first comment immediately after submitting):**

I'm a freelancer who was spending 9–12 hours on proposals for every deal I closed — not because proposals are hard, but because every one started from scratch.

ProposalCraft is an MCP server that fixes the blank-page problem. It plugs into Claude Desktop (one JSON block), stores your past winning proposals as local files, and uses them as style examples when drafting new ones. The output reads like you wrote it, because it's structurally based on work that already won.

**What's technically interesting:**

- No Anthropic SDK in the dependency tree — Claude does all inference through the MCP protocol
- Storage is `~/.proposalcraft/*.md` — proposals are plain text, portable, nothing proprietary
- `analyze_brief` runs before drafting: extracts budget signals, red flags, scope creep indicators, and the 5 questions you should ask before quoting
- Freemium gate is purely client-side (`~/.proposalcraft/usage.json`) — 5 drafts/month free, $19/mo Pro
- Nothing leaves your machine; no backend, no auth, no cloud

**Install (Claude Desktop config):**

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

Source (MIT, TypeScript): https://github.com/jabbawocky/proposalcraft  
Landing: https://jabbawocky.github.io/proposalcraft/

Happy to talk through the design tradeoffs — particularly the local-file-as-context pattern vs a proper vector store, and why I ended up with no SDK dependency.

---

**Prepared HN responses:**

**"Client-side freemium gate is trivially bypassable"**
> Totally — anyone can edit a local JSON file. For a tool targeting professional freelancers billing $5–15k projects, the assumption is they're not going to hack a JSON to avoid a $19 charge. I'd rather ship something simple that converts honest users than build a backend auth system I don't need yet. If usage patterns change, the gate moves server-side.

**"Why not just paste your old proposals directly into Claude?"**
> You can. What ProposalCraft adds: `analyze_brief` runs structured extraction on every brief before you draft (catches scope creep, flags missing budget signals), your library is persistent across sessions without copy-paste, and the workflow is consistent rather than ad-hoc. It's the difference between a reliable tool and a manual process you have to remember to do.

**"How does the MCP approach compare to a web app?"**
> No ops, no hosting costs, no user auth, no company privacy policy. The trade-off is distribution — you need Claude Desktop. But everyone who installs it is already a power user who'll actually use it. 200 real installs beats 2,000 abandoned free trials.

**"What's the npx GitHub install story vs npm?"**
> Package name `proposalcraft` is unclaimed on npm. Holding the publish until a payment path is live (Tally Pro waitlist is active, npm publish wired in CI pending an NPM_TOKEN). GitHub install works clean in the meantime.

---

## Reddit — r/freelance

**Subreddit:** r/freelance (1.1M members)  
**Best time:** Tuesday 9–11am EST  
**Note:** No jargon, no MCP, no Claude Desktop. Lead with the time cost.  
**Payment gate:** ⚠️ References $19/mo — only post if a payment link is live.

---

**Title:**
> I built a free tool that drafts client proposals from your past winning work (not another AI template generator)

**Body:**

I tracked my hours for one month and found I was spending 9–12 hours of unpaid time on proposals for every deal I actually closed.

The problem wasn't writing ability — it was starting from scratch every time. I'd forgotten how I phrased the pricing section on the last proposal the client loved, or what structure got the "you really understood our problem" response.

So I built **ProposalCraft** — it runs locally on your machine with Claude Desktop. You paste in 2–3 of your past winning proposals, then whenever you get a new brief, it drafts using your real examples as the style guide. The output sounds like you wrote it because it's based on work you actually won.

It also has a "brief analysis" tool that I use before writing anything: paste a client email, get back budget signals, red flags (vague scope, no timeline, no decision-maker), and the 5 questions you should ask before quoting. Saves me from writing a 2-hour proposal for a client who wanted a $500 fix.

**Free tier: 5 proposals/month** — enough to replace your current process on 5 real briefs.  
**Pro ($19/mo): unlimited.**

Nothing goes to any server. Your proposals stay on your machine.

https://jabbawocky.github.io/proposalcraft/

Happy to answer questions — been freelancing long enough that this scratched my own itch pretty hard.

---

**Prepared responses:**

**"Does this work without Claude Desktop?"**
> No — it's built as an MCP server (a way to give Claude tools and memory). You need Claude Desktop installed, which is free. If you're not using Claude Desktop yet, it takes about 10 minutes to set up and is genuinely worth it.

**"How is this different from ChatGPT proposal templates?"**
> Templates are generic. This uses your actual proposals — the ones that already won you work. The difference in output is significant. Also, `analyze_brief` runs before drafting, not after — it catches the briefs you shouldn't quote on before you spend 2 hours writing.

**"Scared to upload my proposals to some server"**
> Nothing is uploaded. Your proposals live in `~/.proposalcraft/` on your machine. The tool passes them as context to your local Claude session. There's no backend, no cloud database, no account.

---

## Reddit — r/SideProject

**Subreddit:** r/SideProject (200k+ members)  
**Best time:** Tuesday 9am–12pm EST  
**Note:** Builder community. No selling. Be honest about what it is and what you're still building.

---

**Title:**
> Show r/SideProject: ProposalCraft — MCP server that learns from your winning proposals

**Body:**

Launched today on Product Hunt: https://www.producthunt.com/posts/proposalcraft

**What it is:** A free MCP server that drafts client proposals in your voice, learned from your past winning work. Runs locally, nothing leaves your machine.

**Why I built it:** I'm a freelancer and was losing 9–12 hours/deal to proposals. Tracked my time for a month, confirmed it was killing my effective hourly rate, decided to fix it.

**How it works:** You save 2–3 of your past proposals. When you get a new brief, ProposalCraft loads them as style examples and drafts against the brief. Output sounds like you because it's structurally based on things that already worked.

**What I'm most proud of:** The `analyze_brief` tool — paste a client email, get back budget signals, scope creep flags, red flags, and the questions to ask before quoting. I use it on every brief now before I write anything.

**Stack:** TypeScript, MCP protocol, local file storage. No backend, no database, no Anthropic SDK in the dependency tree.

**Where it's at:** 1.0.4, MIT, free tier (5 drafts/month), Pro $19/mo.

GitHub: https://github.com/jabbawocky/proposalcraft

Would love feedback — especially from other freelancers on whether `analyze_brief` is the most valuable tool or whether I'm missing something obvious.

---

## Indie Hackers

**Format:** Milestone post  
**Best time:** Tuesday morning

---

**Title:**
> Launched ProposalCraft on Product Hunt today — an MCP server for freelance proposal writing

**Body:**

**What shipped:** ProposalCraft v1.0.4 — an MCP server that drafts client proposals in your voice, learned from your past winning work.

**The problem I was solving for myself:** I tracked my hours for a month and found I was spending 9–12 hours unpaid on proposals for every deal I closed. The issue wasn't writing skill — it was starting from scratch every time and forgetting what had worked before.

**How it works:**
1. Save 2–3 of your winning proposals locally
2. Paste a new brief into Claude Desktop
3. ProposalCraft drafts using your saved examples as the style guide

The output sounds like you wrote it because it's based on your actual past wins, not generic templates.

**Revenue model:** Free tier (5 draft_proposal calls/month), Pro at $19/mo for unlimited. Payment via Tally waitlist for now while I wire up a proper payment integration.

**Technical approach:** MCP server (Model Context Protocol — Anthropic's tool protocol for Claude Desktop). No backend, no cloud, no SDK dependency. Everything runs locally. Proposals stored as `~/.proposalcraft/*.md`.

**Today's milestone:** Live on Product Hunt. 20+ open PRs on awesome-mcp lists. First merge in AlexMili/Awesome-MCP.

**What I want to learn:** Whether the freemium gate is set right (5/month), whether the $19/mo price is correct, and whether freelancers in non-dev fields (design, copywriting, consulting) find it as useful as dev freelancers.

**Current metrics:** Stars: ~0 pre-launch (that changes today), free tier installs: unknown (local, no telemetry).

https://jabbawocky.github.io/proposalcraft/

---

## X/Twitter Thread

**Post as 5 replies in sequence. Tweet 1 is the hook — everything else is replies.**

**Tweet 1 (hook):**
> I tracked my hours for a month. I was spending 9–12 hours of unpaid time on proposals for every deal I closed.
>
> So I built ProposalCraft — an MCP server that drafts proposals in your voice, from your past winning work.
>
> Launching on Product Hunt today 🧵

**Tweet 2:**
> The problem isn't writing ability.
>
> It's that every proposal starts from scratch. You forget what structure that client loved, how you phrased the pricing section last time, what got the "you really understood our problem" reply.
>
> ProposalCraft fixes the blank page problem.

**Tweet 3:**
> How it works:
>
> 1. Save 2–3 proposals that won you work
> 2. Paste a new client brief into Claude Desktop
> 3. ProposalCraft drafts using your real wins as the style guide
>
> Output sounds like you wrote it. Because it learned from things that already worked.
>
> Free tier: 5 drafts/month. Pro: $19/mo.

**Tweet 4:**
> The tool I use most: analyze_brief
>
> Paste a client email → get back:
> - Budget signals ("we have budget but need to be careful" = lowball incoming)
> - Scope creep red flags
> - The 5 questions to ask before quoting
>
> Saves writing a 2hr proposal for a client who wanted a $500 fix.

**Tweet 5:**
> It's an MCP server — runs locally, nothing leaves your machine, no API key, no backend, no account.
>
> Install is one JSON block in your Claude Desktop config.
>
> GitHub (MIT): https://github.com/jabbawocky/proposalcraft
> Landing: https://jabbawocky.github.io/proposalcraft/
>
> Would love an upvote if you're a freelancer 🙏

---

## Reddit — r/consulting

**Subreddit:** r/consulting (200k+ members)  
**Best time:** Tuesday 9am–12pm EST  
**Note:** Professional tone. Frame as a consultant's tool, not a developer toy.

---

**Title:**
> Free tool for writing better client proposals faster — built on Claude Desktop

**Body:**

I built something for a pain point I know this community feels: the hours you spend writing proposals that never close, and the proposals that win feeling like luck.

**ProposalCraft** is a free tool that runs locally on your machine. You give it 2–3 of your past winning proposals, and when you get a new brief, it drafts using your actual examples as the foundation. The output is in your voice because it's based on your work.

What I use more than drafting: the brief analysis step. Paste a client inquiry, it returns:
- Budget signals (the phrases that indicate what they're really willing to spend)
- Scope risk flags (vague deliverables, no decision-maker mentioned, no timeline)
- The clarifying questions to ask before committing to a quote

Consultants know the brief analysis step is where deals are won or lost. This automates the structured thinking.

**Free: 5 full proposal drafts/month.** Pro is $19/mo for unlimited.

Works with Claude Desktop (free). Nothing uploaded to any server — your proposals, your machine.

https://jabbawocky.github.io/proposalcraft/

---

## Reddit — r/digitalnomad

**Subreddit:** r/digitalnomad (1.3M members)  
**Best time:** Tuesday 9am–12pm EST  
**Note:** Focus on time freedom and working less. Less on tech.

---

**Title:**
> Cut my proposal time from 3 hours to 20 minutes with an AI tool that learns from my own winning work

**Body:**

For context: I'm a freelance developer. Proposals were eating 10+ hours a month of unpaid time.

Built a tool for myself that drafts proposals using my past winning examples as the template. It runs locally (nothing in the cloud), you feed it 2–3 briefs you've won before, and it drafts new ones that sound like you wrote them — because they're structurally based on things that worked.

The brief analysis feature is what I actually use daily: paste the client email, get back whether the budget is real, what the scope risks are, and what to ask before you quote. Stopped writing proposals for clients who weren't serious.

Free tier is 5 full proposals/month. Pro is $19/mo.

**Works with Claude Desktop** (free app) — one JSON config block to install.

https://jabbawocky.github.io/proposalcraft/

Anyone else find the brief qualification step saves more time than the writing step?

---

## Reddit — r/Upwork

**Subreddit:** r/Upwork (88k members)  
**Best time:** Tuesday 9am–12pm EST  
**Note:** Upwork community is highly practical. Focus on conversion, not process.

---

**Title:**
> Built a free tool that writes Upwork proposals from your past winning ones — uses your own voice

**Body:**

If you're writing proposals on Upwork, your win rate is mostly a function of how quickly you can tailor a high-quality proposal to the specific brief. Generic templates don't work. Starting from scratch every time is too slow.

Built **ProposalCraft** — you give it your 2–3 best past proposals (the ones that won), and it drafts new ones using those as the style guide. Output sounds like you because it's based on your actual wins.

Also has a brief analysis tool: paste the job post, get back:
- Is this budget real? (signals from the posting language)
- Scope risks
- What to ask before proposing

Free tier: 5 draft proposals/month. Pro is $19/mo for unlimited.

Runs locally — nothing uploaded. Works with Claude Desktop.

https://jabbawocky.github.io/proposalcraft/

---

## Reddit — r/webdev

**Subreddit:** r/webdev (800k+ members)  
**Best time:** Tuesday 9am–12pm EST  
**Note:** Developer audience. Technical is fine. Focus on the MCP angle.

---

**Title:**
> Show r/webdev: I built a free MCP server that drafts client proposals from your past winning work

**Body:**

Freelance web dev here. Built this for myself and putting it out there.

**ProposalCraft** is an MCP server (Model Context Protocol — Anthropic's tool protocol for Claude Desktop) that drafts client proposals in your voice, learned from your past winning work.

The technical angle: it stores proposals as local `~/.proposalcraft/*.md` files, passes them as context to Claude for drafting, and has an `analyze_brief` tool that extracts structured data from client emails (budget signals, scope risks, clarifying questions) before you commit to writing anything.

No backend, no cloud, no Anthropic SDK in the dep tree. Claude does all inference. Freemium gate is client-side.

**Install:**
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

Free: 5 draft_proposal calls/month. Pro: $19/mo.

GitHub (MIT, TypeScript): https://github.com/jabbawocky/proposalcraft

---

## Reddit — r/learnprogramming

**Subreddit:** r/learnprogramming (4.5M members)  
**Best time:** Lower priority — post if time allows  
**Note:** Angle: this is what MCP looks like in production. Educational.

---

**Title:**
> Built a real MCP server that drafts proposals for freelancers — here's what I learned about the MCP pattern

**Body:**

If you've been hearing about MCP (Model Context Protocol) and want to see what it looks like in production, I open-sourced a real one.

**ProposalCraft** is a freelance proposal drafting MCP server. You store your past winning proposals locally, paste a new client brief into Claude Desktop, and it drafts using your examples as the style guide.

**What's interesting about the implementation:**

The MCP pattern I used: tools don't do inference themselves, they load data into context and let Claude do the thinking. `draft_proposal` reads your saved proposals, formats them as context, and Claude drafts against the brief. `analyze_brief` runs a structured extraction prompt on the client email and returns structured JSON.

No Anthropic SDK in the dependency tree — the MCP server communicates through the protocol, Claude handles all inference through the existing Claude Desktop connection.

Storage is plain markdown files in `~/.proposalcraft/`. No database, no vector store — the library is small enough that Claude can read everything in context.

Source (TypeScript, MIT): https://github.com/jabbawocky/proposalcraft

Good project to read through if you're learning MCP or want to see how local-first AI tooling is structured.
