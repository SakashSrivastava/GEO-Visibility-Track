from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List

from models.database import get_db, AnalysisRecord
from models.schemas import HistoryItem

router = APIRouter()


@router.get("/", response_model=List[HistoryItem])
async def get_history(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """Fetch recent analyses, newest first."""
    result = await db.execute(
        select(AnalysisRecord)
        .order_by(AnalysisRecord.created_at.desc())
        .limit(limit)
    )
    records = result.scalars().all()
    return records


@router.get("/{record_id}", response_model=HistoryItem)
async def get_history_item(
    record_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Fetch a single analysis by ID (includes full results payload)."""
    result = await db.execute(
        select(AnalysisRecord).where(AnalysisRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return record


@router.delete("/{record_id}")
async def delete_history_item(
    record_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single analysis record."""
    await db.execute(
        delete(AnalysisRecord).where(AnalysisRecord.id == record_id)
    )
    await db.commit()
    return {"deleted": record_id}


@router.delete("/")
async def clear_history(db: AsyncSession = Depends(get_db)):
    """Delete all analysis history."""
    await db.execute(delete(AnalysisRecord))
    await db.commit()
    return {"message": "History cleared."}
