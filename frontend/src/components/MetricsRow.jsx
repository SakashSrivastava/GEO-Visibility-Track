import { average } from '../utils/helpers.js'
import styles from './MetricsRow.module.css'

export default function MetricsRow({ data }) {
  if (!data) return null

  const ok = data.models.filter(m => m.ok !== false)
  const base = ok.length ? ok : data.models

  const avgVisibility = average(base.map(m => m.visibility_score))
  const avgAppearance = Math.round(average(base.map(m => (m.appearance_rate ?? 0) * 100)))
  const avgSentiment  = average(base.map(m => m.sentiment_score))
  const sentLabel     = avgSentiment > 55 ? 'Positive' : avgSentiment < 45 ? 'Negative' : 'Neutral'
  const sentColor     = avgSentiment > 55 ? 'var(--green)' : avgSentiment < 45 ? 'var(--red)' : 'var(--amber)'

  const cards = [
    { label: 'Avg Visibility Score', value: avgVisibility, color: 'var(--accent)' },
    { label: 'Avg Appearance Rate',  value: `${avgAppearance}%`, color: 'var(--green)',
      sub: `across ${data.run_count || '?'} runs/prompt` },
    { label: 'Avg Sentiment',         value: sentLabel,     color: sentColor },
    { label: 'Models Tracked',        value: `${ok.length}/${data.models.length}`, color: 'var(--amber)',
      sub: base.map(m => m.name).join(' · ') },
  ]

  return (
    <div className={styles.grid}>
      {cards.map(c => (
        <div key={c.label} className={styles.card}>
          <div className={styles.value} style={{ color: c.color }}>{c.value}</div>
          <div className={styles.label}>{c.label}</div>
          {c.sub && <div className={styles.sub}>{c.sub}</div>}
        </div>
      ))}
    </div>
  )
}
