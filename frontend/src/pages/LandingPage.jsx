import styles from './LandingPage.module.css'

const GH = 'https://github.com/SakashSrivastava/GEO-Visibility-Track'

/* ── Inline icons ─────────────────────────────────────────────────────────── */
const Icon = {
  models: <path d="M12 2 2 7l10 5 10-5-10-5Zm0 7.5L4.5 6 12 2.3 19.5 6 12 9.5ZM2 12l10 5 10-5M2 17l10 5 10-5" />,
  share:  <><circle cx="6" cy="12" r="3" /><circle cx="18" cy="6" r="3" /><circle cx="18" cy="18" r="3" /><path d="M8.6 10.6 15.4 7.4M8.6 13.4l6.8 3.2" /></>,
  cite:   <><path d="M4 5h16M4 12h10M4 19h7" /><path d="m15 17 2 2 4-4" /></>,
  audit:  <><path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z" /><path d="m16 16 5 5" /><path d="M8 11h6M11 8v6" /></>,
  bell:   <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Z" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
  lock:   <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
}
function Svg({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
         strokeLinecap="round" strokeLinejoin="round">{d}</svg>
  )
}

const FEATURES = [
  { icon: 'models', title: 'Multi-model visibility', body: 'Query every real model directly — Gemini, GPT-OSS, Qwen and more — and measure where your brand actually appears, repeated over multiple runs with statistics.' },
  { icon: 'share',  title: 'Share of Voice',        body: 'See what proportion of AI mentions in your category belong to you versus named competitors, counted from the real responses.' },
  { icon: 'cite',   title: 'Citation tracking',     body: 'Discover which websites the models rely on — from grounded search sources to the URLs they cite in their answers.' },
  { icon: 'audit',  title: 'Audit & experiment',    body: 'Score your site’s GEO-readiness, get prioritized fixes, then measure — with a significance-tested A/B — whether those fixes raise your visibility.' },
  { icon: 'bell',   title: 'Monitoring & alerts',   body: 'Track visibility over time on a schedule and get alerted the moment your brand drifts below where it should be.' },
  { icon: 'lock',   title: 'Accounts & reports',    body: 'Private history and monitors per account, with one-click PDF and CSV export of any analysis.' },
]

const STEPS = [
  { n: '01', title: 'Ask real models', body: 'We send your discovery queries to each model’s live API — without naming your brand — so we measure organic visibility, not a prompt echo.' },
  { n: '02', title: 'Store every response', body: 'The verbatim answer from each run is saved, so every number can be traced back to the exact text that produced it.' },
  { n: '03', title: 'Compute, don’t guess', body: 'Visibility, position, sentiment and mentions are derived from the real text with documented formulas — aggregated across runs with mean, variance and appearance rate.' },
  { n: '04', title: 'Track & improve', body: 'Benchmark competitors, audit your site, test fixes, and monitor the trend over time from one dashboard.' },
]

export default function LandingPage({ onLaunch }) {
  return (
    <div className={styles.page}>
      {/* Nav */}
      <header className={styles.nav}>
        <div className={styles.logo}><span className={styles.logoMark} />GEO<span className={styles.logoThin}>·Visibility</span></div>
        <nav className={styles.navLinks}>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#why">Why GEO</a>
          <a href={GH} target="_blank" rel="noreferrer">GitHub</a>
        </nav>
        <button className={styles.navCta} onClick={onLaunch}>Launch app →</button>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Generative Engine Optimization</span>
          <h1 className={styles.h1}>
            Know how AI<br /><span className={styles.grad}>talks about your brand.</span>
          </h1>
          <p className={styles.lede}>
            Discovery is moving from search engines to AI assistants. GEO Visibility Tracker
            measures — with real model queries, not simulations — how often and how favorably
            ChatGPT-class models name your brand, and exactly how to improve it.
          </p>
          <div className={styles.heroCtas}>
            <button className={styles.ctaPrimary} onClick={onLaunch}>Launch the dashboard →</button>
            <a className={styles.ctaGhost} href={GH} target="_blank" rel="noreferrer">View on GitHub</a>
          </div>
          <div className={styles.trust}>
            <div><strong>4</strong><span>real models queried</span></div>
            <div><strong>0</strong><span>simulated scores</span></div>
            <div><strong>100%</strong><span>metrics from real text</span></div>
          </div>
        </div>

        {/* Floating preview card */}
        <div className={styles.previewCard}>
          <div className={styles.pcHead}>
            <span className={styles.pcDot} /> Qwen3 27B <span className={styles.pcProvider}>ALIBABA</span>
            <span className={styles.pcRank}>#1</span>
          </div>
          <div className={styles.pcBig}>92<span>/100 visibility</span></div>
          <div className={styles.pcBarRow}><span>Appearance</span><div className={styles.pcBar}><i style={{ width: '100%' }} /></div><b>100%</b></div>
          <div className={styles.pcBarRow}><span>Sentiment</span><div className={styles.pcBar}><i style={{ width: '78%', background: 'var(--green)' }} /></div><b>Positive</b></div>
          <div className={styles.pcChips}><span>real API</span><span>3 runs</span><span>±4.1</span></div>
        </div>
      </section>

      {/* Why / problem */}
      <section id="why" className={styles.band}>
        <div className={styles.bandInner}>
          <span className={styles.eyebrow}>The shift</span>
          <h2 className={styles.h2}>Ranking #1 on Google means nothing if the AI never mentions you.</h2>
          <p className={styles.bandLede}>
            A growing share of people ask an assistant instead of searching. The model returns a
            direct answer — naming some brands, ignoring others — with no list of links and no
            transparency. Traditional SEO tools can’t see this channel at all.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>Capabilities</span>
          <h2 className={styles.h2}>Everything you need to measure and improve AI visibility.</h2>
        </div>
        <div className={styles.featureGrid}>
          {FEATURES.map(f => (
            <div key={f.title} className={styles.feature}>
              <div className={styles.featureIcon}><Svg d={Icon[f.icon]} /></div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>How it works</span>
          <h2 className={styles.h2}>Honest measurement, end to end.</h2>
        </div>
        <div className={styles.steps}>
          {STEPS.map(s => (
            <div key={s.n} className={styles.step}>
              <span className={styles.stepN}>{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaBand}>
        <div className={styles.ctaGlow} />
        <h2 className={styles.h2}>Measure your brand’s AI visibility.</h2>
        <p>Free, open source, and running on real models right now.</p>
        <button className={styles.ctaPrimary} onClick={onLaunch}>Open the dashboard →</button>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footLogo}><span className={styles.logoMark} />GEO·Visibility·Tracker</div>
        <div className={styles.footLinks}>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href={GH} target="_blank" rel="noreferrer">GitHub</a>
          <button className={styles.footBtn} onClick={onLaunch}>Launch app</button>
        </div>
        <p className={styles.footNote}>Measuring brand visibility across AI models — built with real APIs, not simulations.</p>
      </footer>
    </div>
  )
}
