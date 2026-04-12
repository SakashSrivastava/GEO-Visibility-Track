/**
 * Compute average of an array of numbers.
 */
export function average(arr) {
  if (!arr.length) return 0
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length)
}

/**
 * Format a datetime string for display.
 */
export function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Export analysis data to CSV and trigger browser download.
 */
export function exportCSV(data) {
  if (!data) return

  const rows = [
    ['Model', 'Provider', 'Visibility Score', 'Mention Count', 'Sentiment', 'Sentiment Score', 'Position Rank'],
    ...data.models.map(m => [
      m.name,
      m.id,
      m.visibility_score,
      m.mention_count,
      m.sentiment_label,
      m.sentiment_score,
      m.position_rank,
    ]),
  ]

  const csv     = rows.map(r => r.join(',')).join('\n')
  const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url     = URL.createObjectURL(blob)
  const anchor  = document.createElement('a')
  anchor.href   = url
  anchor.download = `geo-visibility-${data.brand}-${Date.now()}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

/**
 * Clamp a number between min and max.
 */
export function clamp(val, min = 0, max = 100) {
  return Math.min(max, Math.max(min, val))
}
