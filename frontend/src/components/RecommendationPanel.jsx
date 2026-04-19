import styles from './RecommendationPanel.module.css'

export default function RecommendationPanel({ items, loading }) {
  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p>AI is generating your GEO growth strategy...</p>
    </div>
  )

  if (!items || items.length === 0) return null

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>// STRATEGIC FIXES & RECOMMENDATIONS</h3>
        <span className={styles.count}>{items.length} ACTIONS</span>
      </div>

      <div className={styles.grid}>
        {items.map((item, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.typeTag} data-type={item.type}>
                {item.type.toUpperCase()}
              </span>
              <span className={styles.impactBadge} data-impact={item.impact.toLowerCase()}>
                {item.impact} Impact
              </span>
            </div>
            
            <h4 className={styles.cardTitle}>{item.title}</h4>
            <p className={styles.cardDesc}>{item.description}</p>
            
            <div className={styles.cardFooter}>
              <div className={styles.statusDot}></div>
              <span className={styles.statusText}>Priority Action</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}