import React, { useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import {
  ShieldCheck, GitBranch, CheckSquare, Shield,
  BookOpen, Users, AlertTriangle, RotateCcw,
  TrendingUp, Check, X, ChevronRight,
} from 'lucide-react';

// ── GSF Sample Data ───────────────────────────────────────────────────────────
// Pre-processed from GSF_Semantic_Pipeline/dbt/target/manifest.json + schema.yml files.
// Scores well on semantics and quality; intentionally missing owner/PII/access metadata.

const GSF_SAMPLE = {
  project: 'gsf_demo',
  generatedAt: '2026-05-12',
  sourceLabel: 'GSF Semantic Pipeline — Demo',
  models: [
    { name: 'dw_position',          layer: 'gold_semantic', hasDesc: true,  colCount: 12, describedCols: 12, testCount: 8,  hasOwner: false, hasDomain: false, hasPii: false, hasSla: false, hasCert: false },
    { name: 'dw_account',           layer: 'gold_semantic', hasDesc: true,  colCount: 7,  describedCols: 7,  testCount: 4,  hasOwner: false, hasDomain: false, hasPii: false, hasSla: false, hasCert: false },
    { name: 'dw_security',          layer: 'gold_semantic', hasDesc: true,  colCount: 8,  describedCols: 8,  testCount: 6,  hasOwner: false, hasDomain: false, hasPii: false, hasSla: false, hasCert: false },
    { name: 'dw_trade_lot',         layer: 'gold_semantic', hasDesc: true,  colCount: 7,  describedCols: 7,  testCount: 5,  hasOwner: false, hasDomain: false, hasPii: false, hasSla: false, hasCert: false },
    { name: 'accounts_naive',       layer: 'gold_naive',    hasDesc: true,  colCount: 4,  describedCols: 3,  testCount: 2,  hasOwner: false, hasDomain: false, hasPii: false, hasSla: false, hasCert: false },
    { name: 'securities_naive',     layer: 'gold_naive',    hasDesc: true,  colCount: 5,  describedCols: 4,  testCount: 3,  hasOwner: false, hasDomain: false, hasPii: false, hasSla: false, hasCert: false },
    { name: 'positions_naive',      layer: 'gold_naive',    hasDesc: true,  colCount: 6,  describedCols: 5,  testCount: 3,  hasOwner: false, hasDomain: false, hasPii: false, hasSla: false, hasCert: false },
    { name: 'positions_integrated', layer: 'silver',        hasDesc: true,  colCount: 11, describedCols: 11, testCount: 4,  hasOwner: false, hasDomain: false, hasPii: false, hasSla: false, hasCert: false },
  ],
  sources: [
    { name: 'topaz_positions',      schema: 'bronze', hasDesc: true,  hasFreshness: false },
    { name: 'emerald_positions',    schema: 'bronze', hasDesc: true,  hasFreshness: false },
    { name: 'ruby_positions',       schema: 'bronze', hasDesc: true,  hasFreshness: false },
    { name: 'security_master_stub', schema: 'bronze', hasDesc: true,  hasFreshness: false },
  ],
  exposureCount: 0,
  metricCount: 0,
  semanticModelCount: 4,
  extraFindings: {
    quality: [
      { pass: true, text: 'Primary key uniqueness + not_null enforced on all tables' },
      { pass: true, text: 'Foreign key relationships tested (referential integrity)' },
    ],
    semantic: [
      { pass: true, text: '4-tier semantic model: Bronze → Silver → Naive Gold → Semantic Gold' },
      { pass: true, text: 'Cortex Analyst YAML resolves all 11 source ambiguities (A1–A11)' },
    ],
    stewardship: [
      { pass: true, text: '4-tier pipeline architecture with documented design decisions' },
      { pass: true, text: '11-ambiguity registry documents all known governance gaps' },
    ],
  },
};

// ── Dimensions ────────────────────────────────────────────────────────────────

const DIMENSIONS = {
  lineage: {
    key: 'lineage',
    label: 'Data Lineage & Traceability',
    shortLabel: 'Lineage',
    color: '#6366f1',
    borderClass: 'border-indigo-500',
    iconName: 'GitBranch',
  },
  quality: {
    key: 'quality',
    label: 'Data Quality Management',
    shortLabel: 'Quality',
    color: '#10b981',
    borderClass: 'border-emerald-500',
    iconName: 'CheckSquare',
  },
  access: {
    key: 'access',
    label: 'Access Control & Security',
    shortLabel: 'Access',
    color: '#f59e0b',
    borderClass: 'border-amber-500',
    iconName: 'Shield',
  },
  semantic: {
    key: 'semantic',
    label: 'Semantic Layer & Business Glossary',
    shortLabel: 'Semantic',
    color: '#ec4899',
    borderClass: 'border-pink-500',
    iconName: 'BookOpen',
  },
  stewardship: {
    key: 'stewardship',
    label: 'Data Ownership & Stewardship',
    shortLabel: 'Stewardship',
    color: '#14b8a6',
    borderClass: 'border-teal-500',
    iconName: 'Users',
  },
};

const ICON_MAP = { GitBranch, CheckSquare, Shield, BookOpen, Users };

// ── Maturity Tiers ────────────────────────────────────────────────────────────

const MATURITY_TIERS = [
  { min: 1.0, max: 2.0, label: 'Ad Hoc',  recKey: 'adHoc',    badgeBg: 'bg-red-100',   badgeText: 'text-red-700'   },
  { min: 2.0, max: 3.0, label: 'Reactive', recKey: 'reactive', badgeBg: 'bg-amber-100', badgeText: 'text-amber-700' },
  { min: 3.0, max: 4.0, label: 'Defined',  recKey: 'defined',  badgeBg: 'bg-blue-100',  badgeText: 'text-blue-700'  },
  { min: 4.0, max: 5.1, label: 'Managed',  recKey: 'managed',  badgeBg: 'bg-green-100', badgeText: 'text-green-700' },
];

const getMaturityTier = (score) =>
  MATURITY_TIERS.find(t => score >= t.min && score < t.max) || MATURITY_TIERS[0];

// ── Recommendations ───────────────────────────────────────────────────────────

const RECOMMENDATIONS = {
  lineage: {
    adHoc: {
      title: 'Establish automated column-level lineage collection',
      body: 'Instrument your transformation layer to emit OpenLineage events. If you use dbt, enable the dbt-openlineage integration to capture column-level lineage on every run and feed events into Marquez (open source) or a commercial catalog such as Atlan or Alation. Start with your highest-revenue pipelines — even partial coverage beats zero.',
    },
    reactive: {
      title: 'Wire lineage into incident response workflows',
      body: 'Your biggest leverage is making lineage operational. When a pipeline alert fires in PagerDuty or Slack, an automated message should include the lineage graph link showing upstream parents and downstream consumers. Add dbt exposure blocks to formally document every downstream consumer so impact analysis is queryable, not conversational.',
    },
    defined: {
      title: 'Automate impact analysis in your CI/CD pipeline',
      body: 'Integrate lineage queries into CI/CD so that any schema change to a source table automatically triggers an impact assessment report listing every downstream model, dashboard, and ML feature affected. Tools like dbt exposure tracking, Monte Carlo, or Metaphor Data operationalize this. In financial services, this directly supports SOX ITGCs and BCBS 239 compliance.',
    },
    managed: {
      title: 'Federate cross-cloud lineage with SLA-aware dependency graphs',
      body: 'Ensure lineage spans on-prem sources, Snowflake/Databricks, and third-party data feeds. Use the OpenLineage Facets API to attach SLA metadata to lineage nodes, enabling dependency-aware SLO dashboards. Feed this graph into your data product catalog so consumers can self-assess dataset reliability before building on it.',
    },
  },
  quality: {
    adHoc: {
      title: 'Implement schema contracts and DQ checks in your transformation layer',
      body: 'In dbt, add schema tests (not_null, unique, accepted_values, relationships) to every staging model before promotion to your mart layer. These checks should gate promotion — if they fail, the pipeline fails, not just logs a warning. Even a single test per model is an order-of-magnitude improvement over ad hoc observation.',
    },
    reactive: {
      title: 'Define SLAs per dataset with tiered alerting and ownership routing',
      body: 'For each certified dataset, document expected freshness, acceptable null rate by column, and expected row count range. Wire dbt test failures and observability anomalies to alert the responsible data steward — not just the platform team. Add source freshness tests so SLA violations are detected before consumers report them.',
    },
    defined: {
      title: 'Publish DQ scorecards to consumers and tie to catalog certification',
      body: 'Data quality should be visible to consumers, not just producers. Publish per-dataset DQ scorecards (pass rate, 30-day trend, open incidents) into your data catalog. Tie certification tiers (Bronze/Silver/Gold) to minimum DQ score thresholds. In financial services, this is particularly important for regulatory reporting datasets subject to DQMF review.',
    },
    managed: {
      title: 'Implement ML-based anomaly detection with closed-loop DQ feedback',
      body: "Replace fixed thresholds with statistical baselines that learn your dataset's historical behavior. Snowflake Cortex Analyst, Soda Cloud, or Anomalo can detect distribution shifts automatically. Close the loop: when a quality issue is resolved, require a root-cause tag (source system bug, schema change, business rule change) to trend systemic causes and target prevention upstream.",
    },
  },
  access: {
    adHoc: {
      title: 'Establish a data classification taxonomy and enforce column-level masking',
      body: 'Tag every table and column with a sensitivity label (Public, Internal, Confidential, Restricted). In Snowflake, use Dynamic Data Masking policies to enforce column-level masking by role. In Databricks, use Unity Catalog column masks and row filters. Prioritize tables containing customer PII, account numbers, and regulatory data (MNPI in capital markets).',
    },
    reactive: {
      title: 'Centralize access provisioning with time-bounded, governed grants',
      body: 'Eliminate one-off DBA provisioning. Implement an access request workflow — Apache Ranger, Immuta, or a ticketing integration with your IdP — where all grants are associated with a business justification, approver, and expiration date. Integrate with your HRMS so access is automatically reviewed when employees change roles or leave.',
    },
    defined: {
      title: 'Implement ABAC and route audit logs to your SIEM',
      body: 'Mature from RBAC to attribute-based access control where data sensitivity, user role, and purpose of access are evaluated together. Route all query audit logs (Snowflake QUERY_HISTORY, Databricks Audit Logs) to your SIEM (Splunk, Sentinel) for anomaly detection. In regulated financial services — GLBA, CCPA, SEC Rule 17a-4 — demonstrable audit capability is not optional.',
    },
    managed: {
      title: 'Implement privacy-by-design and automate compliance evidence collection',
      body: 'Apply differential privacy for aggregate query results, automatic de-identification for externally shared data, and tokenization of high-risk identifiers at ingest. Automate the collection of access control evidence for audits — quarterly access reviews, least-privilege certification, exception reports — so compliance reporting is a query, not a manual exercise.',
    },
  },
  semantic: {
    adHoc: {
      title: 'Document canonical definitions for your top 20 business metrics',
      body: 'Identify the 10–20 metrics that drive business decisions and write a single authoritative definition for each — source system, calculation logic, filters applied. Publish in Confluence or dbt exposure YAML. Reconciling disagreements between Finance, Risk, and Technology is the actual governance work; the tooling comes second.',
    },
    reactive: {
      title: 'Implement a dbt Semantic Layer to enforce shared business logic',
      body: "dbt's Semantic Layer (MetricFlow) lets you define measures, dimensions, and metrics in YAML available to any connected BI tool — Tableau, Looker, Mode, Hex — via a single semantic API. This eliminates metric disagreements at the infrastructure level. For financial services, the semantic layer is the natural place to enforce regulatory calculation templates (CECL, RWA) across teams.",
    },
    defined: {
      title: 'Connect the glossary to physical metadata and surface it at query time',
      body: 'A glossary that lives in a Wiki is a documentation artifact; one linked to physical column metadata is a governance capability. In Apache Atlas or Collibra, link each business term to the warehouse columns that implement it. Configure your catalog (Alation, Atlan) so that when an analyst queries a column, they see the business definition, owner, and DQ score inline.',
    },
    managed: {
      title: 'Enable governed natural-language querying via an AI semantic interface',
      body: 'With a mature semantic layer, you can enable governed natural-language data access. Snowflake Cortex Analyst can be pointed at your semantic model to allow business users to ask questions in plain English and receive SQL-backed answers respecting your defined metrics and access controls. The key governance requirement: the semantic layer — not the LLM — remains authoritative for metric logic.',
    },
  },
  stewardship: {
    adHoc: {
      title: 'Assign named data owners and publish an accountability RACI',
      body: 'For each critical data domain (customers, transactions, reference data, risk exposures, regulatory reports), assign a named business owner (VP/Director-level) and a data steward (senior analyst or engineer). Publish this RACI so anyone in the organization knows who to contact for a given dataset. Without named accountability, governance tooling investment has no enforcement mechanism.',
    },
    reactive: {
      title: 'Operationalize stewardship with data product SLAs and review cadences',
      body: "Translate ownership from a name on a spreadsheet to an active commitment. Each steward should own: a published SLA for freshness and quality, a formal incident response process (acknowledge within 1 hour, resolve within 4 hours for critical domains), and a monthly DQ metrics review. Wire the steward's catalog identity to alert routing so DQ alerts land on the right person without manual triage.",
    },
    defined: {
      title: 'Implement a data product operating model with versioned contracts',
      body: 'Advance from stewardship of datasets to stewardship of data products. A data product has a defined consumer interface (schema contract), versioned changelog, declared SLA, and deprecation policy. Start by treating your 5–10 most-consumed warehouse tables as data products: document schemas in your catalog, set up consumer notifications for schema changes, and assign a product owner distinct from the platform team.',
    },
    managed: {
      title: 'Federate stewardship at scale with a data marketplace and certification tiers',
      body: 'Implement a data marketplace layer where products are published with certification tiers (Bronze/Silver/Gold) tied to measurable criteria: DQ score thresholds, owner SLA met, lineage completeness. Consumers self-select based on certification status, and the governance team manages the certification workflow rather than individual datasets — this scales to thousands of datasets without proportional headcount growth.',
    },
  },
};

// ── Improvement Snippets ──────────────────────────────────────────────────────

const IMPROVEMENTS = {
  lineage: {
    adHoc: {
      steps: [
        'Enable the dbt-openlineage package to emit OpenLineage events on every dbt run',
        'Configure Marquez (open-source) or a commercial catalog as the lineage backend',
        'Start with your highest-revenue or most-relied-upon models',
      ],
      code:
`# packages.yml — add dbt-openlineage
packages:
  - package: OpenLineage/dbt-openlineage
    version: [">=0.1.0"]

# profiles.yml — point to your Marquez instance
gsf_demo:
  outputs:
    dev:
      type: snowflake
      # ... connection settings ...
      # OpenLineage config injected via env vars:
      # OPENLINEAGE_URL=http://marquez:5000
      # OPENLINEAGE_NAMESPACE=gsf_demo`,
    },
    reactive: {
      steps: [
        'Add dbt exposure blocks for every downstream consumer (dashboards, APIs, ML models)',
        'Link Slack/PagerDuty alerts to the lineage graph URL for each impacted model',
        'Use dbt ls --select <model>+ to enumerate downstream impact at incident time',
      ],
      code:
`# In dbt/models/exposures.yml
exposures:
  - name: cortex_analyst_gsf_semantic
    type: application
    maturity: high
    owner:
      name: Data Engineering
      email: data-eng@company.com
    depends_on:
      - ref('dw_position')
      - ref('dw_account')
      - ref('dw_security')
    description: >
      Cortex Analyst semantic model for natural-language
      queries against the GSF Semantic Pipeline. Resolves all 11 source ambiguities.`,
    },
    defined: {
      steps: [
        'Add a CI/CD step that runs dbt ls --select state:modified+ to enumerate blast radius on every PR',
        'Integrate with Monte Carlo or Metaphor Data for automated schema-change impact reports',
        'Required for SOX ITGC change management and BCBS 239 data lineage attestation',
      ],
      code:
`# .github/workflows/dbt_ci.yml — impact check on PR
- name: dbt lineage impact check
  run: |
    dbt ls --select state:modified+ \\
           --state ./target \\
           --output json > impact_report.json
    cat impact_report.json`,
    },
    managed: {
      steps: [
        'Federate lineage across cloud boundaries using the OpenLineage transport API',
        'Attach SLA and criticality metadata to lineage nodes via OpenLineage Facets',
        'Surface cross-system dependency graphs in your data product catalog',
      ],
      code:
`# OpenLineage run event with SLA facet (emitted by your orchestrator)
{
  "eventType": "COMPLETE",
  "run": {
    "facets": {
      "sla": {
        "_producer": "https://github.com/your-org/pipeline",
        "sla_hours": 4,
        "criticality": "tier-1",
        "data_domain": "gsf_semantic"
      }
    }
  }
}`,
    },
  },
  quality: {
    adHoc: {
      steps: [
        'Add not_null and unique tests to every primary key column across all models',
        'Add relationships tests on all foreign key columns to enforce referential integrity',
        'Gate dbt model promotion on test pass — failed tests must fail the pipeline',
      ],
      code:
`# In dbt/models/gold_semantic/schema.yml
models:
  - name: dw_position
    columns:
      - name: position_id
        tests:
          - unique
          - not_null
      - name: account_id
        tests:
          - not_null
          - relationships:
              to: ref('dw_account')
              field: account_id
      - name: quantity
        tests:
          - not_null`,
    },
    reactive: {
      steps: [
        'Add source freshness tests with warn/error thresholds to all bronze source tables',
        'Document expected row count ranges and acceptable null rates per dataset',
        'Route dbt test failures to named stewards, not just the platform team inbox',
      ],
      code:
`# In dbt/models/sources.yml — add freshness SLA
sources:
  - name: bronze
    tables:
      - name: topaz_positions
        freshness:
          warn_after:  {count: 25, period: hour}
          error_after: {count: 48, period: hour}
        loaded_at_field: _loaded_at
      - name: emerald_positions
        freshness:
          warn_after:  {count: 25, period: hour}
          error_after: {count: 48, period: hour}
        loaded_at_field: _loaded_at`,
    },
    defined: {
      steps: [
        'Publish per-dataset DQ scorecards (pass rate, 30-day trend) to your data catalog',
        'Tie catalog certification tiers (Bronze/Silver/Gold) to minimum DQ score thresholds',
        'Required for DQMF reviews in regulated financial services environments',
      ],
      code:
`# In schema.yml — add certification tier and DQ metadata
models:
  - name: dw_position
    meta:
      certified: true
      certification_tier: gold
      min_dq_score: 0.95
      dq_scorecard_url: "https://catalog.company.com/dw_position/quality"
      dq_alert_owner: "data-eng@company.com"`,
    },
    managed: {
      steps: [
        'Replace fixed row-count thresholds with ML-based anomaly detection (Soda Cloud, Anomalo)',
        'Require a root-cause tag on every resolved DQ incident (source bug, schema change, business rule)',
        'Trend root-cause categories to target prevention upstream before consumers are impacted',
      ],
      code:
`# Soda Cloud: ML-based anomaly detection
checks for dw_position:
  - anomaly detection for row_count:
      name: Position row count anomaly
      severity: critical
      alert:
        when fail: slack://channel=#data-alerts
  - anomaly detection for missing_count(unrealized_gain_loss):
      name: P&L null rate anomaly`,
    },
  },
  access: {
    adHoc: {
      steps: [
        'Tag all columns containing PII or financial data with meta.pii and meta.sensitivity labels',
        'In Snowflake, create Dynamic Data Masking policies for confidential columns by role',
        'Prioritize account identifiers, fund codes, and trade-level financial data first',
      ],
      code:
`# In dbt/models/gold_semantic/schema.yml
models:
  - name: dw_account
    meta:
      sensitivity: confidential
      contains_financial_data: true
    columns:
      - name: account_name
        meta:
          pii: true
          sensitivity: confidential
      - name: fund_code
        meta:
          pii: false
          sensitivity: internal
  - name: dw_trade_lot
    meta:
      sensitivity: confidential
      contains_financial_data: true`,
    },
    reactive: {
      steps: [
        'Centralize access provisioning through Apache Ranger, Immuta, or your IdP ticketing system',
        'Require business justification and expiration date on every data access grant',
        'Integrate with HRMS to auto-revoke access when employees change roles or depart',
      ],
      code:
`-- Snowflake: time-bounded role grant (managed via Terraform)
resource "snowflake_grant_privileges_to_role" "analyst_gold" {
  privileges = ["SELECT"]
  role_name  = "ANALYST_ROLE"
  on_schema_object {
    object_type = "TABLE"
    object_name = "GSF_DEMO.GOLD.DW_POSITION"
  }
}
-- Review quarterly; integrate expiry with your IdP
-- Auto-revoke on HRMS role-change event via ServiceNow connector`,
    },
    defined: {
      steps: [
        'Implement ABAC: row-level security and column masks based on user role + data sensitivity',
        'Route Snowflake QUERY_HISTORY or Databricks Audit Logs to your SIEM (Splunk / Sentinel)',
        'Demonstrates compliance posture for GLBA, CCPA, and SEC Rule 17a-4 in financial services',
      ],
      code:
`-- Snowflake: column masking policy by role
CREATE MASKING POLICY mask_fund_code AS (val STRING)
  RETURNS STRING ->
    CASE
      WHEN CURRENT_ROLE() IN ('COMPLIANCE_ROLE', 'DATA_OWNER')
        THEN val
      ELSE '***MASKED***'
    END;

ALTER TABLE dw_account
  MODIFY COLUMN fund_code
  SET MASKING POLICY mask_fund_code;`,
    },
    managed: {
      steps: [
        'Apply tokenization of high-risk identifiers at ingest, before data lands in the warehouse',
        'Automate quarterly access review and certification reports (BigID, OneTrust, Privacera)',
        'Compliance evidence is generated by query, not assembled manually each audit cycle',
      ],
      code:
`# Privacy-by-design: tokenize PII at ingest using Presidio
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

analyzer  = AnalyzerEngine()
anonymizer = AnonymizerEngine()

def tokenize_before_ingest(raw_value: str) -> str:
    results   = analyzer.analyze(text=raw_value, language="en")
    anonymized = anonymizer.anonymize(
        text=raw_value, analyzer_results=results
    )
    return anonymized.text`,
    },
  },
  semantic: {
    adHoc: {
      steps: [
        'Write a single authoritative definition for your top 10–20 business metrics',
        'Include: source system, calculation logic, filters applied, and known ambiguities',
        'Publish in Confluence or dbt schema.yml — reconciling cross-domain disagreements is the governance work',
      ],
      code:
`# In dbt/models/gold_semantic/schema.yml
models:
  - name: dw_position
    description: >
      Canonical position fact. market_value = quantity x market_price
      as of position_date. Price authority: Topaz custodian EOD price
      (Ambiguity A2 resolution). Excludes lot-level detail (use
      dw_trade_lot for FIFO/LIFO lot attribution).
    columns:
      - name: market_value
        description: >
          quantity x market_price. Authoritative source: Topaz.
          Governance ref: A2 Price Authority Decision (2024-03-01).`,
    },
    reactive: {
      steps: [
        'Implement dbt Semantic Layer (MetricFlow) to define measures once, consumed by all BI tools',
        'Metrics defined in MetricFlow are available to Tableau, Looker, Mode, and Hex via a single API',
        'In financial services: enforce CECL allowance components and RWA formulas through the semantic layer',
      ],
      code:
`# In dbt/models/semantic_models.yml (MetricFlow)
semantic_models:
  - name: positions
    model: ref('dw_position')
    entities:
      - name: account
        type: foreign
        expr: account_id
    measures:
      - name: total_market_value
        agg: sum
        expr: market_value
      - name: total_unrealized_gl
        agg: sum
        expr: unrealized_gain_loss`,
    },
    defined: {
      steps: [
        'Link business glossary terms to physical columns in Apache Atlas, Collibra, or Alation',
        'Configure your catalog so analysts see the business definition and DQ score inline when querying',
        'Surfacing definitions at query time converts the glossary from documentation to a governance capability',
      ],
      code:
`# Atlan/Collibra: link glossary term to physical column via REST API
PATCH /api/1.0/asset/{column_asset_id}/relations
{
  "relation_type": "MeaningOf",
  "target_asset_id": "{glossary_term_id_market_value}"
}

# dbt: equivalent via meta tags (catalog picks up at sync time)
columns:
  - name: market_value
    meta:
      glossary_term: "Market Value (Position)"
      glossary_id: "term:market-value-position"`,
    },
    managed: {
      steps: [
        'Enable governed natural-language querying via Snowflake Cortex Analyst on your semantic model',
        'The semantic layer — not the LLM — must remain authoritative for all metric logic',
        'Track semantic model coverage rate (% of certified tables with semantic definitions) as a KPI',
      ],
      code:
`# Snowflake Cortex Analyst — query via REST API
POST /api/v2/cortex/analyst/message
{
  "messages": [{
    "role": "user",
    "content": [{
      "type": "text",
      "text": "Total unrealized gain/loss by asset class as of yesterday?"
    }]
  }],
  "semantic_model_file":
    "@GOLD.GSF_GOLD_STAGE/positions_gold.yaml"
}`,
    },
  },
  stewardship: {
    adHoc: {
      steps: [
        'Assign a named business owner (VP/Director) and data steward per critical data domain',
        'Add meta.owner and meta.domain to every model in schema.yml',
        'Publish a RACI — without named accountability, governance tooling has no enforcement mechanism',
      ],
      code:
`# In dbt/models/gold_semantic/schema.yml
models:
  - name: dw_position
    meta:
      owner: "Data Engineering"
      domain: "GSF Semantic"
      contact: "data-eng@company.com"
  - name: dw_account
    meta:
      owner: "Data Engineering"
      domain: "Client Master"
      contact: "data-eng@company.com"
  - name: dw_security
    meta:
      owner: "Data Engineering"
      domain: "Security Master"
      contact: "data-eng@company.com"`,
    },
    reactive: {
      steps: [
        'Add source freshness tests with warn/error thresholds to all bronze source tables',
        'Define a formal incident response SLA: 1-hour acknowledge, 4-hour resolve for critical domains',
        'Wire catalog steward identity to alert routing so DQ alerts reach the right person automatically',
      ],
      code:
`# In dbt/models/sources.yml — SLA metadata + freshness tests
sources:
  - name: bronze
    tables:
      - name: topaz_positions
        meta:
          sla_hours: 24
          steward: "data-eng@company.com"
          criticality: tier-1
        freshness:
          warn_after:  {count: 25, period: hour}
          error_after: {count: 48, period: hour}
        loaded_at_field: _loaded_at`,
    },
    defined: {
      steps: [
        'Treat your top 5–10 most-consumed tables as data products with versioned schema contracts',
        'Document each product: consumer interface, changelog, SLA, and deprecation policy',
        'Assign a product owner distinct from the platform team',
      ],
      code:
`# In schema.yml — data product metadata
models:
  - name: dw_position
    meta:
      owner: "Data Engineering"
      domain: "GSF Semantic"
      version: "2.1.0"
      sla_hours: 24
      certified: true
      certification_tier: gold
      deprecation_date: null
      changelog_url: "https://wiki.co/data/dw_position"
      consumer_slack: "#data-consumers"`,
    },
    managed: {
      steps: [
        'Implement a data marketplace with Bronze/Silver/Gold tiers tied to measurable DQ thresholds',
        'Governance team manages the certification workflow — not individual datasets',
        'This model scales to thousands of datasets without proportional headcount growth',
      ],
      code:
`# Certification criteria (enforced in catalog or dbt macro)
# Bronze: has description + meta.owner
# Silver: Bronze + all PK tests pass + freshness monitored
# Gold:   Silver + column descriptions >= 90% +
#         DQ score >= 0.95 + steward acknowledged SLA

# dbt: derive and assert certification tier
{% set meta = model.meta %}
{% if meta.certification_tier == 'gold' %}
  {% if not (meta.get('dq_score', 0) >= 0.95
             and meta.get('sla_hours')
             and meta.get('certified')) %}
    {{ exceptions.raise_compiler_error(
       "Gold certification requirements not met for " ~ model.name) }}
  {% endif %}
{% endif %}`,
    },
  },
};

// ── Scoring Functions ─────────────────────────────────────────────────────────

const scoreLineage = (d) => {
  const expBonus = d.exposureCount === 0 ? 0 : d.exposureCount < 3 ? 0.5 : 1.5;
  const srcDesc  = d.sources.filter(s => s.hasDesc).length / Math.max(d.sources.length, 1);
  return Math.min(1.5 + expBonus + srcDesc * 0.5, 5.0);
};

const scoreQuality = (d) => {
  const pctTested = d.models.filter(m => m.testCount > 0).length / Math.max(d.models.length, 1);
  const avgTests  = d.models.reduce((a, m) => a + m.testCount, 0) / Math.max(d.models.length, 1);
  const hasFresh  = d.sources.some(s => s.hasFreshness);
  let score = 1.0 + pctTested * 2.0;
  if (avgTests >= 3) score += 0.5;
  if (avgTests >= 6) score += 0.5;
  if (!hasFresh) score = Math.min(score, 3.5);
  return Math.min(Math.max(score, 1.0), 5.0);
};

const scoreAccess = (d) => {
  const pctPii   = d.models.filter(m => m.hasPii).length / Math.max(d.models.length, 1);
  const pctOwner = d.models.filter(m => m.hasOwner).length / Math.max(d.models.length, 1);
  if (pctPii === 0 && pctOwner === 0) return 1.0;
  return Math.min(1.0 + pctPii * 2.0 + pctOwner * 2.0, 5.0);
};

const scoreSemantic = (d) => {
  const totCols    = d.models.reduce((a, m) => a + m.colCount, 0);
  const descCols   = d.models.reduce((a, m) => a + m.describedCols, 0);
  const pctColDesc = totCols > 0 ? descCols / totCols : 0;
  const pctModDesc = d.models.filter(m => m.hasDesc).length / Math.max(d.models.length, 1);
  let score = 1.0 + pctModDesc * 1.0 + pctColDesc * 1.0;
  if (d.metricCount > 0 || d.semanticModelCount > 0) score += 0.5;
  if (d.metricCount >= 5 || d.semanticModelCount >= 2) score += 0.5;
  return Math.min(Math.max(score, 1.0), 5.0);
};

const scoreStewardship = (d) => {
  const n        = Math.max(d.models.length, 1);
  const ownerPct = d.models.filter(m => m.hasOwner).length / n;
  const domPct   = d.models.filter(m => m.hasDomain).length / n;
  const slaPct   = d.models.filter(m => m.hasSla).length / n;
  const certPct  = d.models.filter(m => m.hasCert).length / n;
  const fresh    = d.sources.some(s => s.hasFreshness) ? 0.5 : 0;
  return Math.min(1.0 + ownerPct * 1.5 + domPct * 0.5 + slaPct * 1.0 + certPct * 0.5 + fresh, 5.0);
};

const computeScores = (d) => ({
  lineage:     scoreLineage(d),
  quality:     scoreQuality(d),
  access:      scoreAccess(d),
  semantic:    scoreSemantic(d),
  stewardship: scoreStewardship(d),
});

const computeOverall = (scores) => {
  const vals = Object.values(scores);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
};

const getPriorityGaps = (scores) =>
  Object.entries(scores)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 2)
    .map(([key]) => key);

