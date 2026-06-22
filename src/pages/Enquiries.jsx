import { useEffect, useState } from 'react'
import SearchBar from '../components/SearchBar.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import { api } from '../services/api.js'

const STATUSES = ['All', 'Pending', 'Reviewed', 'Actioned']
const STATUS_TONE = { pending: 'blue', reviewed: 'amber', actioned: 'green' }
const cap = (s = '') => s.replace(/^\w/, (c) => c.toUpperCase())

export default function Enquiries() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [active, setActive] = useState(null) // enquiry shown in detail modal

  function load() {
    setLoading(true)
    api
      .enquiries({ search: query, status })
      .then((res) => setRows(res.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [query, status])

  async function setStatusFor(id, newStatus) {
    try {
      const res = await api.setEnquiryStatus(id, newStatus)
      setRows((prev) => prev.map((r) => (r._id === id ? res.enquiry : r)))
      setActive((a) => (a && a._id === id ? res.enquiry : a))
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Enquiries</h1>
          <p>Submitted via “Work With Me” forms across all creator pages.</p>
        </div>
      </div>

      {error && <div className="badge badge-red" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="row items-center gap-12 flex-wrap" style={{ marginBottom: 16 }}>
        <SearchBar value={query} onChange={setQuery} placeholder="Search brand, creator, type…" />
        <select className="select" style={{ width: 'auto' }} value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Campaign type</th>
              <th>Creator contacted</th>
              <th>Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} style={{ cursor: 'pointer' }} onClick={() => setActive(r)}>
                <td>
                  <div className="fw-600">{r.brandName || '—'}</div>
                  <div className="text-xs muted">{r.email}</div>
                </td>
                <td>{r.campaignType ? <Badge tone="neutral">{r.campaignType}</Badge> : <span className="faint">—</span>}</td>
                <td>
                  <div className="text-sm">{r.creatorId?.name || '—'}</div>
                  <div className="text-xs muted">{r.creatorId?.username ? `@${r.creatorId.username}` : ''}</div>
                </td>
                <td className="muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td>
                  <Badge tone={STATUS_TONE[r.status] || 'neutral'}>{cap(r.status)}</Badge>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); setActive(r) }}>
                    View
                  </button>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty">No enquiries match your filters.</div>
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={6}>
                  <div className="empty">Loading…</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      <Modal
        open={!!active}
        title="Enquiry detail"
        onClose={() => setActive(null)}
        footer={
          active && (
            <>
              <button className="btn btn-sm" onClick={() => setStatusFor(active._id, 'reviewed')}>
                Mark Reviewed
              </button>
              <button className="btn btn-sm btn-primary" onClick={() => setStatusFor(active._id, 'actioned')}>
                Mark Actioned
              </button>
            </>
          )
        }
      >
        {active && (
          <div className="col gap-12">
            <DetailRow label="Brand" value={active.brandName || '—'} />
            <DetailRow label="Email" value={active.email || '—'} />
            <DetailRow label="Campaign type" value={active.campaignType || '—'} />
            <DetailRow label="Creator contacted" value={active.creatorId ? `${active.creatorId.name} (@${active.creatorId.username})` : '—'} />
            <DetailRow label="Date" value={new Date(active.createdAt).toLocaleString()} />
            <DetailRow label="Status" value={<Badge tone={STATUS_TONE[active.status] || 'neutral'}>{cap(active.status)}</Badge>} />
            <div>
              <div className="text-xs fw-600 muted" style={{ marginBottom: 6 }}>Brief</div>
              <div className="card card-pad text-sm" style={{ background: 'var(--surface-alt)' }}>
                {active.brief || '—'}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="row items-center justify-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
      <span className="text-sm muted">{label}</span>
      <span className="text-sm fw-600">{value}</span>
    </div>
  )
}
