import json
from groq import Groq
from config import settings

# Initialize the Groq client
client = Groq(api_key=settings.GROQ_API_KEY)

async def generate_geo_recommendations(brand: str, analysis_data: list):
    """
    Analyzes visibility data and generates a structured JSON list of 
    actionable SEO/GEO recommendations.
    """
    
    # We create a specific prompt that forces the AI to be a strategist
    prompt = f"""
    Identify the visibility gaps for the brand '{brand}' based on this data:
    {json.dumps(analysis_data, indent=2)}

    Based on these scores, provide 4 highly specific 'Action Items'.
    Rules:
    1. Focus on improving 'Visibility' and 'Sentiment' scores in AI models.
    2. Suggest 2 'Content' fixes (e.g., specific sentences for the site).
    3. Suggest 2 'Technical' fixes (e.g., Schema markup or citation strategies).
    
    Format your response as a PURE JSON list:
    [
      {{
        "type": "content", 
        "title": "Fix name", 
        "description": "Exactly what to do...",
        "impact": "High/Medium/Low"
      }}
    ]
    Return ONLY the JSON list. Do not include any other text.
    """

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a GEO Optimization expert."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3, # We keep temperature low for consistent JSON output
        )
        
        # Extract the content
        raw_content = completion.choices[0].message.content
        return raw_content
    
    except Exception as e:
        print(f"AI Recommendation Error: {e}")
        return json.dumps([{"type": "error", "title": "Error", "description": "Failed to generate tips.", "impact": "N/A"}])