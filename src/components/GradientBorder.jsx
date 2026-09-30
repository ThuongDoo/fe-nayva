import { gradientBorderStyle } from '../lib/gradient.js'

/**
 * Draws an element's gradient border on top of it (CSS borders can't be gradients without losing the
 * rounded corners). Goes inside the element's positioned wrapper; renders nothing for plain borders.
 */
export default function GradientBorder({ el }) {
  const style = gradientBorderStyle(el.style)
  return style ? <span aria-hidden="true" style={style} /> : null
}
