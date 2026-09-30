import { useEffect, useState } from 'react'
import DesignThumb from './DesignThumb.jsx'
import Icon from './Icon.jsx'
import Preview from './Preview.jsx'
import TemplateDialog from './TemplateDialog.jsx'
import UserChip from './UserChip.jsx'
import { LabelManager, LabelMenu, LabelTag, MarkFilter, StarButton } from './SiteMarks.jsx'
import AdminFilterBar from './AdminFilters.jsx'
import {
  approveDomainRequest,
  approvePublishRequest,
  cleanupAllStorage,
  expireDueSites,
  extendAdminSite,
  getPublishRequest,
  listAdminSites,
  markAdminSite,
  revokeAdminSite,
  listDomainRequests,
  listPublishRequests,
  rejectDomainRequest,
  rejectPublishRequest,
  saveSiteLabels,
} from '../lib/api.js'
import { ROLES, deleteTemplate, listDesigns, listTemplates, listUsers, setTemplateHidden, signOut } from '../lib/cloud.js'
import { normalizeDoc } from '../lib/elements.js'
import { exportHtml } from '../lib/exportHtml.js'
import { FUTURE_RANGES, useAdminFilters } from '../lib/adminFilters.js'
import { TRIAL_DAYS, extendedEnd, formatDate, siteExpiry } from '../lib/expiry.js'
import { formatTime } from '../lib/format.js'
import { goHome } from '../lib/route.js'

