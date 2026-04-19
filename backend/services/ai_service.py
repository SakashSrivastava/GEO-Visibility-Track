import json
from groq import Groq
from config import settings
from models.schemas import AnalysisResponse, ComparisonResponse

# --- PROMPT FOR SINGLE BRAND ANALYSIS ---
SYSTEM_PROMPT = """You are a GEO (Generative Engine Optimization) visibility analysis engine.
Analyze brand/keyword visibility in AI-generated search responses.
Return ONLY valid JSON — no markdown fences, no explanation, no extra text.

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
- Return ONLY the raw JSON object."""

# --- PROMPT FOR COMPETITOR COMPARISON ---
COMPARISON_SYSTEM_PROMPT = """You are a Competitive GEO Analysis Engine.
Analyze brand visibility against competitors in AI search results.
Return ONLY valid JSON — no markdown, no explanation.

Return this exact JSON structure:
{
  "brand": string,
  "timestamp": string,
  "share_of_voice": [
    { "brand_name": string, "sov_percentage": number, "mentions": number }
  ],
  "summary": string
}"""

async def run_ai_analysis(
    brand: str,
    region: str,
    prompts: list[str],
    website: str = "",
) -> AnalysisResponse:
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    brand_context = f'Brand / Company name: "{brand}"'
    if website:
        brand_context += f'\nWebsite URL: {website}'

    user_message = f"""{brand_context}
Region context: {region}
Query prompts to simulate: {'; '.join(prompts)}"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_message},
        ],
        temperature=0.3,
    )

    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1].replace("json", "").strip()
    
    return AnalysisResponse(**json.loads(raw))

async def run_comparison_analysis(
    brand: str,
    competitors: list[str],
    region: str,
    prompts: list[str],
    website: str = "",
) -> ComparisonResponse:
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    brand_context = f'Primary Brand: "{brand}"'
    if website:
        brand_context += f'\nWebsite URL: {website}'
    
    user_message = f"""{brand_context}
Competitors: {', '.join(competitors)}
Region context: {region}
Query prompts to simulate: {'; '.join(prompts)}"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": COMPARISON_SYSTEM_PROMPT},
            {"role": "user",   "content": user_message},
        ],
        temperature=0.3,
    )

    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1].replace("json", "").strip()

    return ComparisonResponse(**json.loads(raw))