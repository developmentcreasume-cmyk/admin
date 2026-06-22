/**
 * Mock data used throughout the admin dashboard.
 * Swap these arrays for real API responses when wiring the backend.
 *
 * Fields mirror what the platform fetches from the Meta / Instagram Graph API
 * after a creator connects via OAuth:
 *   - Profile: username, display name, bio, photo, followers, following, media count
 *   - Live analytics (30d): reach, impressions, engagement rate
 *   - Per-post engagement: likes, comments, saves, shares
 *   - Audience demographics (unlocked at 100+ followers)
 *   - Recent posts (up to 12)
 *   - Follower growth (daily snapshots, stored by us from connect date)
 * Admin-entered data (portfolio, packages, niche/location overrides) is separate.
 */

export const waitlist = [
  { id: 'w1', name: 'Aarav Mehta', handle: '@aarav.shoots', email: 'aarav@example.com', niche: 'Photography', date: '2026-05-21', founding: true },
  { id: 'w2', name: 'Diya Kapoor', handle: '@diyaeats', email: 'diya@example.com', niche: 'Food', date: '2026-05-20', founding: false },
  { id: 'w3', name: 'Kabir Singh', handle: '@kabirfit', email: 'kabir@example.com', niche: 'Fitness', date: '2026-05-19', founding: false },
  { id: 'w4', name: 'Ananya Rao', handle: '@ananya.travels', email: 'ananya@example.com', niche: 'Travel', date: '2026-05-18', founding: true },
  { id: 'w5', name: 'Vihaan Joshi', handle: '@vihaan.tech', email: 'vihaan@example.com', niche: 'Tech', date: '2026-05-17', founding: false },
  { id: 'w6', name: 'Ishita Nair', handle: '@ishita.style', email: 'ishita@example.com', niche: 'Fashion', date: '2026-05-16', founding: false },
  { id: 'w7', name: 'Rohan Das', handle: '@rohan.gaming', email: 'rohan@example.com', niche: 'Gaming', date: '2026-05-15', founding: false },
  { id: 'w8', name: 'Sara Iyer', handle: '@sara.beauty', email: 'sara@example.com', niche: 'Beauty', date: '2026-05-14', founding: true },
]

// ---- helpers to synthesise plausible fetched data -------------------------

function growthSeries(end, days, swing) {
  // Daily follower snapshots trending up to `end`.
  const out = []
  let v = Math.round(end * 0.82)
  const step = (end - v) / (days - 1)
  for (let i = 0; i < days; i++) {
    const wobble = Math.round((((i * 9301 + 49297) % 233) / 233 - 0.5) * swing)
    out.push(Math.max(0, Math.round(v + wobble)))
    v += step
  }
  out[out.length - 1] = end
  return out
}

function makePosts(prefix, base, tones) {
  const captions = [
    'Behind the scenes from this week ✨',
    'New drop is live — link in bio',
    'Golden hour never misses 🌅',
    'Answering your most-asked question',
    'Collab reveal you didn’t see coming',
    'Saving this one for later? 📌',
    'A little weekend reset',
    'Swipe for the full breakdown →',
    'This took 3 takes to get right 😅',
    'Tag someone who needs this',
    'Quick tip that changed everything',
    'Grateful for this community 🤍',
  ]
  return captions.map((cap, i) => ({
    id: `${prefix}_${i + 1}`,
    tone: tones[i % tones.length],
    caption: cap,
    type: i % 4 === 0 ? 'REEL' : i % 3 === 0 ? 'CAROUSEL' : 'IMAGE',
    permalink: `https://instagram.com/p/${prefix}${i + 1}`,
    likes: Math.round(base * (0.7 + (i % 5) * 0.12)),
    comments: Math.round(base * 0.03 * (1 + (i % 3) * 0.3)),
    saves: Math.round(base * 0.05 * (1 + (i % 4) * 0.2)),
    shares: Math.round(base * 0.02 * (1 + (i % 2) * 0.5)),
  }))
}

const TONES = ['#e8eef7', '#f3eae8', '#e8f3ec', '#f5f0e6', '#efe8f3', '#e6f1f3']

// ---- creators -------------------------------------------------------------

