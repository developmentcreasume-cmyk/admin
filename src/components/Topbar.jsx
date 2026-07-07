import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// First path segment → page title shown in the topbar.
const TITLES = {
  '': 'Overview',
  creators: 'Creators',
  enquiries: 'Enquiries',
  plans: 'Plans',
  payments: 'Payments',
  settings: 'Settings',
}

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const segment = location.pathname.split('/')[1] || ''
  const title = TITLES[segment] || 'Creasume'

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
    <header className="topbar">
      {/* Hamburger — visible only on mobile (CSS-controlled) */}
      <button className="topbar-menu-btn" onClick={onMenu} aria-label="Open menu">
        ☰
      </button>

      <span className="topbar-title">{title}</span>

      <div style={{ flex: 1 }} />

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="row items-center gap-8 topbar-user"
        >
          <span className="avatar">{initials}</span>
          <span className="text-sm fw-600 topbar-username" style={{ color: 'var(--text)' }}>
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
