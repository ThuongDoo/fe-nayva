/**
 * Colour themes for a whole design. Every colour a design uses (page background, element fills, text,
 * borders, gradient stops, icon / decor / audio colours, coloured words) is found here, and a theme is
 * just a map from each of those colours to its replacement: `{ '#4f46e5': '#e11d48', … }`, keys and
 * values '#rrggbb' in lower case. Alpha is kept, so 'rgba(79, 70, 229, 0.3)' follows '#4f46e5'.
 *
 * The editor's colour theme menu (ThemeMenu) always maps from the colours the page had before theming
 * (kept in page.theme, see below), so themes can be switched back and forth (or reset) without drift.
 */

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

// #rgb, #rgba, #rrggbb, #rrggbbaa, rgb(…), rgba(…) — the forms the editor writes.
const TOKEN = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|rgba?\(\s*[\d.]+%?\s*[,\s]\s*[\d.]+%?\s*[,\s]\s*[\d.]+%?\s*(?:[,/]\s*[\d.]+%?\s*)?\)/gi

function parseToken(t) {
  if (t[0] === '#') {
    let h = t.slice(1)
    if (h.length <= 4) h = [...h].map((c) => c + c).join('')
    const n = (i) => parseInt(h.slice(i, i + 2), 16)
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1, hex: true }
  }
  const parts = t.slice(t.indexOf('(') + 1, -1).split(/[\s,/]+/).filter(Boolean)
  const channel = (p) => (p.endsWith('%') ? (parseFloat(p) / 100) * 255 : parseFloat(p))
  const alpha = parts[3] === undefined ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3])
  return { r: channel(parts[0]), g: channel(parts[1]), b: channel(parts[2]), a: clamp(alpha, 0, 1), hex: false }
}

const hex2 = (v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')
const toHex = ({ r, g, b }) => `#${hex2(r)}${hex2(g)}${hex2(b)}`

/** '#rrggbb' → { r, g, b } */
const rgbOf = (hex) => parseToken(hex)

/** The token written back with its new colour, in its own form and with its own alpha. */
function formatToken(orig, hex) {
  const { r, g, b } = rgbOf(hex)
  if (orig.a >= 1) return hex
  if (orig.hex) return hex + hex2(orig.a * 255)
  return `rgba(${r}, ${g}, ${b}, ${+orig.a.toFixed(3)})`
}

const replaceTokens = (value, fn) =>
  typeof value === 'string' ? value.replace(TOKEN, (t) => formatToken(parseToken(t), fn(toHex(parseToken(t))))) : value

const TEXT_TYPES = ['heading', 'text', 'button']

/** Whether a paint (colour or gradient) has a vivid colour in it, e.g. a coloured button. */
const isVivid = (v) => typeof v === 'string' && (v.match(TOKEN) ?? []).some((t) => toHsl(toHex(parseToken(t))).chroma >= VIVID)

/**
 * A copy of the design with every colour string passed through `fn(value, onVivid, key)`. Covers the
 * page background, style.background / color / borderColor, every *color* prop (color, color2, iconColor,
 * rimColor…) and the colours of coloured words (props.marks). `onVivid` is true for text and icon
 * colours drawn on the element's own vivid background (white text on a coloured button). `key` names
 * the spot ("page", "<element id>|s|color", "<element id>|m|2"…).
 */
function mapColors(design, fn) {
  const page = { ...design.page, background: fn(design.page.background, false, 'page') }
  const elements = design.elements.map((el) => {
    const onVivid = isVivid(el.style?.background)
    const fg = (k) => (k === 'color' ? TEXT_TYPES.includes(el.type) : k === 'iconColor') && onVivid
    const style = { ...el.style }
    for (const k of ['background', 'color', 'borderColor']) if (k in style) style[k] = fn(style[k], fg(k), `${el.id}|s|${k}`)
    const props = { ...el.props }
    for (const k of Object.keys(props)) {
      if (/color/i.test(k) && typeof props[k] === 'string') props[k] = fn(props[k], fg(k), `${el.id}|p|${k}`)
    }
    if (Array.isArray(props.marks)) props.marks = props.marks.map((m, i) => ({ ...m, color: fn(m.color, fg('color'), `${el.id}|m|${i}`) }))
    return { ...el, style, props }
  })
  return { ...design, page, elements }
}

/** Whether a value has a visible colour in it. */
const hasColor = (v) => typeof v === 'string' && (v.match(TOKEN) ?? []).some((t) => parseToken(t).a > 0)

/** The design's colours, most used first: `[{ color: '#rrggbb', count }]`. Fully transparent ones are left out. */
export function designColors(design) {
  const counts = new Map()
  mapColors(design, (v) => {
    if (typeof v !== 'string') return v
    for (const t of v.match(TOKEN) ?? []) {
      const c = parseToken(t)
      if (c.a === 0) continue
      const hex = toHex(c)
      counts.set(hex, (counts.get(hex) ?? 0) + 1)
    }
    return v
  })
  return [...counts].map(([color, count]) => ({ color, count })).sort((a, b) => b.count - a.count)
}

/**
 * What the original colour `hex` becomes: through `map` (see the top of this file), then with `dark`
 * swapping light and dark for backgrounds, text and pale tints (vivid accents and the `fixed` original
 * colours, picked by hand, keep theirs). Text on vivid backgrounds is recoloured without `dark`.
 */
export function finalColor(hex, map, { dark = false, fixed = [] } = {}) {
  const next = map?.[hex] ?? hex
  return dark && !fixed.includes(hex) && toHsl(hex).chroma < VIVID ? invertLightness(next) : next
}

function invertLightness(hex) {
  const c = toHsl(hex)
  return fromHsl({ ...c, l: 1 - c.l })
}

// ---------------------------------------------------------------- HSL

function toHsl(hex) {
  const { r, g, b } = rgbOf(hex)
  const [R, G, B] = [r / 255, g / 255, b / 255]
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const l = (max + min) / 2
  const d = max - min
  if (!d) return { h: 0, s: 0, l, chroma: 0 }
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4
  return { h: (h * 60 + 360) % 360, s, l, chroma: d }
}

function fromHsl({ h, s, l }) {
  s = clamp(s, 0, 1)
  l = clamp(l, 0, 1)
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  const [r, g, b] = hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x]
  const m = l - c / 2
  return toHex({ r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 })
}

