"""
Metric formulas. Every value here is DERIVED from a model's real response text —
nothing is asked of an LLM and nothing is invented. Each function documents the
formula it implements so the numbers are reproducible and defensible.

Definitions (per single response text T, for a target brand B with aliases):
  mentioned         = B occurs in T (word-boundary, case-insensitive)
  mention_count     = number of such occurrences
  first_pos         = character index of first occurrence / len(T)   in [0,1]
  prominence        = 1 - first_pos                                   (earlier = higher)
  frequency         = min(mention_count / FREQ_SAT, 1)                FREQ_SAT = 3
  visibility_score  = 0 if not mentioned else
                      100 * (W_PRES + W_PROM*prominence + W_FREQ*frequency)
                      with W_PRES=0.40, W_PROM=0.30, W_FREQ=0.30  (sum = 1.0)
  position_rank     = rank of B's first mention among all tracked entities
                      (brand + competitors) ordered by first appearance; 1 = first.
                      If no competitors given, bucketed from first_pos.
  sentiment         = mean VADER compound over sentences that mention B,
                      mapped from [-1,1] to [0,100]; label by +/-0.05 band.

Across R stochastic runs we also report:
  appearance_rate   = (# runs where mentioned) / R        — the key stable signal
  visibility mean/std over runs.
"""
import re
import statistics
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

FREQ_SAT = 3
W_PRES, W_PROM, W_FREQ = 0.40, 0.30, 0.30

_analyzer = SentimentIntensityAnalyzer()
_SENT_SPLIT = re.compile(r"(?<=[.!?])\s+")


def _term_pattern(term: str) -> re.Pattern:
    return re.compile(r"\b" + re.escape(term.strip()) + r"\b", re.IGNORECASE)


def find_mentions(text: str, aliases: list[str]) -> list[int]:
    """Start indices of every alias occurrence, sorted."""
    idxs: list[int] = []
    for a in aliases:
        if not a.strip():
            continue
        idxs += [m.start() for m in _term_pattern(a).finditer(text)]
    return sorted(idxs)


def sentences_with(text: str, aliases: list[str]) -> list[str]:
    pats = [_term_pattern(a) for a in aliases if a.strip()]
    return [s for s in _SENT_SPLIT.split(text) if any(p.search(s) for p in pats)]


def _clean_snippet(sentences: list[str]) -> str:
    """Pick the first readable prose sentence; fall back to the first match."""
    def prose_score(s: str) -> int:
        markup = sum(s.count(c) for c in "|#*`_>")
        words = len(re.findall(r"[A-Za-z]{2,}", s))
        return words - 3 * markup
    cleaned = [re.sub(r"[|#*`_>]+", " ", s).strip() for s in sentences]
    cleaned = [re.sub(r"\s{2,}", " ", s) for s in cleaned if s]
    if not cleaned:
        return ""
    best = max(cleaned, key=prose_score)
    return best


def sentiment(text: str, aliases: list[str]) -> tuple[float, str]:
    """(score 0-100, label). Scored only over brand-mention sentences."""
    sents = sentences_with(text, aliases)
    if not sents:
        return 50.0, "neutral"
    comp = statistics.mean(_analyzer.polarity_scores(s)["compound"] for s in sents)
    score = round((comp + 1) / 2 * 100, 1)
    label = "positive" if comp > 0.05 else "negative" if comp < -0.05 else "neutral"
    return score, label


def response_metrics(text: str, brand_aliases: list[str]) -> dict:
    """All single-response metrics for the target brand. Documented formulas above."""
    text = text or ""
    n = len(text)
    mentions = find_mentions(text, brand_aliases)
    count = len(mentions)
    mentioned = count > 0

    if not mentioned or n == 0:
        vis = 0.0
        prominence = 0.0
        first_pos = None
        snippet = ""
    else:
        first_pos = mentions[0] / n
        prominence = 1 - first_pos
        frequency = min(count / FREQ_SAT, 1.0)
        vis = round(100 * (W_PRES + W_PROM * prominence + W_FREQ * frequency), 1)
        sents = sentences_with(text, brand_aliases)
        snippet = _clean_snippet(sents) or text[max(0, mentions[0] - 40): mentions[0] + 120].strip()

    s_score, s_label = sentiment(text, brand_aliases)
    return {
        "mentioned": mentioned,
        "mention_count": count,
        "visibility_score": vis,
        "prominence": round(prominence, 3),
        "first_pos": round(first_pos, 3) if first_pos is not None else None,
        "sentiment_score": s_score,
        "sentiment_label": s_label,
        "context_snippet": snippet[:300],
    }


def position_rank(text: str, brand_aliases: list[str], competitor_aliases: dict[str, list[str]]) -> int | None:
    """
    Rank of the brand's first mention among all tracked entities by order of
    first appearance (1 = appears first). Falls back to a position bucket from
    first_pos when no competitors are supplied. None if the brand is absent.
    """
    text = text or ""
    n = len(text)
    bm = find_mentions(text, brand_aliases)
    if not bm:
        return None
    brand_first = bm[0]

    firsts = {"__brand__": brand_first}
    for name, aliases in competitor_aliases.items():
        cm = find_mentions(text, aliases)
        if cm:
            firsts[name] = cm[0]

    if len(firsts) > 1:
        ordered = sorted(firsts.items(), key=lambda kv: kv[1])
        return [k for k, _ in ordered].index("__brand__") + 1

    # No competitors present → bucket the brand's absolute position into 1..5.
    frac = brand_first / n if n else 1.0
    return min(5, int(frac * 5) + 1)


def aggregate_runs(per_run: list[dict], position_ranks: list[int | None]) -> dict:
    """
    Combine R single-response metric dicts for ONE model into stable statistics.
      - visibility_score : mean over runs (+ std)
      - appearance_rate  : fraction of runs that mentioned the brand
      - mention_count    : mean over runs (rounded)
      - sentiment        : mean over runs that mentioned the brand
      - position_rank    : median of ranks where the brand appeared
    """
    r = len(per_run)
    vis = [p["visibility_score"] for p in per_run]
    appeared = [p for p in per_run if p["mentioned"]]
    ranks = [x for x in position_ranks if x is not None]

    if appeared:
        sent_scores = [p["sentiment_score"] for p in appeared]
        sent_mean = round(statistics.mean(sent_scores), 1)
        s_label = "positive" if sent_mean > 55 else "negative" if sent_mean < 45 else "neutral"
        snippet = next((p["context_snippet"] for p in appeared if p["context_snippet"]), "")
    else:
        sent_mean, s_label, snippet = 50.0, "neutral", ""

    return {
        "visibility_score": round(statistics.mean(vis), 1) if vis else 0.0,
        "visibility_std": round(statistics.pstdev(vis), 1) if len(vis) > 1 else 0.0,
        "appearance_rate": round(len(appeared) / r, 2) if r else 0.0,
        "mention_count": round(statistics.mean(p["mention_count"] for p in per_run)) if r else 0,
        "sentiment_score": sent_mean,
        "sentiment_label": s_label,
        "position_rank": round(statistics.median(ranks)) if ranks else None,
        "context_snippet": snippet,
        "run_count": r,
    }
