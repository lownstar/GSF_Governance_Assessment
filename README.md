# GSF Data Governance Maturity Assessment

An interactive, artifact-driven governance maturity assessment tool built as a portfolio piece for the GSF Semantic Pipeline. Derives scores from real dbt pipeline artifacts — no self-rating surveys.

## What It Does

Walks through the GSF Semantic Pipeline's `manifest.json` across five governance dimensions, showing what practices are in place and where the gaps are. Each step presents the actual manifest evidence alongside a scored analysis and concrete improvement steps.

### Governance Dimensions

| Dimension | What's Measured |
|---|---|
| **Semantic** | Column and model description coverage, semantic model definitions |
| **Quality** | dbt test coverage, source freshness configuration |
| **Lineage** | Exposure definitions, documented downstream consumers |
| **Stewardship** | Owner and domain metadata, SLA configuration |
| **Access** | PII and sensitivity column tags, access classification |

### Application Flow

1. **Landing** — Pipeline architecture DAG + overview of what the `manifest.json` contains
2. **Steps 1–5** — One dimension per page: manifest evidence card + scored analysis + recommended schema.yml patch
3. **Results** — Radar chart, overall maturity tier, priority gap banner, full dimension recommendations

## GSF Semantic Pipeline

The pipeline being assessed lives in [`GSF_Semantic_Pipeline`](../GSF_Semantic_Pipeline/). It is a four-tier dbt project on Snowflake (GSF_DEMO database) designed to demonstrate how a semantic layer resolves data ambiguity across three synthetic legacy source systems.

```
Bronze  →  Silver  →  Gold Naive  →  Gold Semantic
(raw)      (union)    (7/11 Ax)       (11/11 Ax)
```

**Score profile:** Strong on Semantic (~4.0) and Quality (~3.5); intentionally weak on Access (~1.0) and Stewardship (~1.0) — creating a natural strength/gap narrative.

## Tech Stack

- React (Create React App)
- Recharts — radar chart
- Lucide React — icons
- Tailwind CSS via CDN

All scoring and parsing runs client-side. No backend. No data leaves the browser.

## Getting Started

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```

Output lands in `build/`. Suitable for static hosting (Railway, Netlify, GitHub Pages).
