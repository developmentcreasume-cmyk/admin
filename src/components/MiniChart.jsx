/**
 * Tiny dependency-free charts for the admin dashboard. Theme-aware (they read
 * the CSS custom properties), single-series (magnitude / change-over-time), so
 * no categorical palette is needed — one hue carries the data, text stays ink.
 */

const short = (iso) => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

/**
 * Vertical bar chart for a daily series. `data` = [{ date, value }].
 * Bars use `color` (a CSS var/hex); baseline + labels use theme ink.
 */
export function BarChart({ data = [], color = 'var(--blue)', height = 120 }) {
  const values = data.map((d) => d.value)
  const max = Math.max(1, ...values)
  const total = values.reduce((a, b) => a + b, 0)
  const peak = Math.max(0, ...values)

  const W = 100 // viewBox width units; scales to container via width:100%
  const n = data.length || 1
  const gap = 1.2
  const barW = Math.max(1, (W - gap * (n - 1)) / n)

  return (
    <div>
      <svg viewBox={`0 0 ${W} 40`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }} role="img">
        {/* baseline */}
        <line x1="0" y1="40" x2={W} y2="40" stroke="var(--border)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => {
          const h = (d.value / max) * 38
          const x = i * (barW + gap)
          const y = 40 - h
          return (
            <rect key={d.date || i} x={x} y={Math.min(y, 39.4)} width={barW} height={Math.max(h, 0.6)} rx="0.8" fill={color}>
              <title>{`${short(d.date)}: ${d.value}`}</title>
            </rect>
          )
        })}
      </svg>
      <div className="row justify-between mt-8">
        <span className="text-xs faint">{data.length ? short(data[0].date) : ''}</span>
        <span className="text-xs muted">Total {total} · peak {peak}</span>
        <span className="text-xs faint">{data.length ? short(data[data.length - 1].date) : ''}</span>
      </div>
    </div>
  )
}

/**
 * Horizontal bars ranked by magnitude. `data` = [{ label, count }].
 * One hue; the category name is a text label so identity is never color-alone.
 */
export function BarList({ data = [], color = 'var(--accent)' }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  if (!data.length) return <div className="text-sm faint">No data yet.</div>
  return (
    <div className="col gap-12">
      {data.map((d) => (
        <div key={d.label}>
          <div className="row justify-between" style={{ marginBottom: 5 }}>
            <span className="text-sm" style={{ textTransform: 'capitalize' }}>{d.label}</span>
            <span className="text-sm fw-600">{d.count}</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: 'var(--surface-alt)', overflow: 'hidden' }}>
            <div style={{ width: `${(d.count / max) * 100}%`, height: '100%', borderRadius: 999, background: color }} />
          </div>
        </div>
      ))}
    </div>
  )
}
