import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'

/**
 * Top-bar "Chia sẻ" button. The owner turns "anyone with the link can edit" on or off and copies the
 * link; someone who opened it through the link just sees that the page is shared with them.
 * `share`: { isOwner, on, link, onToggle(on) }.
 */
export default function ShareMenu({ share }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  if (!share.isOwner) {
    return (
      <span className="share-guest" title="Bạn đang chỉnh trang người khác chia sẻ qua link. Thay đổi được lưu vào trang của họ.">
        <Icon name="globe" size={14} />
        Trang được chia sẻ
      </span>
    )
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(share.link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked: the link is selectable in the field.
    }
  }

  return (
    <div className="share-menu" ref={ref}>
      <button
        type="button"
        className={`btn${share.on ? ' share-on' : ''}${open ? ' on' : ''}`}
        title="Cho người khác cùng chỉnh sửa trang này qua link"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="globe" size={14} />
        {share.on ? 'Đang chia sẻ' : 'Chia sẻ'}
      </button>
      {open && (
        <div className="share-pop">
          <label className="share-toggle">
            <span>
              <strong>Ai có link đều chỉnh sửa được</strong>
              <small>Người mở link không cần đăng nhập. Tắt đi là link hết tác dụng ngay.</small>
            </span>
            <input type="checkbox" role="switch" checked={share.on} onChange={(e) => share.onToggle(e.target.checked)} />
          </label>
          {share.on && (
            <>
              <div className="share-link">
                <input className="input" readOnly value={share.link} onFocus={(e) => e.target.select()} />
                <button type="button" className="btn primary" onClick={copy}>
                  <Icon name={copied ? 'check' : 'copy'} size={14} />
                  {copied ? 'Đã chép' : 'Chép link'}
                </button>
              </div>
              <p className="hint">
                Mọi người cùng sửa một trang: thay đổi của người khác hiện ra khi bạn không có gì đang chờ lưu. Nếu hai người
                sửa cùng lúc, bản lưu sau sẽ ghi đè bản trước. Chỉ bạn xuất bản và xoá được trang.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
