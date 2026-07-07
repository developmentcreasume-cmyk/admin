import { createContext, useContext, useEffect, useState } from 'react'
import { api, tokenStore } from '../services/api.js'

/**
 * Admin auth. Logs in against the backend /admin/auth/login, stores the JWT,
 * and validates it on load via /admin/auth/me.
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStore.get())
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  // On mount (or token change), validate the token and load the admin.
  useEffect(() => {
    let cancelled = false
    async function check() {
      if (!token) {
        setUser(null)
        setReady(true)
        return
      }
      try {
        const { admin } = await api.me()
        if (!cancelled) setUser(admin)
      } catch {
        if (!cancelled) {
          tokenStore.clear()
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setReady(true)
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [token])

  async function login(email, password) {
    try {
      const res = await api.login(email, password)
      tokenStore.set(res.token)
      setToken(res.token)
      setUser(res.admin)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message || 'Invalid email or password.' }
    }
  }

  function logout() {
    tokenStore.clear()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ token, user, setUser, isAuthed: !!token, ready, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
