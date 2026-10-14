import { useState } from 'react'
import { REGIONS, PROMPT_TEMPLATES } from '../utils/constants.js'
import { exportCSV } from '../utils/helpers.js'
import styles from './QueryPanel.module.css'

export default function QueryPanel({ onRun, loading, analysisData }) {
  const [brand,          setBrand]       = useState('Anthropic')
  const [region,         setRegion]      = useState('global')
  const [activePrompts,  setPrompts]     = useState(new Set(['Top AI companies', 'Best LLM platforms']))
  const [customPrompts,  setCustom]      = useState([])
  const [customInput,    setCustomInput] = useState('')
  const [competitors,    setCompetitors] = useState('')

  function togglePrompt(p) {
    setPrompts(prev => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })
  }

  function addCustomPrompt() {
    const p = customInput.trim()
    if (!p) return
    if (!customPrompts.includes(p)) setCustom(prev => [...prev, p])
    setPrompts(prev => new Set(prev).add(p))
    setCustomInput('')
  }

  function handleRun() {
    if (!brand.trim())         return alert('Please enter a brand or keyword.')
    if (!activePrompts.size)   return alert('Select or add at least one prompt.')
    const comps = competitors.split(',').map(c => c.trim()).filter(Boolean)
    onRun(brand.trim(), region, [...activePrompts], comps)
  }

  const allPrompts = [...PROMPT_TEMPLATES, ...customPrompts]

  return (
    <div className={styles.panel}>
      <p className={styles.panelTitle}>// Query Configuration</p>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Brand / Keyword</label>
          <input
            className={styles.input}
            type="text"
            placeholder="e.g. Anthropic, Tesla, OpenAI…"
            value={brand}
            onChange={e => setBrand(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRun()}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Region</label>
          <select
            className={styles.select}
            value={region}
            onChange={e => setRegion(e.target.value)}
          >
            {REGIONS.map(r => (
              <option key={r.value} value={r.value}>
                {r.flag} {r.label}
              </option>
            ))}
          </select>
        </div>

        <button
          className={`${styles.runBtn} ${loading ? styles.runBtnLoading : ''}`}
          onClick={handleRun}
          disabled={loading}
        >
          {loading
            ? <><span className={styles.spinner} /> Analyzing…</>
            : '▶ Run Analysis'
          }
        </button>

        <button
          className={styles.exportBtn}
          onClick={() => exportCSV(analysisData)}
          disabled={!analysisData}
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Competitors (Share of Voice) */}
      <div className={styles.row}>
        <div className={styles.field} style={{ flex: 1 }}>
          <label className={styles.label}>Competitors — for Share of Voice (comma-separated, optional)</label>
          <input
            className={styles.input}
            type="text"
            placeholder="e.g. OpenAI, Google, Mistral"
            value={competitors}
            onChange={e => setCompetitors(e.target.value)}
          />
        </div>
        <div className={styles.field} style={{ flex: 1 }}>
          <label className={styles.label}>Add custom discovery query</label>
          <input
            className={styles.input}
            type="text"
            placeholder="e.g. Most trusted AI research labs"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomPrompt()}
          />
        </div>
      </div>

      {/* Prompt tags */}
      <div className={styles.tagsRow}>
        <span className={styles.tagsLabel}>PROMPTS:</span>
        {allPrompts.map(p => (
          <button
            key={p}
            className={`${styles.tag} ${activePrompts.has(p) ? styles.tagActive : ''}`}
            onClick={() => togglePrompt(p)}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
