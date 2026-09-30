import { useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { ColorInput, Field, NumberInput, Section, Segmented, Select } from './fields.jsx'
import { quickFields } from '../lib/quickFields.js'
import { DECORS, DECOR_ORDER, WASHI_PATTERNS } from '../lib/decor.js'
import { TEXT_TYPES, elementLabel, scrollLink, scrollLinkY, scrollYHref, youtubeEmbed } from '../lib/elements.js'
import { isUploadedImage, uploadAudio, uploadIcon, uploadImage, uploadVideo } from '../lib/cloud.js'
import { loadImageSize, loadVideoSize } from '../lib/image.js'
import { AUDIO_ORDER, AUDIO_PRESETS } from '../lib/audioViz.js'
import { ICON_LIBRARY } from '../lib/iconLibrary.js'
import { normalizeAngle } from '../lib/geometry.js'
import { useMissingImage } from '../lib/useMissingImage.js'
import { useUpload } from './useUpload.jsx'
import { QuotaError } from '../lib/storageQuota.js'
import { SHAPES, SHAPE_ORDER, TORN_EDGES, randomSeed, shapeImageProps, imageRect, zoomImageAt, IMAGE_FRAME_RESET, IMG_ZOOM_MIN, IMG_ZOOM_MAX } from '../lib/shapes.js'

const WEIGHTS = [
  [300, 'Mảnh'],
  [400, 'Thường'],
  [500, 'Vừa'],
  [600, 'Đậm vừa'],
  [700, 'Đậm'],
  [800, 'Rất đậm'],
]
const SHADOWS = [
  ['none', 'Không'],
  ['sm', 'Nhẹ'],
  ['md', 'Vừa'],
  ['lg', 'Đậm'],
]
const LINE_STYLES = [
  ['solid', 'Liền'],
  ['dashed', 'Nét đứt'],
  ['dotted', 'Chấm'],
]
const VALIGN = [
  { value: 'top', icon: 'vTop', title: 'Trên' },
  { value: 'middle', icon: 'vMiddle', title: 'Giữa' },
  { value: 'bottom', icon: 'vBottom', title: 'Dưới' },
]
const FITS = [
  { value: 'cover', label: 'Lấp đầy', title: 'Cắt ảnh cho vừa khung' },
  { value: 'contain', label: 'Vừa khung', title: 'Hiện toàn bộ ảnh' },
  { value: 'fill', label: 'Kéo giãn', title: 'Kéo giãn theo khung' },
]

const SHAPE_MEDIA = [
  { value: 'image', label: 'Ảnh' },
  { value: 'video', label: 'Video' },
]

/**
 * What fills an image element or a shape. Shapes can hold an image or a video (muted, looping);
 * both are framed the same way (ImagePositionSection).
 */
function ImageSection({ el, setProps, setGeom }) {
  const fileRef = useRef(null)
  const latestSrc = useRef(el.props.src)
  const upload = useUpload()
  const busy = upload.busy
  const { src, alt, fit } = el.props
  const uploaded = isUploadedImage(src)
  const isShape = el.type === 'shape'
  const video = isShape && el.props.mediaType === 'video'
  const noun = video ? 'video' : 'ảnh'
  const missing = useMissingImage(video ? null : src)
  const [videoFailed, setVideoFailed] = useState(null)

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const start = video ? (onProgress) => uploadVideo(file, { onProgress }) : (onProgress) => uploadImage(file, { onProgress })
      const media = await upload.run(start, el.id)
      latestSrc.current = media.src
      const props = isShape ? shapeImageProps(media, file.name) : { src: media.src, alt: file.name.replace(/\.[^.]+$/, '') }
      setProps({ ...props, alt: alt || props.alt })
    } catch (err) {
      console.error(err)
      alert(err instanceof QuotaError || video ? err.message : 'Không tải được ảnh này lên.')
    }
  }

  const onUrl = (url, mediaType = el.props.mediaType) => {
    latestSrc.current = url
    if (!isShape) return setProps({ src: url }, 'src')
    // Shapes frame their media from its natural size, measured once the URL loads.
    setProps({ src: url, mediaType, imgW: 0, imgH: 0, ...IMAGE_FRAME_RESET }, 'src')
    if (!url) return
    ;(mediaType === 'video' ? loadVideoSize : loadImageSize)(url)
      .then(({ width, height }) => {
        if (latestSrc.current === url) setProps({ imgW: width, imgH: height }, 'src')
      })
      .catch(() => {})
  }

  // Switching between image and video empties the shape: the old file doesn't fit the new kind.
  const setMedia = (mediaType) => {
    if (mediaType !== (el.props.mediaType ?? 'image')) onUrl('', mediaType)
  }

  const matchRatio = async () => {
    try {
      const { width, height } = await loadImageSize(src)
      setGeom({ h: Math.round((el.w * height) / width) })
    } catch {
      alert('Không tải được ảnh để đo tỉ lệ.')
    }
  }

  let preview
  if (!src) preview = <span>Chưa có {noun}</span>
  else if (video) {
    preview =
      videoFailed === src ? (
        <span className="warn">Video không còn tồn tại</span>
      ) : (
        <video src={src} muted loop autoPlay playsInline onError={() => setVideoFailed(src)} ref={(n) => n && (n.muted = true)} />
      )
  } else preview = missing ? <span className="warn">Ảnh không còn tồn tại</span> : <img src={src} alt="" />

  return (
    <Section title={isShape ? 'Ảnh / video trong hình' : 'Hình ảnh'}>
      {isShape && <Segmented value={el.props.mediaType ?? 'image'} options={SHAPE_MEDIA} onChange={setMedia} />}
      <div className="img-preview">{preview}</div>
      {(missing || videoFailed === src) && src && (
        <p className="warn">Tệp này đã bị xoá khỏi kho lưu trữ. Hãy tải {noun} khác lên.</p>
      )}
      <div className="row">
        <button type="button" className="btn upload-btn" onClick={() => fileRef.current?.click()} disabled={busy}>
          <Icon name="upload" size={14} />
          {busy ? upload.label : src ? `Đổi ${noun}` : `Tải ${noun} lên`}
          {upload.bar}
        </button>
        {isShape ? (
          <button type="button" className="btn" onClick={() => onUrl('')} disabled={!src} title={`Bỏ ${noun}, dùng màu nền`}>
            Bỏ {noun}
          </button>
        ) : (
          <button type="button" className="btn" onClick={matchRatio} disabled={!src} title="Đặt chiều cao theo tỉ lệ ảnh gốc">
            Khớp tỉ lệ
          </button>
        )}
      </div>
      <input
        key={video ? 'video' : 'image'}
        ref={fileRef}
        type="file"
        accept={video ? 'video/mp4,video/webm,video/quicktime' : 'image/*'}
        hidden
        onChange={onFile}
      />
      {video && <p className="hint">MP4, WebM hoặc MOV, tối đa 30MB. Video tự phát, tắt tiếng và lặp lại.</p>}
      <Field label={`Hoặc dán đường dẫn ${noun}`}>
        <input
          className="input"
          value={uploaded ? '' : src}
          placeholder={uploaded ? `(đang dùng ${noun} tải lên)` : video ? 'https://.../video.mp4' : 'https://...'}
          onChange={(e) => onUrl(e.target.value.trim())}
        />
      </Field>
      {!isShape && (
        <Field label="Cách hiển thị">
          <Segmented value={fit} options={FITS} onChange={(v) => setProps({ fit: v })} />
        </Field>
      )}
      <Field label={`Mô tả ${noun} (alt)`}>
        <input className="input" value={alt} onChange={(e) => setProps({ alt: e.target.value }, 'alt')} />
      </Field>
    </Section>
  )
}

