import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import { getMe } from './services/api.js'
import AnalyzePage from './pages/AnalyzePage.jsx'
import ComparePage from './pages/ComparePage.jsx'
import OptimizePage from './pages/OptimizePage.jsx'
import MonitorPage from './pages/MonitorPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'

export default function App() {
  const [view, setView]           = useState('analyze')
  const [analysisData, setData]   = useState(null)
  const [status, setStatus]       = useState('idle') // idle | loading | live | error
  const [user, setUser]           = useState(null)

  // Restore session from a stored token.
  useEffect(() => {
    let token
    try { token = localStorage.getItem('geo_token') } catch { /* ignore */ }
    if (token) getMe().then(u => setUser(u.email)).catch(() => {
      try { localStorage.removeItem('geo_token') } catch { /* ignore */ }
    })
  }, [])

  function handleResult(data) {
    setData(data)
    setView('analyze')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header view={view} setView={setView} status={status} user={user} onAuth={setUser} />

      <main style={{ flex: 1, padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {view === 'analyze' && (
          <AnalyzePage
            analysisData={analysisData}
            setData={setData}
            status={status}
            setStatus={setStatus}
          />
        )}
        {view === 'compare'  && <ComparePage  analysisData={analysisData} />}
        {view === 'optimize' && <OptimizePage analysisData={analysisData} />}
        {view === 'monitor'  && <MonitorPage  key={user || 'anon'} analysisData={analysisData} />}
        {view === 'history'  && <HistoryPage  key={user || 'anon'} onLoad={handleResult} />}
      </main>
    </div>
  )
}
