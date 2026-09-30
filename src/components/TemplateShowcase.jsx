import { useEffect, useRef, useState } from 'react'
import DesignThumb from './DesignThumb.jsx'
import Icon from './Icon.jsx'

/** Cards show the top of a template in this proportion (one screen of a 1200px-wide page). */
const CARD_RATIO = 2 / 3

/** Width of `ref`'s box, kept up to date. */
function useWidth(ref, ready = true) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const ro = new ResizeObserver(() => setWidth(node.clientWidth))
    ro.observe(node)
    return () => ro.disconnect()
  }, [ref, ready])
  return width
}

/** Width of one card of the grid (two columns, or one on narrow screens: see .tpl-grid). */
function useCardWidth(gridRef, ready) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const measure = () => setWidth(grid.firstElementChild?.clientWidth ?? 0)
    const ro = new ResizeObserver(measure)
    ro.observe(grid)
    return () => ro.disconnect()
  }, [gridRef, ready])
  return width
}

/** The whole template, scrollable, over the home screen; Esc or the backdrop closes it. */
function TemplatePreview({ template, creating, canCreate, onUse, onClose }) {
  const frameRef = useRef(null)
  const width = useWidth(frameRef)
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop tpl-preview-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tpl-preview" role="dialog" aria-modal="true" aria-label={`Xem mẫu ${template.name}`}>
        <div className="tpl-preview-head">
          <div className="tpl-card-text">
            <strong>{template.name}</strong>
            {template.description && <small>{template.description}</small>}
          </div>
          <button type="button" className="btn primary" onClick={() => onUse(template)} disabled={!canCreate}>
            <Icon name="plus" size={14} />
            {creating === template.id ? 'Đang tạo…' : 'Dùng mẫu này'}
          </button>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng (Esc)" title="Đóng (Esc)">
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="tpl-preview-frame" ref={frameRef}>
          {width > 0 && <DesignThumb design={template.preview} width={width} full />}
        </div>
      </div>
    </div>
  )
}

/**
 * Every sample template as a card, two per row, in a list that scrolls. A card shows the top of the
 * template; clicking it opens the whole page, and "Dùng mẫu này" creates a page from it.
 */
export default function TemplateShowcase({ templates, creating, canCreate, onUse }) {
  const gridRef = useRef(null)
  const [openId, setOpenId] = useState(null)
  const ready = templates.length > 0
  const cardWidth = useCardWidth(gridRef, ready)
  const open = templates.find((t) => t.id === openId)

  if (!ready) return <div className="showcase showcase-empty">Đang tải mẫu trang…</div>

  return (
    <div className="showcase">
      <div className="showcase-head">
        <div className="showcase-title">
          <strong>Mẫu trang</strong>
          <small>{templates.length} mẫu · bấm vào ảnh để xem toàn trang</small>
        </div>
      </div>
      <div className="tpl-scroll">
        <div className="tpl-grid" ref={gridRef}>
          {templates.map((t) => (
            <article key={t.id} className="tpl-card">
              <button type="button" className="tpl-card-thumb" onClick={() => setOpenId(t.id)} aria-label={`Xem toàn trang mẫu ${t.name}`}>
                {cardWidth > 0 && <DesignThumb design={t.preview} width={cardWidth} height={Math.round(cardWidth * CARD_RATIO)} />}
                <span className="tpl-card-zoom">
                  <Icon name="maximize" size={14} />
                  Xem toàn trang
                </span>
              </button>
              <div className="tpl-card-foot">
                <div className="tpl-card-text">
                  <strong>{t.name}</strong>
                  {t.description && <small>{t.description}</small>}
                </div>
                <button type="button" className="btn primary" onClick={() => onUse(t)} disabled={!canCreate}>
                  <Icon name="plus" size={14} />
                  {creating === t.id ? 'Đang tạo…' : 'Dùng mẫu này'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
      {open && <TemplatePreview template={open} creating={creating} canCreate={canCreate} onUse={onUse} onClose={() => setOpenId(null)} />}
    </div>
  )
}
