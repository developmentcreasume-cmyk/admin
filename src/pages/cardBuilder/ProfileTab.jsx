/** Profile tab — view live API data; override niche, location and bio; and
 *  manage the Social Links shown on the public card's Professional Presence. */
import { useState } from 'react'

// Platforms the public card knows how to render (icon + label). Keep in sync
// with PLATFORM_DISPLAY in the influence frontend's influenceApi.js. Instagram
// is intentionally omitted — it's the connected account and is always shown
// (pinned to the centre) on the public card, so admins only add the others.
const PLATFORMS = ['YouTube', 'Twitter / X', 'TikTok', 'Website', 'LinkedIn']

export default function ProfileTab({ creator, draft, setDraft }) {
  const links = draft.socialLinks || []
  const setLinks = (next) => setDraft({ ...draft, socialLinks: next })
  const removeLink = (i) => setLinks(links.filter((_, idx) => idx !== i))

  // New-link entry row — a link is only added to the list when "Add" is clicked.
  // Capped at 4 links total.
  const MAX_LINKS = 5
  const atMax = links.length >= MAX_LINKS
  const [entry, setEntry] = useState({ platform: '', url: '' })
  const canAdd = !atMax && entry.platform && entry.url.trim()
  const addLink = () => {
    if (!canAdd) return
    setLinks([...links, { platform: entry.platform, url: entry.url.trim() }])
    setEntry({ platform: '', url: '' })
  }

  return (
    <div className="col gap-24">
      <div className="row gap-24 flex-wrap" style={{ alignItems: 'flex-start' }}>
        {/* Live (read-only) API data */}
        <div className="flex-1" style={{ minWidth: 300 }}>
          <h3 style={{ marginTop: 0, fontSize: 14 }}>Live Instagram profile</h3>
          <div className="card card-pad col gap-12">
            <div className="row items-center gap-12">
              <span className="avatar" style={{ width: 48, height: 48, fontSize: 17 }}>
                {creator.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
              </span>
              <div>
                <div className="fw-600" style={{ fontSize: 15 }}>{creator.displayName}</div>
                <div className="text-sm muted">{creator.handle}</div>
              </div>
            </div>
            <ReadRow label="Username" value={creator.handle} />
            <ReadRow label="Followers" value={creator.stats.followers.toLocaleString()} />
            <ReadRow label="Following" value={creator.stats.following.toLocaleString()} />
            <ReadRow label="Media count" value={creator.stats.posts.toLocaleString()} />
            <ReadRow label="Bio (from API)" value={creator.bio} multiline />
            <ReadRow label="Last refreshed" value={creator.lastRefresh} />
          </div>
        </div>

        {/* Editable overrides */}
        <div className="flex-1" style={{ minWidth: 300 }}>
          <h3 style={{ marginTop: 0, fontSize: 14 }}>Overrides</h3>
          <div className="card card-pad">
            <div className="field">
              <label>Niche</label>
              <input
                className="input"
                value={draft.niche}
                onChange={(e) => setDraft({ ...draft, niche: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Location</label>
              <input
                className="input"
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              />
            </div>
            <div className="field mb-0">
              <label>Bio (override)</label>
              <textarea
                className="textarea"
                style={{ minHeight: 70 }}
                value={draft.bio}
                onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
              />
            </div>
          </div>
          <p className="text-xs faint mt-8">Overrides replace the live API values on the public card.</p>
        </div>
      </div>

      {/* Social Links — appear on the public card's Professional Presence row. */}
      <div>
        <h3 style={{ marginTop: 0, fontSize: 14 }}>Social Links</h3>
        <p className="text-sm muted" style={{ marginTop: -4, marginBottom: 12 }}>
          Add links to your other platforms. Each becomes a clickable card on the public profile.
        </p>
        <div className="card card-pad col gap-12">
          {/* Saved links — each can only be removed. */}
          {links.length === 0 && (
            <p className="text-sm faint mb-0">No links yet — add one below.</p>
          )}
          {links.map((l, i) => (
            <div key={i} className="row gap-12 items-center">
              <span className="fw-600" style={{ minWidth: 110 }}>{l.platform}</span>
              <span className="text-sm muted flex-1" style={{ wordBreak: 'break-all' }}>{l.url}</span>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => removeLink(i)}
                aria-label="Remove link"
              >
                Remove
              </button>
            </div>
          ))}

          {/* New-link entry — added to the list only when "Add" is clicked.
              Hidden once the 4-link limit is reached. */}
          {atMax ? (
            <p className="text-sm faint mb-0" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              Maximum of {MAX_LINKS} links reached. Remove one to add another.
            </p>
          ) : (
            <div className="row gap-12 items-center" style={{ borderTop: links.length ? '1px solid var(--border)' : 'none', paddingTop: links.length ? 12 : 0 }}>
              <select
                className="input"
                style={{ maxWidth: 200 }}
                value={entry.platform}
                onChange={(e) => setEntry({ ...entry, platform: e.target.value })}
              >
                <option value="">Select Platform</option>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input
                className="input flex-1"
                placeholder="https://..."
                value={entry.url}
                onChange={(e) => setEntry({ ...entry, url: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink() } }}
              />
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={addLink}
                disabled={!canAdd}
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ReadRow({ label, value, multiline }) {
  return (
    <div
      className={multiline ? 'col gap-8' : 'row items-center justify-between'}
      style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, gap: multiline ? 4 : undefined }}
    >
      <span className="text-sm muted">{label}</span>
      <span className="text-sm fw-600" style={{ textAlign: multiline ? 'left' : 'right' }}>{value}</span>
    </div>
  )
}
