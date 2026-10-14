# GEO Visibility Tracker — Measurement Methodology

This document describes how visibility is **measured** (not simulated). It is the
reference for the honest-core rebuild and is written to be quotable in the report.

## What changed from the prototype

The first-semester prototype asked a single LLM (Llama 3.3 70B on Groq) to
*"simulate how Claude, GPT-4, Gemini, and Llama would represent the brand"* and
to invent the visibility, sentiment, and position numbers. Every "multi-model"
score was therefore one model's guess about other models.

The rebuilt core **queries each real model directly**, stores the **verbatim
response**, and **computes** every metric from that text with the documented
formulas below. Nothing is invented by an LLM.

## Pipeline

```
discovery query  ──►  each active model (real API, N runs, temp>0)
                         │  verbatim response text stored in raw_responses
                         ▼
                    metric extraction (per response)
                         ▼
                    aggregation across N runs  ──►  stable score + variance
```

The brand name is **deliberately excluded** from the query. We send the category
question (e.g. *"What are the best note-taking apps?"*) and measure whether the
model surfaces the brand on its own — that is what organic AI visibility means.

## Active models

Models are resolved at runtime from configured provider keys
(`providers/registry.py`), so the system runs with whatever is available and
lights up more models as keys are added. Current registry (`config.py`):

| id            | model                 | provider | activates with   |
|---------------|-----------------------|----------|------------------|
| gemini        | gemini-2.0-flash      | Google   | GEMINI_API_KEY   |
| gpt-oss-120b  | openai/gpt-oss-120b   | Groq     | GROQ_API_KEY     |
| qwen3         | qwen/qwen3.8-27b      | Groq     | GROQ_API_KEY     |
| gpt-oss-20b   | openai/gpt-oss-20b    | Groq     | GROQ_API_KEY     |

## Metric definitions (`services/metrics.py`)

For a response text `T` and target brand `B` (with aliases):

- **mentioned** — `B` occurs in `T` (word-boundary, case-insensitive).
- **mention_count** — number of such occurrences.
- **first_pos** — char index of first occurrence / `len(T)`, in `[0,1]`.
- **prominence** — `1 − first_pos` (earlier mention ⇒ higher).
- **frequency** — `min(mention_count / 3, 1)`.
- **visibility_score** — `0` if not mentioned, else
  `100 · (0.40 + 0.30·prominence + 0.30·frequency)`.
  Weights: presence 0.40, prominence 0.30, frequency 0.30 (sum 1.0).
- **position_rank** — rank of `B`'s first mention among all tracked entities
  (brand + competitors) ordered by first appearance; `1` = first. With no
  competitors, bucketed from `first_pos` into `1..5`. `None` if absent.
- **sentiment** — mean VADER compound over the sentences that mention `B`,
  mapped from `[−1,1]` to `[0,100]`; label by ±0.05 band.

### Aggregation across `N` runs (per model)

- **appearance_rate** — fraction of runs that mentioned the brand. This is the
  headline stable signal: *"appeared in 7/10 real responses."*
- **visibility_score** — mean over runs; **visibility_std** — population std.
- **mention_count / sentiment** — mean over runs (sentiment over runs that mentioned `B`).
- **position_rank** — median over runs where `B` appeared.

## Share of Voice (`services/analysis_service.py`)

Over every successful response, mentions of the brand and each competitor are
counted; `share = entity_mentions / total_category_mentions`. Reported per
entity with the target flagged.

## Citation / source tracking (Feature 2, `services/citations.py`)

Two honest, distinct sources are collected per response and aggregated by domain:

- **grounding** — real pages a model's API reports as consulted. Gemini search
  grounding is requested via the `google_search` tool; sources are read from
  `candidate.groundingMetadata.groundingChunks[].web`. (A tier that rejects the
  tool falls back to an ungrounded call automatically.)
- **in_text** — URLs a model wrote into its own answer (any provider), extracted
  by regex and reduced to domains.

Each domain is ranked by citation count and flagged `grounded` if any grounded
citation referenced it, with the list of models that cited it. Non-grounded
models (GPT-OSS, Qwen) contribute only when they emit URLs, so a run with no
Gemini key typically shows few or no sources — which is the honest result.

## Website auditor, recommendations & impact experiment (Feature 3)