const fmtScore = (n) => n.toFixed(1);

// ── Findings ──────────────────────────────────────────────────────────────────

const computeFindings = (data) => {
  const n          = data.models.length;
  const safeN      = Math.max(n, 1);
  const tested     = data.models.filter(m => m.testCount > 0).length;
  const hasFresh   = data.sources.some(s => s.hasFreshness);
  const srcDescCnt = data.sources.filter(s => s.hasDesc).length;
  const withOwner  = data.models.filter(m => m.hasOwner).length;
  const withPii    = data.models.filter(m => m.hasPii).length;
  const withDomain = data.models.filter(m => m.hasDomain).length;
  const withSla    = data.models.filter(m => m.hasSla).length;
  const withCert   = data.models.filter(m => m.hasCert).length;
  const withDesc   = data.models.filter(m => m.hasDesc).length;
  const totCols    = data.models.reduce((a, m) => a + m.colCount, 0);
  const descCols   = data.models.reduce((a, m) => a + m.describedCols, 0);
  const colPct     = totCols > 0 ? Math.round((descCols / totCols) * 100) : 0;
  const avgTests   = (data.models.reduce((a, m) => a + m.testCount, 0) / safeN).toFixed(1);

  const base = {
    lineage: [
      { pass: true,                           text: 'dbt dependency graph captured in manifest.json' },
      { pass: srcDescCnt === data.sources.length,
                                              text: `${srcDescCnt} of ${data.sources.length} sources documented in sources.yml` },
      { pass: data.exposureCount > 0,         text: data.exposureCount > 0
                                                ? `${data.exposureCount} downstream exposure${data.exposureCount > 1 ? 's' : ''} documented`
                                                : '0 exposures defined — downstream consumers undocumented' },
      { pass: false,                          text: 'Column-level transformation logic in SQL comments only, not in lineage artifacts' },
    ],
    quality: [
      { pass: tested === n,                   text: `${tested} of ${n} models (${Math.round((tested / safeN) * 100)}%) have at least 1 dbt test` },
      { pass: parseFloat(avgTests) >= 3,      text: `Average ${avgTests} tests per model` },
      { pass: hasFresh,                       text: hasFresh
                                                ? 'Source freshness tests configured'
                                                : `0 of ${data.sources.length} sources have freshness tests — SLA not monitored` },
      { pass: false,                          text: 'No row count or magnitude constraint tests found' },
    ],
    access: [
      { pass: withPii > 0,                    text: withPii > 0
                                                ? `${withPii} of ${n} models have PII/sensitivity column metadata`
                                                : `0 of ${totCols} columns tagged with sensitivity or PII metadata` },
      { pass: withOwner > 0,                  text: withOwner > 0
                                                ? `${withOwner} of ${n} models have meta.owner`
                                                : `0 of ${n} models have meta.owner or meta.role` },
      { pass: false,                          text: 'No data access audit configuration found in dbt artifacts' },
    ],
    semantic: [
      { pass: withDesc === n,                 text: `${withDesc} of ${n} models (${Math.round((withDesc / safeN) * 100)}%) have table-level descriptions` },
      { pass: colPct >= 80,                   text: `${colPct}% of columns have descriptions` },
      { pass: (data.semanticModelCount + data.metricCount) > 0,
                                              text: (data.semanticModelCount + data.metricCount) > 0
                                                ? `${data.semanticModelCount + data.metricCount} semantic model / metric definition(s) found`
                                                : '0 formal dbt metric or semantic model definitions found' },
      { pass: false,                          text: 'Business glossary terms not linked to physical columns via meta tags' },
    ],
    stewardship: [
      { pass: withOwner > 0,                  text: withOwner > 0
                                                ? `${withOwner} of ${n} models have meta.owner assigned`
                                                : `0 of ${n} models have meta.owner assigned` },
      { pass: withDomain > 0,                 text: withDomain > 0
                                                ? `${withDomain} of ${n} models have domain assignment`
                                                : `0 of ${n} models have domain assignment` },
      { pass: hasFresh,                       text: hasFresh
                                                ? 'Source freshness/SLA configuration found'
                                                : `0 of ${data.sources.length} sources have freshness/SLA configuration` },
      { pass: withCert > 0,                   text: withCert > 0
                                                ? `${withCert} of ${n} models have certification metadata`
                                                : 'No data product certification metadata found' },
    ],
  };

  if (data.extraFindings) {
    Object.entries(data.extraFindings).forEach(([dimKey, extra]) => {
      if (base[dimKey]) base[dimKey] = [...extra, ...base[dimKey]];
    });
  }

  return base;
};

