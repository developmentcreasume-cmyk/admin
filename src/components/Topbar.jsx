import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const initials = (user?.name || 'A')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')

  return (
    <header
      style={{
        height: 'var(--topbar-h)',
        borderBottom: '1px solid var(--border)',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="row items-center gap-8"
          style={{ border: 'none', background: 'none', padding: 4 }}
        >
          <span className="avatar">{initials}</span>
          <span className="text-sm fw-600" style={{ color: 'var(--text)' }}>
            {user?.name}
          </span>
          <span className="faint" style={{ fontSize: 10 }}>▾</span>
        </button>

        {open && (
          <>
            <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
            <div
              className="card"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: 220,
                zIndex: 40,
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              }}
            >
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                <div className="text-sm fw-600">{user?.name}</div>
                <div className="text-xs muted">{user?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  background: 'none',
                  padding: '11px 14px',
                  fontSize: 13,
                  color: 'var(--red)',
                }}
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
