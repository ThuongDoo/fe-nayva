import { TEXT_TYPES } from './elements.js'
import { DECORS } from './decor.js'
import { ROUNDABLE_SHAPES } from './shapes.js'

/**
 * What the quick toolbar (QuickToolbar.jsx) edits for this element. The properties panel leaves these
 * out so every setting lives in one place — keep it in step with the toolbar's controls.
 */
export function quickFields(el) {
  const p = el.props
  const keys = ['opacity', 'motion', 'duplicate', 'delete']
  if (TEXT_TYPES.includes(el.type)) {
    keys.push('fontFamily', 'fontSize', 'italic', 'underline', 'color', 'background', 'textAlign', 'lineHeight', 'letterSpacing')
  } else if (el.type === 'box' || el.type === 'video') {
    keys.push('background', 'radius')
  } else if (el.type === 'image') {
    keys.push('radius', 'flip')
  } else if (el.type === 'shape') {
    keys.push('background', 'flip')
    if (p.src) keys.push('crop')
    if (p.rim > 0) keys.push('rimColor')
    if (ROUNDABLE_SHAPES.includes(p.shape)) keys.push('cornerRadius')
  } else if (el.type === 'icon') {
    keys.push('icon', 'iconColor', 'background')
  } else if (el.type === 'divider') {
    keys.push('color', 'lineWidth')
  } else if (el.type === 'decor') {
    keys.push('color', 'blend')
    if (!DECORS[p.kind]?.fixed) keys.push('seed')
    if (p.kind === 'ink') keys.push('inkStyle')
    if (p.kind === 'stain') keys.push('stain')
    if (DECORS[p.kind]?.line) keys.push('strokeWidth')
  } else if (el.type === 'audio') {
    keys.push('color', 'color2', 'background')
  }
  return new Set(keys)
}
