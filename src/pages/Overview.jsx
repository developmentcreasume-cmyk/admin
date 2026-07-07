import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard.jsx'
import { BarChart, BarList } from '../components/MiniChart.jsx'
import { api } from '../services/api.js'

// Small section wrapper: a titled card with padded body.
function Panel({ title, subtitle, children, style }) {
  return (
    <div className="card card-pad" style={style}>
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>{title}</h3>
        {subtitle && <p className="text-xs faint" style={{ margin: '3px 0 0' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

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
  const [charts, setCharts] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.overview(), api.activity(8), api.charts()])
      .then(([o, a, c]) => {
        setStats(o.stats)
        setActivity(a.activity || [])
        setCharts(c)
      })
      .catch((e) => setError(e.message))
  }, [])

  const creatorSeries = (charts?.series || []).map((d) => ({ date: d.date, value: d.creators }))
  const enquirySeries = (charts?.series || []).map((d) => ({ date: d.date, value: d.enquiries }))

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
        <StatCard label="Creators" value={stats?.creators ?? '—'} hint="On the platform" />
        <StatCard label="Live cards" value={stats?.liveCards ?? '—'} hint="Public Influence Cards" />
        <StatCard label="Enquiries" value={stats?.enquiries ?? '—'} hint={stats ? `${stats.newEnquiries} new` : ''} />
        <StatCard label="Active subs" value={stats?.activeSubs ?? '—'} hint="Paying creators" />
        <StatCard label="Waitlist" value={stats?.waitlist ?? '—'} hint={stats ? `${stats.foundingWaitlist} founding` : ''} />
      </div>

      {/* Trends + breakdown */}
      <div
        className="mt-24"
        style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', alignItems: 'start' }}
      >
        <Panel title="New creators" subtitle="Last 14 days">
          <BarChart data={creatorSeries} color="var(--accent)" />
        </Panel>
        <Panel title="New enquiries" subtitle="Last 14 days">
          <BarChart data={enquirySeries} color="var(--blue)" />
        </Panel>
        <Panel title="Creators by plan" subtitle="Current distribution">
          <BarList data={charts?.plans || []} color="var(--accent)" />
        </Panel>
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

        {/* Right rail: quick actions + subscription breakdown */}
        <div className="col gap-16" style={{ width: 280 }}>
          <div className="card card-pad">
            <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>Quick actions</h3>
            <div className="col gap-8">
              <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/creators')}>
                + Add New Creator
              </button>
              <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/creators')}>
                ◎ View All Live Cards
              </button>
              <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/enquiries')}>
                ✉ Review Enquiries
              </button>
            </div>
          </div>

          <Panel title="Subscriptions" subtitle="By status">
            <BarList data={charts?.subs || []} color="var(--blue)" />
          </Panel>
        </div>
      </div>
    </div>
  )
}
