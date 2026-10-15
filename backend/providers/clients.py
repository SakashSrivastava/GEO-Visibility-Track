"""
Real provider clients. Every model is reached through its provider's live API
over async HTTP — no model is simulated by another. Each call returns the raw,
verbatim response text so metrics can be computed from what the model actually
said, and so the raw text can be stored and audited.
"""
from dataclasses import dataclass, field
from typing import Optional
import asyncio
import httpx

from config import settings

RETRY_STATUS = {429, 500, 502, 503, 529}
MAX_RETRIES = 3

# Concise, human-readable reasons for common HTTP errors (instead of raw JSON).
_REASON = {
    400: "bad request", 401: "invalid API key", 403: "access denied",
    404: "model unavailable", 429: "rate limit / quota exceeded",
    500: "provider error", 502: "provider error", 503: "provider overloaded",
    529: "provider overloaded",
}


def _friendly(status: int) -> str:
    return f"HTTP {status} — {_REASON.get(status, 'request failed')}"

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


@dataclass
class ProviderResponse:
    model_id: str          # registry id, e.g. "gemini"
    provider: str          # "groq" | "google"
    model: str             # concrete API model name
    text: str              # verbatim response, "" on failure
    ok: bool
    error: Optional[str] = None
    citations: list = field(default_factory=list)   # populated in Feature 2


async def _query_groq(client, model, prompt, temperature, grounded) -> tuple[str, list]:
    resp = await client.post(
        GROQ_URL,
        headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
        json={
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": 2048,
        },
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"] or "", []


def _parse_grounding(cand: dict) -> list:
    """Extract the real sources Gemini consulted from groundingMetadata."""
    meta = cand.get("groundingMetadata") or {}
    out = []
    for chunk in meta.get("groundingChunks") or []:
        web = chunk.get("web") or {}
        uri, title = web.get("uri", ""), web.get("title", "")
        if uri or title:
            out.append({"url": uri, "title": title or uri,
                        "domain": title if "." in title else "", "source": "grounding"})
    return out


async def _gemini_call(client, model, prompt, temperature, grounded):
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": temperature, "maxOutputTokens": 1024},
    }
    if grounded:
        body["tools"] = [{"google_search": {}}]
    resp = await client.post(
        GEMINI_URL.format(model=model), params={"key": settings.GEMINI_API_KEY}, json=body,
    )
    resp.raise_for_status()
    return resp.json()


# Once grounding is rejected (free tiers have little/no google_search quota), we
# stop attempting it for the rest of the session to avoid wasting a call each time.
_grounding_disabled = False
_GROUNDING_REJECT = {400, 403, 429}


async def _query_gemini(client, model, prompt, temperature, grounded) -> tuple[str, list]:
    global _grounding_disabled
    use_grounding = grounded and not _grounding_disabled
    try:
        data = await _gemini_call(client, model, prompt, temperature, use_grounding)
    except httpx.HTTPStatusError as e:
        status = e.response.status_code if e.response is not None else 0
        if use_grounding and status in _GROUNDING_REJECT:
            _grounding_disabled = True            # circuit-breaker for the session
            data = await _gemini_call(client, model, prompt, temperature, False)
        else:
            raise
    cand = (data.get("candidates") or [{}])[0]
    parts = (cand.get("content") or {}).get("parts") or []
    text = "".join(p.get("text", "") for p in parts)
    return text, _parse_grounding(cand)


_DISPATCH = {"groq": _query_groq, "google": _query_gemini}


async def query_model(
    client: httpx.AsyncClient, meta: dict, prompt: str,
    temperature: float | None = None, grounded: bool | None = None,
) -> ProviderResponse:
    """Query one real model once. Never raises — failures come back as ok=False.
    `temperature`/`grounded` override the defaults (the experiment uses low temp,
    no grounding, to isolate the content effect)."""
    fn = _DISPATCH.get(meta["provider"])
    base = dict(model_id=meta["id"], provider=meta["provider"], model=meta["model"])
    if fn is None:
        return ProviderResponse(**base, text="", ok=False, error="no client for provider")

    temp = settings.QUERY_TEMPERATURE if temperature is None else temperature
    grd = settings.GROUNDING_ENABLED if grounded is None else grounded

    last_err = "unknown error"
    for attempt in range(MAX_RETRIES):
        try:
            text, citations = await fn(client, meta["model"], prompt, temp, grd)
            if not text.strip():
                last_err = "empty response"
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(1)
                    continue
                break
            return ProviderResponse(**base, text=text, ok=True, citations=citations)
        except httpx.HTTPStatusError as e:
            status = e.response.status_code if e.response is not None else 0
            last_err = _friendly(status)
            if status not in RETRY_STATUS:
                break
        except (httpx.TransportError, httpx.TimeoutException):
            last_err = "network error"
        except Exception as e:
            last_err = str(e)
            break
        if attempt < MAX_RETRIES - 1:
            await asyncio.sleep(2 * (attempt + 1))

    return ProviderResponse(**base, text="", ok=False, error=last_err)
