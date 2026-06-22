/** Dashboard summary stat tile. */
export default function StatCard({ label, value, hint }) {
  return (
    <div className="card card-pad" style={{ flex: '1 1 160px', minWidth: 160 }}>
      <div className="text-xs faint fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, lineHeight: 1 }}>{value}</div>
      {hint && <div className="text-xs muted mt-8">{hint}</div>}
    </div>
  )
}
