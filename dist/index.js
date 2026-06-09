#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUNDLED_EXAMPLES_DIR = path.join(__dirname, "..", "sample-proposals");
const FREE_DRAFT_LIMIT = 5;
const PRO_URL = "https://tally.so/r/eqzYqE";
const PRO_MAILTO = "mailto:mathew.carter@knowfirst.ai?subject=ProposalCraft%20Pro%20%E2%80%94%20Founding%20Access&body=Hi%2C%0A%0AI%27d%20like%20to%20upgrade%20to%20ProposalCraft%20Pro%20(%2419%2Fmo).%0A%0AName%3A%20%0AUse%20case%3A%20";
function getUsageFile() {
    const dir = path.join(os.homedir(), ".proposalcraft");
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, "usage.json");
}
function getUsage() {
    const file = getUsageFile();
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    if (!fs.existsSync(file))
        return { month, draft_count: 0 };
    try {
        const data = JSON.parse(fs.readFileSync(file, "utf-8"));
        if (data.month !== month)
            return { month, draft_count: 0 };
        return data;
    }
    catch {
        return { month, draft_count: 0 };
    }
}
function incrementUsage(usage) {
    usage.draft_count += 1;
    fs.writeFileSync(getUsageFile(), JSON.stringify(usage), "utf-8");
}
function checkFreeTier() {
    const usage = getUsage();
    if (usage.draft_count >= FREE_DRAFT_LIMIT) {
        return {
            allowed: false,
            used: usage.draft_count,
            message: `You've used all ${FREE_DRAFT_LIMIT} free proposal drafts for ${usage.month}.\n\n**ProposalCraft Pro — $19/mo**\n- Unlimited drafts — no monthly cap\n- Priority email support\n\n**[Upgrade to Pro →](${PRO_URL})**\n\n_Free tier resets on the 1st of each month. Your saved proposals and library are unaffected._`,
        };
    }
    return { allowed: true, used: usage.draft_count };
}
function getProposalsDir() {
    const dir = process.env.PROPOSALS_DIR ||
        path.join(os.homedir(), ".proposalcraft", "proposals");
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}
// Returns the resolved path only if it stays within dir — prevents path traversal.
function safeFilepath(dir, name) {
    const base = path.resolve(dir);
    const resolved = path.resolve(dir, name);
    if (!resolved.startsWith(base + path.sep))
        return null;
    return resolved;
}
function loadProposals() {
    const dir = getProposalsDir();
    const files = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".txt") || f.endsWith(".md"));
    return files.map((f) => ({
        name: f,
        content: fs.readFileSync(path.join(dir, f), "utf-8"),
    }));
}
const server = new Server({ name: "proposalcraft", version: "1.0.8" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "draft_proposal",
            description: "Draft a new client proposal based on a brief. Uses your saved winning proposals as style/voice references. Returns a ready-to-send proposal. Free plan: 5 drafts/month. Upgrade for unlimited.",
            inputSchema: {
                type: "object",
                properties: {
                    brief: {
                        type: "string",
                        description: "The client brief, project description, or email thread. Paste the full text.",
                    },
                    budget: {
                        type: "string",
                        description: "Client budget if known (e.g. '$5,000–8,000')",
                    },
                    deadline: {
                        type: "string",
                        description: "Project deadline if known (e.g. '6 weeks')",
                    },
                    your_rate: {
                        type: "string",
                        description: "Your hourly or day rate to include in pricing (e.g. '$150/hr')",
                    },
                },
                required: ["brief"],
            },
        },
        {
            name: "analyze_brief",
            description: "Analyze a client brief BEFORE drafting. Extracts budget signals, timeline urgency, red flags, scope creep risks, and suggests clarifying questions to ask the client. Use this first when a brief is vague or the budget is unclear.",
            inputSchema: {
                type: "object",
                properties: {
                    brief: {
                        type: "string",
                        description: "The client brief, job post, or email thread to analyze",
                    },
                },
                required: ["brief"],
            },
        },
        {
            name: "save_proposal",
            description: "Save a winning proposal as a reference example. The more examples you save, the more accurately future drafts match your voice and format.",
            inputSchema: {
                type: "object",
                properties: {
                    content: {
                        type: "string",
                        description: "The full text of the winning proposal",
                    },
                    name: {
                        type: "string",
                        description: "Short name for this proposal (e.g. 'ecommerce-redesign-2024')",
                    },
                },
                required: ["content", "name"],
            },
        },
        {
            name: "list_proposals",
            description: "List all saved proposals available as style references",
            inputSchema: {
                type: "object",
                properties: {},
            },
        },
        {
            name: "get_proposal",
            description: "Read the full content of a saved proposal by filename. Use list_proposals first to see available filenames.",
            inputSchema: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "The filename of the proposal to read (e.g. 'ecommerce-redesign-2024.md')",
                    },
                },
                required: ["name"],
            },
        },
        {
            name: "delete_proposal",
            description: "Remove a saved proposal from your reference library",
            inputSchema: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "The filename of the proposal to delete",
                    },
                },
                required: ["name"],
            },
        },
        {
            name: "load_examples",
            description: "Load bundled example proposals into your library to use as style references immediately. Run this on first use to get started without needing your own past proposals yet.",
            inputSchema: {
                type: "object",
                properties: {},
            },
        },
        {
            name: "usage_status",
            description: "Check your free tier usage: how many proposal drafts you've used this month and how many remain before hitting the limit. Run this before draft_proposal if you're unsure of your remaining quota.",
            inputSchema: {
                type: "object",
                properties: {},
            },
        },
        {
            name: "proposal_to_email",
            description: "Convert a formal proposal document into a concise, scannable pitch email. Distills the key points — problem, solution, price, and next step — into a short email the client can read in 60 seconds and forward to decision-makers. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    proposal: {
                        type: "string",
                        description: "The full proposal text to convert",
                    },
                    client_name: {
                        type: "string",
                        description: "The client's first name or 'team' (used in the greeting)",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name (used in the sign-off)",
                    },
                    cta: {
                        type: "string",
                        description: "Optional: the specific call to action (e.g. 'book a 20-min call', 'reply with any questions', 'sign off on the attached proposal'). If omitted, one is inferred from the proposal.",
                    },
                },
                required: ["proposal"],
            },
        },
        {
            name: "scope_of_work",
            description: "Generate a formal Scope of Work document from an accepted proposal. Produces a structured SOW with deliverables, timeline, payment schedule, revision policy, and a change-order clause — ready to paste into a contract or send directly to the client.",
            inputSchema: {
                type: "object",
                properties: {
                    proposal: {
                        type: "string",
                        description: "The accepted proposal text to base the SOW on",
                    },
                    client_name: {
                        type: "string",
                        description: "The client's name or company name",
                    },
                    start_date: {
                        type: "string",
                        description: "Expected project start date (e.g. 'June 17, 2026' or 'two weeks from contract signing')",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name or business name (the service provider / contractor)",
                    },
                },
                required: ["proposal", "client_name"],
            },
        },
        {
            name: "client_followup",
            description: "Write a follow-up message for a proposal that hasn't received a response. Generates a short, non-pushy follow-up that reopens the conversation without sounding desperate. Provide the original proposal summary and how long it's been since you sent it.",
            inputSchema: {
                type: "object",
                properties: {
                    proposal_summary: {
                        type: "string",
                        description: "A brief summary of the proposal you sent: what you offered, to whom, and the approximate value/scope",
                    },
                    days_since_sent: {
                        type: "number",
                        description: "How many days ago you sent the original proposal",
                    },
                    context: {
                        type: "string",
                        description: "Optional: any context about the client or situation that might affect the follow-up tone (e.g. 'they seemed enthusiastic on the call', 'cold inbound lead', 'long-term client')",
                    },
                },
                required: ["proposal_summary", "days_since_sent"],
            },
        },
        {
            name: "improve_proposal",
            description: "Review a proposal draft and get specific, actionable improvements. Surfaces weak sections, unclear pricing, vague scope, and missed persuasion opportunities. Run after draft_proposal or on any proposal you're about to send. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    proposal: {
                        type: "string",
                        description: "The full text of the proposal draft to review",
                    },
                    focus: {
                        type: "string",
                        description: "Optional: a specific area to focus on (e.g. 'pricing clarity', 'opening hook', 'why-me section', 'scope definition'). If omitted, a full review is given.",
                    },
                },
                required: ["proposal"],
            },
        },
        {
            name: "project_kickoff_email",
            description: "Write a professional project kickoff email to send after winning a project. Confirms deliverables and timeline, introduces your working process, sets clear expectations, and makes the client feel confident they made the right choice. Use this immediately after the client says yes — before the scope of work is signed. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    proposal: {
                        type: "string",
                        description: "The accepted proposal text (used to extract project details, deliverables, and price)",
                    },
                    client_name: {
                        type: "string",
                        description: "The client's first name or 'team' (used in the greeting)",
                    },
                    start_date: {
                        type: "string",
                        description: "Optional: the agreed project start date (e.g. 'June 17' or 'next Monday')",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                    working_process: {
                        type: "string",
                        description: "Optional: a brief description of how you work (e.g. 'weekly check-ins via Slack, feedback rounds via Loom'). If omitted, a standard process is suggested.",
                    },
                },
                required: ["proposal", "client_name"],
            },
        },
    ],
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === "list_proposals") {
        const dir = getProposalsDir();
        const files = fs
            .readdirSync(dir)
            .filter((f) => f.endsWith(".txt") || f.endsWith(".md"));
        if (files.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: `No proposals saved yet.\n\nQuick start: run load_examples to load bundled templates, or use save_proposal to add your own past winning proposals.\n\nStorage: ${dir}`,
                    },
                ],
            };
        }
        const stats = files.map((f) => {
            const stat = fs.statSync(path.join(dir, f));
            const sizeKb = Math.round(stat.size / 1024);
            return `  • ${f} (${sizeKb}kb)`;
        });
        return {
            content: [
                {
                    type: "text",
                    text: `${files.length} proposal(s) in library (${dir}):\n\n${stats.join("\n")}`,
                },
            ],
        };
    }
    if (name === "save_proposal") {
        const dir = getProposalsDir();
        const safeName = String(args.name)
            .replace(/\.md$/i, "")
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
        const filename = `${safeName}.md`;
        const filepath = path.join(dir, filename);
        fs.writeFileSync(filepath, String(args.content), "utf-8");
        return {
            content: [
                {
                    type: "text",
                    text: `Saved "${filename}" to your proposal library.\n\nThis will be used as a voice/style reference for all future drafts. Run list_proposals to see your full library.`,
                },
            ],
        };
    }
    if (name === "delete_proposal") {
        const dir = getProposalsDir();
        const target = String(args.name);
        const filepath = safeFilepath(dir, target);
        if (!filepath) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Invalid filename. Run list_proposals to see available proposals.`,
                    },
                ],
            };
        }
        if (!fs.existsSync(filepath)) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Proposal "${target}" not found. Run list_proposals to see available proposals.`,
                    },
                ],
            };
        }
        fs.unlinkSync(filepath);
        return {
            content: [
                {
                    type: "text",
                    text: `Deleted "${target}" from your proposal library.`,
                },
            ],
        };
    }
    if (name === "draft_proposal") {
        const tier = checkFreeTier();
        if (!tier.allowed) {
            return { content: [{ type: "text", text: tier.message }] };
        }
        const usage = getUsage();
        incrementUsage(usage); // mutates usage.draft_count in place (now = total used including this one)
        const remaining = FREE_DRAFT_LIMIT - usage.draft_count;
        const usageNote = remaining > 0
            ? `\n\n---\n_Free plan: ${remaining} draft${remaining !== 1 ? "s" : ""} remaining this month._`
            : `\n\n---\n_**Last free draft this month.** Upgrade to Pro ($19/mo) for unlimited: [Upgrade to Pro →](${PRO_URL})_`;
        const examples = loadProposals();
        const brief = String(args.brief);
        const budget = args.budget ? `\nClient budget: ${args.budget}` : "";
        const deadline = args.deadline ? `\nDeadline: ${args.deadline}` : "";
        const rate = args.your_rate ? `\nYour rate: ${args.your_rate}` : "";
        if (examples.length > 0) {
            const exampleBlock = examples
                .map((e) => `=== ${e.name} ===\n${e.content}`)
                .join("\n\n");
            return {
                content: [
                    {
                        type: "text",
                        text: `I've loaded ${examples.length} proposal(s) from your library as voice and style references.

INSTRUCTIONS: Using the examples below as your style guide — match the tone, structure, section headings, formality, and pricing format exactly — write a complete, ready-to-send proposal for the brief that follows. Adapt fully to the new client; do not copy sentences.

YOUR PAST WINNING PROPOSALS (style reference):

${exampleBlock}

---

NEW BRIEF TO RESPOND TO:

${brief}${budget}${deadline}${rate}

Write the full proposal now.${usageNote}`,
                    },
                ],
            };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `No saved proposals found — writing from best practices.

INSTRUCTIONS: Write a complete, ready-to-send client proposal for the brief below. Lead with understanding of their problem, include clear deliverables and scope boundaries, transparent timeline and pricing, a brief credibility signal, and a clear next step. Tone: professional but human, confident not arrogant.

BRIEF:

${brief}${budget}${deadline}${rate}

---
_Tip: Run load_examples to get started with bundled templates, or save your past winning proposals with save_proposal to get drafts that match your voice.${usageNote}_`,
                },
            ],
        };
    }
    if (name === "get_proposal") {
        const dir = getProposalsDir();
        const target = String(args.name);
        const filepath = safeFilepath(dir, target);
        if (!filepath) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Invalid filename. Run list_proposals to see available proposals.`,
                    },
                ],
            };
        }
        if (!fs.existsSync(filepath)) {
            const files = fs
                .readdirSync(dir)
                .filter((f) => f.endsWith(".txt") || f.endsWith(".md"));
            const list = files.length > 0 ? files.join(", ") : "(none saved yet)";
            return {
                content: [
                    {
                        type: "text",
                        text: `Proposal "${target}" not found.\n\nAvailable proposals: ${list}`,
                    },
                ],
            };
        }
        const content = fs.readFileSync(filepath, "utf-8");
        return {
            content: [
                {
                    type: "text",
                    text: `=== ${target} ===\n\n${content}`,
                },
            ],
        };
    }
    if (name === "analyze_brief") {
        const brief = String(args.brief);
        return {
            content: [
                {
                    type: "text",
                    text: `Analyze the following client brief and produce a structured pre-proposal intelligence report. Cover these sections:

**1. Project snapshot** — one sentence: what they want built/done, for what purpose.

**2. Budget signals** — any explicit figures; if none, infer from company size, scope, or platform signals. Give a realistic range and confidence (high/medium/low).

**3. Timeline signals** — stated deadline or urgency language. Flag if it looks unrealistic for the stated scope.

**4. Red flags** — anything that suggests difficult client, scope creep risk, payment risk, or project likely to fail. Be direct.

**5. Green flags** — signs this is a good engagement: clear brief, realistic expectations, warm tone, returning client signals, etc.

**6. Scope creep risks** — specific areas where the brief is vague and could expand unpredictably. Name the exact vague phrases.

**7. Clarifying questions** — exactly 3–5 questions to ask the client BEFORE writing the proposal. Order by importance. These should fill the gaps that most affect your pricing or go/no-go decision.

**8. Go/no-go recommendation** — one of: Strong yes / Yes / Borderline / Lean no / Hard no. One sentence of reasoning.

---

BRIEF TO ANALYZE:

${brief}`,
                },
            ],
        };
    }
    if (name === "load_examples") {
        const dir = getProposalsDir();
        if (!fs.existsSync(BUNDLED_EXAMPLES_DIR)) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Bundled examples not found at ${BUNDLED_EXAMPLES_DIR}. This can happen if you're running from source. Try reinstalling via npx.`,
                    },
                ],
            };
        }
        const files = fs
            .readdirSync(BUNDLED_EXAMPLES_DIR)
            .filter((f) => f.endsWith(".md") || f.endsWith(".txt"));
        if (files.length === 0) {
            return {
                content: [{ type: "text", text: "No bundled examples available." }],
            };
        }
        const loaded = [];
        const skipped = [];
        for (const file of files) {
            const src = path.join(BUNDLED_EXAMPLES_DIR, file);
            const dest = path.join(dir, file);
            if (fs.existsSync(dest)) {
                skipped.push(file);
            }
            else {
                fs.copyFileSync(src, dest);
                loaded.push(file);
            }
        }
        const totalNow = fs
            .readdirSync(dir)
            .filter((f) => f.endsWith(".md") || f.endsWith(".txt")).length;
        const summary = loaded.length > 0
            ? `Loaded ${loaded.length} example${loaded.length > 1 ? "s" : ""}: ${loaded.join(", ")}.`
            : `All ${files.length} bundled example${files.length > 1 ? "s" : ""} already in your library — nothing to do.`;
        const skipNote = skipped.length > 0 ? ` (${skipped.length} already existed, skipped)` : "";
        return {
            content: [
                {
                    type: "text",
                    text: `${summary}${skipNote}\n\nYour library now has ${totalNow} proposal${totalNow !== 1 ? "s" : ""}. Use draft_proposal with any brief to start.\n\n💡 **Need unlimited drafts?** Pro ($19/mo) removes the monthly cap so you can draft as many proposals as you win. [Upgrade to Pro →](${PRO_URL})`,
                },
            ],
        };
    }
    if (name === "usage_status") {
        const usage = getUsage();
        const remaining = FREE_DRAFT_LIMIT - usage.draft_count;
        const status = remaining > 0
            ? `**ProposalCraft — Free Plan**\n${usage.draft_count}/${FREE_DRAFT_LIMIT} drafts used in ${usage.month}. **${remaining} remaining.**\n\n**Pro — $19/mo**: unlimited drafts, no monthly cap.\n[Upgrade to Pro →](${PRO_URL})`
            : `**ProposalCraft — Free Plan: Limit Reached**\n${usage.draft_count}/${FREE_DRAFT_LIMIT} drafts used in ${usage.month}. Resets 1st of next month.\n\n**Upgrade to Pro — $19/mo**: unlimited drafts, no monthly cap.\n[Upgrade to Pro →](${PRO_URL})`;
        return { content: [{ type: "text", text: status }] };
    }
    if (name === "client_followup") {
        const summary = String(args.proposal_summary);
        const days = Number(args.days_since_sent);
        const context = args.context ? String(args.context) : null;
        const urgencyNote = days <= 3
            ? "It's only been a few days — keep the follow-up very light and give them an easy out."
            : days <= 7
                ? "A week is a natural follow-up window. Be friendly and direct."
                : days > 14
                    ? "It's been over two weeks — acknowledge the gap briefly, don't be apologetic, and make it easy to restart."
                    : "Follow up professionally; assume they're busy, not disinterested.";
        const contextNote = context
            ? `\nClient context: ${context}\nLet this context shape the tone — warmer for enthusiastic/existing clients, more neutral for cold leads.`
            : "";
        return {
            content: [
                {
                    type: "text",
                    text: `Write a short follow-up message for a proposal that has not received a response.

Rules:
- Maximum 4 sentences. No fluff.
- Do NOT open with "I hope this finds you well" or any similar filler.
- Do NOT apologise for following up.
- Give them a clear, low-friction way to respond (yes/no/not now are all acceptable outcomes).
- Match the tone to the client relationship and elapsed time.
- End with a single concrete question or call to action.

${urgencyNote}${contextNote}

PROPOSAL SUMMARY:
${summary}

Days since sent: ${days}

Write the follow-up now. Output only the message text — no subject line, no commentary.`,
                },
            ],
        };
    }
    if (name === "improve_proposal") {
        const proposal = String(args.proposal);
        const focus = args.focus ? String(args.focus) : null;
        const focusInstruction = focus
            ? `Pay particular attention to: **${focus}**. Lead with improvements in that area before covering anything else.`
            : "Cover all major dimensions: opening hook, scope clarity, pricing presentation, why-me/differentiation, and call to action.";
        return {
            content: [
                {
                    type: "text",
                    text: `Review the following proposal draft and produce a structured improvement report.

${focusInstruction}

For each issue you find, give:
- The **specific text** that is weak (quote it)
- **Why** it weakens the proposal
- A **revised version** the sender can drop in directly

Structure your review as:

**Strengths** — 2–3 things working well that should be kept as-is.

**Critical fixes** (must address before sending)
List each as: [Section] → problem → revised text

**Polish suggestions** (nice to have)
Shorter list of optional improvements.

**Overall verdict** — one of: Send as-is / Minor edits needed / Significant rewrite recommended
One sentence of reasoning.

---

PROPOSAL TO REVIEW:

${proposal}`,
                },
            ],
        };
    }
    if (name === "proposal_to_email") {
        const proposal = String(args.proposal);
        const clientName = args.client_name ? String(args.client_name) : "there";
        const yourName = args.your_name ? String(args.your_name) : "[Your Name]";
        const cta = args.cta ? String(args.cta) : null;
        const ctaLine = cta
            ? `The call to action should be: ${cta}`
            : "Infer an appropriate call to action from the proposal (e.g. book a call, reply to confirm, review the attached, sign off).";
        return {
            content: [
                {
                    type: "text",
                    text: `Convert the proposal below into a short pitch email. The client's name is ${clientName}. Sign off as ${yourName}.

Rules:
- Maximum 150 words in the email body. Shorter is better.
- Open with a one-sentence statement of what you're proposing and why it matters to them specifically.
- Include: the core solution (1–2 sentences), the price or range (one line), and a single clear call to action.
- Do NOT paste the full proposal. Do NOT use bullet lists — write in short paragraphs.
- No filler phrases ("I hope this email finds you well", "Please don't hesitate", "I wanted to reach out").
- The email should read like a confident professional wrote it, not a template.
- ${ctaLine}
- Subject line: write one concise, specific subject line (not "Proposal for [Project]" — something that conveys the value).

Output format:
Subject: [subject line]

[email body]

---

PROPOSAL TO CONVERT:

${proposal}`,
                },
            ],
        };
    }
    if (name === "scope_of_work") {
        const proposal = String(args.proposal);
        const clientName = String(args.client_name);
        const startDate = args.start_date ? String(args.start_date) : "as agreed";
        const yourName = args.your_name ? String(args.your_name) : "[Your Name / Company]";
        return {
            content: [
                {
                    type: "text",
                    text: `Generate a formal Scope of Work document from the accepted proposal below.

Parties: ${yourName} (Service Provider) and ${clientName} (Client).
Project start: ${startDate}.

Structure the SOW with these sections:

**1. Project Overview** — one paragraph summarising the engagement.

**2. Deliverables** — numbered list of specific, measurable outputs. Each item should be concrete enough that completion is unambiguous.

**3. Timeline** — milestone table: Milestone | Due Date | Deliverable(s). Derive dates from the proposal scope; where none are given, suggest reasonable durations starting from ${startDate}.

**4. Payment Schedule** — map payments to milestones (e.g. 50% on signing, 50% on delivery). Use the price from the proposal. If no price is stated, leave a [TBC] placeholder.

**5. Revision Policy** — state number of revision rounds included; define what constitutes a revision vs. a change in scope.

**6. Change Order Clause** — one short paragraph: any scope changes must be agreed in writing; additional work is billed at [hourly rate or day rate — leave as placeholder if not in proposal].

**7. Acceptance** — signature block: Service Provider name/date and Client name/date.

Rules:
- Use clear, plain language — no legal jargon beyond what is necessary for enforceability.
- Do not add deliverables or obligations not implied by the proposal.
- Keep the document to one page if possible.

---

ACCEPTED PROPOSAL:

${proposal}`,
                },
            ],
        };
    }
    if (name === "project_kickoff_email") {
        const proposal = String(args.proposal);
        const clientName = String(args.client_name);
        const startDate = args.start_date ? String(args.start_date) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your Name]";
        const workingProcess = args.working_process ? String(args.working_process) : null;
        const startLine = startDate
            ? `Project start: ${startDate}.`
            : "No start date was specified — suggest one in the email or confirm it as a next step.";
        const processLine = workingProcess
            ? `Working process the freelancer uses: ${workingProcess}`
            : "Working process: suggest a sensible default (e.g. a short kick-off call, async feedback via comments, weekly update cadence).";
        return {
            content: [
                {
                    type: "text",
                    text: `Write a project kickoff email from the accepted proposal below.

Client first name: ${clientName}
${startLine}
Sign-off name: ${yourName}
${processLine}

The email should:
1. Open warmly — acknowledge the project is happening, make the client feel good about their decision (one sentence, no filler).
2. Confirm what was agreed — restate the key deliverables, timeline, and total price in 2–3 bullet points. Keep it brief; the SOW covers detail.
3. Introduce the working process — explain how you'll communicate, when the client can expect updates, and what you need from them to start. Max 3 bullet points.
4. List immediate next steps — a numbered list of the next 2–3 actions (e.g. "I'll send a calendar invite for our kick-off call", "Please send over your brand assets by Friday", "Invoice for the first instalment is attached").
5. Close with confidence — one sentence that reassures the client and sets a positive tone.

Rules:
- Maximum 250 words total.
- No corporate filler ("I'm thrilled to partner with you on this exciting journey").
- Specific and concrete — name the actual deliverables, not generic categories.
- Output format: Subject: [line]\\n\\n[email body]

---

ACCEPTED PROPOSAL:

${proposal}`,
                },
            ],
        };
    }
    throw new Error(`Unknown tool: ${name}`);
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("ProposalCraft MCP server running");
}
main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map