import { useState } from 'react'
import { 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip,
  PieChart, Pie, Cell 
} from 'recharts'
import CompareTable from '../components/CompareTable.jsx'
import { MODELS } from '../utils/constants.js'
import { runComparison } from '../services/api.js'
import styles from './ComparePage.module.css'

const COLORS = ['#4f8ef7', '#34d399', '#a78bfa', '#f59e0b', '#f43f5e']

function RadarSection({ data }) {
  if (!data || !data.models) return null

  const metrics = [
    { metric: 'Visibility',   key: 'visibility_score' },
    { metric: 'Sentiment',    key: 'sentiment_score' },
    { metric: 'Mentions×10', key: 'mention_count',   scale: 10 },
  ]

  const radarData = metrics.map(({ metric, key, scale = 1 }) => {
    const entry = { metric }
    data.models.forEach(m => {
      entry[m.name] = Math.min(100, Math.round(m[key] * scale))
    })
    return entry
  })

  return (
    <div className={styles.radarCard}>
      <p className={styles.sectionTitle}>// Model Intelligence Radar</p>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="rgba(255,255,255,0.06)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: '#8b95b0', fontSize: 11, fontFamily: 'Space Mono, monospace' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#4a5470', fontSize: 9 }}
            tickCount={4}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg3)',
              border: '1px solid var(--border2)',
              borderRadius: '8px',
              fontSize: '11px',
            }}
          />
          {data.models.map(m => {
            const meta = MODELS.find(x => x.id === m.id) || { color: '#8b95b0' }
            return (
              <Radar
                key={m.id}
                name={m.name}
                dataKey={m.name}
                stroke={meta.color}
                fill={meta.color}
                fillOpacity={0.12}
                strokeWidth={1.5}
              />
            )
          })}
          <Legend
            wrapperStyle={{ fontSize: '11px', fontFamily: 'Space Mono, monospace', paddingTop: '8px' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function ComparePage({ analysisData }) {
  const [competitors, setCompetitors] = useState('')
  const [loading, setLoading] = useState(false)
  const [compResults, setCompResults] = useState(null)

  async function handleRunBenchmarking() {
    if (!analysisData?.brand) return alert("Run a main analysis first.")
    const compList = competitors.split(',').map(c => c.trim()).filter(c => c)
    if (compList.length === 0) return alert("Enter at least one competitor.")

    setLoading(true)
    try {
      const result = await runComparison({
        brand: analysisData.brand,
        competitors: compList,
        region: analysisData.region || 'global',
        prompts: analysisData.prompts || []
      })
      setCompResults(result)
    } catch (err) {
      console.error(err)
      alert("Comparison failed. Check console for details.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.compareWrapper}>
      <div className={styles.topSection}>
        <RadarSection data={analysisData} />
        <CompareTable data={analysisData} />
      </div>

      <div className={styles.benchmarkingPanel}>
        <p className={styles.sectionTitle}>// Competitor Benchmarking</p>
        <div className={styles.compInputRow}>
          <input 
            className={styles.compInput}
            placeholder="Enter competitors (e.g. Nike, Adidas)"
            value={competitors}
            onChange={(e) => setCompetitors(e.target.value)}
          />
          <button className={styles.compBtn} onClick={handleRunBenchmarking} disabled={loading}>
            {loading ? 'Analyzing...' : 'Run SOV Audit'}
          </button>
        </div>

        {compResults && (
          <div className={styles.sovResults}>
            <div className={styles.chartBox}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={compResults.share_of_voice}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="sov_percentage"
                    nameKey="brand_name"
                  >
                    {compResults.share_of_voice.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.summaryBox}>
              <p className={styles.summaryLabel}>STRATEGIC SUMMARY:</p>
              <p className={styles.summaryText}>{compResults.summary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}