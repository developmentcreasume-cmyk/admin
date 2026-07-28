import { useEffect, useState } from 'react'
import Badge from '../components/Badge.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Modal from '../components/Modal.jsx'
import { api, API_BASE } from '../services/api.js'

// Content for the two admin-managed marquees on the public landing page:
//   • Testimonials → "Hear from Our Influencers" (creator photo, name, quote)
//   • Brands       → "Brands that Trust Creasume" (logo, name, optional link)
// Both were hardcoded placeholders in the front-end before this page existed.
// An empty list here makes the landing page fall back to its skeleton cards.
const TABS = [
  { key: 'testimonial', label: 'Creators', blurb: 'Choose any creator. Profile data, score, and founding status are fetched automatically.' },
  { key: 'brand', label: 'Brands', blurb: 'Shown in the "Brands that Trust Creasume" marquee.' },
]

const emptyForm = { name: '', username: '', handle: '', quote: '', imageUrl: '', website: '', sortOrder: 0, isActive: true }

const MAX_QUOTE_WORDS = 25

// Caps pasted/typed text at MAX_QUOTE_WORDS words — keeps testimonials short
// enough to fit the fixed-height card on the landing page.
function limitWords(text, max) {
  const words = text.split(/\s+/).filter(Boolean)
  return words.length <= max ? text : words.slice(0, max).join(' ')
}

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
  const [creatorSearching, setCreatorSearching] = useState(false)
  const [creatorError, setCreatorError] = useState('')

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
    setCreatorSearching(false)
    setCreatorError('')
    setForm({ ...emptyForm, sortOrder: items.length })
    setEditing({ id: null })
  }

  function openEdit(item) {
    setError('')
    setCreatorSearch(item.username || String(item.handle || '').replace(/^@+/, ''))
    setCreatorResults([])
    setCreatorDropOpen(false)
    setCreatorSearching(false)
    setCreatorError('')
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
    setCreatorError('')
    if (!q.trim()) { setCreatorResults([]); setCreatorDropOpen(false); setCreatorSearching(false); return }
    setCreatorDropOpen(true)
    setCreatorSearching(true)
    try {
      const res = await api.creators({ search: q, limit: 10 })
      setCreatorResults(res.data || res.creators || res.items || [])
    } catch (e) {
      setCreatorResults([])
      setCreatorError(e.message || 'Could not load creators.')
    } finally {
      setCreatorSearching(false)
    }
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
            quote: form.quote.trim(),
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
              <th style={{ width: 90 }}>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={`sk-${i}`} className="skeleton-row">
                {isBrand && (
                  <td><span className="skeleton skeleton-circle" style={{ width: 36, height: 36, borderRadius: 8 }} /></td>
                )}
                <td><span className="skeleton skeleton-text" style={{ width: isBrand ? 140 : 160 }} /></td>
                {isBrand && <td><span className="skeleton skeleton-text" style={{ width: 120 }} /></td>}
                <td><span className="skeleton skeleton-text" style={{ width: 46, height: 20, borderRadius: 999 }} /></td>
                <td style={{ textAlign: 'right' }}>
                  <div className="row items-center gap-8" style={{ justifyContent: 'flex-end' }}>
                    <span className="skeleton" style={{ width: 48, height: 28, borderRadius: 8 }} />
                    <span className="skeleton" style={{ width: 44, height: 28, borderRadius: 8 }} />
                    <span className="skeleton" style={{ width: 56, height: 28, borderRadius: 8 }} />
                  </div>
                </td>
              </tr>
            ))}
            {!loading && items.map((it) => (
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
                <td colSpan={isBrand ? 5 : 4}>
                  <div className="empty">
                    No {isBrand ? 'brands' : 'creators'} yet — the landing page is showing placeholder cards.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!editing}
        title={`${editing?.id ? 'Edit' : 'Add'} ${isBrand ? 'brand' : 'creator'}`}
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
          <div className="field">
            <label>Creator</label>
            <input
              className="input"
              value={creatorSearch}
              onChange={(e) => searchCreators(e.target.value)}
              placeholder="Type a creator name or @username…"
              autoFocus
              autoComplete="off"
            />
            {/* Results render INLINE (in the modal's normal flow) so the modal's
                scroll container can never clip them, and so the box always shows
                feedback — searching, an error, matches, or "no matches". */}
            {creatorDropOpen && (
              <div style={{
                marginTop: 6,
                background: 'var(--surface, #fff)', border: '1px solid var(--border, #e2e8f0)',
                borderRadius: 8, maxHeight: 240, overflowY: 'auto'
              }}>
                {creatorSearching && (
                  <div className="text-xs muted" style={{ padding: '10px 12px' }}>Searching…</div>
                )}
                {!creatorSearching && creatorError && (
                  <div className="text-xs" style={{ padding: '10px 12px', color: 'var(--red)' }}>{creatorError}</div>
                )}
                {!creatorSearching && !creatorError && creatorResults.length === 0 && (
                  <div className="text-xs muted" style={{ padding: '10px 12px' }}>
                    No signed-up creators match “{creatorSearch}”.
                  </div>
                )}
                {!creatorSearching && creatorResults.map((c) => {
                  const handle = c.instagramHandle || c.username || c.handle || ''
                  const name = c.name || c.fullName || handle
                  // Raw Instagram profilePicture URLs are hotlink-blocked/expired,
                  // so load through the backend avatar proxy (it refreshes the URL
                  // via the Graph API when needed). The proxy is keyed by the
                  // opaque publicId (findByHandle → publicId), NOT the @handle.
                  const photo = c.publicId ? `${API_BASE}/public/avatar/${encodeURIComponent(c.publicId)}` : ''
                  const initial = (name || handle || '?').trim().charAt(0).toUpperCase()
                  return (
                    <div
                      key={c._id}
                      onMouseDown={() => pickCreator(c)}
                      style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--border)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-alt, #f1f5f9)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = ''}
                    >
                      {/* Initial-letter circle as the base; the proxied photo sits
                          on top and covers it when it loads. If the photo fails
                          (no publicId / expired / no token), it hides and the
                          initial shows through — so there's never a broken icon. */}
                      <span style={{
                        position: 'relative', width: 28, height: 28, borderRadius: '50%',
                        flexShrink: 0, overflow: 'hidden', display: 'grid', placeItems: 'center',
                        background: 'var(--accent, #6b7688)', color: '#fff', fontSize: 12, fontWeight: 700
                      }}>
                        {initial}
                        {photo && (
                          <img
                            src={photo}
                            alt=""
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        )}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
                        {handle && <div style={{ fontSize: 11, opacity: .6 }}>@{handle}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <span className="text-xs muted" style={{ marginTop: 6 }}>Pick a signed-up creator, or type their exact Instagram username. Name, photo, followers and score are fetched automatically.</span>
          </div>
        )}

        {!isBrand && (
          <div className="field">
            <label>Testimonial</label>
            <textarea
              className="input"
              rows={3}
              value={form.quote}
              onChange={(e) => setForm({ ...form, quote: limitWords(e.target.value, MAX_QUOTE_WORDS) })}
              placeholder="What they said about Creasume…"
            />
            <span className="text-xs muted">
              {form.quote.trim() ? form.quote.trim().split(/\s+/).filter(Boolean).length : 0}/{MAX_QUOTE_WORDS} words max · shown on their card on the landing page
            </span>
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
