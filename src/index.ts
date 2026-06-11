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
  { name: "proposalcraft", version: "1.3.6" },
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
