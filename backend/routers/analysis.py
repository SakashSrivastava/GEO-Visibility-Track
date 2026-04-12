from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from models.schemas import AnalysisRequest, AnalysisResponse
from models.database import get_db, AnalysisRecord
from services.ai_service import run_ai_analysis

router = APIRouter()


@router.post("/run", response_model=AnalysisResponse)
async def run_analysis(
    req: AnalysisRequest,
    db: AsyncSession = Depends(get_db),
):
    if not req.brand.strip():
        raise HTTPException(status_code=400, detail="Brand name or website is required.")
    if not req.prompts:
        raise HTTPException(status_code=400, detail="At least one prompt is required.")

    try:
        result = await run_ai_analysis(
            brand=req.brand,
            region=req.region,
            prompts=req.prompts,
            website=req.website or "",
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {str(e)}")

    # Persist to DB
    avg_score = sum(m.visibility_score for m in result.models) / len(result.models)

    record = AnalysisRecord(
        brand=req.brand,
        region=req.region,
        prompts=req.prompts,
        results=result.model_dump(),
        avg_score=round(avg_score, 1),
    )
    db.add(record)
    await db.commit()

    return result


@router.get("/models")
async def list_models():
    return {
        "models": [
            {"id": "claude",  "name": "Claude",  "provider": "Anthropic", "color": "#4f8ef7"},
            {"id": "gpt",     "name": "GPT-4",   "provider": "OpenAI",    "color": "#34d399"},
            {"id": "gemini",  "name": "Gemini",  "provider": "Google",    "color": "#a78bfa"},
            {"id": "llama",   "name": "Llama",   "provider": "Meta",      "color": "#f59e0b"},
        ]
    }


@router.get("/regions")
async def list_regions():
    return {
        "regions": [
            {"value": "global", "label": "Global",         "flag": "🌐"},
            {"value": "us",     "label": "United States",  "flag": "🇺🇸"},
            {"value": "uk",     "label": "United Kingdom", "flag": "🇬🇧"},
            {"value": "in",     "label": "India",          "flag": "🇮🇳"},
            {"value": "de",     "label": "Germany",        "flag": "🇩🇪"},
            {"value": "jp",     "label": "Japan",          "flag": "🇯🇵"},
            {"value": "br",     "label": "Brazil",         "flag": "🇧🇷"},
            {"value": "au",     "label": "Australia",      "flag": "🇦🇺"},
        ]
    }