import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { Section } from './fields.jsx'
import {
  THEMES,
  applyTheme,
  designColors,
  finalColor,
  pageFamilies,
  pageTheme,
  recolorOptions,
  themeMap,
  unthemed,
} from '../lib/theme.js'

/**
 * Top-bar colour theme button: shows the theme in use (its name and the page's main colours) and opens
 * the theme panel below it. `doc` / `onApply`: see ThemePanel.
 */
export default function ThemeMenu({ doc, onApply }) {
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

  const choice = pageTheme(doc)
  const name = [THEMES.find((t) => t.id === choice.preset)?.name ?? 'Gốc', choice.dark && 'tối'].filter(Boolean).join(' · ')
  const swatches = useMemo(() => designColors(doc).slice(0, 5), [doc])

  return (
    <div className="theme-menu" ref={ref}>
      <button
        type="button"
        className={`theme-current${open ? ' on' : ''}`}
        title="Bộ màu của trang — bấm để đổi theme hoặc chỉnh từng màu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="theme-strip">
          {swatches.map(({ color }) => (
            <span key={color} style={{ background: color }} />
          ))}
        </span>
        <span className="theme-current-name">{name}</span>
        <Icon name="chevronDown" size={13} />
      </button>
      {open && (
        <div className="theme-pop">
          <ThemePanel doc={doc} onApply={onApply} />
        </div>
      )}
    </div>
  )
}

/**
 * Recolours the whole page at once. The page remembers its colours from before theming (page.theme,
 * see theme.js), so themes can be switched back and forth freely — also after closing the panel or
 * reopening the page — and "Gốc" always brings the original colours back.
 *
 * `onApply(design, first)`: show `design`; `first` is a change since the page was last edited some
 * other way, which becomes one undo step (later switches replace it, so a single undo goes back to the
 * colours before this round of theming).
 */
function ThemePanel({ doc, onApply }) {
  // The design this panel last put on the page.
  const [applied, setApplied] = useState(null)
  const choice = pageTheme(doc)
  const base = useMemo(() => unthemed(doc), [doc])

  const colors = useMemo(() => designColors(base), [base])
  const families = pageFamilies(doc, colors)
  const map = themeMap(colors, choice, families)
  // What each theme turns the page's main colours into, for the theme buttons.
  const presetSwatches = Object.fromEntries(
    THEMES.map((t) => {
      const m = themeMap(colors, { preset: t.id }, families)
      return [t.id, colors.slice(0, 5).map(({ color }) => m[color] ?? color)]
    }),
  )

  const choose = (patch) => {
    const design = applyTheme(doc, { ...choice, ...patch })
    onApply(design, doc !== applied)
    setApplied(design)
  }
  const setOverride = (color, value) => choose({ overrides: { ...choice.overrides, [color]: value } })
  const clearOverride = (color) => {
    const overrides = { ...choice.overrides }
    delete overrides[color]
    choose({ overrides })
  }

  return (
    <div className="theme-panel">
      <Section title="Bộ màu">
        <p className="hint">Bấm để đổi màu cả trang, chuyển qua lại thoải mái. "Gốc" trả lại màu ban đầu.</p>
        <div className="theme-presets">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`theme-preset${choice.preset === t.id ? ' active' : ''}`}
              onClick={() => choose({ preset: t.id, overrides: {} })}
            >
              <span className="theme-strip">
                {presetSwatches[t.id].map((c, i) => (
                  <span key={i} style={{ background: c }} />
                ))}
              </span>
              {t.name}
            </button>
          ))}
        </div>
        <label className="theme-dark">
          <input type="checkbox" checked={choice.dark} onChange={(e) => choose({ dark: e.target.checked })} />
          Nền tối (đảo sáng – tối)
        </label>
      </Section>

      <Section title={`Màu trên trang (${colors.length})`}>
        {colors.length ? (
          <>
            <p className="hint">
              Đổi một màu là đổi mọi chỗ đang dùng màu đó. Khi bấm sang theme khác, mọi màu (kể cả màu đã sửa tay) đều
              theo đúng theme đó.
            </p>
            <ul className="theme-colors">
              {colors.map(({ color, count }) => {
                const now = finalColor(color, map, recolorOptions(choice))
                return (
                  <li key={color}>
                    <span className="swatch" title={`Màu gốc ${color} — bấm để chọn màu khác`}>
                      <span style={{ background: now }} />
                      <input type="color" value={now} onChange={(e) => setOverride(color, e.target.value)} />
                    </span>
                    <code>{now}</code>
                    <small>{count} chỗ</small>
                    {color in choice.overrides && (
                      <button type="button" className="icon-btn sm" title="Bỏ màu tự chọn" onClick={() => clearOverride(color)}>
                        <Icon name="close" size={12} />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        ) : (
          <p className="hint">Trang chưa có màu nào để đổi.</p>
        )}
      </Section>
    </div>
  )
}
