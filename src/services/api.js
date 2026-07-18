/**
 * Admin API client. Talks to the Creasume backend's /admin/* routes.
 * The admin JWT is stored in localStorage and attached as a Bearer token.
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const TOKEN_KEY = 'creasume_admin_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

async function request(path, options = {}) {
  const token = tokenStore.get()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  const data = await res.json().catch(() => ({}))

  if (res.status === 401) {
    // Token invalid/expired — drop it so ProtectedRoute bounces to login.
    tokenStore.clear()
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

const get = (p) => request(p)
const post = (p, body) => request(p, { method: 'POST', body: JSON.stringify(body || {}) })
const patch = (p, body) => request(p, { method: 'PATCH', body: JSON.stringify(body || {}) })
const put = (p, body) => request(p, { method: 'PUT', body: JSON.stringify(body || {}) })

// Upload one image file (multipart). Do NOT set Content-Type — the browser must
// add the multipart boundary itself. Returns { success, url }.
async function uploadFile(path, file) {
  const token = tokenStore.get()
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: form,
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) tokenStore.clear()
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Upload failed (${res.status})`)
  }
  return data
}

export const api = {
  // Auth
  login: (email, password) => post('/admin/auth/login', { email, password }),
  me: () => get('/admin/auth/me'),

  // Dashboard
  overview: () => get('/admin/dashboard/overview'),
  activity: (limit = 8) => get(`/admin/dashboard/activity?limit=${limit}`),
  charts: () => get('/admin/dashboard/charts'),

  // Waitlist
  waitlist: (params = {}) => get(`/admin/waitlist${qs(params)}`),
  toggleWaitlistFounding: (id, isFoundingCreator) =>
    patch(`/admin/waitlist/${id}/founding`, { isFoundingCreator }),

  // Creators
  creators: (params = {}) => get(`/admin/creators${qs(params)}`),
  creator: (id) => get(`/admin/creators/${id}`),
  addCreator: (body) => post('/admin/creators', body),
  updateCreator: (id, body) => patch(`/admin/creators/${id}`, body),
  deleteCreator: (id) => request(`/admin/creators/${id}`, { method: 'DELETE' }),
  refreshCreator: (id) => post(`/admin/creators/${id}/refresh`),
  // Instagram OAuth — start the connect flow for THIS creator (state = creatorId).
  instagramConnectUrl: (id) => `${API_BASE}/auth/instagram?state=${encodeURIComponent(id)}`,
  // Image upload — returns { success, url }. Used for brand logos, etc.
  uploadImage: (file) => uploadFile('/admin/uploads', file),

  saveStats: (id, statOverrides, metricVisibility) =>
    patch(`/admin/creators/${id}/stats`, { statOverrides, metricVisibility }),
  savePortfolio: (id, portfolio) => put(`/admin/creators/${id}/portfolio`, { portfolio }),
  // Resolve an IG collab post URL → that post's metrics (reach/engagement/etc).
  fetchCollabPost: (id, url) => post(`/admin/creators/${id}/collab-metrics`, { url }),
  savePackages: (id, packages) => put(`/admin/creators/${id}/packages`, { packages }),
  publishCard: (id, draft = false) => post(`/admin/creators/${id}/publish`, { draft }),

  // A single creator's brand inquiries (for reviewing / fraud-checking).
  creatorInquiries: (id) => get(`/admin/creators/${id}/inquiries`),
  // Benchmark reward — list all who hit 500; approve grants the coupon, reject dismisses.
  benchmarkList: (params = {}) => get(`/admin/creators/benchmark/list${qs(params)}`),
  approveBenchmark: (id, reward) => post(`/admin/creators/${id}/benchmark/approve`, reward),
  rejectBenchmark: (id) => post(`/admin/creators/${id}/benchmark/reject`),

  // Enquiries
  enquiries: (params = {}) => get(`/admin/enquiries${qs(params)}`),
  setEnquiryStatus: (id, status) => patch(`/admin/enquiries/${id}/status`, { status }),

  // Plans (subscription pricing)
  plans: () => get('/admin/plans'),
  createPlan: (body) => post('/admin/plans', body),
  updatePlan: (id, body) => patch(`/admin/plans/${id}`, body),
  deletePlan: (id) => request(`/admin/plans/${id}`, { method: 'DELETE' }),
  payments: (limit = 100) => get(`/admin/plans/payments/list?limit=${limit}`),
  billingOverview: () => get('/admin/plans/billing/overview'),

  // My account
  updateProfile: (body) => patch('/admin/account/profile', body),
  changePassword: (currentPassword, newPassword) =>
    post('/admin/account/password', { currentPassword, newPassword }),

  // Site settings
  getSettings: () => get('/admin/settings'),
  updateSettings: (body) => put('/admin/settings', body),

  // Refer & Earn overview (program state, totals, recent referral events)
  referrals: (limit = 100) => get(`/admin/referrals?limit=${limit}`),
}

// Build a query string from a params object, skipping empty values.
function qs(params) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== '' && v !== undefined && v !== null && v !== 'All' && v !== false,
  )
  if (!entries.length) return ''
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
}

export { API_BASE }
