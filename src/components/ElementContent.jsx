import { Fragment, useEffect, useEffectEvent, useId, useMemo, useRef, useState } from 'react'
import { contentStyle, dividerLineStyle, linkAttrs, youtubeEmbed } from '../lib/elements.js'
import { isVideo, shapeClipPath, shapeSvg, videoBoxStyle } from '../lib/shapes.js'
import { audioAttrs, mountAudio } from '../lib/audioViz.js'
import { ICON_LIBRARY, iconSvg } from '../lib/iconLibrary.js'
import { decorSvg } from '../lib/decor.js'
import { PARALLAX_IMG_STYLE, pinParallax } from '../lib/parallax.js'
import { loadFonts } from '../lib/fonts.js'
import { textGradientStyle } from '../lib/gradient.js'
import { textSegments, tidyMarks } from '../lib/richText.js'
import { readEditable, selectionOffsets } from '../lib/editableText.js'
import { useMissingImage } from '../lib/useMissingImage.js'

/** Shown in the editor where an image used to be but can no longer be loaded. */
function MissingImage({ style, overlay = false, what = 'Ảnh' }) {
  return (
    <div style={style} className={`placeholder missing${overlay ? ' overlay' : ''}`}>
      <span>{what} không còn tồn tại</span>
      <small>Chọn {what.toLowerCase()} khác ở bảng bên phải</small>
    </div>
  )
}

/**
 * The video filling a shape: muted, looping, cut to the shape's outline. `ghost` (while repositioning)
 * also shows the whole frame faintly; `still` (thumbnails) doesn't play it.
 */
function ShapeVideo({ el, ghost, still, onError }) {
  const p = el.props
  const box = { position: 'absolute', display: 'block', ...videoBoxStyle(el.w, el.h, p) }
  // React doesn't render the muted attribute, which browsers need before they allow autoplay.
  const mute = (node) => {
    if (node) node.muted = true
  }
  const common = { src: p.src, loop: true, playsInline: true, muted: true, autoPlay: !still, preload: still ? 'metadata' : 'auto', ref: mute }
  return (
    <>
      {ghost && <video {...common} aria-hidden="true" style={{ ...box, opacity: 0.3, pointerEvents: 'none' }} />}
      <div style={{ position: 'absolute', inset: 0, clipPath: shapeClipPath(el), pointerEvents: 'none' }}>
        <video {...common} aria-label={p.alt || undefined} onError={onError} style={box} />
      </div>
    </>
  )
}

function Shape({ el, style, ghost, isEditor, still }) {
  // useId keeps SVG ids unique when the same element renders in both the editor and preview.
  const id = 'shape' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const html = useMemo(() => shapeSvg(el, id, { ghost }), [el, id, ghost])
  const video = isVideo(el.props) && !!el.props.src
  const missingImage = useMissingImage(video ? null : el.props.src)
  // Tagged with the src that failed, so a new video starts out fine.
  const [failedVideo, setFailedVideo] = useState(null)
  const missingVideo = video && failedVideo === el.props.src
  return (
    <div style={{ ...style, position: 'relative' }}>
      <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: html }} />
      {video && !missingVideo && <ShapeVideo el={el} ghost={ghost} still={still} onError={() => setFailedVideo(el.props.src)} />}
      {isEditor && missingImage && <MissingImage overlay />}
      {isEditor && missingVideo && <MissingImage overlay what="Video" />}
    </div>
  )
}

/**
 * Audio player with a visualizer; mountAudio (shared with published pages) builds its insides. Remounted
 * (via its key) whenever a setting changes. Never autoplays in the editor.
 */
function AudioBlock({ p, css, isEditor }) {
  const ref = useRef(null)
  useEffect(() => mountAudio(ref.current), [])
  return <div ref={ref} style={css} {...audioAttrs(p, { autoplay: !isEditor })} />
}

function IconBlock({ p, css, isEditor }) {
  // Unique per rendered icon, since a gradient colour is an SVG definition referenced by id.
  const id = 'icon' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const svg = { __html: iconSvg(p, id) }
  if (isEditor) return <div style={css} dangerouslySetInnerHTML={svg} />
  const name = p.label || ICON_LIBRARY[p.icon]?.label || 'Liên kết'
  return (
    <a
      {...linkAttrs(p)}
      aria-label={name}
      title={name}
      style={{ ...css, cursor: 'pointer' }}
      dangerouslySetInnerHTML={svg}
    />
  )
}

