import { useState } from 'react'
import { login, register } from '../services/api.js'
import styles from './AuthControl.module.css'

export default function AuthControl({ user, onAuth }) {
  const [open, setOpen]   = useState(false)
  const [mode, setMode]   = useState('login')   // login | register
  const [email, setEmail] = useState('')
  const [pw, setPw]       = useState('')
  const [err, setErr]     = useState(null)
  const [busy, setBusy]   = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr(null)
    try {
      const fn = mode === 'login' ? login : register
      const { access_token, email: em } = await fn(email.trim(), pw)
      try { localStorage.setItem('geo_token', access_token) } catch { /* ignore */ }
      onAuth(em)
      setOpen(false); setPw('')
    } catch (e2) {
      setErr(e2?.response?.data?.detail || e2.message)
    } finally { setBusy(false) }
  }

  function logout() {
    try { localStorage.removeItem('geo_token') } catch { /* ignore */ }
    onAuth(null)
  }

  if (user) {
    return (
      <div className={styles.wrap}>
        <span className={styles.email} title={user}>{user}</span>
        <button className={styles.btn} onClick={logout}>Logout</button>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <button className={styles.btn} onClick={() => setOpen(true)}>Sign in</button>
      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <form className={styles.modal} onClick={e => e.stopPropagation()} onSubmit={submit}>
            <p className={styles.title}>{mode === 'login' ? 'Sign in' : 'Create account'}</p>
            <p className={styles.sub}>Private history & monitors. Optional — the app works without it.</p>
            <input className={styles.input} type="email" placeholder="Email" value={email}
                   onChange={e => setEmail(e.target.value)} required autoFocus />
            <input className={styles.input} type="password" placeholder="Password (min 6 chars)" value={pw}
                   onChange={e => setPw(e.target.value)} required minLength={6} />
            {err && <div className={styles.err}>{err}</div>}
            <button className={styles.submit} type="submit" disabled={busy}>
              {busy ? '…' : mode === 'login' ? 'Sign in' : 'Register'}
            </button>
            <button type="button" className={styles.switch}
                    onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(null) }}>
              {mode === 'login' ? "No account? Register" : 'Have an account? Sign in'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
