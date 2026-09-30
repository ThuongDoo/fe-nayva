import { useEffect, useState } from 'react'
import { checkDomain } from '../lib/api.js'
import { stripDiacritics } from '../lib/slug.js'

const CHECK_DELAY = 400

/** Keeps what the user types close to a valid name without fighting them (no trimming mid-typing). */
const tidy = (value) =>
  stripDiacritics(value)
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40)

/**
 * Text field for a site name, checked against the backend as the user types. `onSubmit(name)` runs
 * only for a name the server reported as available.
 */
export default function DomainPicker({ rootDomain, initial = '', submitLabel, busy, onSubmit, onCancel }) {
  const [value, setValue] = useState(() => tidy(initial))
  // Tagged with the name it answers, so a slow reply for an older value is never shown.
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!value) return
    let cancelled = false
    const t = setTimeout(() => {
      checkDomain(value).then(
        (r) => !cancelled && setResult({ value, ...r }),
        (e) => !cancelled && setResult({ value, available: false, reason: e.message }),
      )
    }, CHECK_DELAY)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [value])

  const current = value && result?.value === value ? result : null
  const submit = (e) => {
    e.preventDefault()
    if (current?.available && !busy) onSubmit(current.name)
  }

  return (
    <form className="domain-picker" onSubmit={submit}>
      <div className="domain-input">
        <input
          className="input"
          value={value}
          autoFocus
          spellCheck={false}
          placeholder="ten-trang-cua-ban"
          aria-label="Tên miền"
          onChange={(e) => setValue(tidy(e.target.value))}
        />
        <span className="domain-suffix">.{rootDomain}</span>
      </div>
      <p className={`domain-check${current ? (current.available ? ' ok' : ' bad') : ''}`} aria-live="polite">
        {!value
          ? 'Chữ thường không dấu, số và dấu gạch ngang, 3–40 ký tự.'
          : !current
            ? 'Đang kiểm tra…'
            : current.available
              ? `✓ ${current.domain} có thể dùng`
              : `✗ ${current.reason}`}
      </p>
      <div className="modal-actions">
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            Huỷ
          </button>
        )}
        <button type="submit" className="btn primary" disabled={!current?.available || busy}>
          {busy ? 'Đang gửi…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
