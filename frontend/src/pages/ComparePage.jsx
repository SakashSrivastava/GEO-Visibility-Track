import CompareTable from '../components/CompareTable.jsx'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip,
} from 'recharts'
import { MODELS } from '../utils/constants.js'
import styles from './ComparePage.module.css'

function RadarSection({ data }) {
  if (!data) return null

  // Build radar data: each entry is a metric, each model is a key
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
      <p className={styles.sectionTitle}>// Radar Comparison</p>
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
  return (
    <div>
      <RadarSection data={analysisData} />
      <CompareTable data={analysisData} />
    </div>
  )
}
