from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List

from models.database import get_db, Monitor, Alert, AnalysisRecord
from models.schemas import (
    MonitorCreate, MonitorUpdate, MonitorOut, AlertOut, TrendPoint,
)
from services import scheduler as sched
from services.security import get_optional_user_id

router = APIRouter()


async def _owned(db, model, mid, user_id):
    row = (await db.execute(select(model).where(model.id == mid, model.user_id == user_id))).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail=f"{model.__name__} not found.")
    return row


def _to_out(m: Monitor) -> MonitorOut:
    out = MonitorOut.model_validate(m)
    out.next_run = sched.next_run_for(m.id)
    return out


@router.post("/", response_model=MonitorOut)
async def create_monitor(req: MonitorCreate, db: AsyncSession = Depends(get_db),
                         user_id: int | None = Depends(get_optional_user_id)):
    if not req.brand.strip() or not req.prompts:
        raise HTTPException(status_code=400, detail="Brand and at least one prompt are required.")
    m = Monitor(
        user_id=user_id,
        brand=req.brand.strip(), region=req.region, prompts=req.prompts,
        competitors=req.competitors, interval_minutes=req.interval_minutes,
        drop_threshold=req.drop_threshold, enabled=True,
    )
    db.add(m)
    await db.commit()
    await db.refresh(m)
    sched.schedule_monitor(m)
    if req.run_now:
        await sched.run_monitor_job(m.id)
        await db.refresh(m)
    return _to_out(m)


@router.get("/", response_model=List[MonitorOut])
async def list_monitors(db: AsyncSession = Depends(get_db),
                        user_id: int | None = Depends(get_optional_user_id)):
    rows = (await db.execute(
        select(Monitor).where(Monitor.user_id == user_id).order_by(Monitor.created_at.desc())
    )).scalars().all()
    return [_to_out(m) for m in rows]


@router.patch("/{mid}", response_model=MonitorOut)
async def update_monitor(mid: int, req: MonitorUpdate, db: AsyncSession = Depends(get_db),
                         user_id: int | None = Depends(get_optional_user_id)):
    m = await _owned(db, Monitor, mid, user_id)
    if req.enabled is not None:
        m.enabled = req.enabled
    if req.interval_minutes is not None:
        m.interval_minutes = req.interval_minutes
    if req.drop_threshold is not None:
        m.drop_threshold = req.drop_threshold
    await db.commit()
    await db.refresh(m)
    sched.schedule_monitor(m) if m.enabled else sched.unschedule_monitor(m.id)
    return _to_out(m)


@router.post("/{mid}/run", response_model=MonitorOut)
async def run_now(mid: int, db: AsyncSession = Depends(get_db),
                  user_id: int | None = Depends(get_optional_user_id)):
    m = await _owned(db, Monitor, mid, user_id)
    await sched.run_monitor_job(mid)
    await db.refresh(m)
    return _to_out(m)


@router.delete("/{mid}")
async def delete_monitor(mid: int, db: AsyncSession = Depends(get_db),
                         user_id: int | None = Depends(get_optional_user_id)):
    await _owned(db, Monitor, mid, user_id)
    sched.unschedule_monitor(mid)
    await db.execute(delete(Alert).where(Alert.monitor_id == mid))
    await db.execute(delete(Monitor).where(Monitor.id == mid))
    await db.commit()
    return {"deleted": mid}


@router.get("/{mid}/trend", response_model=List[TrendPoint])
async def monitor_trend(mid: int, db: AsyncSession = Depends(get_db),
                        user_id: int | None = Depends(get_optional_user_id)):
    await _owned(db, Monitor, mid, user_id)
    rows = (await db.execute(
        select(AnalysisRecord).where(AnalysisRecord.monitor_id == mid)
        .order_by(AnalysisRecord.created_at.asc())
    )).scalars().all()
    return [TrendPoint(created_at=r.created_at, avg_score=r.avg_score or 0.0,
                       source=r.source or "scheduled") for r in rows]


# ── Alerts ────────────────────────────────────────────────────────────────────

@router.get("/alerts/all", response_model=List[AlertOut])
async def list_alerts(unacknowledged: bool = False, db: AsyncSession = Depends(get_db),
                      user_id: int | None = Depends(get_optional_user_id)):
    q = select(Alert).where(Alert.user_id == user_id).order_by(Alert.created_at.desc())
    if unacknowledged:
        q = q.where(Alert.acknowledged == False)
    return (await db.execute(q)).scalars().all()


@router.post("/alerts/{aid}/ack")
async def ack_alert(aid: int, db: AsyncSession = Depends(get_db),
                    user_id: int | None = Depends(get_optional_user_id)):
    a = await _owned(db, Alert, aid, user_id)
    a.acknowledged = True
    await db.commit()
    return {"acknowledged": aid}
