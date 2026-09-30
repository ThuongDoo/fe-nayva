import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'

/**
 * Admin marks on published sites, like Gmail's: a star for "needs attention" and coloured labels
 * (the list is shared by admins and editable in LabelManager). Stored by the backend (siteMarks.service.js).
 */

/** Colours offered for labels. */
const LABEL_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#16a34a', '#14b8a6', '#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#111827']

/** A label as a small coloured tag. */
export function LabelTag({ label, onRemove }) {
  return (
    <span className="site-label" style={{ '--label': label.color }}>
      {label.name}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Bỏ nhãn ${label.name}`} title="Bỏ nhãn">
          <Icon name="close" size={10} />
        </button>
      )}
    </span>
  )
}

export function StarButton({ starred, onToggle, disabled }) {
  return (
    <button
      type="button"
      className={`site-star${starred ? ' on' : ''}`}
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={starred}
      aria-label={starred ? 'Bỏ gắn sao' : 'Gắn sao (cần lưu ý)'}
      title={starred ? 'Bỏ gắn sao' : 'Gắn sao (cần lưu ý)'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"
          fill={starred ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

/** "Nhãn" button: a menu of every label with a tick for the site's, plus a way to manage the list. */
export function LabelMenu({ labels, value, onChange, onManage, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])
  const toggle = (id) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  return (
    <span className="label-menu" ref={ref}>
      <button type="button" className={`btn${open ? ' on' : ''}`} onClick={() => setOpen((o) => !o)} disabled={disabled} aria-expanded={open}>
        <Icon name="tag" size={14} />
        Nhãn
      </button>
      {open && (
        <div className="label-menu-pop" role="menu">
          <span className="label-menu-title">Gắn nhãn</span>
          {labels.length === 0 && <small className="hint">Chưa có nhãn nào.</small>}
          {labels.map((l) => (
            <label key={l.id} className="label-menu-item">
              <input type="checkbox" checked={value.includes(l.id)} onChange={() => toggle(l.id)} />
              <span className="label-dot" style={{ background: l.color }} />
              {l.name}
            </label>
          ))}
          <button
            type="button"
            className="label-menu-manage"
            onClick={() => {
              setOpen(false)
              onManage()
            }}
          >
            <Icon name="sliders" size={13} />
            Quản lý nhãn…
          </button>
        </div>
      )}
    </span>
  )
}

const newId = () => `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

/** Dialog to add, rename, recolour and delete labels. `onSave(labels)` resolves once stored. */
export function LabelManager({ labels, counts, onSave, onClose }) {
  const [draft, setDraft] = useState(() => labels.map((l) => ({ ...l })))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (id, patch) => setDraft((d) => d.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const invalid = draft.some((l) => !l.name.trim())

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await onSave(draft.map((l) => ({ ...l, name: l.name.trim() })))
      onClose()
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className="modal label-manager" role="dialog" aria-modal="true" aria-label="Quản lý nhãn">
        <h2>Quản lý nhãn</h2>
        <p className="hint">Nhãn dùng chung cho mọi quản trị viên. Xoá nhãn thì nó biến mất khỏi các trang đang gắn.</p>
        <ul className="label-edit-list">
          {draft.map((l) => (
            <li key={l.id} className="label-edit">
              <input className="input" value={l.name} maxLength={30} placeholder="Tên nhãn" onChange={(e) => set(l.id, { name: e.target.value })} aria-label="Tên nhãn" />
              <span className="label-colors" role="radiogroup" aria-label="Màu">
                {LABEL_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={l.color === c}
                    aria-label={c}
                    className={`label-color${l.color === c ? ' on' : ''}`}
                    style={{ background: c }}
                    onClick={() => set(l.id, { color: c })}
                  />
                ))}
              </span>
              <small className="label-edit-count">{counts[l.id] ? `${counts[l.id]} trang` : ''}</small>
              <button
                type="button"
                className="icon-btn danger"
                title="Xoá nhãn"
                onClick={() => {
                  if (counts[l.id] && !confirm(`Nhãn "${l.name}" đang gắn trên ${counts[l.id]} trang. Vẫn xoá?`)) return
                  setDraft((d) => d.filter((x) => x.id !== l.id))
                }}
              >
                <Icon name="trash" size={14} />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn"
          onClick={() => setDraft((d) => [...d, { id: newId(), name: '', color: LABEL_COLORS[d.length % LABEL_COLORS.length] }])}
          disabled={draft.length >= 30}
        >
          <Icon name="plus" size={14} />
          Thêm nhãn
        </button>
        {error && <p className="warn">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose} disabled={saving}>
            Huỷ
          </button>
          <button type="button" className="btn primary" onClick={save} disabled={saving || invalid}>
            {saving ? 'Đang lưu…' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Chips to narrow the list to starred sites or to one label, with how many sites each has. */
export function MarkFilter({ value, onChange, labels, sites }) {
  const count = (test) => sites.filter(test).length
  const chips = [
    { value: 'all', label: 'Tất cả', n: sites.length },
    { value: 'starred', label: 'Gắn sao', star: true, n: count((s) => s.starred) },
    ...labels.map((l) => ({ value: l.id, label: l.name, color: l.color, n: count((s) => s.labels?.includes(l.id)) })),
  ]
  return (
    <div className="admin-chips mark-filter" role="radiogroup" aria-label="Lọc theo đánh dấu">
      <span className="mark-filter-title">Đánh dấu:</span>
      {chips.map((c) => (
        <button
          key={c.value}
          type="button"
          role="radio"
          aria-checked={value === c.value}
          className={`admin-chip${value === c.value ? ' on' : ''}`}
          onClick={() => onChange(c.value)}
        >
          {c.star && <span className="mark-filter-star">★</span>}
          {c.color && <span className="label-dot" style={{ background: c.color }} />}
          {c.label}
          <span className="admin-chip-count">{c.n}</span>
        </button>
      ))}
    </div>
  )
}
