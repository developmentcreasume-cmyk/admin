import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Badge, { FoundingBadge, SubscriptionBadge } from '../components/Badge.jsx'
import { api } from '../services/api.js'
import ProfileTab from './cardBuilder/ProfileTab.jsx'
import StatsTab from './cardBuilder/StatsTab.jsx'
import AudienceTab from './cardBuilder/AudienceTab.jsx'
import PostsTab from './cardBuilder/PostsTab.jsx'
import PortfolioTab from './cardBuilder/PortfolioTab.jsx'
import PackagesTab from './cardBuilder/PackagesTab.jsx'
import PreviewTab from './cardBuilder/PreviewTab.jsx'

// Public site that serves the live Influence Card (creasume.com/<username>/<publicId>).
const PUBLIC_SITE = (import.meta.env.VITE_PUBLIC_URL || 'https://creasume.com').replace(/\/+$/, '')

const TABS = ['Profile', 'Stats', 'Audience', 'Posts', 'Collaboration', 'Packages', 'Preview']
const TONES = ['#e8eef7', '#f3eae8', '#e8f3ec', '#f5f0e6', '#efe8f3', '#e6f1f3']
const SUB_LABEL = { active: 'Active', trial: 'Trial', inactive: 'Inactive', past_due: 'Past due', canceled: 'Canceled' }

const DEFAULT_PACKAGES = [
  { tier: 'Starter', price: 0, deliverables: '', revisions: 1 },
  { tier: 'Core', price: 0, deliverables: '', revisions: 2 },
  { tier: 'Campaign', price: 0, deliverables: '', revisions: 3 },
]

// Enforce the card rules on a package list: at most ONE per tier, at most 3
// tiers, and at most one "Most Popular". Cleans up any corrupt/legacy data
// (duplicate tiers or multiple popular flags) on load so the UI stays sane.
function sanitizePackages(list) {
  const seen = new Set()
  let popularUsed = false
  const out = []
  for (const p of list || []) {
    const key = (p.tier || '').toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    const isPopular = !!p.isPopular && !popularUsed
    if (isPopular) popularUsed = true
    out.push({ ...p, isPopular })
    if (out.length >= 3) break
  }
  return out
}