// Dragging the image on the page ("Chỉnh ảnh" on the quick toolbar, which also measures images added
// before positioning existed) is the main way in; these are the exact values.
function ImagePositionSection({ el, setProps }) {
  const p = el.props
  if (!p.src || !p.imgW) return null
  const noun = p.mediaType === 'video' ? 'video' : 'ảnh'

  // Where the image center sits, in % of the shape (0 = left/top edge, 100 = right/bottom; beyond = outside).
  const r = imageRect(el.w, el.h, p)
  const center = { x: Math.round(((r.x + r.w / 2) / el.w) * 100), y: Math.round(((r.y + r.h / 2) / el.h) * 100) }

  return (
    <Section title={`Vị trí ${noun} trong hình`}>
      <p className="hint">
        Bấm “Chỉnh {noun}” trên thanh công cụ hoặc nhấp đúp vào hình để kéo {noun} trực tiếp trên trang (kéo góc để co giãn, giữ
        Shift để giữ tỉ lệ, cuộn chuột để phóng to/thu nhỏ, Esc để xong).
      </p>
      <Field label="Ngang">
        <RangeInput value={center.x} min={-50} max={150} format={(v) => `${v}%`} onChange={(v) => setProps({ imgCX: v / 100 }, 'imgCX')} />
      </Field>
      <Field label="Dọc">
        <RangeInput value={center.y} min={-50} max={150} format={(v) => `${v}%`} onChange={(v) => setProps({ imgCY: v / 100 }, 'imgCY')} />
      </Field>
      <Field label="Thu phóng">
        <RangeInput
          value={p.imgZoom}
          min={IMG_ZOOM_MIN}
          max={IMG_ZOOM_MAX}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => setProps(zoomImageAt(el.w, el.h, p, v), 'imgZoom')}
        />
      </Field>
      <button type="button" className="btn block" onClick={() => setProps(IMAGE_FRAME_RESET)}>
        Đặt lại vị trí {noun}
      </button>
    </Section>
  )
}

