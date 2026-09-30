/**
 * Rotation helpers. An element is the box (x, y, w, h) rotated by `rotation` degrees (clockwise, as in
 * CSS) around its centre; x/y/w/h always describe the unrotated box.
 */

const rad = (deg) => (deg * Math.PI) / 180

/** Wraps an angle into (-180, 180]. */
export function normalizeAngle(deg) {
  const a = ((((deg + 180) % 360) + 360) % 360) - 180
  return a === -180 ? 180 : Math.round(a * 10) / 10
}

/** CSS transform for an element, or undefined when it isn't rotated. */
export const rotationTransform = (el) => (el.rotation ? `rotate(${el.rotation}deg)` : undefined)

/** Axis-aligned bounding box of the rotated element: what it visually covers on the page. */
export function bounds(el) {
  const cx = el.x + el.w / 2
  const cy = el.y + el.h / 2
  const t = rad(el.rotation || 0)
  const hw = (Math.abs(el.w * Math.cos(t)) + Math.abs(el.h * Math.sin(t))) / 2
  const hh = (Math.abs(el.w * Math.sin(t)) + Math.abs(el.h * Math.cos(t))) / 2
  return { left: cx - hw, right: cx + hw, top: cy - hh, bottom: cy + hh, cx, cy }
}

/** A page point in the element's own (unrotated) coordinates, where (0, 0) is its top-left corner. */
export function toLocal(el, x, y) {
  const cx = el.x + el.w / 2
  const cy = el.y + el.h / 2
  const t = rad(-(el.rotation || 0))
  const dx = x - cx
  const dy = y - cy
  return { x: dx * Math.cos(t) - dy * Math.sin(t) + el.w / 2, y: dx * Math.sin(t) + dy * Math.cos(t) + el.h / 2 }
}

/** Whether a page point falls inside the (possibly rotated) element. */
export function containsPoint(el, x, y) {
  const p = toLocal(el, x, y)
  return p.x >= 0 && p.x <= el.w && p.y >= 0 && p.y <= el.h
}

/** A page-space vector expressed along the element's own axes (e.g. a drag distance). */
export function vectorToLocal(el, dx, dy) {
  const t = rad(-(el.rotation || 0))
  return { x: dx * Math.cos(t) - dy * Math.sin(t), y: dx * Math.sin(t) + dy * Math.cos(t) }
}

/** An element-space vector expressed in page coordinates. */
export function vectorToPage(el, dx, dy) {
  const t = rad(el.rotation || 0)
  return { x: dx * Math.cos(t) - dy * Math.sin(t), y: dx * Math.sin(t) + dy * Math.cos(t) }
}
