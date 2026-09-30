const R = 16
const CIRCUMFERENCE = 2 * Math.PI * R

/**
 * Progress ring for an upload: spins while the file is being prepared (`progress` null), then fills
 * up as it uploads. `compact` is the small version for buttons.
 */
export default function UploadIndicator({ progress, label, compact = false }) {
  const known = progress !== null && progress !== undefined
  const pct = known ? Math.round(progress * 100) : null
  const ring = (
    <svg className={`upload-ring${known ? '' : ' spinning'}`} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r={R} className="upload-ring-track" />
      <circle
        cx="20"
        cy="20"
        r={R}
        className="upload-ring-fill"
        strokeDasharray={CIRCUMFERENCE}
        // Unknown progress shows a quarter arc that spins.
        strokeDashoffset={CIRCUMFERENCE * (1 - (known ? Math.max(progress, 0.02) : 0.25))}
      />
    </svg>
  )
  if (compact) return <span className="upload-compact">{ring}</span>
  return (
    <div className="upload-indicator" role="status" aria-live="polite">
      {ring}
      <span>{known ? `${label || 'Đang tải lên'} ${pct}%` : 'Đang xử lý…'}</span>
    </div>
  )
}
