import { useState, useEffect } from 'react'
import { fetchHistory, fetchHistoryItem, deleteHistoryItem, clearHistory } from '../services/api.js'
import { formatDate } from '../utils/helpers.js'
import styles from './HistoryPage.module.css'

export default function HistoryPage({ onLoad }) {
  const [records,  setRecords]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [deleting, setDeleting] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchHistory(20)
      setRecords(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleView(id) {
    try {
      const item = await fetchHistoryItem(id)
      if (item.results) onLoad(item.results)
    } catch (e) {
      alert('Could not load this analysis: ' + e.message)
    }
  }

  async function handleDelete(id) {
    setDeleting(id)
    try {
      await deleteHistoryItem(id)
      setRecords(prev => prev.filter(r => r.id !== id))
    } catch (e) {
      alert('Delete failed: ' + e.message)
    } finally {
      setDeleting(null)
    }
  }

  async function handleClearAll() {
    if (!window.confirm('Delete all history? This cannot be undone.')) return
    try {
      await clearHistory()
      setRecords([])
    } catch (e) {
      alert('Clear failed: ' + e.message)
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading history…</div>
  }

  if (error) {
    return (
      <div className={styles.errorBox}>
        Could not load history: {error}
        <button className={styles.retryBtn} onClick={load}>Retry</button>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.topRow}>
        <p className={styles.title}>// Analysis History</p>
        {records.length > 0 && (
          <button className={styles.clearBtn} onClick={handleClearAll}>
            Clear All
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>◷</div>
          <p className={styles.emptyText}>No previous analyses. Run your first query on the Analyze tab.</p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Brand</th>
              <th>Region</th>
              <th>Avg Score</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td className={styles.idCell}>#{r.id}</td>
                <td className={styles.brandCell}>{r.brand}</td>
                <td className={styles.regionCell}>{r.region.toUpperCase()}</td>
                <td>
                  <span
                    className={styles.score}
                    style={{
                      color: r.avg_score >= 70
                        ? 'var(--green)'
                        : r.avg_score >= 45
                          ? 'var(--accent)'
                          : 'var(--red)',
                    }}
                  >
                    {r.avg_score}
                  </span>
                </td>
                <td className={styles.dateCell}>{formatDate(r.created_at)}</td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.viewBtn} onClick={() => handleView(r.id)}>
                      View ↗
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(r.id)}
                      disabled={deleting === r.id}
                    >
                      {deleting === r.id ? '…' : '✕'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
