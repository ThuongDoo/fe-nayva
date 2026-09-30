import { AUDIO_PRESETS } from './audioViz.js'
import { DECORS, decorPreset } from './decor.js'
import { FONTS, fontStack } from './fonts.js'
import { firstColor, isGradient } from './gradient.js'
import { SHAPES, randomSeed } from './shapes.js'

export const GRID = 10
export const DND_TYPE = 'application/x-builder-element'
export const TEXT_TYPES = ['heading', 'text', 'button']

export const uid = () => Math.random().toString(36).slice(2, 9)
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

// Fonts live in fonts.js; re-exported for the modules that import them from here.
export { FONTS, fontStack }

export const SHADOWS = {
  none: 'none',
  sm: '0 1px 3px rgba(15, 23, 42, 0.12)',
  md: '0 8px 20px rgba(15, 23, 42, 0.12)',
  lg: '0 20px 48px rgba(15, 23, 42, 0.2)',
}

const VALIGN = { top: 'flex-start', middle: 'center', bottom: 'flex-end' }

export const BASE_STYLE = {
  background: 'transparent',
  color: '#111827',
  fontFamily: 'be-vietnam',
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.5,
  letterSpacing: 0,
  textAlign: 'left',
  verticalAlign: 'top',
  italic: false,
  underline: false,
  padding: 0,
  radius: 0,
  borderWidth: 0,
  borderColor: '#d1d5db',
  borderStyle: 'solid',
  shadow: 'none',
  opacity: 1,
  lineWidth: 2,
  lineStyle: 'solid',
}

export const ELEMENT_TYPES = {
  heading: {
    label: 'Tiêu đề',
    w: 520,
    h: 60,
    props: { text: 'Tiêu đề của bạn' },
    style: { fontSize: 40, fontWeight: 700, lineHeight: 1.2 },
  },
  text: {
    label: 'Đoạn văn',
    w: 420,
    h: 100,
    props: {
      text: 'Nhấp đúp để chỉnh sửa đoạn văn này. Bạn có thể đổi phông chữ, cỡ chữ và màu sắc ở bảng bên phải.',
    },
    style: { color: '#4b5563', lineHeight: 1.6 },
  },
  button: {
    label: 'Nút bấm',
    w: 180,
    h: 52,
    props: { text: 'Nhấn vào đây', href: '#', newTab: false },
    style: {
      background: '#4f46e5',
      color: '#ffffff',
      fontWeight: 600,
      textAlign: 'center',
      verticalAlign: 'middle',
      radius: 10,
      padding: 8,
    },
  },
  image: {
    label: 'Hình ảnh',
    w: 360,
    h: 240,
    props: { src: '', alt: '', fit: 'cover' },
    style: { radius: 12 },
  },
  box: {
    label: 'Khối màu',
    w: 300,
    h: 200,
    props: {},
    style: { background: '#eef2ff', radius: 16 },
  },
  divider: {
    label: 'Đường kẻ',
    w: 400,
    h: 20,
    props: {},
    style: { color: '#d1d5db' },
  },
  shape: {
    label: 'Hình khối',
    w: 320,
    h: 320,
    props: {
      shape: 'diamond',
      // What fills the shape: 'image' or 'video' (src is either); imgW/imgCX/… frame both.
      mediaType: 'image',
      // Rounds the corners of diamond / triangle / hexagon / star (ROUNDABLE_SHAPES), in px.
      cornerRadius: 0,
      src: '',
      alt: '',
      imgW: 0,
      imgH: 0,
      // Framing (see imageRect): imgCX/imgCY place the image center; unset means centered. Not given
      // defaults here, so older designs keep their imgX/imgY position when loaded.
      imgZoom: 1,
      // Free resizing: stretch of the image's width / height on top of imgZoom (1 = natural proportions).
      imgStretchX: 1,
      imgStretchY: 1,
      rim: 0,
      rimColor: '#ffffff',
      texture: false,
      shadow: false,
      seed: 0,
      // Torn paper only.
      edge: 'diagonal',
      depth: 14,
      tooth: 14,
    },
    initProps: () => ({ seed: randomSeed() }),
    style: { background: '#2f5597' },
  },
  video: {
    label: 'Video YouTube',
    w: 480,
    h: 270,
    props: { url: '' },
    style: { radius: 12, background: '#0f172a' },
  },
  audio: {
    label: 'Âm thanh',
    w: 420,
    h: 140,
    // viz: one of AUDIO_PRESETS in audioViz.js, which also draws it (mountAudio).
    // always: dance to a steady beat while nothing plays; inner: round effects' empty middle (% of the box).
    props: { src: '', name: '', viz: 'bars', color: '#a78bfa', color2: '#f472b6', bars: 32, loop: false, autoplay: true, always: false, inner: 20 },
    style: { radius: 16, background: 'transparent' },
  },
  icon: {
    label: 'Nút icon',
    w: 56,
    h: 56,
    // icon: a key of ICON_LIBRARY (iconLibrary.js); iconSize is a % of the box.
    props: { icon: 'phone', iconColor: '#ffffff', iconSize: 50, strokeWidth: 2, href: '#', newTab: false, label: '' },
    style: { background: '#4f46e5', radius: 999 },
  },
  decor: {
    label: 'Trang trí',
    w: 220,
    h: 220,
    // kind: one of DECORS in decor.js, which draws it from `seed`. strokeWidth: arrow / circle;
    // density: splatter; spacing / dotSize: dot grid; pattern: washi tape; inkStyle: ink blot (INK_STYLES);
    // stain: which traced stain (INK_STAINS).
    // blend: multiply with what's below.
    props: { kind: 'ink', seed: 0, color: '#1f2937', inkStyle: 'blot', stain: 0, strokeWidth: 4, density: 40, spacing: 24, dotSize: 4, pattern: 'stripes', blend: false },
    initProps: () => ({ seed: randomSeed() }),
    style: { background: 'transparent', radius: 0 },
  },
}

