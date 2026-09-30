/**
 * Decorations (ink blot, watercolour, brush stroke, splatter, highlighter, hand-drawn arrow / circle,
 * sparkles, washi tape, dot grid): inline SVG drawn from a seed, sized to the element box, in any
 * colour or gradient. The same seed always gives the same drawing, so it survives saving and
 * publishing; "Tạo hình khác" just picks a new seed.
 */

import { svgGradientDef, svgPaint } from './gradient.js'
import { INK_STAINS } from './inkStains.js'

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Catalog. `props` overrides the shared decor defaults in elements.js. `line`: drawn with a stroke;
 * `fixed`: a regular pattern the seed doesn't change.
 */
export const DECORS = {
  ink: { label: 'Chấm mực', w: 220, h: 220, props: { color: '#1f2937', inkStyle: 'blot' } },
  watercolor: { label: 'Loang màu nước', w: 360, h: 280, props: { color: '#93c5fd', blend: true } },
  brush: { label: 'Vệt cọ', w: 420, h: 110, props: { color: '#f472b6' } },
  splatter: { label: 'Văng sơn', w: 300, h: 240, props: { color: '#ef4444' } },
  highlight: { label: 'Bút highlight', w: 320, h: 56, props: { color: '#fde047', blend: true } },
  arrow: { label: 'Mũi tên vẽ tay', w: 220, h: 140, line: true, props: { color: '#1f2937' } },
  circle: { label: 'Vòng khoanh', w: 280, h: 120, line: true, props: { color: '#ef4444' } },
  sparkle: { label: 'Lấp lánh', w: 140, h: 140, props: { color: '#f59e0b' } },
  washi: { label: 'Băng dính washi', w: 220, h: 56, props: { color: '#f9a8d4' } },
  dots: { label: 'Lưới chấm bi', w: 240, h: 180, fixed: true, props: { color: '#f472b6' } },
  // A real stain from ink.jpg (INK_STAINS[props.stain]); the palette offers each one (STAIN_PRESETS).
  stain: { label: 'Vết mực', w: 240, h: 240, fixed: true, props: { color: '#111827', stain: 0 } },
}
export const DECOR_ORDER = Object.keys(DECORS)

/** Starting size of a stain: its own proportions, the longer side 240px. */
function stainSize(s) {
  const k = 240 / Math.max(s.w, s.h)
  return { w: Math.round(s.w * k), h: Math.round(s.h * k) }
}

/** One palette entry per traced stain: key `stain-<n>`. */
export const STAIN_PRESETS = INK_STAINS.map((s, i) => ({ key: `stain-${i}`, label: `Vết mực ${i + 1}`, ...stainSize(s) }))

/** Size and props of a palette preset (`decor:<preset>`): a DECORS kind or `stain-<n>`. Null if unknown. */
export function decorPreset(preset) {
  const m = /^stain-(\d+)$/.exec(preset)
  if (m && INK_STAINS[+m[1]]) return { ...stainSize(INK_STAINS[+m[1]]), props: { ...DECORS.stain.props, kind: 'stain', stain: +m[1] } }
  const d = DECORS[preset]
  return d ? { w: d.w, h: d.h, props: { ...d.props, kind: preset } } : null
}

export const WASHI_PATTERNS = [
  ['stripes', 'Sọc chéo'],
  ['dots', 'Chấm bi'],
  ['plain', 'Trơn'],
]

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const n = (v) => +v.toFixed(1)
const pt = ([x, y]) => `${n(x)},${n(y)}`

