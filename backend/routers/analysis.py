from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from services.recommendations_service import generate_geo_recommendations
import json

# Added ComparisonRequest and ComparisonResponse
from models.schemas import AnalysisRequest, AnalysisResponse, ComparisonRequest, ComparisonResponse
from models.database import get_db, AnalysisRecord
# Added run_comparison_analysis
from services.ai_service import run_ai_analysis, run_comparison_analysis

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

    # Persist single-brand audits to DB for history
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

# --- NEW: Comparison Endpoint ---
@router.post("/compare", response_model=ComparisonResponse)
async def run_comparison(
    req: ComparisonRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Endpoint to benchmark a brand against competitors.
    """
    if not req.brand.strip():
        raise HTTPException(status_code=400, detail="Primary brand is required.")
    if not req.competitors:
        raise HTTPException(status_code=400, detail="At least one competitor is required.")

    try:
        # Call the new comparison service
        result = await run_comparison_analysis(
            brand=req.brand,
            competitors=req.competitors,
            region=req.region,
            prompts=req.prompts,
            website=req.website or "",
        )
        
        # Note: In a production version, you would also save this to a 
        # ComparisonRecord table in the database for history tracking.
        
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Comparison analysis failed: {str(e)}")


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


@router.post("/recommendations")
async def get_recommendations(payload: dict):
    """
    Endpoint to trigger the AI recommendation engine.
    Expects: { "brand": "...", "analysis_data": [...] }
    """
    brand = payload.get("brand")
    analysis_data = payload.get("analysis_data")

    if not brand or not analysis_data:
        return {"error": "Missing brand or analysis data"}, 400

    # Call the service we created in Step 1
    raw_recommendations = await generate_geo_recommendations(brand, analysis_data)
    
    try:
        # We try to parse it to ensure it's valid JSON before sending to frontend
        clean_data = json.loads(raw_recommendations)
        return {"recommendations": clean_data}
    except:
        # If the AI failed to give clean JSON, we return the raw string
        return {"recommendations": raw_recommendations}