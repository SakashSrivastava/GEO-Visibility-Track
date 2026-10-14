from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List

from models.database import get_db, AnalysisRecord
from models.schemas import HistoryItem
from services.security import get_optional_user_id
from services.report import build_report

router = APIRouter()


@router.get("/{record_id}/report.pdf")
async def download_report(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int | None = Depends(get_optional_user_id),
):
    """Download a branded PDF report for one stored analysis."""
    rec = (await db.execute(
        select(AnalysisRecord)
        .where(AnalysisRecord.id == record_id, AnalysisRecord.user_id == user_id)
    )).scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    pdf = build_report(rec.results or {"brand": rec.brand}, rec.created_at)
    fname = f"geo-report-{rec.brand}-{record_id}.pdf".replace(" ", "_")
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{fname}"'})


@router.get("/", response_model=List[HistoryItem])
async def get_history(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    user_id: int | None = Depends(get_optional_user_id),
):
    """Fetch recent analyses for the current user (or the anonymous bucket)."""
    result = await db.execute(
        select(AnalysisRecord)
        .where(AnalysisRecord.user_id == user_id)
        .order_by(AnalysisRecord.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{record_id}", response_model=HistoryItem)
async def get_history_item(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int | None = Depends(get_optional_user_id),
):
    """Fetch a single analysis by ID (includes full results payload)."""
    result = await db.execute(
        select(AnalysisRecord)
        .where(AnalysisRecord.id == record_id, AnalysisRecord.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return record


@router.delete("/{record_id}")
async def delete_history_item(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int | None = Depends(get_optional_user_id),
):
    """Delete a single analysis record owned by the current user."""
    await db.execute(
        delete(AnalysisRecord)
        .where(AnalysisRecord.id == record_id, AnalysisRecord.user_id == user_id)
    )
    await db.commit()
    return {"deleted": record_id}


@router.delete("/")
async def clear_history(
    db: AsyncSession = Depends(get_db),
    user_id: int | None = Depends(get_optional_user_id),
):
    """Delete the current user's analysis history."""
    await db.execute(delete(AnalysisRecord).where(AnalysisRecord.user_id == user_id))
    await db.commit()
    return {"message": "History cleared."}
