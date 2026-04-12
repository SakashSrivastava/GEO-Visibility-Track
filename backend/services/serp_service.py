"""
Optional: Real search ranking data via SerpAPI.
Falls back to None gracefully if no API key is set.
"""
import httpx
from config import settings


REGION_CODE_MAP = {
    "us": "us", "uk": "gb", "in": "in",
    "de": "de", "jp": "jp", "br": "br",
    "au": "au", "global": "us",
}


async def get_search_rank(brand: str, query: str, region: str) -> dict | None:
    """
    Returns the position of brand in organic search results for a query.
    Returns None if SerpAPI key is not configured.
    """
    if not settings.SERPAPI_KEY:
        return None

    gl = REGION_CODE_MAP.get(region, "us")
    params = {
        "engine": "google",
        "q": query,
        "gl": gl,
        "hl": "en",
        "num": 10,
        "api_key": settings.SERPAPI_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get("https://serpapi.com/search", params=params)
            resp.raise_for_status()
            data = resp.json()

        results = data.get("organic_results", [])
        brand_lower = brand.lower()

        for idx, result in enumerate(results, start=1):
            title   = result.get("title", "").lower()
            snippet = result.get("snippet", "").lower()
            link    = result.get("link", "").lower()

            if brand_lower in title or brand_lower in snippet or brand_lower in link:
                return {
                    "position": idx,
                    "title": result.get("title"),
                    "link": result.get("link"),
                    "snippet": result.get("snippet"),
                }

        return {"position": None, "message": "Brand not found in top 10 results"}

    except Exception as e:
        return {"error": str(e)}


async def get_multi_region_ranks(brand: str, query: str) -> dict:
    """Fetch search rank for all major regions in parallel."""
    import asyncio

    regions = ["us", "uk", "in", "de", "jp"]
    tasks   = [get_search_rank(brand, query, r) for r in regions]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    return {
        region: (result if not isinstance(result, Exception) else {"error": str(result)})
        for region, result in zip(regions, results)
    }