/** Smooth closed path through the points (Catmull-Rom turned into cubic Béziers). */
function closedCurve(pts) {
  const k = pts.length
  let d = `M${pt(pts[0])}`
  for (let i = 0; i < k; i++) {
    const p0 = pts[(i - 1 + k) % k]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % k]
    const p3 = pts[(i + 2) % k]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`
  }
  return d + 'Z'
}

/** Smooth open path through the points. */
function openCurve(pts) {
  let d = `M${pt(pts[0])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`
  }
  return d
}

/** Wobbly closed blob around (cx, cy) with radii rx / ry; `spikes` pushes a few points outwards. */
function blob(r, cx, cy, rx, ry, count = 16, wobble = 0.18, spikes = 0) {
  const start = r() * Math.PI * 2
  const pts = []
  for (let i = 0; i < count; i++) {
    const a = start + (i / count) * Math.PI * 2
    let k = 1 - wobble + r() * wobble * 2
    if (spikes && r() < spikes) k *= 1.25 + r() * 0.3
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k])
  }
  return closedCurve(pts)
}

const circle = (x, y, radius, extra = '') => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(Math.max(0.3, radius))}"${extra}/>`

/** Rounder-than-uniform scatter: the average of two randoms leans towards the middle. */
const centred = (r) => (r() + r()) / 2

// ---------------------------------------------------------------- the drawings
// Each returns SVG markup (without the outer <svg>) using `fill` / `stroke` as the paint.

/** A drop stretched along angle `a` (radians): an ellipse rotated that way. */
function drop(x, y, len, width, a, paint) {
  const deg = (a * 180) / Math.PI
  return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(len)}" ry="${n(width)}" transform="rotate(${n(deg)} ${n(x)} ${n(y)})" fill="${paint}"/>`
}

/** A tapered spike from (x0, y0) along angle `a`: wide at the base, a point at the tip. */
function spike(x0, y0, a, len, base, paint) {
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const tip = [x0 + cos * len, y0 + sin * len]
  const b1 = [x0 - sin * base, y0 + cos * base]
  const b2 = [x0 + sin * base, y0 - cos * base]
  const m1 = [x0 + cos * len * 0.45 - sin * base * 0.35, y0 + sin * len * 0.45 + cos * base * 0.35]
  const m2 = [x0 + cos * len * 0.45 + sin * base * 0.35, y0 + sin * len * 0.45 - cos * base * 0.35]
  return `<path d="M${pt(b1)}Q${pt(m1)} ${pt(tip)}Q${pt(m2)} ${pt(b2)}Z" fill="${paint}"/>`
}

/** Droplets scattered around (cx, cy) between `from` and `to` px away. */
function droplets(r, cx, cy, count, from, to, maxSize, paint) {
  let s = ''
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2
    const d = from + r() * (to - from)
    const size = maxSize * (0.2 + Math.pow(r(), 2) * 0.8)
    const x = cx + Math.cos(a) * d
    const y = cy + Math.sin(a) * d
    s += r() < 0.35 ? drop(x, y, size * 2, size, a, paint) : circle(x, y, size, ` fill="${paint}"`)
  }
  return s
}

// Ink blot styles (props.inkStyle), after the classic ink splatter sheets.
export const INK_STYLES = [
  ['blot', 'Chấm tròn'],
  ['splash', 'Bắn tia'],
  ['drip', 'Chảy giọt'],
  ['spray', 'Phun xịt'],
  ['trail', 'Vệt giọt'],
  ['streak', 'Văng một phía'],
  ['grunge', 'Mực khô'],
]

