import Sparkline from '../../components/Sparkline.jsx'

/** Stats tab — live fetched stats (30d analytics + growth); override any field. */
const FIELDS = [
  { key: 'followers', label: 'Followers' },
  { key: 'following', label: 'Following' },
  { key: 'posts', label: 'Media count' },
  { key: 'engagement', label: 'Engagement rate (%)' },
  { key: 'reach', label: 'Reach (30d)' },
  { key: 'impressions', label: 'Impressions (30d)' },
  { key: 'avgLikes', label: 'Avg. likes' },
  { key: 'avgComments', label: 'Avg. comments' },
]

// The 9 metric cards on the public Influence Card. `key` must match the public
// site's metricVisibility keys (see influenceApi TILE_KEY); `label` mirrors the
// card title shown on the public profile.
const CARDS = [
  { key: 'followers', label: 'Total Followers' },
  { key: 'engagement', label: 'Engagement Rate' },
  { key: 'views', label: 'Total Views' },
  { key: 'reach', label: 'Reach' },
  { key: 'posts', label: 'Total Post' },
  { key: 'impressions', label: 'Total Impressions' },
  { key: 'creasumeScore', label: 'Creasume Score' },
  { key: 'brandDeals', label: 'Brand Deals Done' },
  { key: 'topCity', label: 'Top City' },
]

export default function StatsTab({ creator, draft, setDraft }) {
  function setStat(key, value) {
    setDraft({ ...draft, stats: { ...draft.stats, [key]: value } })
  }

  // Card visibility: missing/true = shown, false = hidden.
  const vis = draft.metricVisibility || {}
  const isOn = (key) => vis[key] !== false
  function toggleCard(key) {
    setDraft({ ...draft, metricVisibility: { ...vis, [key]: !isOn(key) } })
  }

  const growth = creator.followerGrowth || []
  const gained = growth.length ? growth[growth.length - 1] - growth[0] : 0

  return (
    <div>
      {/* Per-card show/hide on the public profile */}
      <div className="card card-pad" style={{ marginBottom: 22 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 14 }}>Cards shown on public profile</h3>
        <p className="text-xs faint" style={{ marginTop: 0, marginBottom: 14 }}>
          Turn any of the 9 metric cards off to hide it from the creator’s public Influence Card.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 10,
          }}
        >
          {CARDS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => toggleCard(c.key)}
              className="row items-center justify-between"
              style={{
                border: '1px solid var(--border)',
                background: 'var(--bg-subtle, transparent)',
                borderRadius: 10,
                padding: '10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                opacity: isOn(c.key) ? 1 : 0.6,
              }}
            >
              <span className="text-sm fw-600">{c.label}</span>
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: 36,
                  height: 20,
                  borderRadius: 12,
                  background: isOn(c.key) ? 'var(--green)' : 'var(--border-strong)',
                  position: 'relative',
                  transition: 'background 0.15s',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: isOn(c.key) ? 18 : 2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.15s',
                  }}
                />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Live analytics summary */}
      <div className="row flex-wrap gap-16" style={{ marginBottom: 20 }}>
        <Metric label="Reach (30d)" value={Number(draft.stats.reach).toLocaleString()} />
        <Metric label="Impressions (30d)" value={Number(draft.stats.impressions).toLocaleString()} />
        {/* null = Instagram gave us no reach to divide by, so the rate is
            genuinely unknown. Showing "0%" there would read as "nobody engages
            with this creator", which is a different (and wrong) claim. */}
        <Metric
          label="Engagement rate"
          value={draft.stats.engagement == null ? '—' : `${draft.stats.engagement}%`}
        />
        <Metric label="Followers" value={Number(draft.stats.followers).toLocaleString()} />
      </div>

      {/* Follower growth chart */}
      <div className="card card-pad" style={{ marginBottom: 22 }}>
        <div className="row items-center justify-between" style={{ marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 14 }}>Follower growth</h3>
          <span className="badge badge-green">+{gained.toLocaleString()} since connect</span>
        </div>
        <Sparkline data={growth} />
        <p className="text-xs faint mt-8">Daily snapshots stored from the connection date (not available from Meta directly).</p>
      </div>

      {/* Editable / override fields */}
      <h3 style={{ fontSize: 14 }}>All fetched stats — edit to override</h3>
      <div className="row flex-wrap gap-16">
        {FIELDS.map((f) => {
          const overridden = String(draft.stats[f.key]) !== String(creator.stats[f.key])
          return (
            <div key={f.key} className="field" style={{ flex: '1 1 200px', marginBottom: 0 }}>
              <label className="row items-center justify-between">
                <span>{f.label}</span>
                {overridden && <span className="badge badge-blue">overridden</span>}
              </label>
              <input className="input" value={draft.stats[f.key]} onChange={(e) => setStat(f.key, e.target.value)} />
              <span className="text-xs faint" style={{ display: 'block', marginTop: 4 }}>
                Live: {creator.stats[f.key].toLocaleString?.() ?? creator.stats[f.key]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="card card-pad" style={{ flex: '1 1 150px', minWidth: 140 }}>
      <div className="text-xs faint fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  )
}
