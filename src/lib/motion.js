/**
 * Looping motion effects of an element (its `motion` field): { kind, duration (s), delay (s), reverse }.
 * The effect runs on a box inside the element's positioned wrapper, so it adds to the element's own
 * rotation / mirroring, and spins or scales around the element's centre.
 */
export const MOTIONS = {
  spin: { label: 'Xoay tròn', duration: 6, timing: 'linear', turns: true },
  flip: { label: 'Lật xoay (3D)', duration: 4, timing: 'linear', turns: true },
  pulse: { label: 'Phập phồng', duration: 2, timing: 'ease-in-out' },
  heartbeat: { label: 'Nhịp tim', duration: 1.4, timing: 'ease-in-out' },
  float: { label: 'Bay lơ lửng', duration: 3, timing: 'ease-in-out' },
  bounce: { label: 'Nảy', duration: 1.6, timing: 'ease-in-out' },
  swing: { label: 'Lắc lư', duration: 2, timing: 'ease-in-out' },
  shake: { label: 'Rung', duration: 0.8, timing: 'ease-in-out' },
  blink: { label: 'Nhấp nháy', duration: 1.6, timing: 'ease-in-out' },
  // Grows and fades out, like a ring of sound: stagger a few rings with delays.
  ripple: { label: 'Sóng toả', duration: 3, timing: 'ease-out' },
  // Stretches up and down along its height, like an equalizer bar.
  equalizer: { label: 'Nhảy theo nhạc', duration: 0.9, timing: 'ease-in-out' },
}

const clampNum = (v, min, max, fallback) => (Number.isFinite(Number(v)) ? Math.min(max, Math.max(min, Number(v))) : fallback)

/** A valid motion for `kind` (defaults filled in), or null for none / unknown kinds. */
export function normalizeMotion(m) {
  const def = m && MOTIONS[m.kind]
  if (!def) return null
  return {
    kind: m.kind,
    duration: clampNum(m.duration, 0.2, 60, def.duration),
    delay: clampNum(m.delay, 0, 30, 0),
    reverse: Boolean(m.reverse),
  }
}

/** A fresh motion of `kind` with its default speed, or null for 'none'. */
export const motionOf = (kind) => (MOTIONS[kind] ? { kind, duration: MOTIONS[kind].duration, delay: 0, reverse: false } : null)

/** Inline style of the motion box, or undefined when the element doesn't move. */
export function motionStyle(motion) {
  const m = normalizeMotion(motion)
  if (!m) return undefined
  const def = MOTIONS[m.kind]
  return {
    width: '100%',
    height: '100%',
    animation: `kt-${m.kind} ${m.duration}s ${def.timing} ${m.delay}s infinite ${m.reverse ? 'reverse' : 'normal'} both`,
  }
}

/** Keyframes of every motion, plus switching them off for visitors who ask for less motion. */
export const MOTION_CSS = `@keyframes kt-spin { to { transform: rotate(360deg) } }
@keyframes kt-flip { from { transform: perspective(800px) rotateY(0) } to { transform: perspective(800px) rotateY(360deg) } }
@keyframes kt-pulse { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.08) } }
@keyframes kt-heartbeat { 0%, 40%, 100% { transform: scale(1) } 12%, 30% { transform: scale(1.14) } 20% { transform: scale(1.02) } }
@keyframes kt-float { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-12px) } }
@keyframes kt-bounce { 0%, 100% { transform: translateY(0) } 30% { transform: translateY(-22px) } 50% { transform: translateY(0) } 65% { transform: translateY(-8px) } 80% { transform: translateY(0) } }
@keyframes kt-swing { 0%, 100% { transform: rotate(-8deg) } 50% { transform: rotate(8deg) } }
@keyframes kt-shake { 0%, 100% { transform: translateX(0) } 20%, 60% { transform: translateX(-5px) } 40%, 80% { transform: translateX(5px) } }
@keyframes kt-blink { 0%, 100% { opacity: 1 } 50% { opacity: 0.25 } }
@keyframes kt-ripple { from { transform: scale(0.8); opacity: 0.9 } to { transform: scale(1.7); opacity: 0 } }
@keyframes kt-equalizer { 0%, 100% { transform: scaleY(0.3) } 50% { transform: scaleY(1) } }
@media (prefers-reduced-motion: reduce) { .kt-motion { animation: none !important } }`

/** Whether any shown element of the page moves. */
export const hasMotion = (elements) => elements.some((el) => !el.hidden && normalizeMotion(el.motion))
