/**
 * Colour values across the editor are either a plain CSS colour ("#4f46e5", "transparent") or a CSS
 * gradient string ("linear-gradient(135deg, #6366f1 0%, #ec4899 100%)"). This module parses and
 * builds those strings and adapts them where CSS gradients can't be used directly: text, borders,
 * divider lines and SVG (shapes, icons).
 */

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

export const isGradient = (v) => typeof v === 'string' && /^\s*(linear|radial)-gradient\(/i.test(v)

/** Splits on commas that aren't inside parentheses (e.g. rgba(…)). */
function splitTopLevel(s) {
  const parts = []
  let depth = 0
  let start = 0
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++
    else if (s[i] === ')') depth--
    else if (s[i] === ',' && depth === 0) {
      parts.push(s.slice(start, i).trim())
      start = i + 1
    }
  }
  parts.push(s.slice(start).trim())
  return parts
}

/**
 * `{ type: 'linear' | 'radial', angle, stops: [{ color, pos }] }` (pos in %), or null if the value
 * isn't a gradient this editor understands. Stops without a position are spread evenly.
 */
export function parseGradient(v) {
  if (!isGradient(v)) return null
  const m = /^\s*(linear|radial)-gradient\((.*)\)\s*$/is.exec(v)
  if (!m) return null
  const type = m[1].toLowerCase()
  const parts = splitTopLevel(m[2])
  let angle = 180
  if (type === 'linear' && /^-?[\d.]+deg$/i.test(parts[0])) angle = parseFloat(parts.shift())
  else if (type === 'linear' && /^to /i.test(parts[0])) {
    const dir = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270 }[parts.shift().toLowerCase()]
    angle = dir ?? 180
  } else if (type === 'radial' && /^(circle|ellipse|closest|farthest|at\s)|\sat\s/i.test(parts[0])) parts.shift() // shape/position
  const stops = parts.map((p) => {
    const sm = /^(.*?)(?:\s+(-?[\d.]+)%)?$/.exec(p)
    return { color: sm[1].trim(), pos: sm[2] === undefined ? null : parseFloat(sm[2]) }
  })
  if (stops.length < 2 || stops.some((s) => !s.color)) return null
  stops.forEach((s, i) => {
    if (s.pos === null) s.pos = Math.round((i / (stops.length - 1)) * 100)
  })
  return { type, angle: ((angle % 360) + 360) % 360, stops }
}

/** Builds the CSS string for a parsed gradient. */
export function gradientCss({ type, angle, stops }) {
  const list = [...stops]
    .sort((a, b) => a.pos - b.pos)
    .map((s) => `${s.color} ${Math.round(clamp(s.pos, 0, 100))}%`)
    .join(', ')
  return type === 'radial' ? `radial-gradient(circle, ${list})` : `linear-gradient(${Math.round(angle)}deg, ${list})`
}

/** A single colour standing in for a value: gradients give their first stop. */
export function firstColor(v) {
  const g = parseGradient(v)
  return g ? g.stops[0].color : v
}

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * SVG <linearGradient>/<radialGradient> markup with the given id, or '' for a plain colour. By default
 * it spans each painted shape's bounding box, like CSS does. `box` ([x, y, w, h] in user units) spans a
 * fixed area instead; needed for strokes of straight lines, whose bounding box has no height.
 */
export function svgGradientDef(v, id, box = null) {
  const g = parseGradient(v)
  if (!g) return ''
  const stops = [...g.stops]
    .sort((a, b) => a.pos - b.pos)
    .map((s) => `<stop offset="${clamp(s.pos, 0, 100)}%" stop-color="${esc(s.color)}"/>`)
    .join('')
  const [bx, by, bw, bh] = box ?? [0, 0, 1, 1]
  const units = box ? ' gradientUnits="userSpaceOnUse"' : ''
  const n = (x) => +x.toFixed(4)
  if (g.type === 'radial') {
    return `<radialGradient id="${id}"${units} cx="${n(bx + bw / 2)}" cy="${n(by + bh / 2)}" r="${n(Math.max(bw, bh) / 2)}">${stops}</radialGradient>`
  }
  // CSS angles point "to" a direction, clockwise from the top.
  const t = (g.angle * Math.PI) / 180
  const dx = (Math.sin(t) * bw) / 2
  const dy = (-Math.cos(t) * bh) / 2
  const cx = bx + bw / 2
  const cy = by + bh / 2
  return `<linearGradient id="${id}"${units} x1="${n(cx - dx)}" y1="${n(cy - dy)}" x2="${n(cx + dx)}" y2="${n(cy + dy)}">${stops}</linearGradient>`
}

/** Value for an SVG fill/stroke attribute: `url(#id)` for a gradient (paired with svgGradientDef). */
export const svgPaint = (v, id) => (isGradient(v) ? `url(#${id})` : v)

/** Style for a span that paints its text with a gradient, or null for a plain colour. */
export function textGradientStyle(v) {
  const g = parseGradient(v)
  if (!g) return null
  return {
    // Underlines take the text colour, which is transparent here; give them the first stop instead.
    textDecorationColor: g.stops[0].color,
    backgroundImage: v,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
  }
}

/**
 * Style for an overlay that draws a gradient border with rounded corners (CSS borders can't be
 * gradients without losing the radius). The element keeps a transparent border of the same width for
 * layout; this overlay sits on top of it inside the element's positioned wrapper. Null if not needed.
 */
export function gradientBorderStyle(style) {
  if (!(style.borderWidth > 0) || !isGradient(style.borderColor)) return null
  return {
    position: 'absolute',
    inset: 0,
    boxSizing: 'border-box',
    padding: style.borderWidth,
    borderRadius: style.radius,
    background: style.borderColor,
    opacity: style.opacity,
    pointerEvents: 'none',
    WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
    WebkitMaskComposite: 'xor',
    mask: 'linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)',
  }
}
