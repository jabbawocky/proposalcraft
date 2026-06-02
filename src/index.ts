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
const PRO_URL = "https://bradshawprojects.github.io/proposalcraft/#pricing";
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
      message: `You've used all ${FREE_DRAFT_LIMIT} free proposal drafts for ${usage.month}.\n\n**ProposalCraft Pro — $19/mo** (founding rate until June 10, 2026)\n- Unlimited drafts — no monthly cap\n- 12 industry-specific Starter Pack templates included\n- Priority email support\n\n**Upgrade:** [Reserve founding access →](${PRO_MAILTO})\n\nOr visit: ${PRO_URL}\n\n_Free tier resets on the 1st of each month. Your saved proposals and library are unaffected._`,
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
  { name: "proposalcraft", version: "1.0.3" },
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
        : `\n\n---\n_**Last free draft this month.** Upgrade to Pro ($19/mo) for unlimited: [Reserve founding access →](${PRO_MAILTO})_`;

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
          text: `${summary}${skipNote}\n\nYour library now has ${totalNow} proposal${totalNow !== 1 ? "s" : ""}. Use draft_proposal with any brief to start.\n\n💡 **Want 12 industry-specific templates?** The Starter Pack (web design, SaaS, e-commerce, video production, paid ads + more) is included in Pro ($19/mo): [Reserve founding access →](${PRO_MAILTO})`,
        },
      ],
    };
  }

  if (name === "usage_status") {
    const usage = getUsage();
    const remaining = FREE_DRAFT_LIMIT - usage.draft_count;
    const status =
      remaining > 0
        ? `**ProposalCraft — Free Plan**\n${usage.draft_count}/${FREE_DRAFT_LIMIT} drafts used in ${usage.month}. **${remaining} remaining.**\n\n**Pro — $19/mo** (founding rate until June 10, 2026): unlimited drafts + 12 Starter Pack templates.\n[Reserve founding access →](${PRO_MAILTO})`
        : `**ProposalCraft — Free Plan: Limit Reached**\n${usage.draft_count}/${FREE_DRAFT_LIMIT} drafts used in ${usage.month}. Resets 1st of next month.\n\n**Upgrade to Pro — $19/mo**: unlimited drafts + 12 industry templates.\n[Reserve founding access →](${PRO_MAILTO})`;
    return { content: [{ type: "text", text: status }] };
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
