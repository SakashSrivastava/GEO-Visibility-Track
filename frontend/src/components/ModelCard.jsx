import { useEffect, useRef } from 'react'
import { MODELS, SENTIMENT_COLOR } from '../utils/constants.js'
import styles from './ModelCard.module.css'

function ScoreBar({ label, value, color, displayValue }) {
  const barRef = useRef(null)

  useEffect(() => {
    if (!barRef.current) return
    // Animate bar width after mount
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (barRef.current) barRef.current.style.width = Math.min(100, value) + '%'
      })
    })
  }, [value])

  return (
    <div className={styles.scoreRow}>
      <span className={styles.scoreLabel}>{label}</span>
      <div className={styles.barWrap}>
        <div
          ref={barRef}
          className={styles.bar}
          style={{ background: color, width: '0%' }}
        />
      </div>
      <span className={styles.scoreVal} style={{ color }}>{displayValue}</span>
    </div>
  )
}

export default function ModelCard({ model }) {
  const meta         = MODELS.find(m => m.id === model.id) || { color: '#8b95b0', provider: model.provider }
  const sentColor    = SENTIMENT_COLOR[model.sentiment_label] || 'var(--amber)'
  const appearPct    = Math.round((model.appearance_rate ?? 0) * 100)

  if (model.ok === false) {
    return (
      <div className={`${styles.card} ${styles.unavailable}`}>
        <div className={styles.header}>
          <div className={styles.modelName}>
            <span className={styles.dot} style={{ background: 'var(--text3)' }} />
            {model.name}
            <span className={styles.provider}>{meta.provider}</span>
          </div>
          <span className={styles.rank}>—</span>
        </div>
        <div className={styles.body}>
          <div className={styles.errorMsg}>No usable response<br />{model.error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.modelName}>
          <span className={styles.dot} style={{ background: meta.color }} />
          {model.name}
          <span className={styles.provider}>{meta.provider}</span>
        </div>
        <span className={styles.rank}>{model.position_rank ? `#${model.position_rank}` : '—'}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.appearRow}>
          <span className={styles.appearPct} style={{ color: meta.color }}>{appearPct}%</span>
          <span className={styles.appearLbl}>
            appeared in {appearPct}% of {model.run_count || 0} real responses
          </span>
        </div>

        <ScoreBar
          label="Visibility"
          value={model.visibility_score}
          color={meta.color}
          displayValue={model.visibility_std ? `${model.visibility_score} ±${model.visibility_std}` : model.visibility_score}
        />
        <ScoreBar
          label="Sentiment"
          value={model.sentiment_score}
          color={sentColor}
          displayValue={model.sentiment_label}
        />
        <ScoreBar
          label="Mentions"
          value={model.mention_count * 10}
          color="var(--purple)"
          displayValue={`${model.mention_count}x`}
        />

        {/* Response preview */}
        <div className={styles.snippet}>
          {model.context_snippet || 'No response data.'}
        </div>

        {/* Keyword chips */}
        <div className={styles.chips}>
          {(model.keywords_found || []).map(k => (
            <span key={k} className={`${styles.chip} ${styles.found}`}>{k}</span>
          ))}
          {(model.keywords_missing || []).slice(0, 3).map(k => (
            <span key={k} className={`${styles.chip} ${styles.missing}`}>{k}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
