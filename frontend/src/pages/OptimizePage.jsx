import { useState } from 'react'
import { runAudit } from '../services/api.js'
import { PROMPT_TEMPLATES } from '../utils/constants.js'
import styles from './OptimizePage.module.css'

const PRIORITY_COLOR = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--text2)' }

function scoreColor(s) {
  return s >= 70 ? 'var(--green)' : s >= 40 ? 'var(--amber)' : 'var(--red)'
}

export default function OptimizePage({ analysisData }) {
  const [brand, setBrand] = useState(analysisData?.brand || '')
  const [url,   setUrl]   = useState('')
  const [prompts, setPrompts] = useState(new Set(['Top AI companies']))
  const [runExp, setRunExp]   = useState(true)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [data,    setData]    = useState(null)

  // Carried over from the last analysis: keyword gaps + the competitive field for the experiment
  const missingKeywords = [...new Set((analysisData?.models || []).flatMap(m => m.keywords_missing || []))]
  const competitors = (analysisData?.share_of_voice || []).filter(s => !s.is_target).map(s => s.name)

  function toggle(p) {
    setPrompts(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n })
  }

  async function run() {
    if (!brand.trim() || !url.trim()) return alert('Enter both a brand and a website URL.')
    setLoading(true); setError(null)
    try {
      const res = await runAudit({
        brand: brand.trim(), url: url.trim(), region: 'global',
        prompts: [...prompts], missing_keywords: missingKeywords,
        competitors, run_experiment: runExp,
      })
      setData(res)
    } catch (e) {
      setError(e?.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  const audit = data?.audit
  const exp   = data?.experiment

  return (
    <div>
      <div className={styles.panel}>
        <p className={styles.panelTitle}>// Website Auditor & GEO Optimizer</p>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Brand</label>
            <input className={styles.input} value={brand} onChange={e => setBrand(e.target.value)}
                   placeholder="e.g. Anthropic" />
          </div>
          <div className={styles.field} style={{ flex: 2 }}>
            <label className={styles.label}>Website URL</label>
            <input className={styles.input} value={url} onChange={e => setUrl(e.target.value)}
                   placeholder="e.g. anthropic.com" onKeyDown={e => e.key === 'Enter' && run()} />
          </div>
          <button className={styles.runBtn} onClick={run} disabled={loading}>
            {loading ? 'Auditing…' : '▶ Audit & Optimize'}
          </button>
        </div>

        <div className={styles.tagsRow}>
          <span className={styles.tagsLabel}>EXPERIMENT PROMPTS:</span>
          {PROMPT_TEMPLATES.map(p => (
            <button key={p} className={`${styles.tag} ${prompts.has(p) ? styles.tagActive : ''}`}
                    onClick={() => toggle(p)}>{p}</button>
          ))}
          <label className={styles.checkbox}>
            <input type="checkbox" checked={runExp} onChange={e => setRunExp(e.target.checked)} />
            Run impact experiment
          </label>
        </div>
        {(missingKeywords.length > 0 || competitors.length > 0) && (
          <p className={styles.hint}>
            From your last analysis: {missingKeywords.length} keyword gap(s)
            {competitors.length > 0 && ` · competitive field: ${competitors.join(', ')}`}.
          </p>
        )}
      </div>

      {error && <div className={styles.errorBox}><strong>Audit failed:</strong> {error}</div>}

      {!data && !error && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>◎</div>
          <div className={styles.emptyTitle}>AUDIT A SITE</div>
          <p>Enter a brand + its website to score GEO-readiness, get prioritized fixes,<br />
             and measure whether those fixes raise AI visibility.</p>
        </div>
      )}

      {audit && !audit.fetched && (
        <div className={styles.errorBox}>Could not fetch <strong>{audit.url}</strong>: {audit.error}</div>
      )}

      {audit?.fetched && (
        <>
          {/* Score + signals */}
          <div className={styles.grid}>
            <div className={styles.scoreCard}>
              <div className={styles.scoreNum} style={{ color: scoreColor(audit.geo_score) }}>
                {audit.geo_score}<span className={styles.scoreMax}>/100</span>
              </div>
              <div className={styles.scoreLbl}>GEO-Readiness Score</div>
              <div className={styles.scoreSub}>{audit.word_count} words · {audit.schema_types.length} schema block(s)</div>
            </div>
            <div className={styles.signals}>
              {audit.signals.map(s => (
                <div key={s.key} className={styles.signal}>
                  <span className={`${styles.sigMark} ${s.passed ? styles.pass : styles.fail}`}>
                    {s.passed ? '✓' : '✕'}
                  </span>
                  <span className={styles.sigLabel}>{s.label}</span>
                  <span className={styles.sigDetail}>{s.detail}</span>
                  <span className={styles.sigWeight}>{s.weight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Experiment */}
          {exp?.ran && (
            <div className={styles.expCard}>
              <p className={styles.sectionTitle}>// Measurable-Impact Experiment — paired A/B in a competitive pool</p>
              <div className={styles.expBars}>
                <div className={styles.expBar}>
                  <span className={styles.expLbl}>Without recommendations</span>
                  <div className={styles.barWrap}><div className={styles.bar}
                    style={{ width: `${exp.baseline_visibility}%`, background: 'var(--text2)' }} /></div>
                  <span className={styles.expVal}>{exp.baseline_visibility}</span>
                </div>
                <div className={styles.expBar}>
                  <span className={styles.expLbl}>With recommendations</span>
                  <div className={styles.barWrap}><div className={styles.bar}
                    style={{ width: `${exp.treatment_visibility}%`, background: 'var(--green)' }} /></div>
                  <span className={styles.expVal}>{exp.treatment_visibility}</span>
                </div>
              </div>
              <div className={styles.lift} style={{ color: exp.improved ? 'var(--green)' : 'var(--text2)' }}>
                {exp.lift >= 0 ? '▲' : '▼'} {exp.lift >= 0 ? '+' : ''}{exp.lift} visibility
                <span className={styles.ci}> (95% CI {exp.lift_ci_low >= 0 ? '+' : ''}{exp.lift_ci_low} to {exp.lift_ci_high >= 0 ? '+' : ''}{exp.lift_ci_high})</span>
                {' — '}
                {exp.significant
                  ? (exp.improved ? 'statistically significant improvement' : 'significant change')
                  : 'not statistically significant'}
              </div>
              <p className={styles.expDetail}>{exp.detail}</p>
              {exp.note && <p className={styles.expNote}>⚠ {exp.note}</p>}
            </div>
          )}

          {/* Recommendations */}
          <p className={styles.sectionTitle}>// Prioritized Recommendations ({data.recommendations.length})</p>
          <div className={styles.recs}>
            {data.recommendations.map((r, i) => (
              <div key={i} className={styles.rec}>
                <div className={styles.recHead}>
                  <span className={styles.recPri} style={{ color: PRIORITY_COLOR[r.priority], borderColor: PRIORITY_COLOR[r.priority] }}>
                    {r.priority}
                  </span>
                  <span className={styles.recType}>{r.type}</span>
                  <span className={styles.recTitle}>{r.title}</span>
                </div>
                <p className={styles.recRationale}>{r.rationale}</p>
                <pre className={styles.recSuggested}>{r.suggested}</pre>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
