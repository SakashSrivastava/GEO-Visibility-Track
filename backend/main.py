from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import analysis, history
from models.database import init_db
from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


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


@app.get("/")
async def root():
    return {"status": "ok", "message": "GEO Visibility Tracker API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
