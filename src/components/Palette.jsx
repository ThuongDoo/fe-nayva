import { useState } from 'react'
import Icon from './Icon.jsx'
import {
  BUTTON_ORDER,
  BUTTON_PRESETS,
  DND_TYPE,
  ELEMENT_TYPES,
  PALETTE_ORDER,
  SHADOWS,
  TEXT_ORDER,
  TEXT_PRESETS,
  createFromKey,
} from '../lib/elements.js'
import { AUDIO_ORDER, AUDIO_PRESETS } from '../lib/audioViz.js'
import { iconSvg } from '../lib/iconLibrary.js'
import { SHAPES, SHAPE_ORDER, shapePaths } from '../lib/shapes.js'
import { STAIN_PRESETS, decorSvg } from '../lib/decor.js'

// Small, fixed tear so the torn-paper tile icon reads at 20px.
const ICON_PROPS = { edge: 'diagonal', depth: 1.2, tooth: 2.5, rim: 0, seed: 7 }

function ShapeIcon({ shape }) {
  return (
    <svg width={20} height={20} viewBox="-2 -2 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d={shapePaths(shape, 20, 20, ICON_PROPS).fill} />
    </svg>
  )
}

const TEXT_ICONS = {
  title: <path d="M3 4h14M10 4v13" strokeWidth="2.6" />,
  heading: <path d="M5 4v12M15 4v12M5 10h10" strokeWidth="2.2" />,
  subheading: <path d="M4 6v8M11 6v8M4 10h7M14 14h3" />,
  paragraph: <path d="M3 5h14M3 9h14M3 13h14M3 17h9" />,
  quote: (
    <path d="M4 14c0-4 1.5-6 4-7M4 14a2 2 0 1 0 4 0 2 2 0 1 0-4 0M11 14c0-4 1.5-6 4-7M11 14a2 2 0 1 0 4 0 2 2 0 1 0-4 0" />
  ),
  list: <path d="M3 5h.01M3 10h.01M3 15h.01M7 5h10M7 10h10M7 15h10" strokeWidth="2" />,
  caption: <path d="M3 4h14v8H3zM5 16h10" />,
  label: <path d="M3 4h8l6 6-6 6H3zM6.5 8h.01" />,
}

/** A miniature of each button preset, drawn from the element it creates. */
const BUTTON_SAMPLES = Object.fromEntries(
  BUTTON_ORDER.map((key) => {
    const el = createFromKey(`button:${key}`)
    const s = el.style
    const isIcon = el.type === 'icon'
    return [
      key,
      {
        // Icon buttons show their icon in a small square instead of the word "Nút".
        html: isIcon ? iconSvg({ ...el.props, iconSize: Math.min(el.props.iconSize + 10, 100) }) : null,
        style: {
          ...(isIcon && { width: 22, height: 22 }),
          background: s.background,
          color: s.color,
          border: s.borderWidth > 0 ? `1.5px solid ${s.borderColor}` : 'none',
          // Pills stay pills; other corners are scaled down with the button.
          borderRadius: s.radius >= 100 ? 999 : Math.min(s.radius, 5),
          boxShadow: s.shadow !== 'none' ? SHADOWS.sm : 'none',
          textDecoration: s.underline ? 'underline' : 'none',
        },
      },
    ]
  }),
)

// Frozen levels for the 20px audio tile icons.
const ICON_LEVELS = [0.45, 0.8, 0.55, 1, 0.65, 0.35, 0.75]