const hueDist = (a, b) => Math.abs(((a - b + 540) % 360) - 180)

// ---------------------------------------------------------------- themes

/**
 * Ready-made themes. `hues`: the new hue of the design's main colour family, then of the second, third…
 * (cycling); every colour keeps its own lightness and saturation, so light/dark contrast stays as
 * designed. `sat` scales saturation; `gray` drops all colour.
 */
export const THEMES = [
  { id: 'original', name: 'Gốc' },
  { id: 'ocean', name: 'Biển', hues: [212, 188, 245] },
  { id: 'forest', name: 'Rừng', hues: [152, 85, 40] },
  { id: 'sunset', name: 'Hoàng hôn', hues: [16, 340, 42] },
  { id: 'rose', name: 'Hồng', hues: [338, 275, 20] },
  { id: 'violet', name: 'Tím', hues: [262, 305, 195] },
  { id: 'gold', name: 'Vàng', hues: [42, 20, 200] },
  { id: 'earth', name: 'Đất', hues: [28, 85, 12], sat: 0.55 },
  { id: 'pastel', name: 'Pastel', hues: [330, 200, 150], sat: 0.6, lift: 0.12 },
  { id: 'gray', name: 'Trắng đen', gray: true },
]

/** Below this chroma a colour counts as gray (white, black, neutral grays). */
const GRAY = 0.03
/** At or above this chroma a colour is vivid enough to define a colour family. */
const VIVID = 0.15

/**
 * The hues of the design's colour families: its vivid colours grouped by hue, the most prominent family
 * (by use × vividness) first. A family's hue is that of its most prominent colour. Worked out once, the
 * first time a page is themed, and kept in page.theme, so later edits can't reshuffle the theme.
 */
export function hueFamilies(colors) {
  const families = []
  for (const { color, count } of colors) {
    const c = toHsl(color)
    if (c.chroma < VIVID) continue
    const f = families.find((f) => hueDist(f.h, c.h) < 35)
    if (f) f.weight += count * c.chroma
    else families.push({ h: c.h, weight: count * c.chroma })
  }
  return families.sort((a, b) => b.weight - a.weight).map((f) => Math.round(f.h))
}

