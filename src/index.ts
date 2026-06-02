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

function getProposalsDir(): string {
  const dir =
    process.env.PROPOSALS_DIR ||
    path.join(os.homedir(), ".proposalcraft", "proposals");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
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
  { name: "proposalcraft", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "draft_proposal",
      description:
        "Draft a new client proposal based on a brief. Uses your saved winning proposals as style/voice references. Returns a ready-to-send proposal.",
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
            text: `No proposals saved yet.\n\nUse save_proposal to add your past winning proposals — the more examples, the better the drafts match your voice.\n\nStorage: ${dir}`,
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
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const filename = safeName.endsWith(".md") ? safeName : `${safeName}.md`;
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
    const filepath = path.join(dir, target);

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

Write the full proposal now.`,
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
_Tip: Save your past winning proposals with save_proposal to get drafts that match your voice instead of generic best practices._`,
        },
      ],
    };
  }

  if (name === "get_proposal") {
    const dir = getProposalsDir();
    const target = String(args!.name);
    const filepath = path.join(dir, target);

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
