from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from models.schemas import AnalysisRequest, AnalysisResponse
from models.database import get_db, AnalysisRecord, RawResponse
from services.analysis_service import run_real_analysis
from providers import active_models

router = APIRouter()


@router.post("/run", response_model=AnalysisResponse)
async def run_analysis(req: AnalysisRequest, db: AsyncSession = Depends(get_db)):
    """Run a real multi-model GEO visibility analysis and persist it."""
    if not req.brand.strip():
        raise HTTPException(status_code=400, detail="Brand name is required.")
    if not req.prompts:
        raise HTTPException(status_code=400, detail="At least one prompt is required.")

    try:
        result, raw = await run_real_analysis(
            req.brand, req.region, req.prompts, req.competitors
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {e}")

    ok_models = [m for m in result.models if m.ok]
    avg_score = (sum(m.visibility_score for m in ok_models) / len(ok_models)) if ok_models else 0.0

    record = AnalysisRecord(
        brand=req.brand, region=req.region, prompts=req.prompts,
        results=result.model_dump(), avg_score=round(avg_score, 1),
    )
    db.add(record)
    await db.flush()                      # assign record.id before linking raws

    for r in raw:
        db.add(RawResponse(
            analysis_id=record.id, model_id=r["model_id"], prompt=r["prompt"],
            query=r["query"], run=r["run"], ok=r["ok"], text=r["text"], error=r["error"],
            citations=r.get("citations") or [],
        ))
    await db.commit()
    return result


@router.get("/models")
async def list_models():
    """Return the real models currently active (based on configured provider keys)."""
    return {"models": [
        {"id": m["id"], "name": m["name"], "provider": m["provider"], "color": m["color"]}
        for m in active_models()
    ]}


@router.get("/regions")
async def list_regions():
    return {"regions": [
        {"value": "global", "label": "Global",         "flag": "🌐"},
        {"value": "us",     "label": "United States",   "flag": "🇺🇸"},
        {"value": "uk",     "label": "United Kingdom",  "flag": "🇬🇧"},
        {"value": "in",     "label": "India",           "flag": "🇮🇳"},
        {"value": "de",     "label": "Germany",         "flag": "🇩🇪"},
        {"value": "jp",     "label": "Japan",           "flag": "🇯🇵"},
        {"value": "br",     "label": "Brazil",          "flag": "🇧🇷"},
        {"value": "au",     "label": "Australia",       "flag": "🇦🇺"},
    ]}
