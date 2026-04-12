from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    SERPAPI_KEY: str = ""
    DATABASE_URL: str = "sqlite+aiosqlite:///./geo_tracker.db"
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"


settings = Settings()