import { MODELS, SENTIMENT_COLOR } from '../utils/constants.js'
import styles from './CompareTable.module.css'

const RANK_CLASS = ['', styles.rank1, styles.rank2, styles.rank3, styles.rank4]

export default function CompareTable({ data }) {
  if (!data) {
    return (
      <div className={styles.empty}>
        Run an analysis first to populate the comparison table.
      </div>
    )
  }

  const sorted = [...data.models].sort((a, b) => b.visibility_score - a.visibility_score)

  return (
    <div className={styles.wrapper}>
      <p className={styles.title}>// Model Comparison Matrix — {data.brand} · {data.region.toUpperCase()}</p>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Model</th>
            <th>Visibility</th>
            <th>Mentions</th>
            <th>Sentiment</th>
            <th>First Position</th>
            <th>Keywords Found</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m, i) => {
            const meta  = MODELS.find(x => x.id === m.id) || { color: '#8b95b0' }
            const sColor = SENTIMENT_COLOR[m.sentiment_label] || 'var(--amber)'
            const rank  = i + 1

            return (
              <tr key={m.id}>
                <td>
                  <span className={`${styles.rankBadge} ${RANK_CLASS[rank] || styles.rank4}`}>
                    {rank}
                  </span>
                </td>
                <td>
                  <span className={styles.modelCell}>
                    <span className={styles.modelDot} style={{ background: meta.color }} />
                    <span className={styles.modelName}>{m.name}</span>
                  </span>
                </td>
                <td>
                  <span className={styles.mono} style={{ color: meta.color }}>
                    {m.visibility_score}/100
                  </span>
                </td>
                <td>
                  <span className={styles.mono} style={{ color: 'var(--purple)' }}>
                    {m.mention_count}x
                  </span>
                </td>
                <td>
                  <span style={{ color: sColor, fontSize: '11px' }}>
                    {m.sentiment_label}
                  </span>
                </td>
                <td>
                  <span className={styles.mono} style={{ color: 'var(--text2)' }}>
                    #{m.position_rank}
                  </span>
                </td>
                <td>
                  <div className={styles.kwList}>
                    {(m.keywords_found || []).slice(0, 4).map(k => (
                      <span key={k} className={styles.kwChip}>{k}</span>
                    ))}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {data.summary && (
        <p className={styles.summary}>{data.summary}</p>
      )}
    </div>
  )
}
