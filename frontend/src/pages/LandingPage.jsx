import { useState, useEffect, useRef } from 'react'
import styles from './LandingPage.module.css'

const GH = 'https://github.com/SakashSrivastava/GEO-Visibility-Track'

const DEMO = [
  { name: 'GPT-OSS 120B', score: 92, color: 'var(--green)' },
  { name: 'Gemini',       score: 86, color: 'var(--purple)' },
  { name: 'Qwen3 27B',    score: 79, color: 'var(--amber)' },
  { name: 'GPT-OSS 20B',  score: 71, color: 'var(--accent)' },
]

const CAPS = [
  { n: '01', t: 'Multi-model visibility', b: 'Query every real model directly (Gemini, GPT-OSS, Qwen) and measure where your brand actually appears, repeated over multiple runs with full statistics.' },
  { n: '02', t: 'Share of Voice', b: 'What proportion of AI mentions in your category belong to you versus named competitors, counted from the real responses rather than estimated.' },
  { n: '03', t: 'Citation tracking', b: 'Which websites the models rely on, from grounded search sources to the URLs they cite directly in their answers.' },
  { n: '04', t: 'Audit & live experiment', b: 'Score your site’s GEO-readiness, generate prioritized fixes, then prove whether those fixes raise your visibility with a significance-tested A/B.' },
  { n: '05', t: 'Monitoring & drift alerts', b: 'Track visibility on a schedule and get alerted the moment your brand slips below where it should be.' },
  { n: '06', t: 'Accounts & reports', b: 'Private history and monitors per account, with one-click PDF and CSV export of any analysis.' },
]

const STEPS = [
  { n: '01', t: 'Ask real models', b: 'We send your discovery queries to each model’s live API, without naming your brand, so we measure organic visibility.' },
  { n: '02', t: 'Store every word', b: 'The verbatim answer from each run is saved, so every number traces back to the exact text that produced it.' },
  { n: '03', t: 'Compute, not guess', b: 'Visibility, position and sentiment are derived from the real text with documented formulas, aggregated across runs.' },
  { n: '04', t: 'Track & improve', b: 'Benchmark competitors, audit the site, test fixes, and watch the trend, all from one dashboard.' },
]

const MARQUEE = ['Gemini', 'GPT-OSS 120B', 'Qwen3', 'Share of Voice', 'Citations', 'Drift alerts', 'GEO audit', 'A/B experiment', 'PDF reports']

/* reveal-on-scroll */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(`.${styles.reveal}`)
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add(styles.in); io.unobserve(e.target) } })
    }, { threshold: 0.15 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* count-up when it enters view */
function Stat({ to, suffix = '', label }) {
  const ref = useRef(null)
  const [val, setVal] = useState(0)
  useEffect(() => {
    const el = ref.current
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const dur = 900, t0 = performance.now()
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur)
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * to))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    if (el) io.observe(el)
    return () => io.disconnect()
  }, [to])
  return (
    <div ref={ref} className={styles.stat}>
      <strong>{val}{suffix}</strong>
      <span>{label}</span>
    </div>
  )
}

