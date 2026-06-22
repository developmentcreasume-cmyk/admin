import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar.jsx'
import Badge, { FoundingBadge, SubscriptionBadge } from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import { api } from '../services/api.js'

const PLANS = ['All', 'Starter', 'Core', 'Campaign']

// Map backend subscriptionStatus → the label SubscriptionBadge expects.
const SUB_LABEL = {
  active: 'Active',
  trial: 'Trial',
  inactive: 'Inactive',
  past_due: 'Past due',
  canceled: 'Canceled',
}

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('') || '?'
}

export default function Creators() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [plan, setPlan] = useState('All')
  const [foundingOnly, setFoundingOnly] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: '', instagramHandle: '', email: '', plan: 'Starter' })
  const [saving, setSaving] = useState(false)

  function load() {
    setLoading(true)
    api
      .creators({ search: query, plan, foundingOnly })
      .then((res) => setRows(res.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [query, plan, foundingOnly])

  const liveCards = useMemo(() => rows.filter((r) => r.cardActive).length, [rows])

  async function createCreator() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await api.addCreator(form)
      setAddOpen(false)
      setForm({ name: '', instagramHandle: '', email: '', plan: 'Starter' })
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Creators</h1>
          <p>{rows.length} creators · {liveCards} live cards</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
          + Add New Creator
        </button>
      </div>

      {error && <div className="badge badge-red" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="row items-center gap-12 flex-wrap" style={{ marginBottom: 16 }}>
        <SearchBar value={query} onChange={setQuery} placeholder="Search name or handle…" />
        <select className="select" style={{ width: 'auto' }} value={plan} onChange={(e) => setPlan(e.target.value)}>
          {PLANS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <label className="row items-center gap-8 text-sm muted" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={foundingOnly} onChange={(e) => setFoundingOnly(e.target.checked)} />
          Founding only
        </label>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Creator</th>
              <th>Instagram</th>
              <th>Plan</th>
              <th>Founding</th>
              <th>Card</th>
              <th>Subscription</th>
              <th>Public URL</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/creators/${r._id}`)}>
                <td>
                  <div className="row items-center gap-12">
                    <span className="avatar">{initials(r.name || r.username)}</span>
                    <div>
                      <div className="fw-600">{r.name || r.username}</div>
                      <div className="text-xs muted">@{r.username}</div>
                    </div>
                  </div>
                </td>
                <td>
                  {r.instagramConnected ? (
                    <div>
                      <Badge tone="green">● Connected</Badge>
                      {r.followersCount != null && (
                        <div className="text-xs muted mt-4">
                          {Number(r.followersCount).toLocaleString()} followers
                        </div>
                      )}
                    </div>
                  ) : (
                    <Badge tone="neutral">Not connected</Badge>
                  )}
                </td>
                <td>
                  <Badge tone="neutral">{(r.planTier || 'free').replace(/^\w/, (c) => c.toUpperCase())}</Badge>
                </td>
                <td>{r.isFoundingCreator ? <FoundingBadge /> : <span className="faint">—</span>}</td>
                <td>{r.cardActive ? <Badge tone="green">Live</Badge> : <Badge tone="neutral">Off</Badge>}</td>
                <td>
                  <SubscriptionBadge status={SUB_LABEL[r.subscriptionStatus] || 'Inactive'} />
                </td>
                <td className="muted text-sm">{r.slug ? `creasume.com/${r.slug}` : <span className="faint">—</span>}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/creators/${r._id}`)
                    }}
                  >
                    Manage →
                  </button>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="empty">No creators match your filters.</div>
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={8}>
                  <div className="empty">Loading…</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={addOpen}
        title="Add New Creator"
        onClose={() => setAddOpen(false)}
        footer={
          <>
            <button className="btn" onClick={() => setAddOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={createCreator} disabled={saving}>
              {saving ? 'Creating…' : 'Create creator'}
            </button>
          </>
        }
      >
        <div className="field">
          <label>Full name</label>
          <input className="input" placeholder="e.g. Riya Sharma" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>Instagram handle</label>
          <input className="input" placeholder="@handle" value={form.instagramHandle} onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })} />
        </div>
        <div className="field">
          <label>Email</label>
          <input className="input" type="email" placeholder="creator@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field mb-0">
          <label>Plan tier</label>
          <select className="select" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
            <option>Starter</option>
            <option>Core</option>
            <option>Campaign</option>
          </select>
        </div>
      </Modal>
    </div>
  )
}
