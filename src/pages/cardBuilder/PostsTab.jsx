/** Posts tab — recent posts grid (thumbnails, captions, per-post engagement). */
const TYPE_TONE = { REEL: 'blue', CAROUSEL: 'amber', IMAGE: 'neutral' }

export default function PostsTab({ creator }) {
  const posts = creator.recentPosts || []

  return (
    <div>
      <p className="text-sm muted" style={{ marginTop: 0 }}>
        Up to the last 12 posts fetched from Instagram. Engagement (likes, comments, saves, shares) is live.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
        }}
      >
        {posts.map((p) => (
          <div key={p.id} className="card" style={{ overflow: 'hidden' }}>
            {/* Thumbnail placeholder (real thumbnail comes from API permalink) */}
            <div style={{ position: 'relative', aspectRatio: '1 / 1', background: p.tone }}>
              <span className="badge" style={{ position: 'absolute', top: 8, left: 8, background: '#fff' }}>
                <span className={`badge badge-${TYPE_TONE[p.type]}`}>{p.type}</span>
              </span>
            </div>
            <div style={{ padding: 12 }}>
              <div className="text-sm" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {p.caption}
              </div>
              <div className="row flex-wrap gap-8 mt-8 text-xs muted">
                <span>♥ {p.likes.toLocaleString()}</span>
                <span>💬 {p.comments.toLocaleString()}</span>
                <span>🔖 {p.saves.toLocaleString()}</span>
                <span>↗ {p.shares.toLocaleString()}</span>
              </div>
              <a href={p.permalink} target="_blank" rel="noreferrer" className="text-xs" style={{ color: 'var(--blue)', display: 'inline-block', marginTop: 8 }}>
                View on Instagram →
              </a>
            </div>
          </div>
        ))}
      </div>
      {posts.length === 0 && <div className="empty">No posts fetched yet.</div>}
    </div>
  )
}
