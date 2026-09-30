import { useState } from 'react'
import { stripDiacritics } from './slug.js'

/** Filtering for the admin lists (search, status, time window, sort); the bar itself is AdminFilters.jsx. */

const DAY_MS = 86_400_000
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** Time windows for things that happened (sent, logged in…). */
export const PAST_RANGES = [
  { value: 'all', label: 'Mọi lúc' },
  { value: 'today', label: 'Hôm nay' },
  { value: '7d', label: '7 ngày qua' },
  { value: '30d', label: '30 ngày qua' },
  { value: 'month', label: 'Tháng này' },
  { value: 'custom', label: 'Tuỳ chọn…' },
]

/** Time windows for things still to come (site expiry). */
export const FUTURE_RANGES = [
  { value: 'all', label: 'Mọi lúc' },
  { value: 'next3', label: 'Trong 3 ngày tới' },
  { value: 'next7', label: 'Trong 7 ngày tới' },
  { value: 'next30', label: 'Trong 30 ngày tới' },
  { value: 'past', label: 'Đã qua' },
  { value: 'custom', label: 'Tuỳ chọn…' },
]

/** Whether `date` (Date, ISO string or null) falls in the chosen window. Items without a date only match "Mọi lúc". */
function inRange(date, { range, from, to }) {
  if (range === 'all') return true
  if (!date) return false
  const t = new Date(date).getTime()
  const now = Date.now()
  const today = startOfDay(new Date()).getTime()
  switch (range) {
    case 'today':
      return t >= today
    case '7d':
      return t >= now - 7 * DAY_MS
    case '30d':
      return t >= now - 30 * DAY_MS
    case 'month': {
      const d = new Date()
      return t >= new Date(d.getFullYear(), d.getMonth(), 1).getTime()
    }
    case 'next3':
    case 'next7':
    case 'next30':
      return t >= now && t <= now + Number(range.slice(4)) * DAY_MS
    case 'past':
      return t < now
    case 'custom':
      return (!from || t >= new Date(`${from}T00:00:00`).getTime()) && (!to || t < new Date(`${to}T00:00:00`).getTime() + DAY_MS)
    default:
      return true
  }
}

const normalize = (s) => stripDiacritics(String(s ?? '')).toLowerCase()

/**
 * Filter state for an admin list: a search box, status chips, a time window and a sort order. Returns
 * `{ filters, apply, active, reset }`; `apply(items)` filters and sorts with the given accessors.
 */
export function useAdminFilters({ status = 'all', range = 'all', sort = 'new' } = {}) {
  const initial = { search: '', status, range, from: '', to: '', sort }
  const [filters, setFilters] = useState(initial)
  const active = filters.search.trim() !== '' || filters.status !== status || filters.range !== range || filters.sort !== sort
  return {
    filters,
    set: (patch) => setFilters((f) => ({ ...f, ...patch })),
    reset: () => setFilters(initial),
    active,
    /**
     * `text(item)`: strings to search in; `date(item)`: the date the time window and sort use;
     * `status(item, value)`: whether the item matches a status chip (skipped when omitted).
     */
    apply(items, { text, date, status: matches }) {
      const q = normalize(filters.search.trim())
      const out = items.filter(
        (it) =>
          (!q || text(it).some((v) => normalize(v).includes(q))) &&
          (!matches || filters.status === 'all' || matches(it, filters.status)) &&
          inRange(date(it), filters),
      )
      const time = (it) => (date(it) ? new Date(date(it)).getTime() : null)
      return out.sort((a, b) => {
        const ta = time(a)
        const tb = time(b)
        if (ta === tb) return 0
        if (ta === null) return 1 // Undated items last either way.
        if (tb === null) return -1
        return filters.sort === 'new' ? tb - ta : ta - tb
      })
    },
  }
}
