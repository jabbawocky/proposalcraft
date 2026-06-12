#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUNDLED_EXAMPLES_DIR = path.join(__dirname, "..", "sample-proposals");

const FREE_DRAFT_LIMIT = 5;
const PRO_URL = "https://tally.so/r/eqzYqE";
const PRO_MAILTO =
  "mailto:mathew.carter@knowfirst.ai?subject=ProposalCraft%20Pro%20%E2%80%94%20Founding%20Access&body=Hi%2C%0A%0AI%27d%20like%20to%20upgrade%20to%20ProposalCraft%20Pro%20(%2419%2Fmo).%0A%0AName%3A%20%0AUse%20case%3A%20";

interface UsageRecord {
  month: string; // "YYYY-MM"
  draft_count: number;
}

function getUsageFile(): string {
  const dir = path.join(os.homedir(), ".proposalcraft");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "usage.json");
}

function getUsage(): UsageRecord {
  const file = getUsageFile();
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (!fs.existsSync(file)) return { month, draft_count: 0 };
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf-8")) as UsageRecord;
    if (data.month !== month) return { month, draft_count: 0 };
    return data;
  } catch {
    return { month, draft_count: 0 };
  }
}

function incrementUsage(usage: UsageRecord): void {
  usage.draft_count += 1;
  fs.writeFileSync(getUsageFile(), JSON.stringify(usage), "utf-8");
}

function checkFreeTier(): { allowed: boolean; used: number; message?: string } {
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

function getProposalsDir(): string {
  const dir =
    process.env.PROPOSALS_DIR ||
    path.join(os.homedir(), ".proposalcraft", "proposals");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// Returns the resolved path only if it stays within dir — prevents path traversal.
function safeFilepath(dir: string, name: string): string | null {
  const base = path.resolve(dir);
  const resolved = path.resolve(dir, name);
  if (!resolved.startsWith(base + path.sep)) return null;
  return resolved;
}

function loadProposals(): { name: string; content: string }[] {
  const dir = getProposalsDir();
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".txt") || f.endsWith(".md"));
  return files.map((f) => ({
    name: f,
    content: fs.readFileSync(path.join(dir, f), "utf-8"),
  }));
}

