# ProposalCraft — Launch Day Troubleshooting

Quick reference for problems that might come up on June 10. Read this the night before so nothing surprises you.

---

## "npx install fails" or "command not found"

**Symptom:** User reports `npx -y github:jabbawocky/proposalcraft` throws an error.

**Causes and fixes:**
1. **Node.js not installed** — they need Node 18+ (`node --version`). Fix: download from nodejs.org.
2. **npm cache issue** — try `npx --yes github:jabbawocky/proposalcraft` (with `--yes` not `-y`)
3. **GitHub rate limit** — rare but possible on launch day with traffic. Fix: try again in 5 minutes, or install from the release tarball.
4. **Windows path issue** — `npx` might not be in PATH after Node install. Fix: restart terminal.

**Your response to user:**
> Make sure Node.js 18+ is installed (`node --version` in terminal). If it is, try: `npx --yes github:jabbawocky/proposalcraft` — the `--yes` flag avoids a prompt that can stall on some shells.

---

## Claude Desktop doesn't show the ProposalCraft tools

**Symptom:** User installed via npx, added the JSON config, restarted Claude Desktop — but no tools show up.

**Causes and fixes:**
1. **JSON syntax error** — the most common cause. Extra comma, missing brace. Fix: validate at jsonlint.com or paste into VS Code.
2. **Wrong config file location** — Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`. Windows: `%APPDATA%\Claude\claude_desktop_config.json`.
3. **Didn't fully quit Claude Desktop** — Cmd+Q (Mac) or right-click tray icon → Quit (Windows). "Close window" ≠ quit.
4. **npx path issue** — the `command` in the JSON needs the full path. Fix: run `which npx` in terminal and use that path.

**Quick config to paste:**
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

**Your response to user:**
> Two most common causes: (1) JSON syntax error — paste your config at jsonlint.com to check. (2) Claude Desktop wasn't fully quit — on Mac use Cmd+Q, not just closing the window.

---

## Landing page is down (jabbawocky.github.io/proposalcraft)

**Symptom:** The landing page 404s or won't load.

**Cause:** GitHub Pages outage or deployment issue. Check: githubstatus.com.

**Fallback:** Link directly to the GitHub repo: `https://github.com/jabbawocky/proposalcraft` — the README has full install instructions.

**Your response in posts:**
> If the landing page is slow, install directly: `npx -y github:jabbawocky/proposalcraft` — no web page needed.

---

## "5 draft limit hit immediately" (user confused)

**Symptom:** User says they hit the draft limit after what feels like fewer than 5 drafts.

**Cause:** The limit is per calendar month, counted per successful `draft_proposal` call. `analyze_brief` and `save_proposal` don't count.

**Clarification to post:**
> The free limit is 5 completed proposal drafts per calendar month — `analyze_brief` and `save_proposal` don't count toward it. If you're hitting it fast, check `usage_status` in Claude to see the count.

---

## "I don't see any examples loaded" after load_examples

**Symptom:** User runs `load_examples` and gets a success message but proposals don't reference the examples.

**Cause:** `load_examples` imports templates into the local `~/.proposalcraft/proposals/` directory. Claude uses them in the next `draft_proposal` call, not automatically in the conversation.

**Your response:**
> After `load_examples`, ask Claude to "draft a proposal for [brief]" — it will use the loaded examples as style reference in that call. The examples stay loaded permanently so you only need to run it once.

---

## npm publish fails (for your own reference only — not user-facing)

**Symptom:** The npm publish GitHub Actions workflow fails.

**Cause:** NPM_TOKEN not set in repo secrets.

**Fix:** npmjs.com → Access Tokens → Automation token → GitHub → jabbawocky/proposalcraft → Settings → Secrets → Actions → NPM_TOKEN → re-run workflow.

Note: Direct install via `npx -y github:jabbawocky/proposalcraft` still works without npm publish. This only affects `npm install proposalcraft`.

---

## General "it's broken" (nothing specific)

**Your response:**
> What error message are you seeing exactly? And which OS — Mac, Windows, or Linux? Most issues are either a Node.js version thing or a JSON config typo — both are quick fixes.

Getting the exact error + OS narrows it to the right fix in one reply.

---

*Last updated: Jun 7, 2026 | Tick 25*
