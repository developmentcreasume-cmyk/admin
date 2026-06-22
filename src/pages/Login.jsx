import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login, isAuthed } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthed) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await login(email, password)
    setLoading(false)
    if (res.ok) {
      navigate(location.state?.from || '/', { replace: true })
    } else {
      setError(res.error)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        background: '#fff',
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div className="col items-center" style={{ marginBottom: 26 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'var(--accent)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: 22,
              marginBottom: 14,
            }}
          >
            C
          </div>
          <h1 style={{ margin: 0, fontSize: 20 }}>Creasume Admin</h1>
          <p className="muted text-sm" style={{ margin: '6px 0 0' }}>
            Sign in to the team dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card card-pad">
          <div className="field">
            <label>Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@creasume.com"
              autoFocus
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="badge badge-red" style={{ width: '100%', justifyContent: 'center', marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs faint" style={{ textAlign: 'center', marginTop: 18 }}>
          No public signup — accounts created internally only.
        </p>
      </div>
    </div>
  )
}
