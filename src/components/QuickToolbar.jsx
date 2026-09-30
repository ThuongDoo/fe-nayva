import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { ColorInput } from './fields.jsx'
import { FontList } from './FontPicker.jsx'
import IconPicker from './IconPicker.jsx'
import { ICON_LIBRARY, iconSvg } from '../lib/iconLibrary.js'
import { TEXT_TYPES } from '../lib/elements.js'
import { fontOf } from '../lib/fonts.js'
import { loadImageSize, loadVideoSize } from '../lib/image.js'
import { ROUNDABLE_SHAPES, randomSeed } from '../lib/shapes.js'
import { DECORS, INK_STYLES, STAIN_PRESETS, decorSvg } from '../lib/decor.js'
import { MOTIONS, MOTION_CSS, motionOf, motionStyle, normalizeMotion } from '../lib/motion.js'

const ALIGNS = ['left', 'center', 'right', 'justify']
const ALIGN_ICONS = { left: 'alignLeft', center: 'alignCenter', right: 'alignRight', justify: 'alignJustify' }
const ALIGN_LABELS = { left: 'Căn trái', center: 'Căn giữa', right: 'Căn phải', justify: 'Căn đều' }

/** Colour swatch that opens a colour picker (solid or gradient) under it. */
/**
 * `letter` or `glyph` (an icon name) shows what the colour is for, with the colour as a bar under it;
 * otherwise a round swatch (backgrounds).
 */
function ColorButton({ id, title, value, onChange, openId, setOpenId, allowNone = false, allowGradient = true, letter, glyph }) {
  const open = openId === id
  return (
    <span className="qt-color">
      <button
        type="button"
        className={`qt-btn${open ? ' on' : ''}`}
        title={title}
        aria-label={title}
        aria-expanded={open}
        onClick={() => setOpenId(open ? null : id)}
      >
        {letter || glyph ? (
          <span className="qt-letter">
            {glyph ? <Icon name={glyph} size={15} /> : letter}
            <span className="qt-underline" style={{ background: value }} />
          </span>
        ) : (
          <span className="qt-swatch" style={{ background: value }} />
        )}
      </button>
      {open && (
        <div className="qt-popover" onPointerDown={(e) => e.stopPropagation()}>
          <span className="qt-popover-title">{title}</span>
          <ColorInput value={value} allowNone={allowNone} allowGradient={allowGradient} onChange={onChange} />
        </div>
      )}
    </span>
  )
}

/** Toolbar button that opens a small panel under it (sliders etc.); shares the open state with the colour buttons. */
function PanelButton({ id, title, icon, openId, setOpenId, active = false, children }) {
  const open = openId === id
  return (
    <span className="qt-color">
      <button
        type="button"
        className={`qt-btn${open || active ? ' on' : ''}`}
        title={title}
        aria-label={title}
        aria-expanded={open}
        onClick={() => setOpenId(open ? null : id)}
      >
        <Icon name={icon} size={15} />
      </button>
      {open && (
        <div className="qt-popover qt-panel" onPointerDown={(e) => e.stopPropagation()}>
          {children}
        </div>
      )}
    </span>
  )
}

/** The current font, in its own face; opens the searchable font list under the toolbar. */
function FontButton({ value, onChange, openId, setOpenId }) {
  const open = openId === 'font'
  const font = fontOf(value)
  return (
    <span className="qt-color">
      <button
        type="button"
        className={`qt-select qt-font${open ? ' on' : ''}`}
        title="Phông chữ"
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{ fontFamily: font.stack }}
        onClick={() => setOpenId(open ? null : 'font')}
      >
        <span>{font.label}</span>
        <Icon name="chevronDown" size={13} />
      </button>
      {open && (
        <div className="qt-popover qt-font-pop" onPointerDown={(e) => e.stopPropagation()}>
          <FontList
            value={font.value}
            onClose={() => setOpenId(null)}
            onPick={(v) => {
              onChange(v)
              setOpenId(null)
            }}
          />
        </div>
      )}
    </span>
  )
}

/** Shows the icon element's current icon; opens the searchable icon grid to swap it. */
function IconSwapButton({ value, onChange, openId, setOpenId }) {
  const open = openId === 'icon'
  const title = `Đổi icon (đang dùng: ${ICON_LIBRARY[value]?.label ?? value})`
  return (
    <span className="qt-color">
      <button
        type="button"
        className={`qt-btn qt-icon-swap${open ? ' on' : ''}`}
        title={title}
        aria-label={title}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpenId(open ? null : 'icon')}
      >
        <span className="qt-icon-glyph" dangerouslySetInnerHTML={{ __html: iconSvg({ icon: value, iconColor: 'currentColor', iconSize: 100 }) }} />
        <Icon name="chevronDown" size={13} />
      </button>
      {open && (
        <div className="qt-popover qt-icon-pop" onPointerDown={(e) => e.stopPropagation()}>
          <span className="qt-popover-title">Đổi icon</span>
          <IconPicker
            value={value}
            autoFocus
            onPick={(name) => {
              onChange(name)
              setOpenId(null)
            }}
          />
        </div>
      )}
    </span>
  )
}

