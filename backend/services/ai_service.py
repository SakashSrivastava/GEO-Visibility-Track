import json
from groq import Groq

from config import settings
from models.schemas import AnalysisResponse

SYSTEM_PROMPT = """You are a GEO (Generative Engine Optimization) visibility analysis engine.
Analyze brand/keyword visibility in AI-generated search responses.
Return ONLY valid JSON — no markdown fences, no explanation, no extra text.

For the given brand and region, simulate how different AI models (Claude, GPT-4, Gemini, Llama)
would represent the brand in their responses to discovery queries.

Return this exact JSON structure:
{
  "brand": string,
  "region": string,
  "timestamp": string (ISO 8601),
  "models": [
    {
      "id": string,
      "name": string,
      "visibility_score": number,
      "mention_count": number,
      "sentiment_score": number,
      "sentiment_label": string,
      "position_rank": number,
      "context_snippet": string,
      "keywords_found": string[],
      "keywords_missing": string[]
    }
  ],
  "geo_visibility": [
    { "region": string, "flag": string, "score": number }
  ],
  "summary": string
}

Rules:
- id must be one of: claude | gpt | gemini | llama
- sentiment_label must be: positive | neutral | negative
- visibility_score and sentiment_score are 0-100
- mention_count is 0-10
- position_rank is 1-5 (1 = mentioned first)
- Include all 4 models
- For geo_visibility include: Global 🌐, US 🇺🇸, UK 🇬🇧, India 🇮🇳, Germany 🇩🇪, Japan 🇯🇵
- Base scores on the brand's actual known presence and reputation — be realistic.
- If a website URL is provided, use it to infer additional context about the brand's domain, industry, and online presence.
- The prompts provided by the user define what queries to simulate — analyze visibility specifically for those queries, not just generic AI industry queries.
- Return ONLY the raw JSON object. No markdown, no backticks, no explanation."""


async def run_ai_analysis(
    brand: str,
    region: str,
    prompts: list[str],
    website: str = "",
) -> AnalysisResponse:

    client = Groq(api_key=settings.GROQ_API_KEY)

    # Build context string based on what was provided
    brand_context = f'Brand / Company name: "{brand}"'
    if website:
        brand_context += f'\nWebsite URL: {website}'
        brand_context += f'\n(Use the website domain and URL to infer the brand\'s industry, products, and market positioning)'

    user_message = f"""{brand_context}
Region context: {region}
Query prompts to simulate: {'; '.join(prompts)}

Instructions:
- Analyze how Claude, GPT-4, Gemini, and Llama would mention this brand when responding to the above prompts.
- Score variation by region should reflect real-world brand recognition differences.
- The prompts above are user-defined — base the analysis specifically on those queries.
- Return ONLY the raw JSON object, no markdown fences, no extra text."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_message},
        ],
        temperature=0.3,
        max_tokens=2000,
    )

    raw = response.choices[0].message.content.strip()

    # Strip accidental markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    data = json.loads(raw)
    return AnalysisResponse(**data)