// Map the admin detail payload (creator + influencer + cached analytics + growth)
// into the shape the card-builder tabs consume. All data is cached server-side,
// so this is instant — no live Instagram calls on page view.
function adaptDetail(detail) {
  const creatorDoc = detail.creator || {}
  const influencer = detail.influencer || {}
  const analytics = detail.analytics || {}
  const media = analytics.media || []
  const growthArr = detail.growth || []

  const avgLikes = media.length
    ? Math.round(media.reduce((a, m) => a + (m.like_count || 0), 0) / media.length)
    : 0
  const avgComments = media.length
    ? Math.round(media.reduce((a, m) => a + (m.comments_count || 0), 0) / media.length)
    : 0

  // Demographics arrays of {key,value} → objects/arrays the tabs expect.
  const dem = analytics.demographics
  let demographics = null
  if (dem) {
    const ageObj = {}
    ;(dem.age || []).forEach((a) => { ageObj[a.key] = a.value })
    const g = { female: 0, male: 0, other: 0 }
    ;(dem.gender || []).forEach((x) => {
      if (x.key === 'F') g.female = x.value
      else if (x.key === 'M') g.male = x.value
      else g.other += x.value
    })
    demographics = {
      age: ageObj,
      gender: g,
      topCountries: (dem.country || []).map((c) => ({ name: c.key, pct: c.value })),
      topCities: (dem.city || []).map((c) => ({ name: c.key, pct: c.value })),
    }
  }

  return {
    id: creatorDoc._id,
    name: creatorDoc.name || creatorDoc.username || '',
    displayName: creatorDoc.name || creatorDoc.username || '',
    handle: `@${creatorDoc.username || ''}`,
    username: creatorDoc.username,
    // Opaque id used in the public card URL (/<username>/<publicId>). The card
    // resolves STRICTLY by this, so the Preview button needs it.
    publicId: creatorDoc.publicId || '',
    email: creatorDoc.email || '',
    bio: creatorDoc.bio || '',
    niche: creatorDoc.niche || '',
    location: creatorDoc.location || '',
    socialLinks: (creatorDoc.socialLinks || []).map((l) => ({
      platform: l.platform || '',
      url: l.url || '',
    })),
    plan: (creatorDoc.planTier || 'free').replace(/^\w/, (c) => c.toUpperCase()),
    founding: creatorDoc.isFoundingCreator,
    verified: creatorDoc.isVerified,
    cardActive: creatorDoc.cardActive,
    slug: creatorDoc.slug || '',
    subscription: SUB_LABEL[creatorDoc.subscriptionStatus] || 'Inactive',
    lastRefresh: creatorDoc.lastRefreshAt
      ? new Date(creatorDoc.lastRefreshAt).toLocaleString()
      : influencer?.lastFetchedAt
      ? new Date(influencer.lastFetchedAt).toLocaleString()
      : '—',
    instagram: {
      connected: !!influencer?.connected,
      accountType: influencer?.accountType || null,
      connectedDate: influencer?.connectedAt ? new Date(influencer.connectedAt).toLocaleDateString() : null,
      tokenValidUntil: influencer?.tokenExpiresAt ? new Date(influencer.tokenExpiresAt).toLocaleDateString() : null,
    },
    stats: {
      followers: influencer.followersCount || 0,
      following: influencer.followsCount || 0,
      posts: influencer.mediaCount || 0,
      engagement: analytics.engagementRate || 0,
      reach: analytics.reach || 0,
      impressions: analytics.views || 0,
      avgLikes,
      avgComments,
    },
    demographics,
    followerGrowth: growthArr,
    recentPosts: media.map((m, i) => ({
      id: m.id,
      tone: TONES[i % TONES.length],
      // VIDEO/REEL items have no media_url image — use thumbnail_url for the preview.
      image: m.media_type === 'VIDEO' ? m.thumbnail_url || m.media_url : m.media_url || m.thumbnail_url,
      caption: m.caption || '',
      type: m.media_type === 'VIDEO' ? 'REEL' : m.media_type === 'CAROUSEL_ALBUM' ? 'CAROUSEL' : 'IMAGE',
      permalink: m.permalink,
      likes: m.like_count || 0,
      comments: m.comments_count || 0,
      saves: m.saved || 0,
      shares: m.shares || 0,
    })),
  }
}

