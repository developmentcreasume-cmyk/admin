import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard.jsx'
import { api } from '../services/api.js'

const ACTIVITY_ICON = {
  waitlist: '☰',
  card: '◎',
  subscription: '✓',
  enquiry: '✉',
}

// Render a stored timestamp as a relative "x ago" string.
function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.round(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function Overview() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.overview(), api.activity(8)])
      .then(([o, a]) => {
        setStats(o.stats)
        setActivity(a.activity || [])
      })
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Overview</h1>
          <p>A snapshot of the Creasume platform.</p>
        </div>
      </div>

      {error && <div className="badge badge-red" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Summary stats */}
      <div className="row flex-wrap gap-16">
        <StatCard label="Waitlist sign-ups" value={stats?.waitlist ?? '—'} hint={stats ? `${stats.foundingWaitlist} founding` : ''} />
        <StatCard label="Creators" value={stats?.creators ?? '—'} />
        <StatCard label="Live cards" value={stats?.liveCards ?? '—'} hint="Public Influence Cards" />
        <StatCard label="Enquiries" value={stats?.enquiries ?? '—'} hint={stats ? `${stats.newEnquiries} new` : ''} />
        <StatCard label="Active subs" value={stats?.activeSubs ?? '—'} />
      </div>

      <div className="row gap-16 flex-wrap mt-24" style={{ alignItems: 'flex-start' }}>
        {/* Recent activity */}
        <div className="card flex-1" style={{ minWidth: 320 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>Recent activity</h3>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {activity.map((a) => (
              <li
                key={a.id}
                className="row items-center gap-12"
                style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)' }}
              >
                <span className="avatar" style={{ width: 30, height: 30, fontSize: 13 }}>
                  {ACTIVITY_ICON[a.type] || '•'}
                </span>
                <span className="flex-1 text-sm">{a.text}</span>
                <span className="text-xs faint">{timeAgo(a.time)}</span>
              </li>
            ))}
            {activity.length === 0 && (
              <li style={{ padding: '13px 20px' }}>
                <span className="text-sm faint">No recent activity yet.</span>
              </li>
            )}
          </ul>
        </div>

        {/* Quick actions */}
        <div className="card card-pad" style={{ width: 280 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>Quick actions</h3>
          <div className="col gap-8">
            <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/waitlist')}>
              ★ Mark as Founding Creator
            </button>
            <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/creators')}>
              + Add New Creator
            </button>
            <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/creators')}>
              ◎ View All Live Cards
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
