import { useEffect, useState } from 'react'
import DomainPicker from './DomainPicker.jsx'
import Icon from './Icon.jsx'
import { cancelDomainChange, getMyDomain, setMyDomain } from '../lib/api.js'
import { formatTime } from '../lib/format.js'

/**
 * The user's site name on the home screen: pick it the first time (active at once), afterwards ask an
 * admin to change it, or withdraw a change still waiting. The publish dialog shows the same setting.
 * `liveUrl`: the published site, if any, so the domain can link to it.
 */
export default function DomainCard({ liveUrl }) {
  const [domain, setDomain] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [picking, setPicking] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    getMyDomain().then(
      (d) => !cancelled && setDomain(d),
      (e) => !cancelled && setError(e.message),
    )
    return () => {
      cancelled = true
    }
  }, [attempt])

  /** Runs a domain action; the server answers with the new domain settings (or nothing, then reload). */
  const run = async (action) => {
    setBusy(true)
    setError('')
    try {
      const next = await action()
      if (next) setDomain(next)
      else setAttempt((n) => n + 1)
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const choose = async (name) => {
    if (!domain.name && !confirm(`Chọn tên miền ${name}.${domain.rootDomain}?\n\nMỗi tài khoản chỉ có một tên miền. Sau này muốn đổi sẽ phải chờ quản trị viên duyệt.`)) {
      return
    }
    if (await run(() => setMyDomain(name))) setPicking(false)
  }

  let body
  if (!domain) {
    body = error ? (
      <>
        <p className="warn">{error}</p>
        <button type="button" className="btn" onClick={() => { setError(''); setAttempt((n) => n + 1) }}>
          Thử lại
        </button>
      </>
    ) : (
      <p className="hint">Đang tải…</p>
    )
  } else {
    const pending = domain.status === 'pending' || domain.status === 'processing'
    body = (
      <>
        {domain.name ? (
          <div className="domain-card-row">
            <Icon name="globe" size={16} />
            {liveUrl ? (
              <a href={liveUrl} target="_blank" rel="noopener noreferrer" title="Mở trang đang xuất bản">
                {domain.domain}
              </a>
            ) : (
              <strong>{domain.domain}</strong>
            )}
            {!pending && (
              <button type="button" className="btn ghost" onClick={() => { setError(''); setPicking(true) }} disabled={busy}>
                Đổi
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="hint">Chưa chọn tên miền. Trang web của bạn sẽ có địa chỉ này khi xuất bản.</p>
            <button type="button" className="btn primary" onClick={() => { setError(''); setPicking(true) }} disabled={busy}>
              Chọn tên miền
            </button>
          </>
        )}
        {pending && (
          <div className="domain-card-note wait">
            <span>
              Đang chờ duyệt đổi sang <b>{domain.pendingDomain}</b>
              {domain.submittedAt && ` · gửi lúc ${formatTime(new Date(domain.submittedAt))}`}
            </span>
            {domain.status === 'pending' && (
              <button type="button" className="btn" onClick={() => run(cancelDomainChange)} disabled={busy}>
                Huỷ yêu cầu đổi
              </button>
            )}
          </div>
        )}
        {domain.status === 'rejected' && (
          <div className="domain-card-note bad">Yêu cầu đổi tên miền bị từ chối. Lý do: {domain.rejectReason}</div>
        )}
        {error && !picking && <p className="warn">{error}</p>}
      </>
    )
  }

  const closePicker = () => {
    if (busy) return
    setPicking(false)
    setError('')
  }

  return (
    <section className="domain-card">
      <h2 className="side-title">Tên miền của bạn</h2>
      {body}
      {picking && domain && (
        <div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && closePicker()}>
          <div className="modal" role="dialog" aria-label="Chọn tên miền" onKeyDown={(e) => e.key === 'Escape' && closePicker()}>
            <h3>{domain.name ? 'Đổi tên miền' : 'Chọn tên miền'}</h3>
            <p className="hint">
              {domain.name
                ? `Đổi tên miền cần quản trị viên duyệt. Trang vẫn chạy ở ${domain.domain} cho tới khi được duyệt.`
                : 'Mỗi tài khoản chỉ có một tên miền.'}
            </p>
            <DomainPicker
              rootDomain={domain.rootDomain}
              submitLabel={domain.name ? 'Gửi yêu cầu đổi' : 'Chọn tên miền này'}
              busy={busy}
              onSubmit={choose}
              onCancel={closePicker}
            />
            {error && <p className="warn">{error}</p>}
          </div>
        </div>
      )}
    </section>
  )
}