export default function CreatorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [creator, setCreator] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [tab, setTab] = useState('Profile')
  const [founding, setFounding] = useState(false)
  const [verified, setVerified] = useState(false)
  const [savingBadges, setSavingBadges] = useState(false)
  const [cardActive, setCardActive] = useState(false)
  const [slug, setSlug] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [draft, setDraft] = useState(null)

  // Returning from the Instagram OAuth flow (?ig=connected|error): show a
  // message and strip the param so a refresh doesn't repeat it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ig = params.get('ig')
    if (!ig) return
    flash(ig === 'connected' ? 'Instagram connected ✓' : 'Instagram connection failed')
    navigate(`/creators/${id}`, { replace: true })
  }, [id, navigate])

  // Load admin detail + public live data, then build the adapter object.
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const detail = await api.creator(id)
        const c = detail.creator

        // All analytics are cached server-side — instant, no live IG calls here.
        const adapted = adaptDetail(detail)
        if (cancelled) return

        setCreator(adapted)
        setFounding(adapted.founding)
        setVerified(adapted.verified || adapted.founding)
        setCardActive(adapted.cardActive)
        setSlug(adapted.slug)
        setDraft({
          niche: adapted.niche,
          location: adapted.location,
          bio: adapted.bio,
          socialLinks: adapted.socialLinks,
          stats: { ...adapted.stats, ...(c.statOverrides || {}) },
          portfolio: (detail.collaborations || []).map((col) => ({
            id: col._id,
            brand: col.brandName,
            campaign: col.campaignTitle,
            description: col.description || '',
            category: col.category || '',
            link: col.link || '',
            logo: col.logo || '',
            // Linked IG collab post + fetched metrics (preserved across edits).
            instagramUrl: col.instagramUrl || '',
            mediaId: col.mediaId || '',
            mediaType: col.mediaType || '',
            postImage: col.postImage || '',
            postCaption: col.postCaption || '',
            reach: col.reach || 0,
            views: col.views || 0,
            likes: col.likes || 0,
            comments: col.comments || 0,
            saves: col.saves || 0,
            shares: col.shares || 0,
            engagementRate: col.engagementRate || 0,
            metricsFetchedAt: col.metricsFetchedAt || null,
          })),
          packages: (detail.packages || []).length
            ? sanitizePackages(
                detail.packages.map((p) => ({
                  tier: (p.tier || p.title || '').replace(/^\w/, (ch) => ch.toUpperCase()),
                  price: p.pricing || 0,
                  deliverables: (p.deliverables || []).join(', '),
                  revisions: p.revisions || 0,
                  isPopular: !!p.isPopular,
                })),
              )
            : DEFAULT_PACKAGES,
          // Per-card "show on public card" toggles (key → boolean). Missing/true
          // = shown, false = hidden. The public Influence Card reads this.
          metricVisibility: c.metricVisibility || {},
        })
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  function toggleFounding() {
    setFounding((v) => {
      const next = !v
      if (next) setVerified(true)
      return next
    })
  }
  function toggleVerified() {
    setVerified((v) => !v)
  }

  function flash(msg) {
    setSavedMsg(msg)
    setTimeout(() => setSavedMsg(''), 2200)
  }

  async function saveBadges() {
    setSavingBadges(true)
    try {
      const res = await api.updateCreator(id, {
        isFoundingCreator: founding,
        isVerified: verified,
        cardActive,
        slug: slug.trim() || undefined,
      })
      setFounding(res.creator.isFoundingCreator)
      setVerified(res.creator.isVerified)
      setCardActive(res.creator.cardActive)
      if (res.creator.slug) setSlug(res.creator.slug)
      flash('Saved')
    } catch (err) {
      flash(err.message || 'Save failed')
    } finally {
      setSavingBadges(false)
    }
  }

  async function refresh() {
    setRefreshing(true)
    try {
      // Server does the live IG fetch + caches it, then we re-read the cache.
      await api.refreshCreator(id)
      const detail = await api.creator(id)
      setCreator(adaptDetail(detail))
      flash('Instagram data refreshed')
    } catch (err) {
      flash(err.message || 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  // Permanently delete this creator and all of their data, then go back to the list.
  async function deleteAccount() {
    const name = creator?.name || 'this creator'
    if (!window.confirm(
      `Delete ${name}'s account permanently?\n\nThis removes their Instagram link, analytics, collaborations, packages and inquiries, and takes their public page offline. This cannot be undone.`
    )) return
    setDeleting(true)
    try {
      await api.deleteCreator(id)
      navigate('/creators', { replace: true })
    } catch (err) {
      flash(err.message || 'Delete failed')
      setDeleting(false)
    }
  }

  // Persist the whole card builder (overrides + portfolio + packages).
  async function saveCard(publish) {
    try {
      // Stat overrides: only send values the admin changed from the live ones.
      const overrides = {}
      for (const k of Object.keys(draft.stats)) {
        if (String(draft.stats[k]) !== String(creator.stats[k])) {
          overrides[k] = Number(draft.stats[k]) || 0
        }
      }
      await api.saveStats(id, overrides, draft.metricVisibility || {})
      await api.savePortfolio(id, draft.portfolio)
      await api.savePackages(id, draft.packages)
      // Persist niche/location/bio overrides too.
      await api.updateCreator(id, {
        niche: draft.niche,
        location: draft.location,
        bio: draft.bio,
        // Persist the social-links list (blank rows are dropped server-side).
        socialLinks: (draft.socialLinks || []).filter((l) => l.platform && l.url.trim()),
      })
      await api.publishCard(id, !publish)
      flash(publish ? 'Card published' : 'Draft saved')
    } catch (err) {
      flash(err.message || 'Save failed')
    }
  }

  if (loading) return <div className="empty">Loading creator…</div>
  if (error) {
    return (
      <div className="empty">
        {error}{' '}
        <button className="btn btn-sm" onClick={() => navigate('/creators')}>Back to creators</button>
      </div>
    )
  }
  if (!creator) {
    return (
      <div className="empty">
        Creator not found. <button className="btn btn-sm" onClick={() => navigate('/creators')}>Back to creators</button>
      </div>
    )
  }

  return (
    <div>
      <button className="btn btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/creators')}>
        ← Creators
      </button>

      <div className="page-head">
        <div className="row items-center gap-16">
          <span className="avatar" style={{ width: 52, height: 52, fontSize: 18 }}>
            {creator.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
          </span>
          <div>
            <h1 style={{ marginBottom: 2 }}>{creator.name}</h1>
            <div className="row items-center gap-8 flex-wrap">
              <span className="muted text-sm">{creator.handle}</span>
              <Badge tone="neutral">{creator.plan}</Badge>
              {founding && <FoundingBadge />}
              <SubscriptionBadge status={creator.subscription} />
            </div>
            {creator.email && (
              <div className="text-sm" style={{ marginTop: 4, color: 'var(--text-soft, #52525b)' }}>{creator.email}</div>
            )}
          </div>
        </div>
        <div className="row items-center gap-8">
          {creator.username && creator.publicId && (
            <a
              className="btn"
              href={`${PUBLIC_SITE}/${encodeURIComponent(creator.username)}/${creator.publicId}`}
              target="_blank"
              rel="noopener noreferrer"
              title={cardActive ? 'Open the live public card' : 'Card is inactive — turn “Public Influence Card” on to make it live'}
            >
              👁 Preview card
            </a>
          )}
          <button className="btn" onClick={refresh} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : '↻ Refresh Instagram data'}
          </button>
          <button className="btn btn-danger" onClick={deleteAccount} disabled={deleting}>
            {deleting ? 'Deleting…' : '🗑 Delete account'}
          </button>
        </div>
      </div>

      {/* Management controls */}
      <div className="card card-pad row flex-wrap items-end" style={{ marginBottom: 22, columnGap: 20, rowGap: 18 }}>
        <ControlToggle label="Founding Creator badge" on={founding} onText="Assigned" offText="Not assigned" onToggle={toggleFounding} />
        <Divider />
        <ControlToggle label="Verified tick" on={verified} onText="Verified" offText="Not verified" onToggle={toggleVerified} />
        <Divider />
        <ControlToggle label="Public Influence Card" on={cardActive} onText="Active" offText="Inactive" onToggle={() => setCardActive((v) => !v)} />
        <Divider />
        <div style={{ minWidth: 220 }}>
          <label className="text-xs fw-600 muted" style={{ display: 'block', marginBottom: 8 }}>Public URL slug</label>
          <div className="row items-center gap-8">
            <span className="text-sm faint">creasume.com/</span>
            <input className="input" style={{ maxWidth: 160 }} value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
        </div>
        <div className="row items-center gap-8" style={{ marginLeft: 'auto' }}>
          {savedMsg && <span className="badge badge-green">{savedMsg}</span>}
          <button className="btn btn-sm btn-primary" onClick={saveBadges} disabled={savingBadges}>
            {savingBadges ? 'Saving…' : 'Save controls'}
          </button>
        </div>
      </div>

      {/* Instagram connection */}
      <InstagramPanel creatorId={id} ig={creator.instagram} onRefresh={refresh} refreshing={refreshing} />

      {/* Influence Card Builder */}
      <div className="card">
        <div className="row items-center justify-between flex-wrap gap-12" style={{ borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
          <div className="tabbar">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  border: 'none', background: 'none', padding: '14px 14px', fontSize: 13.5, fontWeight: 600,
                  whiteSpace: 'nowrap',
                  color: tab === t ? 'var(--text)' : 'var(--text-soft)',
                  borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1,
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="row items-center gap-8 flex-wrap">
            {savedMsg && <span className="badge badge-green">{savedMsg}</span>}
            <button className="btn btn-sm" onClick={() => saveCard(false)}>Save draft</button>
            <button className="btn btn-sm btn-primary" onClick={() => saveCard(true)}>Publish</button>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {tab === 'Profile' && <ProfileTab creator={creator} draft={draft} setDraft={setDraft} />}
          {tab === 'Stats' && <StatsTab creator={creator} draft={draft} setDraft={setDraft} />}
          {tab === 'Audience' && <AudienceTab creator={creator} />}
          {tab === 'Posts' && <PostsTab creator={creator} />}
          {tab === 'Collaboration' && <PortfolioTab creatorId={id} draft={draft} setDraft={setDraft} />}
          {tab === 'Packages' && <PackagesTab draft={draft} setDraft={setDraft} />}
          {tab === 'Preview' && <PreviewTab creator={creator} draft={draft} packagesActive={(draft?.packages || []).length > 0} />}
        </div>
      </div>
    </div>
  )
}

function InstagramPanel({ creatorId, ig, onRefresh, refreshing }) {
  // Kick off the Instagram OAuth flow for this creator. The backend redirects
  // back to /creators/:id?ig=connected once the token is linked.
  function connect() {
    window.location.href = api.instagramConnectUrl(creatorId)
  }

  if (!ig?.connected) {
    return (
      <div className="card card-pad row items-center justify-between flex-wrap gap-12" style={{ marginBottom: 22 }}>
        <div className="row items-center gap-12">
          <span style={{ fontSize: 22 }}>📷</span>
          <div>
            <div className="fw-600 text-sm">Instagram not connected</div>
            <div className="text-xs muted">
              Connect via Instagram OAuth to pull live analytics. Business or Creator accounts only — personal accounts aren’t supported.
            </div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={connect}>
          Connect Instagram
        </button>
      </div>
    )
  }

  return (
    <div className="card card-pad row items-center justify-between flex-wrap gap-16" style={{ marginBottom: 22 }}>
      <div className="row items-center gap-12">
        <span style={{ fontSize: 22 }}>📷</span>
        <div>
          <div className="row items-center gap-8">
            <span className="fw-600 text-sm">Instagram connected</span>
            <span className="badge badge-green">● Live</span>
            {ig.accountType && <span className="badge badge-neutral">{ig.accountType} account</span>}
          </div>
          <div className="text-xs muted mt-4">
            {ig.connectedDate ? `Connected ${ig.connectedDate} · ` : ''}
            {ig.tokenValidUntil ? `Token valid until ${ig.tokenValidUntil} · ` : ''}read-only access
          </div>
        </div>
      </div>
      <div className="row items-center gap-8 flex-wrap">
        <button className="btn" onClick={connect}>Reconnect</button>
        <button className="btn" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing…' : '↻ Refresh data'}
        </button>
      </div>
    </div>
  )
}

function Divider() {
  return <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border)', flexShrink: 0 }} />
}

function ControlToggle({ label, on, onText, offText, onToggle, disabled = false }) {
  return (
    <div style={{ flexShrink: 0, ...(disabled ? { opacity: 0.6 } : null) }}>
      <div className="text-xs fw-600 muted" style={{ marginBottom: 8, whiteSpace: 'nowrap' }}>{label}</div>
      <button
        className="row items-center gap-8"
        onClick={onToggle}
        disabled={disabled}
        style={{ border: 'none', background: 'none', padding: 0, whiteSpace: 'nowrap', cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <span style={{ width: 36, height: 20, borderRadius: 12, background: on ? 'var(--green)' : 'var(--border-strong)', position: 'relative', transition: 'background 0.15s' }}>
          <span style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
        </span>
        <span className="text-sm fw-600">{on ? onText : offText}</span>
      </button>
    </div>
  )
}
