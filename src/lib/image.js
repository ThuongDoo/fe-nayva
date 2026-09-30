function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Không tải được ảnh'))
    img.src = src
  })
}

export async function loadImageSize(src) {
  const img = await loadImage(src)
  return { width: img.naturalWidth || 300, height: img.naturalHeight || 200 }
}

/**
 * Reads an image file into a blob ready to upload, downscaling large photos. SVG/GIF are kept
 * as-is (re-encoding would lose vectors/animation).
 */
export async function readImageFile(file, maxSize = 1600) {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const width = img.naturalWidth || 300
    const height = img.naturalHeight || 200
    const ratio = Math.min(1, maxSize / Math.max(width, height))
    const keepOriginal =
      file.type === 'image/svg+xml' || file.type === 'image/gif' || (ratio === 1 && file.size < 300_000)
    if (keepOriginal) return { blob: file, width, height }

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85))
    if (!blob) throw new Error('Không nén được ảnh')
    return { blob, width: canvas.width, height: canvas.height }
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Largest video accepted in a shape; the Storage rules enforce the same limit. */
export const MAX_VIDEO_BYTES = 30 * 1024 * 1024

/** Natural size of a video file (read from its metadata, nothing is decoded): `{ width, height }`. */
export function readVideoSize(file) {
  const url = URL.createObjectURL(file)
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.onloadedmetadata = () => resolve({ width: video.videoWidth || 1280, height: video.videoHeight || 720 })
    video.onerror = () => reject(new Error('Không đọc được tệp video này'))
    video.src = url
  }).finally(() => URL.revokeObjectURL(url))
}

/** Natural size of a video at a URL (only its metadata is loaded): `{ width, height }`. */
export function loadVideoSize(src) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.onloadedmetadata = () => resolve({ width: video.videoWidth || 1280, height: video.videoHeight || 720 })
    video.onerror = () => reject(new Error('Không tải được video'))
    video.src = src
  })
}
