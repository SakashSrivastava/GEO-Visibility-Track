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
