import { useState } from 'react'
import { REGIONS, PROMPT_TEMPLATES } from '../utils/constants.js'
import { exportCSV } from '../utils/helpers.js'
import styles from './QueryPanel.module.css'

export default function QueryPanel({ onRun, loading, analysisData }) {
  const [brand,         setBrand]        = useState('')
  const [website,       setWebsite]      = useState('')
  const [region,        setRegion]       = useState('global')
  const [activePrompts, setPrompts]      = useState(new Set(['Top AI companies', 'Best LLM platforms']))
  const [customPrompt,  setCustomPrompt] = useState('')
  const [inputMode,     setInputMode]    = useState('name') // 'name' | 'website' | 'both'

  function togglePrompt(p) {
    setPrompts(prev => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })
  }

  function addCustomPrompt() {
    const trimmed = customPrompt.trim()
    if (!trimmed) return
    setPrompts(prev => new Set([...prev, trimmed]))
    setCustomPrompt('')
  }

  function removePrompt(p) {
    setPrompts(prev => {
      const next = new Set(prev)
      next.delete(p)
      return next
    })
  }

  function handleRun() {
    const needsBrand   = inputMode === 'name' || inputMode === 'both'
    const needsWebsite = inputMode === 'website' || inputMode === 'both'

    if (needsBrand && !brand.trim())     return alert('Please enter a brand or company name.')
    if (needsWebsite && !website.trim()) return alert('Please enter a website URL.')
    if (!activePrompts.size)             return alert('Add at least one prompt.')

    onRun({
      brand:   needsBrand   ? brand.trim()   : website.trim(),
      website: needsWebsite ? website.trim() : '',
      region,
      prompts: [...activePrompts],
    })
  }

  return (
    <div className={styles.panel}>
      <p className={styles.panelTitle}>// Query Configuration</p>

      {/* Input mode toggle */}
      <div className={styles.modeRow}>
        <span className={styles.modeLabel}>SEARCH BY:</span>
        {[
          { value: 'name',    label: 'Company Name' },
          { value: 'website', label: 'Website URL'  },
          { value: 'both',    label: 'Both'         },
        ].map(m => (
          <button
            key={m.value}
            className={`${styles.modeBtn} ${inputMode === m.value ? styles.modeBtnActive : ''}`}
            onClick={() => setInputMode(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Main input row */}
      <div className={styles.row}>

        {/* Company name input */}
        {(inputMode === 'name' || inputMode === 'both') && (
          <div className={styles.field}>
            <label className={styles.label}>Company / Brand Name</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. Anthropic, Tesla, Zomato"
              value={brand}
              onChange={e => setBrand(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRun()}
            />
          </div>
        )}

        {/* Website URL input */}
        {(inputMode === 'website' || inputMode === 'both') && (
          <div className={styles.field}>
            <label className={styles.label}>Website URL</label>
            <input
              className={styles.input}
              type="url"
              placeholder="e.g. https://anthropic.com"
              value={website}
              onChange={e => setWebsite(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRun()}
            />
          </div>
        )}

        {/* Region */}
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
            ? <span className={styles.spinner} />
            : '▶ Run Analysis'
          }
        </button>

        <button
          className={styles.exportBtn}
          onClick={() => exportCSV(analysisData)}
          disabled={!analysisData}
        >
          Export CSV
        </button>
      </div>

      {/* Prompt section */}
      <div className={styles.promptSection}>
        <div className={styles.promptHeader}>
          <span className={styles.tagsLabel}>PROMPTS:</span>
          <span className={styles.promptHint}>Select presets or type your own</span>
        </div>

        {/* Preset prompt tags */}
        <div className={styles.tagsRow}>
          {PROMPT_TEMPLATES.map(p => (
            <button
              key={p}
              className={`${styles.tag} ${activePrompts.has(p) ? styles.tagActive : ''}`}
              onClick={() => togglePrompt(p)}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Custom prompt input */}
        <div className={styles.customRow}>
          <input
            className={styles.customInput}
            type="text"
            placeholder="Type your own prompt e.g. Best food delivery apps in India"
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomPrompt()}
          />
          <button
            className={styles.addBtn}
            onClick={addCustomPrompt}
            disabled={!customPrompt.trim()}
          >
            + Add
          </button>
        </div>

        {/* Active prompts with remove button */}
        {activePrompts.size > 0 && (
          <div className={styles.activeRow}>
            <span className={styles.activeLabel}>ACTIVE:</span>
            {[...activePrompts].map(p => (
              <span key={p} className={styles.activeTag}>
                {p}
                <button className={styles.removeBtn} onClick={() => removePrompt(p)}>x</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}