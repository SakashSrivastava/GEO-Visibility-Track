from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, Boolean
from datetime import datetime

from config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class AnalysisRecord(Base):
    __tablename__ = "analyses"

    id         = Column(Integer, primary_key=True, index=True)
    brand      = Column(String, index=True)
    region     = Column(String)
    prompts    = Column(JSON)          # list of prompt strings used
    results    = Column(JSON)          # full aggregated result payload
    avg_score  = Column(Float)
    monitor_id = Column(Integer, index=True, nullable=True)   # set for scheduled runs
    source     = Column(String, default="manual")             # manual | scheduled
    created_at = Column(DateTime, default=datetime.utcnow)


class RawResponse(Base):
    """Verbatim text of every real model call, kept for audit and citations."""
    __tablename__ = "raw_responses"

    id          = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, index=True)
    model_id    = Column(String)
    prompt      = Column(Text)
    query       = Column(Text)
    run         = Column(Integer)
    ok          = Column(Boolean, default=True)
    text        = Column(Text)
    error       = Column(Text, nullable=True)
    citations   = Column(JSON, default=list)   # grounding sources reported by the API
    created_at  = Column(DateTime, default=datetime.utcnow)


class Monitor(Base):
    """A watched brand: re-run on a schedule and alert on drift (Feature 4)."""
    __tablename__ = "monitors"

    id             = Column(Integer, primary_key=True, index=True)
    brand          = Column(String, index=True)
    region         = Column(String, default="global")
    prompts        = Column(JSON)
    competitors    = Column(JSON, default=list)
    interval_minutes = Column(Integer, default=1440)   # default daily
    drop_threshold = Column(Float, default=10.0)        # alert if avg visibility falls > this
    enabled        = Column(Boolean, default=True)
    baseline_score = Column(Float, nullable=True)       # last observed avg visibility
    last_run       = Column(DateTime, nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow)


class Alert(Base):
    """A drift event raised by a scheduled run (Feature 4)."""
    __tablename__ = "alerts"

    id           = Column(Integer, primary_key=True, index=True)
    monitor_id   = Column(Integer, index=True)
    brand        = Column(String)
    type         = Column(String)        # visibility_drop | visibility_rise | appearance_drop
    severity     = Column(String)        # high | medium | info
    message      = Column(Text)
    old_value    = Column(Float, nullable=True)
    new_value    = Column(Float, nullable=True)
    delta        = Column(Float, nullable=True)
    acknowledged = Column(Boolean, default=False)
    created_at   = Column(DateTime, default=datetime.utcnow)


def _add_missing_columns(conn):
    """Lightweight SQLite migration: add any model columns missing from a table."""
    from sqlalchemy import inspect, text
    insp = inspect(conn)
    existing_tables = insp.get_table_names()
    for table in Base.metadata.tables.values():
        if table.name not in existing_tables:
            continue
        have = {c["name"] for c in insp.get_columns(table.name)}
        for col in table.columns:
            if col.name not in have:
                col_type = col.type.compile(conn.dialect)
                conn.execute(text(f'ALTER TABLE {table.name} ADD COLUMN {col.name} {col_type}'))


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_add_missing_columns)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