// ── Q&A Items (one per governance check) ─────────────────────────────────────

const QA_ITEMS = [
  {
    id: 'col-docs',
    dimension: 'semantic',
    question: 'Are our transformations documented at the column level?',
    verdict: 'pass',
    summary: '57 of 60 columns described — including transformation logic and ambiguity resolution notes.',
    evidence:
`// model.gsf_demo.dw_position → columns.quantity
{
  "description": "Shares/units held at position grain.
    Topaz lots summed per account × security.
    Comparable to Emerald and Ruby position quantities.
    Resolves A7.",
  "meta": {}
}`,
  },
  {
    id: 'tests',
    dimension: 'quality',
    question: 'Do our models have automated dbt tests?',
    verdict: 'pass',
    summary: '35 tests across 8 models — unique, not_null, and referential integrity enforced.',
    evidence:
`// nodes.test.unique_dw_position_position_id
{
  "resource_type": "test",
  "test_metadata": {"name": "unique"},
  "severity": "ERROR",
  "fail_calc": "count(*)",
  "attached_node": "model.gsf_demo.dw_position"
}`,
  },
  {
    id: 'freshness',
    dimension: 'quality',
    question: 'Do we monitor when Bronze source data goes stale?',
    verdict: 'fail',
    summary: '0 of 4 sources have freshness thresholds — SLA breaches go undetected.',
    evidence:
`// sources.gsf_demo.bronze.topaz_positions
{
  "loaded_at_field": null,
  "freshness": {
    "warn_after":  {"count": null, "period": null},
    "error_after": {"count": null, "period": null}
  }
}
// Same pattern on all 4 Bronze sources.`,
  },
  {
    id: 'exposures',
    dimension: 'lineage',
    question: 'Do we document what systems consume our data?',
    verdict: 'fail',
    summary: 'Cortex Analyst app, Streamlit dashboard, and variance scripts are all undocumented.',
    evidence:
`// manifest.json — top-level "exposures" key
{
  "exposures": {}
}

// Three real consumers exist but none are
// registered as dbt exposures:
//   - Cortex Analyst semantic YAML
//   - Streamlit Community Cloud app
//   - Variance reconciliation scripts`,
  },
  {
    id: 'owners',
    dimension: 'stewardship',
    question: 'Do our models have named owners and domain assignments?',
    verdict: 'fail',
    summary: '0 of 8 models have owner, domain, contact, or SLA metadata.',
    evidence:
`// model.gsf_demo.dw_position → meta
{
  "meta": {}
}

// Same result on all 8 models:
// dw_position, dw_account, dw_security,
// dw_trade_lot, accounts_naive,
// securities_naive, positions_naive,
// positions_integrated`,
  },
  {
    id: 'sensitivity',
    dimension: 'access',
    question: 'Have we classified sensitive financial data columns?',
    verdict: 'fail',
    summary: '0 of 60 columns tagged — fund_code, account_name, and trade values unclassified.',
    evidence:
`// model.gsf_demo.dw_account → columns.fund_code
{
  "name": "fund_code",
  "description": "Internal fund code identifier...",
  "meta": {}
}

// No pii, sensitivity, or access_tier tags
// on any column across all 8 models.`,
  },
];

