"""
Fan-out engine. For every active model it sends each discovery query RUNS times
and collects the raw responses. The brand name is deliberately NOT included in
the query — we measure whether the model surfaces the brand on its own, which is
exactly what organic AI visibility means.
"""
import asyncio
import httpx

from config import settings
from providers import active_models, query_model, ProviderResponse

REGION_PHRASE = {
    "global": "",
    "us": " Answer for the United States market.",
    "uk": " Answer for the United Kingdom market.",
    "in": " Answer for the India market.",
    "de": " Answer for the Germany market.",
    "jp": " Answer for the Japan market.",
    "br": " Answer for the Brazil market.",
    "au": " Answer for the Australia market.",
}


def build_query(prompt: str, region: str) -> str:
    p = prompt.strip().rstrip("?.")
    q = f"{p}?" if len(p.split()) <= 6 else f"{p}."
    return q + REGION_PHRASE.get(region, "")


def _provider_sems():
    """Per-provider caps so Groq's shared account limit isn't blown by firing all
    its models at once, while a different provider (Gemini) can still run alongside."""
    from collections import defaultdict
    cap = getattr(settings, "MAX_CONCURRENCY_PER_PROVIDER", settings.MAX_CONCURRENCY)
    return defaultdict(lambda: asyncio.Semaphore(cap))


async def run_queries(prompts: list[str], region: str, runs: int, models: list[dict] | None = None):
    """
    Returns a flat list of dicts: one per (model, prompt, run) real API call.
      { model_id, prompt, query, run, text, ok, error, citations }
    """
    models = models if models is not None else active_models()
    sem = asyncio.Semaphore(settings.MAX_CONCURRENCY)
    psem = _provider_sems()

    async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT) as client:
        async def one(meta, prompt, run):
            query = build_query(prompt, region)
            async with sem, psem[meta["provider"]]:
                resp: ProviderResponse = await query_model(client, meta, query)
            return {
                "model_id": meta["id"], "prompt": prompt, "query": query, "run": run,
                "text": resp.text, "ok": resp.ok, "error": resp.error,
                "citations": resp.citations,
            }

        tasks = [
            one(meta, prompt, run)
            for meta in models
            for prompt in prompts
            for run in range(runs)
        ]
        return await asyncio.gather(*tasks)


async def run_regions(prompts: list[str], regions: list[str], runs: int, models: list[dict]):
    """
    Like run_queries but sweeps several regions in ONE pass under a single shared
    set of concurrency caps, so the whole geo sweep runs in parallel (and stays
    within Groq's shared limit) instead of one blocking round-trip per region.
    Returns { region: [ row dicts ] }.
    """
    from collections import defaultdict
    sem = asyncio.Semaphore(settings.MAX_CONCURRENCY)
    psem = _provider_sems()
    results: dict[str, list] = defaultdict(list)

    async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT) as client:
        async def one(meta, prompt, region, run):
            query = build_query(prompt, region)
            async with sem, psem[meta["provider"]]:
                resp: ProviderResponse = await query_model(client, meta, query)
            return region, {
                "model_id": meta["id"], "prompt": prompt, "query": query, "run": run,
                "text": resp.text, "ok": resp.ok, "error": resp.error,
                "citations": resp.citations,
            }

        tasks = [
            one(meta, prompt, region, run)
            for meta in models
            for region in regions
            for prompt in prompts
            for run in range(runs)
        ]
        for region, row in await asyncio.gather(*tasks):
            results[region].append(row)
    return results


async def run_custom(items: list[tuple[str, str]], runs: int, models: list[dict],
                     temperature: float | None = None, grounded: bool | None = None):
    """
    Send exact prompt strings (no query reformatting) — used by the impact
    experiment. `items` is [(label, full_prompt)]. Returns dicts:
      { model_id, label, run, text, ok }
    """
    sem = asyncio.Semaphore(settings.MAX_CONCURRENCY)
    psem = _provider_sems()
    async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT) as client:
        async def one(meta, label, text, run):
            async with sem, psem[meta["provider"]]:
                resp = await query_model(client, meta, text, temperature, grounded)
            return {"model_id": meta["id"], "label": label, "run": run,
                    "text": resp.text, "ok": resp.ok}

        tasks = [
            one(meta, label, prompt, run)
            for meta in models
            for (label, prompt) in items
            for run in range(runs)
        ]
        return await asyncio.gather(*tasks)
