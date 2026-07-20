import { useEffect, useState } from 'react'
import Badge from '../components/Badge.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Modal from '../components/Modal.jsx'
import { api } from '../services/api.js'

// Content for the two admin-managed marquees on the public landing page:
//   • Testimonials → "Hear from Our Influencers" (creator photo, name, quote)
//   • Brands       → "Brands that Trust Creasume" (logo, name, optional link)
// Both were hardcoded placeholders in the front-end before this page existed.
// An empty list here makes the landing page fall back to its skeleton cards.
const TABS = [
  { key: 'testimonial', label: 'Creator testimonials', blurb: 'Shown in the "Hear from Our Influencers" marquee.' },
  { key: 'brand', label: 'Brands', blurb: 'Shown in the "Brands that Trust Creasume" marquee.' },
]

const emptyForm = { name: '', handle: '', quote: '', imageUrl: '', website: '', sortOrder: 0, isActive: true }

export default function Landing() {
  const [kind, setKind] = useState('testimonial')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Open editor: { id } for edit, { id: null } for add. Null = closed.
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const tab = TABS.find((t) => t.key === kind)
  const isBrand = kind === 'brand'

  function load() {
    setLoading(true)
    api
      .landingItems({ kind })
      .then((res) => setItems(res.items || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [kind])

  function openAdd() {
    setError('')
    // Append to the end of the current list by default.
    setForm({ ...emptyForm, sortOrder: items.length })
    setEditing({ id: null })
  }

  function openEdit(item) {
    setError('')
    setForm({
      name: item.name || '',
      handle: item.handle || '',
      quote: item.quote || '',
      imageUrl: item.imageUrl || '',
      website: item.website || '',
      sortOrder: item.sortOrder ?? 0,
      isActive: item.isActive !== false,
    })
    setEditing({ id: item._id })
  }

  async function onPickImage(file) {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const res = await api.uploadImage(file)
      setForm((f) => ({ ...f, imageUrl: res.url }))
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }
    if (!isBrand && !form.quote.trim()) {
      setError('Quote is required for a testimonial.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const body = { ...form, sortOrder: Number(form.sortOrder) || 0 }
      if (editing.id) await api.updateLandingItem(editing.id, body)
      else await api.addLandingItem({ ...body, kind })
      setEditing(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(item) {
    setError('')
    try {
      await api.updateLandingItem(item._id, { isActive: !(item.isActive !== false) })
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function doDelete() {
    setBusy(true)
    try {
      await api.deleteLandingItem(confirmDelete._id)
      setConfirmDelete(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Landing page</h1>
          <p>Creators and brands shown on the public landing page. Leave a list empty to keep the placeholder cards.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add {isBrand ? 'brand' : 'testimonial'}
        </button>
      </div>

      {error && <div className="badge badge-red" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="row items-center gap-8 flex-wrap" style={{ marginBottom: 8 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`btn btn-sm${kind === t.key ? ' btn-primary' : ''}`}
            onClick={() => setKind(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-xs muted" style={{ marginTop: 0, marginBottom: 16 }}>{tab.blurb}</p>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>{isBrand ? 'Logo' : 'Photo'}</th>
              <th>{isBrand ? 'Brand' : 'Creator'}</th>
              {!isBrand && <th>Quote</th>}
              {isBrand && <th>Website</th>}
              <th style={{ width: 70 }}>Order</th>
              <th style={{ width: 90 }}>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td>
                  {it.imageUrl ? (
                    <img
                      src={it.imageUrl}
                      alt=""
                      style={{ width: 36, height: 36, borderRadius: isBrand ? 8 : '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span className="text-xs faint">—</span>
                  )}
                </td>
                <td>
                  <div className="fw-600">{it.name}</div>
                  {!isBrand && it.handle && <div className="text-xs muted">{it.handle}</div>}
                </td>
                {!isBrand && (
                  <td className="text-xs muted" style={{ maxWidth: 380 }}>
                    {(it.quote || '').length > 120 ? `${it.quote.slice(0, 120)}…` : it.quote}
                  </td>
                )}
                {isBrand && (
                  <td className="text-xs muted">
                    {it.website ? <a href={it.website} target="_blank" rel="noreferrer">{it.website}</a> : '—'}
                  </td>
                )}
                <td>{it.sortOrder ?? 0}</td>
                <td>
                  <Badge tone={it.isActive !== false ? 'green' : 'neutral'}>
                    {it.isActive !== false ? 'Live' : 'Hidden'}
                  </Badge>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="row items-center gap-8" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm" onClick={() => toggleActive(it)}>
                      {it.isActive !== false ? 'Hide' : 'Show'}
                    </button>
                    <button className="btn btn-sm" onClick={() => openEdit(it)}>Edit</button>
                    <button className="btn btn-sm" onClick={() => setConfirmDelete(it)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={isBrand ? 6 : 7}>
                  <div className="empty">
                    No {isBrand ? 'brands' : 'testimonials'} yet — the landing page is showing placeholder cards.
                  </div>
                </td>
              </tr>
            )}
            {loading && (
              <tr><td colSpan={isBrand ? 6 : 7}><div className="empty">Loading…</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!editing}
        title={`${editing?.id ? 'Edit' : 'Add'} ${isBrand ? 'brand' : 'testimonial'}`}
        onClose={() => { if (!busy) setEditing(null) }}
        maxWidth={520}
        footer={
          <>
            <button className="btn btn-sm" onClick={() => setEditing(null)} disabled={busy}>Cancel</button>
            <button className="btn btn-sm btn-primary" onClick={save} disabled={busy || uploading}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <div className="field">
          <label>{isBrand ? 'Brand name' : 'Creator name'}</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={isBrand ? 'e.g. Spotify' : 'e.g. Priya Sharma'}
            autoFocus
          />
        </div>

        {!isBrand && (
          <>
            <div className="field">
              <label>Handle / role <span className="faint">(optional)</span></label>
              <input
                className="input"
                value={form.handle}
                onChange={(e) => setForm({ ...form, handle: e.target.value })}
                placeholder="e.g. @priya · Fashion creator"
              />
            </div>
            <div className="field">
              <label>Quote</label>
              <textarea
                className="input"
                rows={4}
                value={form.quote}
                onChange={(e) => setForm({ ...form, quote: e.target.value })}
                placeholder="What did they say about Creasume?"
              />
            </div>
          </>
        )}

        {isBrand && (
          <div className="field">
            <label>Website <span className="faint">(optional)</span></label>
            <input
              className="input"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://spotify.com"
            />
          </div>
        )}

        <div className="field">
          <label>{isBrand ? 'Logo' : 'Photo'}</label>
          <div className="row items-center gap-8">
            {form.imageUrl && (
              <img
                src={form.imageUrl}
                alt=""
                style={{ width: 44, height: 44, borderRadius: isBrand ? 8 : '50%', objectFit: 'cover' }}
              />
            )}
            <input type="file" accept="image/*" onChange={(e) => onPickImage(e.target.files?.[0])} />
            {uploading && <span className="text-xs muted">Uploading…</span>}
          </div>
          <input
            className="input"
            style={{ marginTop: 8 }}
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="…or paste an image URL"
          />
        </div>

        <div className="row gap-8" style={{ alignItems: 'flex-start' }}>
          <div className="field" style={{ width: 140 }}>
            <label>Order</label>
            <input
              className="input"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </div>
          <div className="field mb-0" style={{ flex: 1 }}>
            <label>Visibility</label>
            <label className="row items-center gap-8" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              <span className="text-sm">Show on the landing page</span>
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        title={`Delete "${confirmDelete?.name || ''}"?`}
        message="This removes it from the landing page permanently. Use Hide instead if you may want it back."
        confirmLabel="Delete"
        tone="danger"
        busy={busy}
        onConfirm={doDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  )
}
