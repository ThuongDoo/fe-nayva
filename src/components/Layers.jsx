import Icon from './Icon.jsx'
import { TEXT_TYPES, elementLabel } from '../lib/elements.js'

function layerName(el) {
  if (TEXT_TYPES.includes(el.type) && el.props.text) {
    const t = el.props.text.replace(/\s+/g, ' ').trim()
    return t.length > 28 ? t.slice(0, 28) + '…' : t
  }
  return elementLabel(el)
}

export default function Layers({ elements, selectedId, onSelect, onToggle }) {
  if (!elements.length) return <p className="empty-note">Chưa có phần tử nào trên trang.</p>

  // Topmost element first, like most design tools.
  const items = [...elements].reverse()
  return (
    <ul className="layers">
      {items.map((el) => (
        <li
          key={el.id}
          className={`layer${el.id === selectedId ? ' active' : ''}${el.hidden ? ' is-hidden' : ''}`}
          onClick={() => onSelect(el.id)}
        >
          <Icon name={el.type} />
          <span className="layer-name">{layerName(el)}</span>
          <button
            type="button"
            className={`icon-btn sm${el.hidden ? ' on' : ''}`}
            title={el.hidden ? 'Hiện' : 'Ẩn'}
            onClick={(e) => {
              e.stopPropagation()
              onToggle(el.id, 'hidden')
            }}
          >
            <Icon name={el.hidden ? 'eyeOff' : 'eye'} size={14} />
          </button>
          <button
            type="button"
            className={`icon-btn sm${el.locked ? ' on' : ''}`}
            title={el.locked ? 'Mở khoá' : 'Khoá'}
            onClick={(e) => {
              e.stopPropagation()
              onToggle(el.id, 'locked')
            }}
          >
            <Icon name={el.locked ? 'lock' : 'unlock'} size={14} />
          </button>
        </li>
      ))}
    </ul>
  )
}
