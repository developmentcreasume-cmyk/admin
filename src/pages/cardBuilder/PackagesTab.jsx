/** Packages tab — configure up to 3 pricing tiers (Starter / Core / Campaign). */
import { useState } from 'react'

const ALL_TIERS = ['Starter', 'Core', 'Campaign']

const DEFAULT_REVISIONS = { Starter: 1, Core: 2, Campaign: 3 }

export default function PackagesTab({ draft, setDraft }) {
  const packages = draft.packages || []
  const [notice, setNotice] = useState('')

  function flash(msg) {
    setNotice(msg)
    setTimeout(() => setNotice(''), 2600)
  }

  function update(idx, key, value) {
    const next = packages.map((p, i) => (i === idx ? { ...p, [key]: value } : p))
    setDraft({ ...draft, packages: next })
  }

  // Toggle the "most popular" flag — only ONE tier may be popular at a time.
  function togglePopular(idx) {
    const current = packages[idx]
    if (!current.isPopular) {
      const existing = packages.find((p, i) => i !== idx && p.isPopular)
      if (existing) {
        flash(`"${existing.tier}" is already marked Most Popular. Unmark it first to choose another.`)
        return
      }
    }
    const next = packages.map((p, i) =>
      i === idx ? { ...p, isPopular: !p.isPopular } : p,
    )
    setDraft({ ...draft, packages: next })
  }

  function removeTier(idx) {
    setDraft({ ...draft, packages: packages.filter((_, i) => i !== idx) })
  }

  function addTier() {
    if (packages.length >= ALL_TIERS.length) return
    // Pick the first tier name not already used.
    const used = new Set(packages.map((p) => p.tier))
    const nextTier = ALL_TIERS.find((t) => !used.has(t)) || ALL_TIERS[0]
    setDraft({
      ...draft,
      packages: [
        ...packages,
        { tier: nextTier, price: 0, deliverables: '', revisions: DEFAULT_REVISIONS[nextTier] || 1 },
      ],
    })
  }

  // Tier names still available to switch a card to (its own + unused ones).
  function tierOptions(currentTier) {
    const used = new Set(packages.map((p) => p.tier))
    return ALL_TIERS.filter((t) => t === currentTier || !used.has(t))
  }

  const canAdd = packages.length < ALL_TIERS.length

  return (
    <div>
      <div className="row items-center justify-between flex-wrap gap-12" style={{ marginBottom: 4 }}>
        <p className="text-sm muted" style={{ margin: 0 }}>
          Configure deliverables, pricing and revision rounds. Up to {ALL_TIERS.length} tiers.
        </p>
        <button className="btn btn-sm btn-primary" onClick={addTier} disabled={!canAdd}>
          + Add tier
        </button>
      </div>

      {notice && (
        <div className="badge badge-amber" style={{ marginTop: 12 }}>
          {notice}
        </div>
      )}

      <div className="row gap-16 flex-wrap mt-16" style={{ alignItems: 'stretch' }}>
        {packages.map((pkg, idx) => (
          <div
            key={idx}
            className="card card-pad flex-1"
            style={{
              minWidth: 240,
              position: 'relative',
              border: pkg.isPopular ? '2px solid var(--accent)' : undefined,
            }}
          >
            {pkg.isPopular && (
              <span
                className="badge"
                style={{
                  position: 'absolute',
                  top: -10,
                  left: 16,
                  background: 'var(--accent)',
                  color: '#fff',
                }}
              >
                ★ Most Popular
              </span>
            )}
            <div className="row items-center justify-between" style={{ marginBottom: 14 }}>
              <select
                className="select"
                style={{ width: 'auto', fontWeight: 600 }}
                value={pkg.tier}
                onChange={(e) => update(idx, 'tier', e.target.value)}
              >
                {tierOptions(pkg.tier).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button className="btn btn-sm btn-danger" onClick={() => removeTier(idx)}>
                Remove
              </button>
            </div>
            <div className="field">
              <label>Price (₹)</label>
              <input
                className="input"
                type="number"
                value={pkg.price}
                onChange={(e) => update(idx, 'price', Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>Deliverables</label>
              <textarea
                className="textarea"
                style={{ minHeight: 70 }}
                value={pkg.deliverables}
                onChange={(e) => update(idx, 'deliverables', e.target.value)}
                placeholder="e.g. 1 Reel, 2 Stories"
              />
            </div>
            <div className="field">
              <label>Revision rounds</label>
              <input
                className="input"
                type="number"
                min={0}
                value={pkg.revisions}
                onChange={(e) => update(idx, 'revisions', Number(e.target.value))}
              />
            </div>

            {/* Most Popular toggle — only one tier may be selected. */}
            <button
              type="button"
              onClick={() => togglePopular(idx)}
              className="row items-center gap-8"
              style={{
                border: 'none',
                background: 'none',
                padding: 0,
                marginTop: 4,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 12,
                  background: pkg.isPopular ? 'var(--accent)' : 'var(--border-strong)',
                  position: 'relative',
                  transition: 'background 0.15s',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: pkg.isPopular ? 18 : 2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.15s',
                  }}
                />
              </span>
              <span className="text-sm fw-600">Mark as Most Popular</span>
            </button>
          </div>
        ))}

        {packages.length === 0 && (
          <div className="empty card" style={{ width: '100%' }}>
            No packages yet. Click “+ Add tier” to create one.
          </div>
        )}
      </div>
    </div>
  )
}
