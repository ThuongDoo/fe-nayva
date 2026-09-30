import { useState } from 'react'
import { Field } from './fields.jsx'
import { DesignTooLargeError, saveTemplate } from '../lib/cloud.js'

/**
 * Admin dialog that publishes `design` as a template. `source` ({ uid, designId }) records where it came
 * from; `onDone(message)` runs after a successful save.
 */
export default function TemplateDialog({ design, source, onClose, onDone }) {
  const [name, setName] = useState(design.page.title || '')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setError('Hãy đặt tên cho mẫu.')
    setBusy(true)
    setError('')
    try {
      const { failedImages } = await saveTemplate(design, { name: name.trim(), description: description.trim(), source })
      onDone(
        failedImages
          ? `Đã lưu mẫu "${name.trim()}". ${failedImages} ảnh chưa chép được (xem cấu hình CORS), mẫu vẫn dùng ảnh gốc.`
          : `Đã lưu mẫu "${name.trim()}".`,
      )
    } catch (err) {
      console.error(err)
      setError(err instanceof DesignTooLargeError ? err.message : 'Không lưu được mẫu. Bạn có quyền quản trị không?')
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form className="modal" onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && !busy && onClose()}>
        <h3>Lưu làm mẫu trang</h3>
        <p className="hint">
          Mẫu sẽ hiện ở mục "Tạo trang mới" cho mọi người dùng. Hãy chắc chắn đã bỏ thông tin cá nhân (tên, email, ảnh
          riêng tư) và được chủ thiết kế cho phép.
        </p>
        <Field label="Tên mẫu">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={60} />
        </Field>
        <Field label="Mô tả ngắn">
          <input
            className="input"
            value={description}
            placeholder="VD: Giới thiệu nhà hàng, quán cà phê"
            onChange={(e) => setDescription(e.target.value)}
            maxLength={80}
          />
        </Field>
        {error && <p className="warn">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Huỷ
          </button>
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? 'Đang lưu (chép ảnh)…' : 'Lưu mẫu'}
          </button>
        </div>
      </form>
    </div>
  )
}
