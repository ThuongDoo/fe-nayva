/** Shape elements (torn paper, diamond, circle…): an outline that can be filled with a color or an image, drawn as inline SVG. */

import { svgGradientDef, svgPaint } from './gradient.js'

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const randomSeed = () => Math.floor(Math.random() * 1e6) + 1

export const TORN_EDGES = [
  ['top', 'Mép trên'],
  ['bottom', 'Mép dưới'],
  ['left', 'Mép trái'],
  ['right', 'Mép phải'],
  ['diagonal', 'Chéo ↗ (giữ góc dưới phải)'],
  ['diagonal2', 'Chéo ↘ (giữ góc dưới trái)'],
]

/** Shape catalog. `props` overrides the shared shape defaults in elements.js. */
export const SHAPES = {
  torn: { label: 'Giấy rách', w: 400, h: 400, props: { rim: 7, rimColor: '#f8f8f6', texture: true, shadow: true } },
  diamond: { label: 'Hình thoi', w: 320, h: 320 },
  circle: { label: 'Hình tròn', w: 320, h: 320 },
  triangle: { label: 'Tam giác', w: 320, h: 300 },
  hexagon: { label: 'Lục giác', w: 340, h: 300 },
  star: { label: 'Ngôi sao', w: 320, h: 320 },
  arch: { label: 'Mái vòm', w: 300, h: 400 },
  heart: { label: 'Trái tim', w: 320, h: 300 },
  blob: { label: 'Hình cong', w: 340, h: 320 },
}
export const SHAPE_ORDER = Object.keys(SHAPES)

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

const num = (v) => +v.toFixed(1)
const polygon = (pts) => 'M' + pts.map(([x, y]) => `${num(x)},${num(y)}`).join('L') + 'Z'

/**
 * Polygon with its corners rounded by `r` px: each corner is cut back along both edges (never more
 * than half an edge) and joined with a curve through the original point.
 */
function roundedPolygon(pts, r) {
  if (!(r > 0)) return polygon(pts)
  const n = pts.length
  let d = ''
  for (let i = 0; i < n; i++) {
    const p = pts[i]
    const prev = pts[(i - 1 + n) % n]
    const next = pts[(i + 1) % n]
    const lp = Math.hypot(prev[0] - p[0], prev[1] - p[1])
    const ln = Math.hypot(next[0] - p[0], next[1] - p[1])
    const c = Math.min(r, lp / 2, ln / 2)
    const a = [p[0] + ((prev[0] - p[0]) * c) / lp, p[1] + ((prev[1] - p[1]) * c) / lp]
    const b = [p[0] + ((next[0] - p[0]) * c) / ln, p[1] + ((next[1] - p[1]) * c) / ln]
    d += `${i ? 'L' : 'M'}${num(a[0])},${num(a[1])}Q${num(p[0])},${num(p[1])} ${num(b[0])},${num(b[1])}`
  }
  return d + 'Z'
}

/** Shapes with sharp corners, which `cornerRadius` can round. */
export const ROUNDABLE_SHAPES = ['diamond', 'triangle', 'hexagon', 'star']

/** Stretches unit-space points (any bounding box) to fill w×h. */
function fitPoints(pts, w, h) {
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const [x0, y0] = [Math.min(...xs), Math.min(...ys)]
  const sx = w / (Math.max(...xs) - x0)
  const sy = h / (Math.max(...ys) - y0)
  return pts.map(([x, y]) => [(x - x0) * sx, (y - y0) * sy])
}