export default function LandingPage({ onLaunch }) {
  useReveal()
  const [brand, setBrand] = useState('Anthropic')
  const [seed, setSeed] = useState(0)
  useEffect(() => { const id = setTimeout(() => setSeed(s => s + 1), 60); return () => clearTimeout(id) }, [brand])

  return (
    <div className={styles.page}>
      {/* Masthead */}
      <header className={styles.nav}>
        <div className={styles.brand}>
          <span className={styles.mark} />
          <span className={styles.wordmark}>GEO<span className={styles.sub}> / Visibility Tracker</span></span>
        </div>
        <nav className={styles.links}>
          <a href="#index">Index</a>
          <a href="#how">Method</a>
          <a href={GH} target="_blank" rel="noreferrer">Source</a>
        </nav>
        <button className={styles.launch} onClick={onLaunch}>Launch tool</button>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.kicker}><span className={styles.issue}>Issue №1</span> Generative Engine Optimization</p>
          <h1 className={styles.h1}>
            Know how AI<br />
            <span className={styles.ital}>talks about</span> your brand.
          </h1>
          <p className={styles.lede}>
            Discovery is moving from search engines to AI assistants. We measure, with
            real model queries and never simulations, how often and how favorably the models
            name your brand, and exactly how to improve it.
          </p>
          <div className={styles.ctas}>
            <button className={styles.ctaSolid} onClick={onLaunch}>Launch the dashboard →</button>
            <a className={styles.ctaLink} href={GH} target="_blank" rel="noreferrer">Read the source</a>
          </div>
          <div className={styles.stats}>
            <Stat to={4} label="real models queried" />
            <Stat to={0} label="simulated scores" />
            <Stat to={100} suffix="%" label="metrics from real text" />
          </div>
        </div>

        {/* Interactive leaderboard */}
        <aside className={styles.widget}>
          <div className={styles.widgetTop}>
            <span className={styles.widgetTag}>LIVE PREVIEW</span>
            <span className={styles.widgetDot} />
          </div>
          <label className={styles.widgetLabel}>Brand</label>
          <input className={styles.widgetInput} value={brand}
                 onChange={e => setBrand(e.target.value || ' ')} spellCheck="false" />
          <p className={styles.widgetCap}>Visibility across models for “{brand.trim() || 'your brand'}”</p>
          <div className={styles.board} key={seed}>
            {DEMO.map((m, i) => (
              <div key={m.name} className={styles.row}>
                <span className={styles.rName}>{m.name}</span>
                <div className={styles.track}>
                  <i style={{ '--w': `${m.score}%`, background: m.color, animationDelay: `${i * 90}ms` }} />
                </div>
                <b className={styles.rVal}>{m.score}</b>
              </div>
            ))}
          </div>
          <div className={styles.widgetFoot}><span>real API</span><span>3 runs</span><span>mean ± sd</span></div>
        </aside>
      </section>

      {/* Marquee */}
      <div className={styles.marquee}>
        <div className={styles.track2}>
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className={styles.mItem}>{m}<span className={styles.star}>✦</span></span>
          ))}
        </div>
      </div>

      {/* Statement */}
      <section className={`${styles.statement} ${styles.reveal}`}>
        <p className={styles.kickerDark}>The shift</p>
        <p className={styles.bigQuote}>
          Ranking <span className={styles.hl}>#1 on Google</span> means nothing if the AI
          never mentions you. A direct answer names some brands and ignores others, with
          no links, and no transparency. Traditional SEO tools can’t see this channel at all.
        </p>
      </section>

      {/* Capabilities: editorial index */}
      <section id="index" className={styles.section}>
        <div className={`${styles.secHead} ${styles.reveal}`}>
          <p className={styles.eyebrow}>Capabilities</p>
          <h2 className={styles.h2}>Everything needed to measure<br />and improve AI visibility.</h2>
        </div>
        <ol className={styles.index}>
          {CAPS.map(c => (
            <li key={c.n} className={`${styles.idxRow} ${styles.reveal}`} onClick={onLaunch}>
              <span className={styles.idxN}>{c.n}</span>
              <span className={styles.idxT}>{c.t}</span>
              <span className={styles.idxB}>{c.b}</span>
              <span className={styles.idxArrow}>→</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Method */}
      <section id="how" className={styles.sectionAlt}>
        <div className={`${styles.secHead} ${styles.reveal}`}>
          <p className={styles.eyebrow}>Method</p>
          <h2 className={styles.h2}>Honest measurement,<br />end to end.</h2>
        </div>
        <div className={styles.steps}>
          {STEPS.map(s => (
            <div key={s.n} className={`${styles.step} ${styles.reveal}`}>
              <span className={styles.stepN}>{s.n}</span>
              <h3>{s.t}</h3>
              <p>{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={`${styles.cta} ${styles.reveal}`}>
        <h2 className={styles.ctaH}>Measure your brand’s<br /><span className={styles.ital}>AI visibility.</span></h2>
        <p>Free, open source, running on real models.</p>
        <button className={styles.ctaSolidLg} onClick={onLaunch}>Open the dashboard →</button>
      </section>

      {/* Footer / colophon */}
      <footer className={styles.footer}>
        <div className={styles.colophon}>
          <span className={styles.mark} />
          <div>
            <p className={styles.footName}>GEO · Visibility Tracker</p>
            <p className={styles.footNote}>Built with real model APIs, not simulations.</p>
          </div>
        </div>
        <div className={styles.footLinks}>
          <a href="#index">Index</a>
          <a href="#how">Method</a>
          <a href={GH} target="_blank" rel="noreferrer">Source</a>
          <button onClick={onLaunch}>Launch</button>
        </div>
      </footer>
    </div>
  )
}
