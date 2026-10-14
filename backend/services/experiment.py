"""
Measurable-impact experiment (Feature 3c) — paired, variance-reduced, and
significance-tested so the result is trustworthy WITHOUT burning many API calls.

AI answer/search engines condition their answer on retrieved page content, so we
run a controlled A/B against the real models:
  control   = discovery query + the brand's CURRENT page content
  treatment = control + the recommended additions

Design choices that make the lift reliable AND leave headroom on free quotas:
  1. COMPETITIVE POOL: the brand is placed in a field of competitors that all
     start from an EQUAL one-line baseline. Handing a model only the brand's own
     page saturates visibility (~90+, nothing to lift); competing against equal
     options restores headroom, and isolates the recommended content as the only
     thing that differs. This mirrors the GEO paper's content-variation method.
  2. PAIRED: control and treatment are compared for the *same* model+prompt+run,
     so each pair cancels that model's baseline — the dominant noise source.
  3. LOW TEMPERATURE: the experiment isolates the content effect, so near-greedy
     decoding (EXPERIMENT_TEMPERATURE) removes most per-call randomness.
  4. SIGNIFICANCE: we report a 95% CI on the mean paired lift and only claim an
     improvement when the interval excludes zero. A noisy run honestly reports
     "no significant change" instead of a lucky number.
"""
import math
import statistics

from config import settings
from services.query_engine import build_query, run_custom
from services import metrics

# two-tailed t critical values (alpha = 0.05) by degrees of freedom
_T95 = {1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365,
        8: 2.306, 9: 2.262, 10: 2.228, 11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145,
        15: 2.131, 16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086}


def _t_crit(df: int) -> float:
    if df <= 0:
        return 0.0
    if df in _T95:
        return _T95[df]
    return 2.042 if df <= 30 else 1.96


def _baseline_snippet(name: str) -> str:
    return f"{name} is a provider in this category."


def _sources(brand: str, brand_content: str, competitors: list[str]) -> str:
    """Equal-baseline competitive pool. Competitors get a neutral one-liner;
    only the brand's entry differs between control and treatment. Entries are
    alphabetised so position in the list never advantages the brand."""
    comps = competitors or ["Alpha Labs", "Beta Systems", "Gamma Works"]
    entries = [(brand, brand_content)] + [(c, _baseline_snippet(c)) for c in comps]
    entries.sort(key=lambda e: e[0].lower())
    return "\n\n".join(f"Source — {n}:\n{txt}" for n, txt in entries)


def _prompt(query_text: str, sources: str) -> str:
    return (f"{query_text}\n\nBase your answer only on the sources below. "
            f"Recommend and rank the most suitable options.\n\n{sources}")


def _empty(detail):
    return {"ran": False, "detail": detail, "runs": 0,
            "baseline_visibility": 0.0, "treatment_visibility": 0.0,
            "baseline_appearance": 0.0, "treatment_appearance": 0.0,
            "lift": 0.0, "lift_ci_low": 0.0, "lift_ci_high": 0.0,
            "significant": False, "n_pairs": 0, "improved": False, "note": ""}


async def run_experiment(brand, prompts, region, current_excerpt, addendum, brand_aliases,
                         models, competitors=None) -> dict:
    if not models:
        return _empty("Experiment needs at least one model.")
    if not addendum.strip():
        return _empty("No recommended content to test.")

    control_brand = _baseline_snippet(brand)
    treatment_brand = (control_brand + " " + addendum).strip()
    control_src = _sources(brand, control_brand, competitors)
    treatment_src = _sources(brand, treatment_brand, competitors)

    items = []
    for i, p in enumerate(prompts):
        q = build_query(p, region)
        items.append((f"ctrl::{i}", _prompt(q, control_src)))
        items.append((f"treat::{i}", _prompt(q, treatment_src)))

    results = await run_custom(items, settings.EXPERIMENT_RUNS, models,
                               temperature=settings.EXPERIMENT_TEMPERATURE, grounded=False)

    # index visibility by (model, condition, prompt_idx, run)
    vis = {}
    for r in results:
        if not r["ok"] or not r["text"].strip():
            continue
        cond, idx = r["label"].split("::")
        m = metrics.response_metrics(r["text"], brand_aliases)
        vis[(r["model_id"], cond, idx, r["run"])] = m

    # build paired differences on matching control/treatment
    diffs, ctrl_vis, treat_vis, ctrl_app, treat_app = [], [], [], [], []
    for (model_id, cond, idx, run), m in vis.items():
        if cond != "ctrl":
            continue
        t = vis.get((model_id, "treat", idx, run))
        if t is None:
            continue
        diffs.append(t["visibility_score"] - m["visibility_score"])
        ctrl_vis.append(m["visibility_score"]); treat_vis.append(t["visibility_score"])
        ctrl_app.append(1 if m["mentioned"] else 0); treat_app.append(1 if t["mentioned"] else 0)

    n = len(diffs)
    if n == 0:
        return _empty("No usable paired responses (models returned empty text).")

    lift = round(statistics.mean(diffs), 1)
    base_vis = round(statistics.mean(ctrl_vis), 1)
    treat_v = round(statistics.mean(treat_vis), 1)
    base_app = round(statistics.mean(ctrl_app), 2)
    treat_a = round(statistics.mean(treat_app), 2)

    if n >= 2:
        sd = statistics.stdev(diffs)
        se = sd / math.sqrt(n)
        margin = _t_crit(n - 1) * se
        ci_low, ci_high = round(lift - margin, 1), round(lift + margin, 1)
        significant = ci_low > 0 or ci_high < 0
    else:
        ci_low = ci_high = lift
        significant = False

    improved = significant and lift > 0

    note = ""
    if base_vis >= 90:
        note = ("Even against equal competitors the brand already saturates — add more / "
                "stronger competitors so there is room to measure improvement.")
    elif not significant and n >= 2:
        note = ("Lift is not statistically distinguishable from zero at 95% confidence; "
                "increase EXPERIMENT_RUNS or add prompts for a sharper estimate.")

    if n < 2:
        detail = (f"Only {n} paired sample — need at least 2 for a confidence interval. "
                  f"Add prompts or raise EXPERIMENT_RUNS.")
    else:
        verdict = ("a statistically significant" if significant else "no significant")
        detail = (f"In a competitive pool, across {n} paired samples ({settings.EXPERIMENT_RUNS} runs x "
                  f"{len(prompts)} prompt(s) x {len(models)} model(s)), adding the recommended "
                  f"content produced {verdict} change: brand visibility {base_vis} to {treat_v}, "
                  f"mean lift {lift:+} (95% CI {ci_low:+} to {ci_high:+}).")

    return {"ran": True, "runs": settings.EXPERIMENT_RUNS,
            "baseline_visibility": base_vis, "treatment_visibility": treat_v,
            "baseline_appearance": base_app, "treatment_appearance": treat_a,
            "lift": lift, "lift_ci_low": ci_low, "lift_ci_high": ci_high,
            "significant": significant, "n_pairs": n, "improved": improved,
            "note": note, "detail": detail}
