import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

/** Authenticated app shell: fixed sidebar + sticky topbar + scrolling content. */
export default function Layout() {
  return (
    <div style={{ minHeight: '100%' }}>
      <Sidebar />
      <div style={{ marginLeft: 'var(--sidebar-w)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <main style={{ padding: '28px', flex: 1, maxWidth: 1180, width: '100%' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
