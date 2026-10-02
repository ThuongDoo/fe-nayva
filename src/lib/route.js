import { useSyncExternalStore } from 'react'

/**
 * Minimal hash routing. Using the hash keeps reloads and the browser's back button working
 * without server config.
 *   #/          home screen
 *   #/d/<id>         one of the user's designs in the editor
 *   #/d/<uid>/<id>   a design of user <uid>, opened through its share link (see shareLink)
 *   #/admin          admin screen (users' designs → templates)
 */
const subscribe = (cb) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

/** `{ name: 'home' | 'design' | 'admin', id?, owner? }` for the current URL; `owner` only in share links. */
export function useRoute() {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  const design = /^#\/d\/(?:([\w-]+)\/)?([\w-]+)$/.exec(hash)
  if (design) return { name: 'design', owner: design[1] ?? null, id: design[2] }
  if (hash === '#/admin') return { name: 'admin' }
  return { name: 'home' }
}

export const openDesignRoute = (id) => {
  window.location.hash = `/d/${id}`
}

/** The link that opens design `id` of user `uid` in the editor for whoever has it (when it is shared). */
export const shareLink = (uid, id) => `${window.location.origin}${window.location.pathname}#/d/${uid}/${id}`

export const goHome = () => {
  window.location.hash = '/'
}

export const goAdmin = () => {
  window.location.hash = '/admin'
}
