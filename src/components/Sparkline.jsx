/**
 * Minimal SVG line chart for follower growth (daily snapshots).
 * No dependencies — scales the series to the given box.
 */
export default function Sparkline({ data = [], width = 520, height = 160, stroke = 'var(--accent)' }) {
  if (data.length < 2) return <div className="empty">Not enough snapshots yet.</div>

  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pad = 6

  const x = (i) => pad + (i * (width - pad * 2)) / (data.length - 1)
  const y = (v) => pad + (height - pad * 2) * (1 - (v - min) / span)

  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L ${x(data.length - 1).toFixed(1)} ${height - pad} L ${x(0).toFixed(1)} ${height - pad} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.12" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r="3.5" fill={stroke} />
    </svg>
  )
}
