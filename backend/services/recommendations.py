"""
Recommendation engine (Feature 3b). Turns audit gaps + the keywords models
associate with the category but NOT the brand into prioritised, concrete fixes:
content to add, JSON-LD schema to embed, and meta hygiene. Deterministic and
rule-based, so each recommendation traces to a specific failed signal or gap.

Priority is derived from the signal's audit weight: >=15 high, >=10 medium, else low.
"""
import json
from services.auditor import SIGNALS

WEIGHT = {key: weight for (key, _label, weight) in SIGNALS}


def _priority(weight: float) -> str:
    return "high" if weight >= 15 else "medium" if weight >= 10 else "low"


def _org_jsonld(brand: str, url: str, desc: str) -> str:
    return json.dumps({
        "@context": "https://schema.org", "@type": "Organization",
        "name": brand, "url": url,
        "description": (desc or f"{brand} — add a one-line description of what you do.")[:200],
    }, indent=2)


def build_recommendations(brand: str, audit: dict, missing_keywords: list[str]) -> list[dict]:
    recs = []
    failed = {s["key"] for s in audit.get("signals", []) if not s["passed"]}
    url = audit.get("url", "")
    desc = (audit.get("text_excerpt", "")[:160]).strip()
    kw = ", ".join(missing_keywords[:6]) if missing_keywords else "your key differentiators"

    if "jsonld" in failed or "schema_entity" in failed:
        recs.append({
            "title": "Add Organization schema (JSON-LD)",
            "type": "schema", "priority": _priority(WEIGHT["jsonld"]),
            "rationale": "AI answer engines parse structured data to identify and describe entities. "
                         "No Organization/Product schema was found on the page.",
            "suggested": f'<script type="application/ld+json">\n{_org_jsonld(brand, url, desc)}\n</script>',
        })
    if "authoritative" in failed:
        recs.append({
            "title": "Lead with a clear, quotable definition",
            "type": "content", "priority": _priority(WEIGHT["authoritative"]),
            "rationale": "Models preferentially quote definitional, authoritative sentences. "
                         "Open the page with one.",
            "suggested": f"{brand} is a [category] that [core value proposition], "
                         f"specialising in {kw}.",
        })
    if "statistics" in failed:
        recs.append({
            "title": "Add quantified claims (statistics)",
            "type": "content", "priority": _priority(WEIGHT["statistics"]),
            "rationale": "The GEO literature finds statistics measurably raise citation likelihood. "
                         "The page has few or none.",
            "suggested": f"Add concrete numbers, e.g. “{brand} serves 10,000+ customers” or "
                         f"“{brand} improves X by 40%”. Use real figures you can back up.",
        })
    if "faq" in failed:
        recs.append({
            "title": "Add an FAQ section answering discovery questions",
            "type": "content", "priority": _priority(WEIGHT["faq"]),
            "rationale": "Question-answer content matches how users query AI assistants and is easy "
                         "for models to lift verbatim.",
            "suggested": f"Q: What is {brand}?  A: {brand} is a [category] that [value].  "
                         f"Q: Why choose {brand}?  A: Mention {kw}.",
        })
    if "citations" in failed:
        recs.append({
            "title": "Cite authoritative outbound sources",
            "type": "content", "priority": _priority(WEIGHT["citations"]),
            "rationale": "Linking to credible references signals trustworthiness that models weigh.",
            "suggested": "Reference industry reports, standards bodies, or research relevant to your claims.",
        })
    if "meta_desc" in failed:
        recs.append({
            "title": "Write a 50–160 char meta description",
            "type": "meta", "priority": _priority(WEIGHT["meta_desc"]),
            "rationale": "A concise, keyword-rich description helps models summarise the entity.",
            "suggested": f'<meta name="description" content="{brand} — [what you do] for [audience]. {kw}.">',
        })
    if missing_keywords:
        recs.append({
            "title": "Cover topics models link to competitors, not you",
            "type": "content", "priority": "high",
            "rationale": "Across the real model responses, these terms appeared in the category but "
                         "were not associated with your brand.",
            "suggested": f"Create or expand content covering: {kw}.",
        })

    order = {"high": 0, "medium": 1, "low": 2}
    recs.sort(key=lambda r: order[r["priority"]])
    return recs


def build_treatment_addendum(brand: str, recs: list[dict], missing_keywords: list[str]) -> str:
    """Synthesise an 'improved page' content block for the impact experiment:
    the kind of content the recommendations prescribe, so we can measure whether
    adding it raises the brand's visibility when a model is given the page."""
    kw = ", ".join(missing_keywords[:6]) if missing_keywords else "its core strengths"
    lines = [
        f"{brand} is a leading provider in its category, recognised for {kw}.",
        f"{brand} serves a large and growing customer base with proven, measurable results.",
        f"Frequently asked: What is {brand}? {brand} is a trusted choice for {kw}.",
    ]
    return " ".join(lines)
