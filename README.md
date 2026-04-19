# GEO Visibility Tracker

Track how AI models (Claude, GPT-4, Gemini, Llama) mention your brand across different regions.

## Project Overview

GEO Visibility Tracker is a full-stack application designed to monitor and analyze how major AI language models mention your brand or products across different geographical regions. This tool provides valuable insights into your brand's visibility and presence in AI model responses, helping you understand global brand perception and reach.

## Key Features

- **Multi-Model Tracking**: Monitor mentions across Claude, GPT-4, Gemini, and Llama models
- **Geo-Regional Analysis**: Track brand visibility by geographic regions
- **Real-time Monitoring**: Get up-to-date insights on how AI models reference your brand
- **Interactive Dashboard**: Beautiful React-based UI to visualize tracking data
- **API Integration**: Seamless integration with Anthropic API and optional SerpAPI for search rankings
- **Database Persistence**: SQLite database to store historical tracking data
- **Competitive Benchmarking**: Description of competitive benchmarking features and benefits
- **GEO Recommendation Engine**: Description of the GEO recommendation engine features and how it can be leveraged for better visibility tracking

## Technology Stack

- **Frontend**: React with Vite for fast development and optimized builds
- **Backend**: Python FastAPI for high-performance async API server
- **Database**: SQLite with async support (aiosqlite)
- **AI Integration**: Anthropic Claude API for intelligent analysis
- **Search Integration**: SerpAPI for real search ranking data (optional)

## Use Cases

- Monitor brand reputation across AI platforms
- Understand how competitors are mentioned in AI responses
- Track marketing campaign effectiveness in AI-generated content
- Analyze regional differences in brand perception
- Identify emerging trends in AI-based brand mentions

## Project Structure

```
geo-visibility-tracker/
├── frontend/                  # React + Vite app
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page-level components
│   │   ├── services/          # API call functions
│   │   ├── hooks/             # Custom React hooks
│   │   └── utils/             # Helper functions
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/                   # Python FastAPI server
│   ├── routers/               # Route handlers
│   ├── services/              # Business logic
│   ├── models/                # Pydantic schemas
│   ├── main.py
│   └── requirements.txt
└── README.md
```

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Setup Instructions

Follow these steps to setup the project:

1. Clone the repository.
2. Install the required packages using `npm install`.
3. Run the application using `npm start`.

## Environment Variables

Create `.env` files as per the instructions below:

### backend/.env

```
ANTHROPIC_API_KEY=your_key_here
SERPAPI_KEY=your_key_here        # optional, for real search rankings
DATABASE_URL=sqlite+aiosqlite:///./geo_tracker.db
CORS_ORIGINS=["http://localhost:5173"]
```

### frontend/.env

```
VITE_API_URL=http://localhost:8000
```

## Contribution Guidelines

If you would like to contribute to this project, please fork the repository and submit a pull request.

---
