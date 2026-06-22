import BarStat from '../../components/BarStat.jsx'
import { DEMOGRAPHICS_MIN_FOLLOWERS } from '../../data/mockData.js'

/**
 * Audience tab — age breakdown, gender split, top countries & cities.
 * Locked until the account has 100+ followers (Meta API requirement).
 */
export default function AudienceTab({ creator }) {
  const followers = creator.stats.followers
  const unlocked = followers >= DEMOGRAPHICS_MIN_FOLLOWERS

  if (!unlocked) {
    return (
      <div className="empty card card-pad">
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
        <div className="fw-600" style={{ color: 'var(--text)' }}>Audience insights locked</div>
        <p className="text-sm muted" style={{ maxWidth: 360, margin: '6px auto 0' }}>
          Meta only provides demographics for accounts with {DEMOGRAPHICS_MIN_FOLLOWERS}+ followers.
          This account has {followers.toLocaleString()}. Unlock at {DEMOGRAPHICS_MIN_FOLLOWERS} followers.
        </p>
      </div>
    )
  }

  const d = creator.demographics
  const genderMax = Math.max(d.gender.female, d.gender.male, d.gender.other)

  return (
    <div className="row gap-24 flex-wrap" style={{ alignItems: 'flex-start' }}>
      {/* Age */}
      <div className="card card-pad flex-1" style={{ minWidth: 280 }}>
        <h3 style={{ marginTop: 0, fontSize: 14 }}>Age breakdown</h3>
        {Object.entries(d.age).map(([bracket, pct]) => (
          <BarStat key={bracket} label={bracket} pct={pct} max={Math.max(...Object.values(d.age))} />
        ))}
      </div>

      {/* Gender */}
      <div className="card card-pad flex-1" style={{ minWidth: 240 }}>
        <h3 style={{ marginTop: 0, fontSize: 14 }}>Gender split</h3>
        <BarStat label="Female" pct={d.gender.female} max={genderMax} tone="#c6649b" />
        <BarStat label="Male" pct={d.gender.male} max={genderMax} tone="#5b87c6" />
        <BarStat label="Other" pct={d.gender.other} max={genderMax} tone="#9a9a9a" />
      </div>

      {/* Locations */}
      <div className="card card-pad flex-1" style={{ minWidth: 240 }}>
        <h3 style={{ marginTop: 0, fontSize: 14 }}>Top countries</h3>
        {d.topCountries.map((c) => (
          <BarStat key={c.name} label={c.name} pct={c.pct} max={d.topCountries[0].pct} />
        ))}
        <h3 style={{ margin: '18px 0 10px', fontSize: 14 }}>Top cities</h3>
        {d.topCities.map((c) => (
          <BarStat key={c.name} label={c.name} pct={c.pct} max={d.topCities[0].pct} tone="#6b6b6b" />
        ))}
      </div>
    </div>
  )
}
