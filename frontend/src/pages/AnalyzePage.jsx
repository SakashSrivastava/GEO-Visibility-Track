import { useState } from 'react'
import QueryPanel from '../components/QueryPanel.jsx'
import MetricsRow from '../components/MetricsRow.jsx'
import ModelCard  from '../components/ModelCard.jsx'
import GeoChart   from '../components/GeoChart.jsx'
import ShareOfVoice from '../components/ShareOfVoice.jsx'
import Citations from '../components/Citations.jsx'
import { runAnalysis } from '../services/api.js'
import styles from './AnalyzePage.module.css'

export default function AnalyzePage({ analysisData, setData, status, setStatus }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [tab,     setTab]     = useState('models')

  async function handleRun(brand, region, prompts, competitors = []) {
    setLoading(true)
    setError(null)
    setStatus('loading')
    try {
      const result = await runAnalysis({ brand, region, prompts, competitors })
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
            Enter a brand name and run an analysis<br />
            to see how AI models represent your brand.
          </p>
        </div>
      )}

      {analysisData && (
        <>
          <MetricsRow data={analysisData} />

          {/* Tabs */}
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
            {analysisData.share_of_voice?.length > 0 && (
              <button
                className={`${styles.tab} ${tab === 'sov' ? styles.tabActive : ''}`}
                onClick={() => setTab('sov')}
              >
                Share of Voice
              </button>
            )}
            <button
              className={`${styles.tab} ${tab === 'sources' ? styles.tabActive : ''}`}
              onClick={() => setTab('sources')}
            >
              Sources
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

          {tab === 'sov' && (
            <ShareOfVoice data={analysisData.share_of_voice} brand={analysisData.brand} />
          )}

          {tab === 'sources' && (
            <Citations data={analysisData.citations} />
          )}
        </>
      )}
    </div>
  )
}
