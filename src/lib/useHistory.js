import { useCallback, useRef, useState } from 'react'

const LIMIT = 100
const MERGE_WINDOW = 1000

/**
 * Undo/redo state container.
 * - `set(updater, { merge })`: consecutive calls with the same merge key within 1s collapse into one undo step
 *   (so typing in an input doesn't create one step per keystroke).
 * - `set(updater, { transient: true })`: changes the present without recording history; pair with
 *   `checkpoint()` at the start of a drag so the whole gesture is a single undo step.
 */
export function useHistory(init) {
  const [h, setH] = useState(() => ({ past: [], present: init(), future: [] }))
  const lastMerge = useRef(null)

  const set = useCallback((updater, { transient = false, merge } = {}) => {
    const now = Date.now()
    const prev = lastMerge.current
    const merging = !!merge && prev?.key === merge && now - prev.time < MERGE_WINDOW
    if (!transient) lastMerge.current = merge ? { key: merge, time: now } : null
    setH((cur) => {
      const next = typeof updater === 'function' ? updater(cur.present) : updater
      if (next === cur.present) return cur
      if (transient || merging) return { ...cur, present: next }
      return { past: [...cur.past, cur.present].slice(-LIMIT), present: next, future: [] }
    })
  }, [])

  const checkpoint = useCallback(() => {
    lastMerge.current = null
    setH((cur) => ({ past: [...cur.past, cur.present].slice(-LIMIT), present: cur.present, future: [] }))
  }, [])

  const undo = useCallback(() => {
    lastMerge.current = null
    setH((cur) =>
      cur.past.length
        ? { past: cur.past.slice(0, -1), present: cur.past[cur.past.length - 1], future: [cur.present, ...cur.future] }
        : cur,
    )
  }, [])

  const redo = useCallback(() => {
    lastMerge.current = null
    setH((cur) =>
      cur.future.length
        ? { past: [...cur.past, cur.present], present: cur.future[0], future: cur.future.slice(1) }
        : cur,
    )
  }, [])

  return {
    doc: h.present,
    set,
    checkpoint,
    undo,
    redo,
    canUndo: h.past.length > 0,
    canRedo: h.future.length > 0,
  }
}
