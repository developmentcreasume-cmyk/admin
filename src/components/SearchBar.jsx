/** Reusable search input with an inline icon. */
export default function SearchBar({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div style={{ position: 'relative', maxWidth: 320, width: '100%' }}>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 11,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-faint)',
          fontSize: 14,
          pointerEvents: 'none',
        }}
      >
        ⌕
      </span>
      <input
        className="input"
        style={{ paddingLeft: 30 }}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
