from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import analysis, history, audit, monitor
from models.database import init_db
from services.scheduler import start_scheduler, shutdown_scheduler
from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await start_scheduler()
    yield
    shutdown_scheduler()


app = FastAPI(
    title="GEO Visibility Tracker API",
    description="Track brand visibility across AI models and regions",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(history.router,  prefix="/api/history",  tags=["History"])
app.include_router(audit.router,    prefix="/api/audit",    tags=["Audit"])
app.include_router(monitor.router,  prefix="/api/monitor",  tags=["Monitor"])


@app.get("/")
async def root():
    return {"status": "ok", "message": "GEO Visibility Tracker API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
