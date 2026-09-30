import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { deleteMyFiles, getMyStorage } from '../lib/api.js'
import { formatTime } from '../lib/format.js'
import { formatBytes, refreshUsage, setUsage, useStorageUsage } from '../lib/storageQuota.js'

const pct = (u) => (u ? Math.min(100, (u.usedBytes / u.limitBytes) * 100) : 0)
const level = (p) => (p >= 90 ? 'full' : p >= 70 ? 'high' : '')

/** Progress bar of used / allowed upload space. */
function UsageBar({ usage }) {
  const p = pct(usage)
  return (
    <span className={`usage-bar ${level(p)}`} aria-hidden="true">
      <span style={{ width: `${p}%` }} />
    </span>
  )
}

const SORTS = [
  ['new', 'Mới nhất'],
  ['big', 'Lớn nhất'],
]
const KINDS = [
  ['all', 'Tất cả'],
  ['image', 'Ảnh'],
  ['audio', 'Âm thanh'],
  ['video', 'Video'],
  ['unused', 'Không dùng'],
]

/** Everything the user uploaded, with where it is used, and deleting files to free space. */
function StorageDialog({ onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const [sort, setSort] = useState('new')
  const [kind, setKind] = useState('all')
  // Paths ticked for deleting several files at once.
  const [selected, setSelected] = useState(() => new Set())
  const toggle = (path) =>
    setSelected((cur) => {
      const next = new Set(cur)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })

  useEffect(() => {
    let cancelled = false
    getMyStorage().then(
      (d) => {
        if (cancelled) return
        setData(d)
        setUsage({ usedBytes: d.usedBytes, limitBytes: d.limitBytes })
      },
      (e) => !cancelled && setError(e.message),
    )
    return () => {
      cancelled = true
    }
  }, [])

  const remove = async (files) => {
    const used = files.filter((f) => f.usedIn.length || f.pendingPublish)
    const names = used.flatMap((f) => f.usedIn.map((u) => u.title))
    const warning = used.length
      ? `\n\n${used.length} tệp đang được dùng${names.length ? ` trong: ${[...new Set(names)].join(', ')}` : ''}` +
        `${used.some((f) => f.pendingPublish) ? ' (kể cả yêu cầu xuất bản đang chờ duyệt)' : ''}. ` +
        'Những chỗ đó sẽ báo "không còn tồn tại" cho tới khi bạn chọn tệp khác.'
      : ''
    const what = files.length === 1 ? `"${files[0].name}"` : `${files.length} tệp`
    if (!confirm(`Xoá ${what} (${formatBytes(files.reduce((s, f) => s + f.size, 0))})? Không thể hoàn tác.${warning}`)) return
    setBusy(files.length === 1 ? files[0].path : 'many')
    setError('')
    try {
      const result = await deleteMyFiles(files.map((f) => f.path))
      const gone = new Set(files.map((f) => f.path))
      setData((d) => ({ ...d, usedBytes: result.usedBytes, limitBytes: result.limitBytes, files: d.files.filter((f) => !gone.has(f.path)) }))
      setSelected((cur) => new Set([...cur].filter((p) => !gone.has(p))))
      setUsage({ usedBytes: result.usedBytes, limitBytes: result.limitBytes })
      if (result.failed) setError(`Không xoá được ${result.failed} tệp, hãy thử lại.`)
    } catch (e) {
      setError(e.message)
      refreshUsage()
    } finally {
      setBusy(null)
    }
  }

  const unused = data?.files.filter((f) => !f.usedIn.length && !f.pendingPublish) ?? []
  const picked = (data?.files ?? []).filter((f) => selected.has(f.path))
  const shown = (data?.files ?? [])
    .filter((f) => kind === 'all' || (kind === 'unused' ? unused.includes(f) : f.kind === kind))
    .sort((a, b) => (sort === 'big' ? b.size - a.size : (b.createdAt ?? '').localeCompare(a.createdAt ?? '')))

  return (
    <div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal modal-wide storage-dialog" role="dialog" aria-label="Dung lượng đã dùng" onKeyDown={(e) => e.key === 'Escape' && !busy && onClose()}>
        <div className="storage-head">
          <h3>Dung lượng đã dùng</h3>
          <button type="button" className="icon-btn" title="Đóng" onClick={onClose} disabled={!!busy}>
            <Icon name="close" size={16} />
          </button>
        </div>

        {data && (
          <div className="storage-summary">
            <strong>
              {formatBytes(data.usedBytes)} / {formatBytes(data.limitBytes)}
            </strong>
            <span>
              {Math.round(pct(data))}% · {data.files.length} tệp
            </span>
            <UsageBar usage={data} />
          </div>
        )}
        {error && <p className="warn">{error}</p>}
        {!data && !error && <p className="hint">Đang tải danh sách tệp…</p>}

        {data && (
          <>
            <div className="storage-tools">
              <div className="seg seg-sm">
                {KINDS.map(([v, label]) => (
                  <button key={v} type="button" className={kind === v ? 'active' : ''} onClick={() => setKind(v)}>
                    {label}
                  </button>
                ))}
              </div>
              <select className="input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sắp xếp">
                {SORTS.map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {shown.length > 0 && (
              <div className="storage-select">
                <label className="check">
                  <input
                    type="checkbox"
                    checked={shown.every((f) => selected.has(f.path))}
                    // Some but not all of the visible files ticked.
                    ref={(node) => node && (node.indeterminate = shown.some((f) => selected.has(f.path)) && !shown.every((f) => selected.has(f.path)))}
                    onChange={(e) =>
                      setSelected((cur) => {
                        const next = new Set(cur)
                        shown.forEach((f) => (e.target.checked ? next.add(f.path) : next.delete(f.path)))
                        return next
                      })
                    }
                  />
                  Chọn tất cả{kind !== 'all' ? ' (đang lọc)' : ''}
                </label>
                {picked.length > 0 && (
                  <>
                    <button type="button" className="btn danger-btn" onClick={() => remove(picked)} disabled={!!busy}>
                      <Icon name="trash" size={14} />
                      {busy === 'many' ? 'Đang xoá…' : `Xoá ${picked.length} tệp đã chọn (${formatBytes(picked.reduce((s, f) => s + f.size, 0))})`}
                    </button>
                    <button type="button" className="btn ghost" onClick={() => setSelected(new Set())} disabled={!!busy}>
                      Bỏ chọn
                    </button>
                  </>
                )}
              </div>
            )}
            {unused.length > 0 && !picked.length && (
              <button type="button" className="btn block" onClick={() => remove(unused)} disabled={!!busy}>
                <Icon name="trash" size={14} />
                {busy === 'many' ? 'Đang xoá…' : `Xoá ${unused.length} tệp không dùng (${formatBytes(unused.reduce((s, f) => s + f.size, 0))})`}
              </button>
            )}

            {shown.length ? (
              <ul className="storage-files">
                {shown.map((f) => (
                  <li key={f.path} className={`storage-file${selected.has(f.path) ? ' selected' : ''}`}>
                    <input
                      type="checkbox"
                      className="storage-check"
                      checked={selected.has(f.path)}
                      onChange={() => toggle(f.path)}
                      aria-label={`Chọn ${f.name}`}
                    />
                    <span className="storage-thumb">
                      {f.kind === 'image' && f.url ? <img src={f.url} alt="" loading="lazy" /> : <Icon name={f.kind === 'audio' ? 'audio' : f.kind === 'video' ? 'video' : 'image'} size={18} />}
                    </span>
                    <span className="storage-info">
                      <strong title={f.name}>{f.name}</strong>
                      <small>
                        {formatBytes(f.size)} · {formatTime(f.createdAt && new Date(f.createdAt))}
                      </small>
                      <small className={f.usedIn.length || f.pendingPublish ? 'in-use' : 'unused'}>
                        {f.usedIn.length
                          ? `Đang dùng: ${[...new Set(f.usedIn.map((u) => u.title))].join(', ')}`
                          : f.pendingPublish
                            ? 'Trong yêu cầu xuất bản đang chờ duyệt'
                            : 'Không dùng ở trang nào'}
                      </small>
                    </span>
                    {f.url && (
                      <a className="icon-btn" href={f.url} target="_blank" rel="noopener noreferrer" title="Mở tệp">
                        <Icon name="external" size={15} />
                      </a>
                    )}
                    <button type="button" className="icon-btn danger" title="Xoá tệp" onClick={() => remove([f])} disabled={!!busy}>
                      {busy === f.path ? '…' : <Icon name="trash" size={15} />}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hint">Không có tệp nào.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Small "used / 100 MB" bar (bottom-left); opens the storage dialog. `floating` pins it to the
 * window corner (home screen) instead of the bottom of the editor's side panel.
 */
export default function StorageMeter({ floating = false }) {
  const usage = useStorageUsage()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    refreshUsage()
  }, [])

  const p = pct(usage)
  return (
    <>
      <button
        type="button"
        className={`storage-meter${floating ? ' floating' : ''} ${level(p)}`}
        onClick={() => setOpen(true)}
        title="Xem và quản lý các tệp đã tải lên"
      >
        <span className="storage-meter-text">
          <Icon name="cloud" size={13} />
          {usage ? `${formatBytes(usage.usedBytes)} / ${formatBytes(usage.limitBytes)}` : 'Dung lượng'}
        </span>
        <UsageBar usage={usage} />
      </button>
      {open && <StorageDialog onClose={() => setOpen(false)} />}
    </>
  )
}
