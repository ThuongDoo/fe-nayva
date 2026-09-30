import { useEffect, useRef, useState } from 'react'
import { stripDiacritics } from '../lib/slug.js'
import { FONTS, FONT_GROUPS, loadFonts } from '../lib/fonts.js'

const norm = (s) => stripDiacritics(s).toLowerCase()

/**
 * Searchable font list, grouped by style, each name shown in its own font. Arrow keys move the
 * highlight, Enter picks, Escape calls onClose.
 */
export function FontList({ value, onPick, onClose }) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')
  const [active, setActive] = useState(value)
  const listRef = useRef(null)

  // Opening the list is when the previews are needed: fetch every font's stylesheet (files load as shown).
  useEffect(() => {
    loadFonts(FONTS.map((f) => f.value))
  }, [])

  const q = norm(query.trim())
  const shown = FONTS.filter((f) => (group === 'all' || f.group === group) && (!q || norm(f.label).includes(q)))

  // Keep the highlighted font in view (also scrolls to the current font on open).
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, group, q])

  const onKeyDown = (e) => {
    const i = shown.findIndex((f) => f.value === active)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = shown[Math.min(shown.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))]
      if (next) setActive(next.value)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const pick = shown[i] ?? shown[0]
      if (pick) onPick(pick.value)
    } else if (e.key === 'Escape') {
      e.stopPropagation()
      onClose?.()
    }
  }

  return (
    <div className="font-list" onKeyDown={onKeyDown}>
      <input
        className="input"
        placeholder={`Tìm trong ${FONTS.length} phông chữ…`}
        value={query}
        autoFocus
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="font-groups" role="tablist">
        {[{ id: 'all', label: 'Tất cả' }, ...FONT_GROUPS].map((g) => (
          <button
            key={g.id}
            type="button"
            role="tab"
            aria-selected={group === g.id}
            className={`font-group${group === g.id ? ' on' : ''}`}
            onClick={() => setGroup(g.id)}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className="font-options" ref={listRef} role="listbox" aria-label="Phông chữ">
        {FONT_GROUPS.map((g) => {
          const items = shown.filter((f) => f.group === g.id)
          if (!items.length) return null
          return (
            <div key={g.id} role="group" aria-label={g.label}>
              {group === 'all' && <div className="font-group-title">{g.label}</div>}
              {items.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  role="option"
                  aria-selected={f.value === value}
                  data-active={f.value === active}
                  className={`font-option${f.value === value ? ' selected' : ''}${f.value === active ? ' active' : ''}`}
                  style={{ fontFamily: f.stack }}
                  onMouseEnter={() => setActive(f.value)}
                  onClick={() => onPick(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )
        })}
        {!shown.length && <p className="font-empty">Không tìm thấy phông chữ.</p>}
      </div>
    </div>
  )
}