export const PALETTE_ORDER = ['image', 'box', 'divider', 'video']

/**
 * The text group in the palette (`text:<preset>`): ready-made heading/paragraph elements that only
 * differ in their starting size, content and style, so they need nothing new to render or publish.
 */
export const TEXT_PRESETS = {
  title: {
    label: 'Tiêu đề lớn',
    type: 'heading',
    w: 680,
    h: 72,
    props: { text: 'Tiêu đề lớn của bạn' },
    style: { fontSize: 54, fontWeight: 800, lineHeight: 1.15, letterSpacing: -1 },
  },
  heading: { label: 'Tiêu đề', type: 'heading' },
  subheading: {
    label: 'Tiêu đề phụ',
    type: 'heading',
    w: 480,
    h: 40,
    props: { text: 'Tiêu đề phụ' },
    style: { fontSize: 24, fontWeight: 600, lineHeight: 1.3, color: '#374151' },
  },
  paragraph: { label: 'Đoạn văn', type: 'text' },
  quote: {
    label: 'Trích dẫn',
    type: 'text',
    w: 460,
    h: 104,
    props: { text: '“Một câu nói truyền cảm hứng đặt ở đây.”\n— Tên tác giả' },
    style: { fontSize: 20, italic: true, lineHeight: 1.5, color: '#374151', background: '#f5f3ff', padding: 20, radius: 12 },
  },
  list: {
    label: 'Danh sách',
    type: 'text',
    w: 360,
    h: 110,
    props: { text: '•  Mục thứ nhất\n•  Mục thứ hai\n•  Mục thứ ba' },
    style: { lineHeight: 1.8, color: '#374151' },
  },
  caption: {
    label: 'Chú thích',
    type: 'text',
    w: 320,
    h: 24,
    props: { text: 'Chú thích nhỏ cho ảnh hoặc nội dung' },
    style: { fontSize: 13, color: '#9ca3af', lineHeight: 1.4 },
  },
  label: {
    label: 'Nhãn',
    type: 'text',
    w: 220,
    h: 22,
    props: { text: 'NHÃN NỔI BẬT' },
    style: { fontSize: 12, fontWeight: 700, letterSpacing: 2, color: '#4f46e5' },
  },
}
export const TEXT_ORDER = Object.keys(TEXT_PRESETS)

/** The button group in the palette (`button:<preset>`), built the same way as TEXT_PRESETS. */
export const BUTTON_PRESETS = {
  primary: { label: 'Nút chính', type: 'button' },
  outline: {
    label: 'Viền',
    type: 'button',
    style: { background: 'transparent', color: '#4f46e5', borderWidth: 2, borderColor: '#4f46e5' },
  },
  pill: { label: 'Bo tròn', type: 'button', style: { background: '#111827', radius: 999 } },
  soft: { label: 'Nhạt', type: 'button', style: { background: '#eef2ff', color: '#4f46e5' } },
  gradient: {
    label: 'Chuyển màu',
    type: 'button',
    style: { background: 'linear-gradient(135deg, #6366f1, #ec4899)', radius: 999 },
  },
  raised: {
    label: 'Nổi',
    type: 'button',
    style: { background: '#ffffff', color: '#111827', shadow: 'lg', radius: 12 },
  },
  link: {
    label: 'Liên kết',
    type: 'button',
    w: 140,
    h: 32,
    props: { text: 'Xem thêm →' },
    style: { background: 'transparent', color: '#4f46e5', underline: true, padding: 0 },
  },
  large: {
    label: 'Nút lớn',
    type: 'button',
    w: 280,
    h: 68,
    props: { text: 'Bắt đầu ngay' },
    style: { fontSize: 20, fontWeight: 700, radius: 14, shadow: 'md' },
  },
  icon: { label: 'Nút icon', type: 'icon' },
  iconPlain: {
    label: 'Icon',
    type: 'icon',
    w: 44,
    h: 44,
    props: { icon: 'facebook', iconColor: '#4f46e5', iconSize: 80 },
    style: { background: 'transparent' },
  },
}
export const BUTTON_ORDER = Object.keys(BUTTON_PRESETS)

