import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ElementContent from './ElementContent.jsx'
import GradientBorder from './GradientBorder.jsx'
import Motion from './Motion.jsx'
import Icon from './Icon.jsx'
import QuickToolbar from './QuickToolbar.jsx'
import UploadIndicator from './UploadIndicator.jsx'
import { DND_TYPE, GRID, TEXT_TYPES, applyPatch, blendMode, clamp, elementTransform, scrollLink, scrollLinkY } from '../lib/elements.js'
import { bounds, normalizeAngle, rotationTransform, toLocal, vectorToLocal, vectorToPage } from '../lib/geometry.js'
import { imageCenterProps, imageRect, zoomImageAt } from '../lib/shapes.js'
import { useUploads } from '../lib/uploadProgress.js'

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
/** Corner handles on the image frame while repositioning an image inside a shape. */
const IMAGE_CORNERS = ['nw', 'ne', 'se', 'sw']
const MIN_IMAGE_SIZE = 20
const MIN_SIZE = 16
const SNAP_PX = 6
const AUTOSCROLL_EDGE = 60
const AUTOSCROLL_MAX = 10 // px per frame (~600px/s)
const AUTOSCROLL_ACCEL = 0.12
const toGrid = (v) => Math.round(v / GRID) * GRID
const ZOOM_STEP = 1.2
/** With snapping on, rotation clicks to multiples of 45° within this many degrees. */
const ROTATE_SNAP_DEG = 4

/** Screen px between the element and the quick toolbar; above leaves room for the rotate handle. */
const TOOLBAR_GAP_ABOVE = 56
const TOOLBAR_GAP_BELOW = 40
/** Smallest distance between the quick toolbar and the window / workspace edges. */
const TOOLBAR_MARGIN = 8

/**
 * Places the quick toolbar over the element's visual box: centred above it, or below when there is no
 * room above in the workspace. Rendered into <body> with fixed positioning so it floats over the side
 * panels instead of being covered or clipped by them, and kept inside the window horizontally.
 */
function QuickToolbarAnchor({ el, zoom, canvasRef, workspaceRef, ...rest }) {
  const ref = useRef(null)
  const [pos, setPos] = useState(null)

  const place = useEffectEvent(() => {
    const canvas = canvasRef.current
    const bar = ref.current?.firstElementChild
    if (!canvas || !bar) return
    const c = canvas.getBoundingClientRect()
    const area = (workspaceRef.current ?? canvas).getBoundingClientRect()
    const b = bounds(el)
    const w = bar.offsetWidth
    const h = bar.offsetHeight
    const top = c.top + b.top * zoom - TOOLBAR_GAP_ABOVE - h
    const y = top >= area.top + TOOLBAR_MARGIN ? top : c.top + b.bottom * zoom + TOOLBAR_GAP_BELOW
    const next = {
      x: Math.round(clamp(c.left + b.cx * zoom - w / 2, TOOLBAR_MARGIN, window.innerWidth - w - TOOLBAR_MARGIN)),
      // Scrolled far away, it waits at the workspace edge rather than covering the header.
      y: Math.round(clamp(y, area.top + TOOLBAR_MARGIN, area.bottom - h - TOOLBAR_MARGIN)),
    }
    if (!Number.isFinite(next.x) || !Number.isFinite(next.y)) return
    setPos((p) => (p && p.x === next.x && p.y === next.y ? p : next))
  })

  // After every render (the element or zoom may have changed), then on scroll / resize.
  useLayoutEffect(() => place())
  useEffect(() => {
    const ws = workspaceRef.current
    const onChange = () => place()
    const observer = new ResizeObserver(onChange)
    if (ws) observer.observe(ws)
    if (ref.current?.firstElementChild) observer.observe(ref.current.firstElementChild)
    ws?.addEventListener('scroll', onChange, { passive: true })
    window.addEventListener('resize', onChange)
    return () => {
      observer.disconnect()
      ws?.removeEventListener('scroll', onChange)
      window.removeEventListener('resize', onChange)
    }
  }, [workspaceRef])

  return createPortal(
    <div
      ref={ref}
      className="qt-anchor"
      style={pos ? { left: pos.x, top: pos.y } : { left: 0, top: 0, visibility: 'hidden' }}
    >
      <QuickToolbar key={el.id} el={el} {...rest} />
    </div>,
    document.body,
  )
}