/** Closed smooth curve through the points (Catmull-Rom converted to cubic Béziers). */
function smoothClosed(pts) {
  const n = pts.length
  let d = `M${num(pts[0][0])},${num(pts[0][1])}`
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${num(c1[0])},${num(c1[1])} ${num(c2[0])},${num(c2[1])} ${num(p2[0])},${num(p2[1])}`
  }
  return d + 'Z'
}

/** Tear line from p0 to p1, `n` is the unit normal pointing away from the kept paper; `corners` close the shape. */
function edgeGeometry(edge, w, h, inset) {
  const d = Math.hypot(w, h)
  switch (edge) {
    case 'bottom':
      return { p0: [w, h - inset], p1: [0, h - inset], n: [0, 1], corners: [[0, 0], [w, 0]] }
    case 'left':
      return { p0: [inset, h], p1: [inset, 0], n: [-1, 0], corners: [[w, 0], [w, h]] }
    case 'right':
      return { p0: [w - inset, 0], p1: [w - inset, h], n: [1, 0], corners: [[0, h], [0, 0]] }
    case 'diagonal':
      return { p0: [0, h], p1: [w, 0], n: [-h / d, -w / d], corners: [[w, h]] }
    case 'diagonal2':
      return { p0: [0, 0], p1: [w, h], n: [h / d, -w / d], corners: [[0, h]] }
    default:
      return { p0: [0, inset], p1: [w, inset], n: [0, -1], corners: [[w, h], [0, h]] }
  }
}

/** Paper and rim outlines of a torn edge. Deterministic for a given seed so the tear doesn't change on re-render. */
function tornPaths(w, h, { edge, depth, tooth, rim, seed }) {
  const rand = rng(seed)
  const diagonal = edge.startsWith('diagonal')
  const { p0, p1, n, corners } = edgeGeometry(edge, w, h, diagonal ? 0 : depth + rim)
  const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1])

  // Slow wander (control points every ~90px, smoothly interpolated) plus fine jagged teeth.
  const span = 90
  const knots = Array.from({ length: Math.ceil(len / span) + 2 }, () => rand() * 2 - 1)
  const wander = (t) => {
    const x = (t * len) / span
    const i = Math.floor(x)
    const f = x - i
    const s = f * f * (3 - 2 * f)
    return knots[i] * (1 - s) + knots[i + 1] * s
  }

  const paper = []
  const rimLine = []
  const at = (t, off) => [p0[0] + (p1[0] - p0[0]) * t + n[0] * off, p0[1] + (p1[1] - p0[1]) * t + n[1] * off]
  const step = Math.max(2, tooth)
  for (let dist = 0; ; ) {
    const t = Math.min(1, dist / len)
    const off = depth * (0.65 * wander(t) + 0.35 * (rand() * 2 - 1))
    paper.push(at(t, off))
    rimLine.push(at(t, off + rim * (0.3 + 0.9 * rand())))
    if (t >= 1) break
    dist += step * (0.4 + rand() * 0.9)
  }
  return { fill: polygon([...paper, ...corners]), rim: polygon([...rimLine, ...corners]) }
}

/**
 * Outline of a shape in a w×h box. Returns `{ fill, rim? }`: torn paper has its own rim outline,
 * other shapes get their rim as a stroke around `fill`.
 */
export function shapePaths(shape, w, h, p) {
  switch (shape) {
    case 'torn':
      return tornPaths(w, h, p)
    case 'diamond':
      return { fill: roundedPolygon([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]], p.cornerRadius) }
    case 'triangle':
      return { fill: roundedPolygon([[w / 2, 0], [w, h], [0, h]], p.cornerRadius) }
    case 'hexagon':
      return { fill: roundedPolygon([[w / 4, 0], [(3 * w) / 4, 0], [w, h / 2], [(3 * w) / 4, h], [w / 4, h], [0, h / 2]], p.cornerRadius) }
    case 'star': {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const a = (i * Math.PI) / 5 - Math.PI / 2
        const r = i % 2 ? 0.4 : 1
        return [Math.cos(a) * r, Math.sin(a) * r]
      })
      return { fill: roundedPolygon(fitPoints(pts, w, h), p.cornerRadius) }
    }
    case 'circle':
      return {
        fill: `M0,${h / 2}A${w / 2},${h / 2} 0 1 0 ${w},${h / 2}A${w / 2},${h / 2} 0 1 0 0,${h / 2}Z`,
      }
    case 'arch': {
      const ry = Math.min(w / 2, h)
      return { fill: `M0,${h}L0,${ry}A${w / 2},${ry} 0 0 1 ${w},${ry}L${w},${h}Z` }
    }
    case 'heart': {
      const X = (v) => num(v * w)
      const Y = (v) => num(v * h)
      return {
        fill:
          `M${X(0.5)},${Y(1)}C${X(0.1)},${Y(0.72)} 0,${Y(0.45)} 0,${Y(0.3)}` +
          `C0,${Y(0.13)} ${X(0.13)},0 ${X(0.28)},0C${X(0.39)},0 ${X(0.47)},${Y(0.07)} ${X(0.5)},${Y(0.16)}` +
          `C${X(0.53)},${Y(0.07)} ${X(0.61)},0 ${X(0.72)},0C${X(0.87)},0 ${w},${Y(0.13)} ${w},${Y(0.3)}` +
          `C${w},${Y(0.45)} ${X(0.9)},${Y(0.72)} ${X(0.5)},${Y(1)}Z`,
      }
    }
    case 'blob': {
      const rand = rng(p.seed)
      const pts = Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2 + rand() * 0.4
        const r = 0.72 + rand() * 0.28
        return [Math.cos(a) * r, Math.sin(a) * r]
      })
      // The smooth curve bulges past its points, so fit the points a little inside the box.
      const inner = fitPoints(pts, w * 0.9, h * 0.9).map(([x, y]) => [x + w * 0.05, y + h * 0.05])
      return { fill: smoothClosed(inner) }
    }
    default:
      return { fill: polygon([[0, 0], [w, 0], [w, h], [0, h]]) }
  }
}

/**
 * Where the image sits inside the box: scaled to cover it, times `imgZoom`, then placed with its
 * center at (`imgCX`, `imgCY`) — fractions of the box size, unbounded, so the image may leave the
 * box entirely. Older designs only have `imgX`/`imgY` (CSS object-position %), used as a fallback.
 * Null if the size is unknown.
 */
export function imageRect(w, h, p) {
  if (!p.imgW || !p.imgH) return null
  const s = Math.max(w / p.imgW, h / p.imgH) * (p.imgZoom || 1)
  // imgStretchX/Y (default 1) let the image be resized freely, out of its natural proportions.
  const iw = p.imgW * s * (p.imgStretchX || 1)
  const ih = p.imgH * s * (p.imgStretchY || 1)
  const x = p.imgCX != null ? p.imgCX * w - iw / 2 : ((w - iw) * (p.imgX ?? 50)) / 100
  const y = p.imgCY != null ? p.imgCY * h - ih / 2 : ((h - ih) * (p.imgY ?? 50)) / 100
  return { x, y, w: iw, h: ih }
}

/** `imgCX`/`imgCY` props putting an image of size (iw, ih) with its top-left at (x, y) in a w×h box. */
export const imageCenterProps = (w, h, x, y, iw, ih) => ({
  imgCX: Math.round(((x + iw / 2) / w) * 10000) / 10000,
  imgCY: Math.round(((y + ih / 2) / h) * 10000) / 10000,
})

function imageTag(w, h, p, extra) {
  const r = imageRect(w, h, p)
  const box = r
    ? `x="${num(r.x)}" y="${num(r.y)}" width="${num(r.w)}" height="${num(r.h)}" preserveAspectRatio="none"`
    : `x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"`
  return `<image href="${esc(p.src)}" ${box}${extra}/>`
}

