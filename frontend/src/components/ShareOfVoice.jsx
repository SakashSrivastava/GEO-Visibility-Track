import styles from './ShareOfVoice.module.css'

export default function ShareOfVoice({ data, brand }) {
  if (!data?.length) return null
  const max = Math.max(...data.map(d => d.share), 1)

  return (
    <div className={styles.wrap}>
      <p className={styles.title}>// Share of Voice — % of category mentions across all real model responses</p>
      <div className={styles.rows}>
        {data.map(d => (
          <div key={d.name} className={`${styles.row} ${d.is_target ? styles.target : ''}`}>
            <span className={styles.name}>
              {d.name}{d.is_target && <span className={styles.youBadge}>YOU</span>}
            </span>
            <div className={styles.barWrap}>
              <div
                className={styles.bar}
                style={{ width: (d.share / max * 100) + '%', background: d.is_target ? 'var(--accent)' : 'var(--purple)' }}
              />
            </div>
            <span className={styles.val}>{d.share}%</span>
            <span className={styles.mentions}>{d.mentions} mentions</span>
          </div>
        ))}
      </div>
      <p className={styles.note}>
        Mentions are counted from the verbatim text each model actually returned — not estimated.
      </p>
    </div>
  )
}
