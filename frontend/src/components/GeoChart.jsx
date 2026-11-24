import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import styles from './GeoChart.module.css'

const C = { high: '#1f8a5b', mid: '#bb7d17', low: '#cf4327', none: '#c9c2b0' }
function getBarColor(score) {
  if (score >= 70) return C.high
  if (score >= 45) return C.mid
  return C.low
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipVal}>
        {d.measured ? `${d.score} / 100` : 'No data this run (rate-limited)'}
      </p>
    </div>
  )
}

export default function GeoChart({ geoData }) {
  if (!geoData?.length) return null

  const chartData = geoData.map(g => {
    const measured = g.measured !== false
    const score = Math.round(g.score)
    return {
      region: `${g.flag} ${g.region}`,
      score,
      measured,
      // Height drawn: the real score when measured, a short grey stub when not,
      // so an unmeasured region is visibly different from a real zero.
      bar: measured ? score : 5,
    }
  })

  const unmeasured = geoData.filter(g => g.measured === false).map(g => g.region)

  return (
    <div className={styles.wrapper}>
      <p className={styles.title}>// Geographic Visibility Index</p>
      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(22,21,15,0.07)"
              vertical={false}
            />
            <XAxis
              dataKey="region"
              tick={{ fill: '#5c5648', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#948c79', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(22,21,15,0.04)' }} />
            <Bar dataKey="bar" radius={[4, 4, 0, 0]} maxBarSize={56}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.measured ? getBarColor(entry.score) : C.none}
                  fillOpacity={entry.measured ? 0.85 : 0.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span><span className={styles.dot} style={{ background: C.high }} /> High (70+)</span>
        <span><span className={styles.dot} style={{ background: C.mid }} /> Medium (45 to 69)</span>
        <span><span className={styles.dot} style={{ background: C.low }} /> Low (&lt;45)</span>
        <span><span className={styles.dot} style={{ background: C.none }} /> No data</span>
      </div>

      {unmeasured.length > 0 && (
        <p className={styles.note}>
          No data this run for {unmeasured.join(', ')}. The free-tier models were rate-limited
          for these regions (not a zero visibility). Re-run in a moment to fill them in.
        </p>
      )}
    </div>
  )
}
