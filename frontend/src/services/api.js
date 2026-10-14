import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE,
  timeout: 240000,   // real multi-model, multi-run analysis can take a few minutes
  headers: { 'Content-Type': 'application/json' },
})

// Attach the auth token (if logged in) to every request.
api.interceptors.request.use(cfg => {
  try {
    const t = localStorage.getItem('geo_token')
    if (t) cfg.headers.Authorization = `Bearer ${t}`
  } catch { /* storage may be unavailable */ }
  return cfg
})

// ── Auth (Feature 5) ────────────────────────────────────────────────────────

export async function register(email, password) {
  const { data } = await api.post('/api/auth/register', { email, password })
  return data
}
export async function login(email, password) {
  const { data } = await api.post('/api/auth/login', { email, password })
  return data
}
export async function getMe() {
  const { data } = await api.get('/api/auth/me')
  return data
}
export async function downloadReport(id, brand) {
  const res = await api.get(`/api/history/${id}/report.pdf`, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = `geo-report-${brand || id}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

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

export async function runAudit(payload) {
  const { data } = await api.post('/api/audit/run', payload)
  return data
}

// ── Monitoring (Feature 4) ──────────────────────────────────────────────────

export async function createMonitor(payload) {
  const { data } = await api.post('/api/monitor/', payload)
  return data
}
export async function fetchMonitors() {
  const { data } = await api.get('/api/monitor/')
  return data
}
export async function updateMonitor(id, payload) {
  const { data } = await api.patch(`/api/monitor/${id}`, payload)
  return data
}
export async function runMonitorNow(id) {
  const { data } = await api.post(`/api/monitor/${id}/run`)
  return data
}
export async function deleteMonitor(id) {
  const { data } = await api.delete(`/api/monitor/${id}`)
  return data
}
export async function fetchTrend(id) {
  const { data } = await api.get(`/api/monitor/${id}/trend`)
  return data
}
export async function fetchAlerts(unacknowledged = false) {
  const { data } = await api.get('/api/monitor/alerts/all', { params: { unacknowledged } })
  return data
}
export async function ackAlert(id) {
  const { data } = await api.post(`/api/monitor/alerts/${id}/ack`)
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
