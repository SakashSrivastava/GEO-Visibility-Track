from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ── Request ──────────────────────────────────────────────────────────────────

class AnalysisRequest(BaseModel):
    brand: str
    website: Optional[str] = ""
    region: str = "global"
    prompts: List[str]

class ComparisonRequest(BaseModel):
    brand: str
    website: str = ""
    competitors: list[str] = []  # List of competitor names or URLs
    region: str = "global"
    prompts: list[str]

# --- NEW: Share of Voice (SOV) Schema ---
class ShareOfVoice(BaseModel):
    brand_name: str
    sov_percentage: float  # (Brand Mentions / Total Mentions) * 100
    mentions: int


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

class ComparisonResponse(BaseModel):
    brand: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    share_of_voice: list[ShareOfVoice]
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