const INK = {
  /** A round blot with a lumpy edge and droplets around it. */
  blot(r, w, h, paint) {
    const m = Math.min(w, h)
    return (
      `<path d="${blob(r, w / 2, h / 2, m * 0.28, m * 0.26, 18, 0.14, 0.22)}" fill="${paint}"/>` +
      droplets(r, w / 2, h / 2, 9 + Math.floor(r() * 6), m * 0.36, m * 0.48, m * 0.045, paint)
    )
  },

  /** A splat with sharp rays shooting out, some ending in a drop. */
  splash(r, w, h, paint) {
    const m = Math.min(w, h)
    const cx = w / 2
    const cy = h / 2
    const core = m * 0.19
    let s = `<path d="${blob(r, cx, cy, core, core * 0.92, 14, 0.2, 0.3)}" fill="${paint}"/>`
    const rays = 11 + Math.floor(r() * 7)
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2 + (r() - 0.5) * 0.4
      const len = m * (0.14 + r() * 0.26)
      const base = m * (0.012 + r() * 0.03)
      const x0 = cx + Math.cos(a) * core * 0.7
      const y0 = cy + Math.sin(a) * core * 0.7
      s += spike(x0, y0, a, len, base, paint)
      if (r() < 0.55) {
        const d = core * 0.7 + len + m * (0.02 + r() * 0.05)
        s += circle(cx + Math.cos(a) * d, cy + Math.sin(a) * d, base * (0.8 + r()), ` fill="${paint}"`)
      }
    }
    return s + droplets(r, cx, cy, 6, m * 0.3, m * 0.48, m * 0.02, paint)
  },

  /** A blot near the top with runs of ink dripping down, each narrowing and ending in a bead. */
  drip(r, w, h, paint) {
    const cx = w / 2
    const cy = h * 0.24
    const rx = w * 0.32
    const ry = h * 0.17
    let s = `<path d="${blob(r, cx, cy, rx, ry, 16, 0.2, 0.15)}" fill="${paint}"/>`
    const runs = 3 + Math.floor(r() * 4)
    for (let i = 0; i < runs; i++) {
      const x = cx - rx * 0.8 + (rx * 1.6 * (i + 0.15 + r() * 0.7)) / runs
      // Sized by the shorter side, so a wide or flat box doesn't grow giant runs.
      const width = Math.min(w, h) * (0.03 + r() * 0.06)
      const end = cy + ry * 0.6 + (h - cy - ry) * (0.25 + Math.pow(r(), 0.7) * 0.7)
      const tip = width * (0.3 + r() * 0.25)
      const wig = (r() - 0.5) * width
      // Narrowing as it runs down (with a slight wobble), then a round bead at the end.
      s += `<path d="M${pt([x - width / 2, cy])}Q${pt([x - width * 0.4 + wig, (cy + end) / 2])} ${pt([x - tip, end])}L${pt([x + tip, end])}Q${pt([x + width * 0.4 + wig, (cy + end) / 2])} ${pt([x + width / 2, cy])}Z" fill="${paint}"/>`
      s += circle(x, end, tip * (1.5 + r() * 0.6), ` fill="${paint}"`)
    }
    return s + droplets(r, cx, cy, 6, Math.max(rx, ry) * 1.05, Math.max(rx, ry) * 1.35, Math.min(w, h) * 0.025, paint)
  },

  /** Airbrushed: a soft-edged blot inside a haze of tiny specks. */
  spray(r, w, h, paint, p, id) {
    const m = Math.min(w, h)
    const cx = w / 2
    const cy = h / 2
    const R = m * 0.3
    const blur = `${id}-soft`
    let s = `<filter id="${blur}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${n(m * 0.012)}"/></filter>`
    s += `<path d="${blob(r, cx, cy, R, R * 0.95, 16, 0.07)}" fill="${paint}" filter="url(#${blur})"/>`
    // Specks: dense at the edge, thinning out further away.
    let specks = ''
    for (let i = 0; i < 260; i++) {
      const a = r() * Math.PI * 2
      const d = R * (0.92 + Math.pow(r(), 2.2) * 0.62)
      specks += circle(cx + Math.cos(a) * d, cy + Math.sin(a) * d, m * (0.002 + r() * 0.005))
    }
    s += `<g fill="${paint}">${specks}</g>`
    if (r() < 0.5) {
      // Sometimes a short run below, where too much paint landed.
      const x = cx + (r() - 0.5) * R
      const end = cy + R + m * (0.05 + r() * 0.1)
      s += `<path d="M${pt([x - m * 0.02, cy])}L${pt([x - m * 0.012, end])}L${pt([x + m * 0.012, end])}L${pt([x + m * 0.02, cy])}Z" fill="${paint}"/>`
      s += circle(x, end, m * 0.017, ` fill="${paint}"`)
    }
    return s
  },

  /** A line of drops getting smaller along a curve, like ink flicked off a pen. */
  trail(r, w, h, paint) {
    const vertical = h >= w
    const long = Math.max(w, h)
    const across = Math.min(w, h)
    const bend = (r() < 0.5 ? -1 : 1) * across * (0.15 + r() * 0.2)
    let s = ''
    let t = 0
    while (t <= 1) {
      const k = 1 - t
      const along = 0.05 + t * 0.9
      const off = Math.sin(t * Math.PI * 0.9) * bend + (r() - 0.5) * across * 0.06
      const x = vertical ? w / 2 + off : w * along
      const y = vertical ? h * along : h / 2 + off
      // Big drops first, specks at the end.
      const size = long * (0.006 + Math.pow(k, 1.4) * 0.04) * (0.75 + r() * 0.5)
      s += r() < 0.3 ? drop(x, y, size * 1.5, size, vertical ? Math.PI / 2 : 0, paint) : circle(x, y, size, ` fill="${paint}"`)
      t += (size / long) * 2.2 + 0.02 + r() * 0.05
    }
    return s
  },

  /** A blot on one side with long streaks flung the other way and a thin run below. */
  streak(r, w, h, paint) {
    const m = Math.min(w, h)
    const toLeft = r() < 0.5
    const cx = toLeft ? w * 0.72 : w * 0.28
    const cy = h * 0.42
    const core = m * 0.2
    let s = `<path d="${blob(r, cx, cy, core * 1.1, core * 0.9, 14, 0.18, 0.25)}" fill="${paint}"/>`
    const dir = toLeft ? Math.PI : 0
    const streaks = 6 + Math.floor(r() * 4)
    for (let i = 0; i < streaks; i++) {
      const a = dir + (r() - 0.5) * 0.7
      const len = w * (0.3 + r() * 0.35)
      s += spike(cx, cy + (r() - 0.5) * core, a, len, m * (0.012 + r() * 0.03), paint)
      if (r() < 0.6) s += drop(cx + Math.cos(a) * (len + m * 0.04), cy + Math.sin(a) * (len + m * 0.04), m * 0.025, m * 0.012, a, paint)
    }
    // A thin run down from the blot.
    const x = cx + (r() - 0.5) * core
    s += spike(x, cy + core * 0.6, Math.PI / 2 + (r() - 0.5) * 0.2, h * (0.35 + r() * 0.2), m * 0.018, paint)
    return s + droplets(r, cx, cy, 6, core * 1.4, core * 2.2, m * 0.02, paint)
  },

  /** Patchy, half-dry ink: a blotch with small gaps showing through, lumps and specks at its edge. */
  grunge(r, w, h, paint) {
    const m = Math.min(w, h)
    const cx = w / 2
    const cy = h / 2
    const rx = w * 0.32
    const ry = h * 0.3
    // Holes: small, well inside, never overlapping (overlaps would cancel out into odd rings).
    let holes = ''
    const placed = []
    for (let tries = 0; tries < 60 && placed.length < 12; tries++) {
      const a = r() * Math.PI * 2
      const k = Math.sqrt(r()) * 0.72
      const x = cx + Math.cos(a) * rx * k
      const y = cy + Math.sin(a) * ry * k
      const size = m * (0.012 + r() * 0.035)
      if (placed.some(([px, py, ps]) => Math.hypot(px - x, py - y) < (ps + size) * 1.3)) continue
      placed.push([x, y, size])
      holes += blob(r, x, y, size * (0.8 + r() * 0.8), size, 8, 0.3)
    }
    let lumps = ''
    for (let i = 0; i < 10; i++) {
      const a = r() * Math.PI * 2
      const size = m * (0.025 + r() * 0.05)
      lumps += `<path d="${blob(r, cx + Math.cos(a) * rx * 0.95, cy + Math.sin(a) * ry * 0.95, size * 1.3, size, 8, 0.3)}" fill="${paint}"/>`
    }
    return (
      `<path d="${blob(r, cx, cy, rx, ry, 20, 0.22, 0.18)}${holes}" fill="${paint}" fill-rule="evenodd"/>` +
      lumps +
      droplets(r, cx, cy, 18, m * 0.36, m * 0.5, m * 0.018, paint)
    )
  },
}

