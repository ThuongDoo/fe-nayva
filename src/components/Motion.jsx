import { MOTION_CSS, motionStyle } from '../lib/motion.js'

/**
 * Plays an element's looping motion (see motion.js) around its content, like the published page does.
 * The keyframes are one deduplicated stylesheet, however many elements move.
 */
export default function Motion({ el, children }) {
  const style = motionStyle(el.motion)
  if (!style) return children
  return (
    <div className="kt-motion" style={style}>
      <style href="kt-motion" precedence="default">
        {MOTION_CSS}
      </style>
      {children}
    </div>
  )
}
