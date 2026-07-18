import { useEffect } from 'react'

/** Simple centered modal. Closes on backdrop click or Escape. */
export default function Modal({ open, title, onClose, children, footer, maxWidth = 460 }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17,17,17,0.28)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 100,
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 40px rgba(0,0,0,0.16)',
        }}
      >
        <div
          className="row items-center justify-between"
          style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}
        >
          <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', fontSize: 20, color: 'var(--text-faint)', lineHeight: 1, cursor: 'pointer' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {/* Body scrolls when content is taller than the viewport-capped modal. */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1, minHeight: 0 }}>{children}</div>
        {footer && (
          <div
            className="row items-center justify-between gap-8"
            style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', justifyContent: 'flex-end', flexShrink: 0 }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