/** A decoration (ink blot, brush stroke…), redrawn when its settings or size change. */
function DecorBlock({ el, css }) {
  // Unique per rendered decoration: gradient and clip ids live in the page's shared id space.
  const id = 'decor' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const { props, w, h } = el
  const html = useMemo(() => decorSvg({ props }, id, { w, h }), [props, w, h, id])
  return <div style={css} dangerouslySetInnerHTML={{ __html: html }} />
}

function ImageBlock({ p, css, isEditor }) {
  const missing = useMissingImage(p.src)
  if (missing) return isEditor ? <MissingImage style={css} /> : <div style={css} />
  return (
    <div style={css}>
      <img
        src={p.src}
        alt={p.alt}
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: p.fit, display: 'block' }}
      />
    </div>
  )
}

/**
 * Scroll-linked image (see parallax.js). The editor and thumbnails show it filling the frame; the
 * preview pins it to the screen as its scroller moves, like the published page does with the window.
 */
function ParallaxBlock({ p, css, isEditor }) {
  const frameRef = useRef(null)
  const imgRef = useRef(null)
  const missing = useMissingImage(p.src)
  useEffect(() => {
    if (isEditor || missing) return
    let frame = 0
    const update = () => {
      frame = 0
      if (frameRef.current && imgRef.current) pinParallax(frameRef.current, imgRef.current, window.innerHeight)
    }
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    // Capturing catches the preview's own scroller, not just the window.
    document.addEventListener('scroll', queue, { capture: true, passive: true })
    window.addEventListener('resize', queue)
    update()
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('scroll', queue, { capture: true })
      window.removeEventListener('resize', queue)
    }
  }, [isEditor, missing])

  if (!p.src) {
    return isEditor ? (
      <div style={css} className="placeholder">
        <span>Ảnh cuộn</span>
        <small>Chọn ảnh ở bảng bên phải</small>
      </div>
    ) : (
      <div style={css} />
    )
  }
  if (missing) return isEditor ? <MissingImage style={css} /> : <div style={css} />
  return (
    <div ref={frameRef} style={css}>
      <img
        ref={imgRef}
        src={p.src}
        alt={p.alt}
        draggable={false}
        style={PARALLAX_IMG_STYLE}
      />
    </div>
  )
}

const HIGHLIGHT = 'rgba(99, 102, 241, 0.28)'

/**
 * Text cut into its coloured stretches (richText.js). Stretches without their own colour are painted
 * with the gradient `fill` (textGradientStyle) when there is one. `highlight` ({ start, end }) shows a
 * stretch as selected, for the words whose colour the toolbar is changing.
 */
function RichText({ text, marks, fill, highlight }) {
  const segments = textSegments(text, marks, highlight)
  // One plain stretch renders as it always has: the text, or one span painted with the gradient.
  if (isPlain(segments)) return fill ? <span style={fill}>{text}</span> : text
  // Several stretches share one wrapper: the text box is a flex column (for vertical alignment), where
  // every child would get a line of its own.
  return (
    <span>
      {segments.map((s, i) => {
        if (s.highlight) return <span key={i} style={{ color: s.color ?? undefined, background: HIGHLIGHT }}>{s.text}</span>
        const style = s.color ? { color: s.color } : fill
        return style ? <span key={i} style={style}>{s.text}</span> : <Fragment key={i}>{s.text}</Fragment>
      })}
    </span>
  )
}

const isPlain = (segments) => segments.length <= 1 && !segments[0]?.color && !segments[0]?.highlight

