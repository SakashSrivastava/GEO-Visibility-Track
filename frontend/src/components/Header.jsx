import styles from './Header.module.css'

const STATUS_CONFIG = {
  idle:    { cls: styles.idle,    label: 'READY'   },
  loading: { cls: styles.loading, label: 'RUNNING' },
  live:    { cls: styles.live,    label: 'LIVE'    },
  error:   { cls: styles.error,   label: 'ERROR'   },
}

export default function Header({ view, setView, status }) {
  const { cls, label } = STATUS_CONFIG[status] || STATUS_CONFIG.idle

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoDot} />
        GEO·VISIBILITY·TRACKER
      </div>

      <nav className={styles.nav}>
        {['analyze', 'compare', 'history'].map(v => (
          <button
            key={v}
            className={`${styles.navBtn} ${view === v ? styles.active : ''}`}
            onClick={() => setView(v)}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </nav>

      <div className={styles.statusBadge}>
        <span className={`${styles.dot} ${cls}`} />
        <span className={styles.statusText}>{label}</span>
      </div>
    </header>
  )
}
