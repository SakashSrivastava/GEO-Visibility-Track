import styles from './Citations.module.css'

export default function Citations({ data }) {
  if (!data?.length) {
    return (
      <div className={styles.wrap}>
        <p className={styles.title}>// Sources the models relied on</p>
        <div className={styles.empty}>
          No sources were cited in this analysis.
          <br />
          Grounded citations appear when a model's API reports the web pages it
          consulted, which for now means Gemini search grounding. That feature needs a
          Gemini key with billing enabled; on the free tier Google blocks the grounding
          tool, so grounded sources stay empty even though the key is set. The other
          models (GPT-OSS, Qwen) only contribute sources when they write URLs into their
          own answers.
        </div>
      </div>
    )
  }

  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div className={styles.wrap}>
      <p className={styles.title}>// Sources the models relied on, ranked by how often each domain was cited</p>
      <div className={styles.rows}>
        {data.map(d => (
          <div key={d.domain} className={styles.row}>
            <a className={styles.domain} href={d.sample_url || `https://${d.domain}`} target="_blank" rel="noreferrer">
              {d.domain}
            </a>
            {d.grounded && <span className={styles.grounded}>GROUNDED</span>}
            <div className={styles.barWrap}>
              <div className={styles.bar} style={{ width: (d.count / max * 100) + '%' }} />
            </div>
            <span className={styles.count}>{d.count}×</span>
            <span className={styles.models}>{d.models.join(', ')}</span>
          </div>
        ))}
      </div>
      <p className={styles.note}>
        <strong>GROUNDED</strong> = the model's API reported this page as a source it actually
        consulted. Others are URLs the models wrote into their answers.
      </p>
    </div>
  )
}