/** `color` as it looks in `theme`; `families` from hueFamilies. */
function themed(color, theme, families) {
  if (theme.gray) {
    // By perceived brightness, so a deep blue stays dark.
    const { r, g, b } = rgbOf(color)
    const y = 0.299 * r + 0.587 * g + 0.114 * b
    return toHex({ r: y, g: y, b: y })
  }
  const c = toHsl(color)
  // Grays stay gray; the original theme changes nothing.
  if (!theme.hues || c.chroma < GRAY) return color
  // A colour of one of the families takes that family's theme hue (keeping its small offset from it);
  // any other colour, e.g. one picked by hand, takes the theme's main hue.
  const i = families.findIndex((h) => hueDist(h, c.h) < 35)
  const h = i >= 0 ? theme.hues[i % theme.hues.length] + (c.h - families[i]) : theme.hues[0]
  const l = theme.lift && c.chroma >= VIVID ? c.l + (1 - c.l) * theme.lift * 2 : c.l
  return fromHsl({ h, s: c.s * (theme.sat ?? 1), l })
}

/**
 * The colour map for `colors` (from designColors) under a theme choice:
 * `{ preset: THEMES id, dark: boolean, overrides: { '#base': '#picked' } }`. Only changed colours are
 * listed. Dark mode isn't part of the map: pass the choice to recolor through `recolorOptions`.
 */
export function themeMap(colors, { preset = 'original', overrides = {} } = {}, families = hueFamilies(colors)) {
  const theme = THEMES.find((t) => t.id === preset) ?? THEMES[0]
  const map = {}
  for (const { color } of colors) {
    const next = (overrides[color] ?? themed(color, theme, families)).toLowerCase()
    if (next !== color) map[color] = next
  }
  return map
}

/** recolor's options for a theme choice (or null): dark mode, and the hand-picked colours it leaves alone. */
export const recolorOptions = (choice) => ({ dark: !!choice?.dark, fixed: Object.keys(choice?.overrides ?? {}) })

// ---------------------------------------------------------------- themes saved with the page

/*
 * A themed page remembers its colours from before theming in `page.theme`:
 *   { preset, dark, overrides: [{ from, to }], spots: [{ k, from, to }], families: [hue…] }
 * `spots` lists every recoloured spot (key from mapColors) with its colour before (`from`) and after
 * (`to`) theming. A theme always starts again from `from`, also where that spot was recoloured by hand
 * since, so every theme looks the same whatever was edited in between; colours picked in the "Màu"
 * tab (`overrides`) are the way to keep a colour of one's own. `families`: see hueFamilies.
 * Arrays rather than maps, because Firestore's merge would keep keys removed from a map.
 */

export const DEFAULT_THEME = { preset: 'original', dark: false, overrides: {} }

/** The theme choice the page was last given ({ preset, dark, overrides: { '#from': '#to' } }). */
export function pageTheme(design) {
  const t = design.page.theme
  if (!t) return DEFAULT_THEME
  return {
    preset: t.preset ?? 'original',
    dark: !!t.dark,
    overrides: Object.fromEntries((t.overrides ?? []).map((o) => [o.from, o.to])),
  }
}

/** The page with the colours it had before theming (and no saved theme). */
export function unthemed(design) {
  const spots = design.page.theme?.spots
  if (!spots?.length) return design.page.theme ? { ...design, page: { ...design.page, theme: null } } : design
  const before = new Map(spots.map((s) => [s.k, s.from]))
  // A colour made transparent (or removed) since stays so: that was a choice, not a recolour.
  const out = mapColors(design, (v, _, key) => (before.has(key) && hasColor(v) ? before.get(key) : v))
  return { ...out, page: { ...out.page, theme: null } }
}

/** The page's colour families (see hueFamilies): the ones kept from its first theming, if any. */
export const pageFamilies = (design, colors) => design.page.theme?.families ?? hueFamilies(colors)

/** The page recoloured by `choice` (see pageTheme), starting again from its colours before theming. */
export function applyTheme(design, choice) {
  const base = unthemed(design)
  const colors = designColors(base)
  const families = pageFamilies(design, colors)
  const map = themeMap(colors, choice, families)
  const options = recolorOptions(choice)
  const spots = []
  const out = mapColors(base, (v, onVivid, key) => {
    const next = replaceTokens(v, (hex) => finalColor(hex, map, onVivid ? {} : options))
    if (next !== v) spots.push({ k: key, from: v, to: next })
    return next
  })
  const overrides = Object.entries(choice.overrides ?? {}).map(([from, to]) => ({ from, to }))
  // Kept even when back to the original colours, so the families stay put.
  const theme = { preset: choice.preset, dark: !!choice.dark, overrides, spots, families }
  return { ...out, page: { ...out.page, theme } }
}
