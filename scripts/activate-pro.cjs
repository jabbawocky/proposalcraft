#!/usr/bin/env node
/**
 * Wire up a payment URL across landing page + source in one command.
 * Run this after MCPize or Gumroad registration.
 *
 * Usage:  node scripts/activate-pro.js <payment-url>
 * Example: node scripts/activate-pro.js https://mcpize.com/proposalcraft/subscribe
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const url = process.argv[2];

if (!url || !/^https?:\/\//.test(url)) {
  console.error("Usage: node scripts/activate-pro.js <payment-url>");
  console.error(
    "Example: node scripts/activate-pro.js https://mcpize.com/proposalcraft/subscribe"
  );
  process.exit(1);
}

let changed = 0;

function patch(filePath, search, replace, label) {
  const abs = path.join(ROOT, filePath);
  const content = fs.readFileSync(abs, "utf8");
  if (!search.test(content)) {
    console.warn(`⚠️  Pattern not found in ${filePath} — skipping`);
    return;
  }
  fs.writeFileSync(abs, content.replace(search, replace));
  console.log(`✅ ${label}`);
  changed++;
}

console.log(`\nActivating ProposalCraft Pro with payment URL:\n  ${url}\n`);

// 1. src/index.ts — PRO_URL constant (used in freemium gate messages)
patch(
  "src/index.ts",
  /const PRO_URL = "[^"]+";/,
  `const PRO_URL = "${url}";`,
  "src/index.ts — PRO_URL updated"
);

// 2. docs/index.html — Pro CTA href (mailto: → real payment URL)
patch(
  "docs/index.html",
  /href="mailto:mathew\.carter@knowfirst\.ai\?subject=ProposalCraft[^"]*"/,
  `href="${url}"`,
  "docs/index.html — Pro CTA href updated"
);

// 3. docs/index.html — Pro CTA button text
patch(
  "docs/index.html",
  />Reserve founding access →<\/a>/,
  `>Upgrade to Pro →</a>`,
  "docs/index.html — Pro CTA text updated"
);

// 4. docs/index.html — remove the TODO comment
patch(
  "docs/index.html",
  /[ \t]*<!-- TO UPDATE:[^>]*-->\n?/,
  "",
  "docs/index.html — TODO comment removed"
);

if (changed === 0) {
  console.error("\nNo changes made — patterns may have already been updated.");
  process.exit(1);
}

// 5. Rebuild dist/
console.log("\nRebuilding dist...");
try {
  execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
  console.log("✅ dist/ rebuilt");
} catch {
  console.error("❌ Build failed — check TypeScript errors above");
  process.exit(1);
}

// 6. Stage changes
execSync("git add src/index.ts docs/index.html dist/", { cwd: ROOT });

console.log(`\n✅ Done. Staged ${changed} file(s) + dist rebuild.\n`);
console.log("Next:");
console.log(`  git commit -m "Activate Pro: wire payment URL"`);
console.log("  git push");
console.log("\nThen fire the launch sequence:");
console.log("  → r/freelance (LAUNCH_POSTS.md)");
console.log("  → Show HN (marketing/show-hn-post.md)");
console.log("  → Product Hunt June 10 (marketing/producthunt-launch.md)");