/**
 * Returns the SVG markup; `id` must be unique in the document (used for clip-path/filter references).
 * `ghost` also draws the whole image faintly, to show what is cropped while positioning it.
 */
export function shapeSvg(el, id, { ghost = false } = {}) {
  const { w, h } = el
  const p = el.props
  const paths = shapePaths(p.shape, w, h, p)
  const clip = `${id}-clip`
  const shadow = `${id}-shadow`
  const tex = `${id}-tex`

  const defs = [`<clipPath id="${clip}"><path d="${paths.fill}"/></clipPath>`]
  if (p.shadow) {
    defs.push(
      `<filter id="${shadow}" x="-10%" y="-10%" width="120%" height="120%">` +
        `<feDropShadow dx="1.5" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.35"/></filter>`,
    )
  }
  if (p.texture) {
    defs.push(
      `<filter id="${tex}" x="0" y="0" width="100%" height="100%">` +
        `<feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed="${p.seed % 1000}" result="noise"/>` +
        `<feDiffuseLighting in="noise" surfaceScale="1.8" lighting-color="#fff" result="light">` +
        `<feDistantLight azimuth="225" elevation="55"/></feDiffuseLighting>` +
        `<feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="1.2" k2="0" k3="0" k4="0" result="lit"/>` +
        `<feComposite in="lit" in2="SourceGraphic" operator="in"/></filter>`,
    )
  }

  // Fill and rim may be gradients: define them once and paint with url(#…).
  const fillId = `${id}-fill`
  const rimId = `${id}-rim`
  defs.push(svgGradientDef(el.style.background, fillId))
  let rim = ''
  if (p.rim > 0) {
    defs.push(svgGradientDef(p.rimColor, rimId))
    const color = esc(svgPaint(p.rimColor, rimId))
    rim = paths.rim
      ? `<path d="${paths.rim}" fill="${color}"/>`
      : `<path d="${paths.fill}" fill="${color}" stroke="${color}" stroke-width="${p.rim * 2}" stroke-linejoin="round"/>`
  }
  const label = p.alt ? ` role="img" aria-label="${esc(p.alt)}"` : ' aria-hidden="true"'

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${w} ${h}" style="display:block;overflow:visible"${label}>` +
    `<defs>${defs.join('')}</defs>` +
    (ghost && p.src && !isVideo(p) ? imageTag(w, h, p, ' opacity="0.3"') : '') +
    `<g${p.shadow ? ` filter="url(#${shadow})"` : ''}><g${p.texture ? ` filter="url(#${tex})"` : ''}>` +
    rim +
    `<path d="${paths.fill}" fill="${esc(svgPaint(el.style.background, fillId))}"/>` +
    // A video is not part of the SVG: it is an HTML <video> layered on top (shapeVideoHtml).
    (p.src && !isVideo(p) ? imageTag(w, h, p, ` clip-path="url(#${clip})"`) : '') +
    `</g></g></svg>`
  )
}

