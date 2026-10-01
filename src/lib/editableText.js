import { tidyMarks } from './richText.js'

/**
 * Reading a text element back out of its contentEditable box (see TextBlock): the plain text plus its
 * coloured stretches (richText.js), and where the selection is, in the same character offsets.
 */

const BLOCKS = new Set(['DIV', 'P', 'LI'])

function toHex(color) {
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(color)
  if (!m) return color
  return '#' + m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0')).join('')
}

/** The colour a text node is shown in, from the nearest coloured wrapper inside `root` (null: the element's). */
function colorOf(node, root) {
  for (let n = node.parentNode; n && n !== root; n = n.parentNode) {
    if (n.nodeType !== 1) continue
    // Our own spans carry data-color; the browser may also leave style="color" or <font color> behind.
    const c = n.dataset?.color || n.style?.color || n.getAttribute('color')
    if (c) return toHex(c)
  }
  return null
}

/** { text, marks } of an editable box. Line breaks come from <br> and from the <div>s Enter may add. */
export function readEditable(root) {
  let text = ''
  const marks = []
  const walk = (node) => {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const color = colorOf(child, root)
        if (color && child.data) marks.push({ start: text.length, end: text.length + child.data.length, color })
        text += child.data
      } else if (child.nodeName === 'BR') {
        text += '\n'
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if (BLOCKS.has(child.nodeName) && text && !text.endsWith('\n')) text += '\n'
        walk(child)
      }
    }
  }
  walk(root)
  return { text, marks: tidyMarks(marks, text.length) }
}

/** How many characters of text come before (node, offset) in `root`. */
function offsetOf(root, node, offset) {
  const range = document.createRange()
  range.setStart(root, 0)
  range.setEnd(node, offset)
  const box = document.createElement('div')
  box.appendChild(range.cloneContents())
  return readEditable(box).text.length
}

/**
 * The selected stretch of `root` as { start, end }, null when the caret is in it without a selection,
 * undefined when the selection is somewhere else.
 */
export function selectionOffsets(root) {
  const sel = window.getSelection()
  if (!sel?.rangeCount) return undefined
  const r = sel.getRangeAt(0)
  if (!root.contains(r.startContainer) || !root.contains(r.endContainer)) return undefined
  if (r.collapsed) return null
  return { start: offsetOf(root, r.startContainer, r.startOffset), end: offsetOf(root, r.endContainer, r.endOffset) }
}
