import Icon from './Icon.jsx'
import { PAST_RANGES } from '../lib/adminFilters.js'

/**
 * The filter bar: search, status chips (`statuses`: [{ value, label }], optional), a time window over
 * `dateLabel` (`ranges`: PAST_RANGES or FUTURE_RANGES, or null for none) with custom dates, sort order,
 * and a result count.
 */
export default function AdminFilterBar({ f, statuses, ranges = PAST_RANGES, dateLabel = 'Thời gian', sortLabels = ['Mới nhất', 'Cũ nhất'], placeholder, shown, total }) {
  const { filters, set } = f
  return (
    <div className="admin-filters">
      <div className="admin-filters-row">
        <label className="admin-search">
          <Icon name="search" size={16} />
          <input
            className="input"
            type="search"
            value={filters.search}
            placeholder={placeholder ?? 'Tìm theo tên, email, tên miền…'}
            onChange={(e) => set({ search: e.target.value })}
          />
        </label>
        {ranges && (
          <>
            <label className="admin-filter-field">
              <span>{dateLabel}</span>
              <select className="input" value={filters.range} onChange={(e) => set({ range: e.target.value })}>
                {ranges.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            {filters.range === 'custom' && (
              <span className="admin-filter-dates">
                <input
                  className="input"
                  type="date"
                  value={filters.from}
                  max={filters.to || undefined}
                  onChange={(e) => set({ from: e.target.value })}
                  aria-label="Từ ngày"
                />
                <span>→</span>
                <input
                  className="input"
                  type="date"
                  value={filters.to}
                  min={filters.from || undefined}
                  onChange={(e) => set({ to: e.target.value })}
                  aria-label="Đến ngày"
                />
              </span>
            )}
            <label className="admin-filter-field">
              <span>Sắp xếp</span>
              <select className="input" value={filters.sort} onChange={(e) => set({ sort: e.target.value })}>
                <option value="new">{sortLabels[0]}</option>
                <option value="old">{sortLabels[1]}</option>
              </select>
            </label>
          </>
        )}
      </div>
      {statuses && (
        <div className="admin-chips" role="radiogroup" aria-label="Trạng thái">
          {statuses.map((s) => (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={filters.status === s.value}
              className={`admin-chip${filters.status === s.value ? ' on' : ''}`}
              onClick={() => set({ status: s.value })}
            >
              {s.label}
              {s.count != null && <span className="admin-chip-count">{s.count}</span>}
            </button>
          ))}
        </div>
      )}
      <div className="admin-filters-foot">
        <span>
          Hiển thị <b>{shown}</b> / {total}
        </span>
        {f.active && (
          <button type="button" className="btn ghost" onClick={f.reset}>
            <Icon name="close" size={14} />
            Xoá bộ lọc
          </button>
        )}
      </div>
    </div>
  )
}