export const creators = [
  {
    id: 'c1',
    name: 'Ananya Rao',
    displayName: 'Ananya Rao',
    handle: '@ananya.travels',
    email: 'ananya@example.com',
    bio: 'Travel storyteller 🌍 · 30+ countries · Sharing hidden stays & honest guides.',
    niche: 'Travel',
    location: 'Mumbai, IN',
    plan: 'Campaign',
    founding: true,
    cardActive: true,
    slug: 'ananya',
    subscription: 'Active',
    lastRefresh: '2026-05-28 09:14',
    instagram: { connected: true, accountType: 'Business', connectedDate: '2026-03-02', tokenValidUntil: '2026-07-01' },
    stats: { followers: 184000, following: 612, posts: 940, engagement: 4.8, avgLikes: 8800, avgComments: 210, reach: 320000, impressions: 540000 },
    demographics: {
      age: { '13-17': 3, '18-24': 31, '25-34': 38, '35-44': 17, '45-54': 7, '55-64': 3, '65+': 1 },
      gender: { female: 58, male: 40, other: 2 },
      topCountries: [{ name: 'India', pct: 54 }, { name: 'United States', pct: 14 }, { name: 'UAE', pct: 9 }, { name: 'United Kingdom', pct: 7 }],
      topCities: [{ name: 'Mumbai', pct: 19 }, { name: 'Delhi', pct: 12 }, { name: 'Bengaluru', pct: 9 }],
    },
    followerGrowth: growthSeries(184000, 14, 900),
    recentPosts: makePosts('c1', 8800, TONES),
  },
  {
    id: 'c2',
    name: 'Aarav Mehta',
    displayName: 'Aarav Mehta',
    handle: '@aarav.shoots',
    email: 'aarav@example.com',
    bio: '📷 Photographer · Frames over filters · Bengaluru & beyond.',
    niche: 'Photography',
    location: 'Bengaluru, IN',
    plan: 'Core',
    founding: true,
    cardActive: true,
    slug: 'aarav',
    subscription: 'Active',
    lastRefresh: '2026-05-27 18:02',
    instagram: { connected: true, accountType: 'Creator', connectedDate: '2026-03-15', tokenValidUntil: '2026-06-20' },
    stats: { followers: 96500, following: 380, posts: 1220, engagement: 5.6, avgLikes: 5400, avgComments: 130, reach: 175000, impressions: 290000 },
    demographics: {
      age: { '13-17': 2, '18-24': 36, '25-34': 40, '35-44': 14, '45-54': 5, '55-64': 2, '65+': 1 },
      gender: { female: 44, male: 54, other: 2 },
      topCountries: [{ name: 'India', pct: 61 }, { name: 'United States', pct: 11 }, { name: 'Germany', pct: 6 }, { name: 'Canada', pct: 5 }],
      topCities: [{ name: 'Bengaluru', pct: 22 }, { name: 'Mumbai', pct: 10 }, { name: 'Hyderabad', pct: 8 }],
    },
    followerGrowth: growthSeries(96500, 14, 600),
    recentPosts: makePosts('c2', 5400, TONES),
  },
  {
    id: 'c3',
    name: 'Sara Iyer',
    displayName: 'Sara Iyer',
    handle: '@sara.beauty',
    email: 'sara@example.com',
    bio: '💄 Clean beauty & skincare · Honest reviews · DM for collabs.',
    niche: 'Beauty',
    location: 'Delhi, IN',
    plan: 'Starter',
    founding: true,
    cardActive: false,
    slug: 'sara',
    subscription: 'Trial',
    lastRefresh: '2026-05-26 11:40',
    instagram: { connected: true, accountType: 'Creator', connectedDate: '2026-04-10', tokenValidUntil: '2026-06-09' },
    stats: { followers: 42300, following: 510, posts: 670, engagement: 6.2, avgLikes: 2600, avgComments: 95, reach: 88000, impressions: 142000 },
    demographics: {
      age: { '13-17': 5, '18-24': 44, '25-34': 33, '35-44': 11, '45-54': 4, '55-64': 2, '65+': 1 },
      gender: { female: 79, male: 19, other: 2 },
      topCountries: [{ name: 'India', pct: 67 }, { name: 'United States', pct: 9 }, { name: 'UAE', pct: 6 }, { name: 'Pakistan', pct: 4 }],
      topCities: [{ name: 'Delhi', pct: 24 }, { name: 'Mumbai', pct: 11 }, { name: 'Pune', pct: 7 }],
    },
    followerGrowth: growthSeries(42300, 14, 300),
    recentPosts: makePosts('c3', 2600, TONES),
  },
  {
    id: 'c4',
    name: 'Kabir Singh',
    displayName: 'Kabir Singh',
    handle: '@kabirfit',
    email: 'kabir@example.com',
    bio: '🏋️ Fitness coach · Strength, mobility, no-BS nutrition · Programs link below.',
    niche: 'Fitness',
    location: 'Pune, IN',
    plan: 'Core',
    founding: false,
    cardActive: true,
    slug: 'kabir',
    subscription: 'Active',
    lastRefresh: '2026-05-28 07:55',
    instagram: { connected: true, accountType: 'Business', connectedDate: '2026-02-20', tokenValidUntil: '2026-06-18' },
    stats: { followers: 128000, following: 290, posts: 1480, engagement: 4.1, avgLikes: 5200, avgComments: 160, reach: 240000, impressions: 410000 },
    demographics: {
      age: { '13-17': 2, '18-24': 33, '25-34': 41, '35-44': 16, '45-54': 5, '55-64': 2, '65+': 1 },
      gender: { female: 38, male: 60, other: 2 },
      topCountries: [{ name: 'India', pct: 58 }, { name: 'United States', pct: 12 }, { name: 'UAE', pct: 8 }, { name: 'Australia', pct: 5 }],
      topCities: [{ name: 'Pune', pct: 18 }, { name: 'Mumbai', pct: 13 }, { name: 'Delhi', pct: 10 }],
    },
    followerGrowth: growthSeries(128000, 14, 700),
    recentPosts: makePosts('c4', 5200, TONES),
  },
  {
    id: 'c5',
    name: 'Diya Kapoor',
    displayName: 'Diya Kapoor',
    handle: '@diyaeats',
    email: 'diya@example.com',
    bio: '🍜 Food explorer · Recipes & restaurant finds across India.',
    niche: 'Food',
    location: 'Chennai, IN',
    plan: 'Starter',
    founding: false,
    cardActive: false,
    slug: 'diya',
    subscription: 'Inactive',
    lastRefresh: '2026-05-24 20:11',
    instagram: { connected: false, accountType: null, connectedDate: null, tokenValidUntil: null },
    stats: { followers: 58700, following: 720, posts: 540, engagement: 5.9, avgLikes: 3400, avgComments: 120, reach: 110000, impressions: 188000 },
    demographics: {
      age: { '13-17': 4, '18-24': 39, '25-34': 36, '35-44': 13, '45-54': 5, '55-64': 2, '65+': 1 },
      gender: { female: 64, male: 34, other: 2 },
      topCountries: [{ name: 'India', pct: 71 }, { name: 'United States', pct: 8 }, { name: 'Singapore', pct: 5 }, { name: 'UAE', pct: 4 }],
      topCities: [{ name: 'Chennai', pct: 21 }, { name: 'Bengaluru', pct: 12 }, { name: 'Mumbai', pct: 9 }],
    },
    followerGrowth: growthSeries(58700, 14, 400),
    recentPosts: makePosts('c5', 3400, TONES),
  },
]

