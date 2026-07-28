import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Badge, { FoundingBadge, SubscriptionBadge, BroughtByBadge } from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { api, API_BASE } from '../services/api.js'
import ProfileTab from './cardBuilder/ProfileTab.jsx'
import StatsTab from './cardBuilder/StatsTab.jsx'
import AudienceTab from './cardBuilder/AudienceTab.jsx'
import PostsTab from './cardBuilder/PostsTab.jsx'
import PortfolioTab from './cardBuilder/PortfolioTab.jsx'
import PackagesTab from './cardBuilder/PackagesTab.jsx'
import PreviewTab from './cardBuilder/PreviewTab.jsx'

// Public site that serves the live Influence Card. Cards resolve by username,
// slug, OR publicId (see Creator.findByHandle), so creasume.com/<username> is
// the canonical shareable link now — the longer <username>/<publicId> form
// still works too, for any links already shared before this changed.
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
    // Brand attribution — when set, replaces the Founding badge on the public
    // card with a "Brought by <name>" badge tinted from the brand's logo.
    brandName: creatorDoc.broughtByBrand?.name || '',
    brandHasLogo: !!creatorDoc.broughtByBrand?.hasLogo,
    brandColor: creatorDoc.broughtByBrand?.color || null,
    cardActive: creatorDoc.cardActive,
    slug: creatorDoc.slug || '',
    // Benchmark reward (Creasume Score raw points hit 500 → admin verifies → coupon).
    benchmarkStatus: creatorDoc.benchmarkStatus || 'none',
    benchmarkRawPoints: creatorDoc.benchmarkRawPoints || 0,
    benchmarkHitAt: creatorDoc.benchmarkHitAt || null,
    benchmarkCouponCode: creatorDoc.benchmarkCouponCode || null,
    benchmarkBrandName: creatorDoc.benchmarkBrandName || null,
    benchmarkBrandWebsite: creatorDoc.benchmarkBrandWebsite || null,
    benchmarkDiscountPercent: creatorDoc.benchmarkDiscountPercent ?? null,
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
  const [brandName, setBrandName] = useState('')
  const [brandHasLogo, setBrandHasLogo] = useState(false)
  const [brandColor, setBrandColor] = useState(null)
  // Cache-busts the logo image URL below — MUST change on every save (unlike
  // `brandColor`, which two different logos can coincidentally share), or a
  // re-uploaded logo can keep showing the browser/CDN-cached old image.
  const [brandUpdatedAt, setBrandUpdatedAt] = useState(null)
  // Pending logo pick: null = unchanged, a data: URL = a newly picked file.
  const [brandLogoDataUrl, setBrandLogoDataUrl] = useState(null)
  const [brandLogoErr, setBrandLogoErr] = useState('')
  const [cardActive, setCardActive] = useState(false)
  const [slug, setSlug] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
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
        setBrandName(adapted.brandName)
        setBrandHasLogo(adapted.brandHasLogo)
        setBrandColor(adapted.brandColor)
        setBrandUpdatedAt(c.updatedAt || null)
        setBrandLogoDataUrl(null)
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

  // Brand logo picking (mirrors the creator-side banner uploader): read the
  // file as a data: URL client-side, then send it on "Save controls" — the
  // backend compresses it and re-derives `brandColor` from its pixels.
  function pickBrandLogo(e) {
    const file = e.target.files && e.target.files[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    setBrandLogoErr('')
    if (!/^image\//.test(file.type)) { setBrandLogoErr('Please choose an image file.'); return }
    if (file.size > 3 * 1024 * 1024) { setBrandLogoErr('Logo must be under 3 MB.'); return }
    const reader = new FileReader()
    reader.onload = () => setBrandLogoDataUrl(reader.result)
    reader.onerror = () => setBrandLogoErr('Could not read that file.')
    reader.readAsDataURL(file)
  }

  // Clears the brand name/logo/color locally (badge disappears immediately —
  // falls back to the Founding badge if that's set). Only takes effect on the
  // backend once "Save controls" is pressed, same as every other field here.
  function cancelBrandAttribution() {
    setBrandName('')
    setBrandLogoDataUrl(null)
    setBrandHasLogo(false)
    setBrandColor(null)
    setBrandLogoErr('')
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
        broughtByBrandName: brandName.trim(),
        ...(brandLogoDataUrl ? { broughtByBrandLogo: brandLogoDataUrl } : {}),
      })
      setFounding(res.creator.isFoundingCreator)
      setVerified(res.creator.isVerified)
      setCardActive(res.creator.cardActive)
      if (res.creator.slug) setSlug(res.creator.slug)
      setBrandName(res.creator.broughtByBrand?.name || '')
      setBrandHasLogo(!!res.creator.broughtByBrand?.hasLogo)
      setBrandColor(res.creator.broughtByBrand?.color || null)
      setBrandUpdatedAt(res.creator.updatedAt || null)
      setBrandLogoDataUrl(null)
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

  const [benchmarkBusy, setBenchmarkBusy] = useState(false)

  // Inquiries viewer — lets the admin check this creator's actual brand inquiries
  // (the fakeable score levers) while verifying a benchmark reward.
  const [showInquiries, setShowInquiries] = useState(false)
  const [inquiries, setInquiries] = useState(null) // null = not loaded yet
  function openInquiries() {
    setShowInquiries(true)
    if (inquiries) return
    api.creatorInquiries(id)
      .then((res) => setInquiries(res.data || []))
      .catch((err) => { flash(err.message || 'Could not load inquiries'); setInquiries([]) })
  }

  // Which benchmark action is awaiting confirmation in the card: 'approve' | 'reject' | null.
  const [confirmAction, setConfirmAction] = useState(null)

  // Partner coupon approval is completed in the Benchmark tab, where the admin
  // can enter the brand, code, discount and redemption website.
  // Reject the milestone (looks faked / not eligible) — no coupon granted.
  async function doRejectBenchmark() {
    setBenchmarkBusy(true)
    try {
      await api.rejectBenchmark(id)
      setCreator((c) => ({ ...c, benchmarkStatus: 'rejected' }))
      flash('Milestone rejected')
      setConfirmAction(null)
    } catch (err) {
      flash(err.message || 'Reject failed')
    } finally {
      setBenchmarkBusy(false)
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
              {brandName ? <BroughtByBadge name={brandName} color={brandColor} /> : founding ? <FoundingBadge /> : null}
              <SubscriptionBadge status={creator.subscription} />
            </div>
            {creator.email && (
              <div className="text-sm" style={{ marginTop: 4, color: 'var(--text-soft, #52525b)' }}>{creator.email}</div>
            )}
          </div>
        </div>
        <div className="row items-center gap-8">
          {creator.username && (
            <a
              className="btn"
              href={`${PUBLIC_SITE}/${encodeURIComponent(creator.username)}`}
              target="_blank"
              rel="noopener noreferrer"
              title={cardActive ? 'Open the live public card' : 'Card is inactive — turn “Public Influence Card” on to make it live'}
            >
              👁 Preview card
            </a>
          )}
          <button className="btn" onClick={openInquiries}>✉ View inquiries</button>
          <button className="btn" onClick={refresh} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : '↻ Refresh Instagram data'}
          </button>
          <button className="btn btn-danger" onClick={deleteAccount} disabled={deleting}>
            {deleting ? 'Deleting…' : '✕ Delete account'}
          </button>
        </div>
      </div>

      {/* Benchmark reward — shows only once the creator has hit the 500 benchmark */}
      {creator.benchmarkStatus && creator.benchmarkStatus !== 'none' && (
        <div
          className="card card-pad"
          style={{
            marginBottom: 22,
            border: '1px solid',
            borderColor:
              creator.benchmarkStatus === 'pending_review' ? '#e0a43b'
              : creator.benchmarkStatus === 'rewarded' ? '#22c55e' : 'var(--border)',
            background:
              creator.benchmarkStatus === 'pending_review' ? 'rgba(224,164,59,0.08)'
              : creator.benchmarkStatus === 'rewarded' ? 'rgba(34,197,94,0.08)' : 'transparent',
          }}
        >
          <div className="row items-center justify-between flex-wrap gap-12">
            <div>
              <div className="row items-center gap-8">
                <strong style={{ fontSize: 15 }}>⚡ Benchmark reward</strong>
                <Badge tone={
                  creator.benchmarkStatus === 'pending_review' ? 'amber'
                  : creator.benchmarkStatus === 'rewarded' ? 'green' : 'neutral'
                }>
                  {creator.benchmarkStatus === 'pending_review' ? 'Pending review'
                    : creator.benchmarkStatus === 'rewarded' ? 'Rewarded' : 'Rejected'}
                </Badge>
              </div>
              <div className="text-sm muted" style={{ marginTop: 6 }}>
                {creator.benchmarkStatus === 'pending_review' && (
                  <>Hit <strong>{creator.benchmarkRawPoints}/500</strong> raw points. <span style={{ color: '#c98a1a' }}>Verify their brand inquiries &amp; accepted deals (Collaboration tab + Enquiries page) are genuine before rewarding.</span></>
                )}
                {creator.benchmarkStatus === 'rewarded' && (
                  <>{creator.benchmarkBrandName || 'Partner brand'} coupon: <strong style={{ letterSpacing: 0.5 }}>{creator.benchmarkCouponCode || '—'}</strong>{creator.benchmarkDiscountPercent ? ` (${creator.benchmarkDiscountPercent}% off)` : ''} — redeemable on the brand website.</>
                )}
                {creator.benchmarkStatus === 'rejected' && <>Milestone rejected — no coupon granted.</>}
              </div>
            </div>
            {creator.benchmarkStatus === 'pending_review' && (
              <div className="row items-center gap-8">
                <button className="btn btn-sm" onClick={openInquiries}>Review inquiries</button>
                <button className="btn btn-sm" onClick={() => setConfirmAction('reject')} disabled={benchmarkBusy}>Reject</button>
                <button className="btn btn-sm btn-primary" onClick={() => navigate('/benchmark')} disabled={benchmarkBusy}>
                  Add partner coupon
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inquiries viewer — this creator's brand inquiries, for fraud-checking. */}
      <Modal
        open={showInquiries}
        title={`Inquiries — ${creator.name}`}
        onClose={() => setShowInquiries(false)}
        maxWidth={600}
      >
        {inquiries === null ? (
          <div className="empty">Loading inquiries…</div>
        ) : inquiries.length === 0 ? (
          <div className="empty">No inquiries yet.</div>
        ) : (
          <>
            {(() => {
            // Fraud signals: (1) how concentrated inquiries are on one sender,
            // (2) how high the acceptance rate is. Genuine brand demand comes from
            // MANY different emails and is NOT ~all accepted; self-sent fakes are
            // dominated by one/few addresses and accepted almost every time.
            const total = inquiries.length
            const accepted = inquiries.filter((q) => q.status === 'actioned').length
            const acceptRate = total ? Math.round((accepted / total) * 100) : 0

            const emailCounts = {}
            inquiries.forEach((q) => {
              const e = (q.email || '').toLowerCase().trim()
              if (e) emailCounts[e] = (emailCounts[e] || 0) + 1
            })
            const uniq = Object.keys(emailCounts).length
            const topCount = Object.values(emailCounts).reduce((m, n) => Math.max(m, n), 0)
            const topShare = total ? Math.round((topCount / total) * 100) : 0

            const concentrated = total >= 3 && topShare >= 40   // one sender dominates
            const highAccept = total >= 3 && acceptRate >= 80     // implausibly high closes
            const suspicious = concentrated || highAccept

            return (
              <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                <div className="row items-center gap-8 flex-wrap">
                  <Badge tone="neutral">{total} total</Badge>
                  <Badge tone={highAccept ? 'red' : 'green'}>{accepted} accepted · {acceptRate}%</Badge>
                  <Badge tone={concentrated ? 'red' : 'blue'}>{uniq} {uniq === 1 ? 'sender' : 'senders'}</Badge>
                  <Badge tone={concentrated ? 'red' : 'neutral'}>top sender {topShare}%</Badge>
                </div>
                {suspicious ? (
                  <div
                    className="text-sm"
                    style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, color: '#b42222', background: 'rgba(180,34,34,0.08)', border: '1px solid rgba(180,34,34,0.25)' }}
                  >
                    ⚠ Looks faked —{' '}
                    {concentrated && `${topShare}% of inquiries come from a single email`}
                    {concentrated && highAccept && '; '}
                    {highAccept && `${acceptRate}% were accepted`}
                    . Real brand demand comes from many different senders and isn't nearly all accepted. Consider rejecting.
                  </div>
                ) : (
                  <div className="text-xs faint" style={{ marginTop: 8 }}>
                    Spread across {uniq} senders with a {acceptRate}% accept rate — looks organic.
                  </div>
                )}
              </div>
            )
          })()}

            <div className="col gap-10">
              {inquiries.map((q) => (
                <div
                  key={q._id}
                  className="card-pad"
                  style={{ background: 'var(--surface-alt)', borderRadius: 10, border: '1px solid var(--border)' }}
                >
                  <div className="row items-start justify-between gap-8">
                    <div style={{ minWidth: 0 }}>
                      <div className="fw-600">{q.brandName || 'Unnamed brand'}</div>
                      <div className="text-xs muted" style={{ marginTop: 2, wordBreak: 'break-word' }}>
                        {q.email || 'no email'}
                      </div>
                    </div>
                    <Badge tone={q.status === 'actioned' ? 'green' : q.status === 'reviewed' ? 'amber' : 'blue'}>
                      {(q.status || 'pending').replace(/^\w/, (c) => c.toUpperCase())}
                    </Badge>
                  </div>
                  {q.brief && (
                    <div className="text-sm" style={{ marginTop: 8, color: 'var(--text)' }}>{q.brief}</div>
                  )}
                  <div className="text-xs faint" style={{ marginTop: 8 }}>
                    {q.campaignType || 'general'} · {new Date(q.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Modal>

      {/* Benchmark rejection confirmation card. */}
      <ConfirmDialog
        open={confirmAction === 'reject'}
        title="Reject this milestone?"
        message={"No coupon will be granted. Use this if the inquiries or accepted deals look faked."}
        confirmLabel="Reject milestone"
        tone="danger"
        busy={benchmarkBusy}
        onConfirm={doRejectBenchmark}
        onClose={() => setConfirmAction(null)}
      />

      {/* Management controls */}
      <div className="card card-pad row flex-wrap items-end" style={{ marginBottom: 22, columnGap: 20, rowGap: 18 }}>
        <ControlToggle label="Founding Creator badge" on={founding} onText="Assigned" offText="Not assigned" onToggle={toggleFounding} />
        <Divider />
        <ControlToggle label="Verified tick" on={verified} onText="Verified" offText="Not verified" onToggle={toggleVerified} />
        <Divider />
        <ControlToggle label="Public Influence Card" on={cardActive} onText="Active" offText="Inactive" onToggle={() => setCardActive((v) => !v)} />
        <Divider />
        <div style={{ minWidth: 260 }}>
          <label className="text-xs fw-600 muted" style={{ display: 'block', marginBottom: 8 }}>
            Managed by a brand <span className="faint">(overrides the Founding badge)</span>
          </label>
          <div className="row items-center gap-8">
            <input
              className="input"
              style={{ maxWidth: 180 }}
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Brand name"
            />
            <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
              {brandLogoDataUrl || brandHasLogo ? 'Change logo' : 'Upload logo'}
              <input type="file" accept="image/*" onChange={pickBrandLogo} className="hidden" style={{ display: 'none' }} />
            </label>
            {(brandLogoDataUrl || (brandHasLogo && creator.publicId)) && (
              <img
                // `?v=updatedAt` busts the browser's cache on this fixed URL —
                // the route is served with a 1hr Cache-Control, so without a
                // changing query param a re-uploaded logo could keep showing
                // the OLD cached image. Uses `updatedAt` (not `color`) because
                // two different logos can coincidentally extract the same color.
                src={brandLogoDataUrl || `${API_BASE}/public/brand-logo/${creator.publicId}?v=${encodeURIComponent(brandUpdatedAt || '')}`}
                alt="Brand logo"
                style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--border)' }}
              />
            )}
            {(brandName || brandHasLogo || brandLogoDataUrl) && (
              <button type="button" className="btn btn-sm" onClick={cancelBrandAttribution}>
                Cancel
              </button>
            )}
          </div>
          <p className="text-xs faint" style={{ marginTop: 6 }}>
            The badge color is auto-picked from the logo — no need to set one manually.
          </p>
          {brandLogoErr && <p className="text-xs" style={{ marginTop: 4, color: '#dc2626' }}>{brandLogoErr}</p>}
        </div>
        <Divider />
        <div style={{ minWidth: 240 }}>
          <label className="text-xs fw-600 muted" style={{ display: 'block', marginBottom: 8 }}>Card link</label>
          {(creator.username || creator.publicId) ? (
            (() => {
              // The shareable card URL — resolves by username, vanity slug, or
              // publicId (see Creator.findByHandle), so the short
              // creasume.com/<username> form is the canonical link now.
              const cardUrl = creator.username
                ? `${PUBLIC_SITE}/${encodeURIComponent(creator.username)}`
                : `${PUBLIC_SITE}/${creator.publicId}`
              const copy = () => {
                navigator.clipboard?.writeText(cardUrl).then(() => {
                  setLinkCopied(true)
                  setTimeout(() => setLinkCopied(false), 1500)
                }).catch(() => {})
              }
              return (
                <div className="row items-center gap-8">
                  <a href={cardUrl} target="_blank" rel="noopener noreferrer" className="text-sm" style={{ wordBreak: 'break-all' }}>
                    {cardUrl.replace(/^https?:\/\//, '')}
                  </a>
                  <button type="button" className="btn btn-sm" onClick={copy}>{linkCopied ? 'Copied!' : 'Copy'}</button>
                </div>
              )
            })()
          ) : (
            <span className="text-sm faint">No card link yet (creator hasn’t finished setup).</span>
          )}
          <label className="text-xs fw-600 muted" style={{ display: 'block', margin: '14px 0 8px' }}>Vanity slug <span className="faint">(optional)</span></label>
          <div className="row items-center gap-8">
            <span className="text-sm faint">creasume.com/</span>
            <input className="input" style={{ maxWidth: 160 }} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="optional" />
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
