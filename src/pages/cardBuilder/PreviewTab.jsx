import { useMemo, useState } from 'react'
import Sparkline from '../../components/Sparkline.jsx'
import BarStat from '../../components/BarStat.jsx'
import { DEMOGRAPHICS_MIN_FOLLOWERS } from '../../data/mockData.js'

/** Preview tab — live preview of the public Influence Card as visitors see it. */
export default function PreviewTab({ creator, draft, packagesActive = true }) {
  const [cat, setCat] = useState('All')

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(draft.portfolio.map((p) => p.category).filter(Boolean)))],
    [draft.portfolio],
  )
  const collabs = cat === 'All' ? draft.portfolio : draft.portfolio.filter((p) => p.category === cat)
  const d = creator.demographics
  const demoUnlocked = creator.stats.followers >= DEMOGRAPHICS_MIN_FOLLOWERS

  return (
    <div className="col items-center">
      <div className="text-xs faint" style={{ marginBottom: 12 }}>creasume.com/{creator.slug} — public preview</div>

      <div className="card" style={{ width: '100%', maxWidth: 560, overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
        {/* Header */}
        <div style={{ padding: 24, borderBottom: '1px solid var(--border)' }} className="col items-center">
          <span className="avatar" style={{ width: 76, height: 76, fontSize: 26, marginBottom: 12 }}>
            {creator.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
          </span>
          <h2 style={{ margin: 0, fontSize: 21 }}>{creator.displayName}</h2>
          <div className="text-sm muted">{creator.handle}</div>
          <p className="text-sm muted" style={{ textAlign: 'center', maxWidth: 380, margin: '8px 0 0' }}>{draft.bio}</p>
          <div className="row gap-8 mt-8 flex-wrap" style={{ justifyContent: 'center' }}>
            <span className="badge badge-neutral">{draft.niche}</span>
            <span className="badge badge-neutral">{draft.location}</span>
            {creator.founding && <span className="badge badge-amber">★ Founding</span>}
          </div>
          {/* Summary stats */}
          <div className="row mt-16" style={{ width: '100%' }}>
            {[
              ['Followers', Number(draft.stats.followers).toLocaleString()],
              ['Posts', Number(draft.stats.posts).toLocaleString()],
              ['Engagement', `${draft.stats.engagement}%`],
            ].map(([label, value]) => (
              <div key={label} className="flex-1 col items-center">
                <div className="fw-600" style={{ fontSize: 17 }}>{value}</div>
                <div className="text-xs faint">{label}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary mt-16" style={{ width: '100%', justifyContent: 'center' }}>Book a Collab</button>
        </div>

        {/* Live analytics */}
        <Section title="Live Analytics">
          <div className="row flex-wrap gap-12" style={{ marginBottom: 12 }}>
            <Mini label="Reach 30d" value={Number(draft.stats.reach).toLocaleString()} />
            <Mini label="Impressions 30d" value={Number(draft.stats.impressions).toLocaleString()} />
            <Mini label="Engagement" value={`${draft.stats.engagement}%`} />
            <Mini label="Followers" value={Number(draft.stats.followers).toLocaleString()} />
          </div>
          <Sparkline data={creator.followerGrowth} height={120} />
          <div className="text-xs faint mt-4">Follower growth</div>
        </Section>

        {/* Audience insights */}
        <Section title="Audience Insights">
          {demoUnlocked ? (
            <div className="row gap-24 flex-wrap">
              <div className="flex-1" style={{ minWidth: 200 }}>
                <div className="text-xs faint fw-600" style={{ marginBottom: 8 }}>AGE</div>
                {Object.entries(d.age).map(([b, p]) => (
                  <BarStat key={b} label={b} pct={p} max={Math.max(...Object.values(d.age))} />
                ))}
              </div>
              <div className="flex-1" style={{ minWidth: 200 }}>
                <div className="text-xs faint fw-600" style={{ marginBottom: 8 }}>GENDER</div>
                <BarStat label="Female" pct={d.gender.female} tone="#c6649b" />
                <BarStat label="Male" pct={d.gender.male} tone="#5b87c6" />
                <div className="text-xs faint fw-600" style={{ margin: '14px 0 8px' }}>TOP COUNTRIES</div>
                {d.topCountries.slice(0, 3).map((c) => (
                  <BarStat key={c.name} label={c.name} pct={c.pct} max={d.topCountries[0].pct} />
                ))}
              </div>
            </div>
          ) : (
            <div className="empty" style={{ padding: 24 }}>🔒 Unlock at {DEMOGRAPHICS_MIN_FOLLOWERS} followers</div>
          )}
        </Section>

        {/* Recent posts */}
        <Section title="Recent Posts">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {creator.recentPosts.slice(0, 8).map((p) => (
              <a
                key={p.id}
                href={p.permalink}
                target="_blank"
                rel="noreferrer"
                title={p.caption}
                style={{
                  aspectRatio: '1 / 1',
                  background: p.image ? `center / cover no-repeat url(${p.image})` : p.tone,
                  borderRadius: 8,
                  display: 'block',
                }}
              />
            ))}
          </div>
        </Section>

        {/* Brand collaborations */}
        {draft.portfolio.length > 0 && (
          <Section title="Brand Collaborations">
            <div className="row flex-wrap gap-8" style={{ marginBottom: 12 }}>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`badge ${cat === c ? 'badge-blue' : 'badge-neutral'}`}
                  style={{ cursor: 'pointer', border: 'none' }}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="row flex-wrap gap-8">
              {collabs.map((p) => (
                <div key={p.id} className="card card-pad row items-center gap-8" style={{ flex: '1 1 160px' }}>
                  <div className="avatar" style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', background: 'var(--surface-alt)' }}>
                    {p.logo ? <img src={p.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏢'}
                  </div>
                  <div>
                    <div className="text-sm fw-600">{p.campaign || p.brand}</div>
                    <div className="text-xs faint">{p.category}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Packages — hidden when the admin turns the section off */}
        {packagesActive && (
        <Section title="Collaboration Packages">
          <div className="row gap-8 flex-wrap">
            {draft.packages.map((p) => (
              <div
                key={p.tier}
                className="card card-pad flex-1"
                style={{ minWidth: 150, position: 'relative', border: p.isPopular ? '2px solid var(--accent)' : undefined }}
              >
                {p.isPopular && (
                  <span className="badge" style={{ position: 'absolute', top: -10, left: 12, background: 'var(--accent)', color: '#fff' }}>
                    ★ Most Popular
                  </span>
                )}
                <div className="fw-600 text-sm">{p.tier}</div>
                <div className="fw-600" style={{ fontSize: 18, margin: '4px 0' }}>₹{Number(p.price).toLocaleString()}</div>
                <div className="text-xs muted">{p.deliverables}</div>
                <div className="text-xs faint mt-8">{p.revisions} revision{p.revisions === 1 ? '' : 's'}</div>
              </div>
            ))}
          </div>
        </Section>
        )}

        {/* Work With Me */}
        <Section title="Work With Me" last>
          <div className="field"><label>Brand name</label><input className="input" disabled placeholder="Your brand" /></div>
          <div className="field"><label>Email</label><input className="input" disabled placeholder="you@brand.com" /></div>
          <div className="field"><label>Brief</label><textarea className="textarea" disabled placeholder="Tell us about the campaign…" /></div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Send enquiry</button>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children, last }) {
  return (
    <div style={{ padding: 20, borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>{title}</h3>
      {children}
    </div>
  )
}

function Mini({ label, value }) {
  return (
    <div style={{ flex: '1 1 110px', minWidth: 100 }}>
      <div className="fw-600" style={{ fontSize: 16 }}>{value}</div>
      <div className="text-xs faint">{label}</div>
    </div>
  )
}