function ink(r, w, h, paint, p, id) {
  return (INK[p.inkStyle] ?? INK.blot)(r, w, h, paint, p, id)
}

function watercolor(r, w, h, paint) {
  // See-through washes of different sizes on top of each other, a darker rim like dried pigment, and a
  // few denser blooms where the paint pooled.
  let s = ''
  for (let i = 0; i < 5; i++) {
    const ox = (r() - 0.5) * w * 0.16
    const oy = (r() - 0.5) * h * 0.16
    const k = 0.62 + r() * 0.34
    s += `<path d="${blob(r, w / 2 + ox, h / 2 + oy, w * 0.47 * k, h * 0.47 * k, 15, 0.2)}" fill="${paint}" fill-opacity="${n(0.16 + r() * 0.16)}"/>`
  }
  s += `<path d="${blob(r, w / 2, h / 2, w * 0.42, h * 0.4, 13, 0.2)}" fill="${paint}" fill-opacity="0.14" stroke="${paint}" stroke-opacity="0.4" stroke-width="${n(Math.min(w, h) * 0.012 + 0.8)}"/>`
  for (let i = 0; i < 3; i++) {
    const cx = w * (0.3 + r() * 0.4)
    const cy = h * (0.3 + r() * 0.4)
    s += `<path d="${blob(r, cx, cy, w * (0.06 + r() * 0.08), h * (0.06 + r() * 0.08), 9, 0.25)}" fill="${paint}" fill-opacity="${n(0.18 + r() * 0.14)}"/>`
  }
  return s
}