/** Props for putting a freshly read image ({ src, width, height }) into a shape, re-centered. */
/** Whether the shape is filled with a video (props.mediaType), rather than an image or a colour. */
export const isVideo = (p) => p.mediaType === 'video'

/**
 * Where the shape's video sits, as CSS for an absolutely positioned <video>: the same framing as an
 * image (imgCX/imgCY/imgZoom over the natural size imgW/imgH), or covering the box until that is known.
 */
export function videoBoxStyle(w, h, p) {
  const r = imageRect(w, h, p)
  return r ? { left: r.x, top: r.y, width: r.w, height: r.h, objectFit: 'fill' } : { left: 0, top: 0, width: w, height: h, objectFit: 'cover' }
}

/** CSS clip-path cutting the video to the shape's outline (same coordinates as the element box). */
export const shapeClipPath = (el) => `path('${shapePaths(el.props.shape, el.w, el.h, el.props).fill}')`

/**
 * HTML for a video-filled shape (exported pages): the clipped, muted, looping video that goes on top
 * of the shape's SVG. '' when the shape has no video.
 */
export function shapeVideoHtml(el, { autoplay = true } = {}) {
  const p = el.props
  if (!p.src || !isVideo(p)) return ''
  const b = videoBoxStyle(el.w, el.h, p)
  const box = `position:absolute;left:${num(b.left)}px;top:${num(b.top)}px;width:${num(b.width)}px;height:${num(b.height)}px;object-fit:${b.objectFit};display:block`
  const play = autoplay ? ' autoplay' : ''
  const label = p.alt ? ` aria-label="${esc(p.alt)}"` : ' aria-hidden="true"'
  return (
    `<div style="position:absolute;inset:0;clip-path:${esc(shapeClipPath(el))}">` +
    `<video src="${esc(p.src)}"${play} muted loop playsinline preload="auto"${label} style="${box}"></video></div>`
  )
}

/** Framing props for a centered image that just covers the box. */
export const IMAGE_FRAME_RESET = { imgCX: 0.5, imgCY: 0.5, imgZoom: 1, imgStretchX: 1, imgStretchY: 1 }

export const shapeImageProps = (img, name = '') => ({
  mediaType: img.mediaType ?? 'image',
  src: img.src,
  alt: name.replace(/\.[^.]+$/, ''),
  imgW: img.width,
  imgH: img.height,
  ...IMAGE_FRAME_RESET,
})

export const IMG_ZOOM_MIN = 0.2
export const IMG_ZOOM_MAX = 5

/**
 * Props for zooming the image to `zoom`, keeping the image point under (px, py) — box coordinates,
 * default the center — where it is. The image is free to extend past (or leave) the box.
 */
export function zoomImageAt(w, h, p, zoom, px = w / 2, py = h / 2) {
  const imgZoom = Math.min(IMG_ZOOM_MAX, Math.max(IMG_ZOOM_MIN, zoom))
  const r = imageRect(w, h, p)
  if (!r) return { imgZoom }
  const k = imgZoom / (p.imgZoom || 1)
  const x = px - (px - r.x) * k
  const y = py - (py - r.y) * k
  return { imgZoom, ...imageCenterProps(w, h, x, y, r.w * k, r.h * k) }
}