function TextBlock({ text, marks, style, fill, editing, onCommit, onSelectText, highlight }) {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!editing || !node) return
    node.focus()
    const range = document.createRange()
    range.selectNodeContents(node)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
  }, [editing])

  // While editing, tell the editor which words are selected, so the toolbar can colour just those.
  const reportSelection = useEffectEvent(() => {
    if (!ref.current) return
    const range = selectionOffsets(ref.current)
    if (range !== undefined) onSelectText?.(range)
  })
  useEffect(() => {
    if (!editing) return
    const onChange = () => reportSelection()
    document.addEventListener('selectionchange', onChange)
    return () => document.removeEventListener('selectionchange', onChange)
  }, [editing])

  if (!editing) {
    return (
      <div key="view" style={style}>
        <RichText text={text} marks={marks} fill={fill} highlight={highlight} />
      </div>
    )
  }

  const commit = (node) => {
    const read = readEditable(node)
    const text = read.text.replace(/\n$/, '')
    onCommit?.({ text, marks: tidyMarks(read.marks, text.length) })
  }

  // Separate key so React mounts a fresh node: the browser owns its contents while editing. Coloured
  // stretches start as spans carrying their colour, which readEditable reads back.
  return (
    <div
      key="edit"
      ref={ref}
      className="text-editing"
      style={style}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(e) => commit(e.currentTarget)}
      onPaste={(e) => {
        // Pasted text keeps its words but not the colours and fonts of wherever it came from.
        e.preventDefault()
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
      }}
      onKeyDown={(e) => {
        e.stopPropagation()
        // Ctrl+S finishes the edit; autosave then picks up the committed text.
        const mod = e.ctrlKey || e.metaKey
        if (e.key === 'Escape' || (mod && (e.key === 'Enter' || e.key.toLowerCase() === 's'))) {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <EditableSegments text={text} marks={marks} />
    </div>
  )
}

/** Starting contents of the editable box: like RichText, one wrapper around coloured stretches. */
function EditableSegments({ text, marks }) {
  const segments = textSegments(text, marks)
  if (isPlain(segments)) return text
  return (
    <span>
      {segments.map((s, i) =>
        s.color ? (
          <span key={i} data-color={s.color} style={{ color: s.color }}>
            {s.text}
          </span>
        ) : (
          <Fragment key={i}>{s.text}</Fragment>
        ),
      )}
    </span>
  )
}

/**
 * Renders an element's content. `mode` is 'editor' (inert, editable) or 'preview' (live links, video).
 * Text elements report their selected words while editing (onSelectText) and can show a stretch as
 * selected afterwards (textHighlight).
 */
export default function ElementContent({ el, mode, editing = false, onCommitText, onSelectText, textHighlight }) {
  const css = contentStyle(el)
  const p = el.props
  const textFill = textGradientStyle(el.style.color)
  // 'thumb' (home screen previews) behaves like the editor but keeps videos still.
  const isEditor = mode !== 'preview'
  const still = mode === 'thumb'
  // Fonts are fetched on demand: the first element using one adds its stylesheet.
  const font = el.style.fontFamily
  useEffect(() => {
    if (font) loadFonts([font])
  }, [font])
  const textProps = {
    text: p.text,
    marks: p.marks,
    style: css,
    fill: textFill,
    editing,
    onCommit: onCommitText,
    onSelectText,
    highlight: isEditor && !editing ? textHighlight : null,
  }

  switch (el.type) {
    case 'heading':
    case 'text':
      return <TextBlock {...textProps} />

    case 'button':
      if (isEditor) return <TextBlock {...textProps} />
      return (
        <a
          {...linkAttrs(p)}
          style={{ ...css, cursor: 'pointer' }}
        >
          <RichText text={p.text} marks={p.marks} fill={textFill} />
        </a>
      )

    case 'image':
      if (!p.src) {
        return isEditor ? (
          <div style={css} className="placeholder">
            <span>Chưa có ảnh</span>
            <small>Chọn ảnh ở bảng bên phải</small>
          </div>
        ) : (
          <div style={css} />
        )
      }
      return <ImageBlock p={p} css={css} isEditor={isEditor} />

    case 'parallax':
      return <ParallaxBlock p={p} css={css} isEditor={isEditor} />

    case 'shape':
      return <Shape el={el} style={css} ghost={editing} isEditor={isEditor} still={still} />

    case 'divider':
      return (
        <div style={css}>
          <div style={dividerLineStyle(el)} />
        </div>
      )

    case 'icon':
      return <IconBlock p={p} css={css} isEditor={isEditor} />

    case 'decor':
      return <DecorBlock el={el} css={css} />

    case 'audio':
      if (!p.src && !p.always) {
        return isEditor ? (
          <div style={css} className="placeholder">
            <span>Âm thanh</span>
            <small>Tải tệp âm thanh ở bảng bên phải</small>
          </div>
        ) : (
          <div style={css} />
        )
      }
      // Keyed by the settings so a change remounts it: mountAudio owns the node's children.
      return (
        <AudioBlock
          key={[p.src, p.viz, p.color, p.color2, p.bars, p.loop, p.autoplay, p.always, p.inner].join('|')}
          p={p}
          css={css}
          isEditor={isEditor}
        />
      )

    case 'video': {
      const src = youtubeEmbed(p.url)
      if (!src) {
        return (
          <div style={css} className={isEditor ? 'placeholder dark' : undefined}>
            {isEditor && (
              <>
                <span>Video YouTube</span>
                <small>Dán đường dẫn ở bảng bên phải</small>
              </>
            )}
          </div>
        )
      }
      return (
        <div style={css}>
          <iframe
            src={src}
            title="YouTube video"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 0, display: 'block', pointerEvents: isEditor ? 'none' : 'auto' }}
          />
        </div>
      )
    }

    default:
      return <div style={css} />
  }
}
