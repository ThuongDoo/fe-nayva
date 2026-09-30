import ElementContent from './ElementContent.jsx'
import GradientBorder from './GradientBorder.jsx'
import { blendMode, elementTransform } from '../lib/elements.js'

/** Thumbnails are drawn at this width by default; the card grid uses fixed-width columns to match. */
const THUMB_WIDTH = 280

/**
 * Scaled-down, non-interactive render of a page: its top part at `width` px wide, or the whole page
 * (`full`, for a scrollable preview). `height` overrides the frame height of the cropped version.
 */
export default function DesignThumb({ design, width = THUMB_WIDTH, height, full = false }) {
  const { page, elements } = design
  const scale = width / page.width
  const frame = full ? { width, height: page.height * scale } : height ? { width, height } : undefined
  return (
    <div className="thumb" style={{ background: page.background, ...frame }} aria-hidden="true">
      <div className="thumb-page" style={{ width: page.width, height: page.height, transform: `scale(${scale})` }}>
        {elements.map((el, i) =>
          el.hidden ? null : (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.w,
                height: el.h,
                zIndex: i + 1,
                transform: elementTransform(el),
                mixBlendMode: blendMode(el),
              }}
            >
              {el.type === 'video' ? (
                // Avoid loading a YouTube iframe per card.
                <div style={{ width: '100%', height: '100%', background: el.style.background, borderRadius: el.style.radius }} />
              ) : (
                <ElementContent el={el} mode="thumb" />
              )}
              <GradientBorder el={el} />
            </div>
          ),
        )}
      </div>
    </div>
  )
}
