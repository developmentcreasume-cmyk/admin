import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '../components/Badge.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Modal from '../components/Modal.jsx'
import { api } from '../services/api.js'

// Creators land here the moment their Creasume Score raw points hit the 500
// benchmark. The two biggest levers (brand inquiries ×6, accepted deals ×10) can
// be faked, so nothing is auto-rewarded — verify the counts below look genuine,
// then Approve to grant the coupon, or Reject to dismiss.
const FILTERS = [
  { key: 'pending_review', label: 'Pending review' },
  { key: 'rewarded', label: 'Rewarded' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
]

const STATUS = {
  pending_review: { tone: 'amber', label: 'Pending review' },
  rewarded: { tone: 'green', label: 'Rewarded' },
  rejected: { tone: 'neutral', label: 'Rejected' },
}

export default function Benchmark() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('pending_review')
  const [busyId, setBusyId] = useState('')
  const [reward, setReward] = useState({ brandName: '', couponCode: '', discountPercent: '', brandWebsite: '' })
  // Row + action awaiting confirmation: { action: 'approve'|'reject', row } | null.
  const [confirm, setConfirm] = useState(null)

  function load() {
    setLoading(true)
    api
      .benchmarkList({ status: filter })
      .then((res) => setRows(res.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filter])

  async function doApprove(row) {
    const discountPercent = Number(reward.discountPercent)
    if (!reward.brandName.trim() || !reward.couponCode.trim() || !reward.brandWebsite.trim()) {
      setError('Brand name, coupon code and brand website are required.')
      return
    }
    if (!Number.isFinite(discountPercent) || discountPercent < 1 || discountPercent > 100) {
      setError('Discount percent must be between 1 and 100.')
      return
    }
    setBusyId(row._id)
    setError('')
    try {
      const res = await api.approveBenchmark(row._id, { ...reward, discountPercent })
      setRows((prev) => prev.map((r) =>
        r._id === row._id ? {
          ...r,
          benchmarkStatus: 'rewarded',
          benchmarkCouponCode: res.couponCode,
          benchmarkBrandName: res.brandName,
          benchmarkBrandWebsite: res.brandWebsite,
          benchmarkDiscountPercent: res.discountPercent,
        } : r
      ))
      setConfirm(null)
      setReward({ brandName: '', couponCode: '', discountPercent: '', brandWebsite: '' })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId('')
    }
  }

  async function doReject(row) {
    setBusyId(row._id)
    try {
      await api.rejectBenchmark(row._id)
      setRows((prev) => prev.map((r) =>
        r._id === row._id ? { ...r, benchmarkStatus: 'rejected' } : r
      ))
      setConfirm(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId('')
    }
  }

  const pendingCount = rows.filter((r) => r.benchmarkStatus === 'pending_review').length

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Benchmark rewards</h1>
          <p>Creators who hit the 500 Creasume Score benchmark. Verify their inquiries &amp; deals are real before rewarding.</p>
        </div>
      </div>

      {error && <div className="badge badge-red" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="row items-center gap-8 flex-wrap" style={{ marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`btn btn-sm${filter === f.key ? ' btn-primary' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key === 'pending_review' && filter === 'pending_review' && pendingCount > 0 ? ` (${pendingCount})` : ''}
          </button>
        ))}
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Creator</th>
              <th>Raw points</th>
              <th>Inquiries (×6)</th>
              <th>Accepted (×10)</th>
              <th>Hit on</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const st = STATUS[r.benchmarkStatus] || { tone: 'neutral', label: r.benchmarkStatus }
              return (
                <tr key={r._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/creators/${r._id}`)}>
                  <td>
                    <div className="fw-600">{r.name || '—'}</div>
                    <div className="text-xs muted">{r.username ? `@${r.username}` : ''}</div>
                  </td>
                  <td><span className="fw-600">{r.benchmarkRawPoints}</span><span className="faint"> / 500</span></td>
                  <td>{r.totalInquiries}</td>
                  <td>{r.acceptedInquiries}</td>
                  <td className="muted">{r.benchmarkHitAt ? new Date(r.benchmarkHitAt).toLocaleDateString() : '—'}</td>
                  <td>
                    <Badge tone={st.tone}>{st.label}</Badge>
                    {r.benchmarkStatus === 'rewarded' && r.benchmarkCouponCode && (
                      <div className="text-xs muted" style={{ marginTop: 4 }}>
                        {r.benchmarkBrandName || 'Partner brand'} · {r.benchmarkDiscountPercent ? `${r.benchmarkDiscountPercent}% · ` : ''}<span style={{ letterSpacing: 0.5 }}>{r.benchmarkCouponCode}</span>
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    {r.benchmarkStatus === 'pending_review' ? (
                      <div className="row items-center gap-8" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm" onClick={() => setConfirm({ action: 'reject', row: r })} disabled={busyId === r._id}>Reject</button>
                        <button className="btn btn-sm btn-primary" onClick={() => { setReward({ brandName: '', couponCode: '', discountPercent: '', brandWebsite: '' }); setConfirm({ action: 'approve', row: r }) }} disabled={busyId === r._id}>
                          {busyId === r._id ? '…' : 'Approve'}
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-sm" onClick={() => navigate(`/creators/${r._id}`)}>View</button>
                    )}
                  </td>
                </tr>
              )
            })}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7}><div className="empty">No creators in this state.</div></td></tr>
            )}
            {loading && (
              <tr><td colSpan={7}><div className="empty">Loading…</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Partner-brand reward form. Admin enters the exact coupon supplied by the brand. */}
      <Modal
        open={confirm?.action === 'approve'}
        title={`Reward ${confirm?.row?.name || confirm?.row?.username || 'this creator'}`}
        onClose={() => { if (!busyId) setConfirm(null) }}
        maxWidth={520}
        footer={
          <>
            <button className="btn btn-sm" onClick={() => setConfirm(null)} disabled={!!busyId}>Cancel</button>
            <button className="btn btn-sm btn-primary" onClick={() => doApprove(confirm.row)} disabled={!!busyId}>
              {busyId ? 'Saving…' : 'Approve & give coupon'}
            </button>
          </>
        }
      >
        <p className="text-sm muted" style={{ marginTop: 0, lineHeight: 1.6 }}>
          Verify the creator&apos;s inquiries and accepted deals, then enter the coupon provided by your partner brand. The creator will redeem it on that brand&apos;s website.
        </p>
        <div className="field">
          <label>Brand name</label>
          <input className="input" value={reward.brandName} onChange={(e) => setReward({ ...reward, brandName: e.target.value })} placeholder="e.g. Myntra" />
        </div>
        <div className="row gap-8" style={{ alignItems: 'flex-start' }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Coupon code</label>
            <input className="input" value={reward.couponCode} onChange={(e) => setReward({ ...reward, couponCode: e.target.value.toUpperCase() })} placeholder="e.g. CREA20" />
          </div>
          <div className="field" style={{ width: 150 }}>
            <label>Discount %</label>
            <input className="input" type="number" min="1" max="100" value={reward.discountPercent} onChange={(e) => setReward({ ...reward, discountPercent: e.target.value })} placeholder="20" />
          </div>
        </div>
        <div className="field mb-0">
          <label>Brand website</label>
          <input className="input" type="url" value={reward.brandWebsite} onChange={(e) => setReward({ ...reward, brandWebsite: e.target.value })} placeholder="https://brand.com" />
        </div>
      </Modal>
      <ConfirmDialog
        open={confirm?.action === 'reject'}
        title="Reject this milestone?"
        message="No coupon will be granted. Use this if the inquiries or accepted deals look faked."
        confirmLabel="Reject milestone"
        tone="danger"
        busy={!!confirm && busyId === confirm.row._id}
        onConfirm={() => doReject(confirm.row)}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}