const server = new Server(
  { name: "proposalcraft", version: "1.4.8" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "draft_proposal",
      description:
        "Draft a new client proposal based on a brief. Uses your saved winning proposals as style/voice references. Returns a ready-to-send proposal. Free plan: 5 drafts/month. Upgrade for unlimited.",
      inputSchema: {
        type: "object",
        properties: {
          brief: {
            type: "string",
            description:
              "The client brief, project description, or email thread. Paste the full text.",
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
            description:
              "Your hourly or day rate to include in pricing (e.g. '$150/hr')",
          },
        },
        required: ["brief"],
      },
    },
    {
      name: "analyze_brief",
      description:
        "Analyze a client brief BEFORE drafting. Extracts budget signals, timeline urgency, red flags, scope creep risks, and suggests clarifying questions to ask the client. Use this first when a brief is vague or the budget is unclear.",
      inputSchema: {
        type: "object",
        properties: {
          brief: {
            type: "string",
            description:
              "The client brief, job post, or email thread to analyze",
          },
        },
        required: ["brief"],
      },
    },
    {
      name: "save_proposal",
      description:
        "Save a winning proposal as a reference example. The more examples you save, the more accurately future drafts match your voice and format.",
      inputSchema: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "The full text of the winning proposal",
          },
          name: {
            type: "string",
            description:
              "Short name for this proposal (e.g. 'ecommerce-redesign-2024')",
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
      description:
        "Read the full content of a saved proposal by filename. Use list_proposals first to see available filenames.",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "The filename of the proposal to read (e.g. 'ecommerce-redesign-2024.md')",
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
      description:
        "Load bundled example proposals into your library to use as style references immediately. Run this on first use to get started without needing your own past proposals yet.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "usage_status",
      description:
        "Check your free tier usage: how many proposal drafts you've used this month and how many remain before hitting the limit. Run this before draft_proposal if you're unsure of your remaining quota.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "proposal_to_email",
      description:
        "Convert a formal proposal document into a concise, scannable pitch email. Distills the key points — problem, solution, price, and next step — into a short email the client can read in 60 seconds and forward to decision-makers. Does not count against your monthly draft limit.",
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
            description:
              "Optional: the specific call to action (e.g. 'book a 20-min call', 'reply with any questions', 'sign off on the attached proposal'). If omitted, one is inferred from the proposal.",
          },
        },
        required: ["proposal"],
      },
    },
    {
      name: "scope_of_work",
      description:
        "Generate a formal Scope of Work document from an accepted proposal. Produces a structured SOW with deliverables, timeline, payment schedule, revision policy, and a change-order clause — ready to paste into a contract or send directly to the client.",
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
            description:
              "Expected project start date (e.g. 'June 17, 2026' or 'two weeks from contract signing')",
          },
          your_name: {
            type: "string",
            description:
              "Your name or business name (the service provider / contractor)",
          },
        },
        required: ["proposal", "client_name"],
      },
    },
    {
      name: "client_followup",
      description:
        "Write a follow-up message for a proposal that hasn't received a response. Generates a short, non-pushy follow-up that reopens the conversation without sounding desperate. Provide the original proposal summary and how long it's been since you sent it.",
      inputSchema: {
        type: "object",
        properties: {
          proposal_summary: {
            type: "string",
            description:
              "A brief summary of the proposal you sent: what you offered, to whom, and the approximate value/scope",
          },
          days_since_sent: {
            type: "number",
            description: "How many days ago you sent the original proposal",
          },
          context: {
            type: "string",
            description:
              "Optional: any context about the client or situation that might affect the follow-up tone (e.g. 'they seemed enthusiastic on the call', 'cold inbound lead', 'long-term client')",
          },
        },
        required: ["proposal_summary", "days_since_sent"],
      },
    },
    {
      name: "improve_proposal",
      description:
        "Review a proposal draft and get specific, actionable improvements. Surfaces weak sections, unclear pricing, vague scope, and missed persuasion opportunities. Run after draft_proposal or on any proposal you're about to send. Does not count against your monthly draft limit.",
      inputSchema: {
        type: "object",
        properties: {
          proposal: {
            type: "string",
            description: "The full text of the proposal draft to review",
          },
          focus: {
            type: "string",
            description:
              "Optional: a specific area to focus on (e.g. 'pricing clarity', 'opening hook', 'why-me section', 'scope definition'). If omitted, a full review is given.",
          },
        },
        required: ["proposal"],
      },
    },
    {
      name: "project_kickoff_email",
      description:
        "Write a professional project kickoff email to send after winning a project. Confirms deliverables and timeline, introduces your working process, sets clear expectations, and makes the client feel confident they made the right choice. Use this immediately after the client says yes — before the scope of work is signed. Does not count against your monthly draft limit.",
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
      description:
        "Write a warm, non-desperate email to past clients announcing you have capacity opening up. Past clients are the highest-converting leads — this email re-activates relationships without cold-pitching. Under 120 words, one soft ask. Does not count against your monthly draft limit.",
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
            description:
              "Brief reference to the project you did together (e.g. 'the rebrand we did last year', 'your e-commerce site')",
          },
          available_from: {
            type: "string",
            description:
              "When you have capacity (e.g. 'from July', 'mid-June', 'end of this month')",
          },
          capacity_type: {
            type: "string",
            description:
              "Optional: what kind of work you have capacity for (e.g. 'a new project', 'a retainer', 'a few days of consulting'). Default: new project work.",
          },
        },
        required: ["your_name", "client_name", "past_project", "available_from"],
      },
    },
    {
      name: "project_closure_email",
      description:
        "Write the final email when a project is fully delivered and complete. Confirms what was delivered, handles any handover items, expresses genuine thanks, and plants seeds for future work. Different from project_kickoff_email (which starts the engagement) — this closes it professionally. Does not count against your monthly draft limit.",
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
            description:
              "Brief name or description of the project (e.g. 'the Acme Corp website redesign', 'the brand identity project')",
          },
          what_was_delivered: {
            type: "string",
            description:
              "What you delivered — list the key deliverables (e.g. '5-page Webflow site, style guide, mobile-optimised')",
          },
          handover_items: {
            type: "string",
            description:
              "Optional: anything the client still needs to action (e.g. 'update your DNS records', 'add your own copy to the About page', 'set your own admin password')",
          },
          warranty_period: {
            type: "string",
            description:
              "Optional: any support or bug-fix period you're offering (e.g. '14 days of bug fixes included', '30-day support window')",
          },
          future_work_hook: {
            type: "string",
            description:
              "Optional: a natural next-step or future work opportunity to mention (e.g. 'SEO setup', 'quarterly content updates', 'Phase 2 mobile app')",
          },
        },
        required: ["your_name", "client_name", "project_name", "what_was_delivered"],
      },
    },
    {
      name: "meeting_recap_email",
      description:
        "Write a professional post-meeting recap email to send to a client after a discovery call, check-in, kickoff, or project review. Summarises what was discussed, confirms decisions, and lists next steps with owners. Creates a paper trail and keeps the project moving. Does not count against your monthly draft limit.",
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
            description:
              "Type of meeting — shapes the tone and what sections are emphasised (default: check-in)",
          },
          key_points: {
            type: "string",
            description:
              "What was discussed — paste rough notes or a bullet list. The tool will shape them into clean prose.",
          },
          decisions: {
            type: "string",
            description:
              "Optional: specific decisions confirmed in the meeting (e.g. 'approved the blue colour palette', 'agreed to delay launch by 2 weeks')",
          },
          next_steps: {
            type: "string",
            description:
              "Optional: what happens next and who owns each item (e.g. 'You: send logo files by Friday. Me: deliver wireframes by June 18.')",
          },
          follow_up_date: {
            type: "string",
            description:
              "Optional: when you'll next connect (e.g. 'June 20', 'next Thursday')",
          },
        },
        required: ["your_name", "client_name", "key_points"],
      },
    },
    {
      name: "referral_request",
      description:
        "Write a short, warm email asking a happy client to refer you to others in their network. Different from testimonial_request (which asks for a written review) — this asks for an introduction or recommendation to potential new clients. Under 120 words, one clear ask, no pressure. Does not count against your monthly draft limit.",
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
            description:
              "Brief description of what you delivered (e.g. 'website redesign', 'brand identity project', 'three months of SEO consulting')",
          },
          your_specialty: {
            type: "string",
            description:
              "What you do in plain terms — what you want the referral for (e.g. 'web design for professional services firms', 'brand identity for early-stage startups', 'freelance copywriting')",
          },
          timing: {
            type: "string",
            description:
              "Optional: when relative to project completion you're sending this (e.g. 'two weeks after delivery', 'at handover'). Defaults to after final delivery.",
          },
        },
        required: ["your_name", "client_name", "project_summary", "your_specialty"],
      },
    },
    {
      name: "contract_template",
      description:
        "Generate a plain-English Freelance Services Agreement — the full working contract covering services, payment, IP, revisions, termination, and liability. More comprehensive than an NDA (which covers only confidentiality) and more legally framed than a SOW (which covers deliverables). Suitable for most standard freelance and consulting engagements. Does not count against your monthly draft limit.",
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
            description:
              "How and when payment is made (e.g. '50% on signing, 50% on delivery', 'monthly in advance', 'net-30 on invoice'). Default: 50% on signing, 50% on final delivery.",
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
            description:
              "Governing law jurisdiction (e.g. 'New South Wales, Australia', 'California, USA'). Optional.",
          },
        },
        required: ["your_name", "client_name", "project_description", "total_price"],
      },
    },
    {
      name: "nda_template",
      description:
        "Generate a simple, plain-English Non-Disclosure Agreement for freelance client work. Covers what's confidential, duration, exceptions, and a basic remedies clause. One-way (client's info stays confidential) or mutual. Not a substitute for legal advice — suitable for most standard freelance engagements. Does not count against your monthly draft limit.",
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
      description:
        "Write a professional project status update email to send a client during a longer engagement. Covers what was completed, what's next, any blockers or decisions needed, and the current timeline. Keeps clients informed without requiring a meeting. Does not count against your monthly draft limit.",
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
      description:
        "When a client says your quote is too high, write a revised proposal offering a reduced scope at a lower price — not a rate cut. Helps freelancers hold their rate while giving the client a path forward. Counts against your monthly draft limit.",
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
      description:
        "Write a professional response to a client who has chosen another provider. Keeps the door open for future work without being bitter, clingy, or sycophantic. Short, gracious, and memorable. Does not count against your monthly draft limit.",
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
      description:
        "Write a cold outbound pitch email to a potential client you've identified but who hasn't contacted you. Different from inbound proposal work — this is proactive business development. Short, specific, and ends with a single easy ask. Does not count against your monthly draft limit.",
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
      description:
        "Write a polite but firm reminder for an overdue or unpaid invoice. Generates the right tone for the reminder number — first reminder is friendly and assumes an oversight, second is firmer, third adds urgency. Does not count against your monthly draft limit.",
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
      description:
        "Write an email telling an existing client you are raising your rates. One of the most anxiety-inducing tasks for freelancers. Generates a direct, professional email that gives enough notice, explains the new rate without over-explaining, and preserves the relationship. Does not count against your monthly draft limit.",
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
      description:
        "Draft a proposal for an ongoing monthly retainer engagement. Retainer proposals are structurally different from project proposals — they define a monthly scope, what is and isn't included, a rollover/unused-hours policy, and a 30-day termination clause. Counts against your monthly draft limit.",
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
      description:
        "Write a short, personal email asking a client for a testimonial after successful project delivery. Not a form, not a survey link — a genuine, specific ask that gets responses. Does not count against your monthly draft limit.",
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
      description:
        "Prepare for a discovery call with a potential client. Given a brief, generates sharp questions to ask (budget, timeline, decision-maker, success criteria, pain points), a short call agenda, and the 2-3 things you must confirm before committing to a proposal. Use between analyze_brief and draft_proposal. Does not count against your monthly draft limit.",
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
      description:
        "Write a professional change order document when a client requests work outside the original project scope. Clearly defines what was agreed, what is being added, the additional cost and timeline impact, and requires client sign-off before work begins. Protects you from scope creep. Does not count against your monthly draft limit.",
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
      description:
        "Write a response when a client asks for a lower price. Caving too easily devalues your work; being defensive loses the deal. This generates a firm, warm reply in one of three modes: hold the rate (with reasoning), offer scope reduction instead, or offer payment terms instead. Protects your rate without burning the relationship. Does not count against your monthly draft limit.",
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
      description:
        "Write a professional email to a prospective client asking for the information you need before you can quote accurately. Most freelancers either guess (wrong) or send a list of demands (off-putting). This generates a short, confidence-building email with 2–4 targeted questions that signal expertise, not confusion. Does not count against your monthly draft limit.",
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
      description:
        "Write a concise, authentic LinkedIn post about a project win, lesson learned, or professional insight. LinkedIn is where freelancers get inbound leads — but most avoid posting because writing feels awkward. This generates a post in a natural professional voice (150–250 words): specific hook, the story, the takeaway, a soft CTA. Does not count against your monthly draft limit.",
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
      description:
        "Turn a completed project into a structured portfolio case study. Most freelancers know they should document their work but never do — this generates a complete outline (challenge, approach, results, learnings) ready to paste into your website, LinkedIn, or proposal as a credibility sample. Does not count against your monthly draft limit.",
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
      description:
        "Write a professional email when you are going to miss a deadline or are already late. Takes ownership without over-apologising, gives a clear revised timeline, and keeps the client's trust intact. The tone is direct and accountable — no excuses, no grovelling. Does not count against your monthly draft limit.",
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
      description:
        "Generate a tailored list of everything you need from a client before work can start — access, assets, decisions, approvals. Adapt by project type so the client knows exactly what to send and in what order. Send this after the kickoff email, before starting work. Does not count against your monthly draft limit.",
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
      description:
        "Write a warm, non-pushy email to a happy client suggesting additional services or a retainer after a successful project. Existing clients convert at 3–5x the rate of cold prospects — this is the highest-ROI sales email a freelancer can send. Timing: right after delivering and getting positive feedback. Does not count against your monthly draft limit.",
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
      description:
        "Write a professional email when a project needs to pause — whether the client asked to stop, you're waiting on their content or feedback, or something on your end has come up. Documents the current state, what's outstanding, and what restarts the work. Keeps the relationship intact and protects both parties. Does not count against your monthly draft limit.",
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
      description:
        "Write a peer-to-peer outreach email to a complementary service provider — a designer reaching out to a copywriter, a developer to a designer, a consultant to an agency. Proposes a referral partnership where you both send clients each other's way. Warm, not transactional, under 150 words. Referral partnerships are one of the highest-ROI growth moves a freelancer can make — one good partner can generate years of warm inbound. Does not count against your monthly draft limit.",
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
      description:
        "Generate a clear project brief for a subcontractor or VA you're bringing in for part of a project. Covers their specific scope, deliverable format and deadline, what NOT to include, payment terms, work-for-hire IP clause, and confidentiality note. Getting this right upfront prevents the most common sub problems: scope bleed, missed handoffs, and ownership disputes. Does not count against your monthly draft limit.",
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
      description:
        "Write a short, light-touch email to a prospect who went quiet mid-conversation — a warm lead that stalled before they committed. Not needy, not pushy. Gives them a graceful re-entry point and an easy out. Most freelancers let cold leads die or over-chase awkwardly — this hits the middle: a single, low-pressure nudge that often gets a reply. Under 100 words. Does not count against your monthly draft limit.",
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
      description:
        "Write a speaker submission for a conference, meetup, or podcast — a talk abstract, key takeaways, and speaker bio formatted for a CFP (Call for Proposals). Public speaking is the highest-authority marketing move a freelancer can make. Most people don't do it because the CFP process feels opaque. This generates a submission-ready pitch. Does not count against your monthly draft limit.",
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
      description:
        "Write a gracious, professional email ending an ongoing client relationship — a retainer, a long-term engagement, or a repeat working arrangement. Distinct from project_closure_email (a project that completed naturally) — this is for when you are choosing to end the relationship. The hardest email a freelancer has to write. Gets the tone right: clear and firm without blame, warm without being dishonest, and structured to preserve the relationship for future referrals. Does not count against your monthly draft limit.",
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
      description:
        "Write an end-of-year (or end-of-engagement-period) review email to a long-term client — what was delivered, the standout result, a reflection on the working relationship, and a forward-looking suggestion for the next period. Positions you as a strategic partner rather than a transactional vendor. Naturally opens the conversation for renewal or expansion without hard-selling. Does not count against your monthly draft limit.",
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
      description:
        "Write a short, genuine email asking a client for private feedback after a project — not a public testimonial, just honest input to help you improve. Clients who are asked for feedback feel valued; you get patterns you'd never discover otherwise. Distinct from testimonial_request (which asks for a public review for marketing purposes). Does not count against your monthly draft limit.",
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
      description:
        "Write a professional heads-up email to clients before you go on leave. Confident and matter-of-fact — doesn't apologize for taking time off. Sets clear expectations on dates, response time, and what (if anything) to do for urgent matters. Different from an auto-reply: this is the proactive note you send to active clients a few days before you leave. Does not count against your monthly draft limit.",
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
      description:
        "Write the email asking a happy client for a LinkedIn recommendation. Different from testimonial_request (which asks for a short quote for your website): a LinkedIn recommendation lives on the client's own profile and carries far more social proof. This email makes the ask easy — keeps it short, gives the client a memory prompt, and optionally suggests a focus so they don't face a blank page. Does not count against your monthly draft limit.",
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
      description:
        "Write a proactive email warning a client that a deadline is at risk — BEFORE you've actually missed it. The professional middle path between staying silent (and surprising them) and over-apologising (when you're not late yet). Demonstrates that you're on top of the project and gives the client time to adjust. Different from late_delivery_apology (which is sent after you've already missed the deadline). Does not count against your monthly draft limit.",
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
      description:
        "Write a short proactive check-in email during a long project — the 'just wanted you to know things are on track' message that prevents client anxiety and the 'where are we with this?' interruption. Under 100 words. Different from project_status_update (which is a full structured weekly report): this is a light, warm pulse sent mid-phase to maintain trust during silent execution periods. Does not count against your monthly draft limit.",
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
      description:
        "Write a professional email restarting a paused project. Pairs with project_pause_email to complete the pause/resume lifecycle. Acknowledges the gap, confirms readiness, states the first concrete action, and addresses any timeline adjustments. Does not count against your monthly draft limit.",
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
      description:
        "Write a brief, professional email setting expectations about your working hours and response times with a client. Confident and matter-of-fact — frames boundaries as something that helps the client get better work, not as a personal restriction. Works for setting hours proactively at project start, responding after a late-night or weekend message, or resetting expectations mid-project. Does not count against your monthly draft limit.",
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
      description:
        "Write a professional email flagging scope creep BEFORE issuing a change order — the early-warning conversation that prevents the surprise-invoice moment. Use this when you notice a client requesting something beyond the original brief; it surfaces the issue collaboratively so the client can confirm they want the extra work (triggering a change order) or clarify it's within scope. Different from change_order (which documents agreed extra work and its cost); this is the conversation that comes first. Does not count against your monthly draft limit.",
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
      description:
        "Write the email requesting a project deposit before work begins. Deposits are standard professional practice — this email is confident and clear, not apologetic. Fills the gap between signing the contract/SOW and starting work. Works for any deposit amount or percentage. Does not count against your monthly draft limit.",
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
      name: "portfolio_request_email",
      description:
        "Write the email asking a past client for permission to feature their project in your portfolio, website, or case studies. Specifies exactly what you want to show, where it will appear, and offers them a preview before it goes live. Gives an easy out if they'd rather not — or offers to anonymise the work instead. Distinct from testimonial_request (asking for a quote) and case_study_outline (writing the case study itself) — this is the consent ask that must happen first. Does not count against your monthly draft limit.",
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
            description:
              "Where the work will appear (e.g. 'my portfolio website', 'a case study on my site', 'proposals to prospective clients')",
          },
          specific_work: {
            type: "string",
            description:
              "Optional: the specific piece you want to show (e.g. 'the homepage design', 'the brand identity system', 'before-and-after screenshots'). Makes the ask concrete and limits ambiguity.",
          },
          offer_preview: {
            type: "boolean",
            description:
              "Optional: if true (default), offers to share a draft of the portfolio entry before publishing so the client can approve the copy.",
          },
          offer_anonymise: {
            type: "boolean",
            description:
              "Optional: if true, offers to remove the client's name/branding if they prefer privacy while still allowing the work to be shown.",
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
      description:
        "Write the short covering email sent when sharing a contract or agreement for a client to sign. Tells the client what they're signing, where to find it, when you need it back, and what happens next. Distinct from contract_template (the contract document itself) — this is the email that wraps around it. Does not count against your monthly draft limit.",
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
            description:
              "Optional: date by which you need the signed contract back (e.g. 'Friday', 'June 20'). If omitted, closes with a general 'let me know if you have any questions' sign-off.",
          },
          signing_link: {
            type: "string",
            description:
              "Optional: URL where the client can sign (e.g. a DocuSign or HelloSign link). If provided, used as the primary CTA. If not, assumes contract is attached.",
          },
          contract_summary: {
            type: "string",
            description:
              "Optional: one-sentence description of what the contract covers (e.g. 'this covers the scope, payment schedule, and IP terms we discussed'). Helps the client know what to expect before opening.",
          },
          start_date: {
            type: "string",
            description:
              "Optional: when work begins once the contract is signed. Signals momentum without pressure.",
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
      description:
        "Write the email sent when delivering a project milestone or phase — not the final delivery, but a defined stage with its own deliverables and sign-off. Tells the client exactly what's included, asks for their review and sign-off by a specific date, and states what's next. Distinct from project_completion_email (final handover) and project_status_update (progress report during execution). Does not count against your monthly draft limit.",
      inputSchema: {
        type: "object",
        properties: {
          client_name: {
            type: "string",
            description: "First name or full name of the client",
          },
          milestone_name: {
            type: "string",
            description:
              "Name or number of this milestone (e.g. 'Phase 1', 'Design Mockups', 'Sprint 2')",
          },
          deliverables: {
            type: "string",
            description:
              "Comma-separated list of what is being delivered in this milestone (e.g. 'homepage design, about page, contact form mockup')",
          },
          project_name: {
            type: "string",
            description: "Optional: name of the overall project",
          },
          feedback_deadline: {
            type: "string",
            description:
              "Optional: date by which you need the client's review or sign-off (e.g. 'Friday', 'June 20')",
          },
          next_milestone: {
            type: "string",
            description:
              "Optional: brief description of what comes next after sign-off (e.g. 'development build', 'Phase 2: backend integration')",
          },
          next_milestone_date: {
            type: "string",
            description:
              "Optional: when the next milestone is expected to be delivered",
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
      description:
        "Write a short, warm re-engagement email to a past client you haven't worked with in a while (6+ months). Distinct from availability_announcement (broadcast to all past clients) and reactivation_email (cold prospect from a mid-pitch conversation) — this is a targeted, personal one-to-one note to someone you've already delivered results for. The gap is acknowledged briefly and lightly, not apologised for. Closes with a soft open-ended ask ('are you working on anything at the moment?'), not a pitch. Does not count against your monthly draft limit.",
      inputSchema: {
        type: "object",
        properties: {
          client_name: {
            type: "string",
            description: "First name or full name of the past client",
          },
          last_project: {
            type: "string",
            description:
              "Brief description of the last project you delivered for them (e.g. 'the rebranding project', 'your SaaS MVP')",
          },
          time_elapsed: {
            type: "string",
            description:
              "Optional: how long since you last worked together (e.g. 'six months', 'about a year'). If omitted, the email keeps it vague.",
          },
          value_hook: {
            type: "string",
            description:
              "Optional: a specific, genuine reason to reach out now — a result you achieved that you want to share, something relevant you noticed about their business, a new capability that fits their context. Makes the email feel timely rather than random.",
          },
          service_to_offer: {
            type: "string",
            description:
              "Optional: if there's a specific type of work you're hoping to pick up with them, name it (e.g. 'a second phase', 'ongoing SEO', 'a campaign for Q4'). If omitted, the email stays open-ended.",
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
      description:
        "Write the email that delivers final project files to a client. Distinct from project_closure_email (which handles the relationship close and testimonial ask) — this is the practical handover: here are your files, here's what's included, here's what you need to do next. Sends with the final deliverables attached or linked. Does not count against your monthly draft limit.",
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
      description:
        "Write the short professional email that accompanies a sent invoice. Most freelancers attach invoices to a blank or one-line email — this tool generates the cover email that frames the invoice, states the amount and due date, and gives the client a clear next step. Under 80 words. Does not count against your monthly draft limit.",
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
      description:
        "Write the email responding to a client's revision request. Three modes: 'in_scope' (happy to revise — confirms what you'll change and when), 'exceeds_rounds' (they've used their included revision rounds — explains what's included and what additional rounds cost), 'out_of_scope' (the request is a direction change that requires a change order, not a revision). Distinct from scope_change_email (formal change order) and scope_warning_email (early creep flag) — this is the specific, policy-in-action response to a concrete revision ask. Does not count against your monthly draft limit.",
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
      description:
        "Write a short, professional email acknowledging receipt of a client payment. Most freelancers say nothing when they get paid — this brief confirmation closes the loop, gives the client a paper trail, and signals what happens next. Under 80 words. Does not count against your monthly draft limit.",
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
      description:
        "Write the reply-all when a mutual contact introduces you to a potential client over email. A specific, high-stakes email: the introducer is on CC, so you need to acknowledge them briefly while making a strong direct impression on the prospect — all in under 120 words. Fills the workflow gap between a referral and the discovery call. Does not count against your monthly draft limit.",
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
      description:
        "Write a warm, specific thank-you to someone who sent you a referral. Three modes based on where things stand: 'intro' (you've just been introduced, haven't connected yet), 'had_call' (you've spoken with the referral), or 'won_project' (you landed the work — the warmest thank-you). Most freelancers skip this entirely and miss a key moment to strengthen the referral relationship. Does not count against your monthly draft limit.",
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
      description:
        "Write the 'just closing the loop' email to a prospect who has gone dark after one or more follow-ups. Counter-intuitively, this email often gets a reply when earlier follow-ups didn't — it removes pressure, gives a clear out, and makes it easy for the prospect to re-engage if timing changes later. Calm, friendly, no guilt-tripping, under 80 words. Does not count against your monthly draft limit.",
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
      description:
        "Write a short, confident email sending a price quote or estimate to a prospective client. For situations where a full formal proposal isn't needed — quick projects, hourly work, or a client who just asked 'how much?' Covers: the work, the price, what's included, and a clear next step. Does not count against your monthly draft limit.",
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
      description:
        "Write a short, focused email requesting a meeting — a discovery call with a new prospect, a check-in with an existing client, or a catch-up with a collaborator. Fills the workflow gap between sending a cold pitch or initial enquiry and running the actual discovery_call_prep. Offers specific time slots if provided, otherwise makes a flexible open ask. Does not count against your monthly draft limit.",
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
      description:
        "Write a professional email proposing to renew a contract, retainer, or ongoing engagement with a client. Warm but businesslike — references the work done together, proposes renewal terms, and invites a conversation. Does not count against your monthly draft limit.",
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
      description:
        "Write a professional email to a client when work has grown beyond the original scope — new requests, added features, extra rounds of revisions. Raises the issue without accusation, outlines the impact, and presents options (change order, revised quote, or narrowing scope). Does not count against your monthly draft limit.",
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
      description:
        "Write a professional email to a client who hasn't delivered what they promised — assets, feedback, sign-off, content — and the project is blocked waiting on them. Keeps the tone factual and non-accusatory: the goal is to get what you need, not to assign blame. Does not count against your monthly draft limit.",
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
      description:
        "Write a professional email to a client when you deliver the final output and close out a project. Confirms what's been delivered, thanks the client, and optionally asks for a testimonial and points toward future work. Does not count against your monthly draft limit.",
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
    const safeName = String(args!.name)
      .replace(/\.md$/i, "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const filename = `${safeName}.md`;
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, String(args!.content), "utf-8");

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
    const target = String(args!.name);
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
      return { content: [{ type: "text", text: tier.message! }] };
    }

    const usage = getUsage();
    incrementUsage(usage); // mutates usage.draft_count in place (now = total used including this one)
    const remaining = FREE_DRAFT_LIMIT - usage.draft_count;
    const usageNote =
      remaining > 0
        ? `\n\n---\n_Free plan: ${remaining} draft${remaining !== 1 ? "s" : ""} remaining this month._`
        : `\n\n---\n_**Last free draft this month.** Upgrade to Pro ($19/mo) for unlimited: [Upgrade to Pro →](${PRO_URL})_`;

    const examples = loadProposals();
    const brief = String(args!.brief);
    const budget = args!.budget ? `\nClient budget: ${args!.budget}` : "";
    const deadline = args!.deadline ? `\nDeadline: ${args!.deadline}` : "";
    const rate = args!.your_rate ? `\nYour rate: ${args!.your_rate}` : "";

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
    const target = String(args!.name);
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
    const brief = String(args!.brief);

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

    const loaded: string[] = [];
    const skipped: string[] = [];

    for (const file of files) {
      const src = path.join(BUNDLED_EXAMPLES_DIR, file);
      const dest = path.join(dir, file);
      if (fs.existsSync(dest)) {
        skipped.push(file);
      } else {
        fs.copyFileSync(src, dest);
        loaded.push(file);
      }
    }

    const totalNow = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md") || f.endsWith(".txt")).length;

    const summary =
      loaded.length > 0
        ? `Loaded ${loaded.length} example${loaded.length > 1 ? "s" : ""}: ${loaded.join(", ")}.`
        : `All ${files.length} bundled example${files.length > 1 ? "s" : ""} already in your library — nothing to do.`;

    const skipNote =
      skipped.length > 0 ? ` (${skipped.length} already existed, skipped)` : "";

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
    const status =
      remaining > 0
        ? `**ProposalCraft — Free Plan**\n${usage.draft_count}/${FREE_DRAFT_LIMIT} drafts used in ${usage.month}. **${remaining} remaining.**\n\n**Pro — $19/mo**: unlimited drafts, no monthly cap.\n[Upgrade to Pro →](${PRO_URL})`
        : `**ProposalCraft — Free Plan: Limit Reached**\n${usage.draft_count}/${FREE_DRAFT_LIMIT} drafts used in ${usage.month}. Resets 1st of next month.\n\n**Upgrade to Pro — $19/mo**: unlimited drafts, no monthly cap.\n[Upgrade to Pro →](${PRO_URL})`;
    return { content: [{ type: "text", text: status }] };
  }

  if (name === "client_followup") {
    const summary = String(args!.proposal_summary);
    const days = Number(args!.days_since_sent);
    const context = args!.context ? String(args!.context) : null;

    const urgencyNote =
      days <= 3
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
    const proposal = String(args!.proposal);
    const focus = args!.focus ? String(args!.focus) : null;

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
    const proposal = String(args!.proposal);
    const clientName = args!.client_name ? String(args!.client_name) : "there";
    const yourName = args!.your_name ? String(args!.your_name) : "[Your Name]";
    const cta = args!.cta ? String(args!.cta) : null;

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
    const proposal = String(args!.proposal);
    const clientName = String(args!.client_name);
    const startDate = args!.start_date ? String(args!.start_date) : "as agreed";
    const yourName = args!.your_name ? String(args!.your_name) : "[Your Name / Company]";

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
    const proposal = String(args!.proposal);
    const clientName = String(args!.client_name);
    const startDate = args!.start_date ? String(args!.start_date) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your Name]";
    const workingProcess = args!.working_process ? String(args!.working_process) : null;

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
    const originalScope = String(args!.original_scope);
    const changeRequested = String(args!.change_requested);
    const clientName = String(args!.client_name);
    const additionalCost = args!.additional_cost ? String(args!.additional_cost) : null;
    const timelineImpact = args!.timeline_impact ? String(args!.timeline_impact) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your Name / Company]";

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
    const yourName = String(args!.your_name);
    const clientName = String(args!.client_name);
    const pastProject = String(args!.past_project);
    const availableFrom = String(args!.available_from);
    const capacityType = args!.capacity_type ? String(args!.capacity_type) : "a new project";

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
    const yourName = String(args!.your_name);
    const clientName = String(args!.client_name);
    const projectName = String(args!.project_name);
    const whatWasDelivered = String(args!.what_was_delivered);
    const handoverItems = args!.handover_items ? String(args!.handover_items) : null;
    const warrantyPeriod = args!.warranty_period ? String(args!.warranty_period) : null;
    const futureWorkHook = args!.future_work_hook ? String(args!.future_work_hook) : null;

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
    const yourName = String(args!.your_name);
    const clientName = String(args!.client_name);
    const meetingType = args!.meeting_type ? String(args!.meeting_type) : "check-in";
    const keyPoints = String(args!.key_points);
    const decisions = args!.decisions ? String(args!.decisions) : null;
    const nextSteps = args!.next_steps ? String(args!.next_steps) : null;
    const followUpDate = args!.follow_up_date ? String(args!.follow_up_date) : null;

    const subjectMap: Record<string, string> = {
      discovery: `Notes from our discovery call`,
      kickoff: `Project kickoff — recap and next steps`,
      "check-in": `Quick recap from today's call`,
      review: `Review call — decisions and next steps`,
      sales: `Following up on our conversation`,
    };
    const subject = subjectMap[meetingType] ?? `Recap from today's call`;

    const openingMap: Record<string, string> = {
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
    const yourName = String(args!.your_name);
    const clientName = String(args!.client_name);
    const projectSummary = String(args!.project_summary);
    const yourSpecialty = String(args!.your_specialty);

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
    const yourName = String(args!.your_name);
    const clientName = String(args!.client_name);
    const projectDescription = String(args!.project_description);
    const totalPrice = String(args!.total_price);
    const paymentTerms = args!.payment_terms
      ? String(args!.payment_terms)
      : "50% on signing, 50% on final delivery";
    const revisionRounds =
      typeof args!.revision_rounds === "number" ? args!.revision_rounds : 2;
    const startDate = args!.start_date ? String(args!.start_date) : null;
    const governingLaw = args!.governing_law ? String(args!.governing_law) : null;

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
    const yourName = String(args!.your_name);
    const clientName = String(args!.client_name);
    const projectDescription = String(args!.project_description);
    const durationYears = args!.duration_years ? Number(args!.duration_years) : 2;
    const mutual = args!.mutual === true;
    const governingLaw = args!.governing_law ? String(args!.governing_law) : "[Governing Law Jurisdiction]";

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
    const clientName = String(args!.client_name);
    const projectName = String(args!.project_name);
    const completed = String(args!.completed_this_period);
    const nextSteps = String(args!.next_steps);
    const blockers = args!.blockers ? String(args!.blockers) : null;
    const timelineStatus = args!.timeline_status ? String(args!.timeline_status) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your Name]";

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

    const originalProposal = String(args!.original_proposal);
    const clientFeedback = String(args!.client_feedback);
    const targetBudget = args!.target_budget ? String(args!.target_budget) : null;
    const clientName = args!.client_name ? String(args!.client_name) : "the client";
    const yourName = args!.your_name ? String(args!.your_name) : "[Your Name]";

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
    const clientName = String(args!.client_name);
    const projectType = String(args!.project_type);
    const rejectionReason = args!.rejection_reason ? String(args!.rejection_reason) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your Name]";
    const keepDoorOpen = args!.keep_door_open !== false;

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
    const targetCompany = String(args!.target_company);
    const contactName = args!.contact_name ? String(args!.contact_name) : null;
    const whatYouDo = String(args!.what_you_do);
    const whyThem = String(args!.why_them);
    const yourName = args!.your_name ? String(args!.your_name) : "[Your Name]";
    const ask = args!.ask ? String(args!.ask) : "a 15-minute call to see if there's a fit";

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
    const clientName = String(args!.client_name);
    const invoiceNumber = String(args!.invoice_number);
    const amount = String(args!.amount);
    const dueDate = String(args!.due_date);
    const reminderNumber = args!.reminder_number ? Number(args!.reminder_number) : 1;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your Name]";

    const toneGuide =
      reminderNumber === 1
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
    const clientName = String(args!.client_name);
    const currentRate = String(args!.current_rate);
    const newRate = String(args!.new_rate);
    const effectiveDate = String(args!.effective_date);
    const yourName = args!.your_name ? String(args!.your_name) : "[Your Name]";
    const relationshipContext = args!.relationship_context
      ? String(args!.relationship_context)
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

    const brief = String(args!.brief);
    const monthlyScope = String(args!.monthly_scope);
    const monthlyFee = args!.monthly_fee ? String(args!.monthly_fee) : null;
    const minimumTerm = args!.minimum_term ? String(args!.minimum_term) : null;
    const clientName = args!.client_name ? String(args!.client_name) : "the client";
    const yourName = args!.your_name ? String(args!.your_name) : "[Your Name / Company]";

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
    const clientName = String(args!.client_name);
    const projectSummary = String(args!.project_summary);
    const specificWin = args!.specific_win ? String(args!.specific_win) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your Name]";
    const whereToPost = args!.where_to_post ? String(args!.where_to_post) : null;

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
    const brief = String(args!.brief);
    const analysis = args!.analysis ? `\n\nANALYSIS ALREADY RUN:\n${String(args!.analysis)}` : "";
    const serviceContext = args!.your_service
      ? `\nFreelancer's specialism: ${String(args!.your_service)}`
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
    const clientName = String(args!.client_name);
    const yourName = String(args!.your_name);
    const originalPrice = String(args!.original_price);
    const mode = args!.response_mode ? String(args!.response_mode) : "hold_rate";
    const theirBudget = args!.their_budget ? String(args!.their_budget) : null;
    const context = args!.context ? String(args!.context) : null;

    const contextNote = context ? ` (${context})` : "";
    let body: string;

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
    } else if (mode === "payment_terms") {
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
    } else {
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
    const clientName = String(args!.client_name);
    const projectType = String(args!.project_type);
    const missingInfo = String(args!.missing_info);
    const yourName = String(args!.your_name);
    const context = args!.context ? String(args!.context) : null;

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
    const topic = String(args!.topic);
    const keyInsight = String(args!.key_insight);
    const yourRole = args!.your_role ? String(args!.your_role) : "freelancer";
    const includeCta = args!.include_cta !== false;
    const tone = args!.tone ? String(args!.tone) : "conversational";

    let post: string;

    if (tone === "direct") {
      post = `${topic.charAt(0).toUpperCase() + topic.slice(1)}.

${keyInsight}

Most people don't talk about this. They should.

${yourRole.charAt(0).toUpperCase() + yourRole.slice(1)}s who get this right spend less time chasing clients and more time doing the work they're good at.`;
    } else if (tone === "professional") {
      post = `One thing I've learned as a ${yourRole}: ${topic.toLowerCase()}.

${keyInsight}

It's not the most obvious lesson, but once you see it, you can't unsee it. The projects that go smoothly rarely do so by accident — they're the ones where expectations, scope, and communication were right from the start.

Worth reflecting on as you plan your next engagement.`;
    } else {
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
    const projectType = String(args!.project_type);
    const clientIndustry = String(args!.client_industry);
    const problem = String(args!.problem);
    const approach = String(args!.approach);
    const results = String(args!.results);
    const anonymise = args!.anonymise === true;
    const clientName = args!.client_name ? String(args!.client_name) : null;

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
    const clientName = String(args!.client_name);
    const deliverable = String(args!.deliverable);
    const originalDeadline = String(args!.original_deadline);
    const newDeadline = String(args!.new_deadline);
    const reason = args!.reason ? String(args!.reason) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const projectType = String(args!.project_type).toLowerCase();
    const clientName = String(args!.client_name);
    const deliverables = args!.deliverables ? String(args!.deliverables) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

    // Build access section based on project type
    let accessItems: string[] = [];
    if (/web|site|cms|wordpress|shopify|e.?commerce|squarespace/.test(projectType)) {
      accessItems = [
        "Hosting/server access (FTP, cPanel, or SSH credentials)",
        "CMS admin login (WordPress, Shopify, etc.) — please create a separate account rather than sharing your main one",
        "Domain registrar access (if DNS changes are needed)",
        "Google Analytics / Search Console — invite [your email] as editor",
      ];
    } else if (/app|mobile|ios|android|saas|software/.test(projectType)) {
      accessItems = [
        "GitHub/GitLab repo access — invite [your email] as collaborator",
        "Staging environment credentials",
        "API keys for any third-party services already in use",
        "App Store / Google Play developer account access (if publishing updates)",
      ];
    } else if (/brand|logo|identity|design/.test(projectType)) {
      accessItems = [
        "Current logo files (AI, EPS, SVG, or PNG at highest resolution)",
        "Any existing brand guidelines or style guides",
        "Fonts currently in use (names and/or files)",
        "Colour codes (HEX, CMYK, Pantone) if known",
      ];
    } else if (/copy|content|writ|blog|article/.test(projectType)) {
      accessItems = [
        "CMS/blog platform login to publish (or confirm delivery format: Google Doc / Word / Markdown)",
        "Any existing tone of voice or style guide documents",
        "Competitors you want to differentiate from",
      ];
    } else if (/seo|search|keyword/.test(projectType)) {
      accessItems = [
        "Google Analytics — invite [your email] as editor",
        "Google Search Console — invite [your email] as full user",
        "CMS login if on-page changes are in scope",
        "Existing keyword research or ranking reports (if any)",
      ];
    } else if (/video|film|product/.test(projectType)) {
      accessItems = [
        "Dropbox/Drive folder for raw assets and deliverable transfer",
        "Existing brand assets (logo files, lower-third specs, music preferences)",
        "Any footage or photos you want included",
      ];
    } else {
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
    const clientName = String(args!.client_name);
    const completedProject = String(args!.completed_project);
    const upsellService = String(args!.upsell_service);
    const valueHook = args!.value_hook ? String(args!.value_hook) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const clientName = String(args!.client_name);
    const projectName = String(args!.project_name);
    const pausedBy = args!.paused_by ? String(args!.paused_by) : "client";
    const reason = String(args!.reason);
    const completedWork = String(args!.completed_work);
    const outstandingItems = String(args!.outstanding_items);
    const resumptionTrigger = args!.resumption_trigger
      ? String(args!.resumption_trigger)
      : "when you'\''re ready to restart — just reach out and I'\''ll pick this back up";
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

    let openingLine: string;
    let ownershipLine: string;
    if (pausedBy === "me") {
      openingLine = `I need to let you know that I'\''m putting ${projectName} on hold temporarily.`;
      ownershipLine = `This is on my end — ${reason}. I don'\''t want this to disrupt your timeline more than necessary, so I wanted to be straight with you now rather than slow-walking delivery.`;
    } else if (pausedBy === "mutual") {
      openingLine = `As we discussed, ${projectName} is going on hold for now.`;
      ownershipLine = `Reason: ${reason}. This makes sense given where things stand — I'\''m glad we'\''re aligned on pausing rather than pushing forward in a direction that isn'\''t ready.`;
    } else {
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
    const recipientName = String(args!.recipient_name);
    const recipientService = String(args!.recipient_service);
    const yourService = String(args!.your_service);
    const sharedClientType = String(args!.shared_client_type);
    const connectionHook = args!.connection_hook ? String(args!.connection_hook) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const subName = String(args!.sub_name);
    const theirRole = String(args!.their_role);
    const projectContext = String(args!.project_context);
    const theirScope = String(args!.their_scope)
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `• ${s.charAt(0).toUpperCase() + s.slice(1)}`)
      .join("\n");
    const outOfScope = args!.out_of_scope
      ? String(args!.out_of_scope)
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => `• ${s.charAt(0).toUpperCase() + s.slice(1)}`)
          .join("\n")
      : null;
    const deliverableFormat = String(args!.deliverable_format);
    const deadline = String(args!.deadline);
    const rate = String(args!.rate);
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const prospectName = String(args!.prospect_name);
    const context = String(args!.context);
    const timeElapsed = String(args!.time_elapsed);
    const valueAdd = args!.value_add ? String(args!.value_add) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const talkTitle = String(args!.talk_title);
    const audience = String(args!.audience);
    const problemSolved = String(args!.problem_solved);
    const keyTakeaways = String(args!.key_takeaways)
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t, i) => `${i + 1}. ${t.charAt(0).toUpperCase() + t.slice(1)}`)
      .join("\n");
    const yourExpertise = String(args!.your_expertise);
    const talkFormat = args!.talk_format ? String(args!.talk_format) : "30-minute talk";
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const clientName = String(args!.client_name);
    const engagementDescription = String(args!.engagement_description);
    const finalDate = String(args!.final_date);
    const outstandingWork = String(args!.outstanding_work);
    const reason = args!.reason ? String(args!.reason) : null;
    const offerReferral = args!.offer_referral === true;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const clientName = String(args!.client_name);
    const engagementDuration = String(args!.engagement_duration);
    const highlight = String(args!.highlight);
    const nextSuggestion = String(args!.next_suggestion);
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

    const deliverableList = String(args!.key_deliverables)
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
    const clientName = String(args!.client_name);
    const projectName = String(args!.project_name);
    const specificAspect = args!.specific_aspect ? String(args!.specific_aspect) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const clientName = String(args!.client_name);
    const startDate = String(args!.start_date);
    const endDate = String(args!.end_date);
    const returnDate = String(args!.return_date);
    const projectStatus = args!.project_status ? String(args!.project_status) : null;
    const urgentContact = args!.urgent_contact ? String(args!.urgent_contact) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const clientName = String(args!.client_name);
    const projectName = String(args!.project_name);
    const originalDeadline = String(args!.original_deadline);
    const expectedDelay = String(args!.expected_delay);
    const reason = args!.reason ? String(args!.reason) : null;
    const newDeliveryDate = args!.new_delivery_date ? String(args!.new_delivery_date) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const clientName = String(args!.client_name);
    const projectName = String(args!.project_name);
    const standoutResult = args!.standout_result ? String(args!.standout_result) : null;
    const focusSuggestion = args!.focus_suggestion ? String(args!.focus_suggestion) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const clientName = String(args!.client_name);
    const projectName = String(args!.project_name);
    const currentStage = String(args!.current_stage);
    const nextMilestone = String(args!.next_milestone);
    const onTrack = args!.on_track !== false;
    const blocker = args!.blocker ? String(args!.blocker) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

    let email: string;

    if (!onTrack && blocker) {
      email = `Subject: ${projectName} — quick update

Hi ${clientName},

Quick update on ${projectName}: ${currentStage}.

I wanted to flag something before it becomes an issue: ${blocker}. I don't want this to catch you off guard — can we find 15 minutes to sort it out?

${yourName}`;
    } else {
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
    const clientName = String(args!.client_name);
    const projectName = String(args!.project_name);
    const restartReason = args!.restart_reason ? String(args!.restart_reason) : null;
    const firstAction = String(args!.first_action);
    const timelineNote = args!.timeline_note ? String(args!.timeline_note) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const clientName = String(args!.client_name);
    const yourHours = String(args!.your_hours);
    const responseTime = args!.response_time ? String(args!.response_time) : "within one business day";
    const urgentPath = args!.urgent_path ? String(args!.urgent_path) : null;
    const trigger = args!.trigger ? String(args!.trigger) : "proactive";
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

    const urgentLine = urgentPath
      ? `\n\nIf something genuinely can't wait, ${urgentPath} and I'll respond as quickly as I can.`
      : "";

    let opening: string;
    let framing: string;

    if (trigger === "after_late_message") {
      opening = `Thanks for your message. I'll pick it up properly during my working hours — ${yourHours} — and reply ${responseTime}.`;
      framing = `I work fixed hours so I can give your project proper focused attention rather than fragmented responses. You'll always hear back ${responseTime} during the working week.`;
    } else if (trigger === "mid_project_reset") {
      opening = `I wanted to take a moment to clarify how I work, since I think it'll make the rest of the project smoother for both of us.`;
      framing = `My working hours are ${yourHours}. I respond to messages ${responseTime} within those hours. Outside of that, I'm offline — it means the time I spend on your project is focused and undivided.`;
    } else {
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
    const clientName = String(args!.client_name);
    const projectName = String(args!.project_name);
    const originalScope = String(args!.original_scope);
    const newRequest = String(args!.new_request);
    const estimatedImpact = args!.estimated_impact ? String(args!.estimated_impact) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const clientName = String(args!.client_name);
    const projectName = String(args!.project_name);
    const depositAmount = String(args!.deposit_amount);
    const totalAmount = args!.total_amount ? String(args!.total_amount) : null;
    const paymentLink = args!.payment_link ? String(args!.payment_link) : null;
    const paymentMethod = args!.payment_method ? String(args!.payment_method) : null;
    const dueDate = args!.due_date ? String(args!.due_date) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

    const totalLine = totalAmount
      ? ` (${depositAmount} of the ${totalAmount} total)`
      : ` (${depositAmount})`;

    const dueLine = dueDate
      ? ` by ${dueDate}`
      : "";

    let paymentSection: string;
    if (paymentLink) {
      paymentSection = `You can pay via the link below — it takes about two minutes:\n\n${paymentLink}\n\nOnce that's through, I'll send a confirmation and we'll be good to go.`;
    } else if (paymentMethod) {
      paymentSection = `Payment is by ${paymentMethod}${dueLine}. I'll send a formal invoice shortly with the details.`;
    } else {
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
    const clientName = String(args!.client_name);
    const projectName = String(args!.project_name);
    const whatYouNeed = String(args!.what_you_need);
    const daysWaiting = args!.days_waiting ? Number(args!.days_waiting) : null;
    const originalDeadline = args!.original_deadline ? String(args!.original_deadline) : null;
    const impact = args!.impact ? String(args!.impact) : null;
    const newDeadline = args!.new_deadline ? String(args!.new_deadline) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

    let waitingLine: string;
    if (daysWaiting && originalDeadline) {
      waitingLine = `I'm still waiting on ${whatYouNeed}, which was due ${originalDeadline} — that's ${daysWaiting} day${daysWaiting === 1 ? "" : "s"} ago now.`;
    } else if (originalDeadline) {
      waitingLine = `I'm still waiting on ${whatYouNeed} — you mentioned ${originalDeadline} as the delivery date and I haven't received it yet.`;
    } else if (daysWaiting) {
      waitingLine = `I'm still waiting on ${whatYouNeed}. It's been ${daysWaiting} day${daysWaiting === 1 ? "" : "s"} since I last flagged this.`;
    } else {
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
    const clientName = String(args!.client_name);
    const projectName = String(args!.project_name);
    const scopeChange = String(args!.scope_change);
    const originalScope = args!.original_scope ? String(args!.original_scope) : null;
    const timeImpact = args!.time_impact ? String(args!.time_impact) : null;
    const costImpact = args!.cost_impact ? String(args!.cost_impact) : null;
    const proposedOptions = args!.proposed_options ? String(args!.proposed_options) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

    const contextLine = originalScope
      ? `The original scope was ${originalScope}. Since then, the project has grown to include ${scopeChange}.`
      : `When we kicked off the project, the scope didn't include ${scopeChange} — but that's where things are heading.`;

    const impactLines: string[] = [];
    if (timeImpact) impactLines.push(`Time: ${timeImpact} of additional work`);
    if (costImpact) impactLines.push(`Cost: ${costImpact}`);
    const impactBlock =
      impactLines.length > 0
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

  if (name === "portfolio_request_email") {
    const clientName = String(args!.client_name);
    const projectName = String(args!.project_name);
    const portfolioLocation = String(args!.portfolio_location);
    const specificWork = args!.specific_work
      ? String(args!.specific_work)
      : null;
    const offerPreview =
      args!.offer_preview !== false;
    const offerAnonymise = args!.offer_anonymise === true;
    const yourName = args!.your_name ? String(args!.your_name) : null;

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
    const clientName = String(args!.client_name);
    const projectName = String(args!.project_name);
    const signingDeadline = args!.signing_deadline
      ? String(args!.signing_deadline)
      : null;
    const signingLink = args!.signing_link ? String(args!.signing_link) : null;
    const contractSummary = args!.contract_summary
      ? String(args!.contract_summary)
      : null;
    const startDate = args!.start_date ? String(args!.start_date) : null;
    const yourName = args!.your_name ? String(args!.your_name) : null;

    const summaryLine = contractSummary
      ? `\n\n${contractSummary}`
      : "";

    let ctaLine: string;
    if (signingLink) {
      ctaLine = `You can sign here: ${signingLink}`;
    } else {
      ctaLine = `Please find the contract attached.`;
    }

    const deadlineLine = signingDeadline
      ? `If you could sign and return it by ${signingDeadline}, that would be great.`
      : `Once signed, we're ready to get started.`;

    const startLine = startDate
      ? ` Work begins on ${startDate}.`
      : "";

    const closingLine =
      `Let me know if you have any questions before signing.`;

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
    const clientName = String(args!.client_name);
    const milestoneName = String(args!.milestone_name);
    const rawDeliverables = String(args!.deliverables);
    const projectName = args!.project_name ? String(args!.project_name) : null;
    const feedbackDeadline = args!.feedback_deadline
      ? String(args!.feedback_deadline)
      : null;
    const nextMilestone = args!.next_milestone
      ? String(args!.next_milestone)
      : null;
    const nextMilestoneDate = args!.next_milestone_date
      ? String(args!.next_milestone_date)
      : null;
    const yourName = args!.your_name ? String(args!.your_name) : null;

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
    } else if (nextMilestone) {
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
    const clientName = String(args!.client_name);
    const lastProject = String(args!.last_project);
    const timeElapsed = args!.time_elapsed ? String(args!.time_elapsed) : null;
    const valueHook = args!.value_hook ? String(args!.value_hook) : null;
    const serviceToOffer = args!.service_to_offer
      ? String(args!.service_to_offer)
      : null;
    const yourName = args!.your_name ? String(args!.your_name) : null;

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
    } else {
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
    const clientName = String(args!.client_name);
    const deliverables = String(args!.deliverables);
    const projectName = args!.project_name ? String(args!.project_name) : null;
    const accessInstructions = args!.access_instructions ? String(args!.access_instructions) : null;
    const supportPeriod = args!.support_period ? String(args!.support_period) : null;
    const nextStepsForClient = args!.next_steps_for_client ? String(args!.next_steps_for_client) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const clientName = String(args!.client_name);
    const amount = String(args!.amount);
    const invoiceNumber = args!.invoice_number ? String(args!.invoice_number) : null;
    const projectName = args!.project_name ? String(args!.project_name) : null;
    const dueDate = args!.due_date ? String(args!.due_date) : null;
    const paymentLink = args!.payment_link ? String(args!.payment_link) : null;
    const paymentMethod = args!.payment_method ? String(args!.payment_method) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    } else if (paymentMethod) {
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
    const clientName = String(args!.client_name);
    const revisionType = String(args!.revision_type);
    const projectName = args!.project_name ? String(args!.project_name) : null;
    const revisionRequest = args!.revision_request ? String(args!.revision_request) : null;
    const roundsIncluded = args!.rounds_included ? Number(args!.rounds_included) : null;
    const roundsUsed = args!.rounds_used ? Number(args!.rounds_used) : null;
    const estimatedCost = args!.estimated_cost ? String(args!.estimated_cost) : null;
    const turnaround = args!.turnaround ? String(args!.turnaround) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

    const projectLine = projectName ? ` on ${projectName}` : "";
    const requestLine = revisionRequest ? `\n\nFor the change you mentioned — ${revisionRequest} — ` : "\n\n";

    let subject: string;
    let body: string;

    if (revisionType === "in_scope") {
      subject = `Re: Revision${projectName ? ` — ${projectName}` : ""}`;
      const turnaroundLine = turnaround ? ` I'll have it back to you ${turnaround}.` : " I'll get this back to you shortly.";
      body = `Thanks for the feedback${projectLine}.${requestLine.trimEnd()} I'll get that updated for you.${turnaroundLine}

Let me know if anything else needs adjusting once you've seen the new version.`;
    } else if (revisionType === "exceeds_rounds") {
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
    } else {
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
    const clientName = String(args!.client_name);
    const amount = String(args!.amount);
    const projectName = args!.project_name ? String(args!.project_name) : null;
    const nextStep = args!.next_step ? String(args!.next_step) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const prospectName = String(args!.prospect_name);
    const introducerName = String(args!.introducer_name);
    const yourSpecialty = String(args!.your_specialty);
    const theirContext = args!.their_context ? String(args!.their_context) : null;
    const proposedNextStep = args!.proposed_next_step ? String(args!.proposed_next_step) : "a quick call to learn more about what you're working on";
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const referrerName = String(args!.referrer_name);
    const referredName = String(args!.referred_name);
    const outcome = args!.outcome ? String(args!.outcome) : "intro";
    const projectType = args!.project_type ? String(args!.project_type) : null;
    const reciprocate = args!.reciprocate !== false;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

    const projectLine = projectType ? ` on ${projectType}` : "";
    const reciprocateLine = reciprocate
      ? `\n\nIf I ever come across someone who'd be a good fit for what you do, I'll make sure to return the favour.`
      : "";

    let body: string;
    if (outcome === "won_project") {
      body = `Just wanted to let you know — I ended up working with ${referredName}${projectLine}. Really appreciate you making that introduction. It meant a lot that you thought of me.${reciprocateLine}`;
    } else if (outcome === "had_call") {
      body = `Had a great call with ${referredName} — really glad you made the introduction. Whatever comes of it, I appreciate you thinking of me.${reciprocateLine}`;
    } else {
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
    const prospectName = String(args!.prospect_name);
    const projectOrContext = String(args!.project_or_context);
    const keepDoorOpen = args!.keep_door_open !== false;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const recipientName = String(args!.recipient_name);
    const meetingPurpose = String(args!.meeting_purpose);
    const timeOptions = args!.time_options ? String(args!.time_options) : null;
    const duration = args!.duration ? String(args!.duration) : null;
    const platform = args!.platform ? String(args!.platform) : null;
    const context = args!.context ? String(args!.context) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const clientName = String(args!.client_name);
    const projectDescription = String(args!.project_description);
    const price = String(args!.price);
    const whatsIncluded = args!.whats_included ? String(args!.whats_included) : null;
    const timeline = args!.timeline ? String(args!.timeline) : null;
    const validity = args!.validity ? String(args!.validity) : null;
    const nextStep = args!.next_step ? String(args!.next_step) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const clientName = String(args!.client_name);
    const projectOrRetainer = String(args!.project_or_retainer);
    const currentEndDate = String(args!.current_end_date);
    const renewalTerms = args!.renewal_terms ? String(args!.renewal_terms) : null;
    const highlight = args!.highlight ? String(args!.highlight) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
    const clientName = String(args!.client_name);
    const projectName = String(args!.project_name);
    const whatYouDelivered = String(args!.what_you_delivered);
    const deliveryLocation = args!.delivery_location ? String(args!.delivery_location) : null;
    const highlight = args!.highlight ? String(args!.highlight) : null;
    const testimonialRequest = args!.testimonial_request !== false;
    const futureWork = args!.future_work ? String(args!.future_work) : null;
    const yourName = args!.your_name ? String(args!.your_name) : "[Your name]";

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