export const portfolioByCreator = {
  c1: [
    { id: 'p1', brand: 'Wanderlust Co.', logo: '', campaign: 'Summer Escapes', category: 'Travel', link: 'https://example.com/1' },
    { id: 'p2', brand: 'SkyAir', logo: '', campaign: 'Window Seat Series', category: 'Aviation', link: 'https://example.com/2' },
  ],
  c2: [
    { id: 'p3', brand: 'LensPro', logo: '', campaign: 'Golden Hour', category: 'Gear', link: 'https://example.com/3' },
  ],
}

export const packagesByCreator = {
  c1: [
    { tier: 'Starter', price: 15000, deliverables: '1 Reel + 1 Story', revisions: 1 },
    { tier: 'Core', price: 35000, deliverables: '2 Reels + 3 Stories + 1 Post', revisions: 2 },
    { tier: 'Campaign', price: 80000, deliverables: '4 Reels + 6 Stories + 2 Posts + Usage Rights', revisions: 3 },
  ],
}

export const enquiries = [
  { id: 'e1', brand: 'Nivea India', email: 'partnerships@nivea.in', type: 'Paid Campaign', creator: 'Sara Iyer', creatorHandle: '@sara.beauty', brief: 'Looking for a 3-reel summer skincare campaign with usage rights for 30 days.', date: '2026-05-28', status: 'New' },
  { id: 'e2', brand: 'Decathlon', email: 'brand@decathlon.in', type: 'Barter', creator: 'Kabir Singh', creatorHandle: '@kabirfit', brief: 'Product seeding for new running shoe line, 2 stories + 1 reel.', date: '2026-05-27', status: 'Reviewed' },
  { id: 'e3', brand: 'MakeMyTrip', email: 'collabs@makemytrip.com', type: 'Paid Campaign', creator: 'Ananya Rao', creatorHandle: '@ananya.travels', brief: 'Monsoon getaway destination feature — Goa. Need full content package.', date: '2026-05-26', status: 'Actioned' },
  { id: 'e4', brand: 'Boat Lifestyle', email: 'influencers@boat.com', type: 'Affiliate', creator: 'Aarav Mehta', creatorHandle: '@aarav.shoots', brief: 'Affiliate code partnership for new camera-grade earbuds.', date: '2026-05-25', status: 'New' },
]

export const activity = [
  { id: 'a1', type: 'waitlist', text: 'Aarav Mehta joined the waitlist', time: '2 hours ago' },
  { id: 'a2', type: 'card', text: 'Ananya Rao published their Influence Card', time: '5 hours ago' },
  { id: 'a3', type: 'subscription', text: 'Kabir Singh started a Core subscription', time: '1 day ago' },
  { id: 'a4', type: 'enquiry', text: 'New enquiry from Nivea India for Sara Iyer', time: '1 day ago' },
  { id: 'a5', type: 'card', text: 'Aarav Mehta published their Influence Card', time: '2 days ago' },
]

// Minimum followers required by the Meta API before demographics unlock.
export const DEMOGRAPHICS_MIN_FOLLOWERS = 100
