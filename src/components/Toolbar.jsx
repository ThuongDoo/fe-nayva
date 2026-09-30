import Icon from './Icon.jsx'
import UserChip from './UserChip.jsx'

const ZOOMS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.25, 1.5, 2]

const SAVE_LABELS = {
  saved: 'Đã lưu lên đám mây',
  pending: 'Có thay đổi chưa lưu…',
  saving: 'Đang lưu…',
  error: 'Không lưu được — kiểm tra kết nối mạng',
  'too-large': 'Trang quá lớn để lưu (giới hạn 1MB) — hãy bớt phần tử',
}

export default function Toolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoom,
  onFit,
  showGrid,
  onToggleGrid,
  snap,
  onToggleSnap,
  onPreview,
  onSave,
  saveState,
  notice,
  user,
  onSignOut,
  onHome,
  onMakeTemplate,
  onPublish,
}) {
  const saveError = saveState === 'error' || saveState === 'too-large'
  const status = notice ?? { text: SAVE_LABELS[saveState], error: saveError }
  const zoomStep = (dir) => {
    const next = dir > 0 ? ZOOMS.find((z) => z > zoom + 0.001) : [...ZOOMS].reverse().find((z) => z < zoom - 0.001)
    if (next) onZoom(next)
  }

  return (
    <header className="topbar">
      <button type="button" className="brand brand-btn" title="Về trang chủ (danh sách trang)" onClick={onHome}>
        <span className="brand-mark">
          <Icon name="home" size={16} />
        </span>
        <span>Trang chủ</span>
      </button>

      <div className="tool-group">
        <button type="button" className="icon-btn" title="Hoàn tác (Ctrl+Z)" disabled={!canUndo} onClick={onUndo}>
          <Icon name="undo" />
        </button>
        <button type="button" className="icon-btn" title="Làm lại (Ctrl+Y)" disabled={!canRedo} onClick={onRedo}>
          <Icon name="redo" />
        </button>
      </div>

      <div className="tool-group">
        <button type="button" className="icon-btn" title="Thu nhỏ" onClick={() => zoomStep(-1)}>
          <Icon name="minus" />
        </button>
        <button type="button" className="zoom-label" title="Về 100%" onClick={() => onZoom(1)}>
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" className="icon-btn" title="Phóng to" onClick={() => zoomStep(1)}>
          <Icon name="plus" />
        </button>
        <button type="button" className="icon-btn" title="Vừa màn hình" onClick={onFit}>
          <Icon name="fit" />
        </button>
      </div>

      <div className="tool-group">
        <button type="button" className={`icon-btn${showGrid ? ' on' : ''}`} title="Lưới (hít theo ô 10px)" onClick={onToggleGrid}>
          <Icon name="grid" />
        </button>
        <button type="button" className={`icon-btn${snap ? ' on' : ''}`} title="Đường gióng thông minh" onClick={onToggleSnap}>
          <Icon name="magnet" />
        </button>
      </div>

      <div className="spacer" />

      <span className={`save-state${status.error ? ' error' : ''}`} title={status.text}>
        {status.text}
      </span>

      <button
        type="button"
        className="btn"
        title="Lưu thiết kế lên đám mây ngay (Ctrl+S)"
        onClick={onSave}
        disabled={saveState === 'saving'}
      >
        <Icon name="cloud" size={14} />
        {saveState === 'saving' ? 'Đang lưu…' : 'Lưu'}
      </button>

      {onMakeTemplate && (
        <button type="button" className="btn ghost" title="Quản trị: đăng trang này thành mẫu cho mọi người" onClick={onMakeTemplate}>
          <Icon name="layers" size={14} />
          Lưu làm mẫu
        </button>
      )}

      <button type="button" className="btn ghost" onClick={onPreview}>
        <Icon name="play" size={14} />
        Xem trước
      </button>

      <button type="button" className="btn primary" title="Gửi trang cho quản trị viên duyệt để xuất bản" onClick={onPublish}>
        <Icon name="external" size={14} />
        Xuất bản
      </button>

      <UserChip user={user} onSignOut={onSignOut} />
    </header>
  )
}
