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
const PRO_URL = "https://mcpize.com/mcp/proposalcraft-2";
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
const server = new Server({ name: "proposalcraft", version: "1.4.92" }, { capabilities: { tools: {} } });
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
        {
            name: "availability_announcement",
            description: "Write a warm, non-desperate email to past clients announcing you have capacity opening up. Past clients are the highest-converting leads — this email re-activates relationships without cold-pitching. Under 120 words, one soft ask. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    your_name: {
                        type: "string",
                        description: "Your name (sign-off)",
                    },
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    past_project: {
                        type: "string",
                        description: "Brief reference to the project you did together (e.g. 'the rebrand we did last year', 'your e-commerce site')",
                    },
                    available_from: {
                        type: "string",
                        description: "When you have capacity (e.g. 'from July', 'mid-June', 'end of this month')",
                    },
                    capacity_type: {
                        type: "string",
                        description: "Optional: what kind of work you have capacity for (e.g. 'a new project', 'a retainer', 'a few days of consulting'). Default: new project work.",
                    },
                },
                required: ["your_name", "client_name", "past_project", "available_from"],
            },
        },
        {
            name: "project_closure_email",
            description: "Write the final email when a project is fully delivered and complete. Confirms what was delivered, handles any handover items, expresses genuine thanks, and plants seeds for future work. Different from project_kickoff_email (which starts the engagement) — this closes it professionally. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    your_name: {
                        type: "string",
                        description: "Your name (sign-off)",
                    },
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_name: {
                        type: "string",
                        description: "Brief name or description of the project (e.g. 'the Acme Corp website redesign', 'the brand identity project')",
                    },
                    what_was_delivered: {
                        type: "string",
                        description: "What you delivered — list the key deliverables (e.g. '5-page Webflow site, style guide, mobile-optimised')",
                    },
                    handover_items: {
                        type: "string",
                        description: "Optional: anything the client still needs to action (e.g. 'update your DNS records', 'add your own copy to the About page', 'set your own admin password')",
                    },
                    warranty_period: {
                        type: "string",
                        description: "Optional: any support or bug-fix period you're offering (e.g. '14 days of bug fixes included', '30-day support window')",
                    },
                    future_work_hook: {
                        type: "string",
                        description: "Optional: a natural next-step or future work opportunity to mention (e.g. 'SEO setup', 'quarterly content updates', 'Phase 2 mobile app')",
                    },
                },
                required: ["your_name", "client_name", "project_name", "what_was_delivered"],
            },
        },
        {
            name: "meeting_recap_email",
            description: "Write a professional post-meeting recap email to send to a client after a discovery call, check-in, kickoff, or project review. Summarises what was discussed, confirms decisions, and lists next steps with owners. Creates a paper trail and keeps the project moving. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    your_name: {
                        type: "string",
                        description: "Your name (used in the sign-off)",
                    },
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    meeting_type: {
                        type: "string",
                        enum: ["discovery", "kickoff", "check-in", "review", "sales"],
                        description: "Type of meeting — shapes the tone and what sections are emphasised (default: check-in)",
                    },
                    key_points: {
                        type: "string",
                        description: "What was discussed — paste rough notes or a bullet list. The tool will shape them into clean prose.",
                    },
                    decisions: {
                        type: "string",
                        description: "Optional: specific decisions confirmed in the meeting (e.g. 'approved the blue colour palette', 'agreed to delay launch by 2 weeks')",
                    },
                    next_steps: {
                        type: "string",
                        description: "Optional: what happens next and who owns each item (e.g. 'You: send logo files by Friday. Me: deliver wireframes by June 18.')",
                    },
                    follow_up_date: {
                        type: "string",
                        description: "Optional: when you'll next connect (e.g. 'June 20', 'next Thursday')",
                    },
                },
                required: ["your_name", "client_name", "key_points"],
            },
        },
        {
            name: "referral_request",
            description: "Write a short, warm email asking a happy client to refer you to others in their network. Different from testimonial_request (which asks for a written review) — this asks for an introduction or recommendation to potential new clients. Under 120 words, one clear ask, no pressure. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    your_name: {
                        type: "string",
                        description: "Your name (used in the sign-off)",
                    },
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_summary: {
                        type: "string",
                        description: "Brief description of what you delivered (e.g. 'website redesign', 'brand identity project', 'three months of SEO consulting')",
                    },
                    your_specialty: {
                        type: "string",
                        description: "What you do in plain terms — what you want the referral for (e.g. 'web design for professional services firms', 'brand identity for early-stage startups', 'freelance copywriting')",
                    },
                    timing: {
                        type: "string",
                        description: "Optional: when relative to project completion you're sending this (e.g. 'two weeks after delivery', 'at handover'). Defaults to after final delivery.",
                    },
                },
                required: ["your_name", "client_name", "project_summary", "your_specialty"],
            },
        },
        {
            name: "contract_template",
            description: "Generate a plain-English Freelance Services Agreement — the full working contract covering services, payment, IP, revisions, termination, and liability. More comprehensive than an NDA (which covers only confidentiality) and more legally framed than a SOW (which covers deliverables). Suitable for most standard freelance and consulting engagements. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    your_name: {
                        type: "string",
                        description: "Your full name or company name (the service provider)",
                    },
                    client_name: {
                        type: "string",
                        description: "The client's full name or company name",
                    },
                    project_description: {
                        type: "string",
                        description: "Brief description of the services being provided",
                    },
                    total_price: {
                        type: "string",
                        description: "Total contract value (e.g. '$5,500', '$8,000 + expenses')",
                    },
                    payment_terms: {
                        type: "string",
                        description: "How and when payment is made (e.g. '50% on signing, 50% on delivery', 'monthly in advance', 'net-30 on invoice'). Default: 50% on signing, 50% on final delivery.",
                    },
                    revision_rounds: {
                        type: "number",
                        description: "Number of included revision rounds. Default: 2.",
                    },
                    start_date: {
                        type: "string",
                        description: "Project start date (optional, e.g. 'June 15, 2026')",
                    },
                    governing_law: {
                        type: "string",
                        description: "Governing law jurisdiction (e.g. 'New South Wales, Australia', 'California, USA'). Optional.",
                    },
                },
                required: ["your_name", "client_name", "project_description", "total_price"],
            },
        },
        {
            name: "nda_template",
            description: "Generate a simple, plain-English Non-Disclosure Agreement for freelance client work. Covers what's confidential, duration, exceptions, and a basic remedies clause. One-way (client's info stays confidential) or mutual. Not a substitute for legal advice — suitable for most standard freelance engagements. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    your_name: {
                        type: "string",
                        description: "Your full name or company name (the service provider)",
                    },
                    client_name: {
                        type: "string",
                        description: "The client's full name or company name",
                    },
                    project_description: {
                        type: "string",
                        description: "Brief description of the project or engagement (e.g. 'website redesign', 'software development services')",
                    },
                    duration_years: {
                        type: "number",
                        description: "How long confidentiality obligations last in years (default: 2). Typical range: 1-5.",
                    },
                    mutual: {
                        type: "boolean",
                        description: "true = mutual NDA (both parties protect each other's info); false (default) = one-way (you protect the client's confidential information only)",
                    },
                    governing_law: {
                        type: "string",
                        description: "Optional: governing law jurisdiction (e.g. 'England and Wales', 'California, USA', 'New South Wales, Australia'). Leave blank to use a placeholder.",
                    },
                },
                required: ["your_name", "client_name", "project_description"],
            },
        },
        {
            name: "project_status_update",
            description: "Write a professional project status update email to send a client during a longer engagement. Covers what was completed, what's next, any blockers or decisions needed, and the current timeline. Keeps clients informed without requiring a meeting. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_name: {
                        type: "string",
                        description: "Short name or description of the project (e.g. 'the Shopify redesign', 'the API integration')",
                    },
                    completed_this_period: {
                        type: "string",
                        description: "What was done since the last update — bullet points or free text",
                    },
                    next_steps: {
                        type: "string",
                        description: "What's happening next — bullet points or free text",
                    },
                    blockers: {
                        type: "string",
                        description: "Optional: anything blocked or decisions needed from the client. Leave blank if none.",
                    },
                    timeline_status: {
                        type: "string",
                        description: "Optional: overall timeline status — e.g. 'on track', 'ahead of schedule', 'slightly behind — see note below', 'launch date moving to Jul 18'",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "completed_this_period", "next_steps"],
            },
        },
        {
            name: "budget_proposal",
            description: "When a client says your quote is too high, write a revised proposal offering a reduced scope at a lower price — not a rate cut. Helps freelancers hold their rate while giving the client a path forward. Counts against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    original_proposal: {
                        type: "string",
                        description: "The original proposal or scope summary that was rejected as too expensive",
                    },
                    client_feedback: {
                        type: "string",
                        description: "What the client said about the budget (e.g. 'your quote is double our budget', 'we were thinking more like $3k', 'we only have $5k to spend')",
                    },
                    target_budget: {
                        type: "string",
                        description: "Optional: the budget the client mentioned, if any (e.g. '$5,000', '$3k'). Helps calibrate what to cut.",
                    },
                    client_name: {
                        type: "string",
                        description: "Optional: the client's first name",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["original_proposal", "client_feedback"],
            },
        },
        {
            name: "rejection_response",
            description: "Write a professional response to a client who has chosen another provider. Keeps the door open for future work without being bitter, clingy, or sycophantic. Short, gracious, and memorable. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_type: {
                        type: "string",
                        description: "Brief description of the project you pitched (e.g. 'website redesign', 'the mobile app build', 'content retainer')",
                    },
                    rejection_reason: {
                        type: "string",
                        description: "Optional: what the client said (e.g. 'went with a cheaper option', 'chose someone with more industry experience', 'decided to go in-house', 'no reason given'). Helps tailor the tone.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                    keep_door_open: {
                        type: "boolean",
                        description: "Optional: true (default) to include a light, non-pushy mention of future work; false to keep it purely gracious with no forward ask.",
                    },
                },
                required: ["client_name", "project_type"],
            },
        },
        {
            name: "cold_pitch",
            description: "Write a cold outbound pitch email to a potential client you've identified but who hasn't contacted you. Different from inbound proposal work — this is proactive business development. Short, specific, and ends with a single easy ask. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    target_company: {
                        type: "string",
                        description: "The company or person you're pitching to",
                    },
                    contact_name: {
                        type: "string",
                        description: "Optional: the specific person's name (first name is fine)",
                    },
                    what_you_do: {
                        type: "string",
                        description: "What you do — your service or specialism (e.g. 'UX design for SaaS onboarding', 'copywriting for B2B tech', 'React development')",
                    },
                    why_them: {
                        type: "string",
                        description: "Why you're reaching out to THIS company specifically — a signal you spotted, a problem they likely have, something you noticed (e.g. 'your pricing page has 3 steps that add friction', 'you just launched a mobile app but the onboarding is unclear', 'your job listing mentions struggling with X')",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name or company for the sign-off",
                    },
                    ask: {
                        type: "string",
                        description: "Optional: what you want from this email (default: a 15-minute call). E.g. 'a quick call to see if there's a fit', 'to send a short audit', 'to share a relevant case study'",
                    },
                },
                required: ["target_company", "what_you_do", "why_them"],
            },
        },
        {
            name: "invoice_reminder",
            description: "Write a polite but firm reminder for an overdue or unpaid invoice. Generates the right tone for the reminder number — first reminder is friendly and assumes an oversight, second is firmer, third adds urgency. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name or company name",
                    },
                    invoice_number: {
                        type: "string",
                        description: "Invoice number or reference (e.g. 'Invoice #042', 'INV-2026-06')",
                    },
                    amount: {
                        type: "string",
                        description: "The amount owed (e.g. '$3,500', '£1,200')",
                    },
                    due_date: {
                        type: "string",
                        description: "Original due date (e.g. 'June 1', '30 days ago')",
                    },
                    reminder_number: {
                        type: "number",
                        description: "Which reminder this is: 1 (friendly, assume oversight), 2 (firm, request confirmation), or 3 (urgent, flag next steps). Default: 1.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "invoice_number", "amount", "due_date"],
            },
        },
        {
            name: "rate_increase_email",
            description: "Write an email telling an existing client you are raising your rates. One of the most anxiety-inducing tasks for freelancers. Generates a direct, professional email that gives enough notice, explains the new rate without over-explaining, and preserves the relationship. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    current_rate: {
                        type: "string",
                        description: "Your current rate (e.g. '$85/hr', '$3,000/project', '$2,000/mo retainer')",
                    },
                    new_rate: {
                        type: "string",
                        description: "Your new rate",
                    },
                    effective_date: {
                        type: "string",
                        description: "When the new rate takes effect (e.g. 'August 1', 'next quarter', 'after this project')",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                    relationship_context: {
                        type: "string",
                        description: "Optional: brief note on the working relationship (e.g. 'we've worked together for 2 years', 'ongoing monthly retainer', 'occasional project work'). Helps calibrate tone.",
                    },
                },
                required: ["client_name", "current_rate", "new_rate", "effective_date"],
            },
        },
        {
            name: "retainer_proposal",
            description: "Draft a proposal for an ongoing monthly retainer engagement. Retainer proposals are structurally different from project proposals — they define a monthly scope, what is and isn't included, a rollover/unused-hours policy, and a 30-day termination clause. Counts against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    brief: {
                        type: "string",
                        description: "The client brief or your notes on what ongoing work they need",
                    },
                    monthly_scope: {
                        type: "string",
                        description: "What is included each month (e.g. '10 hours of design work', 'up to 3 blog posts', 'ongoing technical support')",
                    },
                    monthly_fee: {
                        type: "string",
                        description: "Optional: the monthly fee (e.g. '$2,500/mo'). Leave blank to generate a placeholder.",
                    },
                    minimum_term: {
                        type: "string",
                        description: "Optional: minimum commitment period (e.g. '3 months', '6 months'). Leave blank to use a standard 30-day rolling structure.",
                    },
                    client_name: {
                        type: "string",
                        description: "Optional: the client's name or company",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name or company for the sign-off",
                    },
                },
                required: ["brief", "monthly_scope"],
            },
        },
        {
            name: "testimonial_request",
            description: "Write a short, personal email asking a client for a testimonial after successful project delivery. Not a form, not a survey link — a genuine, specific ask that gets responses. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_summary: {
                        type: "string",
                        description: "Brief description of what you delivered (e.g. 'the Shopify redesign', 'the API integration project')",
                    },
                    specific_win: {
                        type: "string",
                        description: "Optional: a concrete result or outcome from the project (e.g. 'the site launched on time and conversion rate is up 18%'). Makes the ask more personal and specific.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                    where_to_post: {
                        type: "string",
                        description: "Optional: where you'd like the testimonial posted (e.g. 'LinkedIn', 'your website', 'Google'). Leave blank to keep it open.",
                    },
                },
                required: ["client_name", "project_summary"],
            },
        },
        {
            name: "discovery_call_prep",
            description: "Prepare for a discovery call with a potential client. Given a brief, generates sharp questions to ask (budget, timeline, decision-maker, success criteria, pain points), a short call agenda, and the 2-3 things you must confirm before committing to a proposal. Use between analyze_brief and draft_proposal. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    brief: {
                        type: "string",
                        description: "The client brief or enquiry email",
                    },
                    analysis: {
                        type: "string",
                        description: "Optional: output from analyze_brief, if already run. Avoids repeating work.",
                    },
                    your_service: {
                        type: "string",
                        description: "Optional: a one-line description of what you offer (e.g. 'UX design for SaaS products'). Helps tailor questions to your specialism.",
                    },
                },
                required: ["brief"],
            },
        },
        {
            name: "change_order",
            description: "Write a professional change order document when a client requests work outside the original project scope. Clearly defines what was agreed, what is being added, the additional cost and timeline impact, and requires client sign-off before work begins. Protects you from scope creep. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    original_scope: {
                        type: "string",
                        description: "Brief description of the original agreed project scope (or paste the SOW deliverables section)",
                    },
                    change_requested: {
                        type: "string",
                        description: "Description of what the client is now asking for that falls outside the original scope",
                    },
                    additional_cost: {
                        type: "string",
                        description: "Optional: the additional fee for this change (e.g. '$800', '4 hours at $150/hr'). Leave blank to generate a placeholder.",
                    },
                    timeline_impact: {
                        type: "string",
                        description: "Optional: how this change affects the delivery date (e.g. '+3 business days', 'no impact', 'pushes launch to Jul 15')",
                    },
                    client_name: {
                        type: "string",
                        description: "The client's name (for the header and sign-off block)",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name or company name",
                    },
                },
                required: ["original_scope", "change_requested", "client_name"],
            },
        },
        {
            name: "discount_request_response",
            description: "Write a response when a client asks for a lower price. Caving too easily devalues your work; being defensive loses the deal. This generates a firm, warm reply in one of three modes: hold the rate (with reasoning), offer scope reduction instead, or offer payment terms instead. Protects your rate without burning the relationship. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                    original_price: {
                        type: "string",
                        description: "Your quoted price (e.g. '$4,500', '£3,200')",
                    },
                    response_mode: {
                        type: "string",
                        enum: ["hold_rate", "reduce_scope", "payment_terms"],
                        description: "'hold_rate' = decline the discount and explain why the price is right; 'reduce_scope' = offer a smaller version at their budget; 'payment_terms' = keep the full price but split payments to ease cashflow. Default: hold_rate.",
                    },
                    their_budget: {
                        type: "string",
                        description: "Optional: what budget they mentioned (e.g. '$3,000'). Used in reduce_scope and payment_terms modes.",
                    },
                    context: {
                        type: "string",
                        description: "Optional: any context about the project or relationship that should shape the tone (e.g. 'long-term client', 'startup with limited budget', 'they said the project is on hold if we can't find a middle ground')",
                    },
                },
                required: ["client_name", "your_name", "original_price"],
            },
        },
        {
            name: "scope_clarification_email",
            description: "Write a professional email to a prospective client asking for the information you need before you can quote accurately. Most freelancers either guess (wrong) or send a list of demands (off-putting). This generates a short, confidence-building email with 2–4 targeted questions that signal expertise, not confusion. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_type: {
                        type: "string",
                        description: "What kind of project it is (e.g. 'website redesign', 'brand identity', 'SEO audit')",
                    },
                    missing_info: {
                        type: "string",
                        description: "What you don't know yet and need to understand before quoting (e.g. 'budget range, number of pages, whether copy is provided', 'whether they need ongoing support or a one-off build', 'timeline and existing brand assets')",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                    context: {
                        type: "string",
                        description: "Optional: brief context about what they did share (e.g. 'You mentioned you need a new website for your yoga studio launching in September'). Used to show you read their message.",
                    },
                },
                required: ["client_name", "project_type", "missing_info", "your_name"],
            },
        },
        {
            name: "linkedin_post",
            description: "Write a concise, authentic LinkedIn post about a project win, lesson learned, or professional insight. LinkedIn is where freelancers get inbound leads — but most avoid posting because writing feels awkward. This generates a post in a natural professional voice (150–250 words): specific hook, the story, the takeaway, a soft CTA. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    topic: {
                        type: "string",
                        description: "What to post about (e.g. 'won a new e-commerce client', 'a mistake I made on a project', 'why I stopped working with certain clients', 'delivered a rebrand under budget')",
                    },
                    key_insight: {
                        type: "string",
                        description: "The one insight or takeaway you want readers to leave with",
                    },
                    your_role: {
                        type: "string",
                        description: "Optional: your professional role/title to anchor the post (e.g. 'freelance web designer', 'brand consultant', 'UX contractor'). Default: freelancer.",
                    },
                    include_cta: {
                        type: "boolean",
                        description: "Optional: include a soft call-to-action at the end (e.g. follow for more, DM for work). Default: true.",
                    },
                    tone: {
                        type: "string",
                        enum: ["professional", "conversational", "direct"],
                        description: "Optional: post tone. 'professional' = polished, 'conversational' = warm and relatable, 'direct' = no filler, just the point. Default: conversational.",
                    },
                },
                required: ["topic", "key_insight"],
            },
        },
        {
            name: "case_study_outline",
            description: "Turn a completed project into a structured portfolio case study. Most freelancers know they should document their work but never do — this generates a complete outline (challenge, approach, results, learnings) ready to paste into your website, LinkedIn, or proposal as a credibility sample. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    project_type: {
                        type: "string",
                        description: "What kind of project it was (e.g. 'brand identity for a SaaS startup', 'e-commerce website for a fashion brand', 'SEO audit for a B2B consultancy')",
                    },
                    client_industry: {
                        type: "string",
                        description: "The client's industry or sector (e.g. 'fintech', 'retail', 'healthcare')",
                    },
                    problem: {
                        type: "string",
                        description: "The core problem or challenge the client hired you to solve",
                    },
                    approach: {
                        type: "string",
                        description: "How you tackled it — your process, methods, or key decisions",
                    },
                    results: {
                        type: "string",
                        description: "The outcomes: metrics, qualitative wins, or what the client said. Be specific if you have numbers (e.g. '40% faster load time', 'launched on time under budget').",
                    },
                    anonymise: {
                        type: "boolean",
                        description: "Optional: set to true to keep the client anonymous (uses 'a [industry] company' instead of their name). Default: false.",
                    },
                    client_name: {
                        type: "string",
                        description: "Optional: the client or company name, used in the case study heading if not anonymised.",
                    },
                },
                required: ["project_type", "client_industry", "problem", "approach", "results"],
            },
        },
        {
            name: "late_delivery_apology",
            description: "Write a professional email when you are going to miss a deadline or are already late. Takes ownership without over-apologising, gives a clear revised timeline, and keeps the client's trust intact. The tone is direct and accountable — no excuses, no grovelling. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    deliverable: {
                        type: "string",
                        description: "What is late (e.g. 'the homepage designs', 'the API integration', 'the first draft')",
                    },
                    original_deadline: {
                        type: "string",
                        description: "The deadline you missed or are about to miss (e.g. 'Friday 13 June', 'end of week')",
                    },
                    new_deadline: {
                        type: "string",
                        description: "The revised delivery date you are committing to (be specific — 'Monday 16 June by 5pm')",
                    },
                    reason: {
                        type: "string",
                        description: "Optional: a brief, honest reason — one line only. Omit if no clean explanation exists. Do NOT blame the client.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "deliverable", "original_deadline", "new_deadline"],
            },
        },
        {
            name: "client_onboarding_checklist",
            description: "Generate a tailored list of everything you need from a client before work can start — access, assets, decisions, approvals. Adapt by project type so the client knows exactly what to send and in what order. Send this after the kickoff email, before starting work. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    project_type: {
                        type: "string",
                        description: "The type of project (e.g. 'website redesign', 'brand identity', 'copywriting', 'mobile app', 'SEO audit', 'video production', 'e-commerce build')",
                    },
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    deliverables: {
                        type: "string",
                        description: "Optional: comma-separated list of specific deliverables so the checklist can be more targeted (e.g. 'homepage, about page, contact form, blog')",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["project_type", "client_name"],
            },
        },
        {
            name: "upsell_email",
            description: "Write a warm, non-pushy email to a happy client suggesting additional services or a retainer after a successful project. Existing clients convert at 3–5x the rate of cold prospects — this is the highest-ROI sales email a freelancer can send. Timing: right after delivering and getting positive feedback. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    completed_project: {
                        type: "string",
                        description: "The project you just delivered (e.g. 'the website redesign', 'the brand identity', 'the SEO audit')",
                    },
                    upsell_service: {
                        type: "string",
                        description: "What you're suggesting next (e.g. 'an ongoing SEO retainer', 'a monthly content package', 'a mobile app version', 'a quarterly brand refresh')",
                    },
                    value_hook: {
                        type: "string",
                        description: "Optional: a specific result or observation from the completed project that makes the upsell relevant (e.g. 'your site traffic jumped 40% in the first week', 'three pages need copy updates based on the audit findings')",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "completed_project", "upsell_service"],
            },
        },
        {
            name: "project_pause_email",
            description: "Write a professional email when a project needs to pause — whether the client asked to stop, you're waiting on their content or feedback, or something on your end has come up. Documents the current state, what's outstanding, and what restarts the work. Keeps the relationship intact and protects both parties. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_name: {
                        type: "string",
                        description: "The name or short description of the project (e.g. 'the website redesign', 'the brand identity project')",
                    },
                    paused_by: {
                        type: "string",
                        enum: ["client", "me", "mutual"],
                        description: "Who is initiating the pause: 'client' (they asked), 'me' (you need to pause), or 'mutual' (agreed by both). Affects tone.",
                    },
                    reason: {
                        type: "string",
                        description: "Brief honest reason for the pause (e.g. 'budget freeze on your end', 'waiting on content from you', 'I have a capacity constraint', 'scope needs to be clarified before we continue')",
                    },
                    completed_work: {
                        type: "string",
                        description: "Summary of what has been delivered or completed so far",
                    },
                    outstanding_items: {
                        type: "string",
                        description: "What still needs to be done to complete the project",
                    },
                    resumption_trigger: {
                        type: "string",
                        description: "Optional: what needs to happen before work resumes (e.g. 'when you send the content', 'when budget is confirmed', 'when you'\''re ready to restart — just let me know')",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "paused_by", "reason", "completed_work", "outstanding_items"],
            },
        },
        {
            name: "partnership_outreach",
            description: "Write a peer-to-peer outreach email to a complementary service provider — a designer reaching out to a copywriter, a developer to a designer, a consultant to an agency. Proposes a referral partnership where you both send clients each other's way. Warm, not transactional, under 150 words. Referral partnerships are one of the highest-ROI growth moves a freelancer can make — one good partner can generate years of warm inbound. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    recipient_name: {
                        type: "string",
                        description: "Their first name",
                    },
                    recipient_service: {
                        type: "string",
                        description: "What they do (e.g. 'copywriting', 'brand strategy', 'UX design', 'paid ads', 'SEO')",
                    },
                    your_service: {
                        type: "string",
                        description: "What you do (e.g. 'web design', 'mobile development', 'social media management')",
                    },
                    shared_client_type: {
                        type: "string",
                        description: "The type of client you both serve (e.g. 'SaaS startups', 'e-commerce brands', 'professional services firms', 'small creative agencies')",
                    },
                    connection_hook: {
                        type: "string",
                        description: "Optional: how you found them or what specifically caught your attention (e.g. 'saw your work on the Acme rebrand', 'we have a mutual client in the fintech space', 'came across your portfolio via LinkedIn'). Makes the email feel specific rather than templated.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["recipient_name", "recipient_service", "your_service", "shared_client_type"],
            },
        },
        {
            name: "subcontractor_brief",
            description: "Generate a clear project brief for a subcontractor or VA you're bringing in for part of a project. Covers their specific scope, deliverable format and deadline, what NOT to include, payment terms, work-for-hire IP clause, and confidentiality note. Getting this right upfront prevents the most common sub problems: scope bleed, missed handoffs, and ownership disputes. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    sub_name: {
                        type: "string",
                        description: "The subcontractor's first name",
                    },
                    their_role: {
                        type: "string",
                        description: "What they are being hired to do (e.g. 'frontend development', 'copywriting', 'graphic design', 'video editing', 'data entry')",
                    },
                    project_context: {
                        type: "string",
                        description: "Brief description of the parent project so they understand the context (e.g. 'website redesign for a 20-person accounting firm', 'brand identity for a new fintech startup')",
                    },
                    their_scope: {
                        type: "string",
                        description: "Exactly what they are responsible for — be specific. Use commas or semicolons to separate items.",
                    },
                    out_of_scope: {
                        type: "string",
                        description: "Optional: what is explicitly NOT their responsibility — prevents scope bleed (e.g. 'copywriting, hosting setup, client communication')",
                    },
                    deliverable_format: {
                        type: "string",
                        description: "How they should deliver the work (e.g. 'Figma file with organised layers', 'Google Doc with tracked changes off', 'MP4 at 1080p in a shared Drive folder')",
                    },
                    deadline: {
                        type: "string",
                        description: "When you need their work delivered (e.g. 'Friday 20 June by 5pm', '3 business days after kickoff')",
                    },
                    rate: {
                        type: "string",
                        description: "What you are paying them (e.g. '$800 flat', '$75/hour, estimated 8 hours', '$400 on delivery')",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["sub_name", "their_role", "project_context", "their_scope", "deliverable_format", "deadline", "rate"],
            },
        },
        {
            name: "reactivation_email",
            description: "Write a short, light-touch email to a prospect who went quiet mid-conversation — a warm lead that stalled before they committed. Not needy, not pushy. Gives them a graceful re-entry point and an easy out. Most freelancers let cold leads die or over-chase awkwardly — this hits the middle: a single, low-pressure nudge that often gets a reply. Under 100 words. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    prospect_name: {
                        type: "string",
                        description: "Their first name",
                    },
                    context: {
                        type: "string",
                        description: "What you were discussing (e.g. 'the website redesign you enquired about', 'the brand identity project we scoped out in March', 'the SEO audit proposal I sent over')",
                    },
                    time_elapsed: {
                        type: "string",
                        description: "How long ago the conversation went quiet (e.g. 'a few weeks', 'last month', 'a couple of months')",
                    },
                    value_add: {
                        type: "string",
                        description: "Optional: a new hook that makes the timing relevant — something that's changed since you last spoke (e.g. 'I just wrapped a similar project for a law firm and have some relevant results to share', 'I have a gap opening in July', 'we updated our process based on a few recent projects'). Leave blank if there's no natural hook.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["prospect_name", "context", "time_elapsed"],
            },
        },
        {
            name: "conference_talk_pitch",
            description: "Write a speaker submission for a conference, meetup, or podcast — a talk abstract, key takeaways, and speaker bio formatted for a CFP (Call for Proposals). Public speaking is the highest-authority marketing move a freelancer can make. Most people don't do it because the CFP process feels opaque. This generates a submission-ready pitch. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    talk_title: {
                        type: "string",
                        description: "The proposed title of your talk (e.g. 'How I Stopped Writing Proposals and Started Closing Clients', 'The Freelancer's Guide to Saying No Profitably')",
                    },
                    audience: {
                        type: "string",
                        description: "Who will be in the room (e.g. 'freelancers and independent consultants', 'senior marketers at B2B SaaS companies', 'creative professionals and agency owners')",
                    },
                    problem_solved: {
                        type: "string",
                        description: "The core problem or frustration your talk addresses (e.g. 'most freelancers lose deals not on price but on how they present their value')",
                    },
                    key_takeaways: {
                        type: "string",
                        description: "2–4 specific things attendees will walk away with, comma-separated (e.g. 'a proposal structure that closes faster, how to handle the budget question, three phrases that stop scope creep')",
                    },
                    your_expertise: {
                        type: "string",
                        description: "Why you are qualified to give this talk — be specific (e.g. '8 years of freelance web design, 120+ client projects, wrote the ProposalCraft MCP server used by 500+ consultants')",
                    },
                    talk_format: {
                        type: "string",
                        description: "Optional: length and format (e.g. '30-minute talk + Q&A', '45-minute workshop', '20-minute lightning talk'). Defaults to a standard 30-minute talk if omitted.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the bio and sign-off",
                    },
                },
                required: ["talk_title", "audience", "problem_solved", "key_takeaways", "your_expertise"],
            },
        },
        {
            name: "client_offboarding_email",
            description: "Write a gracious, professional email ending an ongoing client relationship — a retainer, a long-term engagement, or a repeat working arrangement. Distinct from project_closure_email (a project that completed naturally) — this is for when you are choosing to end the relationship. The hardest email a freelancer has to write. Gets the tone right: clear and firm without blame, warm without being dishonest, and structured to preserve the relationship for future referrals. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    engagement_description: {
                        type: "string",
                        description: "What you are ending (e.g. 'our monthly retainer', 'our ongoing content partnership', 'our working relationship')",
                    },
                    final_date: {
                        type: "string",
                        description: "When the engagement ends (e.g. 'June 30', 'end of this month', 'in 30 days')",
                    },
                    outstanding_work: {
                        type: "string",
                        description: "What you will complete before the end date (e.g. 'the June content deliverables', 'the current sprint', 'nothing outstanding — all work is up to date')",
                    },
                    reason: {
                        type: "string",
                        description: "Optional: a brief, honest reason — keep it high-level (e.g. 'I am restructuring my practice to focus on a narrower service area', 'my capacity is changing', 'I need to reduce my client load'). Omit if there is no clean explanation.",
                    },
                    offer_referral: {
                        type: "boolean",
                        description: "Optional: set to true to include an offer to recommend another provider. Default: false.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "engagement_description", "final_date", "outstanding_work"],
            },
        },
        {
            name: "annual_review_email",
            description: "Write an end-of-year (or end-of-engagement-period) review email to a long-term client — what was delivered, the standout result, a reflection on the working relationship, and a forward-looking suggestion for the next period. Positions you as a strategic partner rather than a transactional vendor. Naturally opens the conversation for renewal or expansion without hard-selling. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    engagement_duration: {
                        type: "string",
                        description: "How long you have worked together (e.g. 'this past year', '12 months', 'the past two years')",
                    },
                    key_deliverables: {
                        type: "string",
                        description: "The main things you delivered over the period — comma-separated (e.g. 'monthly blog content, SEO audit, landing page rewrites, email sequences')",
                    },
                    highlight: {
                        type: "string",
                        description: "The single biggest win, result, or moment worth calling out (e.g. 'the homepage rewrite that cut bounce rate by 30%', 'launching the new product line on time and under budget', 'the campaign that generated 40 qualified leads in the first month')",
                    },
                    next_suggestion: {
                        type: "string",
                        description: "What you're suggesting for the next period — can be a renewal, an expansion, or simply an invitation to discuss (e.g. 'continue at the same scope', 'add quarterly strategy sessions', 'expand into email marketing', 'a quick call to map out next year')",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "engagement_duration", "key_deliverables", "highlight", "next_suggestion"],
            },
        },
        {
            name: "feedback_request_email",
            description: "Write a short, genuine email asking a client for private feedback after a project — not a public testimonial, just honest input to help you improve. Clients who are asked for feedback feel valued; you get patterns you'd never discover otherwise. Distinct from testimonial_request (which asks for a public review for marketing purposes). Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_name: {
                        type: "string",
                        description: "The project you delivered (e.g. 'the website redesign', 'the brand identity project', 'the three-month content retainer')",
                    },
                    specific_aspect: {
                        type: "string",
                        description: "Optional: a specific part of the experience you're genuinely curious about — makes the request feel purposeful rather than generic (e.g. 'how the communication felt during the revision rounds', 'whether the timeline worked for your team', 'the clarity of my initial briefing process')",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name"],
            },
        },
        {
            name: "out_of_office_email",
            description: "Write a professional heads-up email to clients before you go on leave. Confident and matter-of-fact — doesn't apologize for taking time off. Sets clear expectations on dates, response time, and what (if anything) to do for urgent matters. Different from an auto-reply: this is the proactive note you send to active clients a few days before you leave. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    start_date: {
                        type: "string",
                        description: "First day you're away (e.g. 'Monday June 16', 'June 16')",
                    },
                    end_date: {
                        type: "string",
                        description: "Last day you're away (e.g. 'Friday June 27', 'June 27')",
                    },
                    return_date: {
                        type: "string",
                        description: "First day back — when they can expect a response (e.g. 'Monday June 30', 'June 30')",
                    },
                    project_status: {
                        type: "string",
                        description: "Optional: note about ongoing work — reassures client everything is in hand (e.g. 'the first draft will be with you before I leave', 'your project is on track and nothing is scheduled during this period', 'I'll complete the homepage before I go')",
                    },
                    urgent_contact: {
                        type: "string",
                        description: "Optional: who or how to reach someone for genuine urgencies (e.g. 'for anything genuinely urgent, email my colleague at colleague@example.com', 'I'll have limited access and will check messages once a week')",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "start_date", "end_date", "return_date"],
            },
        },
        {
            name: "recommendation_request_email",
            description: "Write the email asking a happy client for a LinkedIn recommendation. Different from testimonial_request (which asks for a short quote for your website): a LinkedIn recommendation lives on the client's own profile and carries far more social proof. This email makes the ask easy — keeps it short, gives the client a memory prompt, and optionally suggests a focus so they don't face a blank page. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_name: {
                        type: "string",
                        description: "The project or engagement to reference (e.g. 'the brand identity project', 'the six-month content retainer', 'the website redesign')",
                    },
                    standout_result: {
                        type: "string",
                        description: "Optional: a specific result or moment to remind them of — gives them something concrete to write about (e.g. 'the site launched on time and traffic doubled in the first month', 'the proposal we worked on won the Deloitte contract')",
                    },
                    focus_suggestion: {
                        type: "string",
                        description: "Optional: what aspect of the work you'd love them to speak to — makes it easier for them to write (e.g. 'communication and turnaround speed', 'the strategic thinking behind the copy', 'reliability and quality under a tight deadline'). Keep to one thing.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name"],
            },
        },
        {
            name: "project_delay_warning",
            description: "Write a proactive email warning a client that a deadline is at risk — BEFORE you've actually missed it. The professional middle path between staying silent (and surprising them) and over-apologising (when you're not late yet). Demonstrates that you're on top of the project and gives the client time to adjust. Different from late_delivery_apology (which is sent after you've already missed the deadline). Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_name: {
                        type: "string",
                        description: "The project or deliverable at risk (e.g. 'the brand guidelines', 'the v2 API integration', 'the homepage redesign')",
                    },
                    original_deadline: {
                        type: "string",
                        description: "The agreed delivery date (e.g. 'Friday June 13', 'end of this week')",
                    },
                    expected_delay: {
                        type: "string",
                        description: "How much of a delay you're expecting (e.g. '2–3 days', 'about a week', 'until Monday')",
                    },
                    reason: {
                        type: "string",
                        description: "Optional: a brief, honest reason for the delay (e.g. 'a dependency on the client's API took longer than expected', 'a family situation came up'). Keep to one sentence. Omit if no clean reason.",
                    },
                    new_delivery_date: {
                        type: "string",
                        description: "Optional: the specific new date you're committing to (e.g. 'Tuesday June 17'). Include if you know it; omit if you need a day to confirm.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "original_deadline", "expected_delay"],
            },
        },
        {
            name: "client_check_in_email",
            description: "Write a short proactive check-in email during a long project — the 'just wanted you to know things are on track' message that prevents client anxiety and the 'where are we with this?' interruption. Under 100 words. Different from project_status_update (which is a full structured weekly report): this is a light, warm pulse sent mid-phase to maintain trust during silent execution periods. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_name: {
                        type: "string",
                        description: "The project name or description",
                    },
                    current_stage: {
                        type: "string",
                        description: "Where things stand right now (e.g. 'about halfway through the design phase', 'finalizing the copy before the first draft', 'in build — the homepage and services pages are done')",
                    },
                    next_milestone: {
                        type: "string",
                        description: "The next thing the client will see or hear from you (e.g. 'the first draft for your review on Thursday', 'a call to walk through the prototype next week', 'the completed site for sign-off by end of month')",
                    },
                    on_track: {
                        type: "boolean",
                        description: "Optional: whether the project is on track for the agreed timeline (default: true). If false, the email will flag the issue and invite a call rather than pretend everything is fine.",
                    },
                    blocker: {
                        type: "string",
                        description: "Optional: only used when on_track is false — what's causing the issue or what you need from them (e.g. 'I'm still waiting on the brand guidelines we discussed', 'a question came up about the payment integration that needs your input')",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "current_stage", "next_milestone"],
            },
        },
        {
            name: "project_restart_email",
            description: "Write a professional email restarting a paused project. Pairs with project_pause_email to complete the pause/resume lifecycle. Acknowledges the gap, confirms readiness, states the first concrete action, and addresses any timeline adjustments. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_name: {
                        type: "string",
                        description: "The project name or description",
                    },
                    restart_reason: {
                        type: "string",
                        description: "Optional: what cleared the way to restart (e.g. 'the budget has been approved', 'I've wrapped the other project', 'the feedback from your stakeholders is in'). Keep it brief — one clause.",
                    },
                    first_action: {
                        type: "string",
                        description: "The first concrete thing you'll do to get moving again (e.g. 'send over a revised timeline by Wednesday', 'pick up from the homepage copy', 'schedule a quick catch-up call to re-align on priorities')",
                    },
                    timeline_note: {
                        type: "string",
                        description: "Optional: any adjustment to the original delivery timeline (e.g. 'the original deadline of July 15 still holds', 'I'll need to push the delivery by one week to July 22 to account for the pause')",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "first_action"],
            },
        },
        {
            name: "working_hours_email",
            description: "Write a brief, professional email setting expectations about your working hours and response times with a client. Confident and matter-of-fact — frames boundaries as something that helps the client get better work, not as a personal restriction. Works for setting hours proactively at project start, responding after a late-night or weekend message, or resetting expectations mid-project. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    your_hours: {
                        type: "string",
                        description: "Your working hours (e.g. 'Monday–Friday, 9am–5pm GMT', 'weekdays, UK hours', 'Mon–Thu 8am–4pm EST')",
                    },
                    response_time: {
                        type: "string",
                        description: "Optional: typical response time within those hours (e.g. 'within 4 hours', 'by end of business day', 'within one business day'). Defaults to 'within one business day' if omitted.",
                    },
                    urgent_path: {
                        type: "string",
                        description: "Optional: how to reach you for genuine urgencies outside hours (e.g. 'mark your email URGENT in the subject line', 'text me directly'). If omitted, no urgent path is mentioned.",
                    },
                    trigger: {
                        type: "string",
                        enum: ["proactive", "after_late_message", "mid_project_reset"],
                        description: "Context for sending: 'proactive' (setting hours at project start — default), 'after_late_message' (responding to a message sent outside your hours), 'mid_project_reset' (resetting expectations mid-project when a pattern has developed)",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "your_hours"],
            },
        },
        {
            name: "scope_warning_email",
            description: "Write a professional email flagging scope creep BEFORE issuing a change order — the early-warning conversation that prevents the surprise-invoice moment. Use this when you notice a client requesting something beyond the original brief; it surfaces the issue collaboratively so the client can confirm they want the extra work (triggering a change order) or clarify it's within scope. Different from change_order (which documents agreed extra work and its cost); this is the conversation that comes first. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_name: {
                        type: "string",
                        description: "The project name or description",
                    },
                    original_scope: {
                        type: "string",
                        description: "What was agreed in the original brief or contract (e.g. 'five-page website with a contact form', 'three rounds of copy revisions')",
                    },
                    new_request: {
                        type: "string",
                        description: "What the client is now asking for that falls outside that scope (e.g. 'an e-commerce shop with product pages', 'a complete brand refresh alongside the copy')",
                    },
                    estimated_impact: {
                        type: "string",
                        description: "Optional: rough estimate of the time or cost impact — makes it concrete without being a formal invoice (e.g. 'roughly 6–8 additional hours', 'an additional £800–£1,200 depending on final spec'). Leave blank if you don't yet know.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "original_scope", "new_request"],
            },
        },
        {
            name: "deposit_request_email",
            description: "Write the email requesting a project deposit before work begins. Deposits are standard professional practice — this email is confident and clear, not apologetic. Fills the gap between signing the contract/SOW and starting work. Works for any deposit amount or percentage. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_name: {
                        type: "string",
                        description: "The project name or description (e.g. 'the website redesign', 'your brand identity project')",
                    },
                    deposit_amount: {
                        type: "string",
                        description: "The deposit amount or percentage (e.g. '$2,500', '50%', '$1,500 (50% of the total)')",
                    },
                    total_amount: {
                        type: "string",
                        description: "Optional: the full project cost (e.g. '$5,000') — included when helpful for context",
                    },
                    payment_link: {
                        type: "string",
                        description: "Optional: a payment link URL (Stripe, PayPal, Wise, etc.) — makes it one-click for the client",
                    },
                    payment_method: {
                        type: "string",
                        description: "Optional: preferred payment method if no link (e.g. 'bank transfer', 'Wise', 'PayPal'). Include account details separately.",
                    },
                    due_date: {
                        type: "string",
                        description: "Optional: when you need the deposit by (e.g. 'by Friday', 'before we kick off on Monday', 'within 5 business days')",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "deposit_amount"],
            },
        },
        {
            name: "late_payment_reminder",
            description: "Write a professional overdue-payment reminder when a client has not paid an invoice by the due date. States the invoice details clearly, keeps the tone firm but not hostile, and gives a direct path to pay. A second-reminder variant adds a firmer note about next steps (late fee, pausing work). Distinct from invoice_cover_email (accompanying a fresh invoice) and deposit_request_email (requesting upfront payment). Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name or full name of the client",
                    },
                    invoice_number: {
                        type: "string",
                        description: "Invoice reference number (e.g. 'INV-042', '#2024-07')",
                    },
                    amount: {
                        type: "string",
                        description: "The overdue amount as a string (e.g. '$1,200', '£850')",
                    },
                    due_date: {
                        type: "string",
                        description: "The original due date (e.g. 'June 5', '5 June 2026')",
                    },
                    days_overdue: {
                        type: "number",
                        description: "How many days past the due date the invoice is (e.g. 7, 14, 30)",
                    },
                    payment_link: {
                        type: "string",
                        description: "A direct payment link or portal URL if you have one",
                    },
                    is_second_reminder: {
                        type: "boolean",
                        description: "Set to true for a firmer second reminder that mentions next steps (late fee, pausing work) — defaults to false",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name"],
            },
        },
        {
            name: "invoice_dispute_response_email",
            description: "Write the professional reply when a client disputes or questions a charge on an invoice — 'I thought this was included', 'We agreed on a lower price', 'I don't recognise this line item'. Three response modes: 'explain' (default — the charge is valid and correct, explain clearly and calmly why), 'adjust' (you'll credit or reduce the invoice as a goodwill gesture or because of a genuine error), 'clarify' (you need more information from them before you can respond fully). Distinct from late_payment_reminder (client hasn't paid but hasn't disputed), budget_update_email (you're informing of a cost increase before invoicing), and scope_change_email (formal change order for extra work) — this is the specific situation where a client has received your invoice and is pushing back on a line item. Professional, calm, not defensive — resolves the dispute without damaging the relationship. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    disputed_item: {
                        type: "string",
                        description: "What they're disputing (e.g. 'the additional hour charge', 'the rush fee', 'the final milestone payment')",
                    },
                    project_name: {
                        type: "string",
                        description: "Name of the project",
                    },
                    response_mode: {
                        type: "string",
                        enum: ["explain", "adjust", "clarify"],
                        description: "How to respond: 'explain' (charge is valid, explain it — default), 'adjust' (you'll credit or reduce the invoice), 'clarify' (you need more detail before responding)",
                    },
                    explanation: {
                        type: "string",
                        description: "Why the charge is valid (used in 'explain' mode — e.g. 'this covers the two additional revision rounds requested on June 3rd beyond the three included in the original scope')",
                    },
                    adjustment: {
                        type: "string",
                        description: "What you'll do to resolve it (used in 'adjust' mode — e.g. 'remove the rush fee', 'credit $200 against the balance', 'issue a revised invoice at the originally discussed rate')",
                    },
                    invoice_number: {
                        type: "string",
                        description: "Invoice number for reference in the subject line (e.g. 'INV-047')",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "disputed_item"],
            },
        },
        {
            name: "client_feedback_response_email",
            description: "Write the professional reply to critical or negative mid-project feedback from a client. Three response modes: 'accept' (default — feedback is valid, you acknowledge it and state your action plan), 'clarify' (there's a misunderstanding that needs resolving before you can act — asks one focused clarifying question without being defensive), 'discuss' (feedback is complex or directional enough that a call is needed to align properly). Distinct from revision_response_email (specific change requests like 'change the font' or 'rewrite section 2') — this is for qualitative, directional, or emotional feedback ('this doesn't feel right', 'I'm disappointed with the direction', 'this isn't what I was expecting'). Most freelancers either get defensive, over-apologise, or go silent — this is the professional middle path: acknowledges the concern, shows you heard them, and keeps the project moving forward. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    feedback_summary: {
                        type: "string",
                        description: "One sentence capturing what the client said (e.g. 'they said the overall direction feels off and not what they envisioned', 'they expressed disappointment with the visual style')",
                    },
                    project_name: {
                        type: "string",
                        description: "Name of the project",
                    },
                    response_mode: {
                        type: "string",
                        enum: ["accept", "clarify", "discuss"],
                        description: "How to respond: 'accept' (valid feedback, you'll address it — default), 'clarify' (misunderstanding needs resolving first), 'discuss' (complex enough to warrant a call)",
                    },
                    action_plan: {
                        type: "string",
                        description: "What you'll do to address the feedback (used in 'accept' mode — e.g. 'revisit the colour palette and send two alternative directions by Thursday')",
                    },
                    clarification_question: {
                        type: "string",
                        description: "The single most important question to ask (used in 'clarify' mode — e.g. 'were you expecting a more minimal layout, or is it the content hierarchy that feels off?')",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "feedback_summary"],
            },
        },
        {
            name: "price_increase_email",
            description: "Write the email notifying a long-term client that your rates are increasing. One of the hardest emails a freelancer writes — most either avoid it entirely (and undercharge for years) or frame it apologetically (which invites pushback). This email is confident, warm, and forward-looking: gives clear notice (typically 30–60 days), states the new rate plainly, optionally anchors it in specific value delivered, and closes with an offer to discuss. Distinct from budget_proposal (negotiating a project price before signing), discount_request_response (responding to a client's pushback on price), and budget_update_email (explaining a cost overrun on a current project) — this is the proactive rate change communication to an ongoing client or retainer. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    new_rate: {
                        type: "string",
                        description: "Your new rate or pricing (e.g. '$150/hour', '$5,000/month retainer', '$2,800 per project')",
                    },
                    current_rate: {
                        type: "string",
                        description: "Your current rate — including it makes the change concrete and shows transparency (e.g. '$120/hour')",
                    },
                    effective_date: {
                        type: "string",
                        description: "When the new rate takes effect (e.g. 'August 1', 'from your next project', 'in 60 days') — gives the client time to plan",
                    },
                    project_name: {
                        type: "string",
                        description: "Name of the ongoing engagement or retainer, if relevant",
                    },
                    value_highlight: {
                        type: "string",
                        description: "A specific result or achievement from your work together that anchors the value (e.g. 'tripling their newsletter open rate', 'launching three products on time and on budget') — optional but makes the email stronger",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "new_rate"],
            },
        },
        {
            name: "discovery_call_follow_up_email",
            description: "Write the short follow-up email sent within 24 hours of a discovery call with a new prospect. Fills the critical workflow gap: meeting_request_email → [call happens] → discovery_call_follow_up_email → draft_proposal. Distinct from project_kickoff_email (sent after signing, not after an intro call) and meeting_request_email (schedules the call — this follows it). Structure: warm one-line open, brief summary of the 2–3 key things discussed (confirms you were listening and reduces 'what did we actually agree?' friction), confirmed next step with a date if available, and a low-pressure 'let me know if I've missed anything' close. Under 150 words. The email most freelancers skip — which is why sending it immediately differentiates you. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    project_name: {
                        type: "string",
                        description: "Name or type of project discussed (e.g. 'the rebrand', 'your new website')",
                    },
                    what_discussed: {
                        type: "string",
                        description: "2–3 key points covered in the call, comma-separated (e.g. 'timeline of 6 weeks, design-only scope, launching before Q4'). Auto-formatted as a short summary.",
                    },
                    confirmed_next_step: {
                        type: "string",
                        description: "The agreed next action (e.g. 'I'll have a proposal to you by Thursday', 'you'll send over the existing brand assets', 'we'll reconnect after your board meeting'). If omitted, the email closes with a general next-step offer.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "what_discussed"],
            },
        },
        {
            name: "testimonial_follow_up_email",
            description: "Write a gentle follow-up when a testimonial request has gone unanswered — sent one to two weeks after the initial testimonial_request. Distinct from testimonial_request (the first ask): this is the nudge that dramatically increases conversion because most clients meant to respond but let it slip. The key technique: offer to write a short draft for them to edit or approve — this removes the blank-page friction that kills most testimonial requests. Under 80 words, no guilt, no pressure. Optional offer_draft param (default true) adds the draft offer, which is the highest-impact line in the email. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    project_name: {
                        type: "string",
                        description: "Name of the project (helps make the email feel specific rather than templated)",
                    },
                    offer_draft: {
                        type: "boolean",
                        description: "Whether to offer to write a short draft for the client to edit (default true — this is the highest-impact offer you can make in a testimonial follow-up)",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name"],
            },
        },
        {
            name: "third_party_delay_email",
            description: "Write the email notifying a client of a delay caused by an external dependency outside your control — a subcontractor running late, a third-party API or platform outage, a supplier delay, or a required approval not arriving. Distinct from project_delay_warning (your own work is at risk), project_extension_email (you need more time), and late_delivery_apology (you missed a deadline): this is the specific communication for when the blocker is external. Structure: states what is delayed and why (naming the external cause clearly), what you're doing to manage or mitigate it, and a revised timeline if known. Tone: transparent and proactive, not defensive — you didn't cause this but you own communicating it. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    project_name: {
                        type: "string",
                        description: "Name of the project",
                    },
                    what_is_delayed: {
                        type: "string",
                        description: "What specifically is delayed (e.g. 'the design handover', 'the API integration', 'the final build')",
                    },
                    external_cause: {
                        type: "string",
                        description: "The external party or cause (e.g. 'the payment gateway API', 'our print supplier', 'the client-side legal sign-off', 'a subcontractor')",
                    },
                    mitigation: {
                        type: "string",
                        description: "What you are doing about it (e.g. 'I've escalated with the supplier', 'I'm building a workaround in parallel', 'I'm in daily contact with the team')",
                    },
                    revised_eta: {
                        type: "string",
                        description: "Revised delivery date or timeframe if known (e.g. 'Thursday 26 June', 'early next week'). Omit if genuinely unknown.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "what_is_delayed", "external_cause"],
            },
        },
        {
            name: "project_extension_email",
            description: "Write the email requesting more time on a project when the agreed deadline can no longer be met — the confirmed ask, not a risk warning. Distinct from project_delay_warning (sent when a deadline is at risk but not yet missed) and late_delivery_apology (sent after you've already missed it): this is the professional middle ground — you know you need more time, you're requesting it before the deadline passes, and you're being specific about the new date. Structure: states the current deadline, requests the specific extension needed, gives a brief honest reason (one sentence), and confirms what will be delivered by the new date. Does not grovel or over-explain. Most freelancers either say nothing until they're late, or send a vague 'I might need a bit more time' — this is the direct, professional ask that respects the client's schedule. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    project_name: {
                        type: "string",
                        description: "Name of the project",
                    },
                    original_deadline: {
                        type: "string",
                        description: "The agreed deadline (e.g. 'Friday 20 June' or 'end of this week')",
                    },
                    new_deadline: {
                        type: "string",
                        description: "The specific new date or timeframe being requested (e.g. 'Wednesday 25 June' or 'the following Monday')",
                    },
                    reason: {
                        type: "string",
                        description: "Brief honest reason for the extension — one sentence (e.g. 'the API integration took longer than anticipated', 'I had an unavoidable client emergency this week')",
                    },
                    deliverable: {
                        type: "string",
                        description: "What you will deliver by the new date (if different from the full project, e.g. 'the first draft', 'the complete build')",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "original_deadline", "new_deadline"],
            },
        },
        {
            name: "budget_update_email",
            description: "Write the email informing a client that the project will cost more than originally estimated — due to unforeseen technical complexity, third-party cost increases, or scope that proved harder than anticipated. This is distinct from scope_change_email (client requested extra work) and budget_proposal (client said your quote was too high): this is the honest update when your own estimate turns out to be off, and you need to raise the number before proceeding. Structure: clear statement of original vs. updated figure, a brief honest reason (one sentence — not an essay), and a question asking how they'd like to proceed before you go further. Tone: direct and professional, not grovelling or defensive. Most freelancers either absorb the cost silently or surprise clients with a higher invoice — this is the professional middle path that respects the client's budget and your rate. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    project_name: {
                        type: "string",
                        description: "Name of the project",
                    },
                    original_estimate: {
                        type: "string",
                        description: "The original cost estimate (e.g. '$2,500' or '20 hours')",
                    },
                    updated_cost: {
                        type: "string",
                        description: "The revised cost or estimate (e.g. '$3,200' or '28 hours')",
                    },
                    reason: {
                        type: "string",
                        description: "Brief explanation for the increase — e.g. 'the integration required a custom solution we didn't anticipate', 'the third-party API pricing changed'. One sentence max.",
                    },
                    approval_needed: {
                        type: "boolean",
                        description: "Whether to ask for client approval before proceeding (default true — always recommended)",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "original_estimate", "updated_cost"],
            },
        },
        {
            name: "client_decline_email",
            description: "Write a professional email declining a client project inquiry — when you can't or shouldn't take the work. Covers four common situations: capacity (you're fully booked), not_fit (the project isn't the right match for your skills or style), timing (wrong timing — project start doesn't align), or budget (their budget doesn't meet your rates). Warm and respectful throughout: preserves the relationship, never burns a bridge. Optionally offers to refer them to someone better suited — turning a decline into goodwill. Most freelancers either ghost prospects or write awkward excuses; this is the professional middle path that keeps the door open for future work. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    project_name: {
                        type: "string",
                        description: "Name or short description of the project being declined (optional)",
                    },
                    decline_reason: {
                        type: "string",
                        enum: ["capacity", "not_fit", "timing", "budget"],
                        description: "Primary reason for declining: capacity (fully booked), not_fit (wrong match), timing (dates don't work), budget (below your rate). Defaults to capacity if omitted.",
                    },
                    suggest_referral: {
                        type: "boolean",
                        description: "Whether to offer to pass their details to someone who might be a better fit (default true)",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name"],
            },
        },
        {
            name: "unclear_brief_email",
            description: "Write the email sent when a client's brief is too vague to start work safely — asks targeted clarifying questions before time is spent. Lists the specific unclear points concisely, explains why each matters (to avoid rework or surprises), and offers a quick call if it's easier than written answers. Professional and collaborative in tone — not a complaint, not a lecture. Prevents scope creep and misaligned deliverables from the start. Distinct from scope_change_email (used mid-project when scope expands) and revision_response_email (used after client feedback). Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name or full name of the client",
                    },
                    project_name: {
                        type: "string",
                        description: "Name or description of the project",
                    },
                    unclear_points: {
                        type: "array",
                        items: { type: "string" },
                        description: "The specific things that need clarification (e.g. 'Who is the target audience?', 'What does success look like — increased signups, revenue, engagement?'). 2–5 questions work best.",
                    },
                    suggest_call: {
                        type: "boolean",
                        description: "Whether to offer a quick call as an alternative to written answers — defaults to true",
                    },
                    response_deadline: {
                        type: "string",
                        description: "Date or timeframe by which you need answers to stay on schedule (e.g. 'by Thursday', 'before end of week')",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "unclear_points"],
            },
        },
        {
            name: "onboarding_questionnaire",
            description: "Write the onboarding questionnaire email sent to a new client right after they sign the contract. Gathers everything you need to start work: goals, target audience, brand assets, access credentials, tone/style preferences, examples they like or dislike, key contacts, and approval workflow. Includes optional custom questions for project-specific needs. Avoids the back-and-forth that slows down project starts and sets a professional tone from day one. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name or full name of the client",
                    },
                    project_name: {
                        type: "string",
                        description: "Name of the project",
                    },
                    due_date: {
                        type: "string",
                        description: "Date by which you need the questionnaire returned (e.g. 'Friday 20 June', 'by end of week')",
                    },
                    kickoff_date: {
                        type: "string",
                        description: "Planned project kickoff or start date — used to frame why the deadline matters",
                    },
                    access_needed: {
                        type: "string",
                        description: "Specific access or credentials you'll need (e.g. 'CMS login, Google Analytics, brand asset folder')",
                    },
                    brand_assets_needed: {
                        type: "boolean",
                        description: "Whether to ask for brand assets (logo, fonts, colours, guidelines) — defaults to true",
                    },
                    custom_questions: {
                        type: "array",
                        items: { type: "string" },
                        description: "Any project-specific questions to append (e.g. 'Who is the primary approver for copy?', 'Do you have existing customer personas?')",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name"],
            },
        },
        {
            name: "portfolio_request_email",
            description: "Write the email asking a past client for permission to feature their project in your portfolio, website, or case studies. Specifies exactly what you want to show, where it will appear, and offers them a preview before it goes live. Gives an easy out if they'd rather not — or offers to anonymise the work instead. Distinct from testimonial_request (asking for a quote) and case_study_outline (writing the case study itself) — this is the consent ask that must happen first. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name or full name of the client",
                    },
                    project_name: {
                        type: "string",
                        description: "Name of the project you want to feature",
                    },
                    portfolio_location: {
                        type: "string",
                        description: "Where the work will appear (e.g. 'my portfolio website', 'a case study on my site', 'proposals to prospective clients')",
                    },
                    specific_work: {
                        type: "string",
                        description: "Optional: the specific piece you want to show (e.g. 'the homepage design', 'the brand identity system', 'before-and-after screenshots'). Makes the ask concrete and limits ambiguity.",
                    },
                    offer_preview: {
                        type: "boolean",
                        description: "Optional: if true (default), offers to share a draft of the portfolio entry before publishing so the client can approve the copy.",
                    },
                    offer_anonymise: {
                        type: "boolean",
                        description: "Optional: if true, offers to remove the client's name/branding if they prefer privacy while still allowing the work to be shown.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "portfolio_location"],
            },
        },
        {
            name: "contract_sent_email",
            description: "Write the short covering email sent when sharing a contract or agreement for a client to sign. Tells the client what they're signing, where to find it, when you need it back, and what happens next. Distinct from contract_template (the contract document itself) — this is the email that wraps around it. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name or full name of the client",
                    },
                    project_name: {
                        type: "string",
                        description: "Name of the project the contract covers",
                    },
                    signing_deadline: {
                        type: "string",
                        description: "Optional: date by which you need the signed contract back (e.g. 'Friday', 'June 20'). If omitted, closes with a general 'let me know if you have any questions' sign-off.",
                    },
                    signing_link: {
                        type: "string",
                        description: "Optional: URL where the client can sign (e.g. a DocuSign or HelloSign link). If provided, used as the primary CTA. If not, assumes contract is attached.",
                    },
                    contract_summary: {
                        type: "string",
                        description: "Optional: one-sentence description of what the contract covers (e.g. 'this covers the scope, payment schedule, and IP terms we discussed'). Helps the client know what to expect before opening.",
                    },
                    start_date: {
                        type: "string",
                        description: "Optional: when work begins once the contract is signed. Signals momentum without pressure.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name"],
            },
        },
        {
            name: "milestone_delivered_email",
            description: "Write the email sent when delivering a project milestone or phase — not the final delivery, but a defined stage with its own deliverables and sign-off. Tells the client exactly what's included, asks for their review and sign-off by a specific date, and states what's next. Distinct from project_completion_email (final handover) and project_status_update (progress report during execution). Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name or full name of the client",
                    },
                    milestone_name: {
                        type: "string",
                        description: "Name or number of this milestone (e.g. 'Phase 1', 'Design Mockups', 'Sprint 2')",
                    },
                    deliverables: {
                        type: "string",
                        description: "Comma-separated list of what is being delivered in this milestone (e.g. 'homepage design, about page, contact form mockup')",
                    },
                    project_name: {
                        type: "string",
                        description: "Optional: name of the overall project",
                    },
                    feedback_deadline: {
                        type: "string",
                        description: "Optional: date by which you need the client's review or sign-off (e.g. 'Friday', 'June 20')",
                    },
                    next_milestone: {
                        type: "string",
                        description: "Optional: brief description of what comes next after sign-off (e.g. 'development build', 'Phase 2: backend integration')",
                    },
                    next_milestone_date: {
                        type: "string",
                        description: "Optional: when the next milestone is expected to be delivered",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "milestone_name", "deliverables"],
            },
        },
        {
            name: "win_back_email",
            description: "Write a short, warm re-engagement email to a past client you haven't worked with in a while (6+ months). Distinct from availability_announcement (broadcast to all past clients) and reactivation_email (cold prospect from a mid-pitch conversation) — this is a targeted, personal one-to-one note to someone you've already delivered results for. The gap is acknowledged briefly and lightly, not apologised for. Closes with a soft open-ended ask ('are you working on anything at the moment?'), not a pitch. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name or full name of the past client",
                    },
                    last_project: {
                        type: "string",
                        description: "Brief description of the last project you delivered for them (e.g. 'the rebranding project', 'your SaaS MVP')",
                    },
                    time_elapsed: {
                        type: "string",
                        description: "Optional: how long since you last worked together (e.g. 'six months', 'about a year'). If omitted, the email keeps it vague.",
                    },
                    value_hook: {
                        type: "string",
                        description: "Optional: a specific, genuine reason to reach out now — a result you achieved that you want to share, something relevant you noticed about their business, a new capability that fits their context. Makes the email feel timely rather than random.",
                    },
                    service_to_offer: {
                        type: "string",
                        description: "Optional: if there's a specific type of work you're hoping to pick up with them, name it (e.g. 'a second phase', 'ongoing SEO', 'a campaign for Q4'). If omitted, the email stays open-ended.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "last_project"],
            },
        },
        {
            name: "project_handover_email",
            description: "Write the email that delivers final project files to a client. Distinct from project_closure_email (which handles the relationship close and testimonial ask) — this is the practical handover: here are your files, here's what's included, here's what you need to do next. Sends with the final deliverables attached or linked. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    deliverables: {
                        type: "string",
                        description: "What you're handing over — list the files, assets, or items (e.g. 'final logo files (SVG, PNG, PDF), brand guidelines PDF, and font licences', 'the completed website, admin login, and documentation')",
                    },
                    project_name: {
                        type: "string",
                        description: "Optional: the project name (e.g. 'the brand identity project', 'your new website')",
                    },
                    access_instructions: {
                        type: "string",
                        description: "Optional: any login credentials, access links, or transfer instructions the client needs (e.g. 'I've transferred ownership of the Figma file to your email', 'admin login details are in the attached doc')",
                    },
                    support_period: {
                        type: "string",
                        description: "Optional: any included post-handover support window (e.g. '7 days of minor amends', '2 weeks of questions via email')",
                    },
                    next_steps_for_client: {
                        type: "string",
                        description: "Optional: what the client needs to do after receiving the files (e.g. 'let me know if anything needs adjusting once you've had a chance to review', 'your developer can now start implementation using the Figma file')",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "deliverables"],
            },
        },
        {
            name: "invoice_cover_email",
            description: "Write the short professional email that accompanies a sent invoice. Most freelancers attach invoices to a blank or one-line email — this tool generates the cover email that frames the invoice, states the amount and due date, and gives the client a clear next step. Under 80 words. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    amount: {
                        type: "string",
                        description: "The invoice total (e.g. '$2,500', '€1,800', '£950')",
                    },
                    invoice_number: {
                        type: "string",
                        description: "Optional: invoice reference number (e.g. 'INV-0042'). Included in the subject line if provided.",
                    },
                    project_name: {
                        type: "string",
                        description: "Optional: the project or work this invoice covers (e.g. 'the website redesign', 'May retainer', 'copywriting — Phase 1')",
                    },
                    due_date: {
                        type: "string",
                        description: "Optional: when payment is due (e.g. 'June 26', 'within 14 days', 'on receipt'). Defaults to a generic 'per our agreed terms' line.",
                    },
                    payment_link: {
                        type: "string",
                        description: "Optional: a direct payment URL (e.g. a Stripe link, PayPal.me). Adds a one-click CTA to the email.",
                    },
                    payment_method: {
                        type: "string",
                        description: "Optional: how you'd like to be paid if no payment link (e.g. 'bank transfer — details on the invoice', 'via Stripe')",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "amount"],
            },
        },
        {
            name: "revision_response_email",
            description: "Write the email responding to a client's revision request. Three modes: 'in_scope' (happy to revise — confirms what you'll change and when), 'exceeds_rounds' (they've used their included revision rounds — explains what's included and what additional rounds cost), 'out_of_scope' (the request is a direction change that requires a change order, not a revision). Distinct from scope_change_email (formal change order) and scope_warning_email (early creep flag) — this is the specific, policy-in-action response to a concrete revision ask. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    revision_type: {
                        type: "string",
                        enum: ["in_scope", "exceeds_rounds", "out_of_scope"],
                        description: "'in_scope': revision is within agreed rounds — you'll do it; 'exceeds_rounds': they've used up their included rounds — additional work costs more; 'out_of_scope': it's a direction change, not a revision — needs a change order",
                    },
                    project_name: {
                        type: "string",
                        description: "Optional: the project name (e.g. 'the brand identity', 'the website redesign')",
                    },
                    revision_request: {
                        type: "string",
                        description: "Optional: brief description of what the client wants changed (e.g. 'swap the colour palette to navy and gold', 'rewrite the homepage copy in a more casual tone'). Makes the response feel specific rather than templated.",
                    },
                    rounds_included: {
                        type: "number",
                        description: "Optional: number of revision rounds included in the original agreement (e.g. 2). Used in 'exceeds_rounds' mode.",
                    },
                    rounds_used: {
                        type: "number",
                        description: "Optional: how many rounds have already been used (e.g. 2). Used in 'exceeds_rounds' mode.",
                    },
                    estimated_cost: {
                        type: "string",
                        description: "Optional: cost for an additional revision round (e.g. '$300', '2 hours at my hourly rate'). Used in 'exceeds_rounds' mode.",
                    },
                    turnaround: {
                        type: "string",
                        description: "Optional: when you'll have the revision back (e.g. 'by Thursday', 'within 2 business days'). Used in 'in_scope' mode.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "revision_type"],
            },
        },
        {
            name: "payment_received_email",
            description: "Write a short, professional email acknowledging receipt of a client payment. Most freelancers say nothing when they get paid — this brief confirmation closes the loop, gives the client a paper trail, and signals what happens next. Under 80 words. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    amount: {
                        type: "string",
                        description: "The payment amount (e.g. '$1,500', '€2,000', 'the deposit')",
                    },
                    project_name: {
                        type: "string",
                        description: "Optional: the project name or description (e.g. 'the website redesign', 'your brand identity project')",
                    },
                    next_step: {
                        type: "string",
                        description: "Optional: what happens next (e.g. 'work begins Monday', 'I'll have the first draft to you by Friday', 'I'll send the final files over today'). Defaults to a generic 'work continues as planned' line.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "amount"],
            },
        },
        {
            name: "introduction_email",
            description: "Write the reply-all when a mutual contact introduces you to a potential client over email. A specific, high-stakes email: the introducer is on CC, so you need to acknowledge them briefly while making a strong direct impression on the prospect — all in under 120 words. Fills the workflow gap between a referral and the discovery call. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    prospect_name: {
                        type: "string",
                        description: "First name of the person you're being introduced to",
                    },
                    introducer_name: {
                        type: "string",
                        description: "First name of the mutual contact who made the introduction (they'll be on CC)",
                    },
                    your_specialty: {
                        type: "string",
                        description: "What you do — one line (e.g. 'freelance web developer', 'brand strategist', 'copywriter for SaaS companies')",
                    },
                    their_context: {
                        type: "string",
                        description: "Optional: what you know about their situation or need (e.g. 'you're looking for help with a product launch', 'you need a new website before the summer'). Makes the email feel specific rather than generic.",
                    },
                    proposed_next_step: {
                        type: "string",
                        description: "Optional: what you want to happen next (e.g. 'a 20-minute call this week', 'a quick call to learn more about the project'). Defaults to suggesting a call.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["prospect_name", "introducer_name", "your_specialty"],
            },
        },
        {
            name: "referral_thank_you",
            description: "Write a warm, specific thank-you to someone who sent you a referral. Three modes based on where things stand: 'intro' (you've just been introduced, haven't connected yet), 'had_call' (you've spoken with the referral), or 'won_project' (you landed the work — the warmest thank-you). Most freelancers skip this entirely and miss a key moment to strengthen the referral relationship. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    referrer_name: {
                        type: "string",
                        description: "First name of the person who sent the referral",
                    },
                    referred_name: {
                        type: "string",
                        description: "First name of the person they referred you to",
                    },
                    outcome: {
                        type: "string",
                        enum: ["intro", "had_call", "won_project"],
                        description: "Where things stand: 'intro' = just been introduced; 'had_call' = had a great call; 'won_project' = landed the work. Defaults to 'intro'.",
                    },
                    project_type: {
                        type: "string",
                        description: "Optional: brief description of the project or context (e.g. 'the branding work', 'a web project', 'a consulting engagement'). Makes the email feel specific rather than generic.",
                    },
                    reciprocate: {
                        type: "boolean",
                        description: "Optional: if true, adds an offer to return the favour — refer them back if the opportunity comes up. Default: true.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["referrer_name", "referred_name"],
            },
        },
        {
            name: "no_response_closure_email",
            description: "Write the 'just closing the loop' email to a prospect who has gone dark after one or more follow-ups. Counter-intuitively, this email often gets a reply when earlier follow-ups didn't — it removes pressure, gives a clear out, and makes it easy for the prospect to re-engage if timing changes later. Calm, friendly, no guilt-tripping, under 80 words. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    prospect_name: {
                        type: "string",
                        description: "The prospect's first name",
                    },
                    project_or_context: {
                        type: "string",
                        description: "What you were discussing (e.g. 'the website redesign', 'the branding project', 'working together on your launch')",
                    },
                    keep_door_open: {
                        type: "boolean",
                        description: "Optional: if true, explicitly mention they're welcome to get in touch when timing is better. Default: true.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["prospect_name", "project_or_context"],
            },
        },
        {
            name: "price_quote_email",
            description: "Write a short, confident email sending a price quote or estimate to a prospective client. For situations where a full formal proposal isn't needed — quick projects, hourly work, or a client who just asked 'how much?' Covers: the work, the price, what's included, and a clear next step. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_description: {
                        type: "string",
                        description: "What you're quoting for — brief description (e.g. 'the landing page redesign', 'copywriting for your website home page', 'a 2-hour strategy session')",
                    },
                    price: {
                        type: "string",
                        description: "Your quoted price or rate (e.g. '$2,400', '$1,800–$2,200', '$150/hr', '$800 flat')",
                    },
                    whats_included: {
                        type: "string",
                        description: "Optional: what the price includes — 2–4 bullet points (e.g. 'initial discovery call, first draft, two rounds of revisions, final files'). If omitted, the email states the deliverable only.",
                    },
                    timeline: {
                        type: "string",
                        description: "Optional: how long the work will take or when you can deliver (e.g. '5 business days after sign-off', 'ready by June 20', 'approx. 2 weeks')",
                    },
                    validity: {
                        type: "string",
                        description: "Optional: how long the quote is valid for (e.g. '30 days', 'until end of month'). Useful if your rates may change or capacity is limited.",
                    },
                    next_step: {
                        type: "string",
                        description: "Optional: what you'd like them to do next (e.g. 'let me know if you'd like to go ahead and I'll send the contract', 'reply to confirm and I can start next week'). Defaults to a simple confirmation ask.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_description", "price"],
            },
        },
        {
            name: "meeting_request_email",
            description: "Write a short, focused email requesting a meeting — a discovery call with a new prospect, a check-in with an existing client, or a catch-up with a collaborator. Fills the workflow gap between sending a cold pitch or initial enquiry and running the actual discovery_call_prep. Offers specific time slots if provided, otherwise makes a flexible open ask. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    recipient_name: {
                        type: "string",
                        description: "The recipient's first name",
                    },
                    meeting_purpose: {
                        type: "string",
                        description: "What the meeting is for — one line (e.g. 'a quick discovery call to talk through your project', 'a 30-minute check-in on the current retainer', 'catching up on where things stand with the rebrand')",
                    },
                    time_options: {
                        type: "string",
                        description: "Optional: 2–3 suggested time slots (e.g. 'Tuesday 10am or Thursday 2pm GMT, or Friday morning'). If omitted, the email asks them to suggest a time that works.",
                    },
                    duration: {
                        type: "string",
                        description: "Optional: how long the meeting will take (e.g. '20 minutes', '30 minutes', 'an hour'). Defaults to a brief mention if omitted.",
                    },
                    platform: {
                        type: "string",
                        description: "Optional: how you'll meet (e.g. 'Zoom', 'Google Meet', 'a phone call', 'in person'). Omit if you don't mind either way.",
                    },
                    context: {
                        type: "string",
                        description: "Optional: one sentence of context explaining why now — especially useful for cold or semi-warm prospects (e.g. 'I've just wrapped a similar project and have a window opening up', 'following up on my email last week')",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["recipient_name", "meeting_purpose"],
            },
        },
        {
            name: "contract_renewal_email",
            description: "Write a professional email proposing to renew a contract, retainer, or ongoing engagement with a client. Warm but businesslike — references the work done together, proposes renewal terms, and invites a conversation. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_or_retainer: {
                        type: "string",
                        description: "What you're renewing (e.g. 'the monthly retainer', 'the SEO contract', 'our content arrangement')",
                    },
                    current_end_date: {
                        type: "string",
                        description: "When the current agreement ends (e.g. 'June 30', 'end of this month', 'July 15')",
                    },
                    renewal_terms: {
                        type: "string",
                        description: "Optional: the proposed renewal terms — same, updated scope, new rate (e.g. 'same scope and rate for another 3 months', 'updated scope covering X and Y at the same monthly rate', '$3,500/mo for the next quarter'). If omitted, the email proposes a call to discuss.",
                    },
                    highlight: {
                        type: "string",
                        description: "Optional: a result or milestone from the current engagement worth referencing (e.g. 'the site traffic increase', '3 months of consistent delivery', 'the rebrand launch'). Makes the email feel specific rather than templated.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_or_retainer", "current_end_date"],
            },
        },
        {
            name: "scope_change_email",
            description: "Write a professional email to a client when work has grown beyond the original scope — new requests, added features, extra rounds of revisions. Raises the issue without accusation, outlines the impact, and presents options (change order, revised quote, or narrowing scope). Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_name: {
                        type: "string",
                        description: "The project name or description (e.g. 'the website redesign', 'your brand identity project')",
                    },
                    scope_change: {
                        type: "string",
                        description: "What has been added or changed beyond the original agreement (e.g. 'adding an e-commerce section to the website', 'three extra rounds of logo revisions', 'building a mobile app version')",
                    },
                    original_scope: {
                        type: "string",
                        description: "Optional: what was originally agreed (e.g. 'a 5-page brochure site', 'two logo concepts with one round of revisions'). Helps contrast clearly.",
                    },
                    time_impact: {
                        type: "string",
                        description: "Optional: how much extra time this adds (e.g. '2–3 extra days', 'roughly a week of additional work')",
                    },
                    cost_impact: {
                        type: "string",
                        description: "Optional: the additional cost or rate adjustment (e.g. '$800 at my standard day rate', 'an additional $1,200')",
                    },
                    proposed_options: {
                        type: "string",
                        description: "Optional: the options you are offering the client (e.g. 'proceed with a change order, or scale the project back to the original scope'). If omitted, a standard two-option proposal is used.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "scope_change"],
            },
        },
        {
            name: "client_waiting_email",
            description: "Write a professional email to a client who hasn't delivered what they promised — assets, feedback, sign-off, content — and the project is blocked waiting on them. Keeps the tone factual and non-accusatory: the goal is to get what you need, not to assign blame. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_name: {
                        type: "string",
                        description: "The project name or description (e.g. 'the website redesign', 'your rebrand')",
                    },
                    what_you_need: {
                        type: "string",
                        description: "What you are waiting on — be specific (e.g. 'the approved copy for the homepage', 'your sign-off on the wireframes', 'the brand logo files')",
                    },
                    days_waiting: {
                        type: "number",
                        description: "Optional: how many days you have been waiting (e.g. 5). Used to calibrate the tone.",
                    },
                    original_deadline: {
                        type: "string",
                        description: "Optional: when the client said they would deliver it (e.g. 'last Friday', 'June 10th', 'end of last week')",
                    },
                    impact: {
                        type: "string",
                        description: "Optional: what this delay blocks or affects (e.g. 'the launch date', 'the development sprint starting Monday', 'handing the final files over')",
                    },
                    new_deadline: {
                        type: "string",
                        description: "Optional: the specific date you need it by to stay on schedule (e.g. 'by Thursday EOD', 'by June 16th')",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "what_you_need"],
            },
        },
        {
            name: "project_completion_email",
            description: "Write a professional email to a client when you deliver the final output and close out a project. Confirms what's been delivered, thanks the client, and optionally asks for a testimonial and points toward future work. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_name: {
                        type: "string",
                        description: "The project name or description (e.g. 'the website redesign', 'your brand identity')",
                    },
                    what_you_delivered: {
                        type: "string",
                        description: "What you are handing over — be specific (e.g. 'the final logo files and brand guide', 'the live website and all source files', 'the completed reports and raw data export')",
                    },
                    delivery_location: {
                        type: "string",
                        description: "Optional: where you are sending or where they can find the deliverables (e.g. 'attached', 'in the shared Dropbox folder', 'via the WeTransfer link below')",
                    },
                    highlight: {
                        type: "string",
                        description: "Optional: one thing you are particularly proud of or want to call out (e.g. 'the mobile animations turned out especially well', 'the new flow cut checkout steps from 6 to 2')",
                    },
                    testimonial_request: {
                        type: "boolean",
                        description: "Optional: whether to include a brief ask for a testimonial or review (default true). Set false to omit.",
                    },
                    future_work: {
                        type: "string",
                        description: "Optional: mention of potential next steps or future work (e.g. 'I would love to help with the next phase', 'if you ever need ongoing support, I am available')",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "what_you_delivered"],
            },
        },
        {
            name: "payment_plan_proposal",
            description: "Write the professional email proposing an installment payment plan when a client cannot pay an invoice in full immediately — either proactively offered when you sense payment difficulty, or as a structured reply when a client has asked for more time. States the plan clearly (number of payments, amounts, schedule), confirms the arrangement in writing, and keeps the tone solution-focused rather than punitive. Distinct from late_payment_reminder (chasing an already-overdue invoice), invoice_dispute_response_email (client is disputing a charge), and deposit_request_email (requesting upfront payment before work begins). Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    invoice_total: {
                        type: "string",
                        description: "The total amount owed (e.g. '$3,500', '£2,200')",
                    },
                    invoice_number: {
                        type: "string",
                        description: "Invoice reference number (e.g. 'INV-051') — included in subject line if provided",
                    },
                    number_of_payments: {
                        type: "number",
                        description: "How many instalments the plan is split into (e.g. 2, 3, 4) — defaults to 2 if not provided",
                    },
                    first_payment: {
                        type: "string",
                        description: "Amount due in the first instalment (e.g. '$1,750', '50%') — if omitted, equal splits are implied",
                    },
                    schedule_description: {
                        type: "string",
                        description: "When subsequent payments are due (e.g. 'every two weeks', 'on the 1st of each month', '30 days after the first payment')",
                    },
                    total_period: {
                        type: "string",
                        description: "Optional: total timeframe the plan spans (e.g. 'six weeks', 'three months') — used to frame the offer naturally",
                    },
                    project_name: {
                        type: "string",
                        description: "Name of the project for context (e.g. 'the brand identity project', 'your website')",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "invoice_total"],
            },
        },
        {
            name: "rush_fee_email",
            description: "Write the professional email notifying a client that their request for expedited delivery comes with a rush fee — and asking for approval before you start. States the accelerated deadline you can hit, the additional charge, and what it covers (weekend hours, rescheduled commitments, etc.), then makes a clear yes/no ask so the timeline doesn't slip further while waiting for a response. Keeps tone matter-of-fact and collaborative, not apologetic. Distinct from budget_update_email (cost overrun from project complexity), scope_change_email (client requests additional work), and project_extension_email (you requesting more time). Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    rush_deadline: {
                        type: "string",
                        description: "The accelerated delivery date the client is requesting (e.g. 'Friday', 'end of day tomorrow', 'Wednesday 5pm')",
                    },
                    rush_fee: {
                        type: "string",
                        description: "The additional charge for rush delivery (e.g. '$400', '30%', '£250')",
                    },
                    original_deadline: {
                        type: "string",
                        description: "Your standard delivery timeline for this project (e.g. 'the end of next week', 'Wednesday the 18th') — named to make the acceleration concrete",
                    },
                    project_name: {
                        type: "string",
                        description: "Name or description of the project (e.g. 'the landing page', 'your brand identity')",
                    },
                    what_it_covers: {
                        type: "string",
                        description: "One-line explanation of what the rush fee reflects — helps the client understand it is fair, not arbitrary (e.g. 'weekend hours and rescheduling two other client commitments', 'two late evenings to hit your deadline')",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "rush_deadline", "rush_fee"],
            },
        },
        {
            name: "expense_reimbursement_email",
            description: "Write the professional email requesting reimbursement from a client for project expenses you have incurred on their behalf — stock images, fonts, software licences, hosting, printing, materials, travel. Required: client_name, expense_description (what you bought and why it was needed), amount. Optional: project_name, receipt_note (e.g. 'I have attached the receipt'), add_to_next_invoice (default false — if true, frames this as a heads-up addition to the next invoice rather than a standalone request), payment_instructions (e.g. 'via your usual payment portal', 'by bank transfer to the details on my invoice'), your_name. Distinct from budget_update_email (cost overrun from increased project scope or time) and invoice_cover_email (billing for your own labour). Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    expense_description: {
                        type: "string",
                        description: "What you purchased and why it was needed for the project (e.g. 'a stock photography licence for the hero image', 'a Figma seat to collaborate on your design files', 'return travel to your office for the kick-off meeting')",
                    },
                    amount: {
                        type: "string",
                        description: "The amount to be reimbursed (e.g. '$85', '£120', '€200')",
                    },
                    project_name: {
                        type: "string",
                        description: "Name or description of the project (e.g. 'the website redesign', 'your brand identity project')",
                    },
                    receipt_note: {
                        type: "string",
                        description: "Optional note about the receipt (e.g. 'I have attached the receipt for your records', 'receipt available on request'). If omitted, no receipt line is added.",
                    },
                    add_to_next_invoice: {
                        type: "boolean",
                        description: "If true, frames the email as a transparency heads-up that this will appear on the next invoice, rather than a standalone reimbursement request. Default: false.",
                    },
                    payment_instructions: {
                        type: "string",
                        description: "How you would like to be paid (e.g. 'via your usual payment portal', 'by bank transfer — details on my invoice', 'alongside the next milestone payment'). Omit if add_to_next_invoice is true.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "expense_description", "amount"],
            },
        },
        {
            name: "pre_meeting_email",
            description: "Write a short email sent 24 hours before a scheduled meeting to share the agenda and confirm the format. Required: client_name, meeting_description (e.g. 'our discovery call tomorrow at 10am'). Optional: agenda_items (comma-separated list of topics — auto-formatted as a numbered list), meeting_format ('video call', 'phone call', 'in person', etc.), meeting_link (Zoom/Meet/Teams URL), prep_request (one thing you need the client to have ready, e.g. 'your current pricing structure', 'the brief you mentioned'), your_name. Completes the meeting lifecycle: meeting_request_email (scheduling) → pre_meeting_email (day before) → [meeting] → meeting_recap_email (after). Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    meeting_description: {
                        type: "string",
                        description: "Brief description of the upcoming meeting (e.g. 'our discovery call tomorrow at 10am', 'Thursday\\'s check-in', 'our kick-off call on Friday at 2pm')",
                    },
                    agenda_items: {
                        type: "string",
                        description: "Comma-separated list of topics you plan to cover (e.g. 'project goals, budget, timeline, next steps'). Auto-formatted as a numbered list. Omit to keep the email simple — useful for informal check-ins.",
                    },
                    meeting_format: {
                        type: "string",
                        description: "How the meeting will happen — e.g. 'video call', 'phone call', 'in person', 'Google Meet'. Omit if already clear from context.",
                    },
                    meeting_link: {
                        type: "string",
                        description: "Video call URL (Zoom, Google Meet, Teams, etc.) — included as a direct join link if provided.",
                    },
                    prep_request: {
                        type: "string",
                        description: "One specific thing you would like the client to have ready before the call (e.g. 'your current proposal process or any examples of briefs you typically receive', 'the draft copy you mentioned', 'your brand guidelines if you have them'). Omit if nothing specific is needed.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "meeting_description"],
            },
        },
        {
            name: "meeting_cancellation_email",
            description: "Write a professional email to cancel or reschedule a meeting. Required: client_name, meeting_description (e.g. 'our Thursday check-in call', 'the kick-off meeting on Friday'). Optional: reason (brief, honest one-line — omit if no clean reason), action (default 'cancel' — use 'reschedule' to propose a new time), new_time (proposed replacement slot if rescheduling, e.g. 'next Tuesday at 2pm'), your_name. Pairs with meeting_request_email (scheduling) and meeting_recap_email (after a meeting that did take place). Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    meeting_description: {
                        type: "string",
                        description: "Brief description of the meeting being cancelled or rescheduled (e.g. 'our Thursday check-in call', 'the kick-off meeting scheduled for Friday at 10am', 'tomorrow's review call')",
                    },
                    reason: {
                        type: "string",
                        description: "Optional one-sentence reason for the cancellation (e.g. 'a scheduling conflict has come up', 'I have been unwell and need to reschedule', 'something urgent has arisen on another project'). If omitted, the email apologises without giving a reason — professional and always appropriate.",
                    },
                    action: {
                        type: "string",
                        enum: ["cancel", "reschedule"],
                        description: "Whether you are cancelling outright ('cancel') or proposing to reschedule ('reschedule'). Default: 'cancel'.",
                    },
                    new_time: {
                        type: "string",
                        description: "Proposed replacement time if rescheduling (e.g. 'next Tuesday at 2pm', 'any time next week that works for you', 'Thursday or Friday afternoon'). Omit if action is 'cancel' or if you want to leave it open.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "meeting_description"],
            },
        },
        {
            name: "brief_confirmation_email",
            description: "Write a short email confirming your written understanding of a project brief before work begins. Sends a concise scope summary — what you'll deliver, what's excluded, timeline, price, and what you need from the client to start — and asks them to confirm or correct before you begin. Prevents scope disputes by creating written alignment upfront. Required: client_name, deliverables (comma-separated list of what you're delivering), total (your price or rate, e.g. '$2,400 fixed' or '$120/hr, ~20hrs'). Optional: project_name, out_of_scope (up to 3 items explicitly excluded — omit if nothing needs spelling out), timeline (overall project duration or deadline, e.g. '3 weeks' or 'delivered by July 15'), start_date, what_you_need (assets, access, or information you need from the client to start — e.g. 'brand guidelines and CMS login'), your_name. Workflow: receive brief → discovery_call_follow_up_email (recap) → brief_confirmation_email (written scope sign-off) → project_kickoff_email (start). Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    deliverables: {
                        type: "string",
                        description: "Comma-separated list of what you will deliver (e.g. 'homepage redesign, 3 interior page templates, mobile-responsive CSS, one round of revisions')",
                    },
                    total: {
                        type: "string",
                        description: "Your agreed price or rate (e.g. '$2,400 fixed fee', '$120/hr estimated 20hrs', '$3,000 split 50/50')",
                    },
                    project_name: {
                        type: "string",
                        description: "Short name for the project — used in the subject line and opening (e.g. 'the website redesign', 'your brand refresh', 'the Q3 campaign'). Omit to keep the opening general.",
                    },
                    out_of_scope: {
                        type: "string",
                        description: "Up to 3 items that are explicitly NOT included — spell these out when they are the likeliest source of scope creep (e.g. 'copywriting, SEO optimisation, ongoing maintenance'). Omit if nothing needs excluding.",
                    },
                    timeline: {
                        type: "string",
                        description: "Overall project duration or delivery deadline (e.g. '3 weeks from start', 'delivered by 30 July', '2-week turnaround'). Omit if not yet confirmed.",
                    },
                    start_date: {
                        type: "string",
                        description: "Planned start date if confirmed (e.g. 'Monday 21 July'). Omit if not yet set.",
                    },
                    what_you_need: {
                        type: "string",
                        description: "Assets, access, or information you need from the client before work can begin (e.g. 'brand guidelines, CMS login, and final copy', 'existing logo files and Google Analytics access'). Omit if you have everything needed.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "deliverables", "total"],
            },
        },
        {
            name: "capacity_waitlist_email",
            description: "Write a professional email to a prospect when you're fully booked but don't want to lose them. Parks them warmly — acknowledges their enquiry, explains you're at capacity, gives an availability window (if known), and offers first priority when your schedule opens. Most freelancers either decline (and lose the prospect for good) or go silent (worse). This is the professional middle path that creates a warm pipeline for your next available slot. Required: client_name. Optional: project_description (what they came to you about — makes the email feel specific rather than templated), available_from (when you'll next have capacity, e.g. 'mid-July', 'early Q4', 'end of August' — omit if uncertain), offer_priority_slot (default true — offers to confirm intent now so you can hold the slot when it opens), your_name. Distinct from client_decline_email (permanent no for fit/budget reasons) and reactivation_email (following up on a cold prospect). Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    project_description: {
                        type: "string",
                        description: "Optional: brief description of what they want to hire you for (e.g. 'the website redesign', 'your brand identity project', 'the copywriting work you mentioned'). Makes the email feel specific rather than a generic 'I'm busy' note.",
                    },
                    available_from: {
                        type: "string",
                        description: "Optional: when you'll next have capacity (e.g. 'mid-July', 'early Q4', 'the end of August', 'late September'). Omit if genuinely uncertain — the email handles that case gracefully.",
                    },
                    offer_priority_slot: {
                        type: "boolean",
                        description: "Whether to offer to hold a priority slot for the prospect when your calendar opens. Default true — include the offer unless you're not sure you want the work.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name"],
            },
        },
        {
            name: "retainer_check_in_email",
            description: "Write a monthly check-in email to a retainer client. Summarises what was covered during the period, previews upcoming work, and opens the door to new needs — the natural upsell moment in an ongoing relationship. Keeps retainer relationships active without feeling like a report. Required: client_name, period (e.g. 'May', 'last month', 'Q2'). Optional: work_summary (1-2 lines of what you covered this period — omit to keep it brief and open), upcoming_work (what's planned next period — omit if not yet set), new_needs_question (a specific question to surface unmet needs, e.g. 'Are there any new campaigns or projects on your radar for next quarter?'  — defaults to a general open-ended check), your_name. Workflow: retainer_proposal (close the deal) → project_kickoff_email (start) → retainer_check_in_email (monthly) → contract_renewal_email (renew). Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    period: {
                        type: "string",
                        description: "The period this check-in covers (e.g. 'May', 'last month', 'Q2', 'the past few weeks')",
                    },
                    work_summary: {
                        type: "string",
                        description: "Optional: 1-2 line summary of what you covered or delivered this period (e.g. 'three blog posts, one email campaign, and the landing page revisions'). Omit to keep the check-in short and relationship-focused.",
                    },
                    upcoming_work: {
                        type: "string",
                        description: "Optional: what you have planned or tentatively scheduled for the coming period (e.g. 'the product launch email sequence', 'two more posts and the monthly newsletter'). Omit if nothing is confirmed yet.",
                    },
                    new_needs_question: {
                        type: "string",
                        description: "Optional: a specific question to surface any new work or unmet needs (e.g. 'Are there any new campaigns or projects on your radar for next quarter?', 'Is there anything you'd like to prioritise differently going forward?'). Defaults to a general open-ended check if omitted.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "period"],
            },
        },
        {
            name: "new_service_announcement_email",
            description: "Write a personal announcement email to an existing client introducing a new service you're now offering. Warmer than cold outreach because you already have a relationship — the goal is to let trusted clients hear first, plant the seed for future work, and feel like insiders. Reads as personal and considered, not a mass newsletter blast. Workflow: draft here → send individually with personalised why_relevant per client. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name",
                    },
                    new_service: {
                        type: "string",
                        description: "The new service you are now offering (e.g. 'quarterly website audits', 'brand identity design', 'video production', 'fractional CMO retainers')",
                    },
                    why_relevant: {
                        type: "string",
                        description: "Optional: why this client specifically might benefit — reference shared history or something you noticed (e.g. 'given the site we built last year, a quarterly audit would catch issues before they compound', 'you mentioned wanting to add video — that's now something I can handle end-to-end'). The more specific, the better.",
                    },
                    proof_point: {
                        type: "string",
                        description: "Optional: a credibility signal for the new service (e.g. 'I have completed three audits this quarter', 'just wrapped my first brand film for a fintech startup'). Omit if you are launching fresh.",
                    },
                    offer: {
                        type: "string",
                        description: "Optional: any early-access or founding-client incentive (e.g. 'a founding-client rate of $X for the first three months', 'the first audit on me so you can see the format'). Keep it genuine — do not manufacture urgency.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "new_service"],
            },
        },
        {
            name: "post_launch_check_in_email",
            description: "Write a short check-in email sent 30–60 days after a project went live — the follow-up that most freelancers never send, and that creates the highest-conversion upsell moment in the client lifecycle. Different from project_go_live_email (sent on launch day), project_completion_email (the handover), and upsell_email (which can be sent anytime). This is the specific 4–8 week post-launch window when you have real data to reference, the client is seeing real results (or real problems), and your work is still top of mind. Three goals: check on how the project is performing, offer to help with anything that's surfaced, and naturally open the door to next work without pitching. Under 120 words. Required: client_name, what_launched. Optional: time_since_launch (e.g. '5 weeks', '2 months' — makes timing concrete), result_to_reference (any result or signal you know about — traffic, sign-ups, revenue, feedback — shows you've been paying attention), next_offer (a specific follow-on that fits logically — keep it observation-based, not pitch-based), your_name. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name",
                    },
                    what_launched: {
                        type: "string",
                        description: "What you built together (e.g. 'the new site', 'the iOS app', 'the rebrand')",
                    },
                    time_since_launch: {
                        type: "string",
                        description: "Optional: how long ago it launched (e.g. '5 weeks', '2 months', 'about a month') — makes the check-in feel timely and intentional",
                    },
                    result_to_reference: {
                        type: "string",
                        description: "Optional: any result or signal you know about (e.g. 'you mentioned traffic was up 30%', 'the sign-up rate looked strong in the early numbers', 'I saw the product got a mention in TechCrunch'). Shows you've been paying attention. Omit if you have nothing concrete.",
                    },
                    next_offer: {
                        type: "string",
                        description: "Optional: a specific follow-on observation or offer — keep it one sentence, grounded in what naturally comes next (e.g. 'if the traffic data shows a clear drop-off point, an A/B test on the CTA would be worth running', 'now that the MVP is out, the next logical step is the referral loop'). Omit if nothing obvious fits.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "what_launched"],
            },
        },
        {
            name: "project_go_live_email",
            description: "Write a short celebratory email to a client when their project goes live — website launch, app release, campaign drop, product ship. Different from project_completion_email (the handover) and project_closure_email (the relationship wrap-up) — this is the real-world moment when the thing you built together is in front of real users and getting real results. Under 100 words. Warm, genuine, forward-looking. Positions you as invested in their success, not just the delivery. Natural moment to plant a seed for next work without pitching. Required: client_name, what_went_live. Optional: live_url (shareable link), early_result (any early metric or signal — e.g. '47 sign-ups in the first hour', '200 views in 3 hours'), next_hook (a natural follow-on if something obvious presents itself — e.g. 'once you have a few weeks of traffic data, it would be worth running an A/B test on the hero'), your_name. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name",
                    },
                    what_went_live: {
                        type: "string",
                        description: "What just launched (e.g. 'the new site', 'the iOS app', 'the rebrand campaign', 'the landing page')",
                    },
                    live_url: {
                        type: "string",
                        description: "Optional: the live URL — included as a direct link so the email is shareable and bookmarkable",
                    },
                    early_result: {
                        type: "string",
                        description: "Optional: any early signal or metric worth acknowledging (e.g. '47 sign-ups in the first hour', 'already ranking on page 1 for the target keyword', '200 organic views in 3 hours'). Omit if it's too early for data.",
                    },
                    next_hook: {
                        type: "string",
                        description: "Optional: a natural follow-on suggestion — keep it one sentence, observation-based not pitch-based (e.g. 'once you have a few weeks of traffic data, it would be worth running an A/B test on the hero', 'the next logical step is wiring up the email sequence so every sign-up gets a follow-up'). Omit if nothing obvious presents itself.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "what_went_live"],
            },
        },
        {
            name: "client_anniversary_email",
            description: "Write a short, warm email marking the anniversary of working with a long-term client — 1 year, 2 years, or any meaningful milestone. Different from annual_review_email (which summarises deliverables and results in a structured retrospective) — this is the relationship-first touchpoint that makes a client feel like a long-term partner, not a transaction. No deliverables list, no pitch, no ask. Just a genuine acknowledgment of the working relationship and a light forward-looking line. Under 100 words. The goal is to be memorable and human, not to upsell — though it naturally positions you top-of-mind when their next need arises. Required: client_name, milestone (e.g. '1 year', '2 years', '18 months'). Optional: project_or_relationship (what you've worked on together — a named project or 'our work together' — makes the milestone feel specific), standout_moment (one specific thing from the relationship worth acknowledging — a result, a challenge you solved, a moment that stood out), forward_line (a single sentence looking ahead — what you're looking forward to, or an open door for what comes next), your_name. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name",
                    },
                    milestone: {
                        type: "string",
                        description: "The anniversary milestone (e.g. '1 year', '2 years', '18 months', '3 years')",
                    },
                    project_or_relationship: {
                        type: "string",
                        description: "Optional: what you've worked on together — a named project ('the site redesign'), an ongoing relationship ('our work together'), or a category ('the branding work'). Makes the milestone feel specific rather than generic.",
                    },
                    standout_moment: {
                        type: "string",
                        description: "Optional: one specific thing from the relationship worth acknowledging — a result ('the campaign that hit 3x target'), a challenge you solved together ('getting through the launch crunch'), or a moment that stood out ('the direction pivot that ended up being the right call'). Omit if nothing obvious fits.",
                    },
                    forward_line: {
                        type: "string",
                        description: "Optional: a single sentence looking ahead — what you're looking forward to ('looking forward to what we build this year'), an open door ('if there's anything you're thinking about for next year, I'd love to hear it'), or just warmth for the future. Omit to let the email close naturally.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "milestone"],
            },
        },
        {
            name: "competitor_response_email",
            description: "Write a professional reply when a client tells you another provider quoted lower — or asks you to match a competitor's price. Three response modes: hold_rate (default — acknowledge the comparison, clarify what differentiates your work, hold your price without apologising or justifying at length; best when your rate reflects genuine experience and scope), adjust_scope (offer a reduced scope or phased approach that delivers real value at a lower price — not a discount, a trade; best when there's genuine flexibility in what's needed), or match_with_context (match or approach the price but anchor it clearly to a specific reason — limited capacity window, long-term relationship, or strategic fit; do not use just to close a deal). None of these modes cave, get defensive, or lecture the client about what they're 'really getting'. All three respect that the client is comparing options. Required: client_name. Optional: competitor_name (who they're comparing to — omit to keep vague), competitor_price (the competing quote), your_price (your quoted price), project_name, response_mode ('hold_rate', 'adjust_scope', 'match_with_context' — default hold_rate), differentiator (the one concrete thing that separates your work — e.g. 'previous work on similar-scale projects', 'full ownership of the project without handoffs', 'I already know your brand well'; omit for a clean close without specifics), your_name. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name",
                    },
                    competitor_name: {
                        type: "string",
                        description: "Optional: who they're comparing to (e.g. 'the other agency', 'Vendor X'). Omit to keep the reply general.",
                    },
                    competitor_price: {
                        type: "string",
                        description: "Optional: the competing quote (e.g. '$3,000', '$15/hr'). Including it lets the reply address the gap directly.",
                    },
                    your_price: {
                        type: "string",
                        description: "Optional: your quoted price. Including both prices lets the reply frame the gap concretely.",
                    },
                    project_name: {
                        type: "string",
                        description: "Optional: the project being discussed.",
                    },
                    response_mode: {
                        type: "string",
                        enum: ["hold_rate", "adjust_scope", "match_with_context"],
                        description: "How to respond: hold_rate (default — hold your price, explain value without apologising), adjust_scope (offer a smaller scope at a lower price — a trade, not a discount), match_with_context (approach or match the price with a clear, specific reason).",
                    },
                    differentiator: {
                        type: "string",
                        description: "Optional: the one concrete thing that separates your work from the competitor — e.g. 'previous work on similar-scale projects', 'single point of contact through delivery', 'I already know your brand and team'. Specific beats generic.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name"],
            },
        },
        {
            name: "work_sample_response_email",
            description: "Write a professional email responding to a prospect who has asked to see work samples or portfolio pieces before deciding whether to hire you. Two modes: have_samples (default — you have directly relevant work to share; links or describes the samples with brief context on why they're relevant to this client's situation), no_exact_match (you don't have a perfect example in this specific niche or format, but you have closely adjacent work that demonstrates the same underlying skill; acknowledges the gap honestly without being apologetic, explains what the adjacent work shows, and offers a next step — call, test piece, or scoped pilot). The no_exact_match mode is often more persuasive than it sounds: handled well, it signals integrity and directness. Required: client_name. Optional: project_context (what the prospect is evaluating you for — makes the email specific rather than generic), sample_description (one-line description of what you're sharing or linking — e.g. 'three brand strategy decks for similar-scale clients', 'a website redesign for a professional services firm'), sample_link (direct URL or 'attached' — if omitted, email offers to send on request), adjacent_work (for no_exact_match mode: what you have that's adjacent — e.g. 'I haven't done X specifically, but here are two projects where I did Y under the same constraints'), next_step (what you're proposing after the sample review — e.g. 'happy to jump on a 20-minute call', 'I can put together a short test piece'), your_name. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Prospect's first name",
                    },
                    project_context: {
                        type: "string",
                        description: "Optional: what they're evaluating you for — makes the email feel specific. E.g. 'the brand identity project', 'the content retainer', 'rewriting your website copy'.",
                    },
                    sample_description: {
                        type: "string",
                        description: "Optional: one-line description of what you're sharing — e.g. 'three brand strategy decks for professional services clients', 'a UX audit and redesign for an e-commerce site'.",
                    },
                    sample_link: {
                        type: "string",
                        description: "Optional: URL to portfolio or samples, or 'attached' if sending as a file. If omitted, the email offers to send on request.",
                    },
                    adjacent_work: {
                        type: "string",
                        description: "Optional (used in no_exact_match mode): what closely adjacent work you have — e.g. 'I haven't done fintech specifically, but I've worked on three regulated-industry brands where the same constraints applied'. Be specific.",
                    },
                    response_mode: {
                        type: "string",
                        enum: ["have_samples", "no_exact_match"],
                        description: "have_samples (default — you have directly relevant work to share), no_exact_match (you don't have a perfect match but have adjacent work that demonstrates the same skill).",
                    },
                    next_step: {
                        type: "string",
                        description: "Optional: what you're proposing after the sample review — e.g. 'happy to jump on a 20-minute call to walk through them', 'I can put together a short test piece if that would help'.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name"],
            },
        },
        {
            name: "project_feedback_request_email",
            description: "Write a professional email asking a client for feedback after completing a project. Two modes: feedback_only (default — a genuine, non-pressuring request for their thoughts; asks 1-2 specific questions to make responding easy), feedback_and_testimonial (combines the feedback ask with a soft request for a testimonial or review, framed as 'if you're happy to' — never demanding). Feedback requests sent within a week of delivery get 3x the response rate of requests sent later. The email is short, specific, and makes the client feel like their opinion matters rather than like they're being harvested for marketing content. Required: client_name, project_name. Optional: specific_question (one focused question about the project — e.g. 'Was the turnaround time what you needed?', 'Did the final copy feel like your voice?'), testimonial_platform (where you'd like a testimonial if they're happy to leave one — e.g. 'LinkedIn', 'Google', 'your website'; used only in feedback_and_testimonial mode), request_mode (feedback_only or feedback_and_testimonial), your_name. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name",
                    },
                    project_name: {
                        type: "string",
                        description: "Name or short description of the completed project — e.g. 'the website redesign', 'the Q2 content package', 'the brand identity'.",
                    },
                    specific_question: {
                        type: "string",
                        description: "Optional: one focused question you genuinely want answered — e.g. 'Was the turnaround time what you needed?', 'Did the final copy feel like your voice?', 'Were the deliverables what you expected from the brief?'. Specific questions get more useful responses than generic 'any feedback?' asks.",
                    },
                    testimonial_platform: {
                        type: "string",
                        description: "Optional (used in feedback_and_testimonial mode): where you'd like a testimonial if they're happy to leave one — e.g. 'LinkedIn', 'Google', 'my website'. Keep it to one platform — multiple requests reduce follow-through.",
                    },
                    request_mode: {
                        type: "string",
                        enum: ["feedback_only", "feedback_and_testimonial"],
                        description: "feedback_only (default — genuine feedback ask, no testimonial request), feedback_and_testimonial (feedback ask with a soft, optional testimonial request).",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name"],
            },
        },
        {
            name: "end_client_relationship_email",
            description: "Write a professional email to end an existing client relationship or retainer. Three modes: natural_end (the engagement has run its course — use when the project is done and you're not renewing; warm, leave the door open for future work), capacity (you genuinely don't have room to continue — honest, no blame, brief), fit_mismatch (the working relationship isn't working — handled carefully; professional and final without being cold or over-explaining). Most freelancers write these too apologetically (which reads as uncertain) or too abruptly (which burns the bridge). This tool finds the professional middle: clear, direct, warm where appropriate. Required: client_name. Optional: engagement_description (what you've been doing together — e.g. 'the monthly retainer', 'the content work', 'the design contract'), end_date (when the engagement ends — e.g. 'end of this month', 'June 30', 'after the current milestone'), reason (natural_end | capacity | fit_mismatch — defaults to natural_end), handover_note (optional: what you're doing to wrap up or help them transition — e.g. 'I'll deliver the final files by Friday', 'happy to brief a replacement'), your_name. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name",
                    },
                    engagement_description: {
                        type: "string",
                        description: "Optional: what you've been doing together — e.g. 'the monthly retainer', 'the content work', 'the design contract', 'our arrangement'. Helps make the email specific rather than generic.",
                    },
                    end_date: {
                        type: "string",
                        description: "Optional: when the engagement ends — e.g. 'end of this month', 'June 30', 'after the current milestone is delivered'. If omitted, the email stays slightly open on timing.",
                    },
                    reason: {
                        type: "string",
                        enum: ["natural_end", "capacity", "fit_mismatch"],
                        description: "natural_end (default — engagement has run its course; warm and future-friendly), capacity (you don't have room to continue; honest, brief, no blame), fit_mismatch (working relationship isn't working; professional and final, avoids over-explaining).",
                    },
                    handover_note: {
                        type: "string",
                        description: "Optional: what you're doing to wrap up or help them transition — e.g. 'I'll deliver the final files by Friday', 'happy to brief a replacement if that's useful', 'everything is documented in the shared folder'. Including a handover gesture is good professional practice and often softens the message.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name"],
            },
        },
        {
            name: "cold_pitch_follow_up",
            description: "Write a short, professional follow-up when a cold pitch has gone unanswered. Shorter than the original pitch — brevity signals confidence. Doesn't repeat everything; just resurfaces the key hook, gives an easy out, and asks for one yes/no. Distinct from client_followup (which is for post-proposal follow-up after a prospect showed interest) and win_back_email (re-engaging a lapsed client). This is for genuine cold silence — they never replied at all. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    recipient_name: {
                        type: "string",
                        description: "First name of the person you're following up with",
                    },
                    company_name: {
                        type: "string",
                        description: "Optional: company name — helps personalise the subject line",
                    },
                    original_pitch_summary: {
                        type: "string",
                        description: "One-sentence summary of what you offered in the original pitch (e.g. 'UX help for your onboarding flow', 'copywriting for your pricing page rewrite', 'React development for the mobile app')",
                    },
                    days_since_pitch: {
                        type: "number",
                        description: "Optional: how long ago you sent the original pitch (e.g. 7, 14, 21). Used to calibrate tone — shorter gap = lighter touch, longer gap = slightly more direct.",
                    },
                    new_angle: {
                        type: "string",
                        description: "Optional: something new to add that wasn't in the original pitch — a relevant observation, a result you can now reference, a question that reframes the value. Omit if you have nothing genuinely new to say.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["recipient_name", "original_pitch_summary"],
            },
        },
        {
            name: "contract_unsigned_follow_up",
            description: "Write a short, professional follow-up when a client has agreed to move forward but hasn't returned the signed contract yet. The hardest follow-up to write because it feels pushy — but staying silent stalls the project, leaves income at risk, and signals that unsigned contracts are fine. Distinct from cold_pitch_follow_up (they never replied at all), client_followup (following up on a proposal they haven't approved yet), and no_response_closure_email (closing out a ghost). This is after the handshake: they said yes, you sent the contract, now it's sitting unsigned. Under 100 words. Matter-of-fact, no guilt, gives them an easy out if something has changed. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name",
                    },
                    project_name: {
                        type: "string",
                        description: "Optional: name or description of the project (e.g. 'the website redesign', 'the Q3 campaign'). Helps personalise the subject line.",
                    },
                    days_since_sent: {
                        type: "number",
                        description: "Optional: how many days ago you sent the contract (e.g. 3, 7, 14). Used to calibrate tone — shorter gap is lighter, longer gap is slightly more direct.",
                    },
                    start_date: {
                        type: "string",
                        description: "Optional: the planned project start date (e.g. 'June 23', 'next Monday'). Including this adds urgency without being pushy — it's a practical reason to get the contract back.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name"],
            },
        },
        {
            name: "equity_or_deferred_payment_response",
            description: "Write a professional, considered response when a client proposes paying you in equity, exposure, revenue share, or deferred payment instead of (or alongside) a cash fee. The hardest part of this email is saying no without burning the relationship — or saying yes with the right conditions. Three modes: decline (default — polite, firm, no-door-slamming; explains your policy without moralising), counter (you're open to it under specific conditions — e.g. partial cash + equity, milestone-based deferred, or a minimum cash floor), and open_to_discuss (you'd like to hear more before committing either way — useful when the offer might be genuinely interesting but you need more information). Distinct from discount_request_response (which handles cash price negotiation). Does not count against your monthly draft limit. Required: client_name, proposal_type (e.g. 'equity stake', 'revenue share', 'deferred payment after launch', 'exposure and portfolio work'). Optional: response_mode (decline | counter | open_to_discuss), project_description, your_conditions (only used in counter mode — what would make you say yes, e.g. '50% cash upfront and 5% equity'), your_name.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or the name they used to sign off",
                    },
                    proposal_type: {
                        type: "string",
                        description: "What they're offering instead of cash (e.g. 'equity stake', 'revenue share', 'deferred payment after launch', 'exposure and a portfolio piece'). Used to keep the reply specific, not generic.",
                    },
                    response_mode: {
                        type: "string",
                        enum: ["decline", "counter", "open_to_discuss"],
                        description: "decline (default): polite, firm no — explains your policy, keeps the door open for paid work. counter: you'd say yes under specific conditions — state them clearly. open_to_discuss: you need more detail before deciding — ask the right questions.",
                    },
                    project_description: {
                        type: "string",
                        description: "Optional: brief description of the project (e.g. 'mobile app for their fintech startup'). Helps make the response feel specific.",
                    },
                    your_conditions: {
                        type: "string",
                        description: "Optional (counter mode only): what would make you say yes, stated plainly (e.g. '50% of the standard rate upfront and 5% equity', 'full fee deferred 90 days with a signed agreement', 'minimum $2k retainer plus revenue share above $10k monthly'). Auto-formatted into the email.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "proposal_type"],
            },
        },
        {
            name: "project_inquiry_response_email",
            description: "Write the professional reply to an inbound project inquiry from a potential client — the email you send when someone reaches out asking if you're available for work. This is the first email in the client relationship, so tone and structure matter: warm enough to keep them engaged, professional enough to signal expertise, and specific enough to move toward a conversation. Two modes: reply_and_qualify (default — acknowledges the enquiry, asks 1-3 targeted qualifying questions to understand scope/budget/timeline before agreeing to a call, and proposes a next step) and reply_and_book (skip the qualifying questions and go straight to proposing a discovery call — use when the enquiry already includes enough detail). Distinct from cold_pitch (you reach out first), client_followup (chasing a silent prospect), and discovery_call_follow_up_email (sent after the call). Required: client_name, enquiry_summary (a brief description of what they're asking for, e.g. 'website redesign for a law firm' or 'monthly content for their SaaS product'). Optional: qualifying_questions (up to 3 questions you want answered before the call — auto-formatted as a bulleted list), response_mode (reply_and_qualify | reply_and_book), call_scheduling_link (Calendly or equivalent URL for one-click booking), your_name. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or the name they used to sign off",
                    },
                    enquiry_summary: {
                        type: "string",
                        description: "Brief description of what they're asking for (e.g. 'website redesign for a law firm', 'monthly SEO content for their B2B SaaS product'). Used to make the reply feel specific, not templated.",
                    },
                    qualifying_questions: {
                        type: "string",
                        description: "Optional: up to 3 qualifying questions you want answered before agreeing to a call, comma-separated (e.g. 'What's your rough budget?, When do you need this live?, Do you have existing branding?'). Only used in reply_and_qualify mode.",
                    },
                    response_mode: {
                        type: "string",
                        enum: ["reply_and_qualify", "reply_and_book"],
                        description: "reply_and_qualify (default): acknowledge + ask qualifying questions + propose next step. reply_and_book: skip questions, go straight to a discovery call — use when the enquiry already contains enough detail.",
                    },
                    call_scheduling_link: {
                        type: "string",
                        description: "Optional: Calendly or equivalent link for one-click call booking. Turns the next-step CTA into a direct link rather than a back-and-forth availability exchange.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "enquiry_summary"],
            },
        },
        {
            name: "payment_overdue_final_notice_email",
            description: "Write the formal final notice email when a client has not responded to previous payment reminders and the invoice is significantly overdue. This is the last professional communication before escalating to a collection agency, pausing all work, or seeking legal remedy — so the tone is firm, factual, and unambiguous without being hostile. States the outstanding amount, the number of days overdue, and a clear deadline for payment before you take the next step. Named 'final notice' so the client understands this is the last communication in the sequence. Distinct from late_payment_reminder (earlier, softer reminders) and invoice_dispute_response_email (client disputes the charge — this is non-payment, not dispute). Does not count against your monthly draft limit. Required: client_name, invoice_number, amount, days_overdue. Optional: original_due_date, payment_deadline (days from this email before next step — defaults to 7), next_step (collection_agency | legal_action | work_suspension — defaults to work_suspension), project_name, payment_link, your_name.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    invoice_number: {
                        type: "string",
                        description: "Invoice reference number (e.g. 'INV-042', '#2024-07')",
                    },
                    amount: {
                        type: "string",
                        description: "The outstanding amount as a string (e.g. '$1,200', '£850')",
                    },
                    days_overdue: {
                        type: "number",
                        description: "How many days past the due date the invoice is (e.g. 30, 45, 60)",
                    },
                    original_due_date: {
                        type: "string",
                        description: "The original due date (e.g. 'June 5', '5 June 2026'). Stating it makes the timeline clear and removes ambiguity.",
                    },
                    payment_deadline: {
                        type: "number",
                        description: "Number of days from this email the client has to pay before you take the next step. Defaults to 7.",
                    },
                    next_step: {
                        type: "string",
                        enum: ["collection_agency", "legal_action", "work_suspension"],
                        description: "What you will do if payment is not received by the deadline. work_suspension (default): pause all work and withhold deliverables. collection_agency: refer the debt to a collection agency. legal_action: pursue through small claims or formal legal channels.",
                    },
                    project_name: {
                        type: "string",
                        description: "Project name for context (e.g. 'the Brand Refresh project', 'the Q2 content package')",
                    },
                    payment_link: {
                        type: "string",
                        description: "A direct payment link or portal URL if you have one — makes it frictionless for the client to pay immediately",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "invoice_number", "amount", "days_overdue"],
            },
        },
        {
            name: "invoice_correction_email",
            description: "Write the professional email to send a client when you need to correct an invoice you already sent — wrong amount, wrong line item, wrong date, or a missing item. Brief apology (one line — not grovelling), clear instruction to disregard the original, and the corrected details. Gets this right where most freelancers fumble: either they don't send anything (client pays the wrong amount) or they send a confusing email that makes the situation worse. Distinct from invoice_dispute_response_email (the client disputes your invoice — this is when YOU caught the error) and invoice_cover_email (first send of a new invoice). Does not count against your monthly draft limit. Required: client_name, original_invoice_number, corrected_invoice_number, correction_description (e.g. 'the total was listed as $1,200 instead of $1,450 due to a line item error'). Optional: correct_amount, project_name, payment_due_date, payment_link, your_name.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    original_invoice_number: {
                        type: "string",
                        description: "The reference number of the incorrect invoice to disregard (e.g. 'INV-041')",
                    },
                    corrected_invoice_number: {
                        type: "string",
                        description: "The reference number of the corrected invoice (e.g. 'INV-041-R', 'INV-042')",
                    },
                    correction_description: {
                        type: "string",
                        description: "What was wrong and what it has been corrected to — be specific (e.g. 'the subtotal was listed as $1,200 instead of $1,450 — one line item was missing', 'the due date was listed as June 10 instead of June 20')",
                    },
                    correct_amount: {
                        type: "string",
                        description: "The correct final amount (e.g. '$1,450', '£2,800'). Including this removes ambiguity about what the client should pay.",
                    },
                    project_name: {
                        type: "string",
                        description: "Project name for context (e.g. 'the Brand Refresh project')",
                    },
                    payment_due_date: {
                        type: "string",
                        description: "When payment is due on the corrected invoice (e.g. 'June 25', '30 days from today')",
                    },
                    payment_link: {
                        type: "string",
                        description: "A direct payment link or portal URL for the corrected invoice",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "original_invoice_number", "corrected_invoice_number", "correction_description"],
            },
        },
        {
            name: "bid_lost_follow_up",
            description: "Write the professional follow-up email to send after you didn't win a competitive bid or pitch. Keeps the relationship warm without sounding bitter, desperate, or entitled — the goal is one clear thing: staying on their radar for future work. Under 100 words body. Gracious, brief, no post-mortem. Distinct from cold_pitch_follow_up (no response to a cold pitch — this is when they actively told you they went with someone else), client_followup (chasing a proposal that hasn't been decided yet), and no_response_closure_email (closing a ghost). Does not count against your monthly draft limit. Required: client_name, project_description (e.g. 'the website redesign project', 'your Q3 social media campaign'). Optional: reason_if_known (what they told you — e.g. 'went with a larger agency', 'found someone with more industry experience'; used to tailor tone), future_work_angle (a specific type of work you'd like to be considered for — e.g. 'smaller copy projects', 'ongoing social content'), project_name, your_name.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or full name",
                    },
                    project_description: {
                        type: "string",
                        description: "Brief description of the project you bid on (e.g. 'the website redesign', 'your Q3 campaign', 'the brand identity project')",
                    },
                    reason_if_known: {
                        type: "string",
                        description: "The reason they gave for choosing someone else, if they told you (e.g. 'went with a larger agency', 'found someone with more industry experience', 'went in a different direction'). Used to calibrate tone — omit if they didn't say.",
                    },
                    future_work_angle: {
                        type: "string",
                        description: "A specific type of future work you'd like to be considered for (e.g. 'smaller projects', 'overflow work', 'future campaigns'). If omitted, uses a general 'future projects' ask.",
                    },
                    project_name: {
                        type: "string",
                        description: "Project name if it had a formal name (e.g. 'Project Aurora', 'the 2026 rebrand')",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "project_description"],
            },
        },
        {
            name: "subcontractor_acceptance_email",
            description: "Write the professional email confirming you are accepting a subcontracting role offered by another contractor or agency. Covers: confirming your acceptance, stating the agreed role and start date, and flagging any standard conditions (invoicing process, point of contact, NDA if applicable). Distinct from subcontractor_brief (you briefing someone YOU hired), bid_lost_follow_up (you lost a direct bid), and cold_pitch (you reaching out speculatively). Does not count against your monthly draft limit. Required: prime_name (name of the main contractor or agency), project_description (what the project is, e.g. 'the Acme Corp website redesign'), your_role (your specific role or deliverable, e.g. 'front-end development', 'UX design for the mobile flows'). Optional: start_date, rate_confirmation (e.g. '$120/hr as agreed', '$4,500 fixed fee'), point_of_contact (who you report to), nda_flag (if true, notes you are happy to sign an NDA), your_name.",
            inputSchema: {
                type: "object",
                properties: {
                    prime_name: {
                        type: "string",
                        description: "Name of the main contractor, agency, or person who offered you the sub role",
                    },
                    project_description: {
                        type: "string",
                        description: "Brief description of the project (e.g. 'the Acme Corp website redesign', 'the Q3 brand campaign for TechStart')",
                    },
                    your_role: {
                        type: "string",
                        description: "Your specific role or deliverable on the project (e.g. 'front-end development', 'UX design for the mobile flows', 'copywriting for all campaign assets')",
                    },
                    start_date: {
                        type: "string",
                        description: "Agreed start date, if confirmed (e.g. 'Monday June 23', 'the week of July 7')",
                    },
                    rate_confirmation: {
                        type: "string",
                        description: "Rate or fee as agreed, to confirm in writing (e.g. '$120/hr', '$4,500 fixed fee for the full scope'). Omit if not yet confirmed.",
                    },
                    point_of_contact: {
                        type: "string",
                        description: "Name of the person you report to or coordinate with on the project, if known (e.g. 'Sarah', 'the PM on your side')",
                    },
                    nda_flag: {
                        type: "boolean",
                        description: "If true, adds a note that you are happy to sign an NDA or confidentiality agreement if required",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["prime_name", "project_description", "your_role"],
            },
        },
        {
            name: "rate_card_email",
            description: "Write the professional email to send when a prospect asks 'what are your rates?' or requests your pricing. Presents your rates clearly and confidently — no apologising, no burying the number. Positions the rate in context of your experience and what the client gets. Distinct from draft_proposal (which responds to a specific brief) and rate_increase_email (which tells an existing client you are raising prices). Does not count against your monthly draft limit. Required: your_rate (e.g. '$150/hr', '$3,500 for a 4-page website', 'from $2,000 per project'). Optional: prospect_name, your_specialty (e.g. 'B2B SaaS copywriting', 'React front-end development'), rate_context (one sentence on what is included, e.g. 'includes two revision rounds and source files'), availability (e.g. 'available from July 14'), next_step (e.g. 'happy to jump on a 20-minute call'), your_name.",
            inputSchema: {
                type: "object",
                properties: {
                    your_rate: {
                        type: "string",
                        description: "Your rate or pricing (e.g. '$150/hr', '$3,500 for a 4-page website', 'from $2,000 per project')",
                    },
                    prospect_name: {
                        type: "string",
                        description: "First name of the prospect, if known",
                    },
                    your_specialty: {
                        type: "string",
                        description: "One-line description of what you do, used to frame the rate (e.g. 'B2B SaaS copywriting', 'React front-end development', 'brand identity design')",
                    },
                    rate_context: {
                        type: "string",
                        description: "One sentence on what is included at that rate (e.g. 'includes two rounds of revisions and final source files', 'covers discovery, wireframes, and one round of design'). Omit if straightforward hourly.",
                    },
                    availability: {
                        type: "string",
                        description: "When you are next available (e.g. 'available from July 14', 'have capacity starting next week'). Omit to leave open.",
                    },
                    next_step: {
                        type: "string",
                        description: "A single soft next step (e.g. 'happy to jump on a 20-minute call to discuss your project', 'let me know if you have a brief and I can put together a more specific number'). Omit to use the default.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["your_rate"],
            },
        },
        {
            name: "project_scope_acceptance_email",
            description: "Write the professional email to send when you want to confirm a client's project scope before the formal contract arrives. Bridges the gap between verbal agreement and signed contract — confirms deliverables, timeline, and rate so there are no surprises when the paperwork lands. Does not count against your monthly draft limit. Required: client_name, project_description. Optional: scope_summary (bullet list of specific deliverables), timeline (e.g. 'kick off Monday June 23, deliver by July 18'), rate_summary (e.g. '$4,200 flat, 50% upfront'), next_step (e.g. 'send over the contract and I will countersign same day'), your_name.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name of the client or contact",
                    },
                    project_description: {
                        type: "string",
                        description: "Brief description of the project (e.g. 'the Brand Refresh', 'your e-commerce site redesign', 'the Q3 content campaign')",
                    },
                    scope_summary: {
                        type: "string",
                        description: "Bullet-point summary of specific deliverables (e.g. 'logo suite, brand guidelines, 3 social templates'). Omit to keep the email high-level.",
                    },
                    timeline: {
                        type: "string",
                        description: "Agreed timeline or start date (e.g. 'kick off Monday June 23, first draft by July 4'). Omit to leave open.",
                    },
                    rate_summary: {
                        type: "string",
                        description: "Brief rate confirmation (e.g. '$4,200 flat, 50% upfront', '$150/hr against a 20-hour estimate'). Omit if rate has not yet been agreed.",
                    },
                    next_step: {
                        type: "string",
                        description: "The single next action you are waiting on from the client (e.g. 'send over the contract and I will countersign same day', 'confirm the start date and I will block it'). Omit to use the default.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "project_description"],
            },
        },
        {
            name: "overdue_project_timeline_update",
            description: "Write the proactive email when YOUR delivery is running behind the agreed deadline — sent before the client has to chase you. The hardest email a freelancer has to write: most either avoid it (and let the client discover the delay themselves) or over-apologise (which damages confidence more than the delay does). This generates a clear, confident update that acknowledges the slip, gives a realistic new date, and briefly states the cause without excessive excuse-making. Tone: matter-of-fact, not panicked, not grovelling. Keeps the relationship intact. Distinct from scope_change_email (change to scope, not timeline), client_waiting_email (client chasing you for an update — reactive), and project_kickoff_email (confirming start of a new project). Does not count against your monthly draft limit. Required: client_name, original_deadline (e.g. 'Friday 20 June', 'end of this week'), new_deadline (your revised commitment), project_name. Optional: delay_reason (brief honest explanation — e.g. 'a technical issue took longer to resolve than expected', 'I underestimated the scope of the research phase'; omit for a shorter email that skips the cause), mitigation (what you're doing to prevent further slippage — e.g. 'I've cleared my schedule for the next two days to focus on this', 'I've already completed X to make up ground'), your_name.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name of the client",
                    },
                    original_deadline: {
                        type: "string",
                        description: "The originally agreed deadline (e.g. 'Friday 20 June', 'end of this week', 'last Thursday')",
                    },
                    new_deadline: {
                        type: "string",
                        description: "Your revised, realistic delivery date (e.g. 'Tuesday 24 June', 'end of next week')",
                    },
                    project_name: {
                        type: "string",
                        description: "Name or description of the project (e.g. 'the brand identity', 'your Q3 content plan', 'the checkout redesign')",
                    },
                    delay_reason: {
                        type: "string",
                        description: "Brief honest explanation for the delay (e.g. 'a technical issue took longer than expected', 'I underestimated the research phase'). Omit to skip explaining the cause.",
                    },
                    mitigation: {
                        type: "string",
                        description: "What you are doing to prevent further slippage (e.g. 'I have cleared my schedule to focus on this', 'I have already completed the first half'). Adds confidence.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "original_deadline", "new_deadline", "project_name"],
            },
        },
        {
            name: "client_satisfaction_survey_email",
            description: "Write the professional email to send after completing a project — asks the client for feedback and, optionally, a short testimonial. Warm, brief, and non-pushy: makes it easy for a happy client to say yes, and easy for a less-satisfied client to share honest feedback without awkwardness. Distinct from bid_lost_follow_up (you didn't win the work), referral_thank_you (thanking someone who sent a referral), and cold_pitch_follow_up (no response to a pitch) — this is specifically the post-delivery check-in with a client you just delivered work to. Does not count against your monthly draft limit. Required: client_name, project_name. Optional: survey_link (URL to a feedback form — omit to ask directly in the reply), testimonial_ask (if true, adds a short sentence asking for a one or two line testimonial they're happy for you to quote), outcome_note (one sentence on the outcome you delivered, e.g. 'the site went live on schedule' — personalises the email), your_name.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name of the client",
                    },
                    project_name: {
                        type: "string",
                        description: "Name of the completed project (e.g. 'the Acme brand refresh', 'your Q3 content campaign', 'the checkout redesign')",
                    },
                    survey_link: {
                        type: "string",
                        description: "URL of a feedback form (e.g. Typeform or Google Form). Omit to ask the client to reply directly.",
                    },
                    testimonial_ask: {
                        type: "boolean",
                        description: "If true, adds a sentence asking for a short testimonial they are comfortable with you quoting publicly.",
                    },
                    outcome_note: {
                        type: "string",
                        description: "One sentence describing a concrete outcome you delivered (e.g. 'the site launched on schedule', 'the campaign hit its target open rate'). Personalises the email — omit to keep it generic.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name"],
            },
        },
        {
            name: "draft_invoice",
            description: "Generate a complete, ready-to-send professional invoice document in Markdown format. Produces the actual invoice (not a cover email or reminder) with a professional header, itemised line items, subtotal, optional tax line, and total due. Ideal for converting an accepted proposal into a billable document. Distinct from invoice_cover_email (the email you send alongside the invoice), invoice_reminder (chasing a late payment), and payment_plan_proposal (offering instalments). The output is Markdown — paste into your invoicing tool, convert to PDF, or send as a formatted email. Required: client_name, your_name, line_items (array of work items). Optional: invoice_number, invoice_date, due_date, tax_rate, payment_instructions, currency, your_business_name, client_company.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Full name of the client or billing contact",
                    },
                    client_company: {
                        type: "string",
                        description: "Client's company name (omit for solo/individual clients)",
                    },
                    your_name: {
                        type: "string",
                        description: "Your full name",
                    },
                    your_business_name: {
                        type: "string",
                        description: "Your business or trading name (omit if billing as an individual)",
                    },
                    invoice_number: {
                        type: "string",
                        description: "Invoice reference number (e.g. 'INV-2026-042'). Omit to leave as a placeholder.",
                    },
                    invoice_date: {
                        type: "string",
                        description: "Date of issue (e.g. '18 June 2026'). Defaults to today if omitted.",
                    },
                    due_date: {
                        type: "string",
                        description: "Payment due date (e.g. '2 July 2026' or 'Net 14'). Omit to use Net 14 from invoice date.",
                    },
                    currency: {
                        type: "string",
                        description: "Currency symbol or code (e.g. '$', '£', 'EUR'). Defaults to '$'.",
                    },
                    line_items: {
                        type: "array",
                        description: "Work items to bill for. Each item needs a description; quantity and rate are optional (omit for fixed-fee items).",
                        items: {
                            type: "object",
                            properties: {
                                description: { type: "string", description: "Description of the work or deliverable" },
                                quantity: { type: "number", description: "Number of units, hours, or days (omit for fixed-fee)" },
                                unit: { type: "string", description: "Unit label (e.g. 'hours', 'days', 'pages'). Omit for fixed-fee items." },
                                rate: { type: "number", description: "Rate per unit (omit for fixed-fee items)" },
                                amount: { type: "number", description: "Fixed total for this line (use instead of quantity+rate for fixed-fee items)" },
                            },
                            required: ["description"],
                        },
                    },
                    tax_rate: {
                        type: "number",
                        description: "Tax percentage to apply (e.g. 10 for 10% GST/VAT). Omit to produce a tax-free invoice.",
                    },
                    payment_instructions: {
                        type: "string",
                        description: "Payment details — bank account, PayPal address, Stripe link, or 'see attached'. Omit to leave a placeholder.",
                    },
                },
                required: ["client_name", "your_name", "line_items"],
            },
        },
        {
            name: "contractor_nda_cover_email",
            description: "Write the short covering email to send alongside an NDA (Non-Disclosure Agreement) to a client or subcontractor. Explains why you're sending the document, what it covers, and what to do with it — without being heavy or legalistic. Distinct from nda_template (which generates the NDA itself) and subcontractor_brief (which briefs a subcontractor on the work). Does not count against your monthly draft limit. Required: recipient_name. Optional: project_description (brief note on the project the NDA covers), relationship ('client' or 'subcontractor' — defaults to 'client'), signing_method (how they should return the signed copy, e.g. 'DocuSign', 'reply with a signed PDF', 'HelloSign'), your_name.",
            inputSchema: {
                type: "object",
                properties: {
                    recipient_name: {
                        type: "string",
                        description: "Name of the person receiving the NDA",
                    },
                    project_description: {
                        type: "string",
                        description: "Brief description of the project or engagement the NDA covers (e.g. 'the Acme Corp website redesign'). Omit to keep the email generic.",
                    },
                    relationship: {
                        type: "string",
                        description: "'client' (you are sending NDA to a client before sharing your process/pricing) or 'subcontractor' (you are sending NDA to someone you are bringing onto a project). Defaults to 'client'.",
                    },
                    signing_method: {
                        type: "string",
                        description: "How they should return the signed copy (e.g. 'reply with a signed PDF', 'via DocuSign', 'via HelloSign'). Omit to leave the return method open.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["recipient_name"],
            },
        },
        {
            name: "payment_reminder_email",
            description: "Write a professional payment reminder email for an overdue or upcoming invoice. Calibrated by tone: 'friendly' for a first nudge (1-7 days late), 'firm' for a second reminder (8-21 days late), or 'final' for a late-stage notice that signals escalation. Always polite but clear — avoids passive-aggression while leaving no ambiguity about what is owed and when. Does not count against your monthly draft limit. Required: client_name, amount_due. Optional: invoice_number, due_date, days_overdue (used to auto-select tone if tone not specified), tone ('friendly' | 'firm' | 'final'), payment_method (e.g. 'bank transfer', 'PayPal'), your_name.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or company name for the greeting",
                    },
                    amount_due: {
                        type: "string",
                        description: "The amount outstanding, including currency symbol (e.g. '$2,400', '£1,800', '€950')",
                    },
                    invoice_number: {
                        type: "string",
                        description: "Invoice reference number (e.g. 'INV-042'). Omit if you don't use invoice numbers.",
                    },
                    due_date: {
                        type: "string",
                        description: "The original payment due date (e.g. 'June 1', '1 June 2026'). Omit if unknown.",
                    },
                    days_overdue: {
                        type: "number",
                        description: "How many days past the due date the invoice is. Used to auto-select tone if tone is not provided: 0-7 → friendly, 8-21 → firm, 22+ → final.",
                    },
                    tone: {
                        type: "string",
                        description: "'friendly' (gentle first nudge, assumes oversight), 'firm' (clear expectation, no apology), or 'final' (signals escalation if not resolved). Overrides days_overdue if both provided.",
                    },
                    payment_method: {
                        type: "string",
                        description: "How you'd like to be paid (e.g. 'bank transfer', 'PayPal', 'Stripe invoice link'). Omit to leave the payment method open.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "amount_due"],
            },
        },
        {
            name: "client_brief_template",
            description: "Generate a structured client brief questionnaire to send to a new or prospective client before starting work. Prevents scope creep and 'bad brief' problems by collecting project goals, timeline, budget, stakeholders, and success criteria upfront. Use this at the very start of an engagement — before drafting a proposal or setting a price. Does not count against your monthly draft limit. Optional: project_type (e.g. 'website redesign', 'brand identity', 'copywriting project'), client_name, your_name, include_budget_question (defaults true), format ('email' to embed in a covering email, 'doc' for a standalone questionnaire to paste into a shared doc).",
            inputSchema: {
                type: "object",
                properties: {
                    project_type: {
                        type: "string",
                        description: "The type of project (e.g. 'website redesign', 'brand identity', 'copywriting', 'app development'). Helps tailor the questions to the engagement. Omit for a general-purpose brief.",
                    },
                    client_name: {
                        type: "string",
                        description: "Client's first name for the email greeting",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                    include_budget_question: {
                        type: "boolean",
                        description: "Whether to include a direct budget question. Some freelancers prefer to handle budget in a call rather than upfront in writing. Defaults to true.",
                    },
                    format: {
                        type: "string",
                        description: "'email' (wraps the questionnaire in a covering email — default) or 'doc' (returns a clean standalone questionnaire to paste into Google Docs, Notion, or a PDF).",
                    },
                },
                required: [],
            },
        },
        {
            name: "project_pause_email",
            description: "Write a professional email to pause a project mid-engagement — either at the client's request or yours. Covers the reason briefly, confirms what's been delivered so far, sets a resume date (or flags that one needs to be agreed), and keeps the relationship warm. Distinct from project_closure_email (which is a permanent end) and project_kickoff_email (which starts work). Does not count against your monthly draft limit. Required: client_name, project_name. Optional: reason (why the project is pausing — brief and honest), resume_date (expected restart date), completed_so_far (summary of what's been delivered before the pause), action_items (things either party should do during the pause), your_name.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name or company name for the greeting",
                    },
                    project_name: {
                        type: "string",
                        description: "Name or short description of the project being paused",
                    },
                    reason: {
                        type: "string",
                        description: "Brief honest reason for the pause (e.g. 'your team is heads-down on a product launch', 'we've hit the current budget allocation', 'I'm stepping away for planned leave'). Omit to keep the email neutral and simply confirm the agreed pause.",
                    },
                    resume_date: {
                        type: "string",
                        description: "Expected date to resume (e.g. 'July 14', 'early August'). Omit if no firm date has been agreed — the email will flag that a resumption date should be confirmed.",
                    },
                    completed_so_far: {
                        type: "string",
                        description: "Brief summary of what has already been delivered or completed before the pause (e.g. 'wireframes and copywriting for sections 1–3'). Omit if not needed.",
                    },
                    action_items: {
                        type: "string",
                        description: "Any tasks either party should handle during the pause (e.g. 'please review the draft scope doc and send feedback when you're ready to resume'). Omit if nothing is pending.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name"],
            },
        },
        {
            name: "referral_thank_you_email",
            description: "Write a warm, genuine thank-you email to someone who referred a new client to you. Acknowledges the specific referral, expresses genuine appreciation without being gushing, and optionally offers to return the favour. Works whether the project is just starting, underway, or completed. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    referrer_name: {
                        type: "string",
                        description: "First name of the person who made the referral",
                    },
                    new_client_name: {
                        type: "string",
                        description: "Name of the person or company they referred (e.g. 'Sarah', 'the team at Acme') — makes the email specific rather than generic",
                    },
                    project_type: {
                        type: "string",
                        description: "Optional: brief description of the work (e.g. 'brand identity project', 'website redesign', 'strategy consultancy'). Adds specificity without oversharing client details.",
                    },
                    outcome: {
                        type: "string",
                        description: "Optional: how the engagement went, if it has started or concluded (e.g. 'we kicked off last week and it's going well', 'we wrapped up and the client was delighted'). Omit if you're writing before work has begun.",
                    },
                    offer_back: {
                        type: "boolean",
                        description: "Optional: whether to explicitly offer to return the favour by referring work to them or recommending them. Default: false.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["referrer_name", "new_client_name"],
            },
        },
        {
            name: "retainer_proposal",
            description: "Write a professional email proposing an ongoing retainer relationship to an existing project client. Converts a one-off engagement into a predictable monthly arrangement — gives the client clarity on reserved capacity and you stability of income. Covers: proposed scope, monthly hours, retainer fee, how unused hours roll over (or don't), notice period. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name or company name of the client",
                    },
                    monthly_hours: {
                        type: "number",
                        description: "Number of hours per month you are proposing to reserve for them (e.g. 10, 20)",
                    },
                    monthly_fee: {
                        type: "string",
                        description: "The retainer fee per month, including currency symbol (e.g. '£2,000/month', '$3,500/month')",
                    },
                    scope_summary: {
                        type: "string",
                        description: "Optional: brief description of what the retainer covers (e.g. 'ongoing strategy and copywriting', 'design support and ad-hoc UX reviews'). If omitted, a generic description is used.",
                    },
                    rollover: {
                        type: "boolean",
                        description: "Optional: whether unused hours roll over to the following month. Default: false (hours expire at month end).",
                    },
                    notice_period: {
                        type: "string",
                        description: "Optional: notice period to cancel the retainer (e.g. '30 days', 'one calendar month'). Default: 30 days.",
                    },
                    start_date: {
                        type: "string",
                        description: "Optional: proposed start date (e.g. '1 July', 'next month'). If omitted, wording is left open.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "monthly_hours", "monthly_fee"],
            },
        },
        {
            name: "podcast_pitch_email",
            description: "Write a compelling cold pitch to appear as a guest on a podcast. Podcast appearances are a powerful freelancer marketing channel — authority-building, warm inbound leads, and backlinks — but most pitches are generic and get deleted within seconds. This generates a host-first pitch that leads with why their audience wins (not why you want exposure), references a specific episode to prove you're a genuine listener, and ends with a concrete, low-friction ask. Distinct from conference_talk_pitch (formal CFP submission for in-person events) and cold_pitch (client sales outreach). Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    podcast_name: {
                        type: "string",
                        description: "Name of the podcast you are pitching to appear on (e.g. 'Freelance to Founder', 'The Futur')",
                    },
                    host_name: {
                        type: "string",
                        description: "First name of the podcast host (e.g. 'Chris', 'Paul')",
                    },
                    episode_angle: {
                        type: "string",
                        description: "The specific topic or angle you are pitching — frame it as a benefit for listeners, not a feature about you (e.g. 'why most freelancers lose deals before the proposal even lands', 'the one-page scope framework that ends scope creep arguments')",
                    },
                    why_their_audience: {
                        type: "string",
                        description: "Why this topic is specifically valuable for this podcast's listeners — be concrete (e.g. 'your audience of creative freelancers deals with scope creep weekly; I've spoken to 200+ of them', 'your listeners are trying to move from project to retainer work — I made that shift and can walk through it step by step')",
                    },
                    your_credential: {
                        type: "string",
                        description: "Your single most relevant credibility signal — specific beats vague (e.g. '8 years of freelance UX, 120+ client contracts', 'built ProposalCraft, an open-source MCP tool with 500+ installs', 'went from $0 to $180k/yr freelancing in 3 years')",
                    },
                    episode_reference: {
                        type: "string",
                        description: "Optional: a specific recent episode you listened to — title or guest name — and one sentence on what resonated. Proves you're a genuine listener, not a spray-and-pray pitcher. Omit if you haven't listened to a recent episode.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["podcast_name", "host_name", "episode_angle", "why_their_audience", "your_credential"],
            },
        },
        {
            name: "guest_post_pitch",
            description: "Write a cold pitch email to a blog, newsletter, or publication asking to contribute a guest article. Guest posts build SEO authority, earn backlinks, and put your name in front of an established audience — but most pitches are rejected because they lead with the writer's ego, not the editor's interests. This generates a reader-first pitch that opens with a concrete article angle tailored to the publication's audience, briefly establishes your credibility, and ends with a frictionless ask. Distinct from podcast_pitch_email (audio appearances), conference_talk_pitch (in-person speaking), and cold_pitch (client sales). Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    publication_name: {
                        type: "string",
                        description: "Name of the blog, newsletter, or publication you are pitching to (e.g. 'Smashing Magazine', 'Freelancer Union Blog', 'Indie Hackers')",
                    },
                    article_angle: {
                        type: "string",
                        description: "The specific article topic or angle you are proposing — frame it as value for the publication's readers, not a showcase for you (e.g. 'how freelancers can write proposals that close without discounting', 'the three scope conversations every new freelancer gets wrong')",
                    },
                    editor_name: {
                        type: "string",
                        description: "Optional: first name of the editor or content lead — personalises the opener. Omit if unknown.",
                    },
                    why_their_readers: {
                        type: "string",
                        description: "Optional: one sentence on why this topic is a specific fit for this publication's readership — concrete beats vague (e.g. 'your readers are mostly early-career freelancers navigating their first client contracts', 'Indie Hackers readers are shipping and selling — scope creep is their number-one frustration'). Omit to keep the pitch tight.",
                    },
                    your_credential: {
                        type: "string",
                        description: "Optional: your single most relevant credibility signal — specific beats vague (e.g. '9 years of freelance product design, 80+ client engagements', 'I built ProposalCraft, used by 600+ freelancers', 'my last piece on Toptal got 12k shares'). Omit if you have no strong signal yet.",
                    },
                    proposed_title: {
                        type: "string",
                        description: "Optional: a working headline for the article — hooks the editor immediately. Omit to keep the pitch angle open.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["publication_name", "article_angle"],
            },
        },
        {
            name: "late_payment_escalation_email",
            description: "Write a professional email escalating an unpaid invoice to a senior contact, the client's finance team, or as a pre-legal notice. Use this after a final payment reminder has gone unanswered — it signals that the matter is now being formally escalated. Calibrated by route: 'manager' addresses the client's manager or director by name; 'legal' is a pre-action letter signalling that formal recovery steps will follow; 'agency' notifies the client that the debt is being passed to a collection or credit-control agency. Tone is firm, factual, and free of emotion — no threats beyond the escalation itself. Distinct from payment_reminder_email (which is sent to the original contact before escalation). Does not count against your monthly draft limit. Required: client_name, amount_due. Optional: invoice_number, due_date, days_overdue, escalation_route ('manager' | 'legal' | 'agency' — defaults to 'legal'), senior_contact_name (first name of the escalation target — omit if unknown), senior_contact_role (e.g. 'Finance Director', 'Head of Operations'), your_name.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Name of the client or company the original invoice was issued to",
                    },
                    amount_due: {
                        type: "string",
                        description: "The outstanding amount, including currency symbol (e.g. '$2,400', '£1,800')",
                    },
                    invoice_number: {
                        type: "string",
                        description: "Invoice reference number (e.g. 'INV-042'). Omit if you don't use invoice numbers.",
                    },
                    due_date: {
                        type: "string",
                        description: "The original payment due date (e.g. 'May 15', '15 May 2026'). Omit if unknown.",
                    },
                    days_overdue: {
                        type: "number",
                        description: "How many days past the due date the invoice currently is.",
                    },
                    escalation_route: {
                        type: "string",
                        description: "'manager' (addressed to a named senior contact at the client company), 'legal' (pre-action letter to the original contact signalling formal recovery), or 'agency' (notifying the client that the debt is being passed to a collection agency). Defaults to 'legal'.",
                    },
                    senior_contact_name: {
                        type: "string",
                        description: "First name of the escalation target — required if escalation_route is 'manager'. Omit for 'legal' or 'agency' routes.",
                    },
                    senior_contact_role: {
                        type: "string",
                        description: "Role or title of the escalation target (e.g. 'Finance Director', 'Head of Operations'). Used in the 'manager' route to add context.",
                    },
                    your_name: {
                        type: "string",
                        description: "Your name for the sign-off",
                    },
                },
                required: ["client_name", "amount_due"],
            },
        },
        {
            name: "testimonial_request_email",
            description: "Write a warm, non-pushy email asking a past or current client for a testimonial, case study quote, or LinkedIn recommendation. Sent after a successful delivery or project milestone. Includes a specific angle or prompt to make it easy for the client to say yes without staring at a blank page. Distinct from client_offboarding_checklist_email (which only has a brief optional postscript ask) — this is a standalone, full-effort ask with a tailored hook. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name or company name",
                    },
                    project_name: {
                        type: "string",
                        description: "Name of the project or work completed (e.g. 'the Acme website redesign', 'our 6-month SEO retainer')",
                    },
                    result_achieved: {
                        type: "string",
                        description: "A specific positive outcome the client got from the work (e.g. '40% increase in organic traffic', 'launched on time and under budget', 'closed three new clients using the proposal templates we built'). Be concrete — the more specific, the easier the ask.",
                    },
                    testimonial_type: {
                        type: "string",
                        description: "Optional: what you're asking for — 'testimonial' (for your website), 'linkedin_recommendation', 'case_study', or 'google_review'. Defaults to 'testimonial'.",
                    },
                    angle_prompt: {
                        type: "string",
                        description: "Optional: a specific question or angle to guide the client (e.g. 'what problem you were trying to solve before we started', 'what surprised you about working together', 'how you'd describe the ROI to a peer'). Providing this makes the ask far easier to fulfil.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "result_achieved"],
            },
        },
        {
            name: "client_offboarding_checklist_email",
            description: "Write a structured end-of-engagement email that doubles as a practical handover checklist. Sent at project close or retainer end — covers what was completed, assets being transferred, outstanding actions for both sides, and any system access being revoked. Protects both parties by ensuring nothing falls through the cracks. Distinct from client_offboarding_email (which ends a relationship you chose to leave) and project_closure_email (a natural project wrap-up email) — this is the operational handover document with explicit action items and a checklist format. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name or company name",
                    },
                    project_name: {
                        type: "string",
                        description: "Name of the project or engagement being closed (e.g. 'the Acme website redesign', 'our monthly SEO retainer')",
                    },
                    deliverables_summary: {
                        type: "string",
                        description: "Brief summary of what was completed during the engagement (e.g. 'full website redesign, content migration, and 3 months of SEO support')",
                    },
                    assets_to_transfer: {
                        type: "string",
                        description: "Optional: comma-separated list of files, accounts, or assets being handed over (e.g. 'source files, Google Analytics access, Figma project, GitHub repo'). Omit if nothing to transfer.",
                    },
                    client_actions: {
                        type: "string",
                        description: "Optional: things the client needs to action after handover (e.g. 'change shared passwords, accept Google Analytics transfer, update billing details'). Omit if none.",
                    },
                    your_actions: {
                        type: "string",
                        description: "Optional: anything you are still completing before the handover is fully done (e.g. 'final invoice to follow', 'source file export in progress'). Omit if everything is already done.",
                    },
                    access_to_revoke: {
                        type: "string",
                        description: "Optional: systems or accounts you will lose access to or remove yourself from (e.g. 'Slack workspace, staging server, CMS admin'). Omit if none.",
                    },
                    testimonial_ask: {
                        type: "boolean",
                        description: "Optional: include a brief ask for a testimonial or LinkedIn recommendation at the end of the email. Default: true.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "deliverables_summary"],
            },
        },
        {
            name: "service_package_email",
            description: "Write a professional email presenting 2–3 productized service packages to a prospect. Used when you offer fixed-price, structured tiers rather than quoting per project — e.g. Starter / Growth / Scale, or Essential / Pro / Premium. Presents each tier with a clear name, what's included, and price. Distinct from rate_card_email (hourly/day rates sent when asked) and draft_proposal (responding to a specific brief). Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    prospect_name: {
                        type: "string",
                        description: "First name of the prospect",
                    },
                    service_type: {
                        type: "string",
                        description: "What the packages are for (e.g. 'website design', 'monthly SEO', 'brand identity', 'content strategy')",
                    },
                    package_1_name: {
                        type: "string",
                        description: "Name of the entry-level package (e.g. 'Starter', 'Essential', 'Foundation')",
                    },
                    package_1_price: {
                        type: "string",
                        description: "Price of the entry package (e.g. '$800', '$500/month', 'from $1,200')",
                    },
                    package_1_includes: {
                        type: "string",
                        description: "What is included in the entry package — comma-separated or short description (e.g. '3 pages, 1 revision round, delivered in 2 weeks')",
                    },
                    package_2_name: {
                        type: "string",
                        description: "Optional: name of the mid-tier package (e.g. 'Growth', 'Professional', 'Standard')",
                    },
                    package_2_price: {
                        type: "string",
                        description: "Optional: price of the mid-tier package",
                    },
                    package_2_includes: {
                        type: "string",
                        description: "Optional: what is included in the mid-tier package",
                    },
                    package_3_name: {
                        type: "string",
                        description: "Optional: name of the premium package (e.g. 'Scale', 'Premium', 'Enterprise')",
                    },
                    package_3_price: {
                        type: "string",
                        description: "Optional: price of the premium package",
                    },
                    package_3_includes: {
                        type: "string",
                        description: "Optional: what is included in the premium package",
                    },
                    recommended_package: {
                        type: "string",
                        description: "Optional: which package to highlight as the recommended choice — use the package name (e.g. 'Growth'). Omit to present all tiers neutrally.",
                    },
                    pitch_context: {
                        type: "string",
                        description: "Optional: one sentence connecting to the prospect's stated need or context (e.g. 'you mentioned you want to launch before Q3', 'based on our call, you need something that scales with your team'). Used to personalise the opening.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["prospect_name", "service_type", "package_1_name", "package_1_price", "package_1_includes"],
            },
        },
        {
            name: "client_material_chase_email",
            description: "Write a professional email chasing a client for overdue materials, content, or approvals needed to continue the project. Used when the client hasn't delivered what they committed to — content, feedback, access, sign-off — and the delay is blocking your work. Calibrates tone based on how overdue they are: friendly (1–5 days), firm (6–14 days), or escalation (15+ days). Makes the impact clear without blame. Distinct from project_delay_warning (when YOU are delayed), payment_reminder_email (financial), and third_party_delay_email (external vendor delay). Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name or full name of the client",
                    },
                    project_name: {
                        type: "string",
                        description: "Name or brief description of the project (e.g. 'the website redesign', 'your brand identity project')",
                    },
                    what_is_needed: {
                        type: "string",
                        description: "Exactly what you're waiting for — be specific (e.g. 'the copy for the About and Services pages', 'approval on the logo concepts', 'admin access to the WordPress dashboard', 'sign-off on the revised scope document')",
                    },
                    original_due_date: {
                        type: "string",
                        description: "Optional: when you were expecting these materials (e.g. 'last Tuesday', 'June 12th', 'two weeks ago'). Including this makes the email more concrete.",
                    },
                    days_overdue: {
                        type: "number",
                        description: "Optional: how many days overdue. Used to calibrate tone — 1–5 = friendly, 6–14 = firm, 15+ = escalation. If omitted, defaults to friendly.",
                    },
                    impact: {
                        type: "string",
                        description: "Optional: what delay this is causing (e.g. 'I can't start the build phase without it', 'the launch date will slip if we don't receive this this week', 'your slot in my schedule is at risk'). Keeps the email factual rather than a complaint.",
                    },
                    new_deadline: {
                        type: "string",
                        description: "Optional: the new date you need the materials by to stay on track (e.g. 'by end of day Friday', 'by June 20th'). Giving a clear target makes it easier for the client to act.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "what_is_needed"],
            },
        },
        {
            name: "mid_project_cancellation_response_email",
            description: "Write a professional response when a client cancels a project mid-engagement. Acknowledges the cancellation without drama, summarises work completed to date, states the kill fee amount if your contract includes one, and confirms the final invoice. Protects you professionally and financially by putting the key facts in writing. Distinct from project_pause_email (temporary stop), project_closure_email (natural end at completion), client_offboarding_email (relationship wind-down), and end_client_relationship_email (you ending it). Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name or full name of the client",
                    },
                    project_name: {
                        type: "string",
                        description: "Name or brief description of the project (e.g. 'the website redesign', 'your brand identity')",
                    },
                    work_completed: {
                        type: "string",
                        description: "Summary of what has been delivered or completed so far (e.g. 'wireframes, homepage design, and two interior page templates', 'discovery workshop, sitemap, and initial content strategy')",
                    },
                    kill_fee_amount: {
                        type: "string",
                        description: "Optional: the kill fee amount or percentage from your contract (e.g. '$1,500', '50% of the remaining balance', '25% of total project fee'). If omitted, the email notes that a final invoice for work completed will follow without referencing a kill fee.",
                    },
                    kill_fee_clause: {
                        type: "string",
                        description: "Optional: brief reference to the contract clause covering cancellation (e.g. 'per clause 7 of our contract', 'as per our agreed terms'). Keeps the tone professional rather than confrontational.",
                    },
                    final_invoice_total: {
                        type: "string",
                        description: "Optional: total amount of the final invoice you will send (e.g. '$2,800'). Including this prevents surprises and frames the email as a clean close.",
                    },
                    assets_to_handover: {
                        type: "string",
                        description: "Optional: files, documents, or access you will hand over so the client can continue with another provider (e.g. 'source files, brand guidelines PDF, and CMS login credentials'). Offering a clean handover protects your reputation.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "work_completed"],
            },
        },
        {
            name: "working_agreement_email",
            description: "Write a short, friendly email that sets out how you and a client will work together during a project — covering communication preferences, response times, revision process, sign-off protocol, and meeting cadence. Sent before or at project kick-off, this prevents misunderstandings that kill projects mid-flow. Distinct from contract_template (legal obligations), client_onboarding_checklist (tasks to complete before starting), and project_kickoff_email (confirming that work has begun) — this is the 'how we actually work day to day' email that experienced freelancers swear by. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name or full name of the client",
                    },
                    project_name: {
                        type: "string",
                        description: "Name or brief description of the project (e.g. 'the website redesign', 'your brand identity')",
                    },
                    communication_channel: {
                        type: "string",
                        description: "Optional: your preferred channel for day-to-day communication (e.g. 'email', 'Slack', 'Notion comments'). Defaults to email if omitted.",
                    },
                    response_time: {
                        type: "string",
                        description: "Optional: your typical response time during business hours (e.g. 'within 24 hours', 'same day before 3pm', 'within one business day'). Defaults to 'within one business day' if omitted.",
                    },
                    revision_rounds: {
                        type: "string",
                        description: "Optional: the number of included revision rounds and what counts as a revision (e.g. 'two rounds of consolidated feedback per deliverable', 'one major and one minor revision pass'). If omitted, no revision detail is included.",
                    },
                    sign_off_process: {
                        type: "string",
                        description: "Optional: how you need sign-off to be given before moving to the next phase (e.g. 'a reply email confirming approval', 'a comment in Figma marked Approved', 'written confirmation by end of day'). If omitted, a simple 'written confirmation by email' is used.",
                    },
                    meeting_cadence: {
                        type: "string",
                        description: "Optional: the agreed meeting rhythm during the project (e.g. 'a weekly 30-minute check-in every Monday', 'a fortnightly review call', 'ad hoc as needed'). If omitted, meetings are described as 'as needed by mutual agreement'.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name"],
            },
        },
        {
            name: "scope_creep_email",
            description: "Write a professional, non-confrontational email addressing a client request that falls outside the agreed project scope. The email acknowledges the request positively, clarifies the scope boundary, and offers a change order or quote for the additional work — without apologising for sticking to the agreement. Handles one of the most common and professionally charged situations for freelancers: when a client treats 'out of scope' as optional. Required: client_name, project_name, scope_change_description. Optional: original_scope_note (what was agreed), quoted_fee (if you already have a price), timeline_impact (if extra work affects delivery), your_name. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name or full name of the client",
                    },
                    project_name: {
                        type: "string",
                        description: "Name or brief description of the project",
                    },
                    scope_change_description: {
                        type: "string",
                        description: "What the client is asking for that falls outside the original scope (e.g. 'adding a third language to the website', 'redesigning the mobile app in addition to the desktop version', 'writing product descriptions for 50 additional SKUs')",
                    },
                    original_scope_note: {
                        type: "string",
                        description: "Optional: brief reminder of what the original scope covered, for context (e.g. 'the agreed scope covers the five-page website in English only', 'the project covers the desktop web app only as outlined in the proposal'). If omitted, a generic scope boundary reference is used.",
                    },
                    quoted_fee: {
                        type: "string",
                        description: "Optional: the additional fee for the out-of-scope work if you already know it (e.g. '$450', '£800', '6 hours at my standard day rate'). If provided, the email includes the quote directly. If omitted, the email offers to send a change order.",
                    },
                    timeline_impact: {
                        type: "string",
                        description: "Optional: how the additional work would affect the current delivery timeline (e.g. 'push the delivery date by 3 days', 'require an extended deadline to the end of the month'). If omitted, no timeline impact is mentioned.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "scope_change_description"],
            },
        },
        {
            name: "project_status_update_email",
            description: "Write a clear, scannable project status update email to send to a client on a regular cadence (weekly, bi-weekly, or at a milestone). Covers what was completed, what is in progress, and what is coming next — with optional sections for blockers and items needed from the client. Keeps clients informed without requiring a call. Does not count against your monthly draft limit. Required: client_name, project_name, completed. Optional: in_progress, coming_next, blockers, items_needed (what you need from the client), timeline_status (on_track / ahead / at_risk / delayed), your_name.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name or full name of the client",
                    },
                    project_name: {
                        type: "string",
                        description: "Name or brief description of the project",
                    },
                    completed: {
                        type: "string",
                        description: "What was completed since the last update (e.g. 'Homepage design finalised and approved, About page copy written, CMS set up and configured'). Use bullet points or comma-separated items.",
                    },
                    in_progress: {
                        type: "string",
                        description: "Optional: what is currently being worked on right now (e.g. 'Services page design, setting up contact form', 'Writing the case study section'). If omitted, this section is skipped.",
                    },
                    coming_next: {
                        type: "string",
                        description: "Optional: what is planned for the next period (e.g. 'Blog template, mobile QA', 'Final round of revisions, staging deployment'). If omitted, this section is skipped.",
                    },
                    blockers: {
                        type: "string",
                        description: "Optional: anything that is blocking progress or creating risk (e.g. 'Waiting on brand guidelines from your designer', 'Server access credentials not yet received'). If omitted, this section is skipped.",
                    },
                    items_needed: {
                        type: "string",
                        description: "Optional: specific things you need from the client to keep the project moving (e.g. 'Approved copy for the Services page', 'Decision on primary CTA colour', 'Confirmation of go-live date'). If omitted, this section is skipped.",
                    },
                    timeline_status: {
                        type: "string",
                        enum: ["on_track", "ahead", "at_risk", "delayed"],
                        description: "Optional: overall timeline status. on_track (default, status line omitted), ahead (note positive progress), at_risk (flag early without alarming), delayed (inform clearly with reason if provided in blockers). If omitted, no timeline status line is included.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "completed"],
            },
        },
        {
            name: "change_order_email",
            description: "Write a professional change order email that formally confirms additional work a client has requested — scope, cost, and timeline impact — and asks for written approval before you begin. Keeps the engagement clean: no ambiguity, no verbal agreements that get disputed later. Distinct from scope_creep_email (which pushes back on unwanted additions) — this is for AGREED extra work. Does not count against your monthly draft limit. Required: client_name, project_name, change_description, additional_cost. Optional: additional_timeline, impact_on_existing_work, approval_method, your_name.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name or full name of the client",
                    },
                    project_name: {
                        type: "string",
                        description: "Name or brief description of the project",
                    },
                    change_description: {
                        type: "string",
                        description: "What the additional work involves (e.g. 'Add a third landing page variant', 'Integrate a third-party booking system', 'Extend the site to include a blog section with 3 post templates')",
                    },
                    additional_cost: {
                        type: "string",
                        description: "The cost for the additional work (e.g. '$800', '$1,200 + GST', '4 hours at $150/hr')",
                    },
                    additional_timeline: {
                        type: "string",
                        description: "Optional: how much extra time is needed (e.g. '3 additional business days', '1 week', 'no change to existing deadline'). If omitted, timeline section is skipped.",
                    },
                    impact_on_existing_work: {
                        type: "string",
                        description: "Optional: any knock-on effect on the existing project scope or timeline (e.g. 'The current go-live date will shift by 3 days', 'No impact on existing deliverables'). If omitted, this section is skipped.",
                    },
                    approval_method: {
                        type: "string",
                        description: "Optional: how the client should approve (e.g. 'Reply to this email with Approved', 'Sign the attached document', 'Reply with your approval'). Defaults to 'Reply to this email with your approval' if omitted.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "change_description", "additional_cost"],
            },
        },
        {
            name: "budget_negotiation_email",
            description: "Write a professional email responding when a client's budget falls short of your quoted price. Three strategic routes: 'scope_reduction' (offer a trimmed version of the project at your full rate), 'hold_rate' (explain why the rate stands and decline to move on price), or 'middle_ground' (propose an adjusted arrangement — phased delivery, reduced scope with option to expand, or flexible payment terms). Keeps the relationship warm regardless of outcome. Distinct from discount_request_response (flat refusal), competitor_response_email (price comparison objection), and change_order_email (agreed additions). Does not count against your monthly draft limit. Required: client_name, your_quoted_price, client_budget, response_route. Optional: project_name, what_can_be_cut, middle_ground_offer, your_name.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name or full name of the client",
                    },
                    your_quoted_price: {
                        type: "string",
                        description: "Your original quoted price (e.g. '$5,000', '$4,800 + GST', '$3,500')",
                    },
                    client_budget: {
                        type: "string",
                        description: "The budget the client stated (e.g. '$3,000', 'around $2,500', 'under $4,000')",
                    },
                    response_route: {
                        type: "string",
                        description: "How you want to respond: 'scope_reduction' (offer reduced scope at full rate), 'hold_rate' (politely decline to move on price), or 'middle_ground' (propose a creative arrangement)",
                    },
                    project_name: {
                        type: "string",
                        description: "Optional: name or brief description of the project",
                    },
                    what_can_be_cut: {
                        type: "string",
                        description: "Optional (for scope_reduction): what elements could be removed or deferred to bring the project within their budget (e.g. 'Remove the blog section and delay the email integration to phase 2', 'Reduce from 5 pages to 3 core pages')",
                    },
                    middle_ground_offer: {
                        type: "string",
                        description: "Optional (for middle_ground): the specific arrangement you're proposing (e.g. 'Phase the project over two invoices', 'Start with the homepage and booking page now, add the remaining pages next quarter', '50% upfront and 50% at 60 days')",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "your_quoted_price", "client_budget", "response_route"],
            },
        },
        {
            name: "deliverables_sign_off_email",
            description: "Write the email asking a client to formally sign off on completed deliverables before you close the project or send the final invoice. The email most freelancers skip — and then spend weeks chasing verbal approvals that were never properly captured. Confirms exactly what was delivered, sets a clear review window, and requests explicit written approval. Keeps the tone collaborative, not administrative. Distinct from milestone_delivered_email (mid-project delivery update), project_closure_email (final wrap-up after sign-off is received), and project_completion_email (marks the end of work). This is the bridge between 'I'm done' and 'it's officially accepted'. Does not count against your monthly draft limit. Required: client_name, project_name, what_was_delivered. Optional: review_deadline (e.g. 'by Friday 20 June', 'within 3 business days' — defaults to a 5-business-day window), next_step (what happens after sign-off, e.g. 'I'll send the final invoice', 'I'll hand over the source files', 'the project is complete' — defaults to final invoice), approval_method (e.g. 'reply to this email', 'click Approve in the shared doc', 'sign the attached form' — defaults to replying to the email), your_name.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name or full name of the client",
                    },
                    project_name: {
                        type: "string",
                        description: "Name or brief description of the project",
                    },
                    what_was_delivered: {
                        type: "string",
                        description: "What you're asking them to sign off on (e.g. 'the final website design mockups — all 5 pages', 'the completed brand identity package: logo, colour palette, and typography guide', 'Phase 2: the API integration and admin dashboard')",
                    },
                    review_deadline: {
                        type: "string",
                        description: "Optional: when you need sign-off by (e.g. 'by Friday 20 June', 'within 3 business days', 'by end of next week'). Defaults to a 5-business-day window.",
                    },
                    next_step: {
                        type: "string",
                        description: "Optional: what happens immediately after sign-off (e.g. 'I'll send the final invoice', 'I'll release the source files', 'the project will be complete and I'll hand over all assets'). Defaults to sending the final invoice.",
                    },
                    approval_method: {
                        type: "string",
                        description: "Optional: how the client should approve (e.g. 'reply to this email with your approval', 'click Approve in the shared Figma file', 'sign and return the attached form'). Defaults to replying to the email.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "what_was_delivered"],
            },
        },
        {
            name: "discovery_call_no_show_email",
            description: "Write the email to a prospect who booked a discovery call and didn't show up. One of the most common and awkward freelancer situations — you cleared the time, they ghosted, and now you have to decide how to handle it. Gets the tone right: not passive-aggressive, not a pushover, not grovelling. First no-show: assumes good faith (tech issues, genuine emergency) and offers a single, low-friction reschedule. Second no-show: politely closes the door while leaving it ajar if they ever do want to proceed. Distinct from meeting_cancellation_email (you cancel), meeting_postponement_email (you postpone), and cold_pitch_follow_up (prospecting). Does not count against your monthly draft limit. Required: client_name. Optional: call_time (e.g. 'today at 2pm', 'Monday at 10am') — adds specificity, no_show_count (1 or 2 — defaults to 1 for first no-show, 2 gives the close-out version), reschedule_link (e.g. 'my Calendly link', 'cal.com/yourname' — defaults to replying to the email), your_name.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "First name or full name of the prospect",
                    },
                    call_time: {
                        type: "string",
                        description: "Optional: when the call was scheduled (e.g. 'today at 2pm', 'Monday at 10am', 'this morning at 9')",
                    },
                    no_show_count: {
                        type: "number",
                        description: "Optional: 1 for first no-show (give benefit of the doubt, offer reschedule — default), 2 for second no-show (polite close-out)",
                    },
                    reschedule_link: {
                        type: "string",
                        description: "Optional: how to rebook (e.g. 'my Calendly link: cal.com/yourname', 'this link: calendly.com/you'). Defaults to replying to the email.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name"],
            },
        },
        {
            name: "availability_announcement_email",
            description: "Write a short, warm email to past clients or contacts announcing that you have upcoming availability for new project work. One of the highest-ROI freelancer marketing moves: a brief, personal note to people who already know your work often surfaces a project within days. Gets the tone right: confident, not desperate — you're sharing news, not asking for a favour. Required: availability_window (e.g. 'from July 1', 'starting mid-August', 'a couple of slots opening next month'). Optional: recipient_name (personalises the opening), services_offered (what you're available for — defaults to your usual work), project_type (narrow the ask: 'short-term projects', 'ongoing retainers', 'one-off design work'), max_projects (e.g. '1 or 2 projects' — signals scarcity without pressure), cta (what you want them to do: 'reply if you have something in mind', 'forward this to someone who might need help' — defaults to reply), your_name. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    availability_window: {
                        type: "string",
                        description: "When you'll be available (e.g. 'from July 1', 'starting mid-August', 'a couple of slots opening next month')",
                    },
                    recipient_name: {
                        type: "string",
                        description: "Optional: first name of the recipient — personalises the greeting. Omit for a generic version.",
                    },
                    services_offered: {
                        type: "string",
                        description: "Optional: what you do (e.g. 'copywriting and content strategy', 'UX design', 'backend development'). Defaults to your usual work.",
                    },
                    project_type: {
                        type: "string",
                        description: "Optional: narrow the ask (e.g. 'short-term projects', 'ongoing retainers', 'brand identity work', 'one-off builds')",
                    },
                    max_projects: {
                        type: "string",
                        description: "Optional: signals scarcity (e.g. '1 or 2 projects', 'a couple of spots', 'one retainer slot')",
                    },
                    cta: {
                        type: "string",
                        description: "Optional: what you want them to do (e.g. 'reply if you have something in mind', 'forward to anyone who might need help', 'book a quick call'). Defaults to reply.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["availability_window"],
            },
        },
        {
            name: "price_increase_email",
            description: "Write a confident, non-apologetic email notifying existing clients of a rate increase. One of the hardest emails freelancers avoid writing — and one of the most important. Gets the tone right: you're growing, not gouging. Three scenarios: 'advance_notice' (standard heads-up before the new rate kicks in — most common), 'retainer_renewal' (updating a retainer rate at renewal), 'mid_project' (rare: rate increase affecting an in-flight project — requires explicit justification). Required: client_name, new_rate, effective_date. Optional: current_rate (including it shows transparency), rate_type (hourly/daily/project — defaults to 'rate'), scenario (advance_notice/retainer_renewal/mid_project — defaults to advance_notice), project_name (for mid_project or retainer context), reason (brief, honest note on why: 'increased demand', 'cost of living', 'expanded service offering' — keep it to one line; omit if you'd rather not justify), your_name. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name",
                    },
                    new_rate: {
                        type: "string",
                        description: "Your new rate (e.g. '$150/hr', '$1,200/day', '$5,500 project')",
                    },
                    effective_date: {
                        type: "string",
                        description: "When the new rate takes effect (e.g. 'July 1', 'from our next project', 'at your next renewal')",
                    },
                    current_rate: {
                        type: "string",
                        description: "Optional: your current rate — showing the before/after adds transparency (e.g. '$120/hr', '$950/day')",
                    },
                    rate_type: {
                        type: "string",
                        description: "Optional: 'hourly', 'daily', or 'project' — used to frame the language naturally. Defaults to a neutral 'rate'.",
                    },
                    scenario: {
                        type: "string",
                        description: "Optional: 'advance_notice' (default — standard heads-up), 'retainer_renewal' (updating a retainer at renewal), or 'mid_project' (rate change affecting an ongoing engagement — use only when unavoidable, and always include a reason)",
                    },
                    project_name: {
                        type: "string",
                        description: "Optional: project or retainer name — useful for retainer_renewal or mid_project scenarios",
                    },
                    reason: {
                        type: "string",
                        description: "Optional: one-line reason (e.g. 'increased demand for my services', 'cost of living increases', 'I've expanded what I offer'). Keep it brief. Omit if you'd prefer not to justify the increase.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "new_rate", "effective_date"],
            },
        },
        {
            name: "retainer_downgrade_response_email",
            description: "Write a professional response when a retainer client asks to reduce their commitment — fewer hours, a lower tier, or a scaled-back scope. One of the awkward conversations freelancers avoid, but handling it well keeps the relationship intact and sometimes reverses the decision. Three routes: 'accommodate' (accept the reduction professionally, confirm the new terms cleanly — use when the client's situation is clear and fighting it would cost more than the hours lost), 'retain' (make a measured case for keeping the current commitment — summarise the value delivered, flag transition costs, offer a short-term adjustment before a permanent change), 'pause' (propose a temporary pause instead of a permanent downgrade — protects the relationship and keeps the door open for a return to full scope). Required: client_name, reduction_request (what they asked for, e.g. 'halve the monthly hours', 'drop from 20 to 10 hours/month', 'pause for 60 days'). Optional: current_terms (e.g. '20 hours/month at $3,000'), proposed_terms (the reduced version they're asking for), retainer_name (project or retainer label), route (accommodate/retain/pause — defaults to accommodate), your_name. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name",
                    },
                    reduction_request: {
                        type: "string",
                        description: "What the client asked for (e.g. 'halve the monthly hours', 'drop from 20 to 10 hours/month', 'step back to the basic tier', 'pause for 60 days')",
                    },
                    current_terms: {
                        type: "string",
                        description: "Optional: your current retainer terms (e.g. '20 hours/month at $3,000', '$2,500/month for ongoing support')",
                    },
                    proposed_terms: {
                        type: "string",
                        description: "Optional: the reduced terms they're proposing (e.g. '10 hours/month', '$1,500/month', 'ad-hoc only')",
                    },
                    retainer_name: {
                        type: "string",
                        description: "Optional: name of the retainer or ongoing engagement (e.g. 'the marketing retainer', 'our monthly support agreement')",
                    },
                    route: {
                        type: "string",
                        description: "Optional: 'accommodate' (accept the change professionally — default), 'retain' (make a case for keeping the current scope), or 'pause' (propose a temporary pause instead of a permanent reduction)",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "reduction_request"],
            },
        },
        {
            name: "project_delay_notification_email",
            description: "Write a professional email notifying a client that a project deadline will be missed. The hardest email most freelancers avoid sending — but sending it early, clearly, and without over-apologising is exactly what separates pros from amateurs. Three routes: 'early_warning' (you can see the deadline is at risk before it arrives — best time to raise it, gives the client maximum flexibility), 'on_deadline' (it's the due date and it won't be ready — lead with the new date, short explanation), 'already_late' (you've already missed it — own it, new date, no excuses). Required: client_name, project_name, new_deadline (the revised date you're committing to). Optional: reason (brief, factual — not a list of excuses), what_is_complete (how much is done, reassures the client progress is real), route (early_warning/on_deadline/already_late — defaults to on_deadline), your_name. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "Client's first name",
                    },
                    project_name: {
                        type: "string",
                        description: "Name of the project or deliverable (e.g. 'the website redesign', 'the brand guidelines', 'your mobile app')",
                    },
                    new_deadline: {
                        type: "string",
                        description: "The revised delivery date you're committing to (e.g. 'Friday 27 June', 'end of next week', 'Monday 30 June')",
                    },
                    reason: {
                        type: "string",
                        description: "Optional: brief, factual reason for the delay (e.g. 'a technical issue took longer than expected to resolve', 'I underestimated the scope of the revisions'). Keep it one sentence — don't over-explain.",
                    },
                    what_is_complete: {
                        type: "string",
                        description: "Optional: what is already done, to reassure the client progress is real (e.g. 'The structure and copy are finished — I'm finalising the visual polish', '80% of the build is complete')",
                    },
                    route: {
                        type: "string",
                        description: "Optional: 'early_warning' (flagging a risk before the deadline arrives — best outcome), 'on_deadline' (the day it was due and it's not ready — default), or 'already_late' (you've already missed it — own it cleanly)",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "new_deadline"],
            },
        },
        {
            name: "linkedin_connection_request",
            description: "Write a LinkedIn connection request message (max 300 characters) to a potential client or collaborator. The best connection requests are specific, low-pressure, and name a real reason to connect — not a pitch. Bad ones read like a cold email jammed into 280 characters. This tool keeps it human: one genuine hook, no fluff. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    recipient_name: {
                        type: "string",
                        description: "Optional: their first name. Personalises the opening line.",
                    },
                    reason_to_connect: {
                        type: "string",
                        description: "The specific, genuine reason you're connecting — e.g. 'I saw your post about pricing for freelance designers', 'we're both in the Freelance Finance community', 'I noticed you're hiring for a UX role and I specialise in that area', 'I read your case study on rebranding [Company]'. The more specific, the better.",
                    },
                    your_service: {
                        type: "string",
                        description: "Optional: what you do, in 5 words or fewer — e.g. 'UX designer for SaaS', 'copywriter for B2B tech', 'brand strategist'. Only include if directly relevant to the reason you're connecting.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name, if you want it in the message.",
                    },
                },
                required: ["reason_to_connect"],
            },
        },
        {
            name: "client_reference_request_email",
            description: "Ask a trusted past client to be a named reference for a specific prospect — someone the prospect can email or call directly. Different from testimonial_request (written quote for your website), recommendation_request_email (LinkedIn), and referral_request (active warm intro). A reference is a person on your reference list who speaks directly to a prospect doing due diligence. This email makes the ask easy: it gives context on the prospect, sets expectations on time commitment, and makes it simple to say yes or no. Does not count against your monthly draft limit.",
            inputSchema: {
                type: "object",
                properties: {
                    client_name: {
                        type: "string",
                        description: "The client's first name",
                    },
                    project_name: {
                        type: "string",
                        description: "The project or engagement you worked on together — gives them context for what they'd be speaking to (e.g. 'the brand identity project', 'the six-month retainer', 'the website redesign')",
                    },
                    prospect_type: {
                        type: "string",
                        description: "A short description of the prospect — what kind of business or person they are and what they're looking to hire for. No need to name them. (e.g. 'a B2B SaaS startup looking for a content strategist', 'a boutique law firm that needs a website redesign', 'a founder evaluating fractional CFO services')",
                    },
                    prospect_name: {
                        type: "string",
                        description: "Optional: the prospect's name, if you're comfortable sharing it and want to personalise the ask",
                    },
                    time_commitment: {
                        type: "string",
                        description: "Optional: expected time commitment if they're contacted — sets expectations and removes anxiety (e.g. 'a 10-minute call', 'a few email questions', 'a quick 15-minute chat'). Defaults to 'a short call or a few email questions' if omitted.",
                    },
                    your_name: {
                        type: "string",
                        description: "Optional: your name for the sign-off",
                    },
                },
                required: ["client_name", "project_name", "prospect_type"],
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
    if (name === "change_order") {
        const originalScope = String(args.original_scope);
        const changeRequested = String(args.change_requested);
        const clientName = String(args.client_name);
        const additionalCost = args.additional_cost ? String(args.additional_cost) : null;
        const timelineImpact = args.timeline_impact ? String(args.timeline_impact) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your Name / Company]";
        const costLine = additionalCost
            ? `Additional cost: ${additionalCost}`
            : "Additional cost: [TBC — leave as a placeholder for the freelancer to fill in]";
        const timelineLine = timelineImpact
            ? `Timeline impact: ${timelineImpact}`
            : "Timeline impact: assess from the change description and state the impact, or use '[TBC]' if insufficient information";
        return {
            content: [
                {
                    type: "text",
                    text: `Generate a professional Change Order document with the following details.

Parties: ${yourName} (Service Provider) and ${clientName} (Client).
${costLine}
${timelineLine}

Structure the document as:

**CHANGE ORDER #[CO-001]**
Date: [today's date]
Project: [infer a short project name from the original scope]
Client: ${clientName}
Service Provider: ${yourName}

**1. Original Scope Summary**
One paragraph summarising what was originally agreed (paraphrase the scope below — do not reproduce it verbatim).

**2. Change Requested**
Clear, specific description of the additional work being requested. Be concrete — name the deliverable, feature, or task. If the request was vague, flag that specifics need to be confirmed.

**3. Why This Is Out of Scope**
One sentence explaining that this work was not included in the original agreement and constitutes an addition to the contract.

**4. Change Order Details**
| Item | Detail |
|---|---|
| Additional Deliverable(s) | [list what will be produced] |
| Additional Cost | ${additionalCost || "[TBC]"} |
| Timeline Impact | ${timelineImpact || "[TBC]"} |
| Payment Terms | [e.g. invoiced on approval, paid before work begins] |

**5. Revised Delivery Date**
[State the new expected delivery date if timeline is affected, or confirm original date stands]

**6. Approval**
By signing below, the client authorises the Service Provider to proceed with the change described above and agrees to the additional cost and timeline adjustment.

| | Service Provider | Client |
|---|---|---|
| Name | ${yourName} | ${clientName} |
| Signature | _______________ | _______________ |
| Date | _______________ | _______________ |

Rules:
- Plain, direct language — no legal jargon.
- The change order should be self-contained: someone who hasn't read the original proposal should understand what changed.
- Keep to one page.

---

ORIGINAL SCOPE:
${originalScope}

CHANGE REQUESTED:
${changeRequested}`,
                },
            ],
        };
    }
    if (name === "availability_announcement") {
        const yourName = String(args.your_name);
        const clientName = String(args.client_name);
        const pastProject = String(args.past_project);
        const availableFrom = String(args.available_from);
        const capacityType = args.capacity_type ? String(args.capacity_type) : "a new project";
        const email = `Subject: Coming up for air — capacity opening ${availableFrom}

Hi ${clientName},

Hope things are going well since ${pastProject}.

I have capacity opening up ${availableFrom} and wanted to reach out to people I've enjoyed working with before seeing what else comes my way.

If you have ${capacityType} on the horizon — or know someone who might — I'd love to hear about it.

No pressure either way. Just wanted you to hear it from me first.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: email,
                },
            ],
        };
    }
    if (name === "project_closure_email") {
        const yourName = String(args.your_name);
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const whatWasDelivered = String(args.what_was_delivered);
        const handoverItems = args.handover_items ? String(args.handover_items) : null;
        const warrantyPeriod = args.warranty_period ? String(args.warranty_period) : null;
        const futureWorkHook = args.future_work_hook ? String(args.future_work_hook) : null;
        let body = `Subject: ${projectName} — all done ✓\n\nHi ${clientName},\n\nThat's a wrap on ${projectName}.\n\n`;
        body += `**What was delivered**\n${whatWasDelivered}\n\n`;
        if (handoverItems) {
            body += `**A few things on your end**\n${handoverItems}\n\nLet me know if you need help with any of these.\n\n`;
        }
        if (warrantyPeriod) {
            body += `**Support period**\n${warrantyPeriod}. If anything doesn't look right or behave as expected, just send it through and I'll sort it.\n\n`;
        }
        if (futureWorkHook) {
            body += `When you're ready, ${futureWorkHook} would be the natural next step — happy to put a proposal together whenever it makes sense.\n\n`;
        }
        body += `It's been a pleasure working with you on this. Really enjoyed it.\n\n${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: body,
                },
            ],
        };
    }
    if (name === "meeting_recap_email") {
        const yourName = String(args.your_name);
        const clientName = String(args.client_name);
        const meetingType = args.meeting_type ? String(args.meeting_type) : "check-in";
        const keyPoints = String(args.key_points);
        const decisions = args.decisions ? String(args.decisions) : null;
        const nextSteps = args.next_steps ? String(args.next_steps) : null;
        const followUpDate = args.follow_up_date ? String(args.follow_up_date) : null;
        const subjectMap = {
            discovery: `Notes from our discovery call`,
            kickoff: `Project kickoff — recap and next steps`,
            "check-in": `Quick recap from today's call`,
            review: `Review call — decisions and next steps`,
            sales: `Following up on our conversation`,
        };
        const subject = subjectMap[meetingType] ?? `Recap from today's call`;
        const openingMap = {
            discovery: `Thanks for taking the time to walk me through the project today. Really useful conversation — here's a quick summary of what we covered.`,
            kickoff: `Great to officially kick things off today. Here's a recap to make sure we're aligned on everything going into the project.`,
            "check-in": `Thanks for the catch-up. Here's a quick recap so we've got everything in one place.`,
            review: `Good session today. Here's a summary of what we reviewed, the decisions we landed on, and what happens next.`,
            sales: `Really enjoyed our conversation. Here's a brief recap of what we discussed.`,
        };
        const opening = openingMap[meetingType] ?? openingMap["check-in"];
        let body = `Subject: ${subject}\n\nHi ${clientName},\n\n${opening}\n\n`;
        body += `**What we covered**\n${keyPoints}\n\n`;
        if (decisions) {
            body += `**Decisions confirmed**\n${decisions}\n\n`;
        }
        if (nextSteps) {
            body += `**Next steps**\n${nextSteps}\n\n`;
        }
        if (followUpDate) {
            body += `We'll pick this up again on ${followUpDate}. I'll send a calendar invite.\n\n`;
        }
        body += `Let me know if I've missed anything or you want to change anything above.\n\n${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: body,
                },
            ],
        };
    }
    if (name === "referral_request") {
        const yourName = String(args.your_name);
        const clientName = String(args.client_name);
        const projectSummary = String(args.project_summary);
        const yourSpecialty = String(args.your_specialty);
        const email = `Subject: A small favour — anyone you'd recommend me to?

Hi ${clientName},

Really glad the ${projectSummary} came together well.

I wanted to ask — do you know anyone else who might need ${yourSpecialty}? You'd know better than most what the finished product looks like, so a word from you carries a lot of weight.

If someone comes to mind, an introduction or even just passing on my details would mean a lot. Happy to do the same for you anytime.

Thanks again for a great project.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: email,
                },
            ],
        };
    }
    if (name === "contract_template") {
        const yourName = String(args.your_name);
        const clientName = String(args.client_name);
        const projectDescription = String(args.project_description);
        const totalPrice = String(args.total_price);
        const paymentTerms = args.payment_terms
            ? String(args.payment_terms)
            : "50% on signing, 50% on final delivery";
        const revisionRounds = typeof args.revision_rounds === "number" ? args.revision_rounds : 2;
        const startDate = args.start_date ? String(args.start_date) : null;
        const governingLaw = args.governing_law ? String(args.governing_law) : null;
        const lawClause = governingLaw
            ? `This agreement is governed by the laws of ${governingLaw}. Any disputes will be resolved in the courts of ${governingLaw}.`
            : "This agreement is governed by the laws of the jurisdiction in which the Service Provider is based.";
        const startClause = startDate
            ? `Services will commence on or around ${startDate}, subject to receipt of the signed agreement and any deposit required under Section 3.`
            : "Services will commence on a date agreed in writing by both parties, subject to receipt of the signed agreement and any deposit required under Section 3.";
        const contract = `FREELANCE SERVICES AGREEMENT

This agreement is entered into between:

Service Provider: ${yourName}
Client: ${clientName}

Collectively referred to as "the parties."

---

1. SERVICES

${yourName} agrees to provide the following services to ${clientName}:

${projectDescription}

The specific deliverables, timeline, and scope of work will be documented in a separate Statement of Work or project brief agreed by both parties. ${startClause}

---

2. FEES

The total fee for the services described is ${totalPrice}.

Payment terms: ${paymentTerms}.

Invoices are due within 14 days of issue unless otherwise agreed in writing. Late payments accrue interest at 1.5% per month on the overdue amount after the due date.

${yourName} reserves the right to pause or suspend work if an invoice is more than 14 days overdue.

---

3. REVISIONS

The fee includes up to ${revisionRounds} round${revisionRounds === 1 ? "" : "s"} of revisions. A revision round is a consolidated set of changes communicated in a single brief.

Revision requests beyond this allowance will be quoted and invoiced separately at ${yourName}'s standard day rate.

---

4. INTELLECTUAL PROPERTY

All intellectual property rights in the deliverables transfer to ${clientName} in full upon receipt of final payment. Until final payment is received, ${yourName} retains all rights to the work.

${yourName} retains the right to display the completed work in their portfolio and use it for self-promotional purposes, unless ${clientName} requests otherwise in writing.

---

5. CONFIDENTIALITY

Each party agrees to keep confidential any non-public information disclosed by the other party in connection with this engagement, and not to disclose it to third parties without prior written consent. This obligation survives termination of this agreement.

---

6. TERMINATION

Either party may terminate this agreement with 14 days' written notice.

If ${clientName} terminates the agreement, ${yourName} is entitled to payment for all work completed to the date of termination. Any deposit paid is non-refundable.

If ${yourName} terminates the agreement without cause, they will refund any fees paid for work not yet delivered.

---

7. LIMITATION OF LIABILITY

${yourName}'s total liability under this agreement is limited to the total fees paid by ${clientName} under this agreement.

Neither party is liable to the other for indirect, incidental, or consequential damages, including loss of profits or business interruption, arising from this agreement.

---

8. INDEPENDENT CONTRACTOR

${yourName} is an independent contractor, not an employee of ${clientName}. Nothing in this agreement creates a partnership, joint venture, or employment relationship. ${yourName} is responsible for their own taxes and insurance.

---

9. GENERAL

This agreement constitutes the entire agreement between the parties and supersedes any prior discussions or representations.

Amendments must be agreed in writing by both parties.

If any provision of this agreement is found to be unenforceable, the remaining provisions continue in full force.

${lawClause}

---

SIGNATURES

By signing below, both parties agree to the terms of this agreement.

Service Provider

Name: ___________________________
Signature: ___________________________
Date: ___________________________


Client

Name: ___________________________
Signature: ___________________________
Date: ___________________________

---

⚖️ Reviewer note: This is a plain-English freelance services agreement suitable for most standard engagements. It is not a substitute for legal advice. For high-value contracts, international work, complex IP arrangements, or regulated industries, have a lawyer review it first.`;
        return {
            content: [
                {
                    type: "text",
                    text: contract,
                },
            ],
        };
    }
    if (name === "nda_template") {
        const yourName = String(args.your_name);
        const clientName = String(args.client_name);
        const projectDescription = String(args.project_description);
        const durationYears = args.duration_years ? Number(args.duration_years) : 2;
        const mutual = args.mutual === true;
        const governingLaw = args.governing_law ? String(args.governing_law) : "[Governing Law Jurisdiction]";
        const ndaType = mutual ? "Mutual Non-Disclosure Agreement" : "Non-Disclosure Agreement";
        const disclosureScope = mutual
            ? "Both parties may disclose confidential information to each other in connection with the engagement described below. Each party agrees to protect the other's confidential information on the same terms."
            : `${clientName} (the \"Disclosing Party\") may disclose confidential information to ${yourName} (the \"Receiving Party\") in connection with the engagement described below.`;
        const obligationParty = mutual
            ? "Each party (as Receiving Party)"
            : `${yourName} (Receiving Party)`;
        return {
            content: [
                {
                    type: "text",
                    text: `Generate a plain-English ${ndaType} with the following details. Format it as a proper legal document ready to be signed.

Parties:
- Service Provider: ${yourName}
- Client: ${clientName}
- Project / Engagement: ${projectDescription}
- NDA type: ${mutual ? "Mutual" : "One-way (client info protected)"}
- Confidentiality duration: ${durationYears} year${durationYears !== 1 ? "s" : ""} from the date of signing
- Governing law: ${governingLaw}

Structure the NDA as follows:

---

**NON-DISCLOSURE AGREEMENT**

**Date:** [Date]

**Between:**
- ${yourName} ("Service Provider")
- ${clientName} ("Client")

**1. Background**
The parties intend to ${projectDescription}. In connection with this engagement, ${disclosureScope}

**2. Definition of Confidential Information**
"Confidential Information" means any non-public information disclosed by one party to the other, whether in writing, orally, or by inspection, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and circumstances of disclosure. This includes but is not limited to: business plans, technical data, trade secrets, client lists, pricing, financial information, and product plans.

**3. Exclusions**
Confidential Information does not include information that: (a) is or becomes publicly known through no breach of this Agreement; (b) was rightfully known to the Receiving Party before disclosure; (c) is independently developed by the Receiving Party without use of the Confidential Information; or (d) is required to be disclosed by law or court order, provided the Receiving Party gives reasonable notice.

**4. Obligations**
${obligationParty} agrees to: (a) hold all Confidential Information in strict confidence; (b) not disclose it to third parties without prior written consent; (c) use it solely for the purpose of the engagement described above; and (d) apply at least the same degree of care used to protect its own confidential information, and no less than reasonable care.

**5. Duration**
These obligations remain in effect for ${durationYears} year${durationYears !== 1 ? "s" : ""} from the date of this Agreement, or until the Confidential Information no longer qualifies as confidential, whichever occurs first.

**6. Return or Destruction**
Upon written request, the Receiving Party will promptly return or destroy all Confidential Information, including copies and notes, and confirm this in writing.

**7. Remedies**
The parties acknowledge that breach of this Agreement may cause irreparable harm for which monetary damages would be an inadequate remedy. Accordingly, the non-breaching party is entitled to seek equitable relief, including injunction, in addition to any other remedies available at law.

**8. General**
This Agreement is the entire agreement between the parties on this subject and supersedes all prior discussions. It may be amended only in writing signed by both parties. This Agreement shall be governed by the laws of ${governingLaw}. If any provision is found unenforceable, the remaining provisions continue in full force.

---

**Signatures**

| | Service Provider | Client |
|---|---|---|
| Name | ${yourName} | ${clientName} |
| Signature | _______________ | _______________ |
| Date | _______________ | _______________ |

---

*Note: This NDA is provided as a starting template. For complex engagements, engagements involving significant IP, or where local law requirements are unclear, consider having a lawyer review it before signing.*`,
                },
            ],
        };
    }
    if (name === "project_status_update") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const completed = String(args.completed_this_period);
        const nextSteps = String(args.next_steps);
        const blockers = args.blockers ? String(args.blockers) : null;
        const timelineStatus = args.timeline_status ? String(args.timeline_status) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your Name]";
        const blockersSection = blockers
            ? `\n**Blockers / decisions needed from client:**\n${blockers}`
            : "";
        const timelineSection = timelineStatus
            ? `\n**Timeline:** ${timelineStatus}`
            : "";
        return {
            content: [
                {
                    type: "text",
                    text: `Write a project status update email from ${yourName} to ${clientName} about ${projectName}.

Details:
- Completed this period: ${completed}
- Next steps: ${nextSteps}${blockersSection}${timelineSection}

Structure:
1. **Subject line**: "Update: [Project Name] — [brief status]" — e.g. "Update: Shopify Redesign — Week 2 complete, on track"
2. **Opening**: one sentence, no filler. Reference the project by name.
3. **Completed this period** (use a heading): bullet list of what was done. Concrete, specific — not "worked on design" but "completed mobile homepage wireframes (3 variants)."
4. **Up next** (use a heading): what's happening in the next period. 3-5 bullets.
${blockers ? '5. **Needs from you** (use a heading): specific decisions or inputs needed from the client. Frame each as a clear question or action. Give a deadline if relevant.\n' : ''}${timelineStatus ? `${blockers ? '6' : '5'}. **Timeline**: one sentence on current status.\n` : ''}${blockers || timelineStatus ? `${blockers && timelineStatus ? '7' : '6'}` : '5'}. **Sign-off**: brief and direct. No "let me know if you have any questions" — say "reply if you need anything before [next milestone]" or similar.

Rules:
- Under 200 words (body, not subject).
- Use short paragraphs and clear headings — clients scan these.
- Past tense for completed items, future tense for next steps.
- If there are blockers, make them impossible to miss.
- No padding. No "we've been making great progress" unless it's true and specific.`,
                },
            ],
        };
    }
    if (name === "budget_proposal") {
        const usage = getUsage();
        if (usage.draft_count >= FREE_DRAFT_LIMIT) {
            return {
                content: [
                    {
                        type: "text",
                        text: `You've used all ${FREE_DRAFT_LIMIT} free drafts this month.\n\nUpgrade to ProposalCraft Pro ($19/mo) for unlimited drafts: ${PRO_URL}`,
                    },
                ],
            };
        }
        incrementUsage(usage);
        const originalProposal = String(args.original_proposal);
        const clientFeedback = String(args.client_feedback);
        const targetBudget = args.target_budget ? String(args.target_budget) : null;
        const clientName = args.client_name ? String(args.client_name) : "the client";
        const yourName = args.your_name ? String(args.your_name) : "[Your Name]";
        const budgetLine = targetBudget
            ? `Target budget mentioned by client: ${targetBudget}. Aim to hit or get close to this with the reduced scope.`
            : "No specific budget was given — propose a scope reduction of roughly 30-40% and let the client see the trade-off.";
        return {
            content: [
                {
                    type: "text",
                    text: `Write a revised "budget proposal" response to a client who said the original quote was too expensive.

Context:
- Client: ${clientName}
- Client feedback: ${clientFeedback}
- ${budgetLine}

The principle: cut scope, not rate. Never apologise for your original price or imply it was wrong.

Structure the response as:

**Opening (2 sentences)**
Acknowledge you heard them on budget. Confirm your rate stays the same — but offer a path to fit their number by narrowing scope. Do not say "I understand" or "totally get it."

**What's in the reduced scope**
Bullet list of what the revised version includes. Be specific — name exactly what stays. This should feel like a focused, complete version of the project, not a stripped-down afterthought.

**What's removed**
Short bullet list of what's cut vs the original. Frame each cut as optional/phaseable ("Phase 2", "add-on later") — not as something they're losing.

**Revised investment**
${targetBudget ? `Revised price targeting ${targetBudget}` : "Revised price — clearly lower than original, still reflects your rate applied to the reduced scope"}
Payment terms: same as original proposal.

**Note on quality**
One sentence: the work in this scope will be delivered to the same standard. The scope is smaller; the quality is not.

**Next step**
One clear ask — usually: confirm which version they'd like to proceed with, or request a call to decide.

---

ORIGINAL PROPOSAL:
${originalProposal}

CLIENT FEEDBACK:
${clientFeedback}`,
                },
            ],
        };
    }
    if (name === "rejection_response") {
        const clientName = String(args.client_name);
        const projectType = String(args.project_type);
        const rejectionReason = args.rejection_reason ? String(args.rejection_reason) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your Name]";
        const keepDoorOpen = args.keep_door_open !== false;
        const reasonContext = rejectionReason
            ? `The stated reason for not proceeding: "${rejectionReason}". Acknowledge this briefly if appropriate — don't dwell on it.`
            : "No reason was given for not proceeding.";
        const doorLine = keepDoorOpen
            ? "End with one light, non-pushy line keeping the door open for future work — no grovelling, no 'please reconsider', just a natural 'if something comes up later' tone."
            : "Do not include any forward ask — end cleanly after wishing them well with the project.";
        return {
            content: [
                {
                    type: "text",
                    text: `Write a rejection response email from ${yourName} to ${clientName}.

Context:
- Project pitched: ${projectType}
- ${reasonContext}
- ${doorLine}

Structure:
1. Thank them for letting you know — one sentence. No effusive "thank you so much."
2. Wish them well with the project — one sentence, genuine not performative.
3. ${keepDoorOpen ? "One light mention of future availability — framed as an offer, not a plea. Don't say 'please keep me in mind' (passive) — say something active but low-key." : "End here — no forward ask."}
4. Short sign-off.

Rules:
- Under 80 words.
- No subject line — just the body.
- No bitterness, no fishing for feedback (unless you want to add an optional gentle ask — but only if it feels natural given the reason).
- Do not over-apologise or ask what you did wrong.
- Do not say "I completely understand" — it sounds scripted.
- The goal: leave them with a positive impression of you so they think of you first next time.
- Tone: professional, warm, brief. Like a handshake at the end of a meeting.`,
                },
            ],
        };
    }
    if (name === "cold_pitch") {
        const targetCompany = String(args.target_company);
        const contactName = args.contact_name ? String(args.contact_name) : null;
        const whatYouDo = String(args.what_you_do);
        const whyThem = String(args.why_them);
        const yourName = args.your_name ? String(args.your_name) : "[Your Name]";
        const ask = args.ask ? String(args.ask) : "a 15-minute call to see if there's a fit";
        const greeting = contactName ? `Hi ${contactName},` : `Hi,`;
        return {
            content: [
                {
                    type: "text",
                    text: `Write a cold outbound pitch email from ${yourName} to ${contactName || "a contact"} at ${targetCompany}.

Opening: ${greeting}

Details:
- What the sender does: ${whatYouDo}
- Why this specific company: ${whyThem}
- Ask: ${ask}

Structure the email as:
1. **Subject line**: specific, not generic. Reference the company or the specific problem (not "Quick question" or "Partnership opportunity"). Under 8 words.
2. **Opening line**: one sentence that references the specific signal or problem you noticed about THEM. No "I came across your company" or "I hope this finds you well." Open with the observation, not with yourself.
3. **What you do**: one sentence. Name your specialism and one concrete outcome you deliver. Lead with the outcome, not the process.
4. **Relevant proof**: one sentence — a comparable client, a result, or a specific example that makes this relevant to them. Do not use vague claims ("helped many companies like yours").
5. **The ask**: one sentence. Make it small and low-commitment. End with a question mark.
6. Sign-off: short. Just name and optionally a one-line link.

Rules:
- Under 120 words (body, not counting subject line).
- Do not introduce yourself in the first sentence.
- Do not apologise for reaching out.
- No "I wanted to reach out" or "I know you're busy."
- The best cold emails read like someone did their homework, not like a mail-merge.
- One ask only. No "let me know if you're interested OR I could also send more info OR happy to connect on LinkedIn."

WHY THEM (use this as the hook for the opening line):
${whyThem}`,
                },
            ],
        };
    }
    if (name === "invoice_reminder") {
        const clientName = String(args.client_name);
        const invoiceNumber = String(args.invoice_number);
        const amount = String(args.amount);
        const dueDate = String(args.due_date);
        const reminderNumber = args.reminder_number ? Number(args.reminder_number) : 1;
        const yourName = args.your_name ? String(args.your_name) : "[Your Name]";
        const toneGuide = reminderNumber === 1
            ? "Friendly and brief. Assume it was an oversight or got lost in their inbox. No accusation, no lecture. One mention of the payment details, one easy call to action (reply to confirm or pay the link). Tone: colleague-to-colleague."
            : reminderNumber === 2
                ? "Firm but professional. Acknowledge they may be busy, but make clear this is overdue and needs to be resolved this week. Ask for a specific response: either confirmation of payment date or a note if there's an issue. Tone: professional, not aggressive."
                : "Urgent and direct. This is the third reminder. State clearly that you need payment or a confirmed payment plan by a specific date (3 business days from now). Mention — without threatening — that you may need to pause further work or involve a collections process if unresolved. Tone: serious but not hostile.";
        return {
            content: [
                {
                    type: "text",
                    text: `Write invoice reminder #${reminderNumber} from ${yourName} to ${clientName}.

Invoice details:
- Reference: ${invoiceNumber}
- Amount: ${amount}
- Original due date: ${dueDate}

Tone guide for reminder #${reminderNumber}: ${toneGuide}

Structure:
1. Subject line: short and factual (e.g. "Reminder: ${invoiceNumber} — ${amount} overdue")
2. Email body:
   - Opening: one sentence, no filler opener
   - Payment details: invoice number, amount, original due date — all in one sentence or a short table
   - Call to action: one clear ask
   - Sign-off

Rules:
- Under 120 words (body only, not subject).
- No "I hope this finds you well." No "per my last email" (passive-aggressive). No "as per our agreement."
- Do not apologise for following up.
- The goal is to get paid, not to make a point.`,
                },
            ],
        };
    }
    if (name === "rate_increase_email") {
        const clientName = String(args.client_name);
        const currentRate = String(args.current_rate);
        const newRate = String(args.new_rate);
        const effectiveDate = String(args.effective_date);
        const yourName = args.your_name ? String(args.your_name) : "[Your Name]";
        const relationshipContext = args.relationship_context
            ? String(args.relationship_context)
            : null;
        const contextLine = relationshipContext
            ? `Relationship context: ${relationshipContext}`
            : "No specific relationship context provided — write for a professional ongoing client relationship.";
        return {
            content: [
                {
                    type: "text",
                    text: `Write a rate-increase email from ${yourName} to ${clientName}.

Details:
- Current rate: ${currentRate}
- New rate: ${newRate}
- Effective: ${effectiveDate}
- ${contextLine}

Structure:
1. One opening line that acknowledges the working relationship specifically (not generically). Reference the work, not just "working together."
2. State the rate change plainly: what it is, when it takes effect. One or two sentences. Do not over-explain or apologise.
3. One sentence confirming you'll honour the current rate for work in flight / until the effective date.
4. One sentence making it easy to discuss if they want to — a genuine offer, not a hedge.
5. Short sign-off.

Rules:
- Under 150 words.
- No subject line — just the email body.
- No "I wanted to reach out." No "I hope this finds you well." No "I've really valued our partnership."
- Do not justify the raise with inflation, market rates, or your costs — it comes across as defensive. The raise stands on its own.
- Do not apologise. Don't write "I'm sorry to" or "I hate to."
- Tone: warm but matter-of-fact. Like telling a friend, not filing a legal notice.
- The goal is to keep the client, not to brace for rejection.`,
                },
            ],
        };
    }
    if (name === "retainer_proposal") {
        const usage = getUsage();
        if (usage.draft_count >= FREE_DRAFT_LIMIT) {
            return {
                content: [
                    {
                        type: "text",
                        text: `You've used all ${FREE_DRAFT_LIMIT} free drafts this month.\n\nUpgrade to ProposalCraft Pro ($19/mo) for unlimited drafts: ${PRO_URL}`,
                    },
                ],
            };
        }
        incrementUsage(usage);
        const brief = String(args.brief);
        const monthlyScope = String(args.monthly_scope);
        const monthlyFee = args.monthly_fee ? String(args.monthly_fee) : null;
        const minimumTerm = args.minimum_term ? String(args.minimum_term) : null;
        const clientName = args.client_name ? String(args.client_name) : "the client";
        const yourName = args.your_name ? String(args.your_name) : "[Your Name / Company]";
        const feeLine = monthlyFee
            ? `Monthly investment: ${monthlyFee}`
            : "Monthly investment: [insert fee — leave a clear placeholder for the freelancer to fill in]";
        const termLine = minimumTerm
            ? `Minimum commitment: ${minimumTerm}, then rolling month-to-month`
            : "Term: rolling month-to-month with 30 days written notice to cancel";
        return {
            content: [
                {
                    type: "text",
                    text: `Draft a retainer proposal using the brief and scope below. A retainer proposal is different from a project proposal — it defines an ongoing relationship, not a one-off delivery.

Client: ${clientName}
Your name/company: ${yourName}
Monthly scope: ${monthlyScope}
${feeLine}
${termLine}

Structure the proposal as:

**[Opening — 2 sentences]**
Reference a specific problem the client has that benefits from ongoing support rather than a one-off project. Don't open with "I". No filler.

**What's included each month**
Bullet list of exactly what the retainer covers. Be specific — name the deliverables, hours, or service types. Add a line: "Additional work beyond this scope is quoted separately."

**What's not included**
3–5 bullet points of things explicitly excluded — scope creep protection. Match what's likely to be asked for based on the brief.

**How it works**
2–3 short paragraphs covering:
- How work is prioritised and requested each month (e.g. shared task board, weekly check-in)
- Rollover policy: unused capacity does/doesn't roll over (choose the simpler one and be explicit)
- Revision rounds included per deliverable, if relevant

**Investment**
${feeLine}
${termLine}
Payment terms: [e.g. invoiced on the 1st of each month, due within 7 days]

**Getting started**
One clear next step (e.g. "Reply to confirm, and I'll send the agreement and first invoice").

Rules:
- Conversational and direct — retainers are ongoing relationships, not formal contracts.
- The proposal should read as if written by someone who has done this before.
- No long sentences. No hedge words ("might", "could potentially").
- Under 400 words.

---

CLIENT BRIEF / NOTES:
${brief}`,
                },
            ],
        };
    }
    if (name === "testimonial_request") {
        const clientName = String(args.client_name);
        const projectSummary = String(args.project_summary);
        const specificWin = args.specific_win ? String(args.specific_win) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your Name]";
        const whereToPost = args.where_to_post ? String(args.where_to_post) : null;
        const winLine = specificWin
            ? `The project had a concrete win: ${specificWin}`
            : "No specific metric was provided — infer a plausible positive outcome from the project type, or reference the on-time / smooth delivery.";
        const postLine = whereToPost
            ? `The sender would like the testimonial posted on ${whereToPost}.`
            : "Keep the ask open — don't specify a platform; let the client choose what's easiest.";
        return {
            content: [
                {
                    type: "text",
                    text: `Write a short testimonial-request email. It should feel like a genuine message from one person to another — not a form, not a survey, not "if you have a moment."

Details:
- Client: ${clientName}
- Project: ${projectSummary}
- ${winLine}
- ${postLine}
- Sender: ${yourName}

Structure:
1. One opening line that references the specific project by name and acknowledges it went well (or a specific outcome). No filler.
2. Two sentences maximum explaining what you're asking for and why — a short paragraph or a few sentences they can share. Be honest: testimonials help you win new clients.
3. Tell them exactly what to do next (reply to this email, post on X, leave a Google review — whatever was specified). Make it a single, easy action.
4. Short sign-off.

Rules:
- Under 150 words total.
- No subject line — just the email body.
- No "I hope this finds you well." No "no pressure." No "if you have a moment."
- Do not offer to write it for them — that feels transactional. Let them write it in their own words.
- Friendly but direct. The best testimonial requests feel like a friend asking a favour.`,
                },
            ],
        };
    }
    if (name === "discovery_call_prep") {
        const brief = String(args.brief);
        const analysis = args.analysis ? `\n\nANALYSIS ALREADY RUN:\n${String(args.analysis)}` : "";
        const serviceContext = args.your_service
            ? `\nFreelancer's specialism: ${String(args.your_service)}`
            : "";
        return {
            content: [
                {
                    type: "text",
                    text: `Prepare a discovery call guide from the brief below. The freelancer is about to speak with this client before writing a proposal.${serviceContext}

Structure the output as:

**Discovery Call Prep**

**Call agenda (15–30 min)**
A short 3-4 bullet agenda the freelancer can follow. Include: quick intro, understanding the problem, budget and timeline, next steps.

**Must-confirm before proposing**
3 things that, if left unclear, would make a proposal impossible to price accurately. Each item: what it is + why it matters.

**Questions to ask**
Group into:
- *Budget & authority* — 2-3 questions to surface the real budget and who signs off
- *Timeline & urgency* — 2 questions to understand what's driving the deadline
- *Problem & success* — 3 questions to understand what "done well" looks like and what's failed before
- *Scope boundaries* — 2 questions to pre-empt scope creep
- *Competitor & status* — 1-2 questions to understand if they're talking to others and how far along they are

Keep questions open-ended. Do not include filler or preamble. No question should be answerable with yes/no alone.

**Tone notes**
1-2 sentences on how to calibrate your tone for THIS client based on the brief (formal/casual, technical/plain, confident/consultative).

**Red flags to probe**
Any signals from the brief that warrant a pointed follow-up during the call (vague scope, missing stakeholder, unrealistic timeline, etc.).

---

BRIEF:
${brief}${analysis}`,
                },
            ],
        };
    }
    if (name === "discount_request_response") {
        const clientName = String(args.client_name);
        const yourName = String(args.your_name);
        const originalPrice = String(args.original_price);
        const mode = args.response_mode ? String(args.response_mode) : "hold_rate";
        const theirBudget = args.their_budget ? String(args.their_budget) : null;
        const context = args.context ? String(args.context) : null;
        const contextNote = context ? ` (${context})` : "";
        let body;
        if (mode === "reduce_scope") {
            const budgetLine = theirBudget
                ? `If ${theirBudget} is the ceiling, here's what I can deliver within that:`
                : `If we need to bring the investment down, here's what I can deliver at a reduced scope:`;
            body = `Subject: Re: Proposal — adjusted scope option

Hi ${clientName},

Thanks for the honest feedback${contextNote}.

My rate stays the same — it reflects the time and quality the full project needs. But I don't want budget to be the reason we don't work together.

${budgetLine}

[List 2–3 deliverables you'd remove or reduce — be specific about what's OUT]

That brings the total to [reduced price]. Everything else stays the same: timeline, quality, and my involvement.

If that works, I can update the proposal and we can get started. Otherwise, the original scope is still on the table if the budget shifts.

${yourName}`;
        }
        else if (mode === "payment_terms") {
            const budgetLine = theirBudget
                ? `I hear you on the ${theirBudget} — cashflow is a real thing.`
                : `I understand cashflow can be a constraint.`;
            body = `Subject: Re: Proposal — payment structure

Hi ${clientName},

${budgetLine}${contextNote ? ` ${contextNote}.` : ""}

I'm not able to adjust the total — ${originalPrice} is what the project needs to be done properly. But I can split the payments to make it easier:

- 30% on project kick-off
- 40% at the midpoint milestone
- 30% on final delivery

Same scope, same quality, same timeline — just spread across the project rather than upfront.

Does that work for you?

${yourName}`;
        }
        else {
            // hold_rate (default)
            body = `Subject: Re: Proposal

Hi ${clientName},

Thanks for coming back to me${contextNote ? ` — ${contextNote}` : ""}.

I'm not able to move on the price. ${originalPrice} reflects the time this project actually takes to do well — I've scoped it carefully and there's no fat in it.

What I can tell you is that you get my full attention on this, work I stand behind, and someone who'll flag problems before they become expensive.

If the budget genuinely isn't there, I'd rather we have that conversation now than cut corners on either side. But if you want to move forward, I'm ready to start.

${yourName}`;
        }
        return {
            content: [{ type: "text", text: body }],
        };
    }
    if (name === "scope_clarification_email") {
        const clientName = String(args.client_name);
        const projectType = String(args.project_type);
        const missingInfo = String(args.missing_info);
        const yourName = String(args.your_name);
        const context = args.context ? String(args.context) : null;
        const contextLine = context
            ? `Thanks for reaching out about the ${projectType}. ${context}\n\nBefore I put a proposal together, I have a few questions that'll help me scope this accurately:`
            : `Thanks for reaching out about the ${projectType} — sounds like an interesting project.\n\nBefore I put together a proposal, a few questions that'll help me scope this accurately:`;
        const questions = missingInfo
            .split(/[,;]/)
            .map((q) => q.trim())
            .filter(Boolean)
            .slice(0, 4)
            .map((q, i) => `${i + 1}. ${q.charAt(0).toUpperCase() + q.slice(1)}?`)
            .join("\n");
        const email = `Subject: A couple of questions before I quote

Hi ${clientName},

${contextLine}

${questions}

Once I have those, I can turn around a detailed proposal within 24 hours.

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "linkedin_post") {
        const topic = String(args.topic);
        const keyInsight = String(args.key_insight);
        const yourRole = args.your_role ? String(args.your_role) : "freelancer";
        const includeCta = args.include_cta !== false;
        const tone = args.tone ? String(args.tone) : "conversational";
        let post;
        if (tone === "direct") {
            post = `${topic.charAt(0).toUpperCase() + topic.slice(1)}.

${keyInsight}

Most people don't talk about this. They should.

${yourRole.charAt(0).toUpperCase() + yourRole.slice(1)}s who get this right spend less time chasing clients and more time doing the work they're good at.`;
        }
        else if (tone === "professional") {
            post = `One thing I've learned as a ${yourRole}: ${topic.toLowerCase()}.

${keyInsight}

It's not the most obvious lesson, but once you see it, you can't unsee it. The projects that go smoothly rarely do so by accident — they're the ones where expectations, scope, and communication were right from the start.

Worth reflecting on as you plan your next engagement.`;
        }
        else {
            // conversational (default)
            post = `Something happened recently that I keep thinking about.

${topic.charAt(0).toUpperCase() + topic.slice(1)}.

Here's what it taught me: ${keyInsight.charAt(0).toLowerCase() + keyInsight.slice(1)}

As a ${yourRole}, you don't always get this stuff taught to you. You learn it by doing — sometimes by getting it wrong first.

If this resonates, I'd love to hear what's worked for you in the comments.`;
        }
        if (includeCta) {
            post += `\n\n---\nFollowing for more honest takes on the freelance/consulting life.`;
        }
        return {
            content: [{ type: "text", text: post }],
        };
    }
    if (name === "case_study_outline") {
        const projectType = String(args.project_type);
        const clientIndustry = String(args.client_industry);
        const problem = String(args.problem);
        const approach = String(args.approach);
        const results = String(args.results);
        const anonymise = args.anonymise === true;
        const clientName = args.client_name ? String(args.client_name) : null;
        const clientRef = anonymise || !clientName
            ? `a ${clientIndustry} company`
            : clientName;
        const heading = anonymise || !clientName
            ? `Case Study: ${projectType.charAt(0).toUpperCase() + projectType.slice(1)}`
            : `Case Study: ${clientName} — ${projectType}`;
        const outline = `${heading}

**Client**
${clientRef.charAt(0).toUpperCase() + clientRef.slice(1)} (${clientIndustry})

**Project**
${projectType}

---

**The Challenge**
${problem}

**The Approach**
${approach}

**The Results**
${results}

---

**What I'd do differently**
[Add one honest reflection here — what you learned or what you'd change next time. Clients and prospects respect candour; it signals you think rigorously about your craft.]

**Technologies / methods used**
[List tools, frameworks, or methodologies relevant to your audience]

**Testimonial**
[Paste the client quote here if you have one, or use the \`testimonial_request\` tool to request one]

---

*Ready to turn a brief like this into a winning proposal in under 60 seconds? Try ProposalCraft: [github.com/jabbawocky/proposalcraft](https://github.com/jabbawocky/proposalcraft)*`;
        return {
            content: [
                {
                    type: "text",
                    text: outline,
                },
            ],
        };
    }
    if (name === "late_delivery_apology") {
        const clientName = String(args.client_name);
        const deliverable = String(args.deliverable);
        const originalDeadline = String(args.original_deadline);
        const newDeadline = String(args.new_deadline);
        const reason = args.reason ? String(args.reason) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const reasonLine = reason
            ? `The delay is down to ${reason}.`
            : `I don't have a clean excuse — this one is on me.`;
        const email = `Subject: ${deliverable.charAt(0).toUpperCase() + deliverable.slice(1)} — revised delivery date

Hi ${clientName},

I need to be straight with you: ${deliverable} won't be ready by ${originalDeadline} as agreed.

${reasonLine}

Here's where things stand and what I'm committing to:

**New delivery date:** ${newDeadline}
**What you'll receive:** ${deliverable}, complete and ready for your review

I've cleared my schedule to focus on this. You'll have it by ${newDeadline} — if anything changes between now and then, I'll tell you immediately rather than letting it slide.

I'm sorry for the disruption to your timeline. If ${newDeadline} creates a problem on your end, tell me and we'll work out a solution.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: email,
                },
            ],
        };
    }
    if (name === "client_onboarding_checklist") {
        const projectType = String(args.project_type).toLowerCase();
        const clientName = String(args.client_name);
        const deliverables = args.deliverables ? String(args.deliverables) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        // Build access section based on project type
        let accessItems = [];
        if (/web|site|cms|wordpress|shopify|e.?commerce|squarespace/.test(projectType)) {
            accessItems = [
                "Hosting/server access (FTP, cPanel, or SSH credentials)",
                "CMS admin login (WordPress, Shopify, etc.) — please create a separate account rather than sharing your main one",
                "Domain registrar access (if DNS changes are needed)",
                "Google Analytics / Search Console — invite [your email] as editor",
            ];
        }
        else if (/app|mobile|ios|android|saas|software/.test(projectType)) {
            accessItems = [
                "GitHub/GitLab repo access — invite [your email] as collaborator",
                "Staging environment credentials",
                "API keys for any third-party services already in use",
                "App Store / Google Play developer account access (if publishing updates)",
            ];
        }
        else if (/brand|logo|identity|design/.test(projectType)) {
            accessItems = [
                "Current logo files (AI, EPS, SVG, or PNG at highest resolution)",
                "Any existing brand guidelines or style guides",
                "Fonts currently in use (names and/or files)",
                "Colour codes (HEX, CMYK, Pantone) if known",
            ];
        }
        else if (/copy|content|writ|blog|article/.test(projectType)) {
            accessItems = [
                "CMS/blog platform login to publish (or confirm delivery format: Google Doc / Word / Markdown)",
                "Any existing tone of voice or style guide documents",
                "Competitors you want to differentiate from",
            ];
        }
        else if (/seo|search|keyword/.test(projectType)) {
            accessItems = [
                "Google Analytics — invite [your email] as editor",
                "Google Search Console — invite [your email] as full user",
                "CMS login if on-page changes are in scope",
                "Existing keyword research or ranking reports (if any)",
            ];
        }
        else if (/video|film|product/.test(projectType)) {
            accessItems = [
                "Dropbox/Drive folder for raw assets and deliverable transfer",
                "Existing brand assets (logo files, lower-third specs, music preferences)",
                "Any footage or photos you want included",
            ];
        }
        else {
            accessItems = [
                "Login / access credentials for any platforms relevant to this project",
                "Access to existing files or previous work we'll be building on",
            ];
        }
        // Content / materials section
        const contentItems = [
            "Written content (text, copy, messaging) — or confirmation that copywriting is in scope",
            "Photography and images — high-res, or stock preferences and budget",
            "Any existing marketing materials (brochures, presentations, previous website screenshots)",
            "Competitor examples and/or inspiration references (3–5 links or files)",
        ];
        // Decisions needed before work starts
        const decisionItems = [
            "Confirm the primary goal: what does success look like at the end of this project?",
            "Who is the single point of contact for approvals? (One name helps avoid conflicting feedback)",
            "Review and revision process: how many rounds are included, and who signs off?",
            deliverables
                ? `Confirm final deliverable list: ${deliverables} — anything to add or remove?`
                : "Confirm the final deliverable list — anything to add or remove before we lock scope?",
        ];
        const deliverableList = deliverables
            ? `\n\nA note on scope: this checklist is based on the agreed deliverables (${deliverables}). If anything changes, we'll handle it via a change order before adjusting the work.`
            : "";
        const checklist = `Subject: ${projectType.charAt(0).toUpperCase() + projectType.slice(1)} — what I need to get started

Hi ${clientName},

Excited to kick this off. To hit the ground running without hold-ups, here's what I need from you before I start.${deliverableList}

---

**1. Access and logins**
${accessItems.map((item) => `☐ ${item}`).join("\n")}

**2. Content and materials**
${contentItems.map((item) => `☐ ${item}`).join("\n")}

**3. Decisions to confirm before I start**
${decisionItems.map((item) => `☐ ${item}`).join("\n")}

---

The fastest way to send files is [Google Drive / Dropbox — whichever you prefer]. For logins, please use a password manager share rather than emailing passwords in plain text.

Once I have everything above, I'll confirm receipt and give you a firm start date.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: checklist,
                },
            ],
        };
    }
    if (name === "upsell_email") {
        const clientName = String(args.client_name);
        const completedProject = String(args.completed_project);
        const upsellService = String(args.upsell_service);
        const valueHook = args.value_hook ? String(args.value_hook) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const hookLine = valueHook
            ? `Now that ${completedProject} is live, ${valueHook} — which got me thinking about something that could build on that.`
            : `Now that ${completedProject} is wrapped up, I've been thinking about what would move the needle most for you next.`;
        const email = `Subject: What's next after ${completedProject}

Hi ${clientName},

${hookLine}

I wanted to float the idea of ${upsellService}. Here's why it makes sense right now:

You already have the foundation in place from ${completedProject}. The context switching cost of onboarding someone new — briefing them, getting them up to speed, starting from scratch — doesn't apply here. I know your business, your voice, and how you like to work.

The other reason now is the right time: the momentum from ${completedProject} is still fresh. Clients who build on a project quickly tend to see compounding results rather than starting from a cold stop.

I'm not suggesting a massive commitment — happy to start with a trial month or a defined scope to see if it's a fit.

Worth a quick call to discuss? No obligation — just an idea worth 15 minutes if it's the right time.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: email,
                },
            ],
        };
    }
    if (name === "project_pause_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const pausedBy = args.paused_by ? String(args.paused_by) : "client";
        const reason = String(args.reason);
        const completedWork = String(args.completed_work);
        const outstandingItems = String(args.outstanding_items);
        const resumptionTrigger = args.resumption_trigger
            ? String(args.resumption_trigger)
            : "when you'\''re ready to restart — just reach out and I'\''ll pick this back up";
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        let openingLine;
        let ownershipLine;
        if (pausedBy === "me") {
            openingLine = `I need to let you know that I'\''m putting ${projectName} on hold temporarily.`;
            ownershipLine = `This is on my end — ${reason}. I don'\''t want this to disrupt your timeline more than necessary, so I wanted to be straight with you now rather than slow-walking delivery.`;
        }
        else if (pausedBy === "mutual") {
            openingLine = `As we discussed, ${projectName} is going on hold for now.`;
            ownershipLine = `Reason: ${reason}. This makes sense given where things stand — I'\''m glad we'\''re aligned on pausing rather than pushing forward in a direction that isn'\''t ready.`;
        }
        else {
            openingLine = `Understood — I'\''m pausing work on ${projectName} as requested.`;
            ownershipLine = `For context: ${reason}. No problem — projects evolve and timelines shift.`;
        }
        const email = `Subject: ${projectName.charAt(0).toUpperCase() + projectName.slice(1)} — paused

Hi ${clientName},

${openingLine}

${ownershipLine}

Here'\''s where things stand so we have a clear record:

**Completed:**
${completedWork}

**Outstanding (to be picked up on restart):**
${outstandingItems}

**To restart:** ${resumptionTrigger}.

All files and work completed to date are preserved and ready to hand over whenever we pick this back up. If you need anything in the meantime — access to files, a handover to someone else, or a final invoice for work completed — just say the word.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: email,
                },
            ],
        };
    }
    if (name === "partnership_outreach") {
        const recipientName = String(args.recipient_name);
        const recipientService = String(args.recipient_service);
        const yourService = String(args.your_service);
        const sharedClientType = String(args.shared_client_type);
        const connectionHook = args.connection_hook ? String(args.connection_hook) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const hookLine = connectionHook
            ? `${connectionHook} — that's what prompted me to reach out.`
            : `I work with ${sharedClientType} on the ${yourService} side, and I've been keeping an eye out for a solid ${recipientService} person to refer clients to.`;
        const email = `Subject: ${yourService} + ${recipientService} — worth a quick chat?

Hi ${recipientName},

${hookLine}

I do ${yourService} for ${sharedClientType}. Almost every project I take on eventually needs ${recipientService} — and when clients ask for a recommendation, I'd rather send them to someone I actually know and trust.

I imagine you run into the same thing in reverse.

Not pitching anything — just think there could be a natural fit to refer work each other's way when it makes sense. Happy to jump on a 15-minute call if you'd like to compare notes on who we work with.

Worth a quick chat?

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: email,
                },
            ],
        };
    }
    if (name === "subcontractor_brief") {
        const subName = String(args.sub_name);
        const theirRole = String(args.their_role);
        const projectContext = String(args.project_context);
        const theirScope = String(args.their_scope)
            .split(/[,;]/)
            .map((s) => s.trim())
            .filter(Boolean)
            .map((s) => `• ${s.charAt(0).toUpperCase() + s.slice(1)}`)
            .join("\n");
        const outOfScope = args.out_of_scope
            ? String(args.out_of_scope)
                .split(/[,;]/)
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => `• ${s.charAt(0).toUpperCase() + s.slice(1)}`)
                .join("\n")
            : null;
        const deliverableFormat = String(args.deliverable_format);
        const deadline = String(args.deadline);
        const rate = String(args.rate);
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const outOfScopeSection = outOfScope
            ? `\n**Not in your scope (please don't include):**\n${outOfScope}\n`
            : "";
        const brief = `**Subcontractor Brief — ${theirRole}**
Prepared for: ${subName}

---

**Project context**
${projectContext}. You are being brought in for the ${theirRole} component only — I am handling the client relationship and overall project management.

**Your scope**
${theirScope}
${outOfScopeSection}
**Deliverable format**
${deliverableFormat}

**Deadline**
${deadline}. If you hit a blocker or think this timeline is at risk, tell me immediately — don't absorb the delay silently.

**Rate and payment**
${rate}. Invoice to me directly after delivery. Payment within 5 business days of my accepting the work.

**IP and ownership**
All work you produce under this brief is work-for-hire and becomes my property on payment. You may list this project in your portfolio after the client has publicly launched, unless I ask you not to.

**Confidentiality**
The client details and project specifics shared in this brief are confidential. Please don't discuss this project with third parties or use client materials for anything outside this brief.

**Questions and communication**
Come to me with questions — do not contact the end client directly unless I specifically ask you to. If anything is unclear, ask before starting rather than making assumptions.

Ready to go? Confirm you've read this and agree to the terms, and I'll send over access and assets.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: brief,
                },
            ],
        };
    }
    if (name === "reactivation_email") {
        const prospectName = String(args.prospect_name);
        const context = String(args.context);
        const timeElapsed = String(args.time_elapsed);
        const valueAdd = args.value_add ? String(args.value_add) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const valueAddLine = valueAdd
            ? `\n\nOne thing worth mentioning since we last spoke: ${valueAdd}.`
            : "";
        const email = `Subject: Still relevant? — ${context}

Hi ${prospectName},

It's been ${timeElapsed} since we talked about ${context}. I wanted to check in — not to push, just to see if the timing is different now.${valueAddLine}

If it's still on the radar, happy to pick up where we left off. If the plans changed, no worries at all — just say the word and I'll stop following up.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: email,
                },
            ],
        };
    }
    if (name === "conference_talk_pitch") {
        const talkTitle = String(args.talk_title);
        const audience = String(args.audience);
        const problemSolved = String(args.problem_solved);
        const keyTakeaways = String(args.key_takeaways)
            .split(/[,;]/)
            .map((t) => t.trim())
            .filter(Boolean)
            .map((t, i) => `${i + 1}. ${t.charAt(0).toUpperCase() + t.slice(1)}`)
            .join("\n");
        const yourExpertise = String(args.your_expertise);
        const talkFormat = args.talk_format ? String(args.talk_format) : "30-minute talk";
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const pitch = `**Speaker Submission — ${talkTitle}**

---

**Talk title**
${talkTitle}

**Format**
${talkFormat}

**Abstract** *(~150 words)*
${audience.charAt(0).toUpperCase() + audience.slice(1)} face a specific problem: ${problemSolved}. Most people in this situation rely on guesswork, generic advice, or templates that were never built for the way they actually work.

This talk cuts through that. Drawing on ${yourExpertise}, I'll walk through a practical, field-tested framework that you can apply immediately — not theory, but the exact approach I've used and refined across real client engagements.

By the end of the session, the audience will have a clear, actionable playbook — not just inspiration.

**What attendees will take away**
${keyTakeaways}

**Why this talk, why this speaker**
${yourExpertise}. I've lived the problem this talk addresses and built a working solution — the material comes from practice, not research. The audience will leave with things they can use the same week.

**Speaker bio** *(short version)*
${yourName} is a ${yourExpertise.split(",")[0].trim()}. ${yourExpertise}. [Website / portfolio URL]

---

*Happy to provide a longer abstract, speaker headshot, or video sample on request.*`;
        return {
            content: [
                {
                    type: "text",
                    text: pitch,
                },
            ],
        };
    }
    if (name === "client_offboarding_email") {
        const clientName = String(args.client_name);
        const engagementDescription = String(args.engagement_description);
        const finalDate = String(args.final_date);
        const outstandingWork = String(args.outstanding_work);
        const reason = args.reason ? String(args.reason) : null;
        const offerReferral = args.offer_referral === true;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const reasonLine = reason
            ? `The reason: ${reason}.`
            : `I don't have a single clean reason to give you — it's the right move for where my practice is heading.`;
        const referralLine = offerReferral
            ? `\n\nIf it would be useful, I'm happy to recommend someone who I think would be a good fit for what you need going forward. Just say the word.`
            : "";
        const email = `Subject: A change to our arrangement

Hi ${clientName},

I'm writing to let you know that I'll be ending ${engagementDescription}, with ${finalDate} as my final date.

${reasonLine}

This isn't a reflection of the work or the relationship — I've valued working with you and I mean that. I wanted to give you clear notice so you have time to make alternative arrangements without being caught short.

Between now and ${finalDate}, I'll complete: ${outstandingWork}. Everything will be properly handed over so there are no loose ends.${referralLine}

Thank you for the time we've worked together. I hope our paths cross again.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: email,
                },
            ],
        };
    }
    if (name === "annual_review_email") {
        const clientName = String(args.client_name);
        const engagementDuration = String(args.engagement_duration);
        const highlight = String(args.highlight);
        const nextSuggestion = String(args.next_suggestion);
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const deliverableList = String(args.key_deliverables)
            .split(/[,;]/)
            .map((d) => d.trim())
            .filter(Boolean)
            .map((d) => `• ${d.charAt(0).toUpperCase() + d.slice(1)}`)
            .join("\n");
        const email = `Subject: A look back at ${engagementDuration} — and what's next

Hi ${clientName},

With ${engagementDuration} of working together now behind us, I wanted to take a moment to reflect on what we've built — and look ahead at what comes next.

**What we delivered**
${deliverableList}

**The standout moment**
${highlight}. That's the result I'm most proud of from this period — it's a good example of what consistent, focused work compounds into over time.

**A word on the working relationship**
I genuinely enjoy working with you. You give clear direction, trust the process, and act on the work — which makes a real difference to what we can achieve together. I don't take that for granted.

**Looking ahead**
My suggestion for the next period: ${nextSuggestion}. I think there's real momentum to build on, and I'd rather map this out proactively than wait for a renewal conversation to happen by accident.

Worth a quick call to talk through what next year looks like?

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: email,
                },
            ],
        };
    }
    if (name === "feedback_request_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const specificAspect = args.specific_aspect ? String(args.specific_aspect) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const specificLine = specificAspect
            ? `One thing I'm especially curious about: ${specificAspect}. But anything is useful — there are no wrong answers.`
            : "There are no wrong answers — even a sentence or two is genuinely useful.";
        const email = `Subject: A quick ask — how did we do?

Hi ${clientName},

Now that ${projectName} is wrapped up, I wanted to ask for something I find more useful than a testimonial: honest private feedback.

Not for my website — just for me. I'm trying to understand what worked, what felt clunky, and where I could have made the experience better for you.

${specificLine}

A few sentences by reply is all I need. Completely private — I won't quote you anywhere without asking separately.

Thanks for taking the time. It genuinely helps.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: email,
                },
            ],
        };
    }
    if (name === "out_of_office_email") {
        const clientName = String(args.client_name);
        const startDate = String(args.start_date);
        const endDate = String(args.end_date);
        const returnDate = String(args.return_date);
        const projectStatus = args.project_status ? String(args.project_status) : null;
        const urgentContact = args.urgent_contact ? String(args.urgent_contact) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const projectLine = projectStatus
            ? `\n\n${projectStatus}.`
            : "";
        const urgentLine = urgentContact
            ? `\n\nIf something genuinely can't wait: ${urgentContact}.`
            : "";
        const email = `Subject: Out of office ${startDate}–${endDate}

Hi ${clientName},

Just a heads-up: I'm out of the office from ${startDate} to ${endDate} and back on ${returnDate}.${projectLine}

I won't be checking messages during this time, so anything you send will get a reply from ${returnDate} onwards.${urgentLine}

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "project_delay_warning") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const originalDeadline = String(args.original_deadline);
        const expectedDelay = String(args.expected_delay);
        const reason = args.reason ? String(args.reason) : null;
        const newDeliveryDate = args.new_delivery_date ? String(args.new_delivery_date) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const reasonLine = reason
            ? ` The reason is ${reason}.`
            : "";
        const newDateLine = newDeliveryDate
            ? `\n\nI'm committing to ${newDeliveryDate} as the new delivery date.`
            : `\n\nI'll confirm a revised date by end of day today.`;
        const email = `Subject: Heads-up on ${projectName} timing

Hi ${clientName},

I wanted to flag something now rather than wait until ${originalDeadline}: I'm running ${expectedDelay} behind on ${projectName} and that deadline is at risk.${reasonLine}${newDateLine}

I wanted you to know as early as possible so you have time to adjust anything on your end if needed.

Sorry for the disruption — I'll keep you updated and make sure the quality is where it needs to be.

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "recommendation_request_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const standoutResult = args.standout_result ? String(args.standout_result) : null;
        const focusSuggestion = args.focus_suggestion ? String(args.focus_suggestion) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const resultLine = standoutResult
            ? `\n\nIn case it's a useful memory prompt: ${standoutResult}.`
            : "";
        const focusLine = focusSuggestion
            ? `\n\nIf it helps to have a steer: the thing I'd love you to speak to, if it resonates, is ${focusSuggestion}. But write what's true for you — that's what makes a recommendation worth reading.`
            : "";
        const email = `Subject: A small ask — LinkedIn recommendation

Hi ${clientName},

I hope ${projectName} is still paying off on your end.

I have a small favour to ask: would you be willing to write me a LinkedIn recommendation? It doesn't need to be long — two or three sentences from someone whose work I've actually done goes a long way.${resultLine}${focusLine}

You can do it here: https://www.linkedin.com/in/[your-linkedin-handle]/

Completely fine if it's not something you're up for — no pressure either way, and it doesn't change anything about how much I enjoyed the project.

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "client_check_in_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const currentStage = String(args.current_stage);
        const nextMilestone = String(args.next_milestone);
        const onTrack = args.on_track !== false;
        const blocker = args.blocker ? String(args.blocker) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        let email;
        if (!onTrack && blocker) {
            email = `Subject: ${projectName} — quick update

Hi ${clientName},

Quick update on ${projectName}: ${currentStage}.

I wanted to flag something before it becomes an issue: ${blocker}. I don't want this to catch you off guard — can we find 15 minutes to sort it out?

${yourName}`;
        }
        else {
            email = `Subject: ${projectName} — quick update

Hi ${clientName},

Just a quick note to let you know ${projectName} is going well — ${currentStage} and on track.

Next thing you'll hear from me: ${nextMilestone}. Nothing needed from you in the meantime.

${yourName}`;
        }
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "project_restart_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const restartReason = args.restart_reason ? String(args.restart_reason) : null;
        const firstAction = String(args.first_action);
        const timelineNote = args.timeline_note ? String(args.timeline_note) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const reasonClause = restartReason
            ? ` — ${restartReason}`
            : "";
        const timelineLine = timelineNote
            ? `\n\nOn timing: ${timelineNote}.`
            : "";
        const email = `Subject: ${projectName} — picking back up

Hi ${clientName},

Good news: we're good to go on ${projectName}${reasonClause}.

To get things moving again, I'll ${firstAction}.${timelineLine}

If anything has changed on your end since we paused — priorities, requirements, key contacts — flag it now and I'll factor it in before diving back in.

Looking forward to getting this across the line.

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "working_hours_email") {
        const clientName = String(args.client_name);
        const yourHours = String(args.your_hours);
        const responseTime = args.response_time ? String(args.response_time) : "within one business day";
        const urgentPath = args.urgent_path ? String(args.urgent_path) : null;
        const trigger = args.trigger ? String(args.trigger) : "proactive";
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const urgentLine = urgentPath
            ? `\n\nIf something genuinely can't wait, ${urgentPath} and I'll respond as quickly as I can.`
            : "";
        let opening;
        let framing;
        if (trigger === "after_late_message") {
            opening = `Thanks for your message. I'll pick it up properly during my working hours — ${yourHours} — and reply ${responseTime}.`;
            framing = `I work fixed hours so I can give your project proper focused attention rather than fragmented responses. You'll always hear back ${responseTime} during the working week.`;
        }
        else if (trigger === "mid_project_reset") {
            opening = `I wanted to take a moment to clarify how I work, since I think it'll make the rest of the project smoother for both of us.`;
            framing = `My working hours are ${yourHours}. I respond to messages ${responseTime} within those hours. Outside of that, I'm offline — it means the time I spend on your project is focused and undivided.`;
        }
        else {
            opening = `Before we get started, a quick note on how I work.`;
            framing = `My working hours are ${yourHours}, and I reply to messages ${responseTime}. Keeping consistent hours means the time I spend on your project is focused — you get my full attention, not a fragmented response between other things.`;
        }
        const email = `Subject: How I work — a quick note

Hi ${clientName},

${opening}

${framing}${urgentLine}

If you ever have questions or updates outside those hours, send them over — I'll pick them up at the start of the next working day.

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "scope_warning_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const originalScope = String(args.original_scope);
        const newRequest = String(args.new_request);
        const estimatedImpact = args.estimated_impact ? String(args.estimated_impact) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const impactLine = estimatedImpact
            ? `\n\nIf you'd like to include this, I can put together a formal change order. Based on what you've described, the additional work would likely run to ${estimatedImpact} — though I'd want to confirm the full spec before committing to a number.`
            : `\n\nIf you'd like to include this, I can scope it out and send a change order before we proceed.`;
        const email = `Subject: Quick check — ${projectName} scope

Hi ${clientName},

I wanted to flag something before we go any further.

The original brief for ${projectName} covered ${originalScope}. What you're describing now — ${newRequest} — goes beyond that, and I want to make sure we're on the same page before I build it into the plan.${impactLine}

Equally, if I've misread what you're asking for and it falls within the original brief, just let me know and I'll carry on.

Either way, no problem — I just didn't want to find out at the end that we had different assumptions about what was included.

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "deposit_request_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const depositAmount = String(args.deposit_amount);
        const totalAmount = args.total_amount ? String(args.total_amount) : null;
        const paymentLink = args.payment_link ? String(args.payment_link) : null;
        const paymentMethod = args.payment_method ? String(args.payment_method) : null;
        const dueDate = args.due_date ? String(args.due_date) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const totalLine = totalAmount
            ? ` (${depositAmount} of the ${totalAmount} total)`
            : ` (${depositAmount})`;
        const dueLine = dueDate
            ? ` by ${dueDate}`
            : "";
        let paymentSection;
        if (paymentLink) {
            paymentSection = `You can pay via the link below — it takes about two minutes:\n\n${paymentLink}\n\nOnce that's through, I'll send a confirmation and we'll be good to go.`;
        }
        else if (paymentMethod) {
            paymentSection = `Payment is by ${paymentMethod}${dueLine}. I'll send a formal invoice shortly with the details.`;
        }
        else {
            paymentSection = `I'll send over a formal invoice${dueLine} with payment details.`;
        }
        const email = `Subject: ${projectName} — deposit to kick off

Hi ${clientName},

Great to have everything confirmed. To get started, I'll need the deposit${totalLine}${dueDate && !paymentLink ? "" : dueLine ? ` ${dueLine}` : ""}.

${paymentSection}

Work begins as soon as the deposit is received — I have ${projectName} blocked in my schedule and I'm ready to go.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: email,
                },
            ],
        };
    }
    if (name === "client_waiting_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const whatYouNeed = String(args.what_you_need);
        const daysWaiting = args.days_waiting ? Number(args.days_waiting) : null;
        const originalDeadline = args.original_deadline ? String(args.original_deadline) : null;
        const impact = args.impact ? String(args.impact) : null;
        const newDeadline = args.new_deadline ? String(args.new_deadline) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        let waitingLine;
        if (daysWaiting && originalDeadline) {
            waitingLine = `I'm still waiting on ${whatYouNeed}, which was due ${originalDeadline} — that's ${daysWaiting} day${daysWaiting === 1 ? "" : "s"} ago now.`;
        }
        else if (originalDeadline) {
            waitingLine = `I'm still waiting on ${whatYouNeed} — you mentioned ${originalDeadline} as the delivery date and I haven't received it yet.`;
        }
        else if (daysWaiting) {
            waitingLine = `I'm still waiting on ${whatYouNeed}. It's been ${daysWaiting} day${daysWaiting === 1 ? "" : "s"} since I last flagged this.`;
        }
        else {
            waitingLine = `I'm still waiting on ${whatYouNeed} and wanted to follow up before it causes any knock-on issues.`;
        }
        const impactLine = impact
            ? `\n\nWithout it, I can't move forward with ${impact} — so the sooner I have it, the better.`
            : "\n\nI can't move to the next stage until I have it, so I wanted to flag it before it affects the schedule.";
        const deadlineLine = newDeadline
            ? `\n\nIf you can get it to me by ${newDeadline}, I can keep everything on track. If that's not going to work, let me know and we can talk through the options.`
            : "\n\nIf there's a hold-up on your end, just let me know — I'd rather know now than find out when it affects the timeline.";
        const email = `Subject: ${projectName} — waiting on you

Hi ${clientName},

${waitingLine}${impactLine}${deadlineLine}

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "scope_change_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const scopeChange = String(args.scope_change);
        const originalScope = args.original_scope ? String(args.original_scope) : null;
        const timeImpact = args.time_impact ? String(args.time_impact) : null;
        const costImpact = args.cost_impact ? String(args.cost_impact) : null;
        const proposedOptions = args.proposed_options ? String(args.proposed_options) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const contextLine = originalScope
            ? `The original scope was ${originalScope}. Since then, the project has grown to include ${scopeChange}.`
            : `When we kicked off the project, the scope didn't include ${scopeChange} — but that's where things are heading.`;
        const impactLines = [];
        if (timeImpact)
            impactLines.push(`Time: ${timeImpact} of additional work`);
        if (costImpact)
            impactLines.push(`Cost: ${costImpact}`);
        const impactBlock = impactLines.length > 0
            ? `\n\nHere's what that means in practice:\n${impactLines.map((l) => `  • ${l}`).join("\n")}`
            : "\n\nThis adds meaningful time and effort outside what the original agreement covers.";
        const optionsBlock = proposedOptions
            ? `\n\nTo keep things moving, here are the options as I see them:\n  • ${proposedOptions}`
            : `\n\nTo keep things moving, here are the options as I see them:\n  • I put together a change order for the additional work — happy to send it over.\n  • We scale the project back to the original scope and pick up the extras as a separate engagement.`;
        const email = `Subject: ${projectName} — scope change

Hi ${clientName},

I wanted to flag something before we get too deep into it. ${contextLine}${impactBlock}

I'm not raising this to be difficult — I just want us to be on the same page so there are no surprises at the end.${optionsBlock}

Either way works for me. Let me know what you'd prefer and we can sort it quickly.

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "late_payment_reminder") {
        const clientName = String(args.client_name);
        const invoiceNumber = args.invoice_number ? String(args.invoice_number) : null;
        const amount = args.amount ? String(args.amount) : null;
        const dueDate = args.due_date ? String(args.due_date) : null;
        const daysOverdue = args.days_overdue ? Number(args.days_overdue) : null;
        const paymentLink = args.payment_link ? String(args.payment_link) : null;
        const isSecondReminder = args.is_second_reminder === true;
        const yourName = args.your_name ? String(args.your_name) : "Your name";
        const invoiceRef = invoiceNumber ? ` (${invoiceNumber})` : "";
        const amountRef = amount ? ` for ${amount}` : "";
        const dueDateRef = dueDate ? `, which was due on ${dueDate}` : "";
        const overdueRef = daysOverdue ? ` — now ${daysOverdue} days overdue` : "";
        const subjectInvoice = invoiceNumber ? `Invoice ${invoiceNumber}` : "Outstanding invoice";
        const subjectSuffix = isSecondReminder ? " — second notice" : amount ? ` — ${amount} overdue` : " overdue";
        const paymentLine = paymentLink
            ? `\nYou can pay online here: ${paymentLink}`
            : "\nPlease transfer payment at your earliest convenience using the details on the invoice.";
        const firmingLine = isSecondReminder
            ? `\n\nIf this isn't resolved in the next few days I'll need to apply the late fee outlined in our agreement and pause any ongoing work until the balance is cleared.`
            : "";
        const exitLine = isSecondReminder
            ? "\nIf there's a problem with the invoice or you're experiencing a delay, please reply and let me know — I'm happy to discuss it."
            : "\nIf there's been an oversight or you're experiencing a delay, just let me know.";
        const email = `Subject: ${subjectInvoice}${subjectSuffix}

Hi ${clientName},

Just a reminder that invoice${invoiceRef}${amountRef}${dueDateRef} is still outstanding${overdueRef}.${paymentLine}${firmingLine}

${exitLine}

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "invoice_dispute_response_email") {
        const clientName = String(args.client_name);
        const disputedItem = String(args.disputed_item);
        const projectName = args.project_name ? String(args.project_name) : null;
        const responseMode = args.response_mode ? String(args.response_mode) : "explain";
        const explanation = args.explanation ? String(args.explanation) : null;
        const adjustment = args.adjustment ? String(args.adjustment) : null;
        const invoiceNumber = args.invoice_number ? String(args.invoice_number) : null;
        const yourName = args.your_name ? String(args.your_name) : "Your Name";
        const projectRef = projectName ? ` for ${projectName}` : "";
        const invoiceRef = invoiceNumber ? ` (${invoiceNumber})` : "";
        const subjectRef = invoiceNumber ? `Invoice${invoiceRef} query` : `Invoice query${projectRef}`;
        let body;
        if (responseMode === "adjust") {
            const adjustDetail = adjustment
                ? adjustment
                : "adjust the invoice and send you a revised version";
            body = `Thanks for flagging this${projectRef}. I've reviewed the invoice${invoiceRef} and I'm happy to ${adjustDetail}.

I'll send through the updated invoice shortly. Let me know if there's anything else you'd like to clarify.`;
        }
        else if (responseMode === "clarify") {
            body = `Thanks for getting in touch about the invoice${invoiceRef}${projectRef}. I want to make sure I respond properly to your query about ${disputedItem}.

Could you share a bit more detail about what you were expecting? Once I have that, I can give you a clear answer or send through a revised invoice if needed.`;
        }
        else {
            const explainDetail = explanation
                ? explanation
                : `this reflects the work delivered as agreed in our original scope`;
            body = `Thanks for reaching out about the invoice${invoiceRef}${projectRef}. Happy to clarify the charge for ${disputedItem}.

${explainDetail.charAt(0).toUpperCase() + explainDetail.slice(1)}.

I hope that helps explain it. If you'd like to talk it through, I'm happy to jump on a quick call — just let me know.`;
        }
        const email = `Subject: Re: ${subjectRef}

Hi ${clientName},

${body}

Best,
${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "client_feedback_response_email") {
        const clientName = String(args.client_name);
        const feedbackSummary = String(args.feedback_summary);
        const projectName = args.project_name ? String(args.project_name) : null;
        const responseMode = args.response_mode ? String(args.response_mode) : "accept";
        const actionPlan = args.action_plan ? String(args.action_plan) : null;
        const clarificationQuestion = args.clarification_question ? String(args.clarification_question) : null;
        const yourName = args.your_name ? String(args.your_name) : "Your Name";
        const projectRef = projectName ? ` on ${projectName}` : "";
        let body;
        if (responseMode === "clarify") {
            const question = clarificationQuestion
                ? clarificationQuestion
                : "could you help me understand which specific aspect isn't landing as expected?";
            body = `Thanks for flagging this${projectRef} — I'd rather hear it now than later, so I appreciate you saying something.

Before I dive in and make changes, I want to make sure I'm addressing the right thing: ${question}

Once I understand that, I can give you a concrete plan for where we go from here.`;
        }
        else if (responseMode === "discuss") {
            body = `Thanks for being direct about this${projectRef} — that's exactly the kind of feedback I need to hear early.

I think this warrants a proper conversation rather than a back-and-forth over email. Could we find 20–30 minutes this week to talk through it? I want to make sure I fully understand what you're looking for so I can get this right.

Happy to work around your schedule — just let me know what works.`;
        }
        else {
            const plan = actionPlan
                ? `\n\nHere's what I'll do: ${actionPlan}.`
                : `\n\nLet me take another look with fresh eyes and come back to you with a revised approach.`;
            body = `Thanks for telling me — I'd much rather hear this now than at the end.

I hear you: ${feedbackSummary}. That's useful, and I take it seriously.${plan}

I'll be in touch shortly. If anything else comes to mind in the meantime, please send it through.`;
        }
        const email = `Subject: Re: ${projectName ?? "Your feedback"}

Hi ${clientName},

${body}

Best,
${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "price_increase_email") {
        const clientName = String(args.client_name);
        const newRate = String(args.new_rate);
        const currentRate = args.current_rate ? String(args.current_rate) : null;
        const effectiveDate = args.effective_date ? String(args.effective_date) : null;
        const projectName = args.project_name ? String(args.project_name) : null;
        const valueHighlight = args.value_highlight ? String(args.value_highlight) : null;
        const yourName = args.your_name ? String(args.your_name) : "Your Name";
        const projectRef = projectName ? ` on ${projectName}` : "";
        const rateChange = currentRate
            ? `from ${currentRate} to ${newRate}`
            : `to ${newRate}`;
        const effectiveLine = effectiveDate
            ? `This will take effect from ${effectiveDate}.`
            : `This will apply to new work going forward.`;
        const valueLine = valueHighlight
            ? `\n\nI'm really proud of what we've built together${projectRef} — ${valueHighlight} — and I'm committed to continuing to deliver that level of work.`
            : `\n\nI've genuinely valued working with you${projectRef}, and I'm committed to continuing to deliver work you're proud of.`;
        const email = `Subject: Upcoming rate change${projectRef}

Hi ${clientName},

I wanted to give you advance notice that I'm updating my rates${projectRef}. From ${effectiveDate ?? "the new year"}, my rate will be moving ${rateChange}. ${effectiveLine}${valueLine}

I wanted to let you know well in advance so you can plan ahead. Happy to jump on a call if you'd like to talk through what this means for our work together.

Best,
${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "discovery_call_follow_up_email") {
        const clientName = String(args.client_name);
        const projectName = args.project_name ? String(args.project_name) : null;
        const whatDiscussed = String(args.what_discussed);
        const confirmedNextStep = args.confirmed_next_step ? String(args.confirmed_next_step) : null;
        const yourName = args.your_name ? String(args.your_name) : "Your Name";
        const projectRef = projectName ? ` about ${projectName}` : "";
        const points = whatDiscussed
            .split(/,\s*/)
            .filter((p) => p.trim())
            .map((p) => `- ${p.trim().charAt(0).toUpperCase() + p.trim().slice(1)}`)
            .join("\n");
        const nextStepLine = confirmedNextStep
            ? `\n\nNext step: ${confirmedNextStep}.`
            : `\n\nI'll follow up shortly with next steps — but let me know in the meantime if there's anything you'd like to add or clarify.`;
        const email = `Subject: Great speaking with you${projectRef}

Hi ${clientName},

Thanks for taking the time to chat today. Here's a quick summary of what we covered:

${points}${nextStepLine}

Let me know if I've missed anything or if anything's changed since we spoke.

Best,
${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "testimonial_follow_up_email") {
        const clientName = String(args.client_name);
        const projectName = args.project_name ? String(args.project_name) : null;
        const offerDraft = args.offer_draft !== false;
        const yourName = args.your_name ? String(args.your_name) : "Your Name";
        const projectRef = projectName ? ` on ${projectName}` : "";
        const draftLine = offerDraft
            ? ` If it's easier, I'm happy to write a short draft for you to edit or approve — just say the word.`
            : ``;
        const email = `Subject: Re: Testimonial request${projectRef}

Hi ${clientName},

Just a quick follow-up on the testimonial I mentioned${projectRef}. I know it's easy for these things to slip down the list.${draftLine}

No pressure at all — but if you're up for it, it would mean a lot.

Best,
${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "third_party_delay_email") {
        const clientName = String(args.client_name);
        const projectName = args.project_name ? String(args.project_name) : null;
        const whatIsDelayed = String(args.what_is_delayed);
        const externalCause = String(args.external_cause);
        const mitigation = args.mitigation ? String(args.mitigation) : null;
        const revisedEta = args.revised_eta ? String(args.revised_eta) : null;
        const yourName = args.your_name ? String(args.your_name) : "Your Name";
        const projectRef = projectName ? ` on ${projectName}` : "";
        const mitigationLine = mitigation
            ? `\n\nIn the meantime, ${mitigation}.`
            : `\n\nI'm actively working to resolve this as quickly as possible.`;
        const etaLine = revisedEta
            ? `\n\nBased on what I know now, I'm expecting to have ${whatIsDelayed} to you by ${revisedEta}. I'll confirm as soon as that's locked in.`
            : `\n\nI don't have a firm revised date yet — I'll update you as soon as I do, and I won't leave you guessing.`;
        const email = `Subject: Update on ${whatIsDelayed}${projectRef}

Hi ${clientName},

I want to keep you in the loop on a delay that's come up${projectRef}.

${whatIsDelayed.charAt(0).toUpperCase() + whatIsDelayed.slice(1)} is being held up by ${externalCause}. This is outside my direct control, but it's my job to flag it to you as soon as I'm aware of it.${mitigationLine}${etaLine}

Sorry for the disruption — I'll keep you updated.

Best,
${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "project_extension_email") {
        const clientName = String(args.client_name);
        const projectName = args.project_name ? String(args.project_name) : null;
        const originalDeadline = String(args.original_deadline);
        const newDeadline = String(args.new_deadline);
        const reason = args.reason ? String(args.reason) : null;
        const deliverable = args.deliverable ? String(args.deliverable) : null;
        const yourName = args.your_name ? String(args.your_name) : "Your Name";
        const projectRef = projectName ? ` on ${projectName}` : "";
        const reasonLine = reason ? ` ${reason}.` : "";
        const deliverableLine = deliverable
            ? `\n\nI'll have ${deliverable} to you by ${newDeadline}.`
            : `\n\nI'll have everything to you by ${newDeadline}.`;
        const email = `Subject: Extension request — ${projectName ?? "project deadline"}

Hi ${clientName},

I'm writing to flag a change to the deadline${projectRef}.

Our agreed date is ${originalDeadline}. I'm not going to be able to meet that — I'd like to request an extension to ${newDeadline}.${reasonLine}${deliverableLine}

I wanted to let you know before the deadline rather than after. If the new date causes any problems on your end, let me know and we can discuss how to handle it.

Best,
${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "budget_update_email") {
        const clientName = String(args.client_name);
        const projectName = args.project_name ? String(args.project_name) : null;
        const originalEstimate = String(args.original_estimate);
        const updatedCost = String(args.updated_cost);
        const reason = args.reason ? String(args.reason) : null;
        const approvalNeeded = args.approval_needed !== false;
        const yourName = args.your_name ? String(args.your_name) : "Your Name";
        const projectRef = projectName ? ` on ${projectName}` : "";
        const reasonLine = reason
            ? `\n\nThe reason for the increase: ${reason}.`
            : `\n\nThe project has proved more involved than I initially scoped.`;
        const approvalLine = approvalNeeded
            ? `\n\nI wanted to flag this before going further rather than surprise you at invoice time. Let me know how you'd like to proceed — happy to discuss if you'd like to talk it through.`
            : `\n\nI've noted the updated figure and will continue from here — just wanted to make sure you had the full picture.`;
        const email = `Subject: Updated cost estimate${projectRef}

Hi ${clientName},

I want to be upfront with you about a change to the cost estimate${projectRef}.

When we agreed the project, I estimated ${originalEstimate}. Based on where things stand now, the revised figure is ${updatedCost}.${reasonLine}${approvalLine}

Best,
${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "client_decline_email") {
        const clientName = String(args.client_name);
        const projectName = args.project_name ? String(args.project_name) : null;
        const declineReason = args.decline_reason ? String(args.decline_reason) : "capacity";
        const suggestReferral = args.suggest_referral !== false;
        const yourName = args.your_name ? String(args.your_name) : "Your Name";
        const projectRef = projectName ? ` on ${projectName}` : "";
        let reasonParagraph;
        switch (declineReason) {
            case "not_fit":
                reasonParagraph = `After thinking it through, I don't think I'm the right fit for this one. The work calls for a different skill set or approach than what I specialise in, and I'd rather be upfront about that than take it on and not deliver at the level you deserve.`;
                break;
            case "timing":
                reasonParagraph = `Unfortunately the timing doesn't work on my end. The project schedule doesn't align with my current commitments, and I wouldn't be able to give it the attention it needs at this stage.`;
                break;
            case "budget":
                reasonParagraph = `After reviewing the scope and your budget, I don't think I can take it on — the investment required to do this properly is above what you've outlined, and I'd rather be transparent about that now than try to make it work in a way that shortchanges the outcome.`;
                break;
            default: // capacity
                reasonParagraph = `I'm currently fully booked and wouldn't be able to take on new work${projectRef ? ` of this scope` : ""} without it affecting the quality I deliver to existing clients. I'd rather decline now than commit to something I can't give proper attention to.`;
        }
        const referralLine = suggestReferral
            ? `\n\nIf it would be useful, I'm happy to pass your details to someone in my network who might be a better fit — just let me know.`
            : "";
        const email = `Subject: Re: ${projectName ? projectName : "Your project inquiry"}

Hi ${clientName},

Thank you for reaching out${projectRef} — I appreciate you thinking of me.

${reasonParagraph}${referralLine}

I hope you find the right person for the project, and I wish you well with it. Feel free to get in touch if something comes up in the future that might be a better match.

Best,
${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "unclear_brief_email") {
        const clientName = String(args.client_name);
        const projectName = args.project_name ? String(args.project_name) : null;
        const unclearPoints = Array.isArray(args.unclear_points)
            ? args.unclear_points.map(String)
            : [];
        const suggestCall = args.suggest_call !== false;
        const responseDeadline = args.response_deadline
            ? String(args.response_deadline)
            : null;
        const yourName = args.your_name ? String(args.your_name) : "Your name";
        const projectRef = projectName ? ` for ${projectName}` : "";
        const questionList = unclearPoints
            .map((q, i) => `${i + 1}. ${q}`)
            .join("\n");
        const deadlineLine = responseDeadline
            ? `\nIf you can get these back to me ${responseDeadline} that would keep us on track.`
            : "";
        const callLine = suggestCall
            ? "\nAlternatively, if it's easier to talk through, I'm happy to jump on a 15-minute call — just let me know."
            : "";
        const email = `Subject: Quick questions before I start${projectRef}

Hi ${clientName},

Thanks for sending through the brief${projectRef}. Before I dive in I want to make sure I'm working from the right information — a few things would help me give you exactly what you're after rather than us going back and forth later.

${questionList}
${deadlineLine}${callLine}

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "onboarding_questionnaire") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const dueDate = args.due_date ? String(args.due_date) : null;
        const kickoffDate = args.kickoff_date ? String(args.kickoff_date) : null;
        const accessNeeded = args.access_needed ? String(args.access_needed) : null;
        const brandAssetsNeeded = args.brand_assets_needed !== false;
        const customQuestions = Array.isArray(args.custom_questions)
            ? args.custom_questions.map(String)
            : [];
        const yourName = args.your_name ? String(args.your_name) : "Your name";
        const deadlineLine = dueDate
            ? `Could you send your answers back by **${dueDate}**?${kickoffDate ? ` That keeps us on track for our ${kickoffDate} start.` : ""}`
            : kickoffDate
                ? `Could you send your answers back before our ${kickoffDate} kickoff?`
                : "Could you send your answers back by end of this week so we can hit the ground running?";
        const accessLine = accessNeeded
            ? `\n**Access & credentials needed:**\n${accessNeeded}\n\n(If you use a password manager, you can share securely via that — or let me know your preferred method.)\n`
            : "";
        const brandLine = brandAssetsNeeded
            ? `**Brand assets:**\n- Logo files (SVG or high-res PNG if available)\n- Brand colours (hex codes if you have them)\n- Fonts in use\n- Any brand guidelines or style guide\n\n`
            : "";
        const customLines = customQuestions.length > 0
            ? `**A few project-specific questions:**\n${customQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\n`
            : "";
        const email = `Subject: ${projectName} — quick onboarding questions

Hi ${clientName},

Excited to get started on ${projectName}. To hit the ground running and avoid back-and-forth once we're underway, I'd love to get a few things from you upfront.

**About the project:**
1. What does success look like for this project — what's the single most important outcome?
2. Who is the primary audience? (Demographics, role, what they care about most.)
3. Are there any constraints I should know about? (Deadlines, stakeholders who need sign-off, anything off-limits.)

**Tone and style:**
4. How would you describe the voice/tone you're going for? (Three adjectives work well here.)
5. Any examples of work you love — from your own brand or elsewhere?
6. Anything you've seen that definitely *doesn't* fit the direction you want?

${brandLine}**Approvals and comms:**
7. Who's the main point of contact for feedback and approvals on this project?
8. What's your preferred way to share feedback — email, comments in a doc, a tool like Notion?
9. Is there a maximum turnaround time I should plan around for your review rounds?

${accessLine}${customLines}${deadlineLine}

No need for a long answer on every question — bullet points are fine. Once I have your responses I'll start work straight away.

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "portfolio_request_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const portfolioLocation = String(args.portfolio_location);
        const specificWork = args.specific_work
            ? String(args.specific_work)
            : null;
        const offerPreview = args.offer_preview !== false;
        const offerAnonymise = args.offer_anonymise === true;
        const yourName = args.your_name ? String(args.your_name) : null;
        const workRef = specificWork
            ? `${specificWork} from ${projectName}`
            : `the work we did on ${projectName}`;
        const locationLine = `I'd love to feature it in ${portfolioLocation} — it's a great example of the kind of work I do.`;
        const previewLine = offerPreview
            ? `I'd share a draft with you before anything goes live so you can review the copy and approve it.`
            : ``;
        const anonymiseClause = offerAnonymise
            ? ` If you'd prefer I keep your company name out of it, I'm happy to show the work without attribution — just let me know.`
            : ``;
        const exitLine = `Completely fine if you'd rather it stayed private — just say the word.`;
        const signOff = yourName ? yourName : "Best";
        const body = [
            `I've been putting together my portfolio and wanted to ask if you'd be happy for me to include ${workRef}.`,
            ``,
            locationLine,
            ``,
            previewLine ? previewLine + anonymiseClause : anonymiseClause.trim(),
            ``,
            exitLine,
        ]
            .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
            .join("\n");
        const email = `Subject: Quick question about featuring ${projectName}

Hi ${clientName},

${body.trim()}

${signOff}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "contract_sent_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const signingDeadline = args.signing_deadline
            ? String(args.signing_deadline)
            : null;
        const signingLink = args.signing_link ? String(args.signing_link) : null;
        const contractSummary = args.contract_summary
            ? String(args.contract_summary)
            : null;
        const startDate = args.start_date ? String(args.start_date) : null;
        const yourName = args.your_name ? String(args.your_name) : null;
        const summaryLine = contractSummary
            ? `\n\n${contractSummary}`
            : "";
        let ctaLine;
        if (signingLink) {
            ctaLine = `You can sign here: ${signingLink}`;
        }
        else {
            ctaLine = `Please find the contract attached.`;
        }
        const deadlineLine = signingDeadline
            ? `If you could sign and return it by ${signingDeadline}, that would be great.`
            : `Once signed, we're ready to get started.`;
        const startLine = startDate
            ? ` Work begins on ${startDate}.`
            : "";
        const closingLine = `Let me know if you have any questions before signing.`;
        const signOff = yourName ? yourName : "Best";
        const email = `Subject: Contract for ${projectName}

Hi ${clientName},

As discussed, I've put together the contract for ${projectName}.${summaryLine}

${ctaLine}

${deadlineLine}${startLine} ${closingLine}

${signOff}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "milestone_delivered_email") {
        const clientName = String(args.client_name);
        const milestoneName = String(args.milestone_name);
        const rawDeliverables = String(args.deliverables);
        const projectName = args.project_name ? String(args.project_name) : null;
        const feedbackDeadline = args.feedback_deadline
            ? String(args.feedback_deadline)
            : null;
        const nextMilestone = args.next_milestone
            ? String(args.next_milestone)
            : null;
        const nextMilestoneDate = args.next_milestone_date
            ? String(args.next_milestone_date)
            : null;
        const yourName = args.your_name ? String(args.your_name) : null;
        const deliverableList = rawDeliverables
            .split(/,\s*/)
            .map((d) => `- ${d.trim()}`)
            .join("\n");
        const subjectProject = projectName
            ? `${milestoneName} delivered — ${projectName}`
            : `${milestoneName} delivered`;
        const openingProject = projectName
            ? `I'm pleased to share the deliverables for ${milestoneName} of ${projectName}.`
            : `I'm pleased to share the deliverables for ${milestoneName}.`;
        const reviewLine = feedbackDeadline
            ? `Please review and let me know if you have any feedback or changes by ${feedbackDeadline} so we can keep the project on schedule.`
            : `Please review and let me know if you have any feedback or if you're happy to sign off.`;
        let nextLine = "";
        if (nextMilestone && nextMilestoneDate) {
            nextLine = `\n\nOnce you've signed off, I'll move into ${nextMilestone}. I'm targeting ${nextMilestoneDate} for that delivery.`;
        }
        else if (nextMilestone) {
            nextLine = `\n\nOnce you've signed off, I'll move into ${nextMilestone}.`;
        }
        const signOff = yourName ? yourName : "Best";
        const email = `Subject: ${subjectProject}

Hi ${clientName},

${openingProject}

**${milestoneName} deliverables:**
${deliverableList}

${reviewLine}${nextLine}

${signOff}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "win_back_email") {
        const clientName = String(args.client_name);
        const lastProject = String(args.last_project);
        const timeElapsed = args.time_elapsed ? String(args.time_elapsed) : null;
        const valueHook = args.value_hook ? String(args.value_hook) : null;
        const serviceToOffer = args.service_to_offer
            ? String(args.service_to_offer)
            : null;
        const yourName = args.your_name ? String(args.your_name) : null;
        const timeRef = timeElapsed
            ? `It's been ${timeElapsed} since we wrapped up ${lastProject}`
            : `It's been a while since we finished ${lastProject}`;
        let hookLine = "";
        if (valueHook) {
            hookLine = `\n\n${valueHook}`;
        }
        let askLine = "";
        if (serviceToOffer) {
            askLine = `I've got capacity coming up and ${serviceToOffer} is exactly the kind of thing I'd love to pick up again — are you working on anything along those lines?`;
        }
        else {
            askLine = `Are you working on anything at the moment I could help with?`;
        }
        const signOff = yourName ? yourName : "Best";
        const email = `Subject: Checking in

Hi ${clientName},

${timeRef} — hope things have been going well.${hookLine}

${askLine}

${signOff}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "project_handover_email") {
        const clientName = String(args.client_name);
        const deliverables = String(args.deliverables);
        const projectName = args.project_name ? String(args.project_name) : null;
        const accessInstructions = args.access_instructions ? String(args.access_instructions) : null;
        const supportPeriod = args.support_period ? String(args.support_period) : null;
        const nextStepsForClient = args.next_steps_for_client ? String(args.next_steps_for_client) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const projectLine = projectName ? ` for ${projectName}` : "";
        const accessLine = accessInstructions ? `\n\n${accessInstructions}.` : "";
        const supportLine = supportPeriod
            ? `\n\nI'm available for ${supportPeriod} if anything needs adjusting.`
            : "";
        const nextStepsLine = nextStepsForClient
            ? `\n\n${nextStepsForClient.charAt(0).toUpperCase() + nextStepsForClient.slice(1)}.`
            : "\n\nLet me know once you've had a chance to look everything over.";
        const email = `Subject: Final files${projectLine ? ` — ${projectName}` : ""}

Hi ${clientName},

Everything is ready — please find the final files${projectLine} attached.

What's included: ${deliverables}.${accessLine}${supportLine}${nextStepsLine}

It's been a pleasure working with you on this.

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "invoice_cover_email") {
        const clientName = String(args.client_name);
        const amount = String(args.amount);
        const invoiceNumber = args.invoice_number ? String(args.invoice_number) : null;
        const projectName = args.project_name ? String(args.project_name) : null;
        const dueDate = args.due_date ? String(args.due_date) : null;
        const paymentLink = args.payment_link ? String(args.payment_link) : null;
        const paymentMethod = args.payment_method ? String(args.payment_method) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const subject = invoiceNumber
            ? `Invoice ${invoiceNumber}${projectName ? ` — ${projectName}` : ""}`
            : `Invoice${projectName ? ` — ${projectName}` : ""}`;
        const projectLine = projectName ? ` for ${projectName}` : "";
        const dueLine = dueDate
            ? ` Payment is due ${dueDate}.`
            : " Payment is due per our agreed terms.";
        let ctaLine = "";
        if (paymentLink) {
            ctaLine = `\n\nYou can pay directly here: ${paymentLink}`;
        }
        else if (paymentMethod) {
            ctaLine = `\n\nPayment via ${paymentMethod}.`;
        }
        const email = `Subject: ${subject}

Hi ${clientName},

Please find attached invoice${invoiceNumber ? ` ${invoiceNumber}` : ""} for ${amount}${projectLine}.${dueLine}${ctaLine}

Let me know if you have any questions.

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "revision_response_email") {
        const clientName = String(args.client_name);
        const revisionType = String(args.revision_type);
        const projectName = args.project_name ? String(args.project_name) : null;
        const revisionRequest = args.revision_request ? String(args.revision_request) : null;
        const roundsIncluded = args.rounds_included ? Number(args.rounds_included) : null;
        const roundsUsed = args.rounds_used ? Number(args.rounds_used) : null;
        const estimatedCost = args.estimated_cost ? String(args.estimated_cost) : null;
        const turnaround = args.turnaround ? String(args.turnaround) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const projectLine = projectName ? ` on ${projectName}` : "";
        const requestLine = revisionRequest ? `\n\nFor the change you mentioned — ${revisionRequest} — ` : "\n\n";
        let subject;
        let body;
        if (revisionType === "in_scope") {
            subject = `Re: Revision${projectName ? ` — ${projectName}` : ""}`;
            const turnaroundLine = turnaround ? ` I'll have it back to you ${turnaround}.` : " I'll get this back to you shortly.";
            body = `Thanks for the feedback${projectLine}.${requestLine.trimEnd()} I'll get that updated for you.${turnaroundLine}

Let me know if anything else needs adjusting once you've seen the new version.`;
        }
        else if (revisionType === "exceeds_rounds") {
            subject = `Revision rounds — ${projectName || "your project"}`;
            const roundsLine = roundsIncluded && roundsUsed
                ? `The original agreement included ${roundsIncluded} round${roundsIncluded === 1 ? "" : "s"} of revisions, and we've now completed ${roundsUsed}.`
                : "We've now completed all the revision rounds included in the original agreement.";
            const costLine = estimatedCost
                ? ` An additional round would be ${estimatedCost}.`
                : " I'm happy to quote for an additional round if you'd like to continue.";
            body = `Thanks for the notes${projectLine}.

${roundsLine} Any further changes fall outside what's included.${costLine}

Let me know how you'd like to proceed — happy to continue if the budget works.`;
        }
        else {
            subject = `Re: Revision request${projectName ? ` — ${projectName}` : ""}`;
            body = `Thanks for sending this through${projectLine}.

I want to make sure we handle this correctly — what you're describing${revisionRequest ? ` ("${revisionRequest}")` : ""} is a change in direction rather than a revision to the agreed brief. That means it sits outside the revision rounds and would need a change order to proceed.

I'll put together the scope and cost for your approval before we start — that way there are no surprises on either side. Does that work for you?`;
        }
        const email = `Subject: ${subject}

Hi ${clientName},

${body}

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "payment_received_email") {
        const clientName = String(args.client_name);
        const amount = String(args.amount);
        const projectName = args.project_name ? String(args.project_name) : null;
        const nextStep = args.next_step ? String(args.next_step) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const projectLine = projectName ? ` for ${projectName}` : "";
        const nextStepLine = nextStep
            ? `\n\n${nextStep.charAt(0).toUpperCase() + nextStep.slice(1)}.`
            : "\n\nWork continues as planned — I'll be in touch as things progress.";
        const email = `Subject: Payment received — thank you

Hi ${clientName},

Just confirming I've received your payment of ${amount}${projectLine} — thank you.${nextStepLine}

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "introduction_email") {
        const prospectName = String(args.prospect_name);
        const introducerName = String(args.introducer_name);
        const yourSpecialty = String(args.your_specialty);
        const theirContext = args.their_context ? String(args.their_context) : null;
        const proposedNextStep = args.proposed_next_step ? String(args.proposed_next_step) : "a quick call to learn more about what you're working on";
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const contextLine = theirContext
            ? `\n\nI understand ${theirContext} — that's exactly the kind of work I focus on.`
            : "";
        const email = `Subject: Re: Introduction

Thanks for the intro, ${introducerName} — I'll take it from here.

Hi ${prospectName},

Great to meet you. I'm a ${yourSpecialty}.${contextLine}

Would you be up for ${proposedNextStep}? Happy to work around your schedule.

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "referral_thank_you") {
        const referrerName = String(args.referrer_name);
        const referredName = String(args.referred_name);
        const outcome = args.outcome ? String(args.outcome) : "intro";
        const projectType = args.project_type ? String(args.project_type) : null;
        const reciprocate = args.reciprocate !== false;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const projectLine = projectType ? ` on ${projectType}` : "";
        const reciprocateLine = reciprocate
            ? `\n\nIf I ever come across someone who'd be a good fit for what you do, I'll make sure to return the favour.`
            : "";
        let body;
        if (outcome === "won_project") {
            body = `Just wanted to let you know — I ended up working with ${referredName}${projectLine}. Really appreciate you making that introduction. It meant a lot that you thought of me.${reciprocateLine}`;
        }
        else if (outcome === "had_call") {
            body = `Had a great call with ${referredName} — really glad you made the introduction. Whatever comes of it, I appreciate you thinking of me.${reciprocateLine}`;
        }
        else {
            body = `Just reached out to ${referredName} — thanks so much for the introduction. I really appreciate you thinking of me${projectLine ? ` for ${projectType}` : ""}.${reciprocateLine}`;
        }
        const email = `Subject: Thank you for the intro

Hi ${referrerName},

${body}

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "no_response_closure_email") {
        const prospectName = String(args.prospect_name);
        const projectOrContext = String(args.project_or_context);
        const keepDoorOpen = args.keep_door_open !== false;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const doorLine = keepDoorOpen
            ? `\n\nIf the timing changes down the line, feel free to get in touch — happy to pick up the conversation whenever it makes sense.`
            : "";
        const email = `Subject: Closing the loop

Hi ${prospectName},

I've tried reaching out a couple of times about ${projectOrContext} and haven't heard back, so I'll assume the timing isn't right and won't follow up again.

No hard feelings at all — these things don't always line up.${doorLine}

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "meeting_request_email") {
        const recipientName = String(args.recipient_name);
        const meetingPurpose = String(args.meeting_purpose);
        const timeOptions = args.time_options ? String(args.time_options) : null;
        const duration = args.duration ? String(args.duration) : null;
        const platform = args.platform ? String(args.platform) : null;
        const context = args.context ? String(args.context) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const contextLine = context ? `\n\n${context}.` : "";
        const platformLine = platform ? ` on ${platform}` : "";
        const durationLine = duration ? ` (${duration})` : "";
        const timingBlock = timeOptions
            ? `\n\nI have ${timeOptions} — any of those work for you?`
            : `\n\nWhat does your diary look like over the next week or so?`;
        const email = `Subject: Quick call — ${meetingPurpose}

Hi ${recipientName},${contextLine}

Would you be up for ${meetingPurpose}${platformLine}${durationLine}?${timingBlock}

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "price_quote_email") {
        const clientName = String(args.client_name);
        const projectDescription = String(args.project_description);
        const price = String(args.price);
        const whatsIncluded = args.whats_included ? String(args.whats_included) : null;
        const timeline = args.timeline ? String(args.timeline) : null;
        const validity = args.validity ? String(args.validity) : null;
        const nextStep = args.next_step ? String(args.next_step) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const includedLine = whatsIncluded
            ? `\n\nThat covers: ${whatsIncluded}.`
            : "";
        const timelineLine = timeline
            ? `\n\nTimeline: ${timeline}.`
            : "";
        const validityLine = validity
            ? `\n\nThis quote is valid for ${validity}.`
            : "";
        const nextStepLine = nextStep
            ? `\n\n${nextStep}`
            : `\n\nLet me know if you'd like to go ahead or if you have any questions.`;
        const email = `Subject: Quote for ${projectDescription}

Hi ${clientName},

Thanks for the brief — here's my quote for ${projectDescription}.

Investment: ${price}${includedLine}${timelineLine}${validityLine}${nextStepLine}

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "contract_renewal_email") {
        const clientName = String(args.client_name);
        const projectOrRetainer = String(args.project_or_retainer);
        const currentEndDate = String(args.current_end_date);
        const renewalTerms = args.renewal_terms ? String(args.renewal_terms) : null;
        const highlight = args.highlight ? String(args.highlight) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const highlightLine = highlight
            ? `\n\n${highlight} — that kind of result is exactly what I want to build on.`
            : "";
        const renewalBlock = renewalTerms
            ? `\n\nI'd like to propose renewing on the following terms: ${renewalTerms}. If that works for you, I can get a new agreement over by the end of the week.`
            : `\n\nIf you'd like to continue working together, I'm happy to put together renewal terms — same scope, updated scope, whatever makes sense for where you're at. Let me know if a quick call makes sense.`;
        const email = `Subject: Renewing ${projectOrRetainer}

Hi ${clientName},

${projectOrRetainer.charAt(0).toUpperCase() + projectOrRetainer.slice(1)} wraps up on ${currentEndDate} and I wanted to get in touch before it expires.${highlightLine}${renewalBlock}

Let me know either way — no pressure if the timing isn't right.

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "project_completion_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const whatYouDelivered = String(args.what_you_delivered);
        const deliveryLocation = args.delivery_location ? String(args.delivery_location) : null;
        const highlight = args.highlight ? String(args.highlight) : null;
        const testimonialRequest = args.testimonial_request !== false;
        const futureWork = args.future_work ? String(args.future_work) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const deliveryLine = deliveryLocation
            ? ` You will find ${whatYouDelivered} ${deliveryLocation}.`
            : ` I have included ${whatYouDelivered}.`;
        const highlightLine = highlight
            ? `\n\n${highlight.charAt(0).toUpperCase() + highlight.slice(1)}.`
            : "";
        const testimonialLine = testimonialRequest
            ? `\n\nIf you are happy with the work, I would really appreciate a short testimonial — even a couple of sentences means a lot and helps me a great deal.`
            : "";
        const futureLine = futureWork
            ? `\n\n${futureWork.charAt(0).toUpperCase() + futureWork.slice(1)}.`
            : "";
        const email = `Subject: ${projectName} — all done

Hi ${clientName},

${projectName.charAt(0).toUpperCase() + projectName.slice(1)} is complete.${deliveryLine}${highlightLine}

It has been a pleasure working with you on this — thank you for being such a great client.${testimonialLine}${futureLine}

Wishing you all the best with it.

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "payment_plan_proposal") {
        const clientName = String(args.client_name);
        const invoiceTotal = String(args.invoice_total);
        const invoiceNumber = args.invoice_number ? String(args.invoice_number) : null;
        const numPayments = args.number_of_payments ? Number(args.number_of_payments) : 2;
        const firstPayment = args.first_payment ? String(args.first_payment) : null;
        const scheduleDescription = args.schedule_description ? String(args.schedule_description) : null;
        const totalPeriod = args.total_period ? String(args.total_period) : null;
        const projectName = args.project_name ? String(args.project_name) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const subjectRef = invoiceNumber ? `${invoiceNumber} — ` : projectName ? `${projectName} — ` : "";
        const subject = `Subject: ${subjectRef}Payment plan`;
        const projectRef = projectName ? ` for ${projectName}` : "";
        const openLine = `I understand that settling ${invoiceTotal}${projectRef} in one go may not be straightforward right now.`;
        let planDescription;
        if (firstPayment && scheduleDescription) {
            planDescription = `Here is what I am happy to arrange:\n\n— First payment: ${firstPayment} now\n— Remaining balance: split equally across the next ${numPayments - 1} payment${numPayments - 1 > 1 ? "s" : ""}, due ${scheduleDescription}`;
        }
        else if (scheduleDescription) {
            planDescription = `Here is what I am happy to arrange:\n\n${numPayments} equal instalments of approximately ${invoiceTotal} divided by ${numPayments}, due ${scheduleDescription}`;
        }
        else {
            planDescription = `Here is what I am happy to arrange:\n\n${numPayments} equal instalments${totalPeriod ? ` spread over ${totalPeriod}` : ""}, with the first due now and the remainder at agreed intervals`;
        }
        const periodNote = totalPeriod ? ` over the next ${totalPeriod}` : "";
        const closingLine = `If this works for you, please reply to confirm and I will send a revised payment schedule${periodNote}. Once we have agreed the plan in writing, I am happy to proceed on that basis.`;
        const email = `${subject}

Hi ${clientName},

${openLine}

${planDescription}

${closingLine}

Let me know if you would like to adjust the schedule — I want to find something that works for both of us.

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "rush_fee_email") {
        const clientName = String(args.client_name);
        const rushDeadline = String(args.rush_deadline);
        const rushFee = String(args.rush_fee);
        const originalDeadline = args.original_deadline ? String(args.original_deadline) : null;
        const projectName = args.project_name ? String(args.project_name) : null;
        const whatItCovers = args.what_it_covers ? String(args.what_it_covers) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const subjectProject = projectName ? `${projectName} — ` : "";
        const subject = `Subject: ${subjectProject}Rush delivery fee`;
        const projectRef = projectName ? ` on ${projectName}` : "";
        const openLine = `I can hit ${rushDeadline}${projectRef}.`;
        const timelineContext = originalDeadline
            ? ` My standard timeline for this is ${originalDeadline} — moving to ${rushDeadline} means ${whatItCovers ? whatItCovers : "rescheduling other commitments"} to make it happen.`
            : whatItCovers
                ? ` That means ${whatItCovers}.`
                : "";
        const feeBlock = `To confirm the expedited delivery, there is a rush fee of ${rushFee}.${timelineContext}`;
        const email = `${subject}

Hi ${clientName},

${openLine}

${feeBlock}

Happy to proceed as soon as you confirm — just reply with a yes and I will reprioritise immediately. If the timeline is flexible, I am also happy to stick with the original schedule at the standard rate.

${yourName}`;
        return {
            content: [{ type: "text", text: email }],
        };
    }
    if (name === "expense_reimbursement_email") {
        const clientName = String(args.client_name);
        const expenseDescription = String(args.expense_description);
        const amount = String(args.amount);
        const projectName = args.project_name ? String(args.project_name) : null;
        const receiptNote = args.receipt_note ? String(args.receipt_note) : null;
        const addToNextInvoice = args.add_to_next_invoice === true;
        const paymentInstructions = args.payment_instructions ? String(args.payment_instructions) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const projectRef = projectName ? ` for ${projectName}` : "";
        const subjectProject = projectName ? `${projectName} — ` : "";
        if (addToNextInvoice) {
            const subject = `Subject: ${subjectProject}Project expense — heads up`;
            const receiptLine = receiptNote ? `\n\n${receiptNote}.` : "";
            const email = `${subject}

Hi ${clientName},

Just a quick heads-up: I purchased ${expenseDescription}${projectRef}, which comes to ${amount}. I will include this on my next invoice so it does not appear as a surprise.${receiptLine}

Let me know if you have any questions.

${yourName}`;
            return { content: [{ type: "text", text: email }] };
        }
        const subject = `Subject: ${subjectProject}Expense reimbursement — ${amount}`;
        const receiptLine = receiptNote ? `\n\n${receiptNote}.` : "";
        const paymentLine = paymentInstructions
            ? `\n\nTo reimburse, please send ${amount} ${paymentInstructions}.`
            : `\n\nPlease let me know your preferred method for reimbursement and I will send over the details.`;
        const email = `${subject}

Hi ${clientName},

I wanted to flag a project expense I have incurred on your behalf: ${expenseDescription}${projectRef}, totalling ${amount}.${receiptLine}${paymentLine}

Happy to answer any questions about this.

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "meeting_cancellation_email") {
        const clientName = String(args.client_name);
        const meetingDescription = String(args.meeting_description);
        const reason = args.reason ? String(args.reason) : null;
        const action = args.action === "reschedule" ? "reschedule" : "cancel";
        const newTime = args.new_time ? String(args.new_time) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const reasonLine = reason ? ` — ${reason}` : "";
        const apologyLine = reason
            ? `I'm sorry for any inconvenience this causes.`
            : `I'm sorry for any disruption to your schedule.`;
        if (action === "reschedule") {
            const rescheduleClose = newTime
                ? `Would ${newTime} work for you? If not, let me know a few times that suit and I'll find a slot that works.`
                : `Could you share a few times that work for you next week? I'll confirm as soon as possible.`;
            const subject = `Subject: Rescheduling — ${meetingDescription}`;
            const email = `${subject}

Hi ${clientName},

I need to reschedule ${meetingDescription}${reasonLine}. ${apologyLine}

${rescheduleClose}

${yourName}`;
            return { content: [{ type: "text", text: email }] };
        }
        const subject = `Subject: Cancelling — ${meetingDescription}`;
        const email = `${subject}

Hi ${clientName},

I need to cancel ${meetingDescription}${reasonLine}. ${apologyLine}

Please let me know if you would like to rearrange at a later date — I am happy to find a time that works.

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "pre_meeting_email") {
        const clientName = String(args.client_name);
        const meetingDescription = String(args.meeting_description);
        const agendaItems = args.agenda_items ? String(args.agenda_items) : null;
        const meetingFormat = args.meeting_format ? String(args.meeting_format) : null;
        const meetingLink = args.meeting_link ? String(args.meeting_link) : null;
        const prepRequest = args.prep_request ? String(args.prep_request) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const agendaSection = agendaItems
            ? `\n\nAgenda:\n${agendaItems
                .split(",")
                .map((item, i) => `${i + 1}. ${item.trim()}`)
                .join("\n")}`
            : "";
        const formatLine = meetingFormat ? ` (${meetingFormat})` : "";
        const linkLine = meetingLink ? `\n\nJoin link: ${meetingLink}` : "";
        const prepLine = prepRequest
            ? `\n\nIf you have a moment beforehand, it would help to have ${prepRequest} handy — no need to prepare anything formal, just useful context.`
            : "";
        const subject = `Subject: Agenda — ${meetingDescription}`;
        const email = `${subject}

Hi ${clientName},

Looking forward to ${meetingDescription}${formatLine}.${agendaSection}${linkLine}${prepLine}

Let me know if you would like to adjust the agenda or if anything has come up on your end.

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "brief_confirmation_email") {
        const clientName = String(args.client_name);
        const deliverables = String(args.deliverables);
        const total = String(args.total);
        const projectName = args.project_name ? String(args.project_name) : null;
        const outOfScope = args.out_of_scope ? String(args.out_of_scope) : null;
        const timeline = args.timeline ? String(args.timeline) : null;
        const startDate = args.start_date ? String(args.start_date) : null;
        const whatYouNeed = args.what_you_need ? String(args.what_you_need) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const projectRef = projectName ? ` for ${projectName}` : "";
        const deliverableLines = deliverables
            .split(",")
            .map((d) => `- ${d.trim()}`)
            .join("\n");
        const scopeSection = outOfScope
            ? `\n\nNot included:\n${outOfScope
                .split(",")
                .map((s) => `- ${s.trim()}`)
                .join("\n")}`
            : "";
        const timelineLines = [];
        if (timeline)
            timelineLines.push(`Timeline: ${timeline}`);
        if (startDate)
            timelineLines.push(`Start: ${startDate}`);
        const timingSection = timelineLines.length
            ? `\n\n${timelineLines.join("\n")}`
            : "";
        const needsSection = whatYouNeed
            ? `\n\nTo get started I'll need: ${whatYouNeed}.`
            : "";
        const subject = `Subject: Confirming scope${projectRef}`;
        const email = `${subject}

Hi ${clientName},

Following our conversation, here is my understanding of the project scope. Please let me know if anything needs adjusting before I begin.

Deliverables:
${deliverableLines}${scopeSection}${timingSection}

Total: ${total}${needsSection}

If this looks right, just reply to confirm and I'll get started. If anything is off, now is the right time to catch it.

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "capacity_waitlist_email") {
        const clientName = String(args.client_name);
        const projectDescription = args.project_description ? String(args.project_description) : null;
        const availableFrom = args.available_from ? String(args.available_from) : null;
        const offerPrioritySlot = args.offer_priority_slot !== false;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const projectLine = projectDescription
            ? ` regarding ${projectDescription}`
            : "";
        const availabilityLine = availableFrom
            ? `I'm currently fully booked, but I'm expecting capacity to open from ${availableFrom}.`
            : `I'm currently fully booked and don't have a firm opening date yet, but I'm expecting space to come available in the next few weeks.`;
        const priorityLine = offerPrioritySlot
            ? `\n\nIf the timing could work, I'd be happy to put you at the top of the list when my calendar opens — just reply here and I'll confirm as soon as a slot is free.`
            : `\n\nI'll keep your project in mind, and if anything changes on my end sooner, I'll reach out.`;
        const subject = `Subject: Re: Your enquiry${projectDescription ? ` — ${projectDescription}` : ""}`;
        const email = `${subject}

Hi ${clientName},

Thanks for getting in touch${projectLine} — it sounds like an interesting project.

${availabilityLine}${priorityLine}

Either way, I wanted to make sure you weren't left waiting without a response. I hope you find the right person for the work.

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "retainer_check_in_email") {
        const clientName = String(args.client_name);
        const period = String(args.period);
        const workSummary = args.work_summary ? String(args.work_summary) : null;
        const upcomingWork = args.upcoming_work ? String(args.upcoming_work) : null;
        const newNeedsQuestion = args.new_needs_question
            ? String(args.new_needs_question)
            : "Is there anything new on your radar or anything you'd like to adjust going forward?";
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const summarySection = workSummary
            ? `\n\nFor ${period}, I covered: ${workSummary}.`
            : `\n\nJust checking in on how ${period} has felt from your end.`;
        const upcomingSection = upcomingWork
            ? `\n\nComing up: ${upcomingWork}.`
            : "";
        const subject = `Subject: Check-in — ${period}`;
        const email = `${subject}

Hi ${clientName},

Hope ${period} has been a good one.${summarySection}${upcomingSection}

${newNeedsQuestion}

Let me know — happy to jump on a call if easier.

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "new_service_announcement_email") {
        const clientName = String(args.client_name);
        const newService = String(args.new_service);
        const whyRelevant = args.why_relevant ? String(args.why_relevant) : null;
        const proofPoint = args.proof_point ? String(args.proof_point) : null;
        const offer = args.offer ? String(args.offer) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const relevantLine = whyRelevant
            ? `\n\nI thought of you specifically — ${whyRelevant}.`
            : `\n\nYou came to mind as someone who might find this useful.`;
        const proofLine = proofPoint
            ? `\n\n${proofPoint}.`
            : "";
        const offerLine = offer
            ? `\n\nAs a heads up for existing clients: ${offer}.`
            : "";
        const subject = `Subject: Something new I'm now offering`;
        const email = `${subject}

Hi ${clientName},

Wanted to give you a quick heads-up before I mention this more broadly: I've started offering ${newService}.${relevantLine}${proofLine}${offerLine}

No pitch here — just wanted you to know it's available if it's ever useful. Happy to share more detail or jump on a quick call if you want to hear what it looks like in practice.

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "post_launch_check_in_email") {
        const clientName = String(args.client_name);
        const whatLaunched = String(args.what_launched);
        const timeSinceLaunch = args.time_since_launch ? String(args.time_since_launch) : null;
        const resultToReference = args.result_to_reference ? String(args.result_to_reference) : null;
        const nextOffer = args.next_offer ? String(args.next_offer) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const timingLine = timeSinceLaunch
            ? `It's been ${timeSinceLaunch} since ${whatLaunched} went live.`
            : `${whatLaunched.charAt(0).toUpperCase() + whatLaunched.slice(1)} has been live for a little while now.`;
        const resultLine = resultToReference
            ? ` ${resultToReference} — good to see it working.`
            : " Hoping it's performing well for you.";
        const offerLine = nextOffer
            ? `\n\n${nextOffer}.`
            : "";
        const subject = `Subject: Checking in on ${whatLaunched}`;
        const email = `${subject}

Hi ${clientName},

${timingLine}${resultLine} Just wanted to check in and see how things are tracking — and whether anything has surfaced that's worth looking at.${offerLine}

Worth a quick call if there's anything I can help with. No pressure either way.

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "project_go_live_email") {
        const clientName = String(args.client_name);
        const whatWentLive = String(args.what_went_live);
        const liveUrl = args.live_url ? String(args.live_url) : null;
        const earlyResult = args.early_result ? String(args.early_result) : null;
        const nextHook = args.next_hook ? String(args.next_hook) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const urlLine = liveUrl ? `\n\n${liveUrl}` : "";
        const resultLine = earlyResult ? `\n\n${earlyResult} — great early sign.` : "";
        const hookLine = nextHook ? `\n\n${nextHook}.` : "";
        const subject = `Subject: ${whatWentLive.charAt(0).toUpperCase() + whatWentLive.slice(1)} is live`;
        const email = `${subject}

Hi ${clientName},

Just saw ${whatWentLive} go live — congratulations.${urlLine}${resultLine}

It was genuinely good to work on this one. Hope it performs well for you.${hookLine}

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "client_anniversary_email") {
        const clientName = String(args.client_name);
        const milestone = String(args.milestone);
        const projectOrRelationship = args.project_or_relationship ? String(args.project_or_relationship) : null;
        const standoutMoment = args.standout_moment ? String(args.standout_moment) : null;
        const forwardLine = args.forward_line ? String(args.forward_line) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const relationshipRef = projectOrRelationship
            ? ` working on ${projectOrRelationship}`
            : " working together";
        const standoutLine = standoutMoment
            ? `\n\n${standoutMoment}.`
            : "";
        const closingLine = forwardLine
            ? `\n\n${forwardLine}`
            : "";
        const subject = `Subject: ${milestone}`;
        const email = `${subject}

Hi ${clientName},

Just noticed it's been ${milestone} since we started${relationshipRef}.${standoutLine}

Genuinely glad we got to work together. Hoping this next year is a good one for you.${closingLine}

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "competitor_response_email") {
        const clientName = String(args.client_name);
        const competitorName = args.competitor_name ? String(args.competitor_name) : null;
        const competitorPrice = args.competitor_price ? String(args.competitor_price) : null;
        const yourPrice = args.your_price ? String(args.your_price) : null;
        const projectName = args.project_name ? String(args.project_name) : null;
        const responseMode = args.response_mode ? String(args.response_mode) : "hold_rate";
        const differentiator = args.differentiator ? String(args.differentiator) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const competitorRef = competitorName ? competitorName : "another provider";
        const projectRef = projectName ? ` for ${projectName}` : "";
        const priceGapLine = (competitorPrice && yourPrice)
            ? ` The gap between ${competitorPrice} and ${yourPrice} is real — I want to address it directly.`
            : competitorPrice
                ? ` I understand the ${competitorPrice} quote is compelling.`
                : "";
        const differentiatorLine = differentiator
            ? `\n\n${differentiator.charAt(0).toUpperCase() + differentiator.slice(1)}.`
            : "";
        const subject = projectName
            ? `Subject: Re: ${projectName}`
            : `Subject: Re: your quote`;
        let body;
        if (responseMode === "hold_rate") {
            body = `${subject}

Hi ${clientName},

Thanks for being upfront about the other quote${priceGapLine}

I'm not going to match it — and I want to be straightforward about why.${differentiatorLine} The rate I've quoted reflects what it takes to deliver${projectRef} at the level I've outlined, without cutting corners that show up later.

If ${competitorRef}'s approach fits your needs and your budget, that's a completely reasonable call. But if you have any questions about what's included in my proposal — or want to talk through scope — I'm happy to do that.

${yourName}`;
        }
        else if (responseMode === "adjust_scope") {
            body = `${subject}

Hi ${clientName},

Thanks for being upfront about the other quote.${priceGapLine}

I'd rather give you a smaller scope I'm confident in than cut the budget on the same scope and deliver something I'm not proud of. Here's what I can do:${differentiatorLine}

[Describe the adjusted scope here — what's included, what's deferred to phase 2, and what you'll deliver by when.]

If that works for you, I can have a revised proposal over today. If the full scope is a firm requirement, I understand — but I won't be able to move on the price for it.

${yourName}`;
        }
        else {
            // match_with_context
            body = `${subject}

Hi ${clientName},

Thanks for the transparency.${priceGapLine}

I can work with you on the rate${projectRef}.${differentiatorLine} I want to be clear that this isn't something I'd do for every project — it's specific to this one and this timing.

My proposal and timeline stay the same. If you want to go ahead on that basis, let me know and I'll send over the updated paperwork.

${yourName}`;
        }
        return { content: [{ type: "text", text: body }] };
    }
    if (name === "work_sample_response_email") {
        const clientName = String(args.client_name);
        const projectContext = args.project_context ? String(args.project_context) : null;
        const sampleDescription = args.sample_description ? String(args.sample_description) : null;
        const sampleLink = args.sample_link ? String(args.sample_link) : null;
        const adjacentWork = args.adjacent_work ? String(args.adjacent_work) : null;
        const responseMode = args.response_mode ? String(args.response_mode) : "have_samples";
        const nextStep = args.next_step ? String(args.next_step) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const contextRef = projectContext ? ` for ${projectContext}` : "";
        const nextStepLine = nextStep
            ? `\n\n${nextStep.charAt(0).toUpperCase() + nextStep.slice(1)}.`
            : "\n\nHappy to jump on a short call if you'd like to talk through anything.";
        let email;
        if (responseMode === "have_samples") {
            const sampleLine = sampleDescription
                ? `Here's what I'd point you to: ${sampleDescription}.`
                : "I've pulled together some relevant examples.";
            const linkLine = sampleLink
                ? (sampleLink.toLowerCase() === "attached"
                    ? " I've attached them to this email."
                    : `\n\n${sampleLink}`)
                : " Let me know and I'll send them over.";
            const subject = projectContext
                ? `Subject: Work samples — ${projectContext}`
                : `Subject: Work samples`;
            email = `${subject}

Hi ${clientName},

Of course. ${sampleLine}${linkLine}

I've picked these specifically because they're closest to what you're working on${contextRef} — the brief, the constraints, or the type of output. Happy to give you more context on any of them.${nextStepLine}

${yourName}`;
        }
        else {
            // no_exact_match
            const gapAcknowledgement = adjacentWork
                ? `I don't have an exact match${contextRef}, but — ${adjacentWork}.`
                : `I don't have an exact match${contextRef}.`;
            const sampleLine = sampleDescription
                ? ` What I can share: ${sampleDescription}.`
                : "";
            const linkLine = sampleLink
                ? (sampleLink.toLowerCase() === "attached"
                    ? " I've attached them to this email."
                    : `\n\n${sampleLink}`)
                : "";
            const subject = projectContext
                ? `Subject: Work samples — ${projectContext}`
                : `Subject: Work samples`;
            email = `${subject}

Hi ${clientName},

${gapAcknowledgement}${sampleLine}${linkLine}

I'd rather be upfront about that than send you something tangentially related and let you draw your own conclusions. The underlying skill is the same — the context is different.${nextStepLine}

${yourName}`;
        }
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "project_feedback_request_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const specificQuestion = args.specific_question ? String(args.specific_question) : null;
        const testimonialPlatform = args.testimonial_platform ? String(args.testimonial_platform) : null;
        const requestMode = args.request_mode ? String(args.request_mode) : "feedback_only";
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const questionLine = specificQuestion
            ? `One thing I'd genuinely like to know: ${specificQuestion.endsWith("?") ? specificQuestion : specificQuestion + "?"}`
            : `If there's one thing that worked well — or one thing I could have handled better — I'd love to know.`;
        let email;
        if (requestMode === "feedback_only") {
            email = `Subject: Quick question about ${projectName}

Hi ${clientName},

Now that ${projectName} is wrapped up, I wanted to check in on how it landed on your end.

${questionLine}

No need to write a lot — a line or two is plenty. I ask because I take this stuff seriously and it actually changes how I work.

${yourName}`;
        }
        else {
            const testimonialLine = testimonialPlatform
                ? `If you're happy with how it went and have a couple of minutes, a short note on ${testimonialPlatform} would mean a lot — it's genuinely the most useful thing you can do for a freelancer's business. No pressure at all if timing's not right.`
                : `If you're happy with how it went, a short testimonial — even two sentences — would mean a lot. No pressure at all if timing's not right.`;
            email = `Subject: Quick question about ${projectName}

Hi ${clientName},

Now that ${projectName} is done, I wanted to check in on how it all landed.

${questionLine}

And if you're happy with the outcome — ${testimonialLine}

Either way, it was good work. Hope to collaborate again.

${yourName}`;
        }
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "end_client_relationship_email") {
        const clientName = String(args.client_name);
        const engagementDescription = args.engagement_description ? String(args.engagement_description) : null;
        const endDate = args.end_date ? String(args.end_date) : null;
        const reason = args.reason ? String(args.reason) : "natural_end";
        const handoverNote = args.handover_note ? String(args.handover_note) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const engagementRef = engagementDescription ? ` ${engagementDescription}` : " our engagement";
        const endDateLine = endDate ? ` — my last day will be ${endDate}` : "";
        const handoverLine = handoverNote
            ? `\n\n${handoverNote.charAt(0).toUpperCase() + handoverNote.slice(1)}.`
            : "";
        let email;
        if (reason === "natural_end") {
            email = `Subject: Wrapping up${engagementDescription ? " — " + engagementDescription : ""}

Hi ${clientName},

I wanted to let you know that I'll be bringing${engagementRef} to a close${endDateLine}.

It's been genuinely good work — I've appreciated the collaboration and what we've built together.${handoverLine}

If there's anything you'd like to cover before we wrap up, let me know. And if something comes up down the track where I can help, don't hesitate to reach out.

${yourName}`;
        }
        else if (reason === "capacity") {
            email = `Subject: Stepping back from${engagementDescription ? " " + engagementDescription : " our work together"}

Hi ${clientName},

I wanted to be straight with you: I don't have the capacity to continue${engagementRef} at the level you deserve${endDateLine}.

I'd rather tell you now than let the quality slip. This isn't about the work — it's a bandwidth issue on my end.${handoverLine}

I'm sorry for the disruption. Happy to help make the handover as smooth as possible.

${yourName}`;
        }
        else {
            // fit_mismatch
            email = `Subject: Ending${engagementDescription ? " " + engagementDescription : " our engagement"}

Hi ${clientName},

I've been thinking about this carefully, and I've decided not to continue${engagementRef}${endDateLine}.

I don't think this is the right working relationship for either of us, and I'd rather be honest about that than drag it out.${handoverLine}

I wish you well with the project and hope you find the right person for what you need.

${yourName}`;
        }
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "cold_pitch_follow_up") {
        const recipientName = String(args.recipient_name);
        const companyName = args.company_name ? String(args.company_name) : null;
        const originalPitchSummary = String(args.original_pitch_summary);
        const daysSincePitch = args.days_since_pitch ? Number(args.days_since_pitch) : null;
        const newAngle = args.new_angle ? String(args.new_angle) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const subjectCompany = companyName ? ` — ${companyName}` : "";
        const newAngleLine = newAngle ? `\n\n${newAngle}` : "";
        let timeLine = "";
        if (daysSincePitch && daysSincePitch <= 10) {
            timeLine = "I know inboxes get busy — ";
        }
        else if (daysSincePitch && daysSincePitch > 10) {
            timeLine = "I sent this a couple of weeks ago and wanted to circle back briefly — ";
        }
        const email = `Subject: Re: ${originalPitchSummary}${subjectCompany}

Hi ${recipientName},

${timeLine}just a quick bump on the note I sent about ${originalPitchSummary}.${newAngleLine}

If the timing's off or it's not the right fit, just say the word — no hard feelings at all. But if there's any interest, I'd love a 15-minute call.

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "contract_unsigned_follow_up") {
        const clientName = String(args.client_name);
        const projectName = args.project_name ? String(args.project_name) : null;
        const daysSinceSent = args.days_since_sent ? Number(args.days_since_sent) : null;
        const startDate = args.start_date ? String(args.start_date) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const projectRef = projectName ? ` for ${projectName}` : "";
        const subjectProject = projectName ? ` — ${projectName}` : "";
        let openingLine = "Just circling back on the contract I sent";
        if (daysSinceSent && daysSinceSent <= 4) {
            openingLine = "Just a quick nudge on the contract I sent";
        }
        else if (daysSinceSent && daysSinceSent >= 10) {
            openingLine = "I wanted to follow up on the contract I sent a couple of weeks ago";
        }
        const startLine = startDate
            ? `\n\nWe're lined up to kick off ${startDate}, so returning it when you get a chance would help us stay on track.`
            : "";
        const email = `Subject: Contract${subjectProject}

Hi ${clientName},

${openingLine}${projectRef} — just wanted to make sure it didn't get buried.${startLine}

If anything in it needs adjusting, or if circumstances have changed on your end, just let me know. Happy to sort it out.

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "equity_or_deferred_payment_response") {
        const clientName = String(args.client_name);
        const proposalType = String(args.proposal_type);
        const mode = args.response_mode ? String(args.response_mode) : "decline";
        const projectDescription = args.project_description ? String(args.project_description) : null;
        const yourConditions = args.your_conditions ? String(args.your_conditions) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const projectLine = projectDescription
            ? `I appreciate you sharing more about the ${projectDescription}.`
            : "I appreciate you taking the time to reach out.";
        let body;
        if (mode === "counter") {
            const conditionsText = yourConditions
                ? yourConditions
                : "a portion of the fee upfront with the remainder tied to milestones";
            body = `Hi ${clientName},

${projectLine}

I've given the ${proposalType} structure some thought. It's not something I typically work with, but I'm open to a structure that works for both of us.

What I'd need to make it work: ${conditionsText}.

If that's in the right ballpark, happy to put something more formal together. If not, I understand — and I'm still interested in the project on standard terms if that ever makes sense.

${yourName}`;
        }
        else if (mode === "open_to_discuss") {
            body = `Hi ${clientName},

${projectLine}

The ${proposalType} model is something I'd want to understand better before I could give you a proper answer. A few things I'd need to get a clearer picture:

- What does the ${proposalType} structure look like in practice — is there a cap, a timeline, a valuation basis?
- What's the expected timeline from project delivery to meaningful returns?
- Is there flexibility to include any cash component alongside?

Happy to jump on a short call to talk it through if that's easier.

${yourName}`;
        }
        else {
            body = `Hi ${clientName},

${projectLine}

I appreciate you being upfront about the structure. I have a policy of working on a fixed-fee or time-based basis — it keeps things clean and lets me give the work the focus it deserves without the complexity of shared economics.

It's not a reflection of confidence in the project; it's just how I operate.

If the budget situation changes and a paid engagement makes sense down the line, I'd be glad to pick up the conversation.

${yourName}`;
        }
        const email = `Subject: Re: [their subject line]

${body}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "project_inquiry_response_email") {
        const clientName = String(args.client_name);
        const enquirySummary = String(args.enquiry_summary);
        const mode = args.response_mode ? String(args.response_mode) : "reply_and_qualify";
        const rawQuestions = args.qualifying_questions ? String(args.qualifying_questions) : null;
        const schedulingLink = args.call_scheduling_link ? String(args.call_scheduling_link) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const questions = rawQuestions
            ? rawQuestions
                .split(",")
                .map((q) => q.trim())
                .filter(Boolean)
                .slice(0, 3)
            : [
                "What's your rough budget for this project?",
                "Do you have a deadline or go-live date in mind?",
                "Is there existing branding/design to work within, or is that in scope too?",
            ];
        const questionBlock = questions.map((q) => `- ${q}`).join("\n");
        let body;
        if (mode === "reply_and_book") {
            const ctaLine = schedulingLink
                ? `If that sounds useful, you can grab a time here: ${schedulingLink}`
                : "If that sounds useful, happy to find 20–30 minutes that works — just let me know what days suit you.";
            body = `Hi ${clientName},

Thanks for reaching out. The ${enquirySummary} sounds like something I could help with.

Before I put anything together, it'd be useful to hear a bit more about the brief — what you're trying to achieve, timeline, and any constraints. A short call is usually the quickest way to get aligned.

${ctaLine}

${yourName}`;
        }
        else {
            const ctaLine = schedulingLink
                ? `Once I have a clearer picture I'll suggest a time to talk — or you can book directly here if you'd prefer: ${schedulingLink}`
                : "Once I have a clearer picture, I'll come back with thoughts on how I'd approach it and suggest a time to talk.";
            body = `Hi ${clientName},

Thanks for getting in touch. The ${enquirySummary} sounds interesting — happy to explore it.

Before we jump on a call, a few quick questions to help me understand the scope:

${questionBlock}

${ctaLine}

${yourName}`;
        }
        const email = `Subject: Re: [their subject line / your project reference]

${body}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "payment_overdue_final_notice_email") {
        const clientName = String(args.client_name);
        const invoiceNumber = String(args.invoice_number);
        const amount = String(args.amount);
        const daysOverdue = Number(args.days_overdue);
        const originalDueDate = args.original_due_date ? String(args.original_due_date) : null;
        const paymentDeadlineDays = args.payment_deadline ? Number(args.payment_deadline) : 7;
        const nextStep = args.next_step ? String(args.next_step) : "work_suspension";
        const projectName = args.project_name ? String(args.project_name) : null;
        const paymentLink = args.payment_link ? String(args.payment_link) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const projectRef = projectName ? ` for ${projectName}` : "";
        const dueDateLine = originalDueDate
            ? `Invoice ${invoiceNumber} for ${amount}${projectRef} was due on ${originalDueDate} and is now ${daysOverdue} days overdue.`
            : `Invoice ${invoiceNumber} for ${amount}${projectRef} is now ${daysOverdue} days overdue.`;
        let nextStepLine;
        if (nextStep === "collection_agency") {
            nextStepLine = `If payment is not received within ${paymentDeadlineDays} days, I will refer this debt to a collection agency. At that point the matter will be out of my hands and additional fees may apply.`;
        }
        else if (nextStep === "legal_action") {
            nextStepLine = `If payment is not received within ${paymentDeadlineDays} days, I will pursue this through the appropriate legal channels without further notice.`;
        }
        else {
            nextStepLine = `If payment is not received within ${paymentDeadlineDays} days, I will suspend all current and future work and withhold any outstanding deliverables until the balance is settled.`;
        }
        const paymentLine = paymentLink
            ? `\nTo pay now: ${paymentLink}`
            : "";
        const email = `Subject: Final notice — Invoice ${invoiceNumber} — ${amount} — ${daysOverdue} days overdue

Hi ${clientName},

${dueDateLine} Despite previous reminders, I have not received payment or any communication about when to expect it.

This is a formal final notice.

${nextStepLine}
${paymentLine}
If you have already sent payment or are experiencing a genuine difficulty, please reply to this email immediately so we can resolve it before that deadline.

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "invoice_correction_email") {
        const clientName = String(args.client_name);
        const originalInvoiceNumber = String(args.original_invoice_number);
        const correctedInvoiceNumber = String(args.corrected_invoice_number);
        const correctionDescription = String(args.correction_description);
        const correctAmount = args.correct_amount ? String(args.correct_amount) : null;
        const projectName = args.project_name ? String(args.project_name) : null;
        const paymentDueDate = args.payment_due_date ? String(args.payment_due_date) : null;
        const paymentLink = args.payment_link ? String(args.payment_link) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const projectRef = projectName ? ` for ${projectName}` : "";
        const amountLine = correctAmount
            ? `\nThe correct total is ${correctAmount}.`
            : "";
        const dueLine = paymentDueDate
            ? ` Payment is due on ${paymentDueDate}.`
            : "";
        const paymentLine = paymentLink
            ? `\nTo pay: ${paymentLink}`
            : "";
        const email = `Subject: Corrected invoice — ${correctedInvoiceNumber}${projectRef ? ` — ${projectName}` : ""}

Hi ${clientName},

I'm writing to let you know that invoice ${originalInvoiceNumber} contained an error: ${correctionDescription}.

Please disregard ${originalInvoiceNumber}. I have attached the corrected invoice ${correctedInvoiceNumber} for your records.${amountLine}${dueLine}
${paymentLine}
I apologise for any confusion this causes. Please don't hesitate to reply if you have any questions.

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "bid_lost_follow_up") {
        const clientName = String(args.client_name);
        const projectDescription = String(args.project_description);
        const reasonIfKnown = args.reason_if_known ? String(args.reason_if_known) : null;
        const futureWorkAngle = args.future_work_angle ? String(args.future_work_angle) : "future projects";
        const projectName = args.project_name ? String(args.project_name) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const projectRef = projectName ? projectName : projectDescription;
        let reasonLine = "";
        if (reasonIfKnown) {
            reasonLine = `\nI understand you went with ${reasonIfKnown} — sounds like the right fit for what you needed.`;
        }
        const email = `Subject: Re: ${projectRef}

Hi ${clientName},

Thanks for letting me know. I genuinely enjoyed learning about what you're building, and I hope ${projectDescription} goes well.${reasonLine}

If ${futureWorkAngle} come up where I might be a good fit, I'd love to be considered. No pressure — just wanted to leave the door open.

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "subcontractor_acceptance_email") {
        const primeName = String(args.prime_name);
        const projectDescription = String(args.project_description);
        const yourRole = String(args.your_role);
        const startDate = args.start_date ? String(args.start_date) : null;
        const rateConfirmation = args.rate_confirmation ? String(args.rate_confirmation) : null;
        const pointOfContact = args.point_of_contact ? String(args.point_of_contact) : null;
        const ndaFlag = args.nda_flag ? Boolean(args.nda_flag) : false;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const startLine = startDate
            ? `\nI am available to start ${startDate} and will plan around that.`
            : "";
        const rateLine = rateConfirmation
            ? `\nFor my records: I understand the agreed rate is ${rateConfirmation}.`
            : "";
        const contactLine = pointOfContact
            ? `\nHappy to coordinate directly with ${pointOfContact} — let me know the best way to reach them.`
            : "";
        const ndaLine = ndaFlag
            ? `\nIf you need me to sign a confidentiality agreement or NDA before we kick off, just send it over.`
            : "";
        const email = `Subject: Re: ${projectDescription} — Confirming

Hi ${primeName},

Happy to confirm I am on board for ${projectDescription}, taking care of ${yourRole}.${startLine}${rateLine}${contactLine}${ndaLine}

A few quick housekeeping questions when you get a chance:
- How should I submit invoices, and what is your typical payment timeline?
- Who is my main point of contact for day-to-day questions?
- Is there a brief, assets folder, or anything I should review before the kickoff?

Looking forward to it.

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "rate_card_email") {
        const yourRate = String(args.your_rate);
        const prospectName = args.prospect_name ? String(args.prospect_name) : null;
        const yourSpecialty = args.your_specialty ? String(args.your_specialty) : null;
        const rateContext = args.rate_context ? String(args.rate_context) : null;
        const availability = args.availability ? String(args.availability) : null;
        const nextStep = args.next_step
            ? String(args.next_step)
            : "happy to jump on a quick call to discuss your project — I can give you a more specific number once I know a bit more about the scope";
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const greeting = prospectName ? `Hi ${prospectName},` : "Hi,";
        const specialtyLine = yourSpecialty
            ? `For ${yourSpecialty} work, `
            : "";
        const contextLine = rateContext
            ? ` (${rateContext})`
            : "";
        const availabilityLine = availability
            ? `\n\nI am ${availability}.`
            : "";
        const email = `Subject: Re: Rates

${greeting}

${specialtyLine}my rate is ${yourRate}${contextLine}.${availabilityLine}

If you would like to move forward, I am ${nextStep}.

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "project_scope_acceptance_email") {
        const clientName = String(args.client_name);
        const projectDescription = String(args.project_description);
        const scopeSummary = args.scope_summary ? String(args.scope_summary) : null;
        const timeline = args.timeline ? String(args.timeline) : null;
        const rateSummary = args.rate_summary ? String(args.rate_summary) : null;
        const nextStep = args.next_step
            ? String(args.next_step)
            : "let me know if anything here looks different from what you have in mind and we can sort it before the paperwork arrives";
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const scopeLines = scopeSummary
            ? `\n\nTo confirm the scope:\n${scopeSummary}`
            : "";
        const timelineLine = timeline
            ? `\n\nTimeline: ${timeline}.`
            : "";
        const rateLine = rateSummary
            ? `\n\nRate: ${rateSummary}.`
            : "";
        const email = `Subject: Confirming scope — ${projectDescription}

Hi ${clientName},

Glad we are moving forward with ${projectDescription}. I wanted to drop a quick note to make sure we are aligned on scope before the contract comes through.${scopeLines}${timelineLine}${rateLine}

Happy to ${nextStep}.

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "overdue_project_timeline_update") {
        const clientName = String(args.client_name);
        const originalDeadline = String(args.original_deadline);
        const newDeadline = String(args.new_deadline);
        const projectName = String(args.project_name);
        const delayReason = args.delay_reason ? String(args.delay_reason) : null;
        const mitigation = args.mitigation ? String(args.mitigation) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const reasonLine = delayReason
            ? ` ${delayReason} — it took longer to resolve than I had planned for.`
            : "";
        const mitigationLine = mitigation
            ? ` ${mitigation}.`
            : "";
        const email = `Subject: Updated timeline — ${projectName}

Hi ${clientName},

I wanted to reach out before you had to ask.${projectName ? ` ${projectName}` : " The project"} is running behind the ${originalDeadline} deadline I committed to.${reasonLine}

My revised delivery date is ${newDeadline}.${mitigationLine}

I appreciate your patience and will have it with you by then. If this creates a scheduling issue on your end, let me know and we can talk through it.

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "client_satisfaction_survey_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const surveyLink = args.survey_link ? String(args.survey_link) : null;
        const testimonialAsk = args.testimonial_ask === true;
        const outcomeNote = args.outcome_note ? String(args.outcome_note) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const outcomeLine = outcomeNote
            ? ` ${outcomeNote}, and`
            : "";
        const feedbackLine = surveyLink
            ? `If you have two minutes, I'd love to hear how it went: ${surveyLink}`
            : `If you have two minutes, I'd love to hear how it went — just hit reply with whatever's on your mind.`;
        const testimonialLine = testimonialAsk
            ? `\n\nIf you're happy with how things went, a short sentence or two I can quote on my site would mean a lot — but absolutely no pressure.`
            : "";
        const email = `Subject: How did ${projectName} land?

Hi ${clientName},

Now that ${projectName} is wrapped up, I wanted to check in.${outcomeLine} I hope the work landed well on your end.

${feedbackLine} Your feedback genuinely helps me improve — and I read every reply.${testimonialLine}

Thanks again for the project.

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "draft_invoice") {
        const clientName = String(args.client_name);
        const clientCompany = args.client_company ? String(args.client_company) : null;
        const yourName = String(args.your_name);
        const yourBusinessName = args.your_business_name ? String(args.your_business_name) : null;
        const invoiceNumber = args.invoice_number ? String(args.invoice_number) : "INV-[NUMBER]";
        const invoiceDate = args.invoice_date ? String(args.invoice_date) : "[Date]";
        const dueDateRaw = args.due_date ? String(args.due_date) : "Net 14";
        const currency = args.currency ? String(args.currency) : "$";
        const taxRate = args.tax_rate != null ? Number(args.tax_rate) : null;
        const paymentInstructions = args.payment_instructions
            ? String(args.payment_instructions)
            : "[Insert bank account, PayPal, or payment link]";
        const lineItems = args.line_items;
        const billerLine = yourBusinessName ? `${yourBusinessName} (${yourName})` : yourName;
        const billToLine = clientCompany ? `${clientName}\n${clientCompany}` : clientName;
        let subtotal = 0;
        const rows = lineItems.map((item) => {
            let amount;
            if (item.amount != null) {
                amount = item.amount;
            }
            else if (item.quantity != null && item.rate != null) {
                amount = item.quantity * item.rate;
            }
            else {
                amount = 0;
            }
            subtotal += amount;
            const qtyLabel = item.quantity != null && item.rate != null
                ? `${item.quantity}${item.unit ? " " + item.unit : ""} × ${currency}${item.rate.toFixed(2)}`
                : "Fixed fee";
            return `| ${item.description} | ${qtyLabel} | ${currency}${amount.toFixed(2)} |`;
        });
        const taxAmount = taxRate != null ? subtotal * (taxRate / 100) : 0;
        const total = subtotal + taxAmount;
        const taxLine = taxRate != null
            ? `| **Tax (${taxRate}%)** | | **${currency}${taxAmount.toFixed(2)}** |\n`
            : "";
        const doc = `# INVOICE

---

**Invoice #:** ${invoiceNumber}
**Date:** ${invoiceDate}
**Due:** ${dueDateRaw}

---

**From:**
${billerLine}

**To:**
${billToLine}

---

## Services

| Description | Details | Amount |
|---|---|---|
${rows.join("\n")}
| **Subtotal** | | **${currency}${subtotal.toFixed(2)}** |
${taxLine}| **Total Due** | | **${currency}${total.toFixed(2)}** |

---

## Payment

${paymentInstructions}

Please reference **${invoiceNumber}** when making payment.

---

*Thank you for your business.*`;
        return { content: [{ type: "text", text: doc }] };
    }
    if (name === "contractor_nda_cover_email") {
        const recipientName = String(args.recipient_name);
        const projectDescription = args.project_description ? String(args.project_description) : null;
        const relationship = args.relationship ? String(args.relationship).toLowerCase() : "client";
        const signingMethod = args.signing_method ? String(args.signing_method) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const projectLine = projectDescription
            ? ` for ${projectDescription}`
            : "";
        const contextLine = relationship === "subcontractor"
            ? `Before we kick off, I need to put a standard NDA in place — this keeps the client's information confidential and protects both of us while we work together.`
            : `Before we move forward, I'd like to put a simple NDA in place${projectLine}. It's a standard one-way agreement — it keeps any information I share about my process, pricing, and approach confidential.`;
        const returnLine = signingMethod
            ? `\n\nPlease sign and return it ${signingMethod} when you get a chance.`
            : "\n\nPlease sign and return a copy when you get a chance.";
        const subjectLine = projectDescription
            ? `NDA — ${projectDescription}`
            : "NDA";
        const email = `Subject: ${subjectLine}

Hi ${recipientName},

${contextLine}

I have attached the NDA for your review. It's straightforward — no surprises.${returnLine}

Let me know if you have any questions before signing.

${yourName}`;
        return { content: [{ type: "text", text: email }] };
    }
    if (name === "client_brief_template") {
        const projectType = args.project_type ? String(args.project_type) : null;
        const clientName = args.client_name ? String(args.client_name) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const includeBudget = args.include_budget_question !== false;
        const format = args.format ? String(args.format).toLowerCase() : "email";
        const projectLabel = projectType ? `${projectType} project` : "project";
        const questions = [
            `**1. What does success look like?**
What would make this ${projectLabel} a clear win for you — in specific, measurable terms if possible?`,
            `**2. What problem are we solving?**
What is the core problem this ${projectLabel} needs to fix? What happens if we don't solve it?`,
            `**3. Who is the audience?**
Who will use or see the end result? What do they care about most?`,
            `**4. Scope and deliverables**
What are the specific things you need delivered? Please list everything you expect to receive at the end.`,
            `**5. Timeline**
When do you need this completed? Are there any intermediate milestones or hard deadlines (launches, events, board dates)?`,
            ...(includeBudget
                ? [
                    `**6. Budget range**
What is your budget range for this ${projectLabel}? Knowing this helps me scope the work correctly and avoid proposing something that doesn't fit your constraints.`,
                ]
                : []),
            `**${includeBudget ? 7 : 6}. Decision makers and stakeholders**
Who needs to approve the final deliverable? Is there anyone else whose input will shape the direction?`,
            `**${includeBudget ? 8 : 7}. Existing materials**
Do you have existing brand guidelines, previous work, competitor examples, or inspiration references? Please share anything that will help me understand your style and standards.`,
            `**${includeBudget ? 9 : 8}. Biggest concern**
What is the one thing that would make this ${projectLabel} go wrong? What are you most worried about?`,
        ];
        const questionsText = questions.join("\n\n");
        if (format === "doc") {
            const doc = `# Client Brief — ${projectType ? projectType.charAt(0).toUpperCase() + projectType.slice(1) : "Project"}

Please fill in your answers below. The more detail you provide, the better I can scope and price the work accurately.

---

${questionsText}

---

*Send back to ${yourName} when complete.*`;
            return { content: [{ type: "text", text: doc }] };
        }
        // Email format
        const greeting = clientName ? `Hi ${clientName},` : "Hi,";
        const projectRef = projectType ? ` on the ${projectType}` : "";
        const emailText = `Subject: Quick brief — ${projectType ? projectType : "project"} details

${greeting}

Excited to explore working together${projectRef}. Before I put together a proposal, I need to understand the project properly — a few questions that will help me scope the work and make sure my proposal actually fits what you need.

${questionsText}

No need to write essays — bullet points are fine. Once I have your answers I'll come back with a clear proposal and timeline.

${yourName}`;
        return { content: [{ type: "text", text: emailText }] };
    }
    if (name === "payment_reminder_email") {
        const clientName = String(args.client_name);
        const amountDue = String(args.amount_due);
        const invoiceNumber = args.invoice_number ? String(args.invoice_number) : null;
        const dueDate = args.due_date ? String(args.due_date) : null;
        const daysOverdue = args.days_overdue ? Number(args.days_overdue) : null;
        const paymentMethod = args.payment_method ? String(args.payment_method) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        let tone = args.tone ? String(args.tone).toLowerCase() : null;
        if (!tone) {
            if (daysOverdue === null || daysOverdue <= 7)
                tone = "friendly";
            else if (daysOverdue <= 21)
                tone = "firm";
            else
                tone = "final";
        }
        const invoiceRef = invoiceNumber ? ` (${invoiceNumber})` : "";
        const dueDateRef = dueDate ? ` due ${dueDate}` : "";
        const paymentLine = paymentMethod
            ? `\n\nPayment details: ${paymentMethod}. Please confirm once sent.`
            : "\n\nPlease confirm once payment has been sent.";
        let subject;
        let body;
        if (tone === "friendly") {
            subject = `Quick follow-up — invoice${invoiceRef} for ${amountDue}`;
            body = `Hi ${clientName},

Just a quick note to follow up on invoice${invoiceRef} for ${amountDue}${dueDateRef}. I know things get busy — wanted to make sure it didn't slip through the cracks.

If you have any questions about the invoice or the work it covers, I'm happy to help.${paymentLine}

Thanks in advance,
${yourName}`;
        }
        else if (tone === "firm") {
            subject = `Payment overdue — invoice${invoiceRef} for ${amountDue}`;
            body = `Hi ${clientName},

I'm following up again on invoice${invoiceRef} for ${amountDue}${dueDateRef}, which is now overdue.

I'd appreciate payment as soon as possible. If there's a hold-up on your end or anything I can clarify, please let me know and we can sort it out quickly.${paymentLine}

${yourName}`;
        }
        else {
            // final
            subject = `Final notice — invoice${invoiceRef} for ${amountDue}`;
            body = `Hi ${clientName},

This is a final notice regarding invoice${invoiceRef} for ${amountDue}${dueDateRef}, which remains unpaid.

I need to resolve this within the next 5 business days. If I don't hear back, I'll need to pursue other options to recover the outstanding amount.

If there's a specific issue with the invoice or the work, please contact me immediately so we can resolve it directly.${paymentLine}

${yourName}`;
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "project_pause_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const reason = args.reason ? String(args.reason) : null;
        const resumeDate = args.resume_date ? String(args.resume_date) : null;
        const completedSoFar = args.completed_so_far ? String(args.completed_so_far) : null;
        const actionItems = args.action_items ? String(args.action_items) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const reasonLine = reason ? `\n\nAs discussed, ${reason}.` : "";
        const completedLine = completedSoFar
            ? `\n\nTo recap where we've got to: ${completedSoFar}.`
            : "";
        const resumeLine = resumeDate
            ? `I've noted ${resumeDate} as the target restart date.`
            : "Once you're ready to pick things back up, just drop me a line and we'll agree a restart date.";
        const actionLine = actionItems
            ? `\n\nIn the meantime: ${actionItems}.`
            : "";
        const subject = `Pausing ${projectName} — resuming ${resumeDate ? resumeDate : "when you're ready"}`;
        const body = `Hi ${clientName},${reasonLine}

Following our conversation, I'm confirming that we're putting ${projectName} on hold for now.${completedLine}

${resumeLine}${actionLine}

Everything is documented and in good shape — there'll be no loss of context when we pick this back up. Feel free to reach out any time in the meantime.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "referral_thank_you_email") {
        const referrerName = String(args.referrer_name);
        const newClientName = String(args.new_client_name);
        const projectType = args.project_type ? String(args.project_type) : null;
        const outcome = args.outcome ? String(args.outcome) : null;
        const offerBack = args.offer_back === true;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const projectLine = projectType
            ? ` for the ${projectType}`
            : "";
        const outcomeLine = outcome
            ? `\n\n${outcome.charAt(0).toUpperCase() + outcome.slice(1)} — exactly the kind of work I enjoy.`
            : "";
        const reciprocityLine = offerBack
            ? `\n\nIf you ever come across someone who could use my help in return, or if there's anything I can do to support your work, please don't hesitate to ask.`
            : "";
        const subject = `Thank you for the introduction`;
        const body = `Hi ${referrerName},

I just wanted to say thank you for introducing me to ${newClientName}${projectLine}. I really appreciate you thinking of me.${outcomeLine}

Referrals from people I trust and respect mean a great deal — thank you for putting your name to it.${reciprocityLine}

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "retainer_proposal") {
        const clientName = String(args.client_name);
        const monthlyHours = Number(args.monthly_hours);
        const monthlyFee = String(args.monthly_fee);
        const scopeSummary = args.scope_summary ? String(args.scope_summary) : null;
        const rollover = args.rollover === true;
        const noticePeriod = args.notice_period ? String(args.notice_period) : "30 days";
        const startDate = args.start_date ? String(args.start_date) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const scopeLine = scopeSummary
            ? `covering ${scopeSummary}`
            : "covering ongoing support across the areas we've been working on";
        const rolloverLine = rollover
            ? "Any unused hours carry over to the following month."
            : "Hours are allocated monthly and don't carry over, so there's an incentive for both of us to use them well.";
        const startLine = startDate
            ? `If this works for you, I'd suggest starting from ${startDate}.`
            : "If this works for you, let me know and we can agree a start date.";
        const subject = `Retainer proposal — ${monthlyHours} hours/month`;
        const body = `Hi ${clientName},

I've really enjoyed the work we've done together, and I'd love to propose a way to make our collaboration more consistent.

I'm suggesting a monthly retainer of ${monthlyFee}, ${scopeLine}. In practical terms, that means I reserve ${monthlyHours} hours a month exclusively for you — you get priority access and a predictable partner without having to re-brief me each time; I get the stability to plan my calendar around your needs.

Here's how it would work:
- ${monthlyHours} hours/month reserved for you at ${monthlyFee}
- ${rolloverLine}
- Either side can end the arrangement with ${noticePeriod}'s notice

${startLine}

Happy to jump on a call to talk through the details, or answer any questions by email if that's easier.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "podcast_pitch_email") {
        const podcastName = String(args.podcast_name);
        const hostName = String(args.host_name);
        const episodeAngle = String(args.episode_angle);
        const whyAudience = String(args.why_their_audience);
        const credential = String(args.your_credential);
        const episodeRef = args.episode_reference ? String(args.episode_reference) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const episodeLine = episodeRef
            ? `\n\nI've been following ${podcastName} for a while — ${episodeRef} particularly resonated with me.`
            : "";
        const subject = `Guest pitch: ${episodeAngle}`;
        const body = `Hi ${hostName},${episodeLine}

I wanted to pitch an episode angle I think would land well with your audience: **${episodeAngle}**.

${whyAudience}

Quick background on me: ${credential}.

I'm happy to keep it conversational — no slides, no scripted points. If this sounds like a fit, I'd love to send a few more specific hooks or jump on a quick 15-minute call to see if the chemistry is there.

No pressure either way — thanks for building a show worth pitching to.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "guest_post_pitch") {
        const publicationName = String(args.publication_name);
        const articleAngle = String(args.article_angle);
        const editorName = args.editor_name ? String(args.editor_name) : null;
        const whyReaders = args.why_their_readers ? String(args.why_their_readers) : null;
        const credential = args.your_credential ? String(args.your_credential) : null;
        const proposedTitle = args.proposed_title ? String(args.proposed_title) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const greeting = editorName ? `Hi ${editorName},` : `Hi,`;
        const titleLine = proposedTitle
            ? `Working title: **"${proposedTitle}"**\n\nAngle: ${articleAngle}`
            : `Angle: ${articleAngle}`;
        const readersLine = whyReaders
            ? `\n\n${whyReaders}`
            : "";
        const credentialLine = credential
            ? `\n\nA little background: ${credential}.`
            : "";
        const subject = proposedTitle
            ? `Guest post pitch: "${proposedTitle}"`
            : `Guest post pitch for ${publicationName}`;
        const body = `${greeting}

I'd love to contribute a guest article to ${publicationName}.

${titleLine}${readersLine}${credentialLine}

I can deliver a polished 800–1,200-word draft within a week of a green light, matched to your style guide and ready to publish with minimal editing.

Would this be a fit? Happy to adjust the angle or send an outline first if that's more useful.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "late_payment_escalation_email") {
        const clientName = String(args.client_name);
        const amountDue = String(args.amount_due);
        const invoiceNumber = args.invoice_number ? String(args.invoice_number) : null;
        const dueDate = args.due_date ? String(args.due_date) : null;
        const daysOverdue = args.days_overdue ? Number(args.days_overdue) : null;
        const route = args.escalation_route ? String(args.escalation_route).toLowerCase() : "legal";
        const seniorName = args.senior_contact_name ? String(args.senior_contact_name) : null;
        const seniorRole = args.senior_contact_role ? String(args.senior_contact_role) : "senior team";
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const invoiceRef = invoiceNumber ? ` (${invoiceNumber})` : "";
        const dueDateRef = dueDate ? `, due ${dueDate}` : "";
        const overdueRef = daysOverdue ? ` — now ${daysOverdue} days overdue` : "";
        let subject;
        let body;
        if (route === "manager") {
            const greeting = seniorName ? `Hi ${seniorName},` : `Hi,`;
            const roleRef = seniorRole ? ` as ${seniorRole}` : "";
            subject = `Escalation: unpaid invoice${invoiceRef} for ${amountDue} — ${clientName}`;
            body = `${greeting}

I'm writing to you${roleRef} regarding an unpaid invoice addressed to ${clientName}.

Invoice${invoiceRef} for ${amountDue}${dueDateRef} remains outstanding${overdueRef}. I have sent multiple payment reminders without receiving a response or payment.

I am escalating this to you in the hope of resolving the matter quickly and directly before taking further action. Please can you confirm the payment status and, if there is a dispute or delay, let me know so we can address it?

If I do not hear back within 5 business days I will have no option but to pursue formal recovery.

${yourName}`;
        }
        else if (route === "agency") {
            subject = `Notice: overdue invoice${invoiceRef} for ${amountDue} referred to collections`;
            body = `Hi ${clientName},

I am writing to inform you that invoice${invoiceRef} for ${amountDue}${dueDateRef}${overdueRef} has been referred to a debt collection agency.

You will be contacted by them directly. Their fees and any interest accrued may be added to the outstanding balance.

If you wish to resolve this directly before the agency makes contact, please reply to this email immediately.

${yourName}`;
        }
        else {
            // legal (default)
            subject = `Pre-action notice: unpaid invoice${invoiceRef} — ${amountDue}`;
            body = `Hi ${clientName},

This is a formal pre-action notice regarding invoice${invoiceRef} for ${amountDue}${dueDateRef}, which remains unpaid${overdueRef}.

Previous reminders have received no response and no payment has been received. I am now giving formal notice that if payment is not received within 7 days of this email, I will commence proceedings to recover the outstanding amount through the appropriate legal channels, which may include a claim in the small claims court and recovery of associated costs.

If you believe there is a dispute or error, please contact me immediately to resolve it. Otherwise, please arrange payment within the stated timeframe to avoid further action.

${yourName}`;
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "client_offboarding_checklist_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const deliverablesSummary = String(args.deliverables_summary);
        const assetsToTransfer = args.assets_to_transfer ? String(args.assets_to_transfer) : null;
        const clientActions = args.client_actions ? String(args.client_actions) : null;
        const yourActions = args.your_actions ? String(args.your_actions) : null;
        const accessToRevoke = args.access_to_revoke ? String(args.access_to_revoke) : null;
        const testimonialAsk = args.testimonial_ask !== false;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const transferList = assetsToTransfer
            ? assetsToTransfer.split(",").map((s) => s.trim()).filter(Boolean)
            : [];
        const clientActionList = clientActions
            ? clientActions.split(",").map((s) => s.trim()).filter(Boolean)
            : [];
        const yourActionList = yourActions
            ? yourActions.split(",").map((s) => s.trim()).filter(Boolean)
            : [];
        const revokeList = accessToRevoke
            ? accessToRevoke.split(",").map((s) => s.trim()).filter(Boolean)
            : [];
        const transferSection = transferList.length > 0
            ? `\n\n**Assets and files being transferred:**\n${transferList.map((a) => `☐  ${a}`).join("\n")}`
            : "";
        const clientActionsSection = clientActionList.length > 0
            ? `\n\n**Action items for you:**\n${clientActionList.map((a) => `☐  ${a}`).join("\n")}`
            : "";
        const yourActionsSection = yourActionList.length > 0
            ? `\n\n**Still to come from my side:**\n${yourActionList.map((a) => `☐  ${a}`).join("\n")}`
            : "";
        const revokeSection = revokeList.length > 0
            ? `\n\n**Access I will be removing:**\n${revokeList.map((a) => `•  ${a}`).join("\n")}`
            : "";
        const testimonialSection = testimonialAsk
            ? `\n\nIt has been a pleasure working on ${projectName} with you. If you have a moment, a short testimonial or LinkedIn recommendation would mean a great deal — it helps other clients find me and understand the kind of work I do.`
            : "";
        const subject = `Project close: ${projectName} — handover checklist`;
        const body = `Hi ${clientName},

As we wrap up ${projectName}, I wanted to send a clear handover summary so we both have everything in one place.

**What was delivered:**
${deliverablesSummary}${transferSection}${clientActionsSection}${yourActionsSection}${revokeSection}

Please review the items above and let me know if anything is missing or needs clarification. Once the checklist is clear on both sides, the engagement will be formally closed.${testimonialSection}

Thank you for working with me on this.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "testimonial_request_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const resultAchieved = String(args.result_achieved);
        const testimonialType = args.testimonial_type ? String(args.testimonial_type) : "testimonial";
        const anglePrompt = args.angle_prompt ? String(args.angle_prompt) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const typeLabel = testimonialType === "linkedin_recommendation"
            ? "a LinkedIn recommendation"
            : testimonialType === "case_study"
                ? "a short case study quote"
                : testimonialType === "google_review"
                    ? "a Google review"
                    : "a short testimonial";
        const typeDestination = testimonialType === "linkedin_recommendation"
            ? "on LinkedIn"
            : testimonialType === "google_review"
                ? "on Google"
                : "on my website";
        const promptSection = anglePrompt
            ? `\n\nIf it helps to have a starting point, here's one angle that might be easy to write to:\n\n_"${anglePrompt}"_\n\nA sentence or two is plenty — honestly anything you're comfortable sharing is great.`
            : "\n\nA sentence or two is plenty — even a quick 'here's the problem we were solving and what the outcome was' would be brilliant.";
        const subject = `A quick favour — testimonial for ${projectName}?`;
        const body = `Hi ${clientName},

Now that we've wrapped up ${projectName}, I wanted to reach out about something.

${resultAchieved} — I'm really glad the project landed that way, and I've genuinely enjoyed working with you on it.

I'm trying to grow my practice through word of mouth and I'd love to add a ${typeLabel} from you${typeDestination !== "on my website" ? ` ${typeDestination}` : " to my website"}. It makes a big difference when prospective clients can hear directly from someone who's done the work with me.${promptSection}

Completely no pressure — if timing is off or it's not something you're comfortable with, please don't give it a second thought. But if you are happy to help, I'd really appreciate it.

Thank you again for the trust you placed in me during ${projectName}.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "service_package_email") {
        const prospectName = String(args.prospect_name);
        const serviceType = String(args.service_type);
        const pkg1Name = String(args.package_1_name);
        const pkg1Price = String(args.package_1_price);
        const pkg1Includes = String(args.package_1_includes);
        const pkg2Name = args.package_2_name ? String(args.package_2_name) : null;
        const pkg2Price = args.package_2_price ? String(args.package_2_price) : null;
        const pkg2Includes = args.package_2_includes ? String(args.package_2_includes) : null;
        const pkg3Name = args.package_3_name ? String(args.package_3_name) : null;
        const pkg3Price = args.package_3_price ? String(args.package_3_price) : null;
        const pkg3Includes = args.package_3_includes ? String(args.package_3_includes) : null;
        const recommendedPackage = args.recommended_package ? String(args.recommended_package) : null;
        const pitchContext = args.pitch_context ? String(args.pitch_context) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const packages = [];
        const recommendedNote = (pkgName) => recommendedPackage && pkgName.toLowerCase() === recommendedPackage.toLowerCase()
            ? " *(most popular)*"
            : "";
        packages.push(`**${pkg1Name} — ${pkg1Price}**${recommendedNote(pkg1Name)}\n${pkg1Includes}`);
        if (pkg2Name && pkg2Price && pkg2Includes) {
            packages.push(`**${pkg2Name} — ${pkg2Price}**${recommendedNote(pkg2Name)}\n${pkg2Includes}`);
        }
        if (pkg3Name && pkg3Price && pkg3Includes) {
            packages.push(`**${pkg3Name} — ${pkg3Price}**${recommendedNote(pkg3Name)}\n${pkg3Includes}`);
        }
        const contextLine = pitchContext
            ? `${pitchContext} — so I wanted to share how I typically structure my ${serviceType} work.`
            : `I wanted to give you a clear picture of how I structure my ${serviceType} work.`;
        const recommendLine = recommendedPackage
            ? `\nFor most clients in your position, the ${recommendedPackage} tends to be the right fit — but I'm happy to tailor any of these if your scope is slightly different.\n`
            : "";
        const subject = `${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} packages — options for you`;
        const body = `Hi ${prospectName},

${contextLine}

Here are the three options I offer:

${packages.join("\n\n")}
${recommendLine}
Happy to jump on a quick call to talk through which makes the most sense for where you are — or if you have questions just reply here.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "client_material_chase_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const whatIsNeeded = String(args.what_is_needed);
        const originalDueDate = args.original_due_date ? String(args.original_due_date) : null;
        const daysOverdue = typeof args.days_overdue === "number" ? args.days_overdue : 0;
        const impact = args.impact ? String(args.impact) : null;
        const newDeadline = args.new_deadline ? String(args.new_deadline) : null;
        const yourName = args.your_name ? String(args.your_name) : "Thanks";
        const dueDateLine = originalDueDate
            ? ` I was expecting to receive this by ${originalDueDate}.`
            : "";
        const impactLine = impact
            ? `\n\nTo give you the full picture: ${impact}.`
            : "";
        const deadlineLine = newDeadline
            ? `\n\nIf I could receive everything by ${newDeadline}, we can stay on track.`
            : "";
        let opening;
        let tone;
        if (daysOverdue >= 15) {
            opening = `I need to flag that ${projectName} is now significantly delayed while I wait for materials from your side.`;
            tone = `This is now causing a real impact on the timeline and my schedule. I'd like to resolve this quickly so we can move forward — but I'll need to hear from you by end of this week, or we'll need to have a conversation about rescheduling.`;
        }
        else if (daysOverdue >= 6) {
            opening = `I'm following up on the materials I need to continue ${projectName}.`;
            tone = `I want to make sure we stay on track — the longer this waits, the harder it is to meet our agreed deadline.`;
        }
        else {
            opening = `Just a quick nudge on the materials I need to move forward with ${projectName}.`;
            tone = `No pressure — I know things get busy. Just wanted to make sure this hadn't slipped through.`;
        }
        const body = `Hi ${clientName},

${opening}

I'm still waiting on: **${whatIsNeeded}**.${dueDateLine}${impactLine}${deadlineLine}

${tone}

Could you let me know when I can expect this, or flag if anything has changed on your end?

${yourName}`;
        const subject = `${projectName} — materials needed to continue`;
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "mid_project_cancellation_response_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const workCompleted = String(args.work_completed);
        const killFeeAmount = args.kill_fee_amount ? String(args.kill_fee_amount) : null;
        const killFeeClause = args.kill_fee_clause ? String(args.kill_fee_clause) : null;
        const finalInvoiceTotal = args.final_invoice_total ? String(args.final_invoice_total) : null;
        const assetsToHandover = args.assets_to_handover ? String(args.assets_to_handover) : null;
        const yourName = args.your_name ? String(args.your_name) : "Thanks";
        const killFeeLine = killFeeAmount
            ? `\n\n${killFeeClause ? `${killFeeClause.charAt(0).toUpperCase() + killFeeClause.slice(1)}, a` : "A"} kill fee of ${killFeeAmount} applies to cover the work already invested and the schedule slot reserved for this project.`
            : "";
        const invoiceLine = finalInvoiceTotal
            ? `\n\nI'll send a final invoice for ${finalInvoiceTotal} shortly — please let me know if you have any questions about the breakdown.`
            : "\n\nI'll send a final invoice for work completed — please let me know if you have any questions.";
        const handoverLine = assetsToHandover
            ? `\n\nI'll package up ${assetsToHandover} and send everything across so you can continue with another provider if needed.`
            : "";
        const body = `Hi ${clientName},

Thank you for letting me know. I'm sorry to hear ${projectName} won't be moving forward — I understand these decisions happen.

To confirm, here's where we stand: I've completed ${workCompleted}.${killFeeLine}${invoiceLine}${handoverLine}

It's been a pleasure working with you. I hope we get the chance to work together again in the future — feel free to reach out if anything changes.

${yourName}`;
        const subject = `Re: ${projectName} — project cancellation confirmed`;
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "working_agreement_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const channel = args.communication_channel ? String(args.communication_channel) : "email";
        const responseTime = args.response_time ? String(args.response_time) : "within one business day";
        const revisionRounds = args.revision_rounds ? String(args.revision_rounds) : null;
        const signOff = args.sign_off_process ? String(args.sign_off_process) : "a reply email confirming approval";
        const meetings = args.meeting_cadence ? String(args.meeting_cadence) : "as needed by mutual agreement";
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const revisionsLine = revisionRounds
            ? `\n- **Revisions:** ${revisionRounds.charAt(0).toUpperCase() + revisionRounds.slice(1)}.`
            : "";
        const subject = `How we'll work together — ${projectName}`;
        const body = `Hi ${clientName},

Now that we're getting started on ${projectName}, I wanted to share a quick note on how I prefer to work — just so we're on the same page from day one.

**Communication:** I'll keep all project updates and questions to ${channel}. Please do the same where possible — it keeps everything in one place and means nothing gets missed.

**Response times:** During business hours, I aim to reply ${responseTime}. I'm not always reachable outside those hours, but I'll flag if anything urgent is coming up on my end.

**Sign-off:** Before I move to the next phase, I'll need ${signOff}. This keeps us both protected and means there are no surprises later.${revisionsLine}

**Meetings:** ${meetings.charAt(0).toUpperCase() + meetings.slice(1)}.

None of this is meant to be rigid — if something comes up and you need to reach me urgently, just say so. I wanted to put this in writing so we both have a clear baseline.

Looking forward to the project.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "scope_creep_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const scopeChange = String(args.scope_change_description);
        const originalScope = args.original_scope_note ? String(args.original_scope_note) : null;
        const quotedFee = args.quoted_fee ? String(args.quoted_fee) : null;
        const timelineImpact = args.timeline_impact ? String(args.timeline_impact) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const scopeLine = originalScope
            ? `Just to clarify: ${originalScope}. ${scopeChange.charAt(0).toUpperCase() + scopeChange.slice(1)} sits outside that boundary.`
            : `${scopeChange.charAt(0).toUpperCase() + scopeChange.slice(1)} falls outside the scope we agreed for ${projectName}, so it would be treated as additional work.`;
        const feeSection = quotedFee
            ? `I'd be happy to take this on as a change order. The additional work would be ${quotedFee}.${timelineImpact ? ` It would also ${timelineImpact}.` : ""} Let me know if you'd like to proceed and I'll get it added formally.`
            : `I'd be happy to take this on as a change order. Let me put together a quick quote for you — I'll have that across shortly.${timelineImpact ? ` Note that adding this work will ${timelineImpact}, so it may be worth factoring that into your planning.` : ""}`;
        const subject = `Re: ${projectName} — scope change`;
        const body = `Hi ${clientName},

Thanks for flagging this. ${scopeLine}

${feeSection}

If you'd prefer to keep the current project on track and revisit this separately afterwards, that works too — just let me know which direction suits you best.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "project_status_update_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const completed = String(args.completed);
        const inProgress = args.in_progress ? String(args.in_progress) : null;
        const comingNext = args.coming_next ? String(args.coming_next) : null;
        const blockers = args.blockers ? String(args.blockers) : null;
        const itemsNeeded = args.items_needed ? String(args.items_needed) : null;
        const timelineStatus = args.timeline_status ? String(args.timeline_status) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const timelineLines = {
            ahead: `Timeline: Ahead of schedule — we're making good progress.`,
            at_risk: `Timeline: At risk — flagging early so we can course-correct. See blockers below.`,
            delayed: `Timeline: Behind schedule. ${blockers ? "See blockers below for detail." : "I'll have a revised timeline across to you shortly."}`,
        };
        const completedFormatted = completed
            .split(/[,\n]/)
            .map((s) => s.trim())
            .filter(Boolean)
            .map((s) => `• ${s}`)
            .join("\n");
        const inProgressSection = inProgress
            ? `\nIn progress:\n${inProgress.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).map((s) => `• ${s}`).join("\n")}`
            : "";
        const comingNextSection = comingNext
            ? `\nComing next:\n${comingNext.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).map((s) => `• ${s}`).join("\n")}`
            : "";
        const blockersSection = blockers
            ? `\nBlockers:\n${blockers.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).map((s) => `• ${s}`).join("\n")}`
            : "";
        const itemsNeededSection = itemsNeeded
            ? `\nNeeded from you:\n${itemsNeeded.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).map((s) => `• ${s}`).join("\n")}`
            : "";
        const timelineLine = timelineStatus && timelineLines[timelineStatus]
            ? `\n${timelineLines[timelineStatus]}`
            : "";
        const subject = `${projectName} — project update`;
        const body = `Hi ${clientName},

Quick update on ${projectName}.

Completed:
${completedFormatted}${inProgressSection}${comingNextSection}${blockersSection}${itemsNeededSection}${timelineLine}

Let me know if you have any questions.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "change_order_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const changeDescription = String(args.change_description);
        const additionalCost = String(args.additional_cost);
        const additionalTimeline = args.additional_timeline ? String(args.additional_timeline) : null;
        const impactOnExistingWork = args.impact_on_existing_work ? String(args.impact_on_existing_work) : null;
        const approvalMethod = args.approval_method ? String(args.approval_method) : "Reply to this email with your approval";
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const timelineSection = additionalTimeline
            ? `\nTimeline: ${additionalTimeline}`
            : "";
        const impactSection = impactOnExistingWork
            ? `\nImpact on current project: ${impactOnExistingWork}`
            : "";
        const subject = `Change order — ${projectName}`;
        const body = `Hi ${clientName},

Following on from our conversation, I've put together a change order for the additional work on ${projectName}.

Change: ${changeDescription}

Cost: ${additionalCost}${timelineSection}${impactSection}

To keep things clean and avoid any confusion, I'd like your written sign-off before I begin. ${approvalMethod} and I'll get started.

Happy to answer any questions in the meantime.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "budget_negotiation_email") {
        const clientName = String(args.client_name);
        const quotedPrice = String(args.your_quoted_price);
        const clientBudget = String(args.client_budget);
        const responseRoute = String(args.response_route);
        const projectName = args.project_name ? String(args.project_name) : "the project";
        const whatCanBeCut = args.what_can_be_cut ? String(args.what_can_be_cut) : null;
        const middleGroundOffer = args.middle_ground_offer ? String(args.middle_ground_offer) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const subject = `Re: ${projectName} — budget`;
        let body;
        if (responseRoute === "scope_reduction") {
            const cutSection = whatCanBeCut
                ? `\nTo bring ${projectName} within your budget, here's what I could adjust:\n\n${whatCanBeCut}\n\nThat gets us to a scope I can deliver at ${clientBudget}. The items removed can be picked up in a follow-on phase when budget allows.`
                : `\nTo bring things within your budget, I could trim the scope — reducing the deliverables to the core essentials and deferring the rest to a phase 2. That would let you move forward now without compromising on quality for what matters most. I can put together a revised brief if you'd like to see exactly what that looks like.`;
            body = `Hi ${clientName},

Thanks for being upfront about the budget — I appreciate it.

My quote for ${projectName} came to ${quotedPrice}. I understand that's above where you are at ${clientBudget}.

I don't reduce my rate, but I can reduce scope.${cutSection}

Let me know if you'd like me to put together a revised proposal based on a tighter scope, or if you'd prefer to revisit when the budget is available. Either way, no pressure.

${yourName}`;
        }
        else if (responseRoute === "hold_rate") {
            body = `Hi ${clientName},

Thanks for coming back to me on this.

I hear you on the budget — ${clientBudget} is a fair way from my quote of ${quotedPrice} for ${projectName}, and I want to be straight with you rather than dance around it.

My rate reflects the level of work and the results I deliver. I'm not in a position to move on price, and I'd rather be honest about that now than start a project where one of us isn't fully comfortable with the arrangement.

If your budget opens up down the track, I'd genuinely love to work on this with you — it's the kind of project I enjoy. In the meantime, happy to point you toward someone who might be a better fit for your current budget if that would help.

No hard feelings either way.

${yourName}`;
        }
        else {
            // middle_ground
            const offerSection = middleGroundOffer
                ? `\nHere's what I'm thinking: ${middleGroundOffer}.`
                : `\nOne option worth considering: we phase the project so you're not carrying the full cost upfront. We'd start with the highest-priority elements now, then continue once budget allows. You get momentum, I get a fair rate — and neither of us is stretched.`;
            body = `Hi ${clientName},

Thanks for being open about where you're at. ${quotedPrice} vs ${clientBudget} is a real gap, and I'd rather find a path forward than just say no.${offerSection}

That said, I want to make sure this works for both of us — not just get the project started. Let me know if the above sounds workable, or if you'd like to talk through it. I'm open to a quick call if it's easier.

${yourName}`;
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "deliverables_sign_off_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const whatWasDelivered = String(args.what_was_delivered);
        const reviewDeadline = args.review_deadline ? String(args.review_deadline) : "within 5 business days";
        const nextStep = args.next_step ? String(args.next_step) : "I'll send the final invoice";
        const approvalMethod = args.approval_method ? String(args.approval_method) : "reply to this email with your approval";
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const subject = `${projectName} — sign-off`;
        const body = `Hi ${clientName},

${projectName} is complete. Here's what I'm asking you to formally sign off on:

${whatWasDelivered}

Please review and ${approvalMethod} ${reviewDeadline}. Once I have your written approval, ${nextStep}.

If anything needs adjusting before you sign off, let me know — I'd rather fix it now than have it sitting in the background after the project is officially closed.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "discovery_call_no_show_email") {
        const clientName = String(args.client_name);
        const callTime = args.call_time ? String(args.call_time) : null;
        const noShowCount = args.no_show_count ? Number(args.no_show_count) : 1;
        const rescheduleLink = args.reschedule_link ? String(args.reschedule_link) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const callTimeRef = callTime ? ` for ${callTime}` : "";
        const rescheduleMethod = rescheduleLink
            ? `If you'd like to rebook, you can grab a time here: ${rescheduleLink}.`
            : "If you'd still like to chat, just reply and we can find a new time.";
        let subject;
        let body;
        if (noShowCount >= 2) {
            subject = `Re: our call`;
            body = `Hi ${clientName},

I had us booked in${callTimeRef} and didn't hear from you — this is the second time we've missed each other, so I'm going to close out the booking for now.

If the timing wasn't right or something changed on your end, no problem at all. If you'd like to revisit things down the track, I'm happy to reconnect — just drop me a line when you're ready.

Wishing you well in the meantime.

${yourName}`;
        }
        else {
            subject = `Missed our call`;
            body = `Hi ${clientName},

We had a call booked${callTimeRef} — I waited a few minutes but didn't hear from you, so I'll assume something came up.

No stress — these things happen. ${rescheduleMethod}

Looking forward to speaking when the timing works.

${yourName}`;
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "price_increase_email") {
        const clientName = String(args.client_name);
        const newRate = String(args.new_rate);
        const effectiveDate = String(args.effective_date);
        const currentRate = args.current_rate ? String(args.current_rate) : null;
        const rateType = args.rate_type ? String(args.rate_type) : null;
        const scenario = args.scenario ? String(args.scenario) : "advance_notice";
        const projectName = args.project_name ? String(args.project_name) : null;
        const reason = args.reason ? String(args.reason) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const rateLabel = rateType === "hourly" ? "hourly rate" : rateType === "daily" ? "day rate" : rateType === "project" ? "project rate" : "rate";
        const rateContext = currentRate
            ? `from ${currentRate} to ${newRate}`
            : `to ${newRate}`;
        const reasonLine = reason ? `\n\nThis reflects ${reason}.` : "";
        const projectRef = projectName ? ` for ${projectName}` : "";
        let subject;
        let body;
        if (scenario === "retainer_renewal") {
            subject = `Updated ${rateLabel} — ${projectName ?? "retainer renewal"}`;
            body = `Hi ${clientName},

As we head into the next period${projectRef}, I wanted to give you advance notice that my ${rateLabel} will be moving ${rateContext} from ${effectiveDate}.${reasonLine}

I've genuinely enjoyed working together and I'd like to continue — I just want to make sure we're on the same page before the next cycle starts. If you'd like to discuss what that looks like going forward, I'm happy to have a quick call.

Let me know either way.

${yourName}`;
        }
        else if (scenario === "mid_project") {
            subject = `Rate update — ${projectName ?? "our current project"}`;
            body = `Hi ${clientName},

I want to be upfront with you about something: I need to update my ${rateLabel} to ${newRate} effective ${effectiveDate}, including for the remaining work on ${projectName ?? "our current project"}.${reasonLine}

I know this isn't ideal timing and I wouldn't raise it mid-project without good reason. Work completed to date stays billed at the existing rate — the new rate applies only from ${effectiveDate} forward.

If you'd like to talk through it, I'm available for a call this week. I want to finish the project well and I'd rather have this conversation now than have it create friction later.

${yourName}`;
        }
        else {
            // advance_notice (default)
            subject = `Updated ${rateLabel} from ${effectiveDate}`;
            body = `Hi ${clientName},

I wanted to give you a heads-up that my ${rateLabel} is increasing ${rateContext}, effective ${effectiveDate}.${reasonLine}

Any work booked and agreed before that date stays at the current rate. Going forward from ${effectiveDate}, new projects and engagements will be at ${newRate}.

I've really valued working with you and hope we'll continue — just wanted to make sure you had plenty of notice to plan ahead.

If you have anything in mind before the change kicks in, now's a good time to lock it in.

${yourName}`;
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "availability_announcement_email") {
        const availabilityWindow = String(args.availability_window);
        const recipientName = args.recipient_name ? String(args.recipient_name) : null;
        const servicesOffered = args.services_offered ? String(args.services_offered) : null;
        const projectType = args.project_type ? String(args.project_type) : null;
        const maxProjects = args.max_projects ? String(args.max_projects) : null;
        const cta = args.cta ? String(args.cta) : null;
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const greeting = recipientName ? `Hi ${recipientName},` : "Hi,";
        const workDescription = servicesOffered
            ? `${servicesOffered}${projectType ? ` — specifically ${projectType}` : ""}`
            : projectType
                ? projectType
                : "new project work";
        const slotsNote = maxProjects
            ? `I have ${maxProjects} opening ${availabilityWindow}`
            : `I have some availability opening ${availabilityWindow}`;
        const ctaLine = cta
            ? cta
            : "reply if you have something in mind, or if you know someone who might — I'd appreciate the introduction";
        const subject = `Available for new projects ${availabilityWindow}`;
        const body = `${greeting}

${slotsNote} and I'm looking to take on ${workDescription}.

I wanted to reach out to you first before opening it up more broadly — you already know how I work, and I'd rather build on that than start from scratch with someone new.

If you have something coming up, or know someone who does, I'd love to hear about it. Feel free to ${ctaLine}.

Thanks for thinking of me.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "retainer_downgrade_response_email") {
        const clientName = String(args.client_name);
        const reductionRequest = String(args.reduction_request);
        const currentTerms = args.current_terms ? String(args.current_terms) : null;
        const proposedTerms = args.proposed_terms ? String(args.proposed_terms) : null;
        const retainerName = args.retainer_name ? String(args.retainer_name) : null;
        const route = args.route ? String(args.route) : "accommodate";
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const retainerLabel = retainerName ? `the ${retainerName}` : "our retainer";
        const currentTermsLine = currentTerms ? ` (currently ${currentTerms})` : "";
        const proposedTermsLine = proposedTerms ? ` — ${proposedTerms}` : "";
        let subject;
        let body;
        if (route === "retain") {
            subject = `Re: ${retainerName ? `${retainerName} — ` : ""}scope change`;
            body = `Hi ${clientName},

Thanks for being upfront with me — I appreciate it.

Before we make any changes to ${retainerLabel}${currentTermsLine}, I wanted to share a bit of context, in case it's useful.

Over the past period, we've covered: [summary of key wins or deliverables]. Moving to ${reductionRequest}${proposedTermsLine} would mean [what gets deprioritised or slowed — be specific and honest, not dramatic]. That's fine if the business need has genuinely changed — I just want you to have the full picture before the decision is final.

If it's a cash-flow issue rather than a scope one, I'm open to a short-term adjustment — say, one or two months at a reduced level — before settling on a permanent change. That way we're not locked into something that may not fit in six weeks.

If you'd like to talk it through before deciding, I'm happy to set up a quick call.

${yourName}`;
        }
        else if (route === "pause") {
            subject = `Re: ${retainerName ? `${retainerName} — ` : ""}pausing instead of reducing`;
            body = `Hi ${clientName},

Thanks for the heads-up. I hear you on ${reductionRequest} — before we formalise a permanent change, I wanted to suggest an alternative: a temporary pause.

Rather than restructuring ${retainerLabel}${currentTermsLine} to ${proposedTerms ?? "a reduced scope"}, we could pause it for [X weeks/months] and pick back up when the timing is better. The advantage: no renegotiating terms, no ramp-up cost when things settle, and the work stays continuous rather than restarting from scratch.

If a pause works for you, just let me know the window and I'll hold your slot open. If you'd genuinely prefer the scaled-back arrangement on an ongoing basis, I can work with that too — I just wanted to give you both options.

Let me know what makes more sense.

${yourName}`;
        }
        else {
            // accommodate (default)
            subject = `Re: ${retainerName ? `${retainerName} — ` : ""}updated scope`;
            body = `Hi ${clientName},

Thanks for letting me know. Happy to adjust ${retainerLabel} to ${reductionRequest}${proposedTermsLine} — I appreciate you giving me notice rather than just going quiet.

To confirm the updated arrangement: [restate the new terms clearly — hours, scope, rate, start date]. I'll update the agreement and send a revised version for your records.

If things pick up and you'd like to expand again, just say the word.

${yourName}`;
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "project_delay_notification_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const newDeadline = String(args.new_deadline);
        const reason = args.reason ? String(args.reason) : null;
        const whatIsComplete = args.what_is_complete ? String(args.what_is_complete) : null;
        const route = args.route ? String(args.route) : "on_deadline";
        const yourName = args.your_name ? String(args.your_name) : "[Your name]";
        const reasonLine = reason ? `\n\n${reason}.` : "";
        const progressLine = whatIsComplete ? `\n\n${whatIsComplete}.` : "";
        let subject;
        let body;
        if (route === "early_warning") {
            subject = `${projectName} — heads up on the timeline`;
            body = `Hi ${clientName},

I want to flag something before it becomes a problem: I can see that ${projectName} isn't going to land on the original date.${reasonLine}${progressLine}

My revised date is ${newDeadline}. I wanted to give you as much notice as possible so you can plan around it.

If this creates a knock-on issue for you, let me know and we'll work out the best path forward.

${yourName}`;
        }
        else if (route === "already_late") {
            subject = `${projectName} — update and new delivery date`;
            body = `Hi ${clientName},

I owe you an update on ${projectName}. I've missed the deadline, and I want to be straight with you about it.${reasonLine}${progressLine}

I'm committing to ${newDeadline} as the new delivery date. I'll send it the moment it's ready and won't let this slip again.

I'm sorry for the delay.

${yourName}`;
        }
        else {
            // on_deadline (default)
            subject = `${projectName} — revised delivery date`;
            body = `Hi ${clientName},

I need to let you know that ${projectName} won't be ready today as planned.${reasonLine}${progressLine}

I'll have it to you by ${newDeadline}. I'll send it across as soon as it's done.

Sorry for the disruption — I wanted to tell you straight away rather than leave you waiting.

${yourName}`;
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
                },
            ],
        };
    }
    if (name === "linkedin_connection_request") {
        const recipientName = args.recipient_name ? String(args.recipient_name) : null;
        const reasonToConnect = String(args.reason_to_connect);
        const yourService = args.your_service ? String(args.your_service) : null;
        const yourName = args.your_name ? String(args.your_name) : null;
        const openingLine = recipientName ? `Opening: address them by first name — "Hi ${recipientName},"` : "Opening: no name — start with a direct hook.";
        const serviceLine = yourService ? `Your service: ${yourService} — include this only if it's directly relevant to the reason. If it feels salesy, leave it out.` : "Your service: not provided — do not mention what you do unless the hook makes it unavoidable.";
        const nameLine = yourName ? `Sign your name: ${yourName}.` : "No name — just the message.";
        return {
            content: [
                {
                    type: "text",
                    text: `Write a LinkedIn connection request message. Hard limit: 300 characters including spaces.

Context:
- ${openingLine}
- Reason to connect: ${reasonToConnect}
- ${serviceLine}
- ${nameLine}

Rules:
- One specific, genuine hook — name what caught your attention.
- No pitch. The goal is the connection, not the sale.
- No "I came across your profile" — too generic. Use the actual reason.
- No "I'd love to connect" — weak closer. End with something that makes them curious or nods to a shared thing.
- Under 300 characters total. If it's running long, cut the service line first, then trim the hook.
- Friendly but not sycophantic. Like a message from a real person, not a template.

Write the message only — no explanation, no word count, no alternatives.`,
                },
            ],
        };
    }
    if (name === "client_reference_request_email") {
        const clientName = String(args.client_name);
        const projectName = String(args.project_name);
        const prospectType = String(args.prospect_type);
        const prospectName = args.prospect_name ? String(args.prospect_name) : null;
        const timeCommitment = args.time_commitment ? String(args.time_commitment) : "a short call or a few email questions";
        const yourName = args.your_name ? String(args.your_name) : "Thanks";
        const prospectLine = prospectName
            ? `I'm in conversation with ${prospectName} — ${prospectType}.`
            : `I'm currently in conversation with ${prospectType}.`;
        const subject = `Quick favour — would you be a reference?`;
        const body = `Hi ${clientName},

${prospectLine} They're doing their due diligence and I'd love to put your name forward as someone they could reach out to directly.

It would likely mean ${timeCommitment} if they follow up — nothing more than that. You'd be speaking to ${projectName} and what it was like to work together.

No pressure at all — just wanted to ask before sharing your details. Let me know if you're happy for me to pass on your contact.

${yourName}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Subject: ${subject}\n\n${body}`,
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