/**
 * Text fonts. Every Google font here has Vietnamese glyphs (checked against the Google Fonts CSS), so
 * accented text never falls back to another face. Fonts are loaded on demand: the editor adds a
 * stylesheet per family when an element uses it (loadFonts), exported pages link only what they use.
 */

export const FONT_GROUPS = [
  { id: 'sans', label: 'Không chân', fallback: 'system-ui, sans-serif' },
  { id: 'serif', label: 'Có chân', fallback: 'Georgia, serif' },
  { id: 'display', label: 'Tiêu đề nổi bật', fallback: 'system-ui, sans-serif' },
  { id: 'script', label: 'Viết tay', fallback: 'cursive' },
  { id: 'mono', label: 'Đơn cách', fallback: 'ui-monospace, Consolas, monospace' },
]

// Weight axes: text faces get light → extra bold plus italic; one-weight display / script faces get none.
const SANS = 'ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400'

// [value, label, group, Google Fonts family spec (null: not a web font)]
const LIST = [
  ['be-vietnam', 'Be Vietnam Pro', 'sans', `Be+Vietnam+Pro:${SANS}`],
  ['inter', 'Inter', 'sans', 'Inter:wght@300;400;500;600;700;800'],
  ['roboto', 'Roboto', 'sans', 'Roboto:ital,wght@0,300;0,400;0,500;0,700;0,900;1,400'],
  ['open-sans', 'Open Sans', 'sans', 'Open+Sans:ital,wght@0,300;0,400;0,600;0,700;0,800;1,400'],
  ['montserrat', 'Montserrat', 'sans', `Montserrat:${SANS}`],
  ['nunito', 'Nunito', 'sans', 'Nunito:ital,wght@0,300;0,400;0,600;0,700;0,800;1,400'],
  ['quicksand', 'Quicksand', 'sans', 'Quicksand:wght@300;400;500;600;700'],
  ['mulish', 'Mulish', 'sans', 'Mulish:ital,wght@0,300;0,400;0,600;0,700;0,800;1,400'],
  ['lexend', 'Lexend', 'sans', 'Lexend:wght@300;400;500;600;700;800'],
  ['manrope', 'Manrope', 'sans', 'Manrope:wght@300;400;500;600;700;800'],
  ['jakarta', 'Plus Jakarta Sans', 'sans', `Plus+Jakarta+Sans:${SANS}`],
  ['work-sans', 'Work Sans', 'sans', `Work+Sans:${SANS}`],
  ['josefin', 'Josefin Sans', 'sans', 'Josefin+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400'],
  ['raleway', 'Raleway', 'sans', `Raleway:${SANS}`],
  ['barlow', 'Barlow', 'sans', `Barlow:${SANS}`],
  ['archivo', 'Archivo', 'sans', `Archivo:${SANS}`],
  ['kanit', 'Kanit', 'sans', `Kanit:${SANS}`],
  ['cabin', 'Cabin', 'sans', 'Cabin:ital,wght@0,400;0,500;0,600;0,700;1,400'],
  ['dosis', 'Dosis', 'sans', 'Dosis:wght@300;400;500;600;700;800'],
  ['encode-sans', 'Encode Sans', 'sans', 'Encode+Sans:wght@300;400;500;600;700;800'],
  ['signika', 'Signika', 'sans', 'Signika:wght@300;400;500;600;700'],
  ['system', 'Hệ thống', 'sans', null],

  ['playfair', 'Playfair Display', 'serif', 'Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400'],
  ['lora', 'Lora', 'serif', 'Lora:ital,wght@0,400;0,600;0,700;1,400'],
  ['merriweather', 'Merriweather', 'serif', 'Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,400'],
  ['noto-serif', 'Noto Serif', 'serif', 'Noto+Serif:ital,wght@0,400;0,600;0,700;1,400'],
  ['eb-garamond', 'EB Garamond', 'serif', 'EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400'],
  ['cormorant', 'Cormorant Garamond', 'serif', 'Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400'],
  ['crimson', 'Crimson Pro', 'serif', 'Crimson+Pro:ital,wght@0,300;0,400;0,600;0,700;0,800;1,400'],
  ['source-serif', 'Source Serif 4', 'serif', 'Source+Serif+4:ital,wght@0,300;0,400;0,600;0,700;0,800;1,400'],
  ['literata', 'Literata', 'serif', 'Literata:ital,wght@0,300;0,400;0,600;0,700;0,800;1,400'],
  ['vollkorn', 'Vollkorn', 'serif', 'Vollkorn:ital,wght@0,400;0,600;0,700;0,800;1,400'],
  ['roboto-slab', 'Roboto Slab', 'serif', 'Roboto+Slab:wght@300;400;500;700;800'],
  ['philosopher', 'Philosopher', 'serif', 'Philosopher:ital,wght@0,400;0,700;1,400'],
  ['prata', 'Prata', 'serif', 'Prata'],
  ['yeseva', 'Yeseva One', 'serif', 'Yeseva+One'],

  ['oswald', 'Oswald', 'display', 'Oswald:wght@300;400;500;600;700'],
  ['anton', 'Anton', 'display', 'Anton'],
  ['big-shoulders', 'Big Shoulders Display', 'display', 'Big+Shoulders+Display:wght@400;600;700;800'],
  ['alfa-slab', 'Alfa Slab One', 'display', 'Alfa+Slab+One'],
  ['paytone', 'Paytone One', 'display', 'Paytone+One'],
  ['bungee', 'Bungee', 'display', 'Bungee'],
  ['bungee-shade', 'Bungee Shade', 'display', 'Bungee+Shade'],
  ['bangers', 'Bangers', 'display', 'Bangers'],
  ['lobster', 'Lobster', 'display', 'Lobster'],
  ['baloo', 'Baloo 2', 'display', 'Baloo+2:wght@400;500;600;700;800'],
  ['comfortaa', 'Comfortaa', 'display', 'Comfortaa:wght@300;400;500;600;700'],
  ['lemonada', 'Lemonada', 'display', 'Lemonada:wght@300;400;500;600;700'],
  ['grandstander', 'Grandstander', 'display', 'Grandstander:wght@400;600;700;800'],
  ['chakra-petch', 'Chakra Petch', 'display', 'Chakra+Petch:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400'],
  ['tektur', 'Tektur', 'display', 'Tektur:wght@400;500;600;700;800'],
  ['saira-stencil', 'Saira Stencil One', 'display', 'Saira+Stencil+One'],
  ['arima', 'Arima', 'display', 'Arima:wght@400;500;600;700'],
  ['oi', 'Oi', 'display', 'Oi'],

  ['dancing-script', 'Dancing Script', 'script', 'Dancing+Script:wght@400;500;600;700'],
  ['great-vibes', 'Great Vibes', 'script', 'Great+Vibes'],
  ['allura', 'Allura', 'script', 'Allura'],
  ['pacifico', 'Pacifico', 'script', 'Pacifico'],
  ['playball', 'Playball', 'script', 'Playball'],
  ['charm', 'Charm', 'script', 'Charm:wght@400;700'],
  ['pattaya', 'Pattaya', 'script', 'Pattaya'],
  ['birthstone', 'Birthstone', 'script', 'Birthstone'],
  ['ephesis', 'Ephesis', 'script', 'Ephesis'],
  ['moon-dance', 'Moon Dance', 'script', 'Moon+Dance'],
  ['imperial-script', 'Imperial Script', 'script', 'Imperial+Script'],
  ['luxurious-script', 'Luxurious Script', 'script', 'Luxurious+Script'],
  ['patrick-hand', 'Patrick Hand', 'script', 'Patrick+Hand'],
  ['pangolin', 'Pangolin', 'script', 'Pangolin'],
  ['itim', 'Itim', 'script', 'Itim'],
  ['sriracha', 'Sriracha', 'script', 'Sriracha'],
  ['mali', 'Mali', 'script', 'Mali:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400'],

  ['jetbrains-mono', 'JetBrains Mono', 'mono', 'JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,700;0,800;1,400'],
  ['roboto-mono', 'Roboto Mono', 'mono', 'Roboto+Mono:ital,wght@0,300;0,400;0,500;0,700;1,400'],
  ['space-mono', 'Space Mono', 'mono', 'Space+Mono:ital,wght@0,400;0,700;1,400'],
  ['vt323', 'VT323', 'mono', 'VT323'],
  ['mono', 'Monospace', 'mono', null],
]

