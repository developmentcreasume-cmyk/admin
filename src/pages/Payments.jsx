import { useEffect, useState } from 'react'
import Badge from '../components/Badge.jsx'
import StatCard from '../components/StatCard.jsx'
import { api } from '../services/api.js'

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const date = (d) => (d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
const daysLeft = (d) => (d ? Math.ceil((new Date(d) - Date.now()) / 86400000) : null)

// Payment status → badge colour.
const PAY_TONE = { paid: 'green', active: 'green', charged: 'green', created: 'neutral', failed: 'red', cancelled: 'amber', expired: 'neutral', refunded: 'amber' }
const SUB_TONE = { active: 'green', canceled: 'amber', past_due: 'red', trial: 'blue', inactive: 'neutral' }

export default function Payments() {
  const [overview, setOverview] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all') // all | success | failed

  useEffect(() => {
    Promise.all([api.billingOverview().catch(() => null), api.payments(200).catch(() => null)])
      .then(([o, p]) => {
        if (o) setOverview(o)
        if (p) setPayments(p.payments || [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = payments.filter((p) => {
    if (tab === 'success') return ['paid', 'active', 'charged'].includes(p.status)
    if (tab === 'failed') return ['failed', 'cancelled', 'expired'].includes(p.status)
    return true
  })

  const rev = overview?.revenue
  const subs = overview?.subscribers
  const expiring = overview?.expiring || []

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Payments</h1>
          <p>Revenue, subscriptions & renewals across all creators.</p>
        </div>
      </div>

      {error && <div className="badge badge-red" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Summary stats */}
      <div className="row flex-wrap gap-16">
        <StatCard label="Total revenue" value={money(rev?.totalInr)} hint={`${rev?.paidCount ?? 0} successful payments`} />
        <StatCard label="This month" value={money(rev?.thisMonthInr)} />
        <StatCard label="Active subscribers" value={subs?.active ?? '—'} />
        <StatCard label="Expiring ≤ 7 days" value={subs?.expiringIn7Days ?? '—'} hint={`${subs?.expiringIn30Days ?? 0} within 30 days`} />
        <StatCard label="Payment failed" value={subs?.pastDue ?? '—'} hint="need retry" />
      </div>

      {/* Expiring / renewing soon */}
      <div className="card mt-24" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>Expiring / renewing soon (next 30 days)</h3>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Ends / renews</th>
                <th style={{ textAlign: 'right' }}>Days left</th>
              </tr>
            </thead>
            <tbody>
              {expiring.map((c) => {
                const dl = daysLeft(c.subscriptionCurrentEnd)
                return (
                  <tr key={c._id}>
                    <td>
                      <div className="fw-600">{c.name || c.username}</div>
                      <div className="text-xs muted">@{c.username}</div>
                    </td>
                    <td><Badge tone="neutral">{c.planTier}</Badge></td>
                    <td><Badge tone={SUB_TONE[c.subscriptionStatus] || 'neutral'}>{c.subscriptionStatus === 'canceled' ? 'Cancels' : 'Renews'}</Badge></td>
                    <td className="muted">{date(c.subscriptionCurrentEnd)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={dl != null && dl <= 7 ? 'fw-600' : 'muted'} style={dl != null && dl <= 7 ? { color: 'var(--danger, #e5484d)' } : undefined}>
                        {dl != null ? `${dl}d` : '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {expiring.length === 0 && (
                <tr><td colSpan={5}><div className="empty">Nothing expiring in the next 30 days.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All payments */}
      <div className="row items-center gap-8 mt-24" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>All transactions</h3>
        <div className="row gap-8" style={{ marginLeft: 'auto' }}>
          {['all', 'success', 'failed'].map((t) => (
            <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : ''}`} onClick={() => setTab(t)}>
              {t === 'all' ? 'All' : t === 'success' ? 'Successful' : 'Failed'}
            </button>
          ))}
        </div>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Creator</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p._id}>
                <td>
                  <div className="fw-600">{p.creatorId?.name || p.creatorId?.username || '—'}</div>
                  {p.creatorId?.username && <div className="text-xs muted">@{p.creatorId.username}</div>}
                </td>
                <td>{p.planName || p.planId?.name || '—'}</td>
                <td className="fw-600">{money((p.amountPaise || 0) / 100)}</td>
                <td><Badge tone="neutral">{p.billingType === 'recurring' ? 'Recurring' : 'One-time'}</Badge></td>
                <td className="muted text-sm">{p.method || '—'}</td>
                <td><Badge tone={PAY_TONE[p.status] || 'neutral'}>{p.status}</Badge></td>
                <td className="muted text-sm">{date(p.createdAt)}</td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7}><div className="empty">No transactions yet.</div></td></tr>
            )}
            {loading && (
              <tr><td colSpan={7}><div className="empty">Loading…</div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
