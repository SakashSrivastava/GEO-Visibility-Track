from fastapi import APIRouter, HTTPException

from models.schemas import (
    AuditRequest, AuditResponse, SiteAudit, Recommendation, ExperimentResult,
)
from providers import active_models
from services.auditor import run_audit
from services.recommendations import build_recommendations, build_treatment_addendum
from services.experiment import run_experiment
from services.analysis_service import brand_aliases

router = APIRouter()


@router.post("/run", response_model=AuditResponse)
async def run_full_audit(req: AuditRequest):
    """Audit the brand's site, generate GEO recommendations, and (optionally)
    run the measurable-impact experiment."""
    if not req.brand.strip():
        raise HTTPException(status_code=400, detail="Brand name is required.")
    if not req.url.strip():
        raise HTTPException(status_code=400, detail="Website URL is required.")

    audit = await run_audit(req.url.strip())
    recs = build_recommendations(req.brand, audit, req.missing_keywords) if audit["fetched"] else []

    experiment = None
    if req.run_experiment and audit["fetched"] and req.prompts:
        addendum = build_treatment_addendum(req.brand, recs, req.missing_keywords)
        exp = await run_experiment(
            req.brand, req.prompts, req.region, audit.get("text_excerpt", ""),
            addendum, brand_aliases(req.brand), active_models(), req.competitors,
        )
        experiment = ExperimentResult(**exp)

    return AuditResponse(
        brand=req.brand,
        audit=SiteAudit(**{k: v for k, v in audit.items() if k != "text_excerpt"}),
        recommendations=[Recommendation(**r) for r in recs],
        experiment=experiment,
    )
