import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Overview', icon: '◧', end: true },
  { to: '/creators', label: 'Creators', icon: '◎' },
  { to: '/enquiries', label: 'Enquiries', icon: '✉' },
  { to: '/payments', label: 'Payments', icon: '◈' },
  { to: '/benchmark', label: 'Benchmark', icon: '✦' },
  { to: '/referrals', label: 'Refer & Earn', icon: '❖' },
  { to: '/landing', label: 'Landing page', icon: '▤' },
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

      <div className="text-xs faint" style={{ padding: '16px 16px 6px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Menu
      </div>
      <nav style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-ico" aria-hidden>{item.icon}</span>
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
