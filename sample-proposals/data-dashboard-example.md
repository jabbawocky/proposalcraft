# Proposal: Data Dashboard — Ridgeline Operations

Hi Ben,

This is a clean problem — the data exists, it's just not visible where decisions get made. Here's how I'd build the dashboard.

## What I heard

You run 3 warehouses and manage 40+ suppliers. Your ops team pulls weekly reports manually from 4 systems (ERP, WMS, supplier portals, your TMS), combines them in Excel, and emails a PDF to leadership. It takes half a day every Monday and it's always slightly out of date. You want a live dashboard that shows inventory levels, order status, supplier on-time rates, and freight costs — refreshed daily or near-real-time.

## What I'll deliver

**Discovery & Data Audit (Weeks 1–2)**
- Map all data sources and their APIs or export formats
- Assess data quality: gaps, inconsistencies, normalisation needed
- Dashboard requirements: stakeholder interviews (you + 2 ops managers)
- Decide on stack: I'm recommending Metabase + PostgreSQL pipeline (free to run yourself) vs a BI tool you already license

**Data Pipeline (Weeks 3–5)**
- ETL pipeline: pull from your 4 sources → cleaned → PostgreSQL staging db
- Scheduled daily refresh (overnight) + manual trigger button
- Data quality checks: flag when source data is missing or anomalous
- 30-day history loaded from your historical exports

**Dashboard Build (Weeks 6–8)**
- 5 dashboard views:
  1. Executive summary (revenue, COGS, margin, freight %)
  2. Inventory levels by warehouse and SKU (with reorder alerts)
  3. Order fulfilment tracker (open, in-transit, delayed)
  4. Supplier scorecard (on-time delivery, defect rate, lead time trend)
  5. Freight cost analysis (by lane, carrier, and period)
- Drill-down from summary to detail on every metric
- Alert setup: email when any KPI breaches threshold

**Handover (Week 9)**
- Training session for your ops team (1 hour)
- Runbook: adding new data sources, modifying metrics, troubleshooting
- 30-day post-launch support

**Not included:** Predictive analytics, ERP customisation, data warehouse migration, ongoing maintenance after handover.

## Investment

| Phase | Cost |
|---|---|
| Discovery & Data Audit | $3,800 |
| Data Pipeline | $9,200 |
| Dashboard Build | $11,000 |
| Handover & Support | $2,000 |
| **Total** | **$26,000** |

30% on kickoff, 40% on pipeline sign-off (end week 5), 30% on handover.

## Timeline

9 weeks. Hard dependency: API access or data export files from all 4 systems within the first week. Delayed access = delayed delivery.

## Why me

I've built operations dashboards for 4 logistics and distribution companies. The most comparable: a 2-warehouse operation that reduced its Monday reporting time from 4 hours to 10 minutes and surfaced a supplier issue that had been invisible in the weekly PDFs — caught $120k of overdue returns. References on request.

## Next step

I'm available to start [DATE]. The first thing I'll need is a 60-minute walkthrough of your current reporting process and access to a test environment or read-only credentials for each data source. I'll send the contract and access checklist when you're ready.

[Your name]
