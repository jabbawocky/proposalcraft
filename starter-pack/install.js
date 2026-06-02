#!/usr/bin/env node
/**
 * ProposalCraft Starter Pack installer
 * Bulk-loads all 12 templates into ProposalCraft's local storage.
 * Run: node install.js
 */

import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROPOSALS_DIR =
  process.env.PROPOSALS_DIR ||
  path.join(os.homedir(), ".proposalcraft", "proposals");

const TEMPLATES_DIR = path.join(__dirname, "templates");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function slugify(filename) {
  return filename.replace(/\.md$/, "").replace(/\s+/g, "-").toLowerCase();
}

function main() {
  ensureDir(PROPOSALS_DIR);

  const files = fs
    .readdirSync(TEMPLATES_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  if (files.length === 0) {
    console.error("No templates found in", TEMPLATES_DIR);
    process.exit(1);
  }

  let loaded = 0;

  for (const file of files) {
    const src = path.join(TEMPLATES_DIR, file);
    const content = fs.readFileSync(src, "utf8");

    // Extract name from frontmatter if present, otherwise use filename
    const nameMatch = content.match(/^---[\s\S]*?^name:\s*(.+?)$/m);
    const name = nameMatch ? nameMatch[1].trim() : slugify(file);
    const dest = path.join(PROPOSALS_DIR, `${name}.md`);

    if (fs.existsSync(dest)) {
      console.log(`  skip  ${name}.md (already exists)`);
      continue;
    }

    fs.writeFileSync(dest, content, "utf8");
    console.log(`  saved ${name}.md`);
    loaded++;
  }

  console.log(
    `\nDone — ${loaded} template${loaded !== 1 ? "s" : ""} loaded into ProposalCraft.`
  );
  console.log(`Storage: ${PROPOSALS_DIR}`);
  console.log(
    `\nOpen Claude Desktop and ask: "Draft a proposal for [paste your brief]"`
  );
}

main();