function ShapeSection({ el, setProps }) {
  const p = el.props
  const torn = p.shape === 'torn'
  return (
    <Section title="Hình dạng">
      <Field label="Dạng hình">
        <Select value={p.shape} options={SHAPE_ORDER.map((s) => [s, SHAPES[s].label])} onChange={(v) => setProps({ shape: v })} />
      </Field>
      {torn && (
        <>
          <Field label="Vị trí mép rách">
            <Select value={p.edge} options={TORN_EDGES} onChange={(v) => setProps({ edge: v })} />
          </Field>
          <div className="grid2">
            <Field label="Độ sâu vết rách">
              <NumberInput value={p.depth} min={0} max={80} suffix="px" onChange={(v) => setProps({ depth: v }, 'depth')} />
            </Field>
            <Field label="Cỡ răng cưa">
              <NumberInput value={p.tooth} min={2} max={80} suffix="px" onChange={(v) => setProps({ tooth: v }, 'tooth')} />
            </Field>
          </div>
        </>
      )}
      {(torn || p.shape === 'blob') && (
        <button type="button" className="btn block" onClick={() => setProps({ seed: randomSeed() })}>
          {torn ? 'Xé lại (tạo vết rách khác)' : 'Tạo hình cong khác'}
        </button>
      )}
      {/* Corner rounding and the rim colour are on the quick toolbar. */}
      <Field label={torn ? 'Viền giấy' : 'Viền'}>
        <NumberInput value={p.rim} min={0} max={40} suffix="px" onChange={(v) => setProps({ rim: v }, 'rim')} />
      </Field>
      <label className="check">
        <input type="checkbox" checked={p.texture} onChange={(e) => setProps({ texture: e.target.checked })} />
        Vân giấy
      </label>
      <label className="check">
        <input type="checkbox" checked={p.shadow} onChange={(e) => setProps({ shadow: e.target.checked })} />
        Đổ bóng
      </label>
    </Section>
  )
}

const LINK_KINDS = [
  { value: 'url', label: 'Mở đường dẫn' },
  { value: 'scroll', label: 'Cuộn tới vị trí' },
]

/**
 * What a button / icon button does when clicked: open a URL, or scroll to a point picked on the page
 * (stored in `href` as well, see scrollLink).
 */
