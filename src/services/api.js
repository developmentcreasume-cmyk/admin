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

export const api = {
  // Auth
  login: (email, password) => post('/admin/auth/login', { email, password }),
  me: () => get('/admin/auth/me'),

  // Dashboard
  overview: () => get('/admin/dashboard/overview'),
  activity: (limit = 8) => get(`/admin/dashboard/activity?limit=${limit}`),

  // Waitlist
  waitlist: (params = {}) => get(`/admin/waitlist${qs(params)}`),
  toggleWaitlistFounding: (id, isFoundingCreator) =>
    patch(`/admin/waitlist/${id}/founding`, { isFoundingCreator }),

  // Creators
  creators: (params = {}) => get(`/admin/creators${qs(params)}`),
  creator: (id) => get(`/admin/creators/${id}`),
  addCreator: (body) => post('/admin/creators', body),
  updateCreator: (id, body) => patch(`/admin/creators/${id}`, body),
  refreshCreator: (id) => post(`/admin/creators/${id}/refresh`),
  saveStats: (id, statOverrides) => patch(`/admin/creators/${id}/stats`, { statOverrides }),
  savePortfolio: (id, portfolio) => put(`/admin/creators/${id}/portfolio`, { portfolio }),
  savePackages: (id, packages) => put(`/admin/creators/${id}/packages`, { packages }),
  publishCard: (id, draft = false) => post(`/admin/creators/${id}/publish`, { draft }),

  // Enquiries
  enquiries: (params = {}) => get(`/admin/enquiries${qs(params)}`),
  setEnquiryStatus: (id, status) => patch(`/admin/enquiries/${id}/status`, { status }),
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