// ── Landing Phase ─────────────────────────────────────────────────────────────

const ANALYZE_ITEMS = [
  { label: 'Model test coverage',      sub: 'dbt schema tests per model' },
  { label: 'Column documentation',     sub: 'description completeness %' },
  { label: 'Owner / domain metadata',  sub: 'meta.owner and meta.domain fields' },
  { label: 'PII / sensitivity labels', sub: 'column-level meta.pii tags' },
  { label: 'Source freshness config',  sub: 'freshness warn/error thresholds' },
  { label: 'Exposures',                sub: 'documented downstream consumers' },
  { label: 'Metric / semantic models', sub: 'dbt metrics or semantic_models blocks' },
  { label: 'Certification metadata',   sub: 'meta.certified and meta.sla_hours' },
];

const LandingPhase = ({ onStart }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 px-4 py-10">
    <div className="max-w-3xl mx-auto">

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 mb-4">
          <ShieldCheck className="w-9 h-9 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          GSF Data Governance Maturity Assessment
        </h1>
        <p className="text-slate-500 text-lg">
          GSF Semantic Pipeline — governance posture derived from real dbt artifacts
        </p>
      </div>

      {/* Pipeline DAG */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-5">
        <h2 className="font-semibold text-slate-800 mb-0.5">Pipeline Architecture</h2>
        <p className="text-xs text-slate-400 mb-5">
          GSF_Semantic_Pipeline · four-tier Bronze → Silver → Gold pattern on Snowflake (GSF_DEMO database)
        </p>
        <div className="flex flex-col gap-1">
          {DAG_LAYERS.map((layer, li) => (
            <div key={layer.label}>
              {li > 0 && (
                <div className="flex justify-start pl-24 text-slate-300 text-lg leading-none my-1">↓</div>
              )}
              <div className="flex items-start gap-4">
                <div className="w-20 flex-shrink-0 text-right pt-2">
                  <span className="text-xs font-bold" style={{ color: layer.color }}>{layer.label}</span>
                </div>
                <div className="flex flex-wrap gap-2 flex-1">
                  {layer.nodes.map(node => (
                    <div
                      key={node.name}
                      className={`px-3 py-2 rounded-lg border text-xs ${layer.bg} ${layer.border}`}
                    >
                      <p className="font-semibold text-slate-800 font-mono">{node.name}</p>
                      <p className="text-slate-500">{node.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What the manifest.json contains */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-1">
          The dbt{' '}
          <span className="font-mono text-sm bg-slate-100 px-1.5 py-0.5 rounded">manifest.json</span>
          {' '}for this pipeline is being analyzed for the following
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Generated by{' '}
          <span className="font-mono bg-slate-50 px-1 rounded">dbt compile</span> or{' '}
          <span className="font-mono bg-slate-50 px-1 rounded">dbt run</span> — found at{' '}
          <span className="font-mono bg-slate-50 px-1 rounded">dbt/target/manifest.json</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ANALYZE_ITEMS.map(({ label, sub }) => (
            <div key={label} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />
              <div>
                <p className="text-sm font-medium text-slate-700">{label}</p>
                <p className="text-xs text-slate-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl transition-colors shadow-sm"
        >
          Start Assessment
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 mt-4">
        Runs entirely in your browser — no data leaves this page.
      </p>

    </div>
  </div>
);

// ── Pipeline DAG Data ─────────────────────────────────────────────────────────

const DAG_LAYERS = [
  {
    label: 'Bronze',
    color: '#b45309',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    nodes: [
      { name: 'topaz_positions',      sub: 'Custodian · CUSIP · lot grain' },
      { name: 'emerald_positions',    sub: 'OMS · Ticker · lot grain' },
      { name: 'ruby_positions',       sub: 'Fund Acctg · ISIN · position grain' },
      { name: 'security_master_stub', sub: '170 / 200 securities' },
    ],
  },
  {
    label: 'Silver',
    color: '#6366f1',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    nodes: [
      { name: 'positions_integrated', sub: 'Naive union · A7–A11 embedded intentionally' },
    ],
  },
  {
    label: 'Gold Naive',
    color: '#d97706',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    nodes: [
      { name: 'accounts_naive',   sub: '7 / 11 ambiguities resolved' },
      { name: 'positions_naive',  sub: '7 / 11 ambiguities resolved' },
      { name: 'securities_naive', sub: '7 / 11 ambiguities resolved' },
    ],
  },
  {
    label: 'Gold Semantic',
    color: '#10b981',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    nodes: [
      { name: 'dw_account',   sub: '11 / 11 ambiguities resolved' },
      { name: 'dw_security',  sub: '11 / 11 ambiguities resolved' },
      { name: 'dw_position',  sub: '11 / 11 ambiguities resolved' },
      { name: 'dw_trade_lot', sub: '11 / 11 ambiguities resolved' },
    ],
  },
];

// ── Step Phase ────────────────────────────────────────────────────────────────

const STEP_ORDER = ['semantic', 'quality', 'lineage', 'stewardship', 'access'];

const StepPhase = ({ stepIndex, scores, findings, onNext, onBack }) => {
  const totalSteps = STEP_ORDER.length;
  const dimKey     = STEP_ORDER[stepIndex];
  const dim        = DIMENSIONS[dimKey];
  const Icon       = ICON_MAP[dim.iconName];
  const score      = scores[dimKey];
  const tier       = getMaturityTier(score);
  const rec        = RECOMMENDATIONS[dimKey][tier.recKey];
  const improve    = IMPROVEMENTS[dimKey][tier.recKey];
  const dimFinds   = findings[dimKey] || [];
  const qaCards    = QA_ITEMS.filter(q => q.dimension === dimKey);
  const progress   = ((stepIndex + 1) / totalSteps) * 100;
  const isLast     = stepIndex === totalSteps - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">

        {/* Progress header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onBack}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              ← Back
            </button>
            <div className="text-center">
              <p className="text-xs text-slate-400">Step {stepIndex + 1} of {totalSteps}</p>
              <p className="text-sm font-semibold text-slate-800">{dim.label}</p>
            </div>
            <button
              onClick={onNext}
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {isLast ? 'See Results' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: dim.color }}
            />
          </div>
        </div>

        {/* Evidence cards for this dimension */}
        <h2 className="font-semibold text-slate-800 mb-3">
          Evidence from <span className="font-mono text-sm bg-slate-100 px-1.5 py-0.5 rounded">manifest.json</span>
        </h2>
        <div className="space-y-4 mb-6">
          {qaCards.map(item => (
            <div
              key={item.id}
              className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden border-l-4 ${
                item.verdict === 'pass' ? 'border-l-emerald-400' : 'border-l-red-400'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-5 border-b md:border-b-0 md:border-r border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.verdict === 'pass' ? 'bg-emerald-100' : 'bg-red-100'
                    }`}>
                      {item.verdict === 'pass'
                        ? <Check className="w-3 h-3 text-emerald-600" />
                        : <X     className="w-3 h-3 text-red-500" />
                      }
                    </span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: dim.color + '22', color: dim.color }}
                    >
                      {dim.shortLabel}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 mb-2">{item.question}</p>
                  <p className={`text-xs leading-relaxed ${
                    item.verdict === 'pass' ? 'text-emerald-700' : 'text-slate-500'
                  }`}>
                    {item.summary}
                  </p>
                </div>
                <div className="p-4 bg-slate-900">
                  <p className="text-xs text-slate-500 mb-2 font-mono">manifest.json excerpt</p>
                  <pre className="text-green-300 text-xs leading-relaxed font-mono whitespace-pre overflow-x-auto">
                    {item.evidence}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dimension analysis card */}
        <h2 className="font-semibold text-slate-800 mb-3">Governance Analysis</h2>
        <div className={`bg-white rounded-xl shadow-sm border border-slate-200 border-l-4 p-5 mb-6 ${dim.borderClass}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: dim.color }} />
              <span className="text-sm font-semibold text-slate-800">{dim.label}</span>
            </div>
            <span className="text-lg font-bold text-slate-800 leading-none flex-shrink-0 ml-2">
              {fmtScore(score)}<span className="text-xs font-normal text-slate-400">/5</span>
            </span>
          </div>

          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full"
              style={{ width: `${(score / 5) * 100}%`, backgroundColor: dim.color }}
            />
          </div>

          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${tier.badgeBg} ${tier.badgeText}`}>
            {tier.label}
          </span>

          <div className="mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">What We Found</p>
            <ul className="space-y-1.5">
              {dimFinds.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  {f.pass
                    ? <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    : <X     className="w-3.5 h-3.5 text-red-400    flex-shrink-0 mt-0.5" />
                  }
                  <span className={`text-xs leading-snug ${f.pass ? 'text-slate-700' : 'text-slate-500'}`}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Recommended Next Step</p>
            <p className="text-xs font-bold text-slate-700 mb-1">{rec.title}</p>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">{rec.body}</p>
            <ol className="space-y-1 mb-3">
              {improve.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-xs font-bold text-indigo-400 flex-shrink-0 w-4">{i + 1}.</span>
                  <span className="text-xs text-slate-500 leading-snug">{step}</span>
                </li>
              ))}
            </ol>
            <pre className="p-3 bg-slate-900 text-green-300 text-xs rounded-lg overflow-x-auto leading-relaxed font-mono whitespace-pre">
              {improve.code}
            </pre>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="flex justify-between items-center pb-10">
          <button
            onClick={onBack}
            className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg transition-colors"
          >
            {isLast ? 'See Full Results' : 'Next Dimension'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

// ── Results Phase ─────────────────────────────────────────────────────────────

const ResultsPhase = ({ data, scores, overall, overallTier, findings, gaps, radarData, onReset }) => {
  const dimList   = Object.values(DIMENSIONS);
  const totalTests = data.models.reduce((a, m) => a + m.testCount, 0);
  const totalCols  = data.models.reduce((a, m) => a + m.colCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Header banner */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700 mb-1">GSF Semantic Pipeline</p>
            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap mb-1">
              <span>Snowflake · GSF_DEMO</span>
              <span className="text-slate-200">·</span>
              <span>{data.models.length} models</span>
              <span className="text-slate-200">·</span>
              <span>{data.sources.length} sources</span>
              <span className="text-slate-200">·</span>
              <span>{totalTests} tests</span>
              <span className="text-slate-200">·</span>
              <span>{totalCols} columns</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{fmtScore(overall)}</span>
              <span className="text-slate-400">/5</span>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${overallTier.badgeBg} ${overallTier.badgeText}`}>
                {overallTier.label}
              </span>
              <span className="text-sm text-slate-500">Overall Governance Maturity</span>
            </div>
          </div>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-lg transition-colors self-start sm:self-auto flex-shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            Start Over
          </button>
        </div>

        {/* Radar + Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-5">
          <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-0.5">Maturity Radar</h2>
            <p className="text-xs text-slate-400 mb-4">Derived from dbt artifact analysis (1 = Ad Hoc, 5 = Managed)</p>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: '#374151', fontSize: 12, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 5]}
                  tickCount={6}
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                />
                <Tooltip
                  formatter={(value) => [`${value} / 5`, 'Maturity Score']}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Dimension Scores</h2>
            <div className="space-y-3">
              {dimList.map(dim => {
                const score = scores[dim.key];
                const tier  = getMaturityTier(score);
                return (
                  <div key={dim.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-600">{dim.shortLabel}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{fmtScore(score)}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tier.badgeBg} ${tier.badgeText}`}>
                          {tier.label}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(score / 5) * 100}%`, backgroundColor: dim.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Priority Gap Banner */}
        {gaps.some(k => scores[k] < 3.0) && (
          <div className="border-l-4 border-amber-400 bg-amber-50 rounded-r-xl px-5 py-4 mb-5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Priority Focus Areas</p>
              <p className="text-amber-700 text-sm mt-0.5">
                Your lowest-scoring dimensions are{' '}
                <strong>{gaps.map(k => DIMENSIONS[k].label).join(' and ')}</strong>.
                {' '}Addressing these will have the highest impact on overall governance posture.
              </p>
            </div>
          </div>
        )}

        {/* Dimension Cards */}
        <h2 className="font-semibold text-slate-800 mb-4">Governance Analysis by Dimension</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-10">
          {dimList.map(dim => {
            const score      = scores[dim.key];
            const tier       = getMaturityTier(score);
            const rec        = RECOMMENDATIONS[dim.key][tier.recKey];
            const improve    = IMPROVEMENTS[dim.key][tier.recKey];
            const dimFinds   = findings[dim.key] || [];
            const isPriority = gaps.includes(dim.key);
            const Icon       = ICON_MAP[dim.iconName];

            return (
              <div
                key={dim.key}
                className={`bg-white rounded-xl shadow-sm border border-slate-200 border-l-4 p-5 ${dim.borderClass}`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: dim.color }} />
                    <span className="text-sm font-semibold text-slate-800 leading-tight">{dim.label}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                    <span className="text-lg font-bold text-slate-800 leading-none">
                      {fmtScore(score)}<span className="text-xs font-normal text-slate-400">/5</span>
                    </span>
                    {isPriority && (
                      <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                        Priority Gap
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(score / 5) * 100}%`, backgroundColor: dim.color }}
                  />
                </div>

                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${tier.badgeBg} ${tier.badgeText}`}>
                  {tier.label}
                </span>

                {/* What We Found */}
                <div className="mb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">What We Found</p>
                  <ul className="space-y-1.5">
                    {dimFinds.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {f.pass
                          ? <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          : <X    className="w-3.5 h-3.5 text-red-400    flex-shrink-0 mt-0.5" />
                        }
                        <span className={`text-xs leading-snug ${f.pass ? 'text-slate-700' : 'text-slate-500'}`}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Next Step */}
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Recommended Next Step</p>
                  <p className="text-xs font-bold text-slate-700 mb-1">{rec.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{rec.body}</p>

                  <ol className="space-y-1 mb-3">
                    {improve.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-xs font-bold text-indigo-400 flex-shrink-0 w-4">{i + 1}.</span>
                        <span className="text-xs text-slate-500 leading-snug">{step}</span>
                      </li>
                    ))}
                  </ol>

                  <pre className="p-3 bg-slate-900 text-green-300 text-xs rounded-lg overflow-x-auto leading-relaxed font-mono whitespace-pre">
                    {improve.code}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-400 pb-8">
          David Lowe &mdash; Solutions Architect, Data Architecture &amp; Financial Services
        </p>
      </div>
    </div>
  );
};

// ── Root ──────────────────────────────────────────────────────────────────────

const scores      = computeScores(GSF_SAMPLE);
const overall     = computeOverall(scores);
const overallTier = getMaturityTier(overall);
const gaps        = getPriorityGaps(scores);
const findings    = computeFindings(GSF_SAMPLE);
const radarData   = Object.values(DIMENSIONS).map(dim => ({
  dimension: dim.shortLabel,
  score:     parseFloat(fmtScore(scores[dim.key])),
  fullMark:  5,
}));

const GovernanceAssessment = () => {
  const [phase, setPhase]         = useState('landing');
  const [stepIndex, setStepIndex] = useState(0);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'instant' });

  const handleStart = () => { setStepIndex(0); setPhase('step'); scrollTop(); };

  const handleNext = () => {
    if (stepIndex < STEP_ORDER.length - 1) {
      setStepIndex(i => i + 1);
    } else {
      setPhase('results');
    }
    scrollTop();
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      setPhase('landing');
    } else {
      setStepIndex(i => i - 1);
    }
    scrollTop();
  };

  const handleReset = () => { setStepIndex(0); setPhase('landing'); scrollTop(); };

  if (phase === 'landing') return <LandingPhase onStart={handleStart} />;

  if (phase === 'step') {
    return (
      <StepPhase
        stepIndex={stepIndex}
        scores={scores}
        findings={findings}
        onNext={handleNext}
        onBack={handleBack}
      />
    );
  }

  return (
    <ResultsPhase
      data={GSF_SAMPLE}
      scores={scores}
      overall={overall}
      overallTier={overallTier}
      findings={findings}
      gaps={gaps}
      radarData={radarData}
      onReset={handleReset}
    />
  );
};

export default GovernanceAssessment;