/** Where the selected button / icon button scrolls to: a dashed line across the page. */
function ScrollTargetMarker({ el, elements, zoom }) {
  if (el.type !== 'button' && el.type !== 'icon') return null
  const y = scrollLinkY(scrollLink(el.props.href), elements)
  if (y === null) return null
  return (
    <div className="scroll-line" style={{ top: y }}>
      <span className="scroll-line-label" style={{ transform: `scale(${1 / zoom})` }}>
        Nút này cuộn tới đây · cách đỉnh {y}px
      </span>
    </div>
  )
}

/**
 * How far the image inside a shape reaches below the shape (px, 0 if it doesn't), so the
 * repositioning bar can sit under the image frame instead of covering its corner handles.
 */
function imageOverhang(el) {
  const r = imageRect(el.w, el.h, el.props)
  if (!r) return 0
  const bottom = el.flipY ? el.h - r.y : r.y + r.h
  return Math.max(0, bottom - el.h)
}

/** Closest target line to any of the given edges, within threshold. */
function findSnap(edges, targets, threshold) {
  let best = null
  for (const t of targets) {
    for (const e of edges) {
      const d = t - e
      if (Math.abs(d) <= threshold && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, line: t }
    }
  }
  return best
}

function blurActive() {
  const a = document.activeElement
  if (a && a !== document.body) a.blur()
}

