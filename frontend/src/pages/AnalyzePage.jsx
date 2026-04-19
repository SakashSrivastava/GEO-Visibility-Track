import { useState } from 'react'
import QueryPanel from '../components/QueryPanel.jsx'
import MetricsRow from '../components/MetricsRow.jsx'
import ModelCard  from '../components/ModelCard.jsx'
import GeoChart   from '../components/GeoChart.jsx'
import RecommendationPanel from '../components/RecommendationPanel.jsx' // NEW: Import Panel
import { runAnalysis, fetchRecommendations } from '../services/api.js' // NEW: Import API
import styles from './AnalyzePage.module.css'

export default function AnalyzePage({ analysisData, setData, status, setStatus }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [tab,     setTab]     = useState('models')

  // --- NEW: Recommendation States ---
  const [recommendations, setRecommendations] = useState([])
  const [recsLoading, setRecsLoading] = useState(false)

  async function handleRun(payload) {
    setLoading(true)
    setError(null)
    setStatus('loading')
    setRecommendations([]) // Reset recommendations for new scan
    try {
      const result = await runAnalysis(payload)
      setData(result)
      setStatus('live')
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Unknown error'
      setError(msg)
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  // --- NEW: Handler for Recommendations ---
  async function handleGetRecommendations() {
    if (!analysisData) return
    setRecsLoading(true)
    try {
      const data = await fetchRecommendations(analysisData.brand, analysisData.models)
      setRecommendations(data)
    } catch (err) {
      console.error("Failed to generate tips:", err)
    } finally {
      setRecsLoading(false)
    }
  }

  return (
    <div>
      <QueryPanel
        onRun={handleRun}
        loading={loading}
        analysisData={analysisData}
      />

      {error && (
        <div className={styles.errorBox}>
          <strong>Analysis failed:</strong> {error}
        </div>
      )}

      {!analysisData && !error && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>◎</div>
          <div className={styles.emptyTitle}>NO DATA YET</div>
          <p className={styles.emptySub}>
            Enter a brand name or website URL, add your prompts,<br />
            and click Run Analysis.
          </p>
        </div>
      )}

      {analysisData && (
        <>
          <MetricsRow data={analysisData} />

          {/* Corrected Recommendation Trigger Section */}
          <div className={styles.actionContainer}>
            {!recommendations.length && !recsLoading ? (
              <button 
                className={styles.generateBtn}
                onClick={handleGetRecommendations}
              >
              ✨ GENERATE GEO STRATEGY FIXES
              </button>
              ) : (
              <RecommendationPanel items={recommendations} loading={recsLoading} />
              )}
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === 'models' ? styles.tabActive : ''}`}
              onClick={() => setTab('models')}
            >
              Model Breakdown
            </button>
            <button
              className={`${styles.tab} ${tab === 'geo' ? styles.tabActive : ''}`}
              onClick={() => setTab('geo')}
            >
              Geo Distribution
            </button>
          </div>

          {tab === 'models' && (
            <div className={styles.cardGrid}>
              {analysisData.models.map(m => (
                <ModelCard key={m.id} model={m} />
              ))}
            </div>
          )}

          {tab === 'geo' && (
            <GeoChart geoData={analysisData.geo_visibility} />
          )}
        </>
      )}
    </div>
  )
}