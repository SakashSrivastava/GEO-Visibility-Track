import { useState } from 'react'
import Header from './components/Header.jsx'
import AnalyzePage from './pages/AnalyzePage.jsx'
import ComparePage from './pages/ComparePage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'

export default function App() {
  const [view, setView]           = useState('analyze')
  const [analysisData, setData]   = useState(null)
  const [status, setStatus]       = useState('idle') // idle | loading | live | error

  function handleResult(data) {
    setData(data)
    setView('analyze')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header view={view} setView={setView} status={status} />

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
        {view === 'history'  && <HistoryPage  onLoad={handleResult} />}
      </main>
    </div>
  )
}
