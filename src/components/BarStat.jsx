/** A labelled horizontal percentage bar, used for audience breakdowns. */
export default function BarStat({ label, pct, max = 100, tone = 'var(--accent)' }) {
  const width = Math.max(2, (pct / max) * 100)
  return (
    <div className="row items-center gap-12" style={{ marginBottom: 9 }}>
      <span className="text-sm" style={{ width: 92, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: 'var(--surface-alt)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: `${width}%`, height: '100%', background: tone, borderRadius: 6 }} />
      </div>
      <span className="text-sm fw-600" style={{ width: 40, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
    </div>
  )
}