function brush(r, w, h, paint) {
  // Many overlapping bristle strips across the band: each starts and ends somewhere a little different,
  // so both ends fray like a dry brush, with a solid core so the middle is fully covered.
  const band = h * 0.7
  const top = (h - band) / 2
  const strips = 11
  const wave = h * (0.03 + r() * 0.05)
  const phase = r() * Math.PI * 2
  const strip = (y, th, x0, x1, opacity) => {
    const pts = 6
    const upper = []
    const lower = []
    for (let i = 0; i <= pts; i++) {
      const t = i / pts
      const x = x0 + (x1 - x0) * t
      const yy = y + Math.sin(phase + t * Math.PI * 1.4) * wave
      // Thinner at the very ends, like the bristles lifting off.
      const k = Math.min(1, 0.35 + Math.min(t, 1 - t) * 5)
      upper.push([x, yy - (th / 2) * k + (r() - 0.5) * th * 0.25])
      lower.push([x, yy + (th / 2) * k + (r() - 0.5) * th * 0.25])
    }
    return `<path d="${closedCurve([...upper, ...lower.reverse()])}" fill="${paint}"${opacity < 1 ? ` fill-opacity="${n(opacity)}"` : ''}/>`
  }
  let s = strip(h / 2, band * 0.62, w * 0.05, w * 0.93, 1)
  for (let i = 0; i < strips; i++) {
    const y = top + (band * (i + 0.5)) / strips + (r() - 0.5) * (band / strips) * 0.5
    const th = (band / strips) * (1.3 + r() * 0.9)
    const x0 = w * (0.005 + r() * 0.07)
    const x1 = w * (0.86 + r() * 0.135)
    s += strip(y, th, x0, x1, r() < 0.25 ? 0.6 + r() * 0.3 : 1)
  }
  return s
}

function splatter(r, w, h, paint, p) {
  const m = Math.min(w, h)
  const count = Math.max(5, Math.round(p.density))
  let s = ''
  for (let i = 0; i < count; i++) {
    const x = w * (0.04 + centred(r) * 0.92)
    const y = h * (0.04 + centred(r) * 0.92)
    // Mostly small specks, a few big drops.
    const size = m * (0.006 + Math.pow(r(), 3) * 0.07)
    s += circle(x, y, size, ` fill="${paint}"`)
    if (size > m * 0.03 && r() < 0.5) {
      // A tail and a tiny satellite drop beside the big ones.
      const a = r() * Math.PI * 2
      const deg = (a * 180) / Math.PI
      s += `<ellipse cx="${n(x + Math.cos(a) * size * 1.3)}" cy="${n(y + Math.sin(a) * size * 1.3)}" rx="${n(size * 0.9)}" ry="${n(size * 0.45)}" transform="rotate(${n(deg)} ${n(x + Math.cos(a) * size * 1.3)} ${n(y + Math.sin(a) * size * 1.3)})" fill="${paint}"/>`
      s += circle(x + Math.cos(a) * size * 2.6, y + Math.sin(a) * size * 2.6, size * 0.3, ` fill="${paint}"`)
    }
  }
  return s
}

