"""
Scheduled monitoring + drift alerts (Feature 4). An AsyncIOScheduler re-runs each
enabled Monitor on its interval; every run is stored (source="scheduled",
monitor_id set) so history becomes a time series, and a drop in average visibility
beyond the monitor's threshold raises an Alert.
"""
import statistics
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from models.database import AsyncSessionLocal, Monitor, Alert, AnalysisRecord
from services.analysis_service import run_real_analysis

scheduler = AsyncIOScheduler()


def _job_id(mid: int) -> str:
    return f"mon_{mid}"


def schedule_monitor(m: Monitor):
    if not m.enabled:
        unschedule_monitor(m.id)
        return
    scheduler.add_job(
        run_monitor_job, "interval", minutes=max(1, m.interval_minutes),
        args=[m.id], id=_job_id(m.id), replace_existing=True,
        max_instances=1, coalesce=True,
    )


def unschedule_monitor(mid: int):
    if scheduler.get_job(_job_id(mid)):
        scheduler.remove_job(_job_id(mid))


def next_run_for(mid: int):
    job = scheduler.get_job(_job_id(mid))
    return job.next_run_time.isoformat() if job and job.next_run_time else None


async def start_scheduler():
    if not scheduler.running:
        scheduler.start()
    async with AsyncSessionLocal() as db:
        monitors = (await db.execute(select(Monitor).where(Monitor.enabled == True))).scalars().all()
        for m in monitors:
            schedule_monitor(m)


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)


async def run_monitor_job(monitor_id: int):
    """Run one monitored analysis, persist it, and raise a drift alert if needed."""
    async with AsyncSessionLocal() as db:
        m = (await db.execute(select(Monitor).where(Monitor.id == monitor_id))).scalar_one_or_none()
        if not m or not m.enabled:
            return

        result, raw = await run_real_analysis(m.brand, m.region, m.prompts, m.competitors or [])
        ok = [x for x in result.models if x.ok]
        new_avg = round(statistics.mean(x.visibility_score for x in ok), 1) if ok else 0.0

        db.add(AnalysisRecord(
            user_id=m.user_id,
            brand=m.brand, region=m.region, prompts=m.prompts,
            results=result.model_dump(), avg_score=new_avg,
            monitor_id=m.id, source="scheduled",
        ))

        old = m.baseline_score
        if old is not None:
            delta = round(new_avg - old, 1)
            if delta <= -m.drop_threshold:
                db.add(Alert(
                    user_id=m.user_id, monitor_id=m.id, brand=m.brand, type="visibility_drop",
                    severity="high" if delta <= -2 * m.drop_threshold else "medium",
                    message=f"{m.brand} visibility dropped {abs(delta)} points ({old} -> {new_avg}).",
                    old_value=old, new_value=new_avg, delta=delta,
                ))
            elif delta >= m.drop_threshold:
                db.add(Alert(
                    user_id=m.user_id, monitor_id=m.id, brand=m.brand, type="visibility_rise", severity="info",
                    message=f"{m.brand} visibility rose {delta} points ({old} -> {new_avg}).",
                    old_value=old, new_value=new_avg, delta=delta,
                ))

        m.baseline_score = new_avg
        m.last_run = datetime.utcnow()
        await db.commit()
