"""
Citation / source tracking (Feature 2): which websites the models rely on.

Two honest sources, kept distinct:
  - grounding : real sources a model consulted, reported by its API
                (Gemini search grounding). This is the strong signal.
  - in_text   : URLs a model wrote into its own answer (any provider).
Each citation is {url, domain, title, source, model_id}. We aggregate by domain.
"""
import re
from urllib.parse import urlparse

_URL_RE = re.compile(r"https?://[^\s)>\]\"'}]+", re.IGNORECASE)


def domain_of(url: str) -> str:
    try:
        host = urlparse(url).netloc.lower()
    except Exception:
        return ""
    return host[4:] if host.startswith("www.") else host


def extract_text_urls(text: str, model_id: str) -> list[dict]:
    """URLs the model wrote into its answer."""
    out = []
    for raw in _URL_RE.findall(text or ""):
        url = raw.rstrip(".,);:'\"")
        dom = domain_of(url)
        if dom:
            out.append({"url": url, "domain": dom, "title": dom,
                        "source": "in_text", "model_id": model_id})
    return out


def aggregate_citations(responses: list[dict]) -> list[dict]:
    """
    Collapse per-response citations into ranked domains.
    Returns [{domain, count, models, grounded, sample_url, sample_title}].
    `count` = number of citations referencing that domain across all responses.
    """
    agg: dict[str, dict] = {}
    for r in responses:
        if not r["ok"]:
            continue
        cites = list(r.get("citations") or [])
        cites += extract_text_urls(r["text"], r["model_id"])
        for c in cites:
            dom = c.get("domain") or domain_of(c.get("url", ""))
            if not dom:
                continue
            slot = agg.setdefault(dom, {
                "domain": dom, "count": 0, "models": set(), "grounded": False,
                "sample_url": c.get("url", ""), "sample_title": c.get("title", dom),
            })
            slot["count"] += 1
            slot["models"].add(c.get("model_id", r["model_id"]))
            if c.get("source") == "grounding":
                slot["grounded"] = True
            if not slot["sample_url"] and c.get("url"):
                slot["sample_url"] = c["url"]

    out = [
        {**v, "models": sorted(v["models"])}
        for v in agg.values()
    ]
    out.sort(key=lambda d: (d["count"], d["grounded"]), reverse=True)
    return out