function highlight(r, w, h, paint) {
  // A marker pass: nearly straight, slanted chisel ends, and a fainter second pass.
  const band = (y0, y1, slant) => {
    const j = () => (r() - 0.5) * h * 0.06
    return closedCurve([
      [w * 0.01 + slant, y0 + j()],
      [w * 0.35, y0 + j()],
      [w * 0.7, y0 + j()],
      [w * 0.99, y0 + j()],
      [w * 0.99 - slant, y1 + j()],
      [w * 0.65, y1 + j()],
      [w * 0.3, y1 + j()],
      [w * 0.01, y1 + j()],
    ])
  }
  const slant = Math.min(w * 0.04, h * 0.3)
  return (
    `<path d="${band(h * 0.12, h * 0.88, slant)}" fill="${paint}" fill-opacity="0.75"/>` +
    `<path d="${band(h * 0.2, h * 0.8, slant * 0.6)}" fill="${paint}" fill-opacity="0.3"/>`
  )
}

function arrow(r, w, h, paint, p) {
  const sw = p.strokeWidth
  const j = () => (r() - 0.5) * Math.min(w, h) * 0.05
  // Half the seeds get a little loop on the way.
  const pts = r() < 0.5
    ? [[0.06, 0.78], [0.3, 0.6], [0.46, 0.36], [0.56, 0.52], [0.42, 0.6], [0.5, 0.38], [0.72, 0.3], [0.92, 0.22]]
    : [[0.06, 0.82], [0.25, 0.55], [0.5, 0.42], [0.74, 0.34], [0.92, 0.22]]
  const path = pts.map(([x, y]) => [x * w + j(), y * h + j()])
  const end = path[path.length - 1]
  const prev = path[path.length - 2]
  const a = Math.atan2(end[1] - prev[1], end[0] - prev[0])
  const len = Math.min(w, h) * 0.22 + sw
  const wing = (da) => [end[0] - Math.cos(a + da) * len, end[1] - Math.sin(a + da) * len]
  const stroke = `fill="none" stroke="${paint}" stroke-width="${n(sw)}" stroke-linecap="round" stroke-linejoin="round"`
  return `<path d="${openCurve(path)}" ${stroke}/><path d="M${pt(wing(0.5))}L${pt(end)}L${pt(wing(-0.5))}" ${stroke}/>`
}

function loop(r, w, h, paint, p) {
  // A little over one turn around an ellipse, wobbling, so the ends overshoot like a quick pen circle.
  const sw = p.strokeWidth
  const rx = w / 2 - sw * 1.5
  const ry = h / 2 - sw * 1.5
  const start = -Math.PI * (0.6 + r() * 0.3)
  const turns = 1.12 + r() * 0.08
  const steps = 22
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const a = start + (i / steps) * Math.PI * 2 * turns
    const k = 0.9 + r() * 0.08 + (i / steps) * 0.06
    pts.push([w / 2 + Math.cos(a) * rx * k, h / 2 + Math.sin(a) * ry * k])
  }
  return `<path d="${openCurve(pts)}" fill="none" stroke="${paint}" stroke-width="${n(sw)}" stroke-linecap="round" stroke-linejoin="round"/>`
}

function sparkle(r, w, h, paint) {
  const m = Math.min(w, h)
  // Four-point star with concave sides.
  const star = (cx, cy, s) => {
    const q = s * 0.16
    return `<path d="M${pt([cx, cy - s])}Q${pt([cx + q, cy - q])} ${pt([cx + s, cy])}Q${pt([cx + q, cy + q])} ${pt([cx, cy + s])}Q${pt([cx - q, cy + q])} ${pt([cx - s, cy])}Q${pt([cx - q, cy - q])} ${pt([cx, cy - s])}Z" fill="${paint}"/>`
  }
  const flip = r() < 0.5
  const X = (v) => (flip ? w - v : v)
  return (
    star(X(w * 0.4), h * 0.58, m * 0.36) +
    star(X(w * 0.8), h * 0.2, m * (0.13 + r() * 0.05)) +
    star(X(w * 0.82), h * 0.8, m * (0.08 + r() * 0.04)) +
    circle(X(w * 0.12), h * 0.18, m * 0.035, ` fill="${paint}"`)
  )
}

