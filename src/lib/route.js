import { useSyncExternalStore } from 'react'

/**
 * Minimal hash routing. Using the hash keeps reloads and the browser's back button working
 * without server config.
 *   #/          home screen
 *   #/d/<id>    a design in the editor
 *   #/admin     admin screen (users' designs → templates)
 */
const subscribe = (cb) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

/** `{ name: 'home' | 'design' | 'admin', id? }` for the current URL. */
export function useRoute() {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  const design = /^#\/d\/([\w-]+)$/.exec(hash)
  if (design) return { name: 'design', id: design[1] }
  if (hash === '#/admin') return { name: 'admin' }
  return { name: 'home' }
}

export const openDesignRoute = (id) => {
  window.location.hash = `/d/${id}`
}

export const goHome = () => {
  window.location.hash = '/'
}

export const goAdmin = () => {
  window.location.hash = '/admin'
}
