from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# ── Request ──────────────────────────────────────────────────────────────────

class AnalysisRequest(BaseModel):
    brand: str
    website: Optional[str] = ""
    region: str = "global"
    prompts: List[str]


# ── Sub-models ────────────────────────────────────────────────────────────────

class ModelResult(BaseModel):
    id: str
    name: str
    visibility_score: float
    mention_count: int
    sentiment_score: float
    sentiment_label: str
    position_rank: int
    context_snippet: str
    keywords_found: List[str]
    keywords_missing: List[str]


class GeoVisibility(BaseModel):
    region: str
    flag: str
    score: float


# ── Response ──────────────────────────────────────────────────────────────────

class AnalysisResponse(BaseModel):
    brand: str
    region: str
    timestamp: str
    models: List[ModelResult]
    geo_visibility: List[GeoVisibility]
    summary: str


class HistoryItem(BaseModel):
    id: int
    brand: str
    region: str
    avg_score: float
    created_at: datetime
    results: Optional[dict] = None

    class Config:
        from_attributes = True