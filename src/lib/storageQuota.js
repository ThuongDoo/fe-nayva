import { useSyncExternalStore } from 'react'
import { getMyUsage } from './api.js'

/**
 * The signed-in user's upload usage (`{ usedBytes, limitBytes }`, or null until known), shared by the
 * storage meter and the upload functions. The backend is the source of truth; after an upload the
 * size is added right away and the real figure fetched in the background.
 */
let usage = null
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())

export function setUsage(next) {
  usage = next
  emit()
}

export async function refreshUsage() {
  try {
    setUsage(await getMyUsage())
  } catch (e) {
    console.warn('Không lấy được dung lượng đã dùng', e)
  }
  return usage
}

export class QuotaError extends Error {
  constructor(limitBytes) {
    super(`Bạn đã dùng hết ${Math.round(limitBytes / 1048576)} MB dung lượng. Hãy xoá bớt tệp trong mục "Dung lượng" (góc trái dưới).`)
    this.name = 'QuotaError'
  }
}

/** Throws QuotaError if adding `bytes` would go over the limit. Unknown usage (backend down) lets it through; the Storage rules still apply. */
export async function ensureRoom(bytes) {
  const u = usage ?? (await refreshUsage())
  if (u && u.usedBytes + bytes > u.limitBytes) throw new QuotaError(u.limitBytes)
}

/** Counts a finished upload immediately, then syncs with the backend (which also updates the rules' figure). */
export function noteUploaded(bytes) {
  if (usage) setUsage({ ...usage, usedBytes: usage.usedBytes + bytes })
  refreshUsage()
}

const subscribe = (cb) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export const useStorageUsage = () => useSyncExternalStore(subscribe, () => usage)

export const formatBytes = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)
