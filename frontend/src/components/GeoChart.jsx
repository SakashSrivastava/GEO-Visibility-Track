import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import styles from './GeoChart.module.css'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipVal}>{payload[0].value} / 100</p>
    </div>
  )
}

const C = { high: '#3dd68c', mid: '#5b8def', low: '#f76868' }
function getBarColor(score) {
  if (score >= 70) return C.high
  if (score >= 45) return C.mid
  return C.low
}

export default function GeoChart({ geoData }) {
  if (!geoData?.length) return null

  const chartData = geoData.map(g => ({
    region: `${g.flag} ${g.region}`,
    score:  Math.round(g.score),
  }))

  return (
    <div className={styles.wrapper}>
      <p className={styles.title}>// Geographic Visibility Index</p>
      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="region"
              tick={{ fill: '#99a1b3', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#5b647a', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={56}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={getBarColor(entry.score)} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span><span className={styles.dot} style={{ background: C.high }} /> High (70+)</span>
        <span><span className={styles.dot} style={{ background: C.mid }} /> Medium (45–69)</span>
        <span><span className={styles.dot} style={{ background: C.low }} /> Low (&lt;45)</span>
      </div>
    </div>
  )
}
