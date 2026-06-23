import { useState } from 'react'
import { api } from '../../services/api.js'

const EMPTY = {
  brand: '', campaign: '', description: '', category: '', link: '', logo: '',
  instagramUrl: '', mediaId: '', mediaType: '', postImage: '', postCaption: '',
  reach: 0, views: 0, likes: 0, comments: 0, saves: 0, shares: 0,
  engagementRate: 0, metricsFetchedAt: null,
}

const fmt = (n) => Number(n || 0).toLocaleString()

/** Compact metric readout shown on the form preview + each saved entry. */
function Metrics({ p }) {
  if (!p.mediaId) return null
  return (
    <div className="row flex-wrap gap-8 text-xs muted" style={{ marginTop: 4 }}>
      <span>Reach {fmt(p.reach)}</span>
      <span>Views {fmt(p.views)}</span>
      <span>♥ {fmt(p.likes)}</span>
      <span>💬 {fmt(p.comments)}</span>
      <span>🔖 {fmt(p.saves)}</span>
      <span>↗ {fmt(p.shares)}</span>
      <span>ER {p.engagementRate}%</span>
    </div>
  )
}

/** Portfolio tab — add brand collaboration entries (with linked IG post metrics). */
export default function PortfolioTab({ creatorId, draft, setDraft }) {
  const [form, setForm] = useState(EMPTY)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState('')

  function addEntry() {
    if (!form.brand.trim()) return
    const entry = { ...form, id: `p_${draft.portfolio.length + 1}_${form.brand.slice(0, 3)}` }
    setDraft({ ...draft, portfolio: [...draft.portfolio, entry] })
    setForm(EMPTY)
    setFetchError('')
    setUploadError('')
  }

  function removeEntry(id) {
    setDraft({ ...draft, portfolio: draft.portfolio.filter((p) => p.id !== id) })
  }

  async function onLogo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      // Upload to the server and store the permanent URL (not an ephemeral blob).
      const { url } = await api.uploadImage(file)
      setForm((f) => ({ ...f, logo: url }))
    } catch (err) {
      setUploadError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = '' // allow re-selecting the same file
    }
  }

  // Resolve the pasted IG post URL → that post's metrics, and merge into the form.
  async function fetchMetrics() {
    if (!form.instagramUrl.trim()) return
    setFetchError('')
    setFetching(true)
    try {
      const { post } = await api.fetchCollabPost(creatorId, form.instagramUrl.trim())
      setForm((f) => ({
        ...f,
        instagramUrl: post.instagramUrl || f.instagramUrl,
        mediaId: post.mediaId,
        mediaType: post.mediaType,
        postImage: post.postImage,
        postCaption: post.postCaption,
        reach: post.reach,
        views: post.views,
        likes: post.likes,
        comments: post.comments,
        saves: post.saves,
        shares: post.shares,
        engagementRate: post.engagementRate,
        metricsFetchedAt: post.metricsFetchedAt,
        // Use the post image as the showcase image and prefill the link if empty.
        logo: f.logo || post.postImage,
        link: f.link || post.permalink || post.instagramUrl,
      }))
    } catch (err) {
      setFetchError(err.message || 'Could not fetch post metrics')
    } finally {
      setFetching(false)
    }
  }

  return (
    <div className="row gap-24 flex-wrap" style={{ alignItems: 'flex-start' }}>
      {/* New entry form */}
      <div className="card card-pad" style={{ width: 340 }}>
        <h3 style={{ marginTop: 0, fontSize: 14 }}>Add collaboration</h3>

        {/* Instagram collab post — fetches reach/engagement for the creator's post */}
        <div className="field">
          <label>Instagram collab post link</label>
          <div className="row items-center gap-8">
            <input
              className="input flex-1"
              value={form.instagramUrl}
              onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
              placeholder="https://instagram.com/p/…"
            />
            <button
              className="btn btn-sm"
              style={{ margin: 0, whiteSpace: 'nowrap' }}
              disabled={fetching || !form.instagramUrl.trim()}
              onClick={fetchMetrics}
            >
              {fetching ? 'Fetching…' : 'Fetch'}
            </button>
          </div>
          <div className="text-xs faint" style={{ marginTop: 4 }}>
            Must be one of the creator’s own posts — insights aren’t available for other accounts.
          </div>
          {fetchError && <div className="text-xs" style={{ color: 'var(--danger, #c0392b)', marginTop: 6 }}>{fetchError}</div>}
          {form.mediaId && (
            <div className="card card-pad" style={{ marginTop: 8, background: 'var(--surface-alt)' }}>
              <div className="text-xs fw-600">Fetched metrics</div>
              <Metrics p={form} />
            </div>
          )}
        </div>

        <div className="field">
          <label>Brand logo / image</label>
          <div className="row items-center gap-12">
            <div
              className="avatar"
              style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: 'var(--surface-alt)' }}
            >
              {form.logo ? (
                <img src={form.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                '🏢'
              )}
            </div>
            <label className="btn btn-sm" style={{ margin: 0 }}>
              {uploading ? 'Uploading…' : 'Upload'}
              <input type="file" accept="image/*" hidden disabled={uploading} onChange={onLogo} />
            </label>
          </div>
          {uploadError && <div className="text-xs" style={{ color: 'var(--danger, #c0392b)', marginTop: 6 }}>{uploadError}</div>}
        </div>
        <div className="field">
          <label>Brand / Campaign name</label>
          <input className="input" value={form.campaign} onChange={(e) => setForm({ ...form, campaign: e.target.value, brand: e.target.value })} placeholder="e.g. Summer Escapes" />
        </div>
        <div className="field">
          <label>Campaign overview</label>
          <textarea
            className="input"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Write a short summary of this collaboration…"
            style={{ resize: 'vertical' }}
          />
        </div>
        <div className="field">
          <label>Category</label>
          <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Travel" />
        </div>
        <div className="field">
          <label>Link</label>
          <input className="input" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://…" />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={addEntry}>
          + Add entry
        </button>
      </div>

      {/* Existing entries */}
      <div className="flex-1" style={{ minWidth: 280 }}>
        <h3 style={{ marginTop: 0, fontSize: 14 }}>Collaborations ({draft.portfolio.length})</h3>
        <div className="col gap-12">
          {draft.portfolio.map((p) => (
            <div key={p.id} className="card card-pad row items-center gap-12">
              <div
                className="avatar"
                style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: 'var(--surface-alt)' }}
              >
                {p.logo ? <img src={p.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏢'}
              </div>
              <div className="flex-1">
                <div className="fw-600 text-sm">{p.campaign || p.brand}</div>
                <div className="text-xs muted">
                  {p.category}
                  {p.link && (
                    <>
                      {' · '}
                      <a href={p.link} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>
                        link
                      </a>
                    </>
                  )}
                </div>
                <Metrics p={p} />
              </div>
              <button className="btn btn-sm btn-danger" onClick={() => removeEntry(p.id)}>
                Remove
              </button>
            </div>
          ))}
          {draft.portfolio.length === 0 && <div className="empty card">No collaborations added yet.</div>}
        </div>
      </div>
    </div>
  )
}