function washi(r, w, h, paint, p, id) {
  // Tape with torn zig-zag ends; the pattern is clipped to the tape.
  const teeth = Math.max(3, Math.round(h / 9))
  const jag = Math.min(w * 0.05, h * 0.18)
  const pts = []
  for (let i = 0; i <= teeth; i++) pts.push([(i % 2 ? jag : 0) + r() * jag * 0.4, (h * i) / teeth])
  for (let i = teeth; i >= 0; i--) pts.push([w - (i % 2 ? jag : 0) - r() * jag * 0.4, (h * i) / teeth])
  const d = 'M' + pts.map(pt).join('L') + 'Z'
  const clip = `${id}-tape`
  let pattern = ''
  if (p.pattern === 'stripes') {
    const gap = Math.max(8, h * 0.38)
    for (let x = -h; x < w + h; x += gap) pattern += `<path d="M${pt([x, h])}L${pt([x + h, 0])}" stroke="#ffffff" stroke-opacity="0.5" stroke-width="${n(gap * 0.32)}"/>`
  } else if (p.pattern === 'dots') {
    const gap = Math.max(8, h * 0.3)
    for (let y = gap / 2, row = 0; y < h; y += gap, row++) {
      for (let x = gap / 2 + (row % 2) * (gap / 2); x < w; x += gap) pattern += circle(x, y, gap * 0.14, ' fill="#ffffff" fill-opacity="0.65"')
    }
  }
  return (
    `<clipPath id="${clip}"><path d="${d}"/></clipPath>` +
    `<path d="${d}" fill="${paint}" fill-opacity="0.88"/>` +
    (pattern ? `<g clip-path="url(#${clip})">${pattern}</g>` : '')
  )
}

function dots(r, w, h, paint, p) {
  const gap = Math.max(6, p.spacing)
  const cols = Math.max(1, Math.floor(w / gap))
  const rows = Math.max(1, Math.floor(h / gap))
  const ox = (w - (cols - 1) * gap) / 2
  const oy = (h - (rows - 1) * gap) / 2
  let s = ''
  for (let i = 0; i < cols; i++) for (let k = 0; k < rows; k++) s += circle(ox + i * gap, oy + k * gap, p.dotSize)
  return `<g fill="${paint}">${s}</g>`
}

const DRAW = { ink, watercolor, brush, splatter, highlight, arrow, circle: loop, sparkle, washi, dots }

/** A traced stain, drawn in its own traced coordinates and stretched to the box. */
function stainSvg(p, id) {
  const s = INK_STAINS[p.stain] ?? INK_STAINS[0]
  const gid = `${id}-paint`
  const defs = svgGradientDef(p.color, gid, [0, 0, s.w, s.h])
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${s.w} ${s.h}" preserveAspectRatio="none" style="display:block" aria-hidden="true">` +
    (defs ? `<defs>${defs}</defs>` : '') +
    `<path d="${s.d}" fill="${esc(svgPaint(p.color, gid))}" fill-rule="evenodd"/></svg>`
  )
}

/**
 * The decoration as an <svg> filling its box. `id` must be unique on the page (gradient / clip ids).
 */
export function decorSvg(el, id, size = el) {
  const p = el.props
  if (p.kind === 'stain') return stainSvg(p, id)
  const w = Math.max(1, size.w)
  const h = Math.max(1, size.h)
  const draw = DRAW[p.kind] ?? ink
  const gid = `${id}-paint`
  // One gradient across the whole box, shared by every piece of the drawing (strips, drops, washes).
  const defs = svgGradientDef(p.color, gid, [0, 0, w, h])
  // Colours come from the user: escaped, since they go into attributes.
  const body = draw(rng(p.seed || 1), w, h, esc(svgPaint(p.color, gid)), p, id)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${n(w)} ${n(h)}" preserveAspectRatio="none" overflow="visible" style="display:block;overflow:visible" aria-hidden="true">` +
    (defs ? `<defs>${defs}</defs>` : '') +
    body +
    '</svg>'
  )
}

