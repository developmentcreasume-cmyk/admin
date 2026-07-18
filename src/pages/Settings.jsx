import { useEffect, useState } from 'react'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { getAppearance, setAppearance, THEMES, ACCENTS } from '../theme.js'

const PLAN_TIERS = ['free', 'starter', 'pro', 'elite']

// Small green "Saved" / red error note that sits next to a form's submit button.
function Note({ text, error }) {
  if (!text) return null
  return <span className={`badge ${error ? 'badge-red' : 'badge-green'}`}>{text}</span>
}

export default function Settings() {
  const { user, setUser } = useAuth()

  // ---- My account ----
  const [profile, setProfile] = useState({ name: '', email: '' })
  const [profileMsg, setProfileMsg] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState(null)
  const [savingPw, setSavingPw] = useState(false)

  // ---- Site settings ----
  const [settings, setSettings] = useState(null)
  const [settingsMsg, setSettingsMsg] = useState(null)
  const [savingSettings, setSavingSettings] = useState(false)

  // ---- Appearance ----
  const [appearance, setAppr] = useState(getAppearance())

  useEffect(() => {
    if (user) setProfile({ name: user.name || '', email: user.email || '' })
  }, [user])

  useEffect(() => {
    api.getSettings().then(({ settings }) => setSettings(settings)).catch(() => {})
  }, [])

  async function saveProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      const { admin } = await api.updateProfile(profile)
      setUser?.(admin)
      setProfileMsg({ text: 'Saved' })
    } catch (err) {
      setProfileMsg({ text: err.message || 'Failed', error: true })
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    if (pw.next !== pw.confirm) {
      setPwMsg({ text: 'Passwords do not match', error: true })
      return
    }
    setSavingPw(true)
    setPwMsg(null)
    try {
      await api.changePassword(pw.current, pw.next)
      setPw({ current: '', next: '', confirm: '' })
      setPwMsg({ text: 'Password changed' })
    } catch (err) {
      setPwMsg({ text: err.message || 'Failed', error: true })
    } finally {
      setSavingPw(false)
    }
  }

  async function saveSettings(e) {
    e.preventDefault()
    setSavingSettings(true)
    setSettingsMsg(null)
    try {
      const { settings: s } = await api.updateSettings(settings)
      setSettings(s)
      setSettingsMsg({ text: 'Saved' })
    } catch (err) {
      setSettingsMsg({ text: err.message || 'Failed', error: true })
    } finally {
      setSavingSettings(false)
    }
  }

  function changeAppearance(partial) {
    setAppr(setAppearance(partial))
  }

  const field = { marginBottom: 14 }
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-soft)', marginBottom: 6 }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 style={{ marginBottom: 2 }}>Settings</h1>
          <p className="muted text-sm" style={{ margin: 0 }}>Manage your account, the site, and how the admin looks.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', alignItems: 'start' }}>

        {/* My account — profile */}
        <form className="card card-pad" onSubmit={saveProfile}>
          <h3 style={{ marginTop: 0 }}>My account</h3>
          <div style={field}>
            <label style={labelStyle}>Name</label>
            <input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div style={field}>
            <label style={labelStyle}>Email</label>
            <input className="input" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          </div>
          <div className="row items-center gap-8">
            <button className="btn btn-primary" type="submit" disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
            <Note text={profileMsg?.text} error={profileMsg?.error} />
          </div>
        </form>

        {/* My account — password */}
        <form className="card card-pad" onSubmit={savePassword}>
          <h3 style={{ marginTop: 0 }}>Change password</h3>
          <div style={field}>
            <label style={labelStyle}>Current password</label>
            <input className="input" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </div>
          <div style={field}>
            <label style={labelStyle}>New password</label>
            <input className="input" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          </div>
          <div style={field}>
            <label style={labelStyle}>Confirm new password</label>
            <input className="input" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </div>
          <div className="row items-center gap-8">
            <button className="btn btn-primary" type="submit" disabled={savingPw || !pw.current || !pw.next}>
              {savingPw ? 'Saving…' : 'Update password'}
            </button>
            <Note text={pwMsg?.text} error={pwMsg?.error} />
          </div>
          <p className="text-xs faint" style={{ marginTop: 10, marginBottom: 0 }}>Minimum 8 characters.</p>
        </form>

        {/* Site settings */}
        <form className="card card-pad" onSubmit={saveSettings}>
          <h3 style={{ marginTop: 0 }}>Site settings</h3>
          {!settings ? (
            <p className="muted text-sm">Loading…</p>
          ) : (
            <>
              <div style={field}>
                <label style={labelStyle}>Site name</label>
                <input className="input" value={settings.siteName || ''} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} />
              </div>
              <div style={field}>
                <label style={labelStyle}>Support email</label>
                <input className="input" type="email" value={settings.supportEmail || ''} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} placeholder="support@creasume.com" />
              </div>
              <div style={field}>
                <label style={labelStyle}>Default plan for new creators</label>
                <select className="input" value={settings.defaultPlanTier || 'free'} onChange={(e) => setSettings({ ...settings, defaultPlanTier: e.target.value })}>
                  {PLAN_TIERS.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <label className="row items-center gap-8" style={{ ...field, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!settings.waitlistOpen} onChange={(e) => setSettings({ ...settings, waitlistOpen: e.target.checked })} />
                <span className="text-sm">Waitlist open (accepting signups)</span>
              </label>
              <label className="row items-center gap-8" style={{ ...field, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!settings.maintenanceMode} onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })} />
                <span className="text-sm">Maintenance mode</span>
              </label>

              {/* ---- Refer & Earn ---- */}
              <div style={{ ...field, borderTop: '1px solid var(--border, rgba(0,0,0,0.08))', paddingTop: 16, marginTop: 4 }}>
                <label style={labelStyle}>Refer &amp; Earn</label>
                <label className="row items-center gap-8" style={{ cursor: 'pointer', marginBottom: 10 }}>
                  <input
                    type="checkbox"
                    checked={settings.referralEnabled !== false}
                    onChange={(e) => setSettings({ ...settings, referralEnabled: e.target.checked })}
                  />
                  <span className="text-sm">Referral program enabled (turn OFF to stop crediting new referrals &amp; applying coupons)</span>
                </label>
                <div className="text-xs muted">The referrals log lives on the Refer &amp; Earn page.</div>
              </div>
              <div style={field}>
                <label style={labelStyle}>New-user discount (%) — the referred friend's coupon</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.referralDiscountPercent ?? 20}
                  onChange={(e) => setSettings({ ...settings, referralDiscountPercent: e.target.value === '' ? '' : Number(e.target.value) })}
                  style={{ maxWidth: 160 }}
                />
              </div>
              <div style={field}>
                <label style={labelStyle}>Referrer reward (%) — their coupon when the friend pays</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.referralCommissionPercent ?? 40}
                  onChange={(e) => setSettings({ ...settings, referralCommissionPercent: e.target.value === '' ? '' : Number(e.target.value) })}
                  style={{ maxWidth: 160 }}
                />
              </div>

              <div className="row items-center gap-8">
                <button className="btn btn-primary" type="submit" disabled={savingSettings}>
                  {savingSettings ? 'Saving…' : 'Save settings'}
                </button>
                <Note text={settingsMsg?.text} error={settingsMsg?.error} />
              </div>
            </>
          )}
        </form>

        {/* Appearance */}
        <div className="card card-pad">
          <h3 style={{ marginTop: 0 }}>Appearance</h3>
          <p className="text-xs faint" style={{ marginTop: 0 }}>Saved on this browser.</p>

          <div style={field}>
            <label style={labelStyle}>Theme</label>
            <div className="row gap-8">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => changeAppearance({ theme: t.id })}
                  className={`btn btn-sm ${appearance.theme === t.id ? 'btn-primary' : ''}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={field}>
            <label style={labelStyle}>Accent</label>
            <div className="row gap-8 flex-wrap">
              {ACCENTS.map((a) => {
                const selected = appearance.accent === a.id
                return (
                  <button
                    key={a.id}
                    type="button"
                    title={a.label}
                    onClick={() => changeAppearance({ accent: a.id })}
                    style={{
                      width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
                      background: a.color || 'var(--accent)',
                      border: selected ? '2px solid var(--text)' : '2px solid var(--border)',
                      outline: selected ? '2px solid var(--accent-soft)' : 'none',
                    }}
                    aria-label={a.label}
                  />
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
