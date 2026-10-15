from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # ── Provider API keys ────────────────────────────────────────────────────
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""        # reserved — adapter auto-activates when set
    ANTHROPIC_API_KEY: str = ""     # reserved — adapter auto-activates when set
    SERPAPI_KEY: str = ""

    DATABASE_URL: str = "sqlite+aiosqlite:///./geo_tracker.db"
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]

    # ── Auth (Feature 5) ──────────────────────────────────────────────────────
    JWT_SECRET: str = "dev-secret-change-in-production"
    JWT_EXPIRE_MINUTES: int = 10080     # 7 days

    # ── Measurement settings ─────────────────────────────────────────────────
    # Each (model x prompt) is queried RUNS_PER_PROMPT times at a non-zero
    # temperature; metrics are aggregated across runs so scores carry variance.
    RUNS_PER_PROMPT: int = 3
    GEO_RUNS_PER_PROMPT: int = 1    # geo sweep is runs x regions x models — kept cheap
    QUERY_TEMPERATURE: float = 0.7  # >0 so stochastic variation is real, not faked
    MAX_CONCURRENCY: int = 6        # global cap on in-flight provider calls
    REQUEST_TIMEOUT: float = 60.0
    GROUNDING_ENABLED: bool = True  # ask Gemini to ground answers in web search (Feature 2)
    EXPERIMENT_RUNS: int = 3        # runs per prompt per condition in the impact experiment (Feature 3)
    EXPERIMENT_TEMPERATURE: float = 0.2   # low temp isolates the content effect (paired A/B)

    class Config:
        env_file = ".env"


settings = Settings()


# ── Real model registry ───────────────────────────────────────────────────────
# Every entry is a genuinely distinct model reached through its provider's real
# API. `requires` names the settings key that must be non-empty for the model to
# be active, so the system runs with whatever keys are configured and lights up
# more models as keys are added. Edit IDs here if a provider retires a model.
MODEL_REGISTRY = [
    {
        "id": "gemini",
        "name": "Gemini Flash",
        "provider": "google",
        "model": "gemini-flash-latest",   # alias tracks the current stable flash model
        "requires": "GEMINI_API_KEY",
        "color": "#a78bfa",
    },
    {
        "id": "gpt-oss-120b",
        "name": "GPT-OSS 120B",
        "provider": "groq",
        "model": "openai/gpt-oss-120b",
        "requires": "GROQ_API_KEY",
        "color": "#34d399",
    },
    {
        "id": "qwen3",
        "name": "Qwen3 27B",
        "provider": "groq",
        "model": "qwen/qwen3.8-27b",
        "requires": "GROQ_API_KEY",
        "color": "#f59e0b",
    },
    {
        "id": "gpt-oss-20b",
        "name": "GPT-OSS 20B",
        "provider": "groq",
        "model": "openai/gpt-oss-20b",
        "requires": "GROQ_API_KEY",
        "color": "#4f8ef7",
    },
]
