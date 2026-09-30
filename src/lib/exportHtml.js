import { anchorId, blendMode, contentStyle, dividerLineStyle, elementTransform, linkAttrs, scrollLink, youtubeEmbed } from './elements.js'
import { googleFontsUrl, usedFonts } from './fonts.js'
import { decorSvg } from './decor.js'
import { shapeSvg, shapeVideoHtml } from './shapes.js'
import { AUDIO_SCRIPT, audioAttrs } from './audioViz.js'
import { ICON_LIBRARY, iconSvg } from './iconLibrary.js'
import { gradientBorderStyle, textGradientStyle } from './gradient.js'
import { MOTION_CSS, hasMotion, motionStyle } from './motion.js'

const UNITLESS = new Set(['opacity', 'fontWeight', 'lineHeight', 'zIndex'])

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const attr = (s = '') => esc(s).replace(/"/g, '&quot;')

export function toCssText(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => {
      const prop = k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
      const value = typeof v === 'number' && v !== 0 && !UNITLESS.has(k) ? `${v}px` : v
      return `${prop}:${value}`
    })
    .join(';')
}

/** href / target / rel attributes of a button or icon link. */
function linkHtml(p) {
  const { href, target, rel } = linkAttrs(p)
  return `href="${attr(href)}"` + (target ? ` target="${target}" rel="${rel}"` : '')
}

// In-page links (see scrollLink) glide to their element or point without touching the address bar.
// A point is in design px: scaled like the page (#page is shrunk to fit narrow screens).
const SCROLL_SCRIPT = `document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href^="#"]');
  if (!a) return;
  var h = a.getAttribute('href');
  var m = /^#y-([0-9]+)$/.exec(h);
  if (m) {
    e.preventDefault();
    var page = document.getElementById('page');
    var r = page.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + r.top + Number(m[1]) * (r.width / page.offsetWidth), behavior: 'smooth' });
    return;
  }
  var el = h === '#top' ? null : document.getElementById(h.slice(1));
  if (h !== '#top' && !el) return;
  e.preventDefault();
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
});`

function renderInner(el) {
  const css = attr(toCssText(contentStyle(el)))
  const p = el.props
  // Gradient text colour: the text sits in a span painted with the gradient.
  const fill = textGradientStyle(el.style.color)
  const text = fill ? `<span style="${attr(toCssText(fill))}">${esc(p.text)}</span>` : esc(p.text)
  switch (el.type) {
    case 'heading':
      return `<h2 style="${css}">${text}</h2>`
    case 'text':
      return `<p style="${css}">${text}</p>`
    case 'button':
      return `<a ${linkHtml(p)} style="${css}">${text}</a>`
    case 'image':
      return p.src
        ? `<div style="${css}"><img src="${attr(p.src)}" alt="${attr(p.alt)}" style="width:100%;height:100%;object-fit:${attr(p.fit)};display:block"></div>`
        : `<div style="${css}"></div>`
    case 'shape':
      return `<div style="${css}">${shapeSvg(el, `shape-${el.id}`)}${shapeVideoHtml(el)}</div>`
    case 'decor':
      return `<div style="${css}">${decorSvg(el, `decor-${el.id}`)}</div>`
    case 'divider':
      return `<div style="${css}"><div style="${attr(toCssText(dividerLineStyle(el)))}"></div></div>`
    case 'icon': {
      // Icon-only links need a text name for screen readers; the icon's own name is the fallback.
      const name = p.label || ICON_LIBRARY[p.icon]?.label || 'Liên kết'
      return `<a ${linkHtml(p)} aria-label="${attr(name)}" title="${attr(name)}" style="${css}">${iconSvg(p, `icon-${el.id}`)}</a>`
    }
    case 'audio': {
      if (!p.src && !p.always) return `<div style="${css}"></div>`
      const data = Object.entries(audioAttrs(p))
        .map(([k, v]) => (v === '' ? k : `${k}="${attr(v)}"`))
        .join(' ')
      return `<div style="${css}" ${data}></div>`
    }
    case 'video': {
      const src = youtubeEmbed(p.url)
      return src
        ? `<div style="${css}"><iframe src="${attr(src)}" style="width:100%;height:100%;border:0;display:block" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
        : `<div style="${css}"></div>`
    }
    default:
      return `<div style="${css}"></div>`
  }
}

/** Builds a standalone HTML file. The fixed-width page is scaled down to fit narrow screens. */
export function exportHtml(doc) {
  const { page, elements } = doc
  // Only the fonts this page uses.
  const fontsUrl = googleFontsUrl(usedFonts(elements))
  const hasScrollLinks = elements.some((el) => !el.hidden && (el.type === 'button' || el.type === 'icon') && scrollLink(el.props.href))
  const hasAudio = elements.some((el) => !el.hidden && el.type === 'audio' && (el.props.src || el.props.always))
  const moves = hasMotion(elements)
  const body = elements
    .filter((el) => !el.hidden)
    .map((el, i) => {
      const wrap = toCssText({
        position: 'absolute',
        left: el.x,
        top: el.y,
        width: el.w,
        height: el.h,
        zIndex: i + 1,
        // Rotated (and mirrored) around the element's centre (the CSS default), matching the editor.
        transform: elementTransform(el),
        mixBlendMode: blendMode(el),
      })
      // A gradient border is an overlay on top of the element (see gradientBorderStyle).
      const border = gradientBorderStyle(el.style)
      const overlay = border ? `<span aria-hidden="true" style="${attr(toCssText(border))}"></span>` : ''
      // A looping motion runs on a box inside the positioned wrapper (see motion.js).
      const motion = motionStyle(el.motion)
      const content = motion ? `<div class="kt-motion" style="${attr(toCssText(motion))}">${renderInner(el)}${overlay}</div>` : `${renderInner(el)}${overlay}`
      // The id is what in-page links scroll to.
      return `    <div id="${anchorId(el.id)}" style="${wrap}">${content}</div>`
    })
    .join('\n')

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(page.title)}</title>${page.favicon ? `
  <link rel="icon" href="${attr(page.favicon)}">` : ''}
${fontsUrl ? `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="${attr(fontsUrl)}">
` : ''}  <style>
    html, body { margin: 0; background: ${attr(page.background)}; }
    .wrap { position: relative; overflow: hidden; height: ${page.height}px; }
    .page { position: absolute; top: 0; left: 50%; width: ${page.width}px; height: ${page.height}px;
            transform: translateX(-50%); transform-origin: top center; }
    a { text-decoration: none; }${moves ? `
    ${MOTION_CSS.replace(/\n/g, '\n    ')}` : ''}
  </style>
</head>
<body>
  <div class="wrap" id="wrap">
  <div class="page" id="page">
${body}
  </div>
  </div>
  <script>
    (function () {
      var W = ${page.width}, H = ${page.height};
      function fit() {
        var s = Math.min(1, document.documentElement.clientWidth / W);
        document.getElementById('page').style.transform = 'translateX(-50%) scale(' + s + ')';
        document.getElementById('wrap').style.height = H * s + 'px';
      }
      window.addEventListener('resize', fit);
      fit();
    })();
  </script>${hasScrollLinks ? `
  <script>
${SCROLL_SCRIPT}
  </script>` : ''}${hasAudio ? `
  <script>
${AUDIO_SCRIPT.replace(/<\//g, '<\\/')}
  </script>` : ''}
</body>
</html>
`
}

export function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
