# ProposalCraft Pro — Gumroad Setup Guide

**Time required:** ~5 minutes  
**Why Gumroad:** MCPize's deployment model hosts your server on their cloud, which conflicts with ProposalCraft's local-install, privacy-first architecture. Gumroad gives you a simple payment page for a $19/mo license — no architectural change, no cloud dependency.

---

## Step 1 — Create Gumroad account (if needed)

Go to gumroad.com → Sign up or log in.

Use your existing account (Stripe acct = skeletonlabs.io parent).

---

## Step 2 — Create a new product

1. Click **"Create product"**
2. **Product type:** Membership (for recurring) OR Subscription — pick "Membership"
3. **Name:** `ProposalCraft Pro`
4. **Price:** $19/month
5. **Description** (copy-paste):

```
ProposalCraft Pro — unlimited proposal drafts in Claude Desktop

Free tier: 5 drafts/month
Pro: unlimited drafts + priority support

After purchase, you'll receive your Pro activation key by email within 24 hours.

Install: npx -y github:jabbawocky/proposalcraft
Docs: https://jabbawocky.github.io/proposalcraft/
```

6. **Thumbnail:** upload `docs/og-image.png` (1200×630, already generated)

---

## Step 3 — Publish and copy the URL

Click **Publish**. Copy the product URL — it will look like:  
`https://gumroad.com/l/proposalcraft-pro`

---

## Step 4 — Run activate-pro.js

In your terminal:

```bash
cd /home/orbitosw/worker/proposalcraft
node scripts/activate-pro.js https://gumroad.com/l/proposalcraft-pro
git push origin main
```

This patches `PRO_URL` in the source, rebuilds dist/, and stages everything.  
Then commit and push.

---

## Step 5 — Verify

```bash
npx -y github:jabbawocky/proposalcraft
# Run draft_proposal — paywall should show the Gumroad link
```

---

## Notes

- Gumroad takes 10% + payment processing fees. Net: ~$16.20/mo per Pro subscriber.
- MCPize (if you later want marketplace discovery): can still list ProposalCraft as a directory entry without using their cloud hosting.
- Stripe alternative: Stripe Payment Links → Products → create a $19/mo recurring product → share the link. Same outcome, lower fees (~2.9% + $0.30).

---

**Worker note:** Once you have the Gumroad/Stripe URL, post it as a comment on issue #215 or any new orbitos-task issue and the worker will run `activate-pro.js` and push immediately.
