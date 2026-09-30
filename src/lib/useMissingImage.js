import { useEffect, useState } from 'react'

/**
 * True once `src` failed to load, e.g. because the file was deleted from Firebase Storage. Lets the
 * editor show "image no longer exists" instead of a broken image.
 */
export function useMissingImage(src) {
  // Holds the src that failed, so a new src starts out as "fine" without resetting state in an effect.
  const [failed, setFailed] = useState(null)
  useEffect(() => {
    if (!src) return
    let cancelled = false
    const img = new Image()
    img.onerror = () => !cancelled && setFailed(src)
    img.src = src
    return () => {
      cancelled = true
    }
  }, [src])
  return !!src && failed === src
}
