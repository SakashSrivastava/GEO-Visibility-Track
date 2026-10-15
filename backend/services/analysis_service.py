"""
Assembles a full AnalysisResponse from REAL model responses:
  1. query every active model N times per prompt (query_engine)
  2. compute documented metrics per response and aggregate across runs (metrics)
  3. derive Share of Voice vs competitors from the same responses (Feature 1)
  4. run a cheap cross-region sweep for geographic visibility
All numbers trace back to text a model actually produced; nothing is simulated.
"""
import re
import statistics
from collections import Counter, defaultdict
from datetime import datetime, timezone

from config import settings
from providers import active_models
from services.query_engine import run_queries
from services import metrics
from services.citations import aggregate_citations
from models.schemas import (
    AnalysisResponse, ModelResult, GeoVisibility, CompetitorShare, CitationSource,
)

REGION_META = {
    "global": ("Global", "🌐"), "us": ("United States", "🇺🇸"),
    "uk": ("United Kingdom", "🇬🇧"), "in": ("India", "🇮🇳"),
    "de": ("Germany", "🇩🇪"), "jp": ("Japan", "🇯🇵"),
    "br": ("Brazil", "🇧🇷"), "au": ("Australia", "🇦🇺"),
}
GEO_SWEEP = ["global", "us", "uk", "in", "de", "jp"]

STOPWORDS = set("""the a an and or of to in for on with is are be as it its that this these those
by from at into about over under more most some such can will may also their they you your our we
which who what when where how than then but not no yes if while because been being has have had do
does did one two best top leading major key other many several each both all any only very much""".split())


def brand_aliases(brand: str) -> list[str]:
    b = brand.strip()
    out = [b]
    first = b.split()[0] if b.split() else b
    if first.lower() != b.lower() and len(first) >= 4:
        out.append(first)
    return out


def _tokens(text: str) -> list[str]:
    return [w for w in re.findall(r"[A-Za-z][A-Za-z\-]{3,}", (text or "").lower()) if w not in STOPWORDS]


def _keywords(texts_with_brand: list[str], all_texts: list[str], brand: str, k_found=8, k_missing=6):
    brand_toks = set(_tokens(brand))
    found = Counter()
    for s in texts_with_brand:
        found.update(t for t in _tokens(s) if t not in brand_toks)
    vocab = Counter()
    for t in all_texts:
        vocab.update(x for x in _tokens(t) if x not in brand_toks)
    found_terms = [w for w, _ in found.most_common(k_found)]
    missing = [w for w, _ in vocab.most_common(25) if w not in set(found_terms)][:k_missing]
    return found_terms, missing


def _share_of_voice(responses, brand, competitors) -> list[CompetitorShare]:
    aliases = {brand: brand_aliases(brand)}
    for c in competitors:
        aliases[c] = [c]
    counts = {name: 0 for name in aliases}
    for r in responses:
        if not r["ok"]:
            continue
        for name, al in aliases.items():
            counts[name] += len(metrics.find_mentions(r["text"], al))
    total = sum(counts.values()) or 1
    out = [
        CompetitorShare(name=name, mentions=c, share=round(c / total * 100, 1), is_target=(name == brand))
        for name, c in sorted(counts.items(), key=lambda kv: kv[1], reverse=True)
    ]
    return out


def _build_model_result(meta, responses, brand, competitors, all_texts) -> ModelResult:
    aliases = brand_aliases(brand)
    comp_aliases = {c: [c] for c in competitors}
    ok_resp = [r for r in responses if r["ok"]]

    if not ok_resp:
        err = next((r["error"] for r in responses if r["error"]), "all queries failed")
        return ModelResult(
            id=meta["id"], name=meta["name"], provider=meta["provider"], model=meta["model"],
            visibility_score=0.0, mention_count=0, sentiment_score=50.0, sentiment_label="neutral",
            run_count=0, ok=False, error=err,
        )

    per_run = [metrics.response_metrics(r["text"], aliases) for r in ok_resp]
    ranks = [metrics.position_rank(r["text"], aliases, comp_aliases) for r in ok_resp]
    agg = metrics.aggregate_runs(per_run, ranks)

    brand_sentences = []
    for r in ok_resp:
        brand_sentences += metrics.sentences_with(r["text"], aliases)
    found, missing = _keywords(brand_sentences, all_texts, brand)

    return ModelResult(
        id=meta["id"], name=meta["name"], provider=meta["provider"], model=meta["model"],
        keywords_found=found, keywords_missing=missing, ok=True, **agg,
    )


async def run_real_analysis(brand, region, prompts, competitors=None) -> tuple[AnalysisResponse, list[dict]]:
    competitors = competitors or []
    models = active_models()
    if not models:
        raise RuntimeError("No model providers configured. Set GEMINI_API_KEY and/or GROQ_API_KEY.")

    responses = await run_queries(prompts, region, settings.RUNS_PER_PROMPT, models)
    all_texts = [r["text"] for r in responses if r["ok"]]

    by_model = defaultdict(list)
    for r in responses:
        by_model[r["model_id"]].append(r)

    model_results = [
        _build_model_result(m, by_model.get(m["id"], []), brand, competitors, all_texts)
        for m in models
    ]
    sov = _share_of_voice(responses, brand, competitors) if competitors else []
    citations = [CitationSource(**c) for c in aggregate_citations(responses)]
    geo = await _geo_sweep(brand, prompts, models)
    summary = _summary(brand, region, model_results, sov)

    resp = AnalysisResponse(
        brand=brand, region=region,
        timestamp=datetime.now(timezone.utc).isoformat(),
        models=model_results, geo_visibility=geo, share_of_voice=sov,
        citations=citations, summary=summary, run_count=settings.RUNS_PER_PROMPT,
    )
    return resp, responses


async def _geo_sweep(brand, prompts, models) -> list[GeoVisibility]:
    """Cheap cross-region visibility using one representative model to respect free tiers.
    Prefers a fast, reliable Groq model (Gemini's free tier is slow/503-prone and
    the sweep runs it across every region)."""
    rep = [next((m for m in models if m["provider"] == "groq"), models[0])]
    aliases = brand_aliases(brand)
    out = []
    for reg in GEO_SWEEP:
        resp = await run_queries(prompts, reg, settings.GEO_RUNS_PER_PROMPT, rep)
        ok = [r for r in resp if r["ok"]]
        scores = [metrics.response_metrics(r["text"], aliases)["visibility_score"] for r in ok]
        label, flag = REGION_META.get(reg, (reg, "🏳️"))
        out.append(GeoVisibility(region=label, flag=flag, score=round(statistics.mean(scores), 1) if scores else 0.0))
    return out


def _summary(brand, region, model_results, sov) -> str:
    ok = [m for m in model_results if m.ok]
    if not ok:
        return f"No model returned a usable response for {brand}. Check provider keys and quotas."
    top = max(ok, key=lambda m: m.visibility_score)
    avg = round(statistics.mean(m.visibility_score for m in ok), 1)
    rate = round(statistics.mean(m.appearance_rate for m in ok) * 100)
    parts = [
        f"Across {len(ok)} real models, {brand} scored an average visibility of {avg}/100 "
        f"and appeared in {rate}% of responses.",
        f"Strongest on {top.name} ({top.visibility_score}/100).",
    ]
    if sov:
        target = next((s for s in sov if s.is_target), None)
        leader = sov[0]
        if target:
            parts.append(f"Share of Voice: {target.share}% of category mentions"
                         + ("" if leader.is_target else f", behind {leader.name} at {leader.share}%") + ".")
    return " ".join(parts)
