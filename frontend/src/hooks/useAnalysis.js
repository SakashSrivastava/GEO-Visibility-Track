import { useState, useCallback } from 'react'
import { runAnalysis } from '../services/api.js'

export default function useAnalysis() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const analyze = useCallback(async (brand, region, prompts) => {
    setLoading(true)
    setError(null)
    try {
      const result = await runAnalysis({ brand, region, prompts })
      setData(result)
      return result
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Unknown error'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, analyze, setData }
}
