/** Small status pill. `tone` maps to a colour class. */
export default function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

/** Convenience: a Founding Creator badge. */
export function FoundingBadge() {
  return <Badge tone="amber">★ Founding</Badge>
}

/** Convenience: subscription status badge. */
export function SubscriptionBadge({ status }) {
  const map = { Active: 'green', Trial: 'blue', Inactive: 'neutral' }
  return <Badge tone={map[status] || 'neutral'}>{status}</Badge>
}