function LinkFields({ el, elements, page, setProps, placeholder, picking, onAction }) {
  const p = el.props
  const link = scrollLink(p.href)
  const y = scrollLinkY(link, elements)

  return (
    <>
      <Field label="Khi nhấn">
        <Segmented
          value={link ? 'scroll' : 'url'}
          options={LINK_KINDS}
          onChange={(kind) => {
            if (kind === (link ? 'scroll' : 'url')) return
            setProps({ href: kind === 'scroll' ? scrollYHref(0) : '' })
            // Straight into picking the point on the page.
            if (kind === 'scroll' && !picking) onAction('pickScroll')
          }}
        />
      </Field>
      {link ? (
        <>
          <button type="button" className={`btn block${picking ? ' primary' : ''}`} onClick={() => onAction('pickScroll')} disabled={el.hidden}>
            <Icon name="target" size={14} />
            {picking ? 'Bấm lên trang để chọn… (Esc để huỷ)' : 'Chấm vị trí trên trang'}
          </button>
          <Field label="Vị trí (cách đỉnh trang)">
            <NumberInput value={y ?? 0} min={0} max={page.height} suffix="px" onChange={(v) => setProps({ href: scrollYHref(v) }, 'href')} />
          </Field>
          <p className="hint">Khách bấm vào sẽ được cuộn mượt tới vị trí này (đường gạch cam trên trang). Thử trong Xem trước.</p>
        </>
      ) : (
        <>
          <Field label="Đường dẫn">
            <input className="input" value={p.href} placeholder={placeholder} onChange={(e) => setProps({ href: e.target.value }, 'href')} />
          </Field>
          <label className="check">
            <input type="checkbox" checked={p.newTab} onChange={(e) => setProps({ newTab: e.target.checked })} />
            Mở trong tab mới
          </label>
        </>
      )}
    </>
  )
}

// Colour, "Tạo hình khác", blending and stroke width are on the quick toolbar.
function DecorSection({ el, setProps }) {
  const p = el.props
  return (
    <Section title="Trang trí">
      <Field label="Kiểu">
        <Select value={p.kind} options={DECOR_ORDER.map((k) => [k, DECORS[k].label])} onChange={(v) => setProps({ kind: v })} />
      </Field>
      {p.kind === 'splatter' && (
        <Field label="Mật độ">
          <RangeInput value={p.density} min={8} max={160} format={(v) => `${v} chấm`} onChange={(v) => setProps({ density: v }, 'density')} />
        </Field>
      )}
      {p.kind === 'dots' && (
        <>
          <Field label="Khoảng cách">
            <RangeInput value={p.spacing} min={8} max={80} format={(v) => `${v}px`} onChange={(v) => setProps({ spacing: v }, 'spacing')} />
          </Field>
          <Field label="Cỡ chấm">
            <RangeInput value={p.dotSize} min={1} max={20} step={0.5} format={(v) => `${v}px`} onChange={(v) => setProps({ dotSize: v }, 'dotSize')} />
          </Field>
        </>
      )}
      {p.kind === 'washi' && (
        <Field label="Hoạ tiết">
          <Select value={p.pattern} options={WASHI_PATTERNS} onChange={(v) => setProps({ pattern: v })} />
        </Field>
      )}
      <p className="hint">Kéo góc để co giãn — nét vẽ tự vẽ lại theo khung mới. Đổi màu và “Tạo hình khác” trên thanh công cụ nhỏ.</p>
    </Section>
  )
}

function IconSection({ el, link, setProps }) {
  const p = el.props
  return (
    <>
      {/* Which icon and its colour are picked on the quick toolbar. */}
      <Section title="Icon">
        <Field label="Cỡ icon">
          <RangeInput value={p.iconSize} min={20} max={100} format={(v) => `${v}%`} onChange={(v) => setProps({ iconSize: v }, 'iconSize')} />
        </Field>
        {/* Filled icons (e.g. the Zalo logo) have no stroke to thicken. */}
        {!ICON_LIBRARY[p.icon]?.filled && (
          <Field label="Độ dày nét">
            <RangeInput
              value={p.strokeWidth}
              min={1}
              max={3.5}
              step={0.25}
              format={(v) => String(v)}
              onChange={(v) => setProps({ strokeWidth: v }, 'strokeWidth')}
            />
          </Field>
        )}
      </Section>
      <Section title="Khi bấm">
        <LinkFields el={el} {...link} setProps={setProps} placeholder="https://..., tel:09..., mailto:..." />
        <Field label="Mô tả (cho trình đọc màn hình)">
          <input
            className="input"
            value={p.label}
            placeholder={ICON_LIBRARY[p.icon]?.label}
            onChange={(e) => setProps({ label: e.target.value }, 'label')}
          />
        </Field>
        <p className="hint">Gợi ý: điện thoại dùng <code>tel:0901234567</code>, email dùng <code>mailto:ban@vidu.com</code>.</p>
      </Section>
    </>
  )
}

