# ProposalCraft Starter Pack

**12 winning proposal templates for freelancers and consultants.**

Each template is a real, send-ready proposal framework — not a generic fill-in-the-blanks skeleton. They're structured to win: opening with the client's problem, demonstrating you understand their situation, presenting a clear scope, and closing with a specific next step.

## What's included

| # | Template | Typical project value |
|---|---|---|
| 01 | Web Redesign (full-service) | $4,000–$12,000 |
| 02 | Mobile App MVP | $8,000–$25,000 |
| 03 | Brand Identity System | $2,500–$7,000 |
| 04 | Content Strategy + Retainer | $1,500–$4,000/month |
| 05 | SaaS MVP Build | $12,000–$35,000 |
| 06 | SEO Audit + 90-Day Strategy | $1,200–$3,500 |
| 07 | API Integration / Automation | $2,000–$8,000 |
| 08 | Paid Marketing Campaign | $1,500 setup + management |
| 09 | Data Dashboard / BI | $3,000–$10,000 |
| 10 | E-commerce Store Build | $3,500–$15,000 |
| 11 | Fractional CTO / Tech Retainer | $2,000–$8,000/month |
| 12 | Brand / Explainer Video | $2,500–$8,000 |

## How to use

### Option A: Load with the install script (recommended)

You'll need ProposalCraft installed first:

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

Then run the install script:

```bash
node install.js
```

This loads all 12 templates into ProposalCraft in one shot. Once loaded, ask Claude to draft a proposal and it'll use them as voice references automatically.

### Option B: Load templates one at a time

Open Claude Desktop, and paste this prompt for each template you want to load:

```
Use save_proposal to save the following proposal. Name it "[template-name]".
[paste the template content]
```

### Option C: Use as direct references

Paste a template directly into Claude and ask it to adapt it for your specific brief:

```
Here's a proposal framework I use. Adapt it for this brief: [paste brief]
```

## Customising for your voice

These templates are starting points. The best results come from:
1. Loading 2–3 of your own past winning proposals alongside these
2. Telling Claude "draft a proposal in my voice using my saved proposals as the primary reference"
3. Adjusting the style over a few drafts until the output sounds like you

The templates handle the structure and the sell. Your real proposals handle the voice.

## Need the right industry template?

```
Use draft_proposal with this brief: [brief]. Reference the [name] template for structure.
```

---

ProposalCraft is free and open source. This starter pack is a one-time purchase.
https://jabbawocky.github.io/proposalcraft/
