import { useEffect, useState } from 'react'
import Badge from '../components/Badge.jsx'
import StatCard from '../components/StatCard.jsx'
import { api } from '../services/api.js'

const date = (d) => (d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

// The admin Refer & Earn dashboard: edit the program (on/off, the new-user
// discount %, and the referrer's reward-coupon %) plus the referral log. Both
// rewards are DISCOUNT COUPONS off a plan — no cash, no withdrawals. Saving
// writes through the same settings singleton the Settings page uses.
export default function Referrals() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Editable program controls (seeded from the loaded settings).
  const [enabled, setEnabled] = useState(true)
  const [discount, setDiscount] = useState(20)
  const [referrer, setReferrer] = useState(40)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null) // { text, error }

  const load = () => {
    api.referrals(200)
      .then((res) => {
        const r = res.referrals
        setData(r)
        setEnabled(Boolean(r.enabled))
        setDiscount(r.discountPercent ?? 20)
        setReferrer(r.commissionPercent ?? 40)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function saveSettings(e) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)
    try {
      const dpct = Math.min(100, Math.max(0, Math.round(Number(discount) || 0)))
      const rpct = Math.min(100, Math.max(0, Math.round(Number(referrer) || 0)))
      await api.updateSettings({
        referralEnabled: enabled,
        referralDiscountPercent: dpct,
        referralCommissionPercent: rpct,
      })
      setDiscount(dpct); setReferrer(rpct)
      setData((d) => (d ? { ...d, enabled, discountPercent: dpct, commissionPercent: rpct } : d))
      setSaveMsg({ text: 'Saved.' })
    } catch (err) {
      setSaveMsg({ text: err.message || 'Could not save.', error: true })
    } finally {
      setSaving(false)
    }
  }

  const rows = data?.rows || []
  const totals = data?.totals || {}

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Refer &amp; Earn</h1>
          <p>The friend gets a discount coupon; the referrer earns their own discount coupon when the friend pays. Set the rates and see who invited whom.</p>
        </div>
      </div>

      {error && <div className="badge badge-red" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Editable program controls */}
      <form className="card card-pad" onSubmit={saveSettings} style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Program settings</h3>

        <label className="row items-center gap-8" style={{ cursor: 'pointer', marginBottom: 16 }}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span className="text-sm">
            Referral program {enabled ? 'enabled' : 'paused'} — off stops crediting new referrals &amp; applying coupons
          </span>
        </label>

        <div className="row flex-wrap gap-16" style={{ marginBottom: 16 }}>
          <div>
            <label className="text-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              New-user discount (%)
            </label>
            <input
              className="input" type="number" min="0" max="100"
              value={discount}
              onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
              style={{ maxWidth: 160 }}
            />
            <div className="text-xs muted mt-8">Coupon the referred friend gets on their first plan.</div>
          </div>

          <div>
            <label className="text-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Referrer reward (%)
            </label>
            <input
              className="input" type="number" min="0" max="100"
              value={referrer}
              onChange={(e) => setReferrer(e.target.value === '' ? '' : Number(e.target.value))}
              style={{ maxWidth: 160 }}
            />
            <div className="text-xs muted mt-8">Coupon the referrer earns once their friend pays.</div>
          </div>
        </div>

        <div className="row items-center gap-8">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saveMsg && (
            <span className="text-sm" style={{ color: saveMsg.error ? 'var(--danger, #e5484d)' : 'var(--success, #30a46c)' }}>
              {saveMsg.text}
            </span>
          )}
        </div>
      </form>

      <div className="row flex-wrap gap-16">
        <StatCard
          label="Program"
          value={data ? (enabled ? 'Enabled' : 'Paused') : '—'}
          hint={data ? `${discount}% friend · ${referrer}% referrer` : ''}
        />
        <StatCard label="Total referrals" value={totals.total ?? '—'} hint="friends signed up via a link" />
        <StatCard label="Paid conversions" value={totals.conversions ?? '—'} hint="friends who bought a plan" />
        <StatCard label="Reward coupons earned" value={totals.rewardsEarned ?? '—'} hint="referrers who earned a coupon" />
      </div>

      {data && !enabled && (
        <div className="badge badge-amber" style={{ marginTop: 16 }}>
          The referral program is currently paused — new signups won't be credited.
        </div>
      )}

      <div className="card table-wrap mt-24">
        <table className="table">
          <thead>
            <tr>
              <th>Referrer</th>
              <th>Friend</th>
              <th>Code</th>
              <th>Friend discount</th>
              <th>Referrer reward</th>
              <th>Friend paid</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="fw-600">{r.referrer.name}</div>
                  {r.referrer.email && <div className="text-xs muted">{r.referrer.email}</div>}
                </td>
                <td>
                  <div className="fw-600">{r.referred.name}</div>
                  {r.referred.email && <div className="text-xs muted">{r.referred.email}</div>}
                </td>
                <td><span className="fw-600" style={{ letterSpacing: '0.05em' }}>{r.code}</span></td>
                <td>{r.discountPercent}%</td>
                <td>
                  {r.converted
                    ? <Badge tone={r.referrerRedeemed ? 'green' : 'blue'}>{r.referrerCouponPercent}% {r.referrerRedeemed ? 'used' : 'coupon'}</Badge>
                    : <span className="muted">{r.referrerCouponPercent}% (pending)</span>}
                </td>
                <td><Badge tone={r.converted ? 'green' : 'neutral'}>{r.converted ? 'Paid' : 'Not yet'}</Badge></td>
                <td className="muted text-sm">{date(r.createdAt)}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7}><div className="empty">No referrals yet.</div></td></tr>
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
