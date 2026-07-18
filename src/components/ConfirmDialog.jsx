import Modal from './Modal.jsx'

/**
 * In-app confirmation card — replaces the browser's native window.confirm().
 * Renders a titled modal with a message and Cancel / Confirm buttons.
 *
 * @param {boolean}  open
 * @param {string}   title
 * @param {node}     message       - body text (supports line breaks via \n)
 * @param {string}   confirmLabel
 * @param {string}   cancelLabel
 * @param {'primary'|'danger'} tone - confirm button style
 * @param {boolean}  busy          - disables buttons + shows "Working…"
 * @param {function} onConfirm
 * @param {function} onClose
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  busy = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={busy ? () => {} : onClose}
      maxWidth={440}
      footer={
        <>
          <button className="btn btn-sm" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            className={`btn btn-sm ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm" style={{ color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
        {message}
      </div>
    </Modal>
  )
}
