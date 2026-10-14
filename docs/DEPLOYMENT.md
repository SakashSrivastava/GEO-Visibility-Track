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

## Option B — Split hosting

- **Frontend** → Vercel or Netlify (static build; set `VITE_API_URL`).
- **Backend** → Railway / Render / Fly.io (container; set env vars; 1 instance).
- Point `CORS_ORIGINS` at the frontend domain.

## GitHub

The repo already builds in CI-friendly steps (`pip install`, `npm run build`).
GitHub Pages can host the **frontend** static build, but the **backend** needs a
container host (Azure/Railway/etc.) — Pages cannot run FastAPI.