**Auditor** (`services/auditor.py`) fetches the brand's own page and scores
GEO-readiness on signals the GEO literature (Aggarwal et al., 2024) links to
higher citation odds. Weights sum to 100; `geo_score` = sum of passed weights:

| signal | weight |
|---|---|
| Structured data (JSON-LD) | 20 |
| Quantified claims / statistics | 15 |
| Organization/Product schema type | 10 |
| Outbound authoritative links | 10 |
| Definitional, quotable phrasing | 10 |
| FAQ / question-style content | 10 |
| Content depth (300+ words) | 10 |
| Meta description (50–160 chars) | 10 |
| Page title present | 5 |

**Recommendations** (`services/recommendations.py`) are rule-based: every failed
signal maps to a prioritised fix (priority from the signal's weight), plus a
content-gap fix built from the `keywords_missing` that models associate with the
category but not the brand. Each carries concrete `suggested` text or a JSON-LD snippet.

**Impact experiment** (`services/experiment.py`) tests whether those fixes work,
as a controlled A/B against the real models. Four design choices make the result
trustworthy on free quotas (no paid APIs, few calls):

1. **Competitive pool.** The brand is placed in a field of competitors (from the
   analysis's Share of Voice, or generic placeholders) that all start from an
   equal one-line baseline. Handing a model only the brand's own page saturates
   visibility (~90+, no headroom); competing against equal options restores
   headroom and isolates the recommended content as the only differentiator —
   mirroring the GEO paper's content-variation method.
2. **Paired.** control and treatment are compared for the *same*
   model+prompt+run, so each pair cancels that model's baseline (the dominant
   noise source). Paired differences need far fewer calls than independent means.
3. **Low temperature** (`EXPERIMENT_TEMPERATURE`, default 0.2) so each call is
   near-deterministic and the content effect dominates.
4. **Significance.** We report the mean paired lift with a 95% confidence
   interval (t-interval over the paired diffs) and only claim an improvement when
   the interval excludes zero. A noisy or null result honestly reports "not
   statistically significant."

*control* = query + equal-baseline pool; *treatment* = same pool with the
recommended content added to the brand's entry only. Example (Mistral AI vs
OpenAI/Anthropic/Google/Cohere, 3 Groq models, 3 runs, 1 prompt, 8 paired
samples): visibility 79.3 → 95.5, lift **+16.2 (95% CI +12.5 to +19.9)**,
significant — from ~24 API calls.

## Geographic visibility

A lightweight single-representative-model sweep across regions
(`GEO_RUNS_PER_PROMPT`, default 1) re-runs the prompts with region-localized
phrasing and reports mean visibility per region. Kept cheap to respect free-tier
limits; raise the run count for a smoother (less noisy) signal.

## Scheduled monitoring & drift alerts (Feature 4, `services/scheduler.py`)

A `Monitor` records a watched brand (region, prompts, competitors, interval,
drop threshold). An `AsyncIOScheduler` (APScheduler) re-runs each enabled monitor
on its interval; every run is persisted as an `AnalysisRecord` with
`source="scheduled"` and the `monitor_id`, so a brand's history forms a time
series (plotted on the Monitor page). After each run the new average visibility is
compared to the monitor's stored baseline: a fall of more than `drop_threshold`
raises a `visibility_drop` alert (high severity if it exceeds twice the
threshold), a comparable rise raises an informational `visibility_rise`, and the
baseline is updated. Monitors are reloaded and rescheduled on startup.

## Accounts & export (Feature 5)

Optional JWT auth (`services/security.py`, `routers/auth.py`): passwords are
hashed with bcrypt, a signed token carries the user id, and a dependency resolves
the current user. Auth is **optional** — requests without a token use the
anonymous bucket (`user_id` NULL), so the app stays usable without logging in,
while analyses, monitors and alerts are scoped by `user_id` for signed-in users.
Any stored analysis exports to a branded **PDF** (`services/report.py`,
reportlab) or CSV.

## Reproducibility / cost knobs (`config.py`)

`RUNS_PER_PROMPT` (default 3), `GEO_RUNS_PER_PROMPT` (1), `QUERY_TEMPERATURE`
(0.7), `MAX_CONCURRENCY` (6). Every raw response is persisted in the
`raw_responses` table keyed to its analysis, so any score can be audited back to
the exact text that produced it.