/** Runs `load` whenever `deps` change and returns `{ data, error, reload }`; data is null while loading. */
function useLoad(load, deps) {
  const [attempt, setAttempt] = useState(0)
  const key = JSON.stringify([...deps, attempt])
  // Results are tagged with the key they were loaded for; anything older reads as "loading".
  const [state, setState] = useState({ key: null, data: null, error: null })
  useEffect(() => {
    let cancelled = false
    load().then(
      (data) => !cancelled && setState({ key, data, error: null }),
      (error) => !cancelled && setState({ key, data: null, error }),
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const current = state.key === key
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    reload: () => setAttempt((n) => n + 1),
  }
}

function openInNewTab(design) {
  const url = URL.createObjectURL(new Blob([exportHtml(design)], { type: 'text/html' }))
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function Status({ error, loading, empty, onRetry }) {
  if (error) {
    return (
      <div className="home-empty">
        <p className="login-error">Không tải được dữ liệu. Bạn có quyền quản trị không?</p>
        <button type="button" className="btn" onClick={onRetry}>
          Thử lại
        </button>
      </div>
    )
  }
  if (loading) return <p className="home-empty">Đang tải…</p>
  return <p className="home-empty">{empty}</p>
}

function UserDesigns({ user, onPreview, onMakeTemplate }) {
  const designs = useLoad(() => listDesigns(user.uid), [user.uid])
  if (!designs.data?.length) {
    return (
      <Status
        error={designs.error}
        loading={!designs.data}
        empty="Người dùng này chưa có trang nào."
        onRetry={designs.reload}
      />
    )
  }
  return (
    <div className="card-grid">
      {designs.data.map((d) => (
        <div key={d.id} className="card">
          <button type="button" className="card-open" onClick={() => onPreview(d)} title="Xem trước">
            <DesignThumb design={d} />
            <span className="card-text">
              <strong>{d.page.title || 'Chưa đặt tên'}</strong>
              <small>Sửa lần cuối: {formatTime(d.updatedAt)}</small>
            </span>
          </button>
          <div className="card-actions">
            <button type="button" className="btn" onClick={() => onPreview(d)}>
              <Icon name="play" size={14} />
              Xem
            </button>
            <button type="button" className="btn primary" onClick={() => onMakeTemplate(d, { uid: user.uid, designId: d.id })}>
              Lưu làm mẫu
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function UsersTab({ onPreview, onMakeTemplate }) {
  const users = useLoad(listUsers, [])
  const [selected, setSelected] = useState(null)
  const f = useAdminFilters()
  const all = users.data ?? []
  const roles = [
    { value: 'all', label: 'Tất cả' },
    { value: ROLES.admin, label: 'Quản trị viên', count: all.filter((u) => u.role === ROLES.admin).length },
    { value: ROLES.user, label: 'Người dùng', count: all.filter((u) => u.role !== ROLES.admin).length },
  ]
  const shown = f.apply(all, {
    text: (u) => [u.displayName, u.email, u.uid],
    date: (u) => u.lastLoginAt,
    status: (u, role) => (role === ROLES.admin ? u.role === ROLES.admin : u.role !== ROLES.admin),
  })

  return (
    <>
      <AdminFilterBar
        f={f}
        statuses={roles}
        dateLabel="Đăng nhập gần nhất"
        sortLabels={['Đăng nhập gần nhất', 'Đăng nhập lâu nhất']}
        placeholder="Tìm theo tên, email…"
        shown={shown.length}
        total={all.length}
      />
      <div className="admin-users">
        <aside className="admin-user-list">
          {!users.data ? (
            <Status error={users.error} loading onRetry={users.reload} />
          ) : (
            <ul>
              {shown.map((u) => (
                <li key={u.uid}>
                  <button
                    type="button"
                    className={`admin-user${selected?.uid === u.uid ? ' active' : ''}`}
                    onClick={() => setSelected(u)}
                  >
                    {u.photoURL ? (
                      <img src={u.photoURL} alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="user-initial">{(u.displayName || u.email || '?')[0].toUpperCase()}</span>
                    )}
                    <span className="admin-user-text">
                      <strong>{u.displayName || '(không tên)'}</strong>
                      <small>{u.email || u.uid}</small>
                    </span>
                    {u.role === ROLES.admin && <span className="role-badge">Admin</span>}
                  </button>
                </li>
              ))}
              {!shown.length && <li className="home-empty">Không tìm thấy người dùng.</li>}
            </ul>
          )}
        </aside>
        <section className="admin-user-designs">
          {selected ? (
            <>
              <h2>
                Trang của {selected.displayName || selected.email || selected.uid}
                <small className="admin-sub">Đăng nhập gần nhất: {formatTime(selected.lastLoginAt)}</small>
              </h2>
              <UserDesigns key={selected.uid} user={selected} onPreview={onPreview} onMakeTemplate={onMakeTemplate} />
            </>
          ) : (
            <p className="home-empty">Chọn một người dùng để xem các trang của họ.</p>
          )}
        </section>
      </div>
    </>
  )
}

function TemplatesTab({ onPreview, version }) {
  const templates = useLoad(listTemplates, [version])
  const f = useAdminFilters()
  const all = templates.data ?? []
  const statuses = [
    { value: 'all', label: 'Tất cả', count: all.length },
    { value: 'shown', label: 'Đang hiện', count: all.filter((t) => !t.hidden).length },
    { value: 'hidden', label: 'Đang ẩn', count: all.filter((t) => t.hidden).length },
  ]
  const shown = f.apply(all, { text: (t) => [t.name, t.description], date: () => null, status: (t, v) => (v === 'hidden' ? t.hidden : !t.hidden) })
  const [toggling, setToggling] = useState(null)

  const toggle = async (t) => {
    setToggling(t.id)
    try {
      await setTemplateHidden(t.templateId, !t.hidden)
    } catch (e) {
      console.error(e)
      alert(t.hidden ? 'Không hiện lại được mẫu.' : 'Không ẩn được mẫu.')
    }
    setToggling(null)
    templates.reload()
  }

  const remove = async (t) => {
    if (!confirm(`Xoá mẫu "${t.name}"? Trang người dùng đã tạo từ mẫu này không bị ảnh hưởng.`)) return
    try {
      await deleteTemplate(t.templateId)
    } catch (e) {
      console.error(e)
      alert('Không xoá được mẫu.')
    }
    templates.reload()
  }

  const bar = <AdminFilterBar f={f} statuses={statuses} ranges={null} placeholder="Tìm theo tên mẫu…" shown={shown.length} total={all.length} />
  if (!shown.length) {
    return (
      <>
        {all.length > 0 && bar}
        <Status
          error={templates.error}
          loading={!templates.data}
          empty={all.length ? 'Không có mẫu nào khớp bộ lọc.' : 'Chưa có mẫu nào. Vào tab "Người dùng" để lưu một thiết kế làm mẫu.'}
          onRetry={templates.reload}
        />
      </>
    )
  }
  return (
    <>
      {bar}
      <div className="card-grid">
        {shown.map((t) => {
          const design = t.create()
          return (
            <div key={t.id} className={`card${t.hidden ? ' card-hidden' : ''}`}>
              <button type="button" className="card-open" onClick={() => onPreview(design)} title="Xem trước">
                <DesignThumb design={design} />
                <span className="card-text">
                  <strong>{t.name}</strong>
                  <small>{t.description || '—'}</small>
                </span>
              </button>
              {/* Users only see the templates that are shown. */}
              <button
                type="button"
                className={`tpl-visibility${t.hidden ? '' : ' on'}`}
                role="switch"
                aria-checked={!t.hidden}
                disabled={toggling === t.id}
                onClick={() => toggle(t)}
                title={t.hidden ? 'Người dùng không thấy mẫu này — bấm để hiện' : 'Người dùng đang thấy mẫu này — bấm để ẩn'}
              >
                <Icon name={t.hidden ? 'eyeOff' : 'eye'} size={14} />
                {toggling === t.id ? 'Đang lưu…' : t.hidden ? 'Đang ẩn' : 'Đang hiện'}
              </button>
              <button type="button" className="icon-btn danger card-delete" title="Xoá mẫu" onClick={() => remove(t)}>
                <Icon name="trash" />
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}

const REQUEST_FILTERS = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Đã từ chối' },
]

function RequestRow({ request: r, onPreview, onDone }) {
  const [busy, setBusy] = useState(null)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const run = async (kind, action) => {
    setBusy(kind)
    setError('')
    try {
      onDone(await action())
    } catch (e) {
      setError(e.message)
      setBusy(null)
    }
  }

  const preview = () =>
    run('preview', async () => {
      const full = await getPublishRequest(r.id)
      onPreview(normalizeDoc(full.design))
      setBusy(null)
      return null
    })

  // No confirmation: the user was already warned that approving replaces (and deletes) their old site.
  const approve = () =>
    run('approve', async () => {
      const res = await approvePublishRequest(r.id)
      const missing = res.deployment?.missingImages
        ? ` ${res.deployment.missingImages} ảnh không còn trong Storage nên đã bị bỏ trống.`
        : ''
      return `Đã duyệt "${r.title}". ${res.deployment?.url ? `Trang ở ${res.deployment.url}` : 'Vercel đang triển khai trang.'}${missing}`
    })

  const reject = (e) => {
    e.preventDefault()
    run('reject', async () => {
      await rejectPublishRequest(r.id, reason.trim())
      return `Đã từ chối "${r.title}".`
    })
  }

  const who = r.user?.name || r.user?.email || r.uid
  return (
    <li className="request">
      <div className="request-main">
        <strong>{r.title}</strong>
        <small>
          {who}
          {r.user?.name && r.user?.email ? ` · ${r.user.email}` : ''} · gửi lúc {formatTime(r.submittedAt && new Date(r.submittedAt))}
        </small>
        {r.domain && <small>Tên miền: {r.domain}</small>}
        {r.contact?.threadsUrl && (
          <small>
            Liên hệ:{' '}
            <a href={r.contact.threadsUrl} target="_blank" rel="noopener noreferrer">
              Threads {r.contact.threadsUrl.replace(/^https:\/\/www\.threads\.com\//, '')}
            </a>
          </small>
        )}
        {r.status === 'rejected' && <small className="warn">Lý do từ chối: {r.rejectReason}</small>}
        {r.status === 'approved' && <small>Duyệt lúc {formatTime(r.reviewedAt && new Date(r.reviewedAt))}</small>}
        {r.lastError && r.status === 'pending' && <small className="warn">Lần duyệt trước bị lỗi: {r.lastError}</small>}
        {error && <small className="warn">{error}</small>}
        {rejecting && (
          <form className="request-reject" onSubmit={reject}>
            <input
              className="input"
              autoFocus
              required
              maxLength={500}
              placeholder="Lý do từ chối (người dùng sẽ thấy)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <button type="submit" className="btn danger-btn" disabled={!!busy || !reason.trim()}>
              {busy === 'reject' ? 'Đang gửi…' : 'Từ chối'}
            </button>
            <button type="button" className="btn" onClick={() => setRejecting(false)} disabled={!!busy}>
              Huỷ
            </button>
          </form>
        )}
      </div>
      <div className="request-actions">
        <button type="button" className="btn" onClick={preview} disabled={!!busy}>
          <Icon name="play" size={14} />
          {busy === 'preview' ? 'Đang tải…' : 'Xem'}
        </button>
        {r.status === 'pending' && !rejecting && (
          <>
            <button type="button" className="btn" onClick={() => setRejecting(true)} disabled={!!busy}>
              Từ chối
            </button>
            <button type="button" className="btn primary" onClick={approve} disabled={!!busy}>
              {busy === 'approve' ? 'Đang xuất bản…' : 'Duyệt'}
            </button>
          </>
        )}
      </div>
    </li>
  )
}

function PublishRequestsTab({ onPreview, onNotice }) {
  // Status is filtered by the server; waiting requests are handled oldest first by default.
  const f = useAdminFilters({ status: 'pending', sort: 'old' })
  const requests = useLoad(() => listPublishRequests(f.filters.status), [f.filters.status])
  const all = requests.data ?? []
  const shown = f.apply(all, {
    text: (r) => [r.title, r.user?.name, r.user?.email, r.domain, r.contact?.threadsUrl],
    date: (r) => r.submittedAt,
  })

  return (
    <section>
      <AdminFilterBar
        f={f}
        statuses={REQUEST_FILTERS}
        dateLabel="Ngày gửi"
        sortLabels={['Gửi gần nhất', 'Gửi lâu nhất']}
        placeholder="Tìm theo tên trang, người gửi, email, tên miền…"
        shown={shown.length}
        total={all.length}
      />
      {!shown.length ? (
        <Status
          error={requests.error}
          loading={!requests.data}
          empty={all.length ? 'Không có yêu cầu nào khớp bộ lọc.' : f.filters.status === 'pending' ? 'Không có yêu cầu nào đang chờ duyệt.' : 'Chưa có yêu cầu nào.'}
          onRetry={requests.reload}
        />
      ) : (
        <ul className="requests">
          {shown.map((r) => (
            <RequestRow
              key={r.id}
              request={r}
              onPreview={onPreview}
              onDone={(message) => {
                if (!message) return
                onNotice(message)
                requests.reload()
              }}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function DomainRequestRow({ request: r, onDone }) {
  const [busy, setBusy] = useState(null)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const run = async (kind, action, message) => {
    setBusy(kind)
    setError('')
    try {
      await action()
      onDone(message)
    } catch (e) {
      setError(e.message)
      setBusy(null)
    }
  }

  const approve = () => {
    if (!confirm(`Đổi tên miền của ${who} từ ${r.domain} sang ${r.pendingDomain}?`)) return
    run('approve', () => approveDomainRequest(r.uid), `Đã đổi tên miền sang ${r.pendingDomain}.`)
  }

  const reject = (e) => {
    e.preventDefault()
    run('reject', () => rejectDomainRequest(r.uid, reason.trim()), `Đã từ chối đổi sang ${r.pendingDomain}.`)
  }

  const who = r.user?.name || r.user?.email || r.uid
  return (
    <li className="request">
      <div className="request-main">
        <strong>
          {r.status === 'approved' ? r.domain : `${r.domain} → ${r.pendingDomain ?? '—'}`}
        </strong>
        <small>
          {who}
          {r.user?.name && r.user?.email ? ` · ${r.user.email}` : ''}
          {r.submittedAt && ` · gửi lúc ${formatTime(new Date(r.submittedAt))}`}
        </small>
        {r.status === 'rejected' && <small className="warn">Lý do từ chối: {r.rejectReason}</small>}
        {r.status === 'approved' && r.reviewedAt && <small>Duyệt lúc {formatTime(new Date(r.reviewedAt))}</small>}
        {r.lastError && r.status === 'pending' && <small className="warn">Lần duyệt trước bị lỗi: {r.lastError}</small>}
        {error && <small className="warn">{error}</small>}
        {rejecting && (
          <form className="request-reject" onSubmit={reject}>
            <input
              className="input"
              autoFocus
              required
              maxLength={500}
              placeholder="Lý do từ chối (người dùng sẽ thấy)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <button type="submit" className="btn danger-btn" disabled={!!busy || !reason.trim()}>
              {busy === 'reject' ? 'Đang gửi…' : 'Từ chối'}
            </button>
            <button type="button" className="btn" onClick={() => setRejecting(false)} disabled={!!busy}>
              Huỷ
            </button>
          </form>
        )}
      </div>
      {r.status === 'pending' && !rejecting && (
        <div className="request-actions">
          <button type="button" className="btn" onClick={() => setRejecting(true)} disabled={!!busy}>
            Từ chối
          </button>
          <button type="button" className="btn primary" onClick={approve} disabled={!!busy}>
            {busy === 'approve' ? 'Đang đổi…' : 'Duyệt'}
          </button>
        </div>
      )}
    </li>
  )
}

function DomainRequestsTab({ onNotice }) {
  const f = useAdminFilters({ status: 'pending', sort: 'old' })
  const requests = useLoad(() => listDomainRequests(f.filters.status), [f.filters.status])
  const all = requests.data ?? []
  const shown = f.apply(all, {
    text: (r) => [r.user?.name, r.user?.email, r.domain, r.pendingDomain],
    date: (r) => r.submittedAt,
  })

  return (
    <section>
      <AdminFilterBar
        f={f}
        statuses={REQUEST_FILTERS}
        dateLabel="Ngày gửi"
        sortLabels={['Gửi gần nhất', 'Gửi lâu nhất']}
        placeholder="Tìm theo người gửi, email, tên miền cũ / mới…"
        shown={shown.length}
        total={all.length}
      />
      {!shown.length ? (
        <Status
          error={requests.error}
          loading={!requests.data}
          empty={all.length ? 'Không có yêu cầu nào khớp bộ lọc.' : f.filters.status === 'pending' ? 'Không có yêu cầu đổi tên miền nào đang chờ.' : 'Chưa có yêu cầu nào.'}
          onRetry={requests.reload}
        />
      ) : (
        <ul className="requests">
          {shown.map((r) => (
            <DomainRequestRow
              key={r.uid}
              request={r}
              onDone={(message) => {
                onNotice(message)
                requests.reload()
              }}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

const formatBytes = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.round(n / 1e3)} KB`)

/** Sweeps every user's unused uploads (and template images) now, instead of waiting for them to visit. */
/** One published site: owner, domain, how long it still runs, and the buttons to extend it after payment. */
function SiteRow({ site: s, months, labels, onMark, onManageLabels, onDone }) {
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const exp = siteExpiry(s)
  const who = s.user?.name || s.user?.email || s.uid

  const extend = async (m) => {
    const until = formatDate(extendedEnd(s, m))
    const back = exp?.expired ? '\nTrang đang hết hạn sẽ được bật lại ngay.' : ''
    if (!confirm(`Gia hạn ${s.domain} thêm ${m} tháng (đến ${until})?${back}\n\nChỉ bấm khi người dùng đã thanh toán.`)) return
    setBusy(m)
    setError('')
    try {
      await extendAdminSite(s.uid, m)
      onDone(`Đã gia hạn ${s.domain} thêm ${m} tháng, đến ${until}.`)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(null)
    }
  }

  const revoke = async () => {
    const note = exp.trial ? 'thời gian dùng thử' : `hạn dùng còn lại (đến ${formatDate(exp.end)})`
    if (!confirm(`Huỷ ${note} của ${s.domain}?\n\nTrang sẽ hết hạn và tạm ngưng NGAY (khách thấy “Trang web đã hết hạn”). Thiết kế và tên miền vẫn giữ; gia hạn lại sẽ bật trang lên.`)) return
    setBusy('revoke')
    setError('')
    try {
      await revokeAdminSite(s.uid)
      onDone(`Đã huỷ hạn dùng của ${s.domain}. Trang đã tạm ngưng.`)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <li className={`request site-row${exp ? ` site-${exp.tone}` : ''}${s.starred ? ' starred' : ''}`}>
      <StarButton starred={s.starred} onToggle={() => onMark({ starred: !s.starred })} />
      <div className="request-main">
        <strong className="site-domain">
          {s.url ? (
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.domain}
            </a>
          ) : (
            s.domain
          )}
          {s.labels
            ?.map((id) => labels.find((l) => l.id === id))
            .filter(Boolean)
            .map((l) => (
              <LabelTag key={l.id} label={l} onRemove={() => onMark({ labels: s.labels.filter((id) => id !== l.id) })} />
            ))}
        </strong>
        <small>
          {who}
          {s.user?.name && s.user?.email ? ` · ${s.user.email}` : ''} · trang “{s.title || 'Chưa đặt tên'}”
        </small>
        {s.user?.threadsUrl && (
          <small>
            Liên hệ:{' '}
            <a href={s.user.threadsUrl} target="_blank" rel="noopener noreferrer">
              Threads {s.user.threadsUrl.replace(/^https:\/\/www\.threads\.com\//, '')}
            </a>
          </small>
        )}
        <span className="site-expiry">
          {exp ? (
            <span className={`badge badge-${exp.tone === 'ok' ? 'live' : exp.tone}`}>
              {exp.trial && !exp.expired ? 'Dùng thử · ' : ''}
              {exp.label}
            </span>
          ) : (
            <span className="badge badge-wait">Chưa đặt hạn (xuất bản trước khi có hạn dùng)</span>
          )}
        </span>
        {s.extensions?.length > 0 && (
          <small>
            Lịch sử:{' '}
            {s.extensions.map((e) => `${e.revoked ? 'Huỷ hạn' : `+${e.months} tháng`} (${formatDate(new Date(e.at))})`).join(', ')}
          </small>
        )}
        {error && <small className="warn">{error}</small>}
      </div>
      <div className="request-actions">
        <LabelMenu labels={labels} value={s.labels ?? []} onChange={(ids) => onMark({ labels: ids })} onManage={onManageLabels} />
        {months.map((m) => (
          <button key={m} type="button" className="btn" onClick={() => extend(m)} disabled={!!busy}>
            {busy === m ? 'Đang gia hạn…' : `+${m} tháng`}
          </button>
        ))}
        {exp && !exp.expired && (
          <button type="button" className="btn danger-btn" onClick={revoke} disabled={!!busy} title="Đưa hạn dùng về 0: trang hết hạn và tạm ngưng ngay">
            {busy === 'revoke' ? 'Đang huỷ…' : 'Huỷ hạn dùng'}
          </button>
        )}
      </div>
    </li>
  )
}

/** Every published site, soonest to expire first; extend them once users have paid. */
/** Which status chip a site belongs to (a site can be in several: e.g. on trial and ending soon). */
const SITE_STATUSES = [
  ['all', 'Tất cả', () => true],
  ['running', 'Đang chạy', (e) => !e || !e.expired],
  ['trial', 'Đang dùng thử', (e) => e && !e.expired && e.trial],
  ['paid', 'Đã gia hạn', (e) => e && !e.expired && !e.trial],
  ['soon', 'Sắp hết hạn (≤ 3 ngày)', (e) => e && !e.expired && e.tone === 'wait'],
  ['expired', 'Đã hết hạn', (e) => e?.expired],
  ['unset', 'Chưa đặt hạn', (e) => !e],
]

/** Every published site; filter by state, expiry date or owner, and extend them once users have paid. */
function SitesTab({ onNotice }) {
  const sites = useLoad(listAdminSites, [])
  const [sweeping, setSweeping] = useState(false)
  // Soonest to expire first by default: those are the ones to chase for payment.
  const f = useAdminFilters({ sort: 'old' })
  // Stars and labels change in place (no reload): these override what was loaded.
  const [marks, setMarks] = useState({})
  const [labelList, setLabelList] = useState(null)
  const [markFilter, setMarkFilter] = useState('all')
  const [managing, setManaging] = useState(false)
  const labels = labelList ?? sites.data?.labels ?? []
  const all = (sites.data?.sites ?? []).map((s) => ({ ...s, ...marks[s.uid] }))
  const statuses = SITE_STATUSES.map(([value, label, test]) => ({ value, label, count: all.filter((s) => test(siteExpiry(s))).length }))
  const shown = f.apply(all, {
    text: (s) => [s.domain, s.title, s.user?.name, s.user?.email, s.user?.threadsUrl],
    date: (s) => s.expiresAt,
    status: (s, value) => SITE_STATUSES.find(([v]) => v === value)[2](siteExpiry(s)),
  }).filter((s) => markFilter === 'all' || (markFilter === 'starred' ? s.starred : s.labels?.includes(markFilter)))

  const mark = async (site, patch) => {
    const before = { starred: site.starred, labels: site.labels ?? [] }
    setMarks((m) => ({ ...m, [site.uid]: { ...before, ...patch } }))
    try {
      const saved = await markAdminSite(site.uid, patch)
      setMarks((m) => ({ ...m, [site.uid]: saved }))
    } catch (e) {
      setMarks((m) => ({ ...m, [site.uid]: before }))
      onNotice(`Không lưu được đánh dấu: ${e.message}`)
    }
  }

  const labelCounts = Object.fromEntries(labels.map((l) => [l.id, all.filter((s) => s.labels?.includes(l.id)).length]))
  const saveLabels = async (list) => {
    const { labels: saved } = await saveSiteLabels(list)
    setLabelList(saved)
    // A deleted label can't stay selected as the filter.
    if (markFilter !== 'all' && markFilter !== 'starred' && !saved.some((l) => l.id === markFilter)) setMarkFilter('all')
    onNotice('Đã lưu danh sách nhãn.')
  }

  const sweep = async () => {
    setSweeping(true)
    try {
      const { expired } = await expireDueSites()
      onNotice(expired ? `Đã tạm ngưng ${expired} trang hết hạn.` : 'Không có trang nào cần tạm ngưng.')
      sites.reload()
    } catch (e) {
      onNotice(e.message)
    } finally {
      setSweeping(false)
    }
  }

  return (
    <section>
      <div className="site-summary">
        <p className="hint">
          Trang mới duyệt chạy thử {TRIAL_DAYS} ngày. Khi người dùng đã thanh toán, bấm +3 / +6 / +12 tháng để gia hạn. Trang hết hạn
          hiện thông báo “Trang web đã hết hạn”; gia hạn sẽ bật lại ngay.
        </p>
        <button type="button" className="btn" onClick={sweep} disabled={sweeping} title="Máy chủ tự kiểm tra mỗi 10 phút">
          {sweeping ? 'Đang kiểm tra…' : 'Tạm ngưng các trang hết hạn ngay'}
        </button>
      </div>
      <AdminFilterBar
        f={f}
        statuses={statuses}
        ranges={FUTURE_RANGES}
        dateLabel="Ngày hết hạn"
        sortLabels={['Hết hạn muộn nhất', 'Hết hạn sớm nhất']}
        placeholder="Tìm theo tên miền, tên trang, chủ trang, email…"
        shown={shown.length}
        total={all.length}
      />
      {all.length > 0 && <MarkFilter value={markFilter} onChange={setMarkFilter} labels={labels} sites={all} />}
      {!shown.length ? (
        <Status
          error={sites.error}
          loading={!sites.data}
          empty={all.length ? 'Không có trang nào khớp bộ lọc.' : 'Chưa có trang web nào được xuất bản.'}
          onRetry={sites.reload}
        />
      ) : (
        <ul className="requests">
          {shown.map((s) => (
            <SiteRow
              key={s.uid}
              site={s}
              months={sites.data.extendMonths}
              labels={labels}
              onMark={(patch) => mark(s, patch)}
              onManageLabels={() => setManaging(true)}
              onDone={(message) => {
                onNotice(message)
                sites.reload()
              }}
            />
          ))}
        </ul>
      )}
      {managing && <LabelManager labels={labels} counts={labelCounts} onSave={saveLabels} onClose={() => setManaging(false)} />}
    </section>
  )
}

function CleanupButton({ onNotice }) {
  const [busy, setBusy] = useState(false)
  const run = async () => {
    const question =
      'Dọn tệp thừa của mọi người dùng?\n\n' +
      'Chỉ xoá ảnh/âm thanh không còn thiết kế, mẫu hay yêu cầu xuất bản nào dùng, và đã như vậy hơn 24 giờ.'
    if (!confirm(question)) return
    setBusy(true)
    try {
      const r = await cleanupAllStorage()
      onNotice(
        `Đã xoá ${r.deleted} tệp (${formatBytes(r.freedBytes)}) của ${r.users} người dùng. ` +
          (r.waiting ? `${r.waiting} tệp thừa sẽ được xoá sau 24 giờ.` : ''),
      )
    } catch (e) {
      onNotice(`Không dọn được: ${e.message}`)
    } finally {
      setBusy(false)
    }
  }
  return (
    <button type="button" className="btn ghost" onClick={run} disabled={busy} title="Xoá ảnh/âm thanh không còn được dùng">
      <Icon name="trash" size={14} />
      {busy ? 'Đang dọn…' : 'Dọn dung lượng'}
    </button>
  )
}

export default function AdminPage({ user }) {
  const [tab, setTab] = useState('requests')
  const [previewing, setPreviewing] = useState(null)
  const [making, setMaking] = useState(null)
  const [notice, setNotice] = useState('')
  // Bumped after a template is saved so the templates tab refetches.
  const [templatesVersion, setTemplatesVersion] = useState(0)

  return (
    <div className="home">
      <header className="topbar">
        <button type="button" className="brand brand-btn" title="Về trang chủ" onClick={goHome}>
          <span className="brand-mark">
            <Icon name="home" size={16} />
          </span>
          <span>Trang chủ</span>
        </button>
        <strong className="admin-title">Quản trị</strong>
        <div className="spacer" />
        {notice && <span className="save-state">{notice}</span>}
        <CleanupButton onNotice={setNotice} />
        <UserChip user={user} onSignOut={signOut} />
      </header>

      <div className="tabs admin-tabs">
        <button type="button" className={`tab${tab === 'requests' ? ' active' : ''}`} onClick={() => setTab('requests')}>
          Duyệt xuất bản
        </button>
        <button type="button" className={`tab${tab === 'sites' ? ' active' : ''}`} onClick={() => setTab('sites')}>
          Trang web & hạn dùng
        </button>
        <button type="button" className={`tab${tab === 'domains' ? ' active' : ''}`} onClick={() => setTab('domains')}>
          Đổi tên miền
        </button>
        <button type="button" className={`tab${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>
          Người dùng
        </button>
        <button type="button" className={`tab${tab === 'templates' ? ' active' : ''}`} onClick={() => setTab('templates')}>
          Mẫu đã tạo
        </button>
      </div>

      <main className="home-main">
        {tab === 'requests' ? (
          <PublishRequestsTab onPreview={setPreviewing} onNotice={setNotice} />
        ) : tab === 'sites' ? (
          <SitesTab onNotice={setNotice} />
        ) : tab === 'domains' ? (
          <DomainRequestsTab onNotice={setNotice} />
        ) : tab === 'users' ? (
          <UsersTab onPreview={setPreviewing} onMakeTemplate={(design, source) => setMaking({ design, source })} />
        ) : (
          <section>
            <TemplatesTab onPreview={setPreviewing} version={templatesVersion} />
          </section>
        )}
      </main>

      {previewing && (
        <Preview doc={previewing} onClose={() => setPreviewing(null)} onOpenTab={() => openInNewTab(previewing)} />
      )}
      {making && (
        <TemplateDialog
          design={making.design}
          source={making.source}
          onClose={() => setMaking(null)}
          onDone={(message) => {
            setMaking(null)
            setNotice(message)
            setTemplatesVersion((n) => n + 1)
          }}
        />
      )}
    </div>
  )
}
