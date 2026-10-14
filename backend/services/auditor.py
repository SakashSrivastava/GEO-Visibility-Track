"""
Website GEO auditor (Feature 3a). Fetches the brand's own page and scores how
"GEO-ready" it is, using signals the GEO literature (Aggarwal et al., 2024) found
to raise the odds of being cited in AI answers: structured data, quantified
claims (statistics), authoritative/definitional phrasing, outbound citations,
FAQ-style content, and basic content depth / meta hygiene.

Rubric (weights sum to 100); geo_score = sum of weights of passed signals.
"""
import re
import json
import httpx
from bs4 import BeautifulSoup

from config import settings

SIGNALS = [
    ("jsonld",        "Structured data (JSON-LD)",        20),
    ("schema_entity", "Organization/Product schema type", 10),
    ("statistics",    "Quantified claims / statistics",   15),
    ("citations",     "Outbound authoritative links",     10),
    ("authoritative", "Definitional, quotable phrasing",  10),
    ("faq",           "FAQ / question-style content",     10),
    ("depth",         "Content depth (300+ words)",       10),
    ("meta_desc",     "Meta description (50-160 chars)",  10),
    ("title",         "Page title present",                5),
]
_STAT_RE = re.compile(r"\b\d+(\.\d+)?\s?(%|percent|million|billion|users|customers|years|x)\b", re.I)
_DEF_RE = re.compile(r"\b(is|are|provides|offers|enables|is a|is the|helps)\b", re.I)


async def fetch_site(url: str) -> dict:
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True,
                                     headers={"User-Agent": "GEO-Visibility-Tracker/1.0"}) as c:
            r = await c.get(url)
            return {"ok": True, "status": r.status_code, "html": r.text, "url": str(r.url)}
    except Exception as e:
        return {"ok": False, "status": None, "html": "", "url": url, "error": str(e)}


def audit_html(url: str, html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        if not (tag.name == "script" and tag.get("type") == "application/ld+json"):
            tag.extract()
    text = re.sub(r"\s+", " ", soup.get_text(" ")).strip()
    words = len(text.split())

    # Structured data
    jsonld_types = []
    for s in BeautifulSoup(html, "html.parser").find_all("script", type="application/ld+json"):
        try:
            blob = json.loads(s.string or "{}")
            for obj in (blob if isinstance(blob, list) else [blob]):
                t = obj.get("@type")
                if isinstance(t, list):
                    jsonld_types += t
                elif t:
                    jsonld_types.append(t)
        except Exception:
            continue
    jsonld_types = sorted(set(jsonld_types))

    full = BeautifulSoup(html, "html.parser")
    title = (full.title.string.strip() if full.title and full.title.string else "")
    meta = full.find("meta", attrs={"name": "description"})
    meta_desc = (meta.get("content", "").strip() if meta else "")
    ext_links = [a for a in full.find_all("a", href=True) if a["href"].startswith("http")]
    headings = [h.get_text(" ", strip=True) for h in full.find_all(["h1", "h2", "h3"])]
    stat_hits = len(_STAT_RE.findall(text))

    checks = {
        "jsonld":        bool(jsonld_types),
        "schema_entity": any(t in jsonld_types for t in ("Organization", "Product", "LocalBusiness", "Corporation")),
        "statistics":    stat_hits >= 3,
        "citations":     len(ext_links) >= 3,
        "authoritative": len(_DEF_RE.findall(text)) >= 3,
        "faq":           any("?" in h for h in headings) or "faq" in text.lower(),
        "depth":         words >= 300,
        "meta_desc":     50 <= len(meta_desc) <= 160,
        "title":         bool(title),
    }
    details = {
        "jsonld":        f"{len(jsonld_types)} schema block(s): {', '.join(jsonld_types) or 'none'}",
        "schema_entity": "Organization/Product schema present" if checks["schema_entity"] else "no entity schema",
        "statistics":    f"{stat_hits} quantified claim(s) found",
        "citations":     f"{len(ext_links)} outbound link(s)",
        "authoritative": "definitional phrasing present" if checks["authoritative"] else "few definitional sentences",
        "faq":           "question-style content present" if checks["faq"] else "no FAQ-style content",
        "depth":         f"{words} words",
        "meta_desc":     f"{len(meta_desc)} chars" if meta_desc else "missing",
        "title":         title[:80] or "missing",
    }

    signals = [{"key": k, "label": lbl, "weight": w, "passed": checks[k], "detail": details[k]}
               for (k, lbl, w) in SIGNALS]
    score = sum(w for (k, _, w) in SIGNALS if checks[k])

    return {
        "url": url, "fetched": True, "status": None, "geo_score": float(score),
        "signals": signals, "schema_types": jsonld_types, "word_count": words,
        "text_excerpt": text[:2000], "title": title, "error": None,
    }


async def run_audit(url: str) -> dict:
    site = await fetch_site(url)
    if not site["ok"] or (site["status"] and site["status"] >= 400):
        return {"url": url, "fetched": False, "status": site["status"], "geo_score": 0.0,
                "signals": [], "schema_types": [], "word_count": 0, "text_excerpt": "",
                "title": "", "error": site.get("error") or f"HTTP {site['status']}"}
    out = audit_html(site["url"], site["html"])
    out["status"] = site["status"]
    return out