function AudioSection({ el, setProps }) {
  const fileRef = useRef(null)
  const upload = useUpload()
  const busy = upload.busy
  const p = el.props

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const src = await upload.run((onProgress) => uploadAudio(file, { onProgress }), el.id)
      setProps({ src, name: file.name })
    } catch (err) {
      console.error(err)
      alert(err.message || 'Không tải được tệp âm thanh lên.')
    }
  }

  return (
    <>
      <Section title="Âm thanh">
        <div className="audio-file">
          <Icon name="audio" size={16} />
          <span>{p.src ? p.name || 'Tệp âm thanh' : 'Chưa có tệp'}</span>
        </div>
        <div className="row">
          <button type="button" className="btn upload-btn" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Icon name="upload" size={14} />
            {busy ? upload.label : p.src ? 'Đổi tệp' : 'Tải tệp lên'}
            {upload.bar}
          </button>
          {p.src && (
            <button type="button" className="btn" onClick={() => setProps({ src: '', name: '' })} disabled={busy}>
              Bỏ tệp
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="audio/*" hidden onChange={onFile} />
        <p className="hint">MP3, M4A, OGG, WAV… tối đa 20MB. Bấm nút phát trên trang hoặc ở Xem trước để nghe thử.</p>
        <label className="check">
          <input type="checkbox" checked={p.loop} onChange={(e) => setProps({ loop: e.target.checked })} />
          Phát lặp lại
        </label>
        <label className="check">
          <input type="checkbox" checked={p.autoplay} onChange={(e) => setProps({ autoplay: e.target.checked })} />
          Tự động phát khi mở trang
        </label>
        <label className="check">
          <input type="checkbox" checked={Boolean(p.always)} onChange={(e) => setProps({ always: e.target.checked })} />
          Luôn nhảy (cả khi chưa phát nhạc)
        </label>
        {p.always && !p.src && <p className="hint">Chưa có tệp: sóng nhảy theo nhịp mẫu, chưa có nút phát. Tải nhạc lên để khách bấm nghe.</p>}
        {p.autoplay && (
          <p className="hint">
            Trình duyệt thường chặn tự phát nhạc cho tới khi người xem chạm vào trang; khi đó nhạc bắt đầu ở lần chạm
            đầu tiên. Không tự phát trong trang chỉnh sửa. Nếu trang có nhiều âm thanh, chỉ cái đầu tiên tự phát.
          </p>
        )}
      </Section>
      <Section title="Hiệu ứng">
        <Field label="Kiểu">
          <Select value={p.viz} options={AUDIO_ORDER.map((v) => [v, AUDIO_PRESETS[v].label])} onChange={(v) => setProps({ viz: v })} />
        </Field>
        {/* Its two colours are on the quick toolbar. */}
        <Field label="Số thanh">
          <RangeInput value={p.bars} min={8} max={96} format={(v) => String(v)} onChange={(v) => setProps({ bars: v }, 'bars')} />
        </Field>
        {(p.viz === 'circle' || p.viz === 'pulse') && (
          <Field label="Khoảng trống giữa">
            <RangeInput value={p.inner ?? 20} min={10} max={40} format={(v) => `${v}%`} onChange={(v) => setProps({ inner: v }, 'inner')} />
          </Field>
        )}
      </Section>
    </>
  )
}

function ContentSection({ el, link, setProps, setGeom }) {
  const p = el.props
  if (el.type === 'image') return <ImageSection key={el.id} el={el} setProps={setProps} setGeom={setGeom} />
  if (el.type === 'audio') return <AudioSection el={el} setProps={setProps} />
  if (el.type === 'icon') return <IconSection el={el} link={link} setProps={setProps} />
  if (el.type === 'decor') return <DecorSection el={el} setProps={setProps} />
  if (el.type === 'shape') {
    return (
      <>
        <ImageSection key={el.id} el={el} setProps={setProps} setGeom={setGeom} />
        <ImagePositionSection el={el} setProps={setProps} />
        <ShapeSection el={el} setProps={setProps} />
      </>
    )
  }

  if (el.type === 'video') {
    const valid = !p.url || youtubeEmbed(p.url)
    return (
      <Section title="Video">
        <Field label="Đường dẫn YouTube">
          <input
            className="input"
            value={p.url}
            placeholder="https://www.youtube.com/watch?v=..."
            onChange={(e) => setProps({ url: e.target.value.trim() }, 'url')}
          />
        </Field>
        {!valid && <p className="warn">Đường dẫn chưa đúng định dạng YouTube.</p>}
        <p className="hint">Video chỉ phát được ở chế độ xem trước.</p>
      </Section>
    )
  }

  if (!TEXT_TYPES.includes(el.type)) return null

  return (
    <Section title="Nội dung">
      <Field label="Văn bản">
        <textarea
          className="input"
          rows={el.type === 'text' ? 4 : 2}
          value={p.text}
          onChange={(e) => setProps({ text: e.target.value }, 'text')}
        />
      </Field>
      <p className="hint">Hoặc nhấp đúp vào phần tử trên trang để sửa trực tiếp.</p>
      {el.type === 'button' && <LinkFields el={el} {...link} setProps={setProps} placeholder="https://... hoặc mailto:..." />}
    </Section>
  )
}

// Font, size, colour, alignment, italic / underline and spacing are on the quick toolbar.
function TypographySection({ s, setStyle }) {
  return (
    <Section title="Chữ">
      <div className="grid2">
        <Field label="Độ đậm">
          <Select value={s.fontWeight} options={WEIGHTS} onChange={(v) => setStyle({ fontWeight: Number(v) })} />
        </Field>
        <Field label="Căn dọc">
          <Segmented value={s.verticalAlign} options={VALIGN} onChange={(v) => setStyle({ verticalAlign: v })} />
        </Field>
      </div>
    </Section>
  )
}

/** Background, border, shadow… minus what the quick toolbar already edits (`quick`, see quickFields). */
function AppearanceSection({ el, s, setStyle, quick }) {
  // Its background colour and opacity are both on the toolbar; decorations draw everything themselves.
  if (el.type === 'shape' || el.type === 'decor') return null

  if (el.type === 'divider') {
    return (
      <Section title="Đường kẻ">
        <Field label="Kiểu">
          <Select value={s.lineStyle} options={LINE_STYLES} onChange={(v) => setStyle({ lineStyle: v })} />
        </Field>
      </Section>
    )
  }

  return (
    <Section title="Nền & viền">
      {!quick.has('background') && (
        <Field label="Màu nền">
          <ColorInput value={s.background} allowNone onChange={(v) => setStyle({ background: v }, 'background')} />
        </Field>
      )}
      <div className="grid2">
        {!quick.has('radius') && (
          <Field label="Bo góc">
            <NumberInput value={s.radius} min={0} max={999} suffix="px" onChange={(v) => setStyle({ radius: v }, 'radius')} />
          </Field>
        )}
        <Field label="Khoảng đệm">
          <NumberInput value={s.padding} min={0} max={200} suffix="px" onChange={(v) => setStyle({ padding: v }, 'padding')} />
        </Field>
        <Field label="Độ dày viền">
          <NumberInput value={s.borderWidth} min={0} max={40} step={0.5} suffix="px" onChange={(v) => setStyle({ borderWidth: v }, 'borderWidth')} />
        </Field>
        <Field label="Kiểu viền">
          <Select value={s.borderStyle} options={LINE_STYLES} onChange={(v) => setStyle({ borderStyle: v })} />
        </Field>
      </div>
      {s.borderWidth > 0 && (
        <Field label="Màu viền">
          <ColorInput value={s.borderColor} onChange={(v) => setStyle({ borderColor: v }, 'borderColor')} />
        </Field>
      )}
      <Field label="Đổ bóng">
        <Select value={s.shadow} options={SHADOWS} onChange={(v) => setStyle({ shadow: v })} />
      </Field>
    </Section>
  )
}

function RangeInput({ value, min, max, step = 1, format, onChange }) {
  return (
    <div className="slider">
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span>{format(value)}</span>
    </div>
  )
}

function SiteSection({ page, onChange }) {
  const fileRef = useRef(null)
  const upload = useUpload()
  const busy = upload.busy
  const faviconMissing = useMissingImage(page.favicon)

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      onChange({ favicon: await upload.run((onProgress) => uploadIcon(file, { onProgress })) })
    } catch (err) {
      console.error(err)
      alert(err instanceof QuotaError ? err.message : 'Không tải được icon lên.')
    }
  }

  return (
    <Section title="Website">
      <Field label="Tiêu đề web (hiện trên tab trình duyệt)">
        <input
          className="input"
          value={page.title}
          maxLength={70}
          placeholder="VD: Tiệm bánh Mây"
          onChange={(e) => onChange({ title: e.target.value }, 'title')}
        />
      </Field>
      <div className="field">
        <span className="field-label">Icon web (favicon)</span>
        <div className="favicon-row">
          <span className="favicon-preview">
            {page.favicon && !faviconMissing ? <img src={page.favicon} alt="" /> : <Icon name="image" size={16} />}
          </span>
          <button type="button" className="btn upload-btn" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Icon name="upload" size={14} />
            {busy ? upload.label : page.favicon ? 'Đổi icon' : 'Tải icon lên'}
            {upload.bar}
          </button>
          {page.favicon && (
            <button type="button" className="btn" onClick={() => onChange({ favicon: '' })} disabled={busy}>
              Bỏ
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon" hidden onChange={onFile} />
        {faviconMissing && <p className="warn">Icon đã bị xoá khỏi kho lưu trữ. Hãy tải icon khác lên.</p>}
        <p className="hint">Nên dùng ảnh vuông, tối thiểu 64×64px.</p>
      </div>
    </Section>
  )
}

function PageSettings({ page, onChange }) {
  return (
    <div className="inspector">
      <div className="insp-head">
        <div>
          <strong>Cài đặt trang</strong>
          <small>Chọn một phần tử để chỉnh sửa nó</small>
        </div>
      </div>
      <SiteSection page={page} onChange={onChange} />
      <Section title="Trang">
        <Field label="Chiều rộng thiết kế">
          <Segmented
            value={page.width}
            options={[960, 1200, 1440].map((w) => ({ value: w, label: String(w) }))}
            onChange={(v) => onChange({ width: v })}
          />
        </Field>
        <div className="grid2">
          <Field label="Rộng">
            <NumberInput value={page.width} min={320} max={3000} suffix="px" onChange={(v) => onChange({ width: v }, 'width')} />
          </Field>
          <Field label="Cao">
            <NumberInput value={page.height} min={300} max={20000} suffix="px" onChange={(v) => onChange({ height: v }, 'height')} />
          </Field>
        </div>
        <Field label="Màu nền trang">
          <ColorInput value={page.background} onChange={(v) => onChange({ background: v }, 'background')} />
        </Field>
      </Section>
      <Section title="Phím tắt">
        <dl className="shortcuts">
          <dt>Nhấp đúp</dt>
          <dd>Sửa chữ trực tiếp</dd>
          <dt>Mũi tên</dt>
          <dd>Dịch 1px (Shift: 10px)</dd>
          <dt>Shift + kéo góc</dt>
          <dd>Giữ tỉ lệ khi đổi cỡ</dd>
          <dt>Kéo nút tròn phía trên</dt>
          <dd>Xoay (Shift: bước 15°, nhấp đúp: về 0°)</dd>
          <dt>Alt + kéo</dt>
          <dd>Tắt hít nam châm</dd>
          <dt>Ctrl + S</dt>
          <dd>Lưu lên đám mây</dd>
          <dt>Ctrl + Z / Y</dt>
          <dd>Hoàn tác / Làm lại</dd>
          <dt>Ctrl + C / V / D</dt>
          <dd>Sao chép / Dán / Nhân bản</dd>
          <dt>Delete</dt>
          <dd>Xoá phần tử</dd>
          <dt>Esc</dt>
          <dd>Bỏ chọn / thoát xem trước</dd>
        </dl>
      </Section>
    </div>
  )
}

export default function Inspector({ el, elements, page, pickingScroll, onChange, onPageChange, onAction }) {
  if (!el) return <PageSettings page={page} onChange={onPageChange} />

  const s = el.style
  const setProps = (patch, key) => onChange(el.id, { props: patch }, key && `props.${key}`)
  const setStyle = (patch, key) => onChange(el.id, { style: patch }, key && `style.${key}`)
  const setGeom = (patch, key) => onChange(el.id, patch, key)

  return (
    <div className="inspector">
      <div className="insp-head">
        <div>
          <strong>{elementLabel(el)}</strong>
          <small>{el.locked ? 'Đã khoá vị trí' : 'Kéo để di chuyển, kéo góc để đổi cỡ'}</small>
        </div>
      </div>
      <div className="insp-actions">
        <button type="button" className="icon-btn" title="Lên trên cùng" onClick={() => onAction('front')}>
          <Icon name="top" />
        </button>
        <button type="button" className="icon-btn" title="Lên một lớp" onClick={() => onAction('up')}>
          <Icon name="front" />
        </button>
        <button type="button" className="icon-btn" title="Xuống một lớp" onClick={() => onAction('down')}>
          <Icon name="back" />
        </button>
        <button type="button" className="icon-btn" title="Xuống dưới cùng" onClick={() => onAction('back')}>
          <Icon name="bottom" />
        </button>
        <span className="sep" />
        <button type="button" className={`icon-btn${el.locked ? ' on' : ''}`} title={el.locked ? 'Mở khoá' : 'Khoá vị trí'} onClick={() => onAction('lock')}>
          <Icon name={el.locked ? 'lock' : 'unlock'} />
        </button>
      </div>

      <ContentSection el={el} link={{ elements, page, picking: pickingScroll, onAction }} setProps={setProps} setGeom={setGeom} />

      <Section title="Vị trí & kích thước">
        <div className="grid2">
          <Field label="X">
            <NumberInput value={el.x} onChange={(v) => setGeom({ x: Math.round(v) }, 'x')} />
          </Field>
          <Field label="Y">
            <NumberInput value={el.y} onChange={(v) => setGeom({ y: Math.round(v) }, 'y')} />
          </Field>
          <Field label="Rộng">
            <NumberInput value={el.w} min={16} onChange={(v) => setGeom({ w: Math.round(v) }, 'w')} />
          </Field>
          <Field label="Cao">
            <NumberInput value={el.h} min={16} onChange={(v) => setGeom({ h: Math.round(v) }, 'h')} />
          </Field>
        </div>
        <Field label="Góc xoay">
          <div className="rotate-row">
            <NumberInput
              value={el.rotation || 0}
              min={-360}
              max={360}
              suffix="°"
              onChange={(v) => setGeom({ rotation: normalizeAngle(v) }, 'rotation')}
            />
            <button type="button" className="icon-btn" title="Xoay trái 90°" onClick={() => setGeom({ rotation: normalizeAngle((el.rotation || 0) - 90) })}>
              <Icon name="rotateLeft" size={15} />
            </button>
            <button type="button" className="icon-btn" title="Xoay phải 90°" onClick={() => setGeom({ rotation: normalizeAngle((el.rotation || 0) + 90) })}>
              <Icon name="rotate" size={15} />
            </button>
            <button type="button" className="btn" title="Bỏ xoay" onClick={() => setGeom({ rotation: 0 })} disabled={!el.rotation}>
              0°
            </button>
          </div>
        </Field>
        <button type="button" className="btn block" onClick={() => setGeom({ x: Math.round((page.width - el.w) / 2) })}>
          <Icon name="centerH" size={14} />
          Căn giữa theo chiều ngang trang
        </button>
      </Section>

      {TEXT_TYPES.includes(el.type) && <TypographySection s={s} setStyle={setStyle} />}
      <AppearanceSection el={el} s={s} setStyle={setStyle} quick={quickFields(el)} />
    </div>
  )
}
