# Deployment

The app is a FastAPI backend + a static React frontend. Both are containerised.
Deployment target (Azure vs. other) is not fixed yet — this guide covers the
options and the production checklist.

## Local production-like run

```bash
export GROQ_API_KEY=...        # and GEMINI_API_KEY=... if available
export JWT_SECRET=$(openssl rand -hex 32)
docker compose up --build
# frontend: http://localhost:8080   backend: http://localhost:8000
```

## Production checklist

- **Secrets** come from environment variables, never from committed files. Set
  `GROQ_API_KEY`, `GEMINI_API_KEY`, and a strong `JWT_SECRET`.
- **CORS**: set `CORS_ORIGINS` to your deployed frontend origin(s), e.g.
  `["https://geo.example.com"]`.
- **Frontend API URL**: build the frontend with `VITE_API_URL` pointing at the
  deployed backend (build arg in `frontend/Dockerfile`).
- **Single scheduler instance**: the APScheduler monitor scheduler runs
  in-process. Run the backend as **one replica / one worker** so scheduled jobs
  don't double-fire. To scale the API horizontally, move scheduling to an
  external worker or a DB-backed job store.
- **Database**: SQLite is fine for a single instance. For scale, set
  `DATABASE_URL` to Postgres (`postgresql+asyncpg://...`) — the SQLAlchemy models
  are portable; add `asyncpg` to requirements.
- **Free-tier quotas**: scheduled analyses consume API calls. Keep monitor
  intervals reasonable (hourly/daily) and `RUNS_PER_PROMPT` modest.

## Option A — Azure (Container Apps)

1. Push both images to Azure Container Registry (`az acr build`).
2. Create a Container Apps environment.
3. Deploy the backend app (1 replica), set env vars/secrets, enable ingress on
   port 8000.
4. Deploy the frontend app built with `VITE_API_URL` = the backend's URL.
5. Set the backend's `CORS_ORIGINS` to the frontend's URL.

(Alternatively Azure App Service: one Web App for Containers per image.)

## Option B — Split hosting (current setup: GitHub Pages + Render)

The frontend already auto-deploys to **GitHub Pages** via
`.github/workflows/deploy-pages.yml` →
`https://sakashsrivastava.github.io/GEO-Visibility-Track/`. Host the backend
separately and connect the two.

### Backend on Render (recommended, free, one file)

1. Push includes `render.yaml` (a Blueprint). In Render: **New + → Blueprint →
   connect this repo**. Render reads `render.yaml` and creates the Docker web
   service `geo-visibility-api`.
2. When prompted, paste your `GROQ_API_KEY` and `GEMINI_API_KEY` (marked
   `sync: false` so they stay secret). `JWT_SECRET` is auto-generated.
3. Deploy. Copy the service URL, e.g. `https://geo-visibility-api.onrender.com`.
4. In GitHub: **Settings → Secrets and variables → Actions → Variables → New** →
   `VITE_API_URL` = that URL. Re-run the Pages deploy (push or "Re-run jobs").
5. The live frontend now talks to the backend. `CORS_ORIGINS` is already set to
   the Pages origin in `render.yaml`.

Notes: Render's free tier sleeps after ~15 min idle (first request wakes it,
~30 s) and its disk is ephemeral (SQLite resets on redeploy — fine for a demo;
use Render Postgres for persistence). Because it may sleep, scheduled monitors
only run while the service is awake.

### Backend on Railway (alternative)

New project → Deploy from repo → set **Root Directory** to `backend` (uses the
Dockerfile) → add the same env vars → deploy → copy the public URL into
`VITE_API_URL`.

### Frontend elsewhere

Vercel/Netlify also work for the frontend (static build; set `VITE_API_URL`) if
you prefer them over GitHub Pages.

## GitHub

The repo already builds in CI-friendly steps (`pip install`, `npm run build`).
GitHub Pages can host the **frontend** static build, but the **backend** needs a
container host (Azure/Railway/etc.) — Pages cannot run FastAPI.
