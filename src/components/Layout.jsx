import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

/**
 * Authenticated app shell.
 * Desktop: fixed sidebar + sticky topbar + scrolling content.
 * Mobile (≤768px): sidebar becomes a slide-in drawer toggled from the topbar.
 */
export default function Layout() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div style={{ minHeight: '100%' }}>
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="app-shell">
        <Topbar onMenu={() => setNavOpen(true)} />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
