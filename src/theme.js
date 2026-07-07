/**
 * Admin appearance (theme + accent) — persisted in localStorage and applied to
 * the document root via CSS variables. Purely client-side, per-browser.
 */
const THEME_KEY = 'admin_theme'
const ACCENT_KEY = 'admin_accent'

export const THEMES = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

// `color: ''` means "use the theme default accent" (no override).
export const ACCENTS = [
  { id: 'default', label: 'Default', color: '' },
  { id: 'blue', label: 'Blue', color: '#2563eb' },
  { id: 'violet', label: 'Violet', color: '#7c3aed' },
  { id: 'green', label: 'Green', color: '#1f9d55' },
  { id: 'red', label: 'Red', color: '#c0392b' },
]

export function getAppearance() {
  return {
    theme: localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light',
    accent: localStorage.getItem(ACCENT_KEY) || 'default',
  }
}

// Apply the given appearance (defaults to what's stored) to <html>.
export function applyAppearance(appearance = getAppearance()) {
  const root = document.documentElement
  root.setAttribute('data-theme', appearance.theme === 'dark' ? 'dark' : 'light')
  const found = ACCENTS.find((a) => a.id === appearance.accent)
  if (found && found.color) root.style.setProperty('--accent', found.color)
  else root.style.removeProperty('--accent')
}

// Persist a change and apply it immediately.
export function setAppearance(partial) {
  const next = { ...getAppearance(), ...partial }
  localStorage.setItem(THEME_KEY, next.theme)
  localStorage.setItem(ACCENT_KEY, next.accent)
  applyAppearance(next)
  return next
}
