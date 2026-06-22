import { useEffect, useMemo, useState } from 'react'
import SearchBar from '../components/SearchBar.jsx'
import Badge, { FoundingBadge } from '../components/Badge.jsx'
import { api } from '../services/api.js'

export default function Waitlist() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [niche, setNiche] = useState('All')
  const [foundingOnly, setFoundingOnly] = useState(false)

  // Fetch (server-side filtering via query params).
  useEffect(() => {
    setLoading(true)
    api
      .waitlist({ search: query, niche, foundingOnly })
      .then((res) => setRows(res.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [query, niche, foundingOnly])

  const niches = useMemo(
    () => ['All', ...Array.from(new Set(rows.map((w) => w.niche).filter(Boolean)))],
    [rows],
  )

  async function toggleFounding(row) {
    try {
      const res = await api.toggleWaitlistFounding(row._id, !row.isFoundingCreator)
      setRows((prev) => prev.map((r) => (r._id === row._id ? res.entry : r)))
    } catch (e) {
      setError(e.message)
    }
  }

  function exportCsv() {
    const header = ['Name', 'Handle', 'Email', 'Niche', 'Sign-up date', 'Founding']
    const lines = rows.map((r) => [
      r.name,
      r.instagramHandle,
      r.email,
      r.niche || '',
      new Date(r.signedUpAt).toISOString().slice(0, 10),
      r.isFoundingCreator ? 'Yes' : 'No',
    ])
    const csv = [header, ...lines].map((row) => row.map((c) => `"${c ?? ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'creasume-waitlist.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const foundingCount = rows.filter((r) => r.isFoundingCreator).length

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Waitlist</h1>
          <p>{rows.length} sign-ups · {foundingCount} marked founding</p>
        </div>
        <button className="btn" onClick={exportCsv} disabled={!rows.length}>
          ↧ Export CSV
        </button>
      </div>

      {error && <div className="badge badge-red" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Filters */}
      <div className="row items-center gap-12 flex-wrap" style={{ marginBottom: 16 }}>
        <SearchBar value={query} onChange={setQuery} placeholder="Search name, handle, email…" />
        <select className="select" style={{ width: 'auto' }} value={niche} onChange={(e) => setNiche(e.target.value)}>
          {niches.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <label className="row items-center gap-8 text-sm muted" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={foundingOnly} onChange={(e) => setFoundingOnly(e.target.checked)} />
          Founding only
        </label>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Handle</th>
              <th>Email</th>
              <th>Niche</th>
              <th>Sign-up date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id}>
                <td className="fw-600">{r.name}</td>
                <td className="muted">{r.instagramHandle}</td>
                <td className="muted">{r.email}</td>
                <td>{r.niche ? <Badge tone="neutral">{r.niche}</Badge> : <span className="faint">—</span>}</td>
                <td className="muted">{new Date(r.signedUpAt).toLocaleDateString()}</td>
                <td>{r.isFoundingCreator ? <FoundingBadge /> : <span className="faint text-sm">—</span>}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-sm" onClick={() => toggleFounding(r)}>
                    {r.isFoundingCreator ? 'Revoke founding' : '★ Mark founding'}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty">No waitlist entries match your filters.</div>
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7}>
                  <div className="empty">Loading…</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