/** Palette groups whose presets are plain elements with a different starting style. */
const STYLE_PRESETS = { text: TEXT_PRESETS, button: BUTTON_PRESETS }

/**
 * Palette/drag key → new element. Keys are element types, `shape:<name>` for a shape preset (size and
 * props from the SHAPES catalog), `audio:<viz>` for an audio effect (from AUDIO_PRESETS), or
 * `text:<preset>` / `button:<preset>` for a text or button style (TEXT_PRESETS, BUTTON_PRESETS).
 */
export function createFromKey(key, rest = {}) {
  const [type, preset] = key.split(':')
  const styled = STYLE_PRESETS[type]?.[preset]
  if (styled) {
    const { type: kind, w, h, props, style } = styled
    const base = ELEMENT_TYPES[kind]
    return createElement(kind, {
      w: w ?? base.w,
      h: h ?? base.h,
      ...rest,
      props: { ...props, ...rest.props },
      style: { ...style, ...rest.style },
    })
  }
  if (type === 'shape' && SHAPES[preset]) {
    const s = SHAPES[preset]
    return createElement('shape', { w: s.w, h: s.h, ...rest, props: { ...s.props, shape: preset, ...rest.props } })
  }
  const decor = type === 'decor' && decorPreset(preset)
  if (decor) return createElement('decor', { w: decor.w, h: decor.h, ...rest, props: { ...decor.props, ...rest.props } })
  if (type === 'audio' && AUDIO_PRESETS[preset]) {
    const a = AUDIO_PRESETS[preset]
    return createElement('audio', { w: a.w, h: a.h, ...rest, props: { ...a.props, viz: preset, ...rest.props } })
  }
  return createElement(type, rest)
}

export function createElement(type, { props, style, ...rest } = {}) {
  const t = ELEMENT_TYPES[type]
  return {
    id: uid(),
    type,
    x: 0,
    y: 0,
    w: t.w,
    h: t.h,
    rotation: 0,
    // Mirror the element (images and shapes offer it).
    flipX: false,
    flipY: false,
    hidden: false,
    locked: false,
    ...rest,
    props: { ...t.props, ...t.initProps?.(), ...props },
    style: { ...BASE_STYLE, ...t.style, ...style },
  }
}

export function applyPatch(el, patch) {
  return {
    ...el,
    ...patch,
    props: { ...el.props, ...patch.props },
    style: { ...el.style, ...patch.style },
  }
}

export const DEFAULT_PAGE = { title: 'Trang web của tôi', favicon: '', width: 1200, height: 1000, background: '#ffffff' }

/** Validates a loaded/imported document and fills in any missing defaults. */
export function normalizeDoc(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.elements)) throw new Error('Invalid document')
  const page = { ...DEFAULT_PAGE, ...raw.page }
  const elements = raw.elements
    // Torn paper used to be its own element type.
    .map((el) => (el?.type === 'torn' ? { ...el, type: 'shape', props: { ...el.props, shape: 'torn' } } : el))
    .filter((el) => el && ELEMENT_TYPES[el.type])
    .map((el) => createElement(el.type, { ...el, id: el.id || uid() }))
  return { page, elements }
}

/** Display name of an element's kind (shapes and audio show their preset, e.g. "Hình thoi"). */
export function elementLabel(el) {
  return (
    (el.type === 'shape' && SHAPES[el.props.shape]?.label) ||
    (el.type === 'audio' && AUDIO_PRESETS[el.props.viz] && `Âm thanh · ${AUDIO_PRESETS[el.props.viz].label}`) ||
    (el.type === 'decor' && DECORS[el.props.kind]?.label) ||
    ELEMENT_TYPES[el.type].label
  )
}

/**
 * Links of buttons / icon buttons can scroll within the page instead of leaving it: `href` is then
 * `#y-<px>`, a point picked on the page (px from its top, in design coordinates). Designs from before
 * may also hold SCROLL_TOP or `#el-<element id>` (published pages give every element that id), which
 * still work.
 */
export const SCROLL_TOP = '#top'
export const anchorId = (id) => `el-${id}`
export const scrollYHref = (y) => `#y-${Math.max(0, Math.round(y))}`

