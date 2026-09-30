/**
 * Published sites run for a 3-day trial after approval, then until an admin extends them by 3, 6 or 12
 * months once the user has paid (nayva-be/src/services/siteExpiry.service.js). Helpers to show that.
 */

export const TRIAL_DAYS = 3
const DAY_MS = 86_400_000

export const formatDate = (date) => date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

/**
 * `{ end, expired, days, trial, tone, label }` for a site from the backend, or null when it has no end
 * date (published before expiry existed). `tone`: 'bad' expired, 'wait' ending within 3 days, 'ok'.
 */
export function siteExpiry(site) {
  if (!site?.expiresAt) return null
  const end = new Date(site.expiresAt)
  const left = end.getTime() - Date.now()
  const expired = !!site.expired || left <= 0
  const days = Math.max(0, Math.ceil(left / DAY_MS))
  // Revocations are in the history too (months 0); only real extensions end the trial.
  const trial = !site.extensions?.some((e) => e.months > 0)
  let label
  if (expired) label = `Đã hết hạn (${formatDate(end)})`
  else if (left < DAY_MS) label = 'Hết hạn trong hôm nay'
  else label = `Còn ${days} ngày (đến ${formatDate(end)})`
  return { end, expired, days, trial, tone: expired ? 'bad' : days <= TRIAL_DAYS ? 'wait' : 'ok', label }
}

/** `date` plus `months` calendar months, staying on the last day when the target month is shorter (as the backend does). */
export function addMonths(date, months) {
  const d = new Date(date)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()))
  return d
}

/** Where an extension by `months` would take the site: counted from its end, or from now if that passed. */
export const extendedEnd = (site, months) =>
  addMonths(new Date(Math.max(Date.now(), site?.expiresAt ? new Date(site.expiresAt).getTime() : 0)), months)