export default function Canvas({
  doc,
  zoom,
  selectedId,
  editingId,
  showGrid,
  snap,
  workspaceRef,
  canvasRef,
  set,
  checkpoint,
  onSelect,
  onEdit,
  onCommitText,
  onDropElement,
  onDropFiles,
  onUpdate,
  onAction,
  pickingScroll = false,
  onPickScroll,
}) {
  const [guides, setGuides] = useState([])
  const [dropActive, setDropActive] = useState(false)
  // True while dragging, resizing or rotating: the quick toolbar steps out of the way.
  const [gesturing, setGesturing] = useState(false)
  const { page, elements } = doc
  const selected = elements.find((el) => el.id === selectedId && !el.hidden)
  // Pointer position while picking a scroll target ({ y, snapped }), null when off the page.
  const [pickY, setPickY] = useState(null)

  /** Page y under the pointer, snapped to the top edge of an element nearby when snapping is on. */
  const pickPoint = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const y = clamp((e.clientY - r.top) / zoom, 0, page.height)
    if (snap) {
      const edges = elements.filter((el) => !el.hidden && el.id !== selectedId).map((el) => bounds(el).top)
      const near = findSnap([y], edges, SNAP_PX / zoom)
      if (near) return { y: Math.round(near.line), snapped: true }
    }
    return { y: Math.round(y), snapped: false }
  }

  const setGeom = (id, geom) =>
    set((d) => ({ ...d, elements: d.elements.map((el) => (el.id === id ? { ...el, ...geom } : el)) }), {
      transient: true,
    })

  const setPropsLive = (id, props) =>
    set((d) => ({ ...d, elements: d.elements.map((el) => (el.id === id ? applyPatch(el, { props }) : el)) }), {
      transient: true,
    })

  const cropping = elements.find((el) => el.id === editingId && el.type === 'shape')
  const uploads = useUploads()

  /** Zooms a shape's image, keeping the point (px, py) in element coordinates fixed. One undo step per burst. */
  const zoomImage = (el, zoomTo, px, py) =>
    set(
      (d) => ({
        ...d,
        elements: d.elements.map((e) =>
          e.id === el.id ? applyPatch(e, { props: zoomImageAt(e.w, e.h, e.props, zoomTo(e.props.imgZoom), px, py) }) : e,
        ),
      }),
      { merge: `${el.id}:imgZoom` },
    )

  // Mouse wheel over the shape being cropped (or its image) zooms the image around the pointer. Registered
  // natively because React's wheel listener is passive and can't stop the page from scrolling; on the
  // canvas' parent so the image frame in the overlay is covered too.
  const onWheel = useEffectEvent((e) => {
    if (!cropping?.props.imgW) return
    const r = canvasRef.current.getBoundingClientRect()
    const local = toLocal(cropping, (e.clientX - r.left) / zoom, (e.clientY - r.top) / zoom)
    // A mirrored shape shows its content mirrored: find the point in the content's own coordinates.
    const px = cropping.flipX ? cropping.w - local.x : local.x
    const py = cropping.flipY ? cropping.h - local.y : local.y
    // Over the shape, or over the part of its image that lies outside it.
    const img = imageRect(cropping.w, cropping.h, cropping.props)
    const inside = (x, y, w, h) => px >= x && py >= y && px <= x + w && py <= y + h
    if (!inside(0, 0, cropping.w, cropping.h) && !inside(img.x, img.y, img.w, img.h)) return
    e.preventDefault()
    const factor = Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0015))
    zoomImage(cropping, (z) => z * factor, px, py)
  })

  useEffect(() => {
    const node = canvasRef.current.parentElement
    const handler = (e) => onWheel(e)
    node.addEventListener('wheel', handler, { passive: false })
    return () => node.removeEventListener('wheel', handler)
  }, [canvasRef])

  // Tracks a pointer gesture in canvas units. History is checkpointed once the pointer actually moves,
  // so a plain click doesn't create an undo step.
  const track = (e, onMove, onEnd) => {
    const sx = e.clientX
    const sy = e.clientY
    let started = false
    const move = (ev) => {
      if (!started) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 3) return
        started = true
        checkpoint()
        setGesturing(true)
      }
      onMove((ev.clientX - sx) / zoom, (ev.clientY - sy) / zoom, ev)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      if (started) setGesturing(false)
      onEnd?.()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const startMove = (e, el) => {
    if (e.button !== 0) return
    e.stopPropagation()
    if (editingId === el.id && el.type !== 'shape') return
    blurActive()
    onSelect(el.id)
    if (el.locked) return
    if (el.type === 'shape' && editingId === el.id) return startPan(e, el)
    e.preventDefault()

    // Guides use what elements visually cover, so rotated ones snap by their outer edges.
    const others = elements.filter((o) => o.id !== el.id && !o.hidden).map(bounds)
    const tx = [0, page.width / 2, page.width, ...others.flatMap((b) => [b.left, b.cx, b.right])]
    const ty = [0, page.height / 2, page.height, ...others.flatMap((b) => [b.top, b.cy, b.bottom])]
    // The moving element's visual edges, as offsets from its x/y (constant while dragging).
    const own = bounds(el)
    const ex = [own.left - el.x, own.cx - el.x, own.right - el.x]
    const ey = [own.top - el.y, own.cy - el.y, own.bottom - el.y]

    track(
      e,
      (dx, dy, ev) => {
        let x = el.x + dx
        let y = el.y + dy
        const g = []
        const free = ev.altKey
        const sx = snap && !free && findSnap(ex.map((o) => x + o), tx, SNAP_PX / zoom)
        const sy = snap && !free && findSnap(ey.map((o) => y + o), ty, SNAP_PX / zoom)
        if (sx) {
          x += sx.d
          g.push({ axis: 'x', pos: sx.line })
        } else if (showGrid && !free) x = toGrid(x)
        if (sy) {
          y += sy.d
          g.push({ axis: 'y', pos: sy.line })
        } else if (showGrid && !free) y = toGrid(y)
        setGuides(g)
        setGeom(el.id, { x: Math.round(x), y: Math.round(y) })
      },
      () => setGuides([]),
    )
  }

  /**
   * Resizes the image inside a shape by dragging a corner of its frame, keeping the opposite corner
   * where it is (in repositioning mode). Free by default (width and height change independently);
   * Shift keeps the image's proportions. Works on a rotated or mirrored shape too.
   */
  const startImageResize = (e, el, corner) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    const p0 = el.props
    const r = imageRect(el.w, el.h, p0)
    if (!r) return
    const east = corner.includes('e')
    const south = corner.includes('s')
    // The corner that stays put, in the shape's own (unrotated, unmirrored) coordinates.
    const ax = east ? r.x : r.x + r.w
    const ay = south ? r.y : r.y + r.h
    track(e, (pdx, pdy, ev) => {
      const local = vectorToLocal(el, pdx, pdy)
      const dx = (el.flipX ? -local.x : local.x) * (east ? 1 : -1)
      const dy = (el.flipY ? -local.y : local.y) * (south ? 1 : -1)
      if (ev.shiftKey) {
        // Growth along the dragged diagonal; the image keeps its proportions.
        const k = Math.max(0.05, ((r.w + dx) / r.w + (r.h + dy) / r.h) / 2)
        setPropsLive(el.id, zoomImageAt(el.w, el.h, p0, p0.imgZoom * k, ax, ay))
        return
      }
      const w = Math.max(MIN_IMAGE_SIZE, r.w + dx)
      const h = Math.max(MIN_IMAGE_SIZE, r.h + dy)
      setPropsLive(el.id, {
        imgStretchX: Math.round((p0.imgStretchX || 1) * (w / r.w) * 1000) / 1000,
        imgStretchY: Math.round((p0.imgStretchY || 1) * (h / r.h) * 1000) / 1000,
        ...imageCenterProps(el.w, el.h, east ? r.x : r.x + r.w - w, south ? r.y : r.y + r.h - h, w, h),
      })
    })
  }

  // Drags the image inside a shape along the shape's own axes (see imageCenterProps).
  const startPan = (e, el) => {
    e.preventDefault()
    const r = imageRect(el.w, el.h, el.props)
    if (!r) return
    // No bounds: the image can be dragged partly or entirely outside the shape.
    track(e, (pdx, pdy) => {
      // The image moves along the shape's own axes, which differ from the page's once it is rotated.
      const local = vectorToLocal(el, pdx, pdy)
      // Dragging right on a mirrored shape moves its content left in its own coordinates.
      const dx = el.flipX ? -local.x : local.x
      const dy = el.flipY ? -local.y : local.y
      setPropsLive(el.id, imageCenterProps(el.w, el.h, r.x + dx, r.y + dy, r.w, r.h))
    })
  }

  const startResize = (e, el, handle) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    const ratio = el.w / el.h
    const hasN = handle.includes('n')
    const hasS = handle.includes('s')
    const hasE = handle.includes('e')
    const hasW = handle.includes('w')

    if (el.rotation) return resizeRotated(e, el, { ratio, hasN, hasS, hasE, hasW, corner: handle.length === 2 })

    track(e, (dx, dy, ev) => {
      const grid = showGrid && !ev.altKey
      let left = el.x
      let top = el.y
      let right = el.x + el.w
      let bottom = el.y + el.h
      if (hasE) right = grid ? toGrid(right + dx) : right + dx
      if (hasW) left = grid ? toGrid(left + dx) : left + dx
      if (hasS) bottom = grid ? toGrid(bottom + dy) : bottom + dy
      if (hasN) top = grid ? toGrid(top + dy) : top + dy
      if (right - left < MIN_SIZE) {
        if (hasW) left = right - MIN_SIZE
        else right = left + MIN_SIZE
      }
      if (bottom - top < MIN_SIZE) {
        if (hasN) top = bottom - MIN_SIZE
        else bottom = top + MIN_SIZE
      }

      let w = right - left
      let h = bottom - top
      if (ev.shiftKey && handle.length === 2) {
        if (w / h > ratio) h = w / ratio
        else w = h * ratio
        if (hasW) left = right - w
        if (hasN) top = bottom - h
      }
      setGeom(el.id, { x: Math.round(left), y: Math.round(top), w: Math.round(w), h: Math.round(h) })
    })
  }

  /**
   * Resizing a rotated element: the drag is measured along the element's own axes and the opposite
   * edge/corner stays where it is on the page, so the centre moves with the resize. No grid snapping,
   * since grid lines don't line up with a rotated box.
   */
  const resizeRotated = (e, el, { ratio, hasN, hasS, hasE, hasW, corner }) => {
    const cx = el.x + el.w / 2
    const cy = el.y + el.h / 2
    track(e, (pdx, pdy, ev) => {
      const { x: dx, y: dy } = vectorToLocal(el, pdx, pdy)
      // Edges relative to the original centre, in the element's frame.
      let left = -el.w / 2
      let right = el.w / 2
      let top = -el.h / 2
      let bottom = el.h / 2
      if (hasE) right += dx
      if (hasW) left += dx
      if (hasS) bottom += dy
      if (hasN) top += dy
      if (right - left < MIN_SIZE) {
        if (hasW) left = right - MIN_SIZE
        else right = left + MIN_SIZE
      }
      if (bottom - top < MIN_SIZE) {
        if (hasN) top = bottom - MIN_SIZE
        else bottom = top + MIN_SIZE
      }
      let w = right - left
      let h = bottom - top
      if (ev.shiftKey && corner) {
        if (w / h > ratio) h = w / ratio
        else w = h * ratio
        if (hasW) left = right - w
        else right = left + w
        if (hasN) top = bottom - h
        else bottom = top + h
      }
      const c = vectorToPage(el, (left + right) / 2, (top + bottom) / 2)
      setGeom(el.id, {
        x: Math.round(cx + c.x - w / 2),
        y: Math.round(cy + c.y - h / 2),
        w: Math.round(w),
        h: Math.round(h),
      })
    })
  }

  /** Rotates around the element's centre. Shift steps by 15°; with snapping on, it clicks to every 45°. */
  const startRotate = (e, el) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    const r = canvasRef.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / zoom
    const py = (e.clientY - r.top) / zoom
    const cx = el.x + el.w / 2
    const cy = el.y + el.h / 2
    const angleAt = (x, y) => (Math.atan2(y - cy, x - cx) * 180) / Math.PI
    const start = angleAt(px, py)
    const base = el.rotation || 0

    track(e, (dx, dy, ev) => {
      let angle = base + angleAt(px + dx, py + dy) - start
      if (ev.shiftKey) angle = Math.round(angle / 15) * 15
      else if (snap && !ev.altKey) {
        const nearest = Math.round(angle / 45) * 45
        if (Math.abs(angle - nearest) < ROTATE_SNAP_DEG) angle = nearest
      }
      setGeom(el.id, { rotation: normalizeAngle(Math.round(angle)) })
    })
  }

  const startPageResize = (e) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    const ws = workspaceRef.current
    const h0 = page.height
    const sy = e.clientY
    const scroll0 = ws.scrollTop
    let pointerY = e.clientY
    let started = false
    let raf = 0

    // Runs every frame: holding the pointer near the workspace's top/bottom edge auto-scrolls it,
    // and the scrolled distance counts toward the drag, so the page can grow past the visible area.
    const tick = () => {
      const r = ws.getBoundingClientRect()
      const below = pointerY - (r.bottom - AUTOSCROLL_EDGE)
      const above = r.top + AUTOSCROLL_EDGE - pointerY
      if (below > 0) ws.scrollTop += Math.min(AUTOSCROLL_MAX, 1 + below * AUTOSCROLL_ACCEL)
      else if (above > 0) ws.scrollTop -= Math.min(AUTOSCROLL_MAX, 1 + above * AUTOSCROLL_ACCEL)

      const dy = pointerY - sy + ws.scrollTop - scroll0
      if (!started && Math.abs(dy) >= 3) {
        started = true
        checkpoint()
      }
      if (started) {
        const height = Math.max(300, toGrid(h0 + dy / zoom))
        set((d) => (d.page.height === height ? d : { ...d, page: { ...d.page, height } }), { transient: true })
      }
      raf = requestAnimationFrame(tick)
    }
    const move = (ev) => {
      pointerY = ev.clientY
    }
    const up = () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    raf = requestAnimationFrame(tick)
  }

  const deselect = (e) => {
    if (e.target !== e.currentTarget) return
    blurActive()
    onSelect(null)
  }

  const acceptsDrag = (e) => e.dataTransfer.types.includes(DND_TYPE) || e.dataTransfer.types.includes('Files')

  const onDrop = (e) => {
    setDropActive(false)
    if (!acceptsDrag(e)) return
    e.preventDefault()
    const r = canvasRef.current.getBoundingClientRect()
    const pos = { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom }
    const type = e.dataTransfer.getData(DND_TYPE)
    if (type) onDropElement(type, pos)
    else if (e.dataTransfer.files.length) onDropFiles([...e.dataTransfer.files], pos)
  }

  return (
    <div className="workspace" ref={workspaceRef} onPointerDown={deselect}>
      <div
        className={`canvas-frame${dropActive ? ' drop-active' : ''}`}
        style={{ width: page.width * zoom, height: page.height * zoom, '--z': zoom }}
        onDragOver={(e) => {
          if (!acceptsDrag(e)) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
          if (!dropActive) setDropActive(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDropActive(false)
        }}
        onDrop={onDrop}
      >
        <div
          ref={canvasRef}
          className={`canvas${showGrid ? ' show-grid' : ''}`}
          style={{ width: page.width, height: page.height, background: page.background, transform: `scale(${zoom})` }}
          onPointerDown={deselect}
        >
          {elements.map((el, i) =>
            el.hidden ? null : (
              <div
                key={el.id}
                className={`el${el.locked ? ' locked' : ''}${editingId === el.id ? (el.type === 'shape' ? ' cropping' : ' editing') : ''}`}
                style={{ left: el.x, top: el.y, width: el.w, height: el.h, zIndex: i + 1, transform: elementTransform(el), mixBlendMode: blendMode(el) }}
                onPointerDown={(e) => startMove(e, el)}
                onDoubleClick={() => {
                  if (el.locked) return
                  if (TEXT_TYPES.includes(el.type) || (el.type === 'shape' && el.props.src)) onEdit(el.id)
                }}
              >
                <Motion el={el}>
                  <ElementContent
                    el={el}
                    mode="editor"
                    editing={editingId === el.id}
                    onCommitText={(text) => onCommitText(el.id, text)}
                  />
                  <GradientBorder el={el} />
                </Motion>
              </div>
            ),
          )}
          {elements.length === 0 && (
            <div className="canvas-empty">
              <strong>Trang đang trống</strong>
              <span>Kéo thành phần từ cột bên trái vào đây để bắt đầu</span>
            </div>
          )}
        </div>

        {/* Overlay sits outside the clipped canvas so handles stay visible at the page edges. */}
        <div className="canvas-overlay" style={{ width: page.width, height: page.height, transform: `scale(${zoom})` }}>
          {cropping?.props.imgW > 0 && (
            // The whole image frame, with corner handles to scale it (mirrors the shape's rotation/flip).
            <div
              className="crop-frame-box"
              style={{ left: cropping.x, top: cropping.y, width: cropping.w, height: cropping.h, transform: elementTransform(cropping) }}
            >
              {(() => {
                const r = imageRect(cropping.w, cropping.h, cropping.props)
                return (
                  // The frame itself can be grabbed too, so an image moved off the shape can still be dragged back.
                  <div
                    className="crop-frame"
                    style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
                    onPointerDown={(e) => {
                      if (e.button !== 0) return
                      e.stopPropagation()
                      startPan(e, cropping)
                    }}
                  >
                    {IMAGE_CORNERS.map((c) => (
                      <span
                        key={c}
                        className={`handle handle-${c}`}
                        title="Kéo để co giãn ảnh (giữ Shift để giữ tỉ lệ)"
                        onPointerDown={(e) => startImageResize(e, cropping, c)}
                      />
                    ))}
                  </div>
                )
              })()}
            </div>
          )}
          {uploads.map((u) => {
            // On the element receiving the file, or a placeholder box where a dropped image will appear.
            const el = u.elementId && elements.find((e) => e.id === u.elementId && !e.hidden)
            const box = el
              ? { left: el.x, top: el.y, width: el.w, height: el.h, transform: rotationTransform(el) }
              : u.rect && { left: u.rect.x, top: u.rect.y, width: u.rect.w, height: u.rect.h }
            if (!box) return null
            return (
              <div key={u.id} className={`upload-overlay${el ? '' : ' placeholder-box'}`} style={box}>
                <UploadIndicator progress={u.progress} label={u.label} />
              </div>
            )
          })}
          {guides.map((g, i) => (
            <div
              key={i}
              className={`guide guide-${g.axis}`}
              style={g.axis === 'x' ? { left: g.pos } : { top: g.pos }}
            />
          ))}
          {pickingScroll && (
            // Picking the point a button scrolls to: a line follows the pointer, a click sets it.
            <div
              className="scroll-pick"
              style={{ width: page.width, height: page.height }}
              onPointerMove={(e) => setPickY(pickPoint(e))}
              onPointerLeave={() => setPickY(null)}
              onPointerDown={(e) => {
                if (e.button !== 0) return
                e.preventDefault()
                e.stopPropagation()
                setPickY(null)
                onPickScroll(pickPoint(e).y)
              }}
            >
              {pickY && (
                <div className={`scroll-line picking${pickY.snapped ? ' snapped' : ''}`} style={{ top: pickY.y }}>
                  <span className="scroll-line-label" style={{ transform: `scale(${1 / zoom})` }}>
                    Cuộn tới đây · cách đỉnh {pickY.y}px{pickY.snapped ? ' (bám mép phần tử)' : ''} · Esc để huỷ
                  </span>
                </div>
              )}
            </div>
          )}
          {selected && !pickingScroll && !gesturing && <ScrollTargetMarker el={selected} elements={elements} zoom={zoom} />}
          {selected && !gesturing && !pickingScroll && cropping?.id !== selected.id && (
            <QuickToolbarAnchor
              el={selected}
              zoom={zoom}
              canvasRef={canvasRef}
              workspaceRef={workspaceRef}
              setStyle={(patch, key) => onUpdate(selected.id, { style: patch }, key && `style.${key}`)}
              setProps={(patch, key) => onUpdate(selected.id, { props: patch }, key && `props.${key}`)}
              setEl={(patch, key) => onUpdate(selected.id, patch, key)}
              onAction={onAction}
            />
          )}
          {selected && (
            <div
              className={`selection${selected.locked ? ' locked' : ''}`}
              style={{
                left: selected.x,
                top: selected.y,
                width: selected.w,
                height: selected.h,
                transform: rotationTransform(selected),
              }}
            >
              {!selected.locked &&
                editingId !== selected.id &&
                HANDLES.map((h) => (
                  <span key={h} className={`handle handle-${h}`} onPointerDown={(e) => startResize(e, selected, h)} />
                ))}
              {!selected.locked && editingId !== selected.id && (
                <span
                  className="rotate-handle"
                  title="Kéo để xoay (Shift: bước 15°)"
                  onPointerDown={(e) => startRotate(e, selected)}
                  onDoubleClick={() => set((d) => ({ ...d, elements: d.elements.map((x) => (x.id === selected.id ? { ...x, rotation: 0 } : x)) }))}
                >
                  <Icon name="rotate" size={12} />
                </span>
              )}
              {cropping?.id === selected.id ? (
                <div className="crop-bar" style={{ top: `calc(100% + ${imageOverhang(selected)}px)` }} onPointerDown={(e) => e.stopPropagation()}>
                  <button type="button" title="Thu nhỏ ảnh" onClick={() => zoomImage(selected, (z) => z / ZOOM_STEP)}>
                    <Icon name="minus" size={14} />
                  </button>
                  <span>{Math.round(selected.props.imgZoom * 100)}%</span>
                  <button type="button" title="Phóng to ảnh" onClick={() => zoomImage(selected, (z) => z * ZOOM_STEP)}>
                    <Icon name="plus" size={14} />
                  </button>
                  <span className="crop-hint">Kéo để dời · kéo góc để co giãn (Shift: giữ tỉ lệ)</span>
                  <button type="button" className="crop-done" onClick={() => onEdit(null)}>
                    Xong
                  </button>
                </div>
              ) : (
                <span className="size-badge">
                  {selected.locked ? 'Đã khoá · ' : ''}
                  {selected.w} × {selected.h}
                  {selected.rotation ? ` · ${selected.rotation}°` : ''}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="page-height-handle"
          title="Kéo để thay đổi chiều cao trang"
          onPointerDown={startPageResize}
        >
          Chiều cao trang: {page.height}px · kéo để đổi
        </button>
      </div>
    </div>
  )
}
