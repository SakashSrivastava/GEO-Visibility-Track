from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# ── Request ──────────────────────────────────────────────────────────────────

class AnalysisRequest(BaseModel):
    brand: str
    region: str = "global"
    prompts: List[str]
    competitors: List[str] = []          # Feature 1: Share of Voice


# ── Sub-models ────────────────────────────────────────────────────────────────

class ModelResult(BaseModel):
    id: str
    name: str
    provider: str = ""
    model: str = ""                      # concrete API model queried
    visibility_score: float
    visibility_std: float = 0.0          # variation across runs
    appearance_rate: float = 0.0         # fraction of runs that mentioned the brand
    run_count: int = 0
    mention_count: int
    sentiment_score: float
    sentiment_label: str
    position_rank: Optional[int] = None
    context_snippet: str = ""            # a REAL quote from a response
    keywords_found: List[str] = []
    keywords_missing: List[str] = []
    ok: bool = True
    error: Optional[str] = None


class GeoVisibility(BaseModel):
    region: str
    flag: str
    score: float


class CompetitorShare(BaseModel):         # Feature 1
    name: str
    mentions: int
    share: float                          # % of category mentions
    is_target: bool = False


class CitationSource(BaseModel):          # Feature 2
    domain: str
    count: int
    models: List[str] = []
    grounded: bool = False                # True if a model's API reported it as a consulted source
    sample_url: str = ""
    sample_title: str = ""


# ── Response ──────────────────────────────────────────────────────────────────

class AnalysisResponse(BaseModel):
    brand: str
    region: str
    timestamp: str
    models: List[ModelResult]
    geo_visibility: List[GeoVisibility]
    share_of_voice: List[CompetitorShare] = []
    citations: List[CitationSource] = []
    summary: str
    run_count: int = 0                    # runs per prompt used


# ── Feature 3: audit / recommendations / experiment ──────────────────────────

class AuditRequest(BaseModel):
    brand: str
    url: str
    region: str = "global"
    prompts: List[str] = []
    missing_keywords: List[str] = []
    competitors: List[str] = []       # competitive pool for the impact experiment
    run_experiment: bool = True


class AuditSignal(BaseModel):
    key: str
    label: str
    weight: float
    passed: bool
    detail: str


class SiteAudit(BaseModel):
    url: str
    fetched: bool
    status: Optional[int] = None
    geo_score: float
    signals: List[AuditSignal] = []
    schema_types: List[str] = []
    word_count: int = 0
    title: str = ""
    error: Optional[str] = None


class Recommendation(BaseModel):
    title: str
    type: str                 # content | schema | meta
    priority: str             # high | medium | low
    rationale: str
    suggested: str


class ExperimentResult(BaseModel):
    ran: bool
    runs: int = 0
    baseline_visibility: float = 0.0
    treatment_visibility: float = 0.0
    baseline_appearance: float = 0.0
    treatment_appearance: float = 0.0
    lift: float = 0.0
    lift_ci_low: float = 0.0
    lift_ci_high: float = 0.0
    significant: bool = False
    n_pairs: int = 0
    improved: bool = False
    note: str = ""
    detail: str = ""


class AuditResponse(BaseModel):
    brand: str
    audit: SiteAudit
    recommendations: List[Recommendation] = []
    experiment: Optional[ExperimentResult] = None


# ── Feature 4: monitoring / alerts / trends ──────────────────────────────────

class MonitorCreate(BaseModel):
    brand: str
    region: str = "global"
    prompts: List[str]
    competitors: List[str] = []
    interval_minutes: int = 1440
    drop_threshold: float = 10.0
    run_now: bool = True


class MonitorUpdate(BaseModel):
    enabled: Optional[bool] = None
    interval_minutes: Optional[int] = None
    drop_threshold: Optional[float] = None


class MonitorOut(BaseModel):
    id: int
    brand: str
    region: str
    prompts: List[str]
    competitors: List[str] = []
    interval_minutes: int
    drop_threshold: float
    enabled: bool
    baseline_score: Optional[float] = None
    last_run: Optional[datetime] = None
    next_run: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AlertOut(BaseModel):
    id: int
    monitor_id: int
    brand: str
    type: str
    severity: str
    message: str
    old_value: Optional[float] = None
    new_value: Optional[float] = None
    delta: Optional[float] = None
    acknowledged: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TrendPoint(BaseModel):
    created_at: datetime
    avg_score: float
    source: str


# ── Feature 5: auth ───────────────────────────────────────────────────────────

class AuthRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str


class UserOut(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class HistoryItem(BaseModel):
    id: int
    brand: str
    region: str
    avg_score: float
    created_at: datetime
    results: Optional[dict] = None

    class Config:
        from_attributes = True
