import { useEffect, useState } from 'react'
import { createRenewOrder, getRenewOrder, getRenewPlans } from '../lib/api.js'
import { extendedEnd, formatDate, siteExpiry } from '../lib/expiry.js'

const formatVnd = (n) => `${n.toLocaleString('vi-VN')}đ`

/** Sends the browser to SePay's checkout page by posting the signed order fields as a form. */
function goToCheckout({ checkoutUrl, fields }) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = checkoutUrl
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }
  document.body.appendChild(form)
  form.submit()
}

/**
 * Lets the user renew their published site (`site` from the backend) by 3, 6 or 12 months: pick a
 * package, then pay on SePay. SePay sends them back to `#/?renew=<order>`, see RenewResultDialog.
 * `beforePay()`: optional, run before leaving for SePay (e.g. saving the design); resolves to false to stop.
 */
export default function RenewDialog({ site, beforePay, onClose }) {
  const [offer, setOffer] = useState(null)
  const [months, setMonths] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const exp = siteExpiry(site)

  useEffect(() => {
    let cancelled = false
    getRenewPlans().then(
      (o) => {
        if (cancelled) return
        setOffer(o)
        setMonths(o.plans[0]?.months ?? null)
      },
      (e) => !cancelled && setError(e.message),
    )
    return () => {
      cancelled = true
    }
  }, [])

  const pay = async () => {
    setBusy(true)
    setError('')
    try {
      if (beforePay && !(await beforePay())) throw new Error('Chưa lưu được thay đổi lên đám mây. Hãy thử lại.')
      goToCheckout(await createRenewOrder(months))
      // The page is leaving for SePay: stay busy.
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  const close = () => !busy && onClose()
  let body
  if (!offer) {
    body = error ? <p className="warn">{error}</p> : <p className="hint">Đang tải…</p>
  } else if (!offer.enabled) {
    body = <p className="hint">Chưa bật thanh toán trực tuyến. Hãy liên hệ quản trị viên để gia hạn.</p>
  } else {
    body = (
      <>
        <div className="renew-plans" role="radiogroup" aria-label="Gói gia hạn">
          {offer.plans.map((p) => (
            <button
              key={p.months}
              type="button"
              role="radio"
              aria-checked={months === p.months}
              className={`renew-plan${months === p.months ? ' active' : ''}`}
              onClick={() => setMonths(p.months)}
              disabled={busy}
            >
              <strong>{p.months} tháng</strong>
              <span className="renew-price">{formatVnd(p.amount)}</span>
              <small>Đến {formatDate(extendedEnd(site, p.months))}</small>
            </button>
          ))}
        </div>
        <p className="hint">
          Thanh toán bằng chuyển khoản ngân hàng (quét mã QR) qua SePay. Trang được gia hạn tự động ngay khi nhận được tiền
          {exp?.expired ? ' và chạy lại trong khoảng một phút' : ''}.
        </p>
        {error && <p className="warn">{error}</p>}
      </>
    )
  }

  return (
    <div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="modal" role="dialog" aria-label="Gia hạn trang web" onKeyDown={(e) => e.key === 'Escape' && close()}>
        <h3>Gia hạn {site.domain}</h3>
        {exp && <span className={`expiry-line tone-${exp.tone}`}>Hạn dùng: {exp.label}</span>}
        {body}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={close} disabled={busy}>
            Đóng
          </button>
          {offer?.enabled && (
            <button type="button" className="btn primary" onClick={pay} disabled={busy || !months}>
              {busy ? 'Đang chuyển sang SePay…' : 'Thanh toán'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const POLL_MS = 3000
const POLL_FOR_MS = 3 * 60_000

/**
 * Back from SePay with order `orderId`: waits for the payment to come through (SePay tells the backend
 * separately) and says how it went. `result` is what SePay said: 'success', 'error' or 'cancel'.
 * `onPaid()` refreshes whatever shows the site's end date.
 */
export function RenewResultDialog({ orderId, result, onPaid, onClose }) {
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [gaveUp, setGaveUp] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timer
    const started = Date.now()
    const check = async () => {
      try {
        const o = await getRenewOrder(orderId)
        if (cancelled) return
        setOrder(o)
        if (o.status === 'paid') return onPaid()
        if (o.status === 'mismatch') return
      } catch (e) {
        if (cancelled) return
        setError(e.message)
        if (e.status === 404) return
      }
      // A cancelled payment won't come through; anything else may still be on its way.
      if (result === 'cancel') return
      if (Date.now() - started > POLL_FOR_MS) return setGaveUp(true)
      timer = setTimeout(check, POLL_MS)
    }
    check()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [orderId, result, onPaid])

  let state
  if (order?.status === 'paid') {
    state = (
      <div className="publish-state live">
        <strong>Gia hạn thành công</strong>
        <span>
          Đã gia hạn thêm {order.months} tháng{order.expiresAt && `, đến ${formatDate(new Date(order.expiresAt))}`}. Cảm ơn bạn!
        </span>
      </div>
    )
  } else if (order?.status === 'mismatch') {
    state = (
      <div className="publish-state rejected">
        <strong>Số tiền nhận được không khớp với đơn</strong>
        <span>Hãy liên hệ quản trị viên kèm mã đơn {orderId} để được xử lý.</span>
      </div>
    )
  } else if (order?.status === 'failed') {
    state = (
      <div className="publish-state pending">
        <strong>Đã nhận thanh toán, đang gia hạn…</strong>
        <span>Trang đang bận cập nhật, hệ thống sẽ thử lại. Nếu lâu quá, hãy liên hệ quản trị viên kèm mã đơn {orderId}.</span>
      </div>
    )
  } else if (result === 'cancel') {
    state = (
      <div className="publish-state rejected">
        <strong>Đã huỷ thanh toán</strong>
        <span>Trang chưa được gia hạn. Bạn có thể gia hạn lại bất cứ lúc nào.</span>
      </div>
    )
  } else if (error && !order) {
    state = <p className="warn">{error}</p>
  } else if (gaveUp) {
    state = (
      <div className="publish-state pending">
        <strong>Chưa nhận được thanh toán</strong>
        <span>
          Nếu bạn đã chuyển khoản, trang sẽ tự gia hạn khi tiền về. Còn vướng mắc thì liên hệ quản trị viên kèm mã đơn {orderId}.
        </span>
      </div>
    )
  } else {
    state = (
      <div className="publish-state pending">
        <strong>Đang chờ xác nhận thanh toán…</strong>
        <span>{result === 'error' ? 'SePay báo có lỗi khi thanh toán. ' : ''}Thường chỉ mất vài giây sau khi chuyển khoản.</span>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-label="Kết quả gia hạn" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <h3>Gia hạn trang web</h3>
        {state}
        <small className="hint">Mã đơn: {orderId}</small>
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={onClose} autoFocus>
            Xong
          </button>
        </div>
      </div>
    </div>
  )
}
