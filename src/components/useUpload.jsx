import { useState } from 'react'
import { startUpload } from '../lib/uploadProgress.js'

/**
 * State for an upload button: `run(start, elementId)` calls `start(onProgress)` and mirrors its progress
 * both on the button (`label`, `bar`) and, when `elementId` is given, over that element on the page.
 */
export function useUpload() {
  // undefined: idle; null: preparing the file; 0…1: uploading.
  const [progress, setProgress] = useState(undefined)
  const run = async (start, elementId) => {
    const onPage = startUpload({ elementId })
    setProgress(null)
    try {
      return await start((fraction) => {
        setProgress(fraction)
        onPage.progress(fraction)
      })
    } finally {
      onPage.done()
      setProgress(undefined)
    }
  }
  const busy = progress !== undefined
  return {
    busy,
    run,
    label: progress === null ? 'Đang xử lý…' : `Đang tải lên ${Math.round((progress ?? 0) * 100)}%`,
    bar: busy && (
      <span className={`upload-bar${progress === null ? ' preparing' : ''}`} style={{ '--p': progress ?? 0 }} aria-hidden="true" />
    ),
  }
}