/** Where an in-page link goes — { top: true }, { id } or { y } — or null for an ordinary link. */
export function scrollLink(href) {
  if (href === SCROLL_TOP) return { top: true }
  const el = /^#el-([\w-]+)$/.exec(href || '')
  if (el) return { id: el[1] }
  const y = /^#y-(\d+)$/.exec(href || '')
  return y ? { y: Number(y[1]) } : null
}

/**
 * The page y an in-page link scrolls to. Links made before points could be picked may still name
 * the page top or an element: those count as its top edge (null if that element is gone).
 */
export function scrollLinkY(link, elements) {
  if (!link) return null
  if (link.top) return 0
  if ('y' in link) return link.y
  const target = elements.find((e) => e.id === link.id)
  return target ? Math.round(target.y) : null
}

/** href / target / rel for a link's <a>; in-page links never open a new tab. */
export function linkAttrs(p) {
  const inPage = scrollLink(p.href) !== null
  const newTab = p.newTab && !inPage
  return { href: p.href || '#', target: newTab ? '_blank' : undefined, rel: newTab ? 'noopener noreferrer' : undefined }
}

export function youtubeEmbed(url) {
  const m = /(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/.exec(url || '')
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}

/** mix-blend-mode of an element's positioned wrapper: decorations can multiply with what's below. */
export const blendMode = (el) => (el.type === 'decor' && el.props.blend ? 'multiply' : undefined)

/**
 * CSS transform of an element's positioned wrapper: its rotation, then any mirroring. The selection
 * box only takes the rotation, so its labels never read backwards.
 */
export function elementTransform(el) {
  const parts = []
  if (el.rotation) parts.push(`rotate(${el.rotation}deg)`)
  if (el.flipX || el.flipY) parts.push(`scale(${el.flipX ? -1 : 1}, ${el.flipY ? -1 : 1})`)
  return parts.length ? parts.join(' ') : undefined
}

/** Style for the inner content box of an element (the outer wrapper handles position/size). */
export function contentStyle(el) {
  const s = el.style
  const css = {
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    margin: 0,
    background: s.background,
    borderRadius: s.radius,
    opacity: s.opacity,
    boxShadow: SHADOWS[s.shadow] ?? 'none',
    // A gradient border is drawn by an overlay (gradientBorderStyle); this transparent one keeps the layout.
    border:
      s.borderWidth > 0
        ? `${s.borderWidth}px ${s.borderStyle} ${isGradient(s.borderColor) ? 'transparent' : s.borderColor}`
        : 'none',
    padding: s.padding,
    overflow: 'hidden',
  }
  if (TEXT_TYPES.includes(el.type)) {
    Object.assign(css, {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: VALIGN[s.verticalAlign] ?? 'flex-start',
      // Gradient text is painted by an inner span (textGradientStyle); this is the fallback colour.
      color: firstColor(s.color),
      fontFamily: fontStack(s.fontFamily),
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      lineHeight: s.lineHeight,
      letterSpacing: s.letterSpacing,
      textAlign: s.textAlign,
      fontStyle: s.italic ? 'italic' : 'normal',
      textDecoration: s.underline ? 'underline' : 'none',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'break-word',
    })
  }
  if (el.type === 'divider') {
    Object.assign(css, { display: 'flex', alignItems: 'center' })
  }
  if (el.type === 'icon') {
    Object.assign(css, { display: 'flex', alignItems: 'center', justifyContent: 'center' })
  }
  if (el.type === 'decor') {
    // Hand-drawn strokes and splashes may reach a little past the box.
    Object.assign(css, { overflow: 'visible' })
  }
  if (el.type === 'shape') {
    // The SVG draws its own fill, rim and shadow, and the shadow must spill past the box.
    // position: relative anchors a video layered over the SVG.
    Object.assign(css, { position: 'relative', background: 'none', border: 'none', boxShadow: 'none', borderRadius: 0, padding: 0, overflow: 'visible' })
  }
  return css
}

export function dividerLineStyle(el) {
  const { lineWidth: w, lineStyle, color } = el.style
  if (!isGradient(color)) return { width: '100%', borderTop: `${w}px ${lineStyle} ${color}` }
  // Borders can't be gradients: draw a gradient bar and cut dashes/dots out of it with a mask.
  const css = { width: '100%', height: w, background: color }
  if (lineStyle !== 'solid') {
    const [on, off] = lineStyle === 'dotted' ? [w, w] : [w * 3, w * 2]
    const mask = `repeating-linear-gradient(90deg, #000 0 ${on}px, transparent ${on}px ${on + off}px)`
    Object.assign(css, { WebkitMask: mask, mask })
  }
  return css
}
