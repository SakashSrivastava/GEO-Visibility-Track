import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Analysis ──────────────────────────────────────────────────────────────

/**
 * Run a full GEO visibility analysis.
 * @param {{ brand: string, region: string, prompts: string[] }} payload
 * @returns {Promise<AnalysisResponse>}
 */
export async function runAnalysis(payload) {
  const { data } = await api.post('/api/analysis/run', payload)
  return data
}

/**
 * Run a competitor benchmarking analysis.
 * @param {{ brand: string, website: string, competitors: string[], region: string, prompts: string[] }} payload
 * @returns {Promise<ComparisonResponse>}
 */
export async function runComparison(payload) {
  const { data } = await api.post('/api/analysis/compare', payload)
  return data
}

export async function fetchModels() {
  const { data } = await api.get('/api/analysis/models')
  return data.models
}

export async function fetchRegions() {
  const { data } = await api.get('/api/analysis/regions')
  return data.regions
}

// ── History ───────────────────────────────────────────────────────────────

export async function fetchHistory(limit = 20) {
  const { data } = await api.get('/api/history/', { params: { limit } })
  return data
}

export async function fetchHistoryItem(id) {
  const { data } = await api.get(`/api/history/${id}`)
  return data
}

export async function deleteHistoryItem(id) {
  const { data } = await api.delete(`/api/history/${id}`)
  return data
}

export async function clearHistory() {
  const { data } = await api.delete('/api/history/')
  return data
}

/**
 * Fetch AI-generated recommendations based on visibility gaps.
 * @param {string} brand - The name of the brand.
 * @param {Array} analysisData - The model results from the main analysis.
 * @returns {Promise<Object[]>}
 */
export async function fetchRecommendations(brand, analysisData) {
  try {
    const { data } = await api.post('/api/analysis/recommendations', {
      brand,
      analysis_data: analysisData
    });
    
    // The backend returns { recommendations: [...] }
    return data.recommendations;
  } catch (error) {
    console.error("Failed to fetch recommendations:", error);
    return [
      {
        type: "error",
        title: "Connection Error",
        description: "Could not connect to the recommendation engine.",
        impact: "N/A"
      }
    ];
  }
}
