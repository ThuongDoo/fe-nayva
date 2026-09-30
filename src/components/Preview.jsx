import { useEffect, useRef, useState } from 'react'
import ElementContent from './ElementContent.jsx'
import GradientBorder from './GradientBorder.jsx'
import Motion from './Motion.jsx'
import Icon from './Icon.jsx'
import { anchorId, blendMode, elementTransform, scrollLink } from '../lib/elements.js'

export default function Preview({ doc, onClose, onOpenTab }) {
  const { page, elements } = doc
  const scrollRef = useRef(null)
  const [viewWidth, setViewWidth] = useState(() => window.innerWidth)

  useEffect(() => {
    const node = scrollRef.current
    const ro = new ResizeObserver(() => setViewWidth(node.clientWidth))
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    // Leaving browser fullscreen (Esc / F11) also leaves the preview.
    const onFullscreen = () => {
      if (!document.fullscreenElement) onClose()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFullscreen)
    }
  }, [onClose])

  // Links starting with # would change the editor's own route (it lives in the URL hash): in-page links
  // scroll the preview instead, and a bare '#' does nothing.
  const onClickCapture = (e) => {
    const a = e.target.closest('a[href^="#"]')
    if (!a) return
    e.preventDefault()
    const link = scrollLink(a.getAttribute('href'))
    const box = scrollRef.current
    if (link?.top) box.scrollTo({ top: 0, behavior: 'smooth' })
    else if (link?.id) document.getElementById(anchorId(link.id))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else if (link) {
      // A picked point, in design px: where the (scaled) page starts in the scroller, plus y at that scale.
      const pageTop = box.querySelector('.preview-page').getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop
      box.scrollTo({ top: pageTop + link.y * scale, behavior: 'smooth' })
    }
  }

  // Pages wider than the screen are scaled down; narrower ones are centered.
  const scale = Math.min(1, viewWidth / page.width)

  return (
    <div className="preview" style={{ background: page.background }}>
      <div className="preview-bar">
        <span className="preview-title">Xem trước · {page.title}</span>
        <button type="button" className="preview-btn" onClick={onOpenTab} title="Mở bản xuất HTML trong tab mới">
          <Icon name="external" size={14} />
          Tab mới
        </button>
        <button type="button" className="preview-btn" onClick={onClose}>
          <Icon name="close" size={14} />
          Thoát (Esc)
        </button>
      </div>
      <div className="preview-scroll" ref={scrollRef} onClickCapture={onClickCapture}>
        <div style={{ position: 'relative', overflow: 'hidden', height: page.height * scale }}>
          <div
            className="preview-page"
            style={{
              width: page.width,
              height: page.height,
              transform: `translateX(-50%) scale(${scale})`,
            }}
          >
            {elements.map((el, i) =>
              el.hidden ? null : (
                <div
                  key={el.id}
                  id={anchorId(el.id)}
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
                  <Motion el={el}>
                    <ElementContent el={el} mode="preview" />
                    <GradientBorder el={el} />
                  </Motion>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
