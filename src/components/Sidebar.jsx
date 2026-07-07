import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Overview', icon: '◧', end: true },
  { to: '/creators', label: 'Creators', icon: '◎' },
  { to: '/enquiries', label: 'Enquiries', icon: '✉' },
  { to: '/plans', label: 'Plans', icon: '₹' },
  { to: '/payments', label: 'Payments', icon: '◈' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Sidebar({ open = false, onClose }) {
  return (
    <>
      {/* Backdrop (mobile only, when drawer is open) */}
      <div
        className={`sidebar-backdrop${open ? ' is-open' : ''}`}
        onClick={onClose}
        aria-hidden
      />
      <aside className={`sidebar${open ? ' is-open' : ''}`}>
      <div
        className="row items-center gap-8"
        style={{ height: 'var(--topbar-h)', padding: '0 20px', borderBottom: '1px solid var(--border)' }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: 'var(--accent)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          C
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>Creasume</span>
        <span className="badge badge-neutral" style={{ marginLeft: 'auto' }}>
          Admin
        </span>
      </div>

      <nav style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13.5,
              fontWeight: 500,
              color: isActive ? 'var(--text)' : 'var(--text-soft)',
              background: isActive ? 'var(--accent-soft)' : 'transparent',
            })}
          >
            <span style={{ width: 16, textAlign: 'center', fontSize: 14 }} aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: 16, borderTop: '1px solid var(--border)' }}>
        <p className="text-xs faint" style={{ margin: 0, lineHeight: 1.5 }}>
          Creasume Admin v0.1
          <br />
          Private — Creasume team only
        </p>
      </div>
      </aside>
    </>
  )
}
