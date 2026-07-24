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
  { key: 'testimonial', label: 'Founding creators', blurb: 'Enter only an Instagram username. Profile data and score are fetched automatically.' },
  { key: 'brand', label: 'Brands', blurb: 'Shown in the "Brands that Trust Creasume" marquee.' },
]

const emptyForm = { name: '', username: '', handle: '', quote: '', imageUrl: '', website: '', sortOrder: 0, isActive: true }

export default function Landing() {
  const [kind, setKind] = useState('testimonial')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Creator search dropdown
  const [creatorSearch, setCreatorSearch] = useState('')
  const [creatorResults, setCreatorResults] = useState([])
  const [creatorDropOpen, setCreatorDropOpen] = useState(false)

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
    setCreatorSearch('')
    setCreatorResults([])
    setCreatorDropOpen(false)
    setForm({ ...emptyForm, sortOrder: items.length })
    setEditing({ id: null })
  }

  function openEdit(item) {
    setError('')
    setCreatorSearch(item.username || String(item.handle || '').replace(/^@+/, ''))
    setCreatorResults([])
    setCreatorDropOpen(false)
    setForm({
      name: item.name || '',
      username: item.username || String(item.handle || '').replace(/^@+/, ''),
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

  async function searchCreators(q) {
    setCreatorSearch(q)
    if (!q.trim()) { setCreatorResults([]); setCreatorDropOpen(false); return }
    try {
      const res = await api.creators({ search: q, limit: 10 })
      setCreatorResults(res.creators || res.items || [])
      setCreatorDropOpen(true)
    } catch { setCreatorResults([]) }
  }

  function pickCreator(c) {
    const handle = c.instagramHandle || c.username || c.handle || ''
    setCreatorSearch(handle)
    setForm((f) => ({ ...f, username: handle }))
    setCreatorDropOpen(false)
  }

  async function save() {
    if (isBrand && !form.name.trim()) {
      setError('Brand name is required.')
      return
    }
    if (!isBrand && !form.username.trim()) {
      setError('Select a creator.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const body = isBrand
        ? { ...form, sortOrder: Number(form.sortOrder) || 0 }
        : {
            username: form.username.trim().replace(/^@+/, '').toLowerCase(),
            sortOrder: Number(form.sortOrder) || 0,
            isActive: form.isActive,
          }
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
          + Add {isBrand ? 'brand' : 'creator'}
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
              {isBrand && <th style={{ width: 60 }}>Logo</th>}
              <th>{isBrand ? 'Brand' : 'Creator'}</th>
              {isBrand && <th>Website</th>}
              <th style={{ width: 70 }}>Order</th>
              <th style={{ width: 90 }}>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                {isBrand && <td>
                  {it.imageUrl ? (
                    <img
                      src={it.imageUrl}
                      alt=""
                      style={{ width: 36, height: 36, borderRadius: isBrand ? 8 : '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span className="text-xs faint">—</span>
                  )}
                </td>}
                <td>
                  <div className="fw-600">
                    {isBrand ? it.name : `@${it.username || String(it.handle || '').replace(/^@+/, '')}`}
                  </div>
                </td>
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
                <td colSpan={isBrand ? 6 : 5}>
                  <div className="empty">
                    No {isBrand ? 'brands' : 'founding creators'} yet — the landing page is showing placeholder cards.
                  </div>
                </td>
              </tr>
            )}
            {loading && (
              <tr><td colSpan={isBrand ? 6 : 5}><div className="empty">Loading…</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!editing}
        title={`${editing?.id ? 'Edit' : 'Add'} ${isBrand ? 'brand' : 'founding creator'}`}
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
        {isBrand && <div className="field">
          <label>{isBrand ? 'Brand name' : 'Creator name'}</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={isBrand ? 'e.g. Spotify' : 'e.g. Priya Sharma'}
            autoFocus
          />
        </div>}

        {!isBrand && (
          <div className="field" style={{ position: 'relative' }}>
            <label>Creator</label>
            <input
              className="input"
              value={creatorSearch}
              onChange={(e) => searchCreators(e.target.value)}
              onFocus={() => creatorResults.length && setCreatorDropOpen(true)}
              placeholder="Type a creator name…"
              autoFocus
              autoComplete="off"
            />
            {creatorDropOpen && creatorResults.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: 'var(--surface, #fff)', border: '1px solid var(--border, #e2e8f0)',
                borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,.12)', maxHeight: 220, overflowY: 'auto'
              }}>
                {creatorResults.map((c) => {
                  const handle = c.instagramHandle || c.username || c.handle || ''
                  const name = c.name || c.fullName || handle
                  return (
                    <div
                      key={c._id}
                      onMouseDown={() => pickCreator(c)}
                      style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover, #f1f5f9)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = ''}
                    >
                      {c.profilePicUrl && <img src={c.profilePicUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
                        {handle && <div style={{ fontSize: 11, opacity: .6 }}>@{handle}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <span className="text-xs muted">Name, profile photo, followers and score are fetched automatically.</span>
          </div>
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

        {isBrand && <div className="field">
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
        </div>}


      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        title={`Delete "${confirmDelete?.name || confirmDelete?.username || ''}"?`}
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
