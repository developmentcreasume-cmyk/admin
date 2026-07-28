/** Small status pill. `tone` maps to a colour class. */
export default function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

/** Convenience: a Founding Creator badge. */
export function FoundingBadge() {
  return <Badge tone="amber">★ Founding</Badge>
}

function hexToRgba(hex, alpha) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
  if (!m) return `rgba(124,92,255,${alpha})` // fallback: brand violet
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16))
  return `rgba(${r},${g},${b},${alpha})`
}

/**
 * A brand-tinted "Brought by <name>" badge — replaces the Founding badge on a
 * creator's card when a brand partner brought them onto Creasume. `color` is
 * auto-extracted from the brand's uploaded logo (see extractDominantColor in
 * backend/services/imageStore.js), not hardcoded.
 */
export function BroughtByBadge({ name, color }) {
  const c = color || '#7C5CFF'
  return (
    <span
      className="badge"
      style={{ color: c, background: hexToRgba(c, 0.12), border: `1px solid ${hexToRgba(c, 0.35)}` }}
    >
      Managed by {name}
    </span>
  )
}

/** Convenience: subscription status badge. */
export function SubscriptionBadge({ status }) {
  const map = { Active: 'green', Trial: 'blue', Inactive: 'neutral' }
  return <Badge tone={map[status] || 'neutral'}>{status}</Badge>
}
