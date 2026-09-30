import { useSyncExternalStore } from 'react'

/**
 * Uploads in progress, shown where they will land: on the element being given a file (`elementId`),
 * or as a placeholder box on the page for images still on their way (`rect`, in page coordinates).
 * `progress` is null while the file is being prepared (resized), then 0…1 as it uploads.
 */
let uploads = []
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())
let nextId = 1

/** Registers an upload; returns `{ progress(fraction), done() }` to report on it. */
export function startUpload({ elementId = null, rect = null, label = '' } = {}) {
  const id = nextId++
  uploads = [...uploads, { id, elementId, rect, label, progress: null }]
  emit()
  return {
    progress(fraction) {
      uploads = uploads.map((u) => (u.id === id ? { ...u, progress: Math.max(0, Math.min(1, fraction)) } : u))
      emit()
    },
    done() {
      uploads = uploads.filter((u) => u.id !== id)
      emit()
    },
  }
}

const subscribe = (cb) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** Current uploads; re-renders the caller whenever one starts, advances or ends. */
export const useUploads = () => useSyncExternalStore(subscribe, () => uploads)
