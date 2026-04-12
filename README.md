# GEO Visibility Tracker

Track how AI models (Claude, GPT-4, Gemini, Llama) mention your brand across different regions.

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
cp .env.example .env          # Add your API keys
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env          # Add VITE_API_URL
npm run dev
```

Open http://localhost:5173

## Environment Variables

### backend/.env
```
ANTHROPIC_API_KEY=your_key_here
SERPAPI_KEY=your_key_here        # optional, for real search rankings
```

### frontend/.env
```
VITE_API_URL=http://localhost:8000
```