/** A still, simplified picture of each audio effect. */
function AudioIcon({ viz }) {
  const n = ICON_LEVELS.length
  let body
  if (viz === 'circle') {
    body = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2
      const r2 = 5 + (i % 3 === 0 ? 5 : i % 2 ? 3 : 4)
      return <line key={i} x1={10 + Math.cos(a) * 4} y1={10 + Math.sin(a) * 4} x2={10 + Math.cos(a) * r2} y2={10 + Math.sin(a) * r2} />
    })
  } else if (viz === 'pulse') {
    body = (
      <>
        <circle cx="10" cy="10" r="3.5" fill="currentColor" />
        <path d="M10 2.5c3 0 4.2 2.3 5.8 3.3 1.8 1.2 2.2 3.5 1 5.6-1 1.9-.6 4.6-3.3 5.4-2 .6-2.8-.6-4.4.3-1.8 1-3.7.7-4.9-.9-1.1-1.5-3.4-2.4-2.9-4.9.4-2 .1-3 1.4-4.9C4.1 4.2 6.8 2.5 10 2.5z" />
      </>
    )
  } else if (viz === 'wave') {
    body = <path d="M1 10c2-5 3 5 5 0s3-7 5 0 3 5 4 0 2-3 4 0M1 10c2 5 3-5 5 0s3 7 5 0 3-5 4 0 2 3 4 0" />
  } else if (viz === 'dots') {
    body = ICON_LEVELS.slice(0, 5).map((l, i) => <circle key={i} cx={2 + i * 4} cy="10" r={0.6 + l * 1.4} fill="currentColor" />)
  } else if (viz === 'blocks') {
    body = ICON_LEVELS.slice(0, 5).map((l, i) =>
      Array.from({ length: Math.round(l * 5) }, (_, j) => (
        <rect key={`${i}-${j}`} x={1.5 + i * 3.6} y={16.5 - j * 3.4} width="2.6" height="2.4" fill="currentColor" stroke="none" />
      )),
    )
  } else {
    body = ICON_LEVELS.map((l, i) => {
      const h = 3 + l * 13
      const x = 2 + i * (16 / (n - 1))
      return viz === 'mirror' ? <line key={i} x1={x} y1={10 - h / 2} x2={x} y2={10 + h / 2} /> : <line key={i} x1={x} y1={18} x2={x} y2={18 - h} />
    })
  }
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      {body}
    </svg>
  )
}

/** A stain's own outline, fitted in a 40 × 28 tile, in the tile's text colour. */
function StainIcon({ index }) {
  const s = STAIN_PRESETS[index]
  const k = Math.min(40 / s.w, 28 / s.h)
  const html = { __html: decorSvg({ props: { kind: 'stain', stain: index, color: 'currentColor' } }, `palette-stain-${index}`) }
  return <span className="stain-icon" style={{ width: s.w * k, height: s.h * k }} dangerouslySetInnerHTML={html} aria-hidden="true" />
}

function Tile({ dragKey, onAdd, children }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="tile"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DND_TYPE, dragKey)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      onClick={() => onAdd(dragKey)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onAdd(dragKey)
        }
      }}
    >
      {children}
    </div>
  )
}

/** How many tiles a collapsed group shows. */
const PREVIEW_COUNT = 2
const OPEN_GROUPS_KEY = 'keo-tha-web:palette-open'

function readOpenGroups() {
  try {
    return JSON.parse(localStorage.getItem(OPEN_GROUPS_KEY)) || {}
  } catch {
    return {}
  }
}

/**
 * A palette group. Collapsed it shows only its first tiles, to keep the column short; the button
 * next to the title expands it. Which groups are open is remembered in this browser.
 */
/** A palette group. `empty`: what to say while it has no tiles yet. */
function Group({ title, hint, empty, count, wide, open, onToggle, children = [] }) {
  const tiles = open ? children : children.slice(0, PREVIEW_COUNT)
  const more = count > PREVIEW_COUNT
  return (
    <section className={`section palette-group${open ? ' open' : ''}`}>
      <div className="group-head">
        <h4>
          {title}
          <span className="group-count">{count}</span>
        </h4>
        {more && (
          <button
            type="button"
            className={`icon-btn sm${open ? ' on' : ''}`}
            title={open ? 'Thu gọn' : `Xem tất cả ${count}`}
            aria-expanded={open}
            onClick={onToggle}
          >
            <Icon name={open ? 'minimize' : 'maximize'} size={14} />
          </button>
        )}
      </div>
      {open && hint && <p className="hint">{hint}</p>}
      {/* Collapsed groups use two wide columns so their two tiles fill the row. */}
      {count === 0 ? (
        <p className="hint palette-empty">{empty}</p>
      ) : (
        <div className={`tiles${open && !wide ? ' tiles-3' : ''}`}>{tiles}</div>
      )}
      {more && !open && (
        <button type="button" className="group-more" onClick={onToggle}>
          Xem tất cả {count}
        </button>
      )}
    </section>
  )
}

