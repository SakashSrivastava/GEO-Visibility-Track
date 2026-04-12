import { average } from '../utils/helpers.js'
import styles from './MetricsRow.module.css'

export default function MetricsRow({ data }) {
  if (!data) return null

  const avgVisibility = average(data.models.map(m => m.visibility_score))
  const totalMentions = data.models.reduce((s, m) => s + m.mention_count, 0)
  const avgSentiment  = average(data.models.map(m => m.sentiment_score))
  const sentLabel     = avgSentiment > 60 ? 'Positive' : avgSentiment < 40 ? 'Negative' : 'Neutral'
  const sentColor     = avgSentiment > 60 ? 'var(--green)' : avgSentiment < 40 ? 'var(--red)' : 'var(--amber)'

  const cards = [
    { label: 'Avg Visibility Score', value: avgVisibility, color: 'var(--accent)' },
    { label: 'Total Mentions',        value: totalMentions, color: 'var(--green)' },
    { label: 'Avg Sentiment',         value: sentLabel,     color: sentColor },
    { label: 'Models Tracked',        value: data.models.length, color: 'var(--amber)',
      sub: data.models.map(m => m.name).join(' · ') },
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
