import { useState } from 'react'
import Icon from './Icon.jsx'
import { firstColor, gradientCss, parseGradient } from '../lib/gradient.js'

export function Section({ title, children }) {
  return (
    <section className="section">
      <h4>{title}</h4>
      <div className="section-body">{children}</div>
    </section>
  )
}

export function Field({ label, children, className = '' }) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

/** Number input that tolerates transient invalid text (e.g. an empty field while retyping). */
export function NumberInput({ value, onChange, min = -Infinity, max = Infinity, step = 1, suffix }) {
  const [draft, setDraft] = useState(null)
  return (
    <div className="num">
      <input
        className="input"
        type="number"
        value={draft ?? value}
        step={step}
        min={Number.isFinite(min) ? min : undefined}
        max={Number.isFinite(max) ? max : undefined}
        onChange={(e) => {
          setDraft(e.target.value)
          const n = parseFloat(e.target.value)
          if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)))
        }}
        onBlur={() => setDraft(null)}
      />
      {suffix && <span className="suffix">{suffix}</span>}
    </div>
  )
}

const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v)

const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)',
  'linear-gradient(135deg, #34d399 0%, #059669 100%)',
  'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
  'linear-gradient(180deg, #0f172a 0%, #334155 100%)',
  'linear-gradient(90deg, #f43f5e 0%, #f59e0b 50%, #22c55e 100%)',
  'radial-gradient(circle, #fde68a 0%, #f97316 100%)',
]
const MAX_STOPS = 5

/** One colour: picker swatch plus the text value (hex, rgba(), a name…). */
function SolidColor({ value, onChange, allowNone }) {
  return (
    <div className="color">
      <span className="swatch">
        <span style={{ background: value }} />
        <input type="color" value={isHex(value) ? value : '#ffffff'} onChange={(e) => onChange(e.target.value)} />
      </span>
      <input className="input" type="text" value={value} spellCheck={false} onChange={(e) => onChange(e.target.value)} />
      {allowNone && (
        <button
          type="button"
          className={`icon-btn sm${value === 'transparent' ? ' on' : ''}`}
          title="Trong suốt"
          onClick={() => onChange('transparent')}
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  )
}

function GradientEditor({ gradient, onChange }) {
  const { type, angle, stops } = gradient
  const update = (patch) => onChange({ ...gradient, ...patch })
  const setStop = (i, patch) => update({ stops: stops.map((s, j) => (j === i ? { ...s, ...patch } : s)) })

  const addStop = () => {
    // New stop in the middle of the widest gap, so it is visible straight away.
    const sorted = [...stops].sort((a, b) => a.pos - b.pos)
    let at = 50
    let widest = -1
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1].pos - sorted[i].pos
      if (gap > widest) {
        widest = gap
        at = Math.round(sorted[i].pos + gap / 2)
      }
    }
    update({ stops: [...stops, { color: '#ffffff', pos: at }] })
  }

  return (
    <div className="gradient-editor">
      <div className="gradient-bar" style={{ background: gradientCss(gradient) }} />
      <div className="gradient-presets">
        {GRADIENT_PRESETS.map((css) => (
          <button key={css} type="button" style={{ background: css }} title="Dùng mẫu này" onClick={() => onChange(parseGradient(css))} />
        ))}
      </div>
      <div className="seg">
        <button type="button" className={type === 'linear' ? 'active' : ''} onClick={() => update({ type: 'linear' })}>
          Tuyến tính
        </button>
        <button type="button" className={type === 'radial' ? 'active' : ''} onClick={() => update({ type: 'radial' })}>
          Toả tròn
        </button>
      </div>
      {type === 'linear' && (
        <div className="slider">
          <input type="range" min={0} max={360} value={angle} onChange={(e) => update({ angle: Number(e.target.value) })} />
          <span>{angle}°</span>
        </div>
      )}
      {stops.map((s, i) => (
        <div key={i} className="gradient-stop">
          <span className="swatch">
            <span style={{ background: s.color }} />
            <input type="color" value={isHex(s.color) ? s.color : '#ffffff'} onChange={(e) => setStop(i, { color: e.target.value })} />
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={s.pos}
            title="Vị trí điểm màu"
            onChange={(e) => setStop(i, { pos: Number(e.target.value) })}
          />
          <span className="gradient-pos">{s.pos}%</span>
          <button
            type="button"
            className="icon-btn sm"
            title="Xoá điểm màu"
            disabled={stops.length <= 2}
            onClick={() => update({ stops: stops.filter((_, j) => j !== i) })}
          >
            <Icon name="close" size={12} />
          </button>
        </div>
      ))}
      {stops.length < MAX_STOPS && (
        <button type="button" className="btn block" onClick={addStop}>
          <Icon name="plus" size={14} />
          Thêm điểm màu
        </button>
      )}
    </div>
  )
}

/**
 * Colour field: a solid colour or, when `allowGradient`, a linear/radial gradient. Either way the
 * value is a CSS string, so it can go straight into a style.
 */
export function ColorInput({ value, onChange, allowNone = false, allowGradient = true }) {
  const gradient = parseGradient(value)
  if (!allowGradient) return <SolidColor value={value} onChange={onChange} allowNone={allowNone} />

  const toGradient = () => {
    const start = isHex(value) ? value : '#6366f1'
    onChange(gradientCss({ type: 'linear', angle: 135, stops: [{ color: start, pos: 0 }, { color: '#ec4899', pos: 100 }] }))
  }

  return (
    <div className="color-field">
      <div className="seg seg-sm">
        <button type="button" className={gradient ? '' : 'active'} onClick={() => gradient && onChange(firstColor(value))}>
          Đơn sắc
        </button>
        <button type="button" className={gradient ? 'active' : ''} onClick={() => !gradient && toGradient()}>
          Chuyển màu
        </button>
      </div>
      {gradient ? (
        <GradientEditor gradient={gradient} onChange={(g) => onChange(gradientCss(g))} />
      ) : (
        <SolidColor value={value} onChange={onChange} allowNone={allowNone} />
      )}
    </div>
  )
}

export function Segmented({ value, options, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          title={o.title}
          className={value === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.icon ? <Icon name={o.icon} size={15} /> : o.label}
        </button>
      ))}
    </div>
  )
}

export function Select({ value, options, onChange }) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  )
}
