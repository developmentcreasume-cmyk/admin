import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar.jsx'
import Badge, { FoundingBadge, SubscriptionBadge, BroughtByBadge } from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import { api } from '../services/api.js'

const PLANS = ['All', 'Starter', 'Core', 'Campaign']

const SHOW_BRAND_ROSTER_UI = false

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
  const [brands, setBrands] = useState([])
  const [brandFilter, setBrandFilter] = useState('All')

  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: '', instagramHandle: '', email: '', plan: 'Starter' })
  const [saving, setSaving] = useState(false)

  // Row selection for the "Generate shareable page" flow — cleared whenever
  // any filter changes so a selection can't reference a now-hidden row.
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [existingRoster, setExistingRoster] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [rosterModalOpen, setRosterModalOpen] = useState(false)
  const [rosterResult, setRosterResult] = useState(null)
  const [linkCopied, setLinkCopied] = useState(false)

  function load() {
    setLoading(true)
    setSelectedIds(new Set())
    api
      .creators({ search: query, plan, foundingOnly, brand: brandFilter })
      .then((res) => setRows(res.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [query, plan, foundingOnly, brandFilter])

  useEffect(() => {
    api.creatorBrands().then((r) => setBrands(r.brands || [])).catch(() => {})
  }, [])

  // Does the currently-filtered brand already have a live shareable page?
  useEffect(() => {
    if (brandFilter === 'All') { setExistingRoster(null); return }
    let alive = true
    api.rosterByBrand(brandFilter).then((r) => { if (alive) setExistingRoster(r.roster) }).catch(() => { if (alive) setExistingRoster(null) })
    return () => { alive = false }
  }, [brandFilter])

  const liveCards = useMemo(() => rows.filter((r) => r.cardActive).length, [rows])

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r._id))))
  }

  async function generateRosterLink() {
    setGenerating(true)
    try {
      const res = await api.generateRoster(brandFilter, Array.from(selectedIds))
      setRosterResult(res.roster)
      setExistingRoster(res.roster)
      setLinkCopied(false)
      setRosterModalOpen(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

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
        {SHOW_BRAND_ROSTER_UI && (
          <select className="select" style={{ width: 'auto' }} value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
            <option value="All">Managed by Brand</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        )}
      </div>

      {SHOW_BRAND_ROSTER_UI && brandFilter !== 'All' && (
        <div className="row items-center gap-12 flex-wrap" style={{ marginBottom: 16 }}>
          {existingRoster && (
            <span className="text-sm muted">
              <strong>{existingRoster.brandName}</strong> — live link:{' '}
              <a href={existingRoster.url} target="_blank" rel="noreferrer">{existingRoster.url}</a>
              {' '}({existingRoster.creatorCount} creators)
            </span>
          )}
          <button
            className="btn btn-primary"
            disabled={selectedIds.size === 0 || generating}
            onClick={generateRosterLink}
          >
            {generating ? 'Generating…' : `${existingRoster ? 'Update' : 'Generate'} shareable page (${selectedIds.size})`}
          </button>
        </div>
      )}

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              {SHOW_BRAND_ROSTER_UI && (
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selectedIds.size === rows.length}
                    onChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
              )}
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
                {SHOW_BRAND_ROSTER_UI && (
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(r._id)}
                      onChange={() => toggleSelected(r._id)}
                      aria-label={`Select ${r.name || r.username}`}
                    />
                  </td>
                )}
                <td>
                  <div className="row items-center gap-12">
                    <span className="avatar">{initials(r.name || r.username)}</span>
                    <div>
                      <div className="fw-600">{r.name || r.username}</div>
                      <div className="text-xs muted">{r.username ? `@${r.username}` : '—'}</div>
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
                <td>
                  {r.broughtByBrand?.name ? (
                    <BroughtByBadge name={r.broughtByBrand.name} color={r.broughtByBrand.color} />
                  ) : r.isFoundingCreator ? (
                    <FoundingBadge />
                  ) : (
                    <span className="faint">—</span>
                  )}
                </td>
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
                <td colSpan={SHOW_BRAND_ROSTER_UI ? 9 : 8}>
                  <div className="empty">No creators match your filters.</div>
                </td>
              </tr>
            )}
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={`sk-${i}`} className="skeleton-row">
                {SHOW_BRAND_ROSTER_UI && (
                  <td><span className="skeleton" style={{ width: 16, height: 16, display: 'inline-block' }} /></td>
                )}
                <td>
                  <div className="row items-center gap-12">
                    <span className="skeleton skeleton-circle" style={{ width: 36, height: 36 }} />
                    <div>
                      <span className="skeleton skeleton-text" style={{ width: 120, display: 'block' }} />
                      <span className="skeleton skeleton-text" style={{ width: 80, display: 'block', marginTop: 6, height: 10 }} />
                    </div>
                  </div>
                </td>
                <td><span className="skeleton skeleton-text" style={{ width: 96, height: 20, borderRadius: 999 }} /></td>
                <td><span className="skeleton skeleton-text" style={{ width: 60, height: 20, borderRadius: 999 }} /></td>
                <td><span className="skeleton skeleton-text" style={{ width: 70, height: 20, borderRadius: 999 }} /></td>
                <td><span className="skeleton skeleton-text" style={{ width: 44, height: 20, borderRadius: 999 }} /></td>
                <td><span className="skeleton skeleton-text" style={{ width: 70, height: 20, borderRadius: 999 }} /></td>
                <td><span className="skeleton skeleton-text" style={{ width: 130 }} /></td>
                <td style={{ textAlign: 'right' }}>
                  <span className="skeleton" style={{ width: 80, height: 28, borderRadius: 8, display: 'inline-block' }} />
                </td>
              </tr>
            ))}
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

      <Modal
        open={rosterModalOpen}
        title="Shareable roster link"
        onClose={() => setRosterModalOpen(false)}
        footer={
          <button className="btn btn-primary" onClick={() => setRosterModalOpen(false)}>
            Done
          </button>
        }
      >
        <p className="text-sm muted">
          {rosterResult?.brandName} — {rosterResult?.creatorCount} creator{rosterResult?.creatorCount === 1 ? '' : 's'}
        </p>
        <div className="row items-center gap-8" style={{ marginTop: 8 }}>
          <input className="input" readOnly value={rosterResult?.url || ''} onFocus={(e) => e.target.select()} />
          <button
            className="btn btn-sm"
            onClick={() => {
              navigator.clipboard.writeText(rosterResult?.url || '')
              setLinkCopied(true)
            }}
          >
            {linkCopied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
