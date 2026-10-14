"""
Resolves which models are actually callable right now, based on which provider
keys are configured. The rest of the system asks for `active_models()` and never
hard-codes a model list, so adding a key is the only step needed to enable a model.
"""
from config import settings, MODEL_REGISTRY


def active_models() -> list[dict]:
    out = []
    for m in MODEL_REGISTRY:
        key = getattr(settings, m["requires"], "")
        if key:
            out.append(m)
    return out


def model_meta(model_id: str) -> dict | None:
    for m in MODEL_REGISTRY:
        if m["id"] == model_id:
            return m
    return None
