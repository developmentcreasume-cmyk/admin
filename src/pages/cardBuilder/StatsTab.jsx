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

export default function StatsTab({ creator, draft, setDraft }) {
  function setStat(key, value) {
    setDraft({ ...draft, stats: { ...draft.stats, [key]: value } })
  }

  const growth = creator.followerGrowth || []
  const gained = growth.length ? growth[growth.length - 1] - growth[0] : 0

  return (
    <div>
      {/* Live analytics summary */}
      <div className="row flex-wrap gap-16" style={{ marginBottom: 20 }}>
        <Metric label="Reach (30d)" value={Number(draft.stats.reach).toLocaleString()} />
        <Metric label="Impressions (30d)" value={Number(draft.stats.impressions).toLocaleString()} />
        <Metric label="Engagement rate" value={`${draft.stats.engagement}%`} />
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
