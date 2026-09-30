import { useState } from 'react'
import { ICON_GROUPS, ICON_LIBRARY, iconSvg } from '../lib/iconLibrary.js'
import { stripDiacritics } from '../lib/slug.js'

/** Lowercase without Vietnamese accents, so "dien thoai" finds "Điện thoại". */
const searchable = (text) => stripDiacritics(text).toLowerCase()

/** Searchable, grouped icon grid (properties panel and quick toolbar). */
export default function IconPicker({ value, onPick, autoFocus = false }) {
  const [query, setQuery] = useState('')
  const q = searchable(query.trim())
  const matches = (name, icon) => !q || searchable(icon.label).includes(q) || name.toLowerCase().includes(q)
  // Grouped as usual; while searching, groups without a match are left out.
  const groups = ICON_GROUPS.map(([group, title]) => [
    title,
    Object.entries(ICON_LIBRARY).filter(([name, icon]) => icon.group === group && matches(name, icon)),
  ]).filter(([, icons]) => icons.length)

  return (
    <div className="icon-picker">
      <input
        className="input"
        type="search"
        value={query}
        autoFocus={autoFocus}
        placeholder={`Tìm trong ${Object.keys(ICON_LIBRARY).length} icon…`}
        onChange={(e) => setQuery(e.target.value)}
      />
      {!groups.length && <p className="hint">Không tìm thấy icon nào.</p>}
      {groups.map(([title, icons]) => (
        <div key={title} className="icon-group">
          <span className="field-label">{title}</span>
          <div className="icon-grid">
            {icons.map(([name, icon]) => (
              <button
                key={name}
                type="button"
                className={`icon-pick${value === name ? ' active' : ''}`}
                title={icon.label}
                aria-label={icon.label}
                aria-pressed={value === name}
                onClick={() => onPick(name)}
                dangerouslySetInnerHTML={{ __html: iconSvg({ icon: name, iconColor: 'currentColor', iconSize: 100 }) }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