const fallbackOf = Object.fromEntries(FONT_GROUPS.map((g) => [g.id, g.fallback]))
const SYSTEM_STACKS = {
  system: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: 'ui-monospace, Consolas, monospace',
}

export const FONTS = LIST.map(([value, label, group, google]) => ({
  value,
  label,
  group,
  google,
  stack: SYSTEM_STACKS[value] ?? `'${label}', ${fallbackOf[group]}`,
}))

const BY_VALUE = new Map(FONTS.map((f) => [f.value, f]))

export const fontOf = (value) => BY_VALUE.get(value) ?? FONTS[0]

export const fontStack = (value) => fontOf(value).stack

/** Google Fonts stylesheet URL for the given font values ('' when none of them is a web font). */
export function googleFontsUrl(values) {
  const specs = [...new Set([...values].map((v) => fontOf(v).google).filter(Boolean))]
  return specs.length ? `https://fonts.googleapis.com/css2?family=${specs.join('&family=')}&display=swap` : ''
}

/** Font values used by the visible elements of a design. */
export const usedFonts = (elements) => new Set(elements.filter((el) => !el.hidden && el.style?.fontFamily).map((el) => el.style.fontFamily))

const loaded = new Set()

/** Browser only: adds the stylesheet of each font not loaded yet (one <link> per family, once). */
export function loadFonts(values) {
  for (const v of values) {
    const font = fontOf(v)
    if (!font.google || loaded.has(font.value)) continue
    loaded.add(font.value)
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = googleFontsUrl([font.value])
    document.head.appendChild(link)
  }
}
