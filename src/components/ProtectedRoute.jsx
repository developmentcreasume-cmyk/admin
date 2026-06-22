import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/** Wraps routes that require an authenticated admin. */
export default function ProtectedRoute({ children }) {
  const { isAuthed, ready } = useAuth()
  const location = useLocation()

  // Wait until the stored token has been validated before deciding.
  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <span className="muted text-sm">Loading…</span>
      </div>
    )
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}