export default function Palette({ onAdd }) {
  const [openGroups, setOpenGroups] = useState(readOpenGroups)
  const toggle = (id) =>
    setOpenGroups((cur) => {
      const next = { ...cur, [id]: !cur[id] }
      try {
        localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(next))
      } catch {
        // Only a convenience; the palette works without remembering.
      }
      return next
    })
  const group = (id) => ({ open: !!openGroups[id], onToggle: () => toggle(id) })

  return (
    <div className="palette">
      <p className="hint">Kéo vào trang, hoặc nhấp để thêm.</p>

      <Group {...group('text')} title="Chữ" count={TEXT_ORDER.length} hint="Nhấp đúp vào chữ trên trang để sửa.">
        {TEXT_ORDER.map((preset) => (
          <Tile key={preset} dragKey={`text:${preset}`} onAdd={onAdd}>
            <svg
              width={20}
              height={20}
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {TEXT_ICONS[preset]}
            </svg>
            <span>{TEXT_PRESETS[preset].label}</span>
          </Tile>
        ))}
      </Group>

      <Group {...group('button')} title="Nút bấm" count={BUTTON_ORDER.length}>
        {BUTTON_ORDER.map((preset) => (
          <Tile key={preset} dragKey={`button:${preset}`} onAdd={onAdd}>
            {BUTTON_SAMPLES[preset].html ? (
              <span
                className="button-sample"
                style={BUTTON_SAMPLES[preset].style}
                dangerouslySetInnerHTML={{ __html: BUTTON_SAMPLES[preset].html }}
              />
            ) : (
              <span className="button-sample" style={BUTTON_SAMPLES[preset].style}>
                Nút
              </span>
            )}
            <span>{BUTTON_PRESETS[preset].label}</span>
          </Tile>
        ))}
      </Group>

      <Group
        {...group('elements')}
        title="Thành phần"
        count={PALETTE_ORDER.length}
        wide
        hint="Mẹo: kéo thả tệp ảnh từ máy tính vào trang để chèn ảnh."
      >
        {PALETTE_ORDER.map((type) => (
          <Tile key={type} dragKey={type} onAdd={onAdd}>
            <Icon name={type} size={20} />
            <span>{ELEMENT_TYPES[type].label}</span>
          </Tile>
        ))}
      </Group>

      <Group
        {...group('shapes')}
        title="Hình khối"
        count={SHAPE_ORDER.length}
        hint="Chèn ảnh hoặc video vào hình: thả tệp lên hình, hoặc chọn ở bảng bên phải."
      >
        {SHAPE_ORDER.map((shape) => (
          <Tile key={shape} dragKey={`shape:${shape}`} onAdd={onAdd}>
            <ShapeIcon shape={shape} />
            <span>{SHAPES[shape].label}</span>
          </Tile>
        ))}
      </Group>

      <Group
        {...group('decor')}
        title="Trang trí"
        count={1}
        empty="Chưa có mẫu trang trí nào."
        hint={`Vết mực thật (starline / Freepik): ${STAIN_PRESETS.length} hình dạng — chọn ở “Đổi vết mực” trên thanh công cụ nhỏ.`}
      >
        {/* One element; its shape is picked afterwards among all the traced stains. */}
        {[
          <Tile key="stain" dragKey={`decor:${STAIN_PRESETS[0].key}`} onAdd={onAdd}>
            <StainIcon index={0} />
            <span>Vết mực</span>
          </Tile>,
        ]}
      </Group>

      <Group
        {...group('audio')}
        title="Âm thanh"
        count={AUDIO_ORDER.length}
        hint="Hiệu ứng nhảy theo nhạc khi phát. Tải tệp âm thanh ở bảng bên phải."
      >
        {AUDIO_ORDER.map((viz) => (
          <Tile key={viz} dragKey={`audio:${viz}`} onAdd={onAdd}>
            <AudioIcon viz={viz} />
            <span>{AUDIO_PRESETS[viz].label}</span>
          </Tile>
        ))}
      </Group>
    </div>
  )
}
