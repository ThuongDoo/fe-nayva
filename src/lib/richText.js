/**
 * Coloured stretches inside a text element, like recolouring a few selected words in Word.
 *
 * The text itself stays plain (`props.text`); `props.marks` lists the stretches that have their own
 * solid colour: `[{ start, end, color }]`, character offsets into the text (end exclusive), sorted and
 * never overlapping. Everything else in the text uses the element's colour (which may be a gradient).
 */

const sameColor = (a, b) => String(a).toLowerCase() === String(b).toLowerCase()

/** Only plain colours: a mark's colour is written straight into the published page's CSS. */
export const isSafeColor = (c) => /^#[0-9a-f]{3,8}$/i.test(c) || /^rgba?\([\d\s.,%]+\)$/i.test(c)

/** Sorted, clipped to the text, without empty marks, neighbours of one colour joined. */
export function tidyMarks(marks = [], length = Infinity) {
  const out = []
  for (const m of [...marks].sort((a, b) => a.start - b.start)) {
    const start = Math.max(0, Math.min(length, m.start))
    const end = Math.max(start, Math.min(length, m.end))
    if (end <= start || !isSafeColor(m.color)) continue
    const last = out[out.length - 1]
    if (last && last.end >= start && sameColor(last.color, m.color)) last.end = Math.max(last.end, end)
    else out.push({ start, end, color: m.color })
  }
  return out
}

/** The marks with [start, end) taken out of them (a mark across the range is split in two). */
export function clearRange(marks = [], start, end) {
  const out = []
  for (const m of marks) {
    if (m.end <= start || m.start >= end) out.push({ ...m })
    else {
      if (m.start < start) out.push({ ...m, end: start })
      if (m.end > end) out.push({ ...m, start: end })
    }
  }
  return out
}

/** Gives [start, end) its own colour. */
export const paintRange = (marks, start, end, color) => tidyMarks([...clearRange(marks, start, end), { start, end, color }])

/** The colour of the first character of [start, end), or null when it uses the element's colour. */
export function colorAt(marks = [], start) {
  const color = marks.find((m) => m.start <= start && start < m.end)?.color
  return color && isSafeColor(color) ? color : null
}

/**
 * Keeps marks on the same words after the text was edited as a whole (e.g. in the properties panel):
 * the changed stretch is found from the common start and end of the two texts.
 */
export function shiftMarks(before = '', after = '', marks = []) {
  if (!marks.length || before === after) return marks
  let head = 0
  while (head < before.length && head < after.length && before[head] === after[head]) head++
  let tail = 0
  while (tail < before.length - head && tail < after.length - head && before[before.length - 1 - tail] === after[after.length - 1 - tail]) tail++
  const oldEnd = before.length - tail
  const newEnd = after.length - tail
  const delta = after.length - before.length
  // Text typed right before a coloured stretch stays uncoloured; an edit inside a stretch stays in it.
  const moveStart = (i) => (i >= oldEnd ? i + delta : i <= head ? i : newEnd)
  const moveEnd = (i) => (i <= head ? i : i >= oldEnd ? i + delta : head)
  return tidyMarks(marks.map((m) => ({ ...m, start: moveStart(m.start), end: moveEnd(m.end) })), after.length)
}

/**
 * The text cut into pieces at every mark (and at `highlight`, a { start, end } shown as selected):
 * `[{ text, color, highlight }]`, color null for the element's own colour.
 */
export function textSegments(text = '', marks = [], highlight = null) {
  const cuts = new Set([0, text.length])
  for (const m of marks) cuts.add(m.start).add(m.end)
  if (highlight) cuts.add(highlight.start).add(highlight.end)
  const points = [...cuts].filter((i) => i >= 0 && i <= text.length).sort((a, b) => a - b)
  const out = []
  for (let i = 0; i < points.length - 1; i++) {
    const [a, b] = [points[i], points[i + 1]]
    if (b <= a) continue
    out.push({
      text: text.slice(a, b),
      color: colorAt(marks, a),
      highlight: !!highlight && a >= highlight.start && b <= highlight.end,
    })
  }
  return out
}

export const hasMarks = (p) => Array.isArray(p.marks) && p.marks.length > 0
