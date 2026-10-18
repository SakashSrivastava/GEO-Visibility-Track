# GEO Visibility Tracker

[![CI](https://github.com/SakashSrivastava/GEO-Visibility-Track/actions/workflows/ci.yml/badge.svg)](https://github.com/SakashSrivastava/GEO-Visibility-Track/actions/workflows/ci.yml)
[![Deploy](https://github.com/SakashSrivastava/GEO-Visibility-Track/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/SakashSrivastava/GEO-Visibility-Track/actions/workflows/deploy-pages.yml)

**Live UI:** https://sakashsrivastava.github.io/GEO-Visibility-Track/
_(front end only — connect a hosted backend via the `VITE_API_URL` repo variable to enable live data)_

Measure how a brand is represented in **AI-generated answers** — the way Search
Engine Optimization measures ranking in Google. As discovery shifts from search
engines to assistants like ChatGPT, Gemini and Claude, a brand that AI models
never mention is invisible to a growing share of users. This tool measures that
visibility across multiple real models, benchmarks it against competitors, tracks
the sources models rely on, audits a site, and tests whether fixes actually help.

> **Honest measurement.** Earlier prototypes asked a single LLM to *simulate* how
> other models would answer and to invent the scores. This version **queries each
> real model's API directly**, stores the **verbatim response**, and **computes**
> every metric from that text with documented formulas — repeated over multiple
> runs with statistics. Nothing is simulated. See [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md).

## Features

- **Multi-model visibility** — each discovery query is sent to every configured
  model *N* times (the brand name is withheld, so we measure organic mentions),
  and visibility, prominence, position, sentiment and mention count are computed
  from the real text, aggregated with mean/std and an **appearance rate**.
- **Share of Voice** — mention share of the brand vs named competitors, counted
  from the real responses.
- **Citation & source tracking** — which websites models rely on, from Gemini
  search grounding (consulted sources) and URLs models cite in text.
- **Website auditor + recommendations** — scores a page's GEO-readiness on a
  documented rubric (structured data, statistics, authoritative phrasing, FAQ,
  …) and generates prioritized, concrete fixes (JSON-LD, meta, content).
- **Measurable-impact experiment** — a paired, significance-tested A/B in a
  competitive pool that measures whether the recommended content *actually*
  raises the brand's visibility, reported with a 95% confidence interval.
- **Scheduled monitoring + drift alerts** — watch a brand on a schedule
  (APScheduler); every run is stored as a time series, a trend chart is plotted,
  and an alert fires when average visibility drops beyond a threshold.
- **Accounts & report export** — optional JWT login with per-user private
  history and monitors, plus one-click **PDF** and CSV export of any analysis.

## Architecture

```
frontend/   React + Vite dashboard (Analyze · Compare · Optimize · Monitor · History)
backend/    FastAPI + SQLAlchemy (SQLite)
  providers/   pluggable real-model adapters (Groq, Gemini; OpenAI/Anthropic ready)
  services/    query engine, metrics, citations, auditor, recommendations,
               experiment, scheduler, security (auth), report (PDF)
  routers/     /api/analysis, /api/history, /api/audit, /api/monitor, /api/auth
```

Models are resolved at runtime from whichever provider keys are configured, so
adding a key is the only step needed to enable a model — see `MODEL_REGISTRY` in
`backend/config.py`.

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv/Scripts/activate        # Windows  (source venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
cp env.example .env          # then fill in your keys
uvicorn main:app --reload --port 8000
```

**API keys** (`backend/.env`): set `GROQ_API_KEY` (free) and/or `GEMINI_API_KEY`
(free tier). Gemini also enables grounded citations. `OPENAI_API_KEY` /
`ANTHROPIC_API_KEY` adapters activate automatically if added.

### Frontend

```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

## Deployment

Both tiers are containerised (`backend/Dockerfile`, `frontend/Dockerfile`), with
a `docker-compose.yml` for a local production-like run. See
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for Azure Container Apps, split hosting
(Vercel + Railway), and the production checklist.

## Tech stack

React · Vite · Recharts · FastAPI · Pydantic · SQLAlchemy · SQLite · httpx ·
vaderSentiment · BeautifulSoup · APScheduler · JWT (python-jose) · bcrypt ·
reportlab · Docker

## Methodology

All metric formulas, the audit rubric, and the experiment design are documented
in [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md) — written to be quotable in the
project report.
