/** Profile tab — view live API data; override niche, location and bio. */
export default function ProfileTab({ creator, draft, setDraft }) {
  return (
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
