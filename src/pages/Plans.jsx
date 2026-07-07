import { useEffect, useState } from 'react'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import { api } from '../services/api.js'

const EMPTY = {
  name: '',
  slug: '',
  description: '',
  priceInr: 0,
  durationDays: 30,
  billingType: 'recurring',
  razorpayPlanId: '',
  perksText: '',
  isPopular: false,
  isActive: true,
  sortOrder: 0,
}

// Plan doc → editable form shape (paise → rupees, perks[] → textarea lines).
const toForm = (p) => ({
  name: p.name || '',
  slug: p.slug || '',
  description: p.description || '',
  priceInr: (p.pricePaise || 0) / 100,
  durationDays: p.durationDays ?? 30,
  billingType: p.billingType || 'recurring',
  razorpayPlanId: p.razorpayPlanId || '',
  perksText: (p.perks || []).join('\n'),
  isPopular: !!p.isPopular,
  isActive: p.isActive !== false,
  sortOrder: p.sortOrder || 0,
})

// Form → API body (rupees → priceInr, textarea → perks[]).
const toBody = (f) => ({
  name: f.name,
  slug: f.slug || undefined,
  description: f.description,
  priceInr: Number(f.priceInr) || 0,
  durationDays: Number(f.durationDays) || 0,
  billingType: f.billingType,
  razorpayPlanId: f.razorpayPlanId || null,
  perks: f.perksText.split('\n').map((s) => s.trim()).filter(Boolean),
  isPopular: f.isPopular,
  isActive: f.isActive,
  sortOrder: Number(f.sortOrder) || 0,
})

export default function Plans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // { id?, form }
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api
      .plans()
      .then((res) => setPlans(res.plans || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openNew = () => setEditing({ id: null, form: { ...EMPTY } })
  const openEdit = (p) => setEditing({ id: p._id, form: toForm(p) })

  async function save() {
    if (!editing) return
    setSaving(true)
    setError('')
    try {
      const body = toBody(editing.form)
      if (editing.id) await api.updatePlan(editing.id, body)
      else await api.createPlan(body)
      setEditing(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(p) {
    if (!window.confirm(`Delete the "${p.name}" plan? This can't be undone.`)) return
    try {
      await api.deletePlan(p._id)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  const set = (k, v) => setEditing((e) => ({ ...e, form: { ...e.form, [k]: v } }))

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Plans</h1>
          <p>{plans.length} plans · manage subscription pricing & perks.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ New plan</button>
      </div>

      {error && <div className="badge badge-red" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Price</th>
              <th>Duration</th>
              <th>Billing</th>
              <th>Perks</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p._id}>
                <td>
                  <div className="fw-600 row items-center gap-8">
                    {p.name}
                    {p.isPopular && <Badge tone="blue">Popular</Badge>}
                  </div>
                  <div className="text-xs muted">{p.slug}</div>
                </td>
                <td className="fw-600">₹{((p.pricePaise || 0) / 100).toLocaleString('en-IN')}</td>
                <td className="muted">{p.durationDays ? `${p.durationDays} days` : 'Lifetime'}</td>
                <td>
                  <Badge tone="neutral">{p.billingType === 'recurring' ? 'Recurring' : 'One-time'}</Badge>
                </td>
                <td className="muted text-sm">{(p.perks || []).length} perks</td>
                <td>
                  {p.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-sm" onClick={() => openEdit(p)}>Edit</button>{' '}
                  <button className="btn btn-sm btn-danger" onClick={() => remove(p)}>Delete</button>
                </td>
              </tr>
            ))}
            {!loading && plans.length === 0 && (
              <tr><td colSpan={7}><div className="empty">No plans yet. Create one to get started.</div></td></tr>
            )}
            {loading && (
              <tr><td colSpan={7}><div className="empty">Loading…</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / edit modal */}
      <Modal
        open={!!editing}
        title={editing?.id ? 'Edit plan' : 'New plan'}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button className="btn" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save plan'}
            </button>
          </>
        }
      >
        {editing && (
          <div className="col gap-12">
            <div className="row gap-12">
              <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                <label>Name</label>
                <input className="input" value={editing.form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Starter" />
              </div>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                <label>Slug (optional)</label>
                <input className="input" value={editing.form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="auto from name" />
              </div>
            </div>

            <div className="field mb-0">
              <label>Description</label>
              <input className="input" value={editing.form.description} onChange={(e) => set('description', e.target.value)} placeholder="Short line shown on the plan card" />
            </div>

            <div className="row gap-12">
              <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                <label>Price (₹)</label>
                <input className="input" type="number" min={0} value={editing.form.priceInr} onChange={(e) => set('priceInr', e.target.value)} />
              </div>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                <label>Duration (days)</label>
                <input className="input" type="number" min={0} value={editing.form.durationDays} onChange={(e) => set('durationDays', e.target.value)} />
                <span className="text-xs faint">0 = lifetime</span>
              </div>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                <label>Billing</label>
                <select className="select" value={editing.form.billingType} onChange={(e) => set('billingType', e.target.value)}>
                  <option value="recurring">Recurring</option>
                  <option value="one_time">One-time</option>
                </select>
              </div>
            </div>

            {editing.form.billingType === 'recurring' && (
              <div className="field mb-0">
                <label>Razorpay Plan ID (recurring)</label>
                <input className="input" value={editing.form.razorpayPlanId} onChange={(e) => set('razorpayPlanId', e.target.value)} placeholder="plan_XXXXXXXX (from Razorpay dashboard)" />
              </div>
            )}

            <div className="field mb-0">
              <label>Perks (one per line)</label>
              <textarea className="input" rows={5} value={editing.form.perksText} onChange={(e) => set('perksText', e.target.value)} placeholder={'Full analytics\nAudience insights\nPriority support'} style={{ resize: 'vertical' }} />
            </div>

            <div className="row gap-24 items-center">
              <label className="row items-center gap-8 text-sm">
                <input type="checkbox" checked={editing.form.isPopular} onChange={(e) => set('isPopular', e.target.checked)} />
                Most popular
              </label>
              <label className="row items-center gap-8 text-sm">
                <input type="checkbox" checked={editing.form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
                Active (visible to creators)
              </label>
              <div className="field mb-0" style={{ width: 120 }}>
                <label>Sort order</label>
                <input className="input" type="number" value={editing.form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
