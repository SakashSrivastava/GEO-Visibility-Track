import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  createMonitor, fetchMonitors, updateMonitor, runMonitorNow, deleteMonitor,
  fetchTrend, fetchAlerts, ackAlert,
} from '../services/api.js'
import { REGIONS, PROMPT_TEMPLATES } from '../utils/constants.js'
import { formatDate } from '../utils/helpers.js'
import styles from './MonitorPage.module.css'

const INTERVALS = [
  { label: 'Every 5 min (test)', value: 5 },
  { label: 'Hourly', value: 60 },
  { label: 'Daily', value: 1440 },
  { label: 'Weekly', value: 10080 },
]
const SEV_COLOR = { high: 'var(--red)', medium: 'var(--amber)', info: 'var(--accent)' }

export default function MonitorPage({ analysisData }) {
  const [monitors, setMonitors] = useState([])
  const [alerts, setAlerts]     = useState([])
  const [brand, setBrand]       = useState(analysisData?.brand || '')
  const [region, setRegion]     = useState('global')
  const [prompts, setPrompts]   = useState(new Set(['Top AI companies']))
  const [interval, setInterval] = useState(1440)
  const [threshold, setThreshold] = useState(10)
  const [busy, setBusy]         = useState(false)
  const [trends, setTrends]     = useState({})   // id -> points

  const competitors = (analysisData?.share_of_voice || []).filter(s => !s.is_target).map(s => s.name)

  const refresh = useCallback(async () => {
    const [m, a] = await Promise.all([fetchMonitors(), fetchAlerts()])
    setMonitors(m); setAlerts(a)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  function toggle(p) {
    setPrompts(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n })
  }

  async function create() {
    if (!brand.trim() || !prompts.size) return alert('Enter a brand and select at least one prompt.')
    setBusy(true)
    try {
      await createMonitor({
        brand: brand.trim(), region, prompts: [...prompts], competitors,
        interval_minutes: interval, drop_threshold: threshold, run_now: true,
      })
      await refresh()
    } catch (e) { alert(e?.response?.data?.detail || e.message) }
    finally { setBusy(false) }
  }

  async function act(fn) { setBusy(true); try { await fn(); await refresh() } finally { setBusy(false) } }

  async function loadTrend(id) {
    if (trends[id]) { setTrends(t => ({ ...t, [id]: undefined })); return }
    const pts = await fetchTrend(id)
    setTrends(t => ({ ...t, [id]: pts.map(p => ({ t: new Date(p.created_at).getTime(), score: p.avg_score })) }))
  }

  return (
    <div>
      {/* Create monitor */}
      <div className={styles.panel}>
        <p className={styles.panelTitle}>// Schedule a monitor — re-runs automatically and alerts on visibility drift</p>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Brand</label>
            <input className={styles.input} value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Anthropic" />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Region</label>
            <select className={styles.input} value={region} onChange={e => setRegion(e.target.value)}>
              {REGIONS.map(r => <option key={r.value} value={r.value}>{r.flag} {r.label}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Frequency</label>
            <select className={styles.input} value={interval} onChange={e => setInterval(+e.target.value)}>
              {INTERVALS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Alert if drop {'>'}  </label>
            <input className={styles.input} type="number" value={threshold} onChange={e => setThreshold(+e.target.value)} />
          </div>
          <button className={styles.runBtn} onClick={create} disabled={busy}>
            {busy ? 'Working…' : '+ Create Monitor'}
          </button>
        </div>
        <div className={styles.tagsRow}>
          <span className={styles.tagsLabel}>PROMPTS:</span>
          {PROMPT_TEMPLATES.map(p => (
            <button key={p} className={`${styles.tag} ${prompts.has(p) ? styles.tagActive : ''}`} onClick={() => toggle(p)}>{p}</button>
          ))}
          {competitors.length > 0 && <span className={styles.hint}>competitors: {competitors.join(', ')}</span>}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className={styles.alerts}>
          <p className={styles.sectionTitle}>// Alerts</p>
          {alerts.map(a => (
            <div key={a.id} className={`${styles.alert} ${a.acknowledged ? styles.acked : ''}`}>
              <span className={styles.sev} style={{ background: SEV_COLOR[a.severity] }}>{a.severity}</span>
              <span className={styles.alertMsg}>{a.message}</span>
              <span className={styles.alertTime}>{formatDate(a.created_at)}</span>
              {!a.acknowledged && <button className={styles.ackBtn} onClick={() => act(() => ackAlert(a.id))}>Dismiss</button>}
            </div>
          ))}
        </div>
      )}

      {/* Monitors */}
      <p className={styles.sectionTitle}>// Active Monitors ({monitors.length})</p>
      {monitors.length === 0 && <div className={styles.empty}>No monitors yet. Create one above to track a brand over time.</div>}
      <div className={styles.monitors}>
        {monitors.map(m => (
          <div key={m.id} className={styles.monitor}>
            <div className={styles.mHead}>
              <div>
                <span className={styles.mBrand}>{m.brand}</span>
                <span className={styles.mMeta}>{m.region} · every {m.interval_minutes}m · drop {'>'}{m.drop_threshold}</span>
              </div>
              <div className={styles.mActions}>
                <span className={styles.mScore}>{m.baseline_score ?? '—'}</span>
                <button className={styles.sBtn} onClick={() => act(() => updateMonitor(m.id, { enabled: !m.enabled }))}>
                  {m.enabled ? '⏸ Pause' : '▶ Resume'}
                </button>
                <button className={styles.sBtn} onClick={() => act(() => runMonitorNow(m.id))} disabled={busy}>↻ Run now</button>
                <button className={styles.sBtn} onClick={() => loadTrend(m.id)}>📈 Trend</button>
                <button className={styles.sBtnDel} onClick={() => act(() => deleteMonitor(m.id))}>✕</button>
              </div>
            </div>
            <div className={styles.mSub}>
              last run: {m.last_run ? formatDate(m.last_run) : 'never'} · next: {m.next_run ? formatDate(m.next_run) : (m.enabled ? 'scheduled' : 'paused')}
            </div>
            {trends[m.id] && (
              <div className={styles.chart}>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trends[m.id]} margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time"
                           tickFormatter={t => new Date(t).toLocaleDateString()} stroke="var(--text3)" fontSize={10} />
                    <YAxis domain={[0, 100]} stroke="var(--text3)" fontSize={10} />
                    <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', fontSize: 12 }}
                             labelFormatter={t => formatDate(new Date(t).toISOString())} />
                    <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
