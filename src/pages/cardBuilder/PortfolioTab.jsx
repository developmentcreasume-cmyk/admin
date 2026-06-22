import { useState } from 'react'

/** Portfolio tab — add brand collaboration entries. */
export default function PortfolioTab({ draft, setDraft }) {
  const [form, setForm] = useState({ brand: '', campaign: '', category: '', link: '', logo: '' })

  function addEntry() {
    if (!form.brand.trim()) return
    const entry = { ...form, id: `p_${draft.portfolio.length + 1}_${form.brand.slice(0, 3)}` }
    setDraft({ ...draft, portfolio: [...draft.portfolio, entry] })
    setForm({ brand: '', campaign: '', category: '', link: '', logo: '' })
  }

  function removeEntry(id) {
    setDraft({ ...draft, portfolio: draft.portfolio.filter((p) => p.id !== id) })
  }

  function onLogo(e) {
    const file = e.target.files?.[0]
    if (file) setForm({ ...form, logo: URL.createObjectURL(file) })
  }

  return (
    <div className="row gap-24 flex-wrap" style={{ alignItems: 'flex-start' }}>
      {/* New entry form */}
      <div className="card card-pad" style={{ width: 320 }}>
        <h3 style={{ marginTop: 0, fontSize: 14 }}>Add collaboration</h3>
        <div className="field">
          <label>Brand logo</label>
          <div className="row items-center gap-12">
            <div
              className="avatar"
              style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: 'var(--surface-alt)' }}
            >
              {form.logo ? (
                <img src={form.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                '🏢'
              )}
            </div>
            <label className="btn btn-sm" style={{ margin: 0 }}>
              Upload
              <input type="file" accept="image/*" hidden onChange={onLogo} />
            </label>
          </div>
        </div>
        <div className="field">
          <label>Brand / Campaign name</label>
          <input className="input" value={form.campaign} onChange={(e) => setForm({ ...form, campaign: e.target.value, brand: e.target.value })} placeholder="e.g. Summer Escapes" />
        </div>
        <div className="field">
          <label>Category</label>
          <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Travel" />
        </div>
        <div className="field">
          <label>Link</label>
          <input className="input" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://…" />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={addEntry}>
          + Add entry
        </button>
      </div>

      {/* Existing entries */}
      <div className="flex-1" style={{ minWidth: 280 }}>
        <h3 style={{ marginTop: 0, fontSize: 14 }}>Collaborations ({draft.portfolio.length})</h3>
        <div className="col gap-12">
          {draft.portfolio.map((p) => (
            <div key={p.id} className="card card-pad row items-center gap-12">
              <div
                className="avatar"
                style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: 'var(--surface-alt)' }}
              >
                {p.logo ? <img src={p.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏢'}
              </div>
              <div className="flex-1">
                <div className="fw-600 text-sm">{p.campaign || p.brand}</div>
                <div className="text-xs muted">
                  {p.category}
                  {p.link && (
                    <>
                      {' · '}
                      <a href={p.link} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>
                        link
                      </a>
                    </>
                  )}
                </div>
              </div>
              <button className="btn btn-sm btn-danger" onClick={() => removeEntry(p.id)}>
                Remove
              </button>
            </div>
          ))}
          {draft.portfolio.length === 0 && <div className="empty card">No collaborations added yet.</div>}
        </div>
      </div>
    </div>
  )
}