/** Small drawings of each ink blot style (fixed seed), in the text colour, for the style picker. */
const INK_PREVIEWS = Object.fromEntries(
  INK_STYLES.map(([style]) => [
    style,
    { __html: decorSvg({ props: { kind: 'ink', inkStyle: style, seed: 7, color: 'currentColor' } }, `qt-ink-${style}`, { w: 44, h: 44 }) },
  ]),
)

/** Grid of ink blot styles, each shown as a drawing. */
function InkStylePicker({ value, onChange }) {
  return (
    <div className="ink-styles" role="radiogroup" aria-label="Dạng vết mực">
      {INK_STYLES.map(([style, label]) => (
        <button
          key={style}
          type="button"
          role="radio"
          aria-checked={value === style}
          className={`ink-style${value === style ? ' on' : ''}`}
          onClick={() => onChange(style)}
        >
          <span className="ink-style-art" dangerouslySetInnerHTML={INK_PREVIEWS[style]} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}

/** Every traced stain as a small drawing, to swap the selected one for another. */
function StainPicker({ value, onChange }) {
  return (
    <div className="stain-picks" role="radiogroup" aria-label="Chọn vết mực">
      {STAIN_PRESETS.map((s, i) => (
        <button
          key={s.key}
          type="button"
          role="radio"
          aria-checked={value === i}
          title={s.label}
          className={`stain-pick${value === i ? ' on' : ''}`}
          onClick={() => onChange(i, s)}
          dangerouslySetInnerHTML={{ __html: decorSvg({ props: { kind: 'stain', stain: i, color: 'currentColor' } }, `qt-stain-${i}`) }}
        />
      ))}
    </div>
  )
}

/**
 * Looping motion of the element (see motion.js): every effect as a chip that plays it on a small dot,
 * then its speed, start delay and, for turns, the direction.
 */
function MotionPanel({ el, setEl }) {
  const m = normalizeMotion(el.motion)
  const set = (patch, key) => setEl({ motion: { ...m, ...patch } }, key && `motion.${key}`)
  const kinds = [['none', 'Không'], ...Object.entries(MOTIONS).map(([k, d]) => [k, d.label])]
  return (
    <>
      <span className="qt-popover-title">Chuyển động</span>
      <style href="kt-motion" precedence="default">
        {MOTION_CSS}
      </style>
      <div className="motion-picks" role="radiogroup" aria-label="Hiệu ứng chuyển động">
        {kinds.map(([kind, label]) => {
          const on = (m?.kind ?? 'none') === kind
          return (
            <button key={kind} type="button" role="radio" aria-checked={on} className={`motion-pick${on ? ' on' : ''}`} onClick={() => setEl({ motion: motionOf(kind) })}>
              <span className="motion-pick-art" aria-hidden="true">
                <span className="kt-motion" style={motionStyle(motionOf(kind))}>
                  <span className="motion-pick-dot" />
                </span>
              </span>
              <span>{label}</span>
            </button>
          )
        })}
      </div>
      {m && (
        <>
          <Slider label="Mỗi vòng" value={m.duration} min={0.2} max={20} step={0.1} format={(v) => `${v}s`} onChange={(v) => set({ duration: v }, 'duration')} />
          <Slider label="Bắt đầu sau" value={m.delay} min={0} max={10} step={0.1} format={(v) => `${v}s`} onChange={(v) => set({ delay: v }, 'delay')} />
          {MOTIONS[m.kind].turns && (
            <div className="seg motion-dir">
              <button type="button" className={m.reverse ? '' : 'active'} onClick={() => set({ reverse: false })}>
                <Icon name="rotate" size={14} /> Thuận chiều
              </button>
              <button type="button" className={m.reverse ? 'active' : ''} onClick={() => set({ reverse: true })}>
                <Icon name="rotateLeft" size={14} /> Ngược chiều
              </button>
            </div>
          )}
          <p className="motion-hint">Số giây càng nhỏ càng nhanh.</p>
        </>
      )}
    </>
  )
}

/** Labelled slider with its value, for the toolbar panels. */
function Slider({ label, value, min, max, step, format, onChange }) {
  return (
    <label className="qt-slider">
      <span className="qt-slider-head">
        <span>{label}</span>
        <strong>{format(value)}</strong>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}

/** −  n  + for a number (font size, corner radius, line width). */
function Stepper({ title, value, min, max, step = 1, onChange, icon }) {
  const [draft, setDraft] = useState(null)
  const set = (v) => onChange(Math.min(max, Math.max(min, Math.round(v * 10) / 10)))
  return (
    <span className="qt-stepper" title={title}>
      {icon && (
        <span className="qt-stepper-icon" aria-hidden="true">
          <Icon name={icon} size={14} />
        </span>
      )}
      <button type="button" className="qt-btn sm" aria-label={`Giảm ${title.toLowerCase()}`} onClick={() => set(value - step)}>
        <Icon name="minus" size={12} />
      </button>
      <input
        type="number"
        aria-label={title}
        value={draft ?? value}
        onChange={(e) => {
          setDraft(e.target.value)
          const n = parseFloat(e.target.value)
          if (!Number.isNaN(n)) set(n)
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(e) => e.stopPropagation()}
      />
      <button type="button" className="qt-btn sm" aria-label={`Tăng ${title.toLowerCase()}`} onClick={() => set(value + step)}>
        <Icon name="plus" size={12} />
      </button>
    </span>
  )
}

const Sep = () => <span className="qt-sep" aria-hidden="true" />

/**
 * Small floating toolbar over the selected element with its most used settings; the side panel still
 * has everything. `setStyle`/`setProps(patch, key)` merge consecutive edits of the same field into one
 * undo step.
 */
/** Mirror buttons for images and shapes (top-level flipX / flipY on the element). */
function flipButtons(el, setEl) {
  return [
    <button key="fx" type="button" className={`qt-btn${el.flipX ? ' on' : ''}`} title="Lật ngang" aria-pressed={el.flipX} onClick={() => setEl({ flipX: !el.flipX })}>
      <Icon name="flipH" size={15} />
    </button>,
    <button key="fy" type="button" className={`qt-btn${el.flipY ? ' on' : ''}`} title="Lật dọc" aria-pressed={el.flipY} onClick={() => setEl({ flipY: !el.flipY })}>
      <Icon name="flipV" size={15} />
    </button>,
  ]
}

/**
 * "Chỉnh ảnh": the drag-to-reposition mode for the image/video inside a shape (same as the side
 * panel's "Kéo ảnh trực tiếp trên trang"). Images added before positioning existed are measured first.
 */
function RepositionButton({ el, setProps, onAction }) {
  const [busy, setBusy] = useState(false)
  const p = el.props
  const video = p.mediaType === 'video'
  const start = async () => {
    if (!p.imgW) {
      setBusy(true)
      try {
        const { width, height } = await (video ? loadVideoSize : loadImageSize)(p.src)
        setProps({ imgW: width, imgH: height })
      } catch {
        alert(video ? 'Không tải được video.' : 'Không tải được ảnh.')
        return
      } finally {
        setBusy(false)
      }
    }
    onAction('crop')
  }
  return (
    <button
      type="button"
      className="qt-btn qt-text-btn"
      title={`Kéo ${video ? 'video' : 'ảnh'} trực tiếp trên trang: kéo để dời, cuộn chuột để phóng (hoặc nhấp đúp vào hình)`}
      onClick={start}
      disabled={busy || el.locked}
    >
      <Icon name="move" size={15} />
      {busy ? 'Đang tải…' : `Chỉnh ${video ? 'video' : 'ảnh'}`}
    </button>
  )
}

export default function QuickToolbar({ el, setStyle, setProps, setEl, onAction, style }) {
  const [openId, setOpenId] = useState(null)
  const ref = useRef(null)
  const s = el.style
  const p = el.props
  const color = (id, title, value, onChange, extra = {}) => (
    <ColorButton key={id} id={id} title={title} value={value} onChange={onChange} openId={openId} setOpenId={setOpenId} {...extra} />
  )

  // A click anywhere else closes the colour picker.
  useEffect(() => {
    if (!openId) return
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpenId(null)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [openId])

  // The properties panel hides what these controls cover: keep lib/quickFields.js in step with them.
  let controls = []
  if (TEXT_TYPES.includes(el.type)) {
    const bold = s.fontWeight >= 600
    const next = ALIGNS[(ALIGNS.indexOf(s.textAlign) + 1) % ALIGNS.length]
    controls = [
      <FontButton key="font" value={s.fontFamily} openId={openId} setOpenId={setOpenId} onChange={(v) => setStyle({ fontFamily: v })} />,
      <Stepper key="size" title="Cỡ chữ" value={s.fontSize} min={6} max={400} step={2} onChange={(v) => setStyle({ fontSize: v }, 'fontSize')} />,
      <Sep key="s1" />,
      <button key="b" type="button" className={`qt-btn${bold ? ' on' : ''}`} title="In đậm" aria-pressed={bold} onClick={() => setStyle({ fontWeight: bold ? 400 : 700 })}>
        <b>B</b>
      </button>,
      <button key="i" type="button" className={`qt-btn${s.italic ? ' on' : ''}`} title="In nghiêng" aria-pressed={s.italic} onClick={() => setStyle({ italic: !s.italic })}>
        <Icon name="italic" size={15} />
      </button>,
      <button key="u" type="button" className={`qt-btn${s.underline ? ' on' : ''}`} title="Gạch chân" aria-pressed={s.underline} onClick={() => setStyle({ underline: !s.underline })}>
        <Icon name="underline" size={15} />
      </button>,
      <Sep key="s2" />,
      color('color', 'Màu chữ', s.color, (v) => setStyle({ color: v }, 'color'), { letter: 'A' }),
      color('bg', 'Màu nền', s.background, (v) => setStyle({ background: v }, 'background'), { allowNone: true }),
      <button key="align" type="button" className="qt-btn" title={`${ALIGN_LABELS[s.textAlign]} (bấm để đổi)`} onClick={() => setStyle({ textAlign: next })}>
        <Icon name={ALIGN_ICONS[s.textAlign] ?? 'alignLeft'} size={15} />
      </button>,
      <PanelButton key="spacing" id="spacing" title="Khoảng cách dòng và chữ" icon="spacing" openId={openId} setOpenId={setOpenId}>
        <Slider
          label="Giãn dòng"
          value={s.lineHeight}
          min={0.8}
          max={3}
          step={0.05}
          format={(v) => v.toFixed(2)}
          onChange={(v) => setStyle({ lineHeight: v }, 'lineHeight')}
        />
        <Slider
          label="Giãn chữ"
          value={s.letterSpacing}
          min={-5}
          max={30}
          step={0.5}
          format={(v) => `${v}px`}
          onChange={(v) => setStyle({ letterSpacing: v }, 'letterSpacing')}
        />
      </PanelButton>,
    ]
  } else if (el.type === 'box' || el.type === 'video') {
    controls = [
      color('bg', 'Màu nền', s.background, (v) => setStyle({ background: v }, 'background'), { allowNone: true }),
      <Stepper key="r" title="Bo góc" icon="corner" value={s.radius} min={0} max={999} step={4} onChange={(v) => setStyle({ radius: v }, 'radius')} />,
    ]
  } else if (el.type === 'image') {
    controls = [
      <Stepper key="r" title="Bo góc" icon="corner" value={s.radius} min={0} max={999} step={4} onChange={(v) => setStyle({ radius: v }, 'radius')} />,
      <Sep key="s1" />,
      ...flipButtons(el, setEl),
    ]
  } else if (el.type === 'shape') {
    controls = [
      ...(p.src ? [<RepositionButton key="crop" el={el} setProps={setProps} onAction={onAction} />, <Sep key="s0" />] : []),
      color('bg', 'Màu nền hình', s.background, (v) => setStyle({ background: v }, 'background'), { allowNone: true }),
      ...(p.rim > 0 ? [color('rim', 'Màu viền', p.rimColor, (v) => setProps({ rimColor: v }, 'rimColor'), { glyph: 'box' })] : []),
      // Only shapes with sharp corners can be rounded (circles, hearts… are already curved).
      ...(ROUNDABLE_SHAPES.includes(p.shape)
        ? [<Stepper key="r" title="Bo góc" icon="corner" value={p.cornerRadius ?? 0} min={0} max={200} step={4} onChange={(v) => setProps({ cornerRadius: v }, 'cornerRadius')} />]
        : []),
      <Sep key="s1" />,
      ...flipButtons(el, setEl),
    ]
  } else if (el.type === 'icon') {
    controls = [
      <IconSwapButton key="icon" value={p.icon} openId={openId} setOpenId={setOpenId} onChange={(name) => setProps({ icon: name })} />,
      <Sep key="s0" />,
      color('ic', 'Màu icon', p.iconColor, (v) => setProps({ iconColor: v }, 'iconColor'), { glyph: 'icon' }),
      color('bg', 'Màu nền', s.background, (v) => setStyle({ background: v }, 'background'), { allowNone: true }),
    ]
  } else if (el.type === 'divider') {
    controls = [
      color('line', 'Màu đường kẻ', s.color, (v) => setStyle({ color: v }, 'color'), { glyph: 'divider' }),
      <Stepper key="w" title="Độ dày" icon="divider" value={s.lineWidth} min={1} max={40} onChange={(v) => setStyle({ lineWidth: v }, 'lineWidth')} />,
    ]
  } else if (el.type === 'decor') {
    controls = [
      color('dc', 'Màu', p.color, (v) => setProps({ color: v }, 'color'), { glyph: 'decor' }),
      ...(p.kind === 'stain'
        ? [
            <PanelButton key="stain" id="stain" title="Đổi vết mực" icon="sliders" openId={openId} setOpenId={setOpenId}>
              <span className="qt-popover-title">Đổi vết mực</span>
              <StainPicker
                value={p.stain ?? 0}
                // Keeps the width, takes the new stain's proportions so it isn't squashed.
                onChange={(i, s) => setEl({ h: Math.max(16, Math.round((el.w * s.h) / s.w)), props: { stain: i } })}
              />
            </PanelButton>,
          ]
        : []),
      ...(p.kind === 'ink'
        ? [
            <PanelButton key="ink" id="ink" title="Dạng vết mực" icon="sliders" openId={openId} setOpenId={setOpenId}>
              <span className="qt-popover-title">Dạng vết mực</span>
              <InkStylePicker value={p.inkStyle ?? 'blot'} onChange={(v) => setProps({ inkStyle: v })} />
            </PanelButton>,
          ]
        : []),
      ...(DECORS[p.kind]?.line
        ? [<Stepper key="sw" title="Độ dày nét" icon="divider" value={p.strokeWidth} min={1} max={30} onChange={(v) => setProps({ strokeWidth: v }, 'strokeWidth')} />]
        : []),
      <Sep key="s1" />,
      ...(DECORS[p.kind]?.fixed
        ? []
        : [
            <button key="seed" type="button" className="qt-btn qt-text-btn" title="Vẽ lại với nét khác (giữ màu và kích thước)" onClick={() => setProps({ seed: randomSeed() })}>
              <Icon name="shuffle" size={15} />
              Tạo hình khác
            </button>,
          ]),
      <button
        key="blend"
        type="button"
        className={`qt-btn${p.blend ? ' on' : ''}`}
        title="Hoà trộn với nền (như mực in lên chữ / ảnh bên dưới)"
        aria-pressed={p.blend}
        onClick={() => setProps({ blend: !p.blend })}
      >
        <Icon name="blend" size={15} />
      </button>,
    ]
  } else if (el.type === 'audio') {
    // The visualizer draws on a canvas, so its two colours stay solid (they already form a gradient).
    controls = [
      color('c1', 'Màu 1', p.color, (v) => setProps({ color: v }, 'color'), { allowGradient: false, letter: '1' }),
      color('c2', 'Màu 2', p.color2, (v) => setProps({ color2: v }, 'color2'), { allowGradient: false, letter: '2' }),
      color('bg', 'Màu nền', s.background, (v) => setStyle({ background: v }, 'background'), { allowNone: true }),
    ]
  }

  return (
    // Stops pointer events so using the toolbar doesn't deselect or drag the element under it.
    <div ref={ref} className="quick-toolbar" style={style} onPointerDown={(e) => e.stopPropagation()} role="toolbar" aria-label="Chỉnh nhanh">
      {controls}
      {controls.length > 0 && <Sep />}
      <PanelButton id="opacity" title="Độ mờ" icon="opacity" openId={openId} setOpenId={setOpenId}>
        <Slider
          label="Độ mờ"
          value={Math.round(s.opacity * 100)}
          min={0}
          max={100}
          step={1}
          format={(v) => `${v}%`}
          onChange={(v) => setStyle({ opacity: v / 100 }, 'opacity')}
        />
      </PanelButton>
      <PanelButton id="motion" title="Chuyển động (xoay, nảy, nhấp nháy…)" icon="motion" active={Boolean(normalizeMotion(el.motion))} openId={openId} setOpenId={setOpenId}>
        <MotionPanel el={el} setEl={setEl} />
      </PanelButton>
      <button type="button" className="qt-btn" title="Nhân bản (Ctrl+D)" onClick={() => onAction('duplicate')}>
        <Icon name="copy" size={15} />
      </button>
      <button type="button" className="qt-btn danger" title="Xoá (Delete)" onClick={() => onAction('delete')}>
        <Icon name="trash" size={15} />
      </button>
    </div>
  )
}
