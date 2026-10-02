import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import Canvas from './components/Canvas.jsx'
import Inspector from './components/Inspector.jsx'
import Layers from './components/Layers.jsx'
import Palette from './components/Palette.jsx'
import StorageMeter from './components/StorageMeter.jsx'
import Preview from './components/Preview.jsx'
import PublishDialog from './components/PublishDialog.jsx'
import TemplateDialog from './components/TemplateDialog.jsx'
import Toolbar from './components/Toolbar.jsx'
import {
  DesignTooLargeError,
  noteSharedEdit,
  saveDesign,
  setDesignSharing,
  signOut,
  uploadImage,
  uploadVideo,
  watchDesign,
} from './lib/cloud.js'
import { applyPatch, clamp, createElement, createFromKey, scrollYHref, uid } from './lib/elements.js'
import { exportHtml } from './lib/exportHtml.js'
import { containsPoint } from './lib/geometry.js'
import { shapeImageProps } from './lib/shapes.js'
import { goHome, shareLink } from './lib/route.js'
import { startUpload } from './lib/uploadProgress.js'
import { QuotaError } from './lib/storageQuota.js'
import { useHistory } from './lib/useHistory.js'

const SIDE_PANELS_WIDTH = 248 + 300
/** Size of the placeholder shown on the page while a dropped image uploads. */
const UPLOAD_BOX = { w: 240, h: 160 }
const AUTOSAVE_DELAY = 1500

const fitZoom = (available, pageWidth) => clamp(Math.floor((available / pageWidth) * 20) / 20, 0.25, 1)

/** JSON with object keys sorted, so two designs with the same content compare equal whatever the key order. */
const stableJson = (v) =>
  JSON.stringify(v, (_, x) =>
    x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x,
  )
const sameContent = (a, b) => stableJson({ page: a.page, elements: a.elements }) === stableJson({ page: b.page, elements: b.elements })

/**
 * The editor. `ownerUid`: whose design this is; when it isn't the user's own, they opened it through
 * its share link and may edit it while the owner keeps sharing it (`initialShareEdit`).
 */
export default function App({ user, ownerUid, designId, initialDoc, initialShareEdit = false, isAdmin = false }) {
  const { doc, set, checkpoint, undo, redo, canUndo, canRedo } = useHistory(() => initialDoc)
  const isOwner = ownerUid === user.uid
  const [shareEdit, setShareEdit] = useState(initialShareEdit)
  const [selectedId, setSelectedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  // Words selected in a text element while editing it ({ id, start, end }): the toolbar's text colour
  // then applies to just those (see richText.js). Kept after the edit ends, until the colour is picked.
  const [textSel, setTextSel] = useState(null)
  // A button / icon button whose scroll target is being picked by clicking on the page.
  const [pickingScrollFor, setPickingScrollFor] = useState(null)
  const [zoom, setZoom] = useState(() => fitZoom(window.innerWidth - SIDE_PANELS_WIDTH - 80, doc.page.width))
  const [showGrid, setShowGrid] = useState(false)
  const [snap, setSnap] = useState(true)
  const [previewing, setPreviewing] = useState(false)
  // 'saved' | 'pending' (waiting for the debounce) | 'saving' | 'error' | 'too-large'
  const [saveState, setSaveState] = useState('saved')
  const [notice, setNotice] = useState(null)
  const [makingTemplate, setMakingTemplate] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [tab, setTab] = useState('props')
  const workspaceRef = useRef(null)
  const canvasRef = useRef(null)
  const clipboard = useRef(null)
  const savedDoc = useRef(initialDoc)
  const noticeTimer = useRef(0)

  const selected = doc.elements.find((el) => el.id === selectedId) ?? null

  /** Shows a short status message in the toolbar; `sticky` keeps it until the next one. */
  const showNotice = (text, { error = false, sticky = false } = {}) => {
    clearTimeout(noticeTimer.current)
    setNotice(text && { text, error })
    if (text && !sticky) noticeTimer.current = setTimeout(() => setNotice(null), 4000)
  }

  /** Writes the design to Firestore; resolves to false (and shows the error state) if that failed. */
  const persist = async (d) => {
    if (d === savedDoc.current) return true
    setSaveState('saving')
    try {
      await saveDesign(ownerUid, designId, d)
      savedDoc.current = d
      // If the doc changed meanwhile, the autosave effect already moved the state back to 'pending'.
      setSaveState((s) => (s === 'saving' ? 'saved' : s))
      return true
    } catch (e) {
      console.error('Không lưu được thiết kế', e)
      setSaveState(e instanceof DesignTooLargeError ? 'too-large' : 'error')
      return false
    }
  }

  // Autosave to Firestore, debounced so a drag or a burst of typing is a single write.
  const autosave = useEffectEvent(() => persist(doc))
  useEffect(() => {
    if (doc === savedDoc.current) return
    setSaveState('pending')
    const t = setTimeout(autosave, AUTOSAVE_DELAY)
    return () => clearTimeout(t)
  }, [doc])

  /**
   * Changes saved by someone else editing the same design (through its share link) show up here. They
   * replace the page only while this editor has nothing unsaved; otherwise the next save here wins.
   */
  const onRemoteChange = useEffectEvent(({ design, shareEdit: shared, local }) => {
    setShareEdit(shared)
    if (local || doc !== savedDoc.current || sameContent(design, savedDoc.current)) return
    savedDoc.current = design
    set(design, { transient: true })
  })
  const onWatchError = useEffectEvent((e) => {
    console.error('Không theo dõi được thay đổi của trang', e)
    if (!isOwner) {
      showNotice('Chủ trang đã tắt chia sẻ hoặc đã xoá trang: bạn không thể lưu thay đổi nữa.', { error: true, sticky: true })
    }
  })
  useEffect(
    () => watchDesign(ownerUid, designId, (change) => onRemoteChange(change), (e) => onWatchError(e)),
    [ownerUid, designId],
  )

  // Uploads made into someone else's design live in this user's folders: record the design so the
  // backend's storage cleanup keeps them.
  useEffect(() => {
    if (!isOwner) noteSharedEdit(ownerUid, designId).catch((e) => console.error('Không ghi được trang được chia sẻ', e))
  }, [isOwner, ownerUid, designId])

  const toggleSharing = async (on) => {
    setShareEdit(on)
    try {
      await setDesignSharing(ownerUid, designId, on)
    } catch (e) {
      console.error(e)
      setShareEdit(!on)
      showNotice('Không đổi được chế độ chia sẻ. Hãy kiểm tra kết nối mạng.', { error: true })
    }
  }

  // Leaving the editor another way (browser back button, editing the URL) still saves pending changes.
  const flushOnUnmount = useEffectEvent(() => persist(doc))
  useEffect(() => () => flushOnUnmount(), [])

  // Warn before closing the tab while changes haven't reached Firestore yet.
  useEffect(() => {
    if (saveState === 'saved') return
    const onBeforeUnload = (e) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [saveState])

  const mutateElements = (fn, opts) => set((d) => ({ ...d, elements: fn(d.elements) }), opts)

  const updateElement = (id, patch, key) =>
    mutateElements((els) => els.map((el) => (el.id === id ? applyPatch(el, patch) : el)), {
      merge: key ? `${id}:${key}` : undefined,
    })

  const updatePage = (patch, key) =>
    set((d) => ({ ...d, page: { ...d.page, ...patch } }), { merge: key ? `page:${key}` : undefined })

  const insertElement = (el) => {
    mutateElements((els) => [...els, el])
    setSelectedId(el.id)
    setTab('props')
  }

  /** Center of the visible part of the canvas, in page coordinates. */
  const viewCenter = () => {
    const ws = workspaceRef.current.getBoundingClientRect()
    const cv = canvasRef.current.getBoundingClientRect()
    return {
      x: (ws.left + ws.width / 2 - cv.left) / zoom,
      y: (ws.top + Math.min(ws.height / 2, 320) - cv.top) / zoom,
    }
  }

  const placeAt = (w, h, pos) => ({
    x: Math.round(clamp(pos.x - w / 2, 0, Math.max(0, doc.page.width - w))),
    y: Math.round(clamp(pos.y - h / 2, 0, Math.max(0, doc.page.height - h))),
  })

  /** `key` is an element type or a shape preset like `shape:diamond`. */
  const addElement = (key, pos) => {
    const el = createFromKey(key)
    let at = placeAt(el.w, el.h, pos ?? viewCenter())
    // Clicking the palette repeatedly shouldn't stack elements exactly on top of each other.
    while (!pos && doc.elements.some((e) => e.x === at.x && e.y === at.y)) at = { x: at.x + 24, y: at.y + 24 }
    insertElement({ ...el, ...at })
  }

  const addImageFiles = async (files, pos) => {
    const images = files.filter((f) => f.type.startsWith('image/'))
    // A single image dropped onto a shape or scrolling-image frame fills it instead of becoming a new element.
    const target =
      images.length === 1 &&
      doc.elements.findLast(
        (el) =>
          (el.type === 'shape' || el.type === 'parallax') &&
          !el.hidden &&
          !el.locked &&
          containsPoint(el, pos.x, pos.y),
      )
    // Videos go into shapes only (there is no stand-alone uploaded video element).
    const video = !images.length && files.find((f) => f.type.startsWith('video/'))
    if (video) {
      const shape = doc.elements.findLast(
        (el) => el.type === 'shape' && !el.hidden && !el.locked && containsPoint(el, pos.x, pos.y),
      )
      if (!shape) {
        showNotice('Thả video vào một hình khối để chèn video vào hình.', { error: true })
        return
      }
      const upload = startUpload({ elementId: shape.id })
      try {
        const media = await uploadVideo(video, { onProgress: upload.progress })
        updateElement(shape.id, { props: shapeImageProps(media, video.name) })
        setSelectedId(shape.id)
        setTab('props')
      } catch (e) {
        console.error(e)
        showNotice(e.message || `Không tải được video "${video.name}" lên.`, { error: true })
      } finally {
        upload.done()
      }
      return
    }
    if (!images.length) return
    if (target) {
      // Progress is shown on the shape itself.
      const upload = startUpload({ elementId: target.id })
      try {
        const img = await uploadImage(images[0], { onProgress: upload.progress })
        const props =
          target.type === 'parallax'
            ? { src: img.src, alt: images[0].name.replace(/\.[^.]+$/, '') }
            : shapeImageProps(img, images[0].name)
        updateElement(target.id, { props })
        setSelectedId(target.id)
        setTab('props')
      } catch (e) {
        console.error(e)
        showNotice(e instanceof QuotaError ? e.message : `Không tải được ảnh "${images[0].name}" lên.`, { error: true })
      } finally {
        upload.done()
      }
      return
    }
    // Each image gets a placeholder box where it was dropped, replaced by the image once uploaded.
    const results = await Promise.all(
      images.map(async (file, i) => {
        const spot = { x: pos.x + i * 24, y: pos.y + i * 24 }
        const upload = startUpload({ rect: { ...placeAt(UPLOAD_BOX.w, UPLOAD_BOX.h, spot), ...UPLOAD_BOX } })
        try {
          const img = await uploadImage(file, { onProgress: upload.progress })
          const w = Math.min(480, img.width)
          const h = Math.round((w * img.height) / img.width)
          insertElement(
            createElement('image', { ...placeAt(w, h, spot), w, h, props: { src: img.src, alt: file.name.replace(/\.[^.]+$/, '') } }),
          )
          return true
        } catch (e) {
          console.error(e)
          return e
        } finally {
          upload.done()
        }
      }),
    )
    const errors = results.filter((r) => r !== true)
    const quota = errors.find((e) => e instanceof QuotaError)
    if (errors.length) showNotice(quota ? quota.message : `Không tải được ${errors.length} ảnh lên.`, { error: true })
  }

  const removeElement = (id) => {
    mutateElements((els) => els.filter((el) => el.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const duplicateElement = (src) => {
    const copy = { ...structuredClone(src), id: uid(), x: src.x + 20, y: src.y + 20, locked: false }
    mutateElements((els) => {
      const i = els.findIndex((el) => el.id === src.id)
      const next = [...els]
      next.splice(i < 0 ? next.length : i + 1, 0, copy)
      return next
    })
    setSelectedId(copy.id)
  }

  const pasteElement = () => {
    const src = clipboard.current
    if (!src) return
    const copy = { ...structuredClone(src), id: uid(), x: src.x + 20, y: src.y + 20 }
    clipboard.current = copy
    insertElement(copy)
  }

  const reorder = (id, where) =>
    mutateElements((els) => {
      const i = els.findIndex((el) => el.id === id)
      if (i < 0) return els
      const next = [...els]
      const [item] = next.splice(i, 1)
      const j = { front: next.length, back: 0, up: Math.min(next.length, i + 1), down: Math.max(0, i - 1) }[where]
      if (j === i) return els
      next.splice(j, 0, item)
      return next
    })

  const toggleFlag = (id, flag) => {
    const el = doc.elements.find((e) => e.id === id)
    if (el) updateElement(id, { [flag]: !el[flag] })
  }

  const commitText = (id, { text, marks }) => {
    setEditingId(null)
    mutateElements((els) => {
      const el = els.find((e) => e.id === id)
      if (!el || (el.props.text === text && JSON.stringify(el.props.marks ?? []) === JSON.stringify(marks))) return els
      return els.map((e) => (e.id === id ? applyPatch(e, { props: { text, marks } }) : e))
    })
  }

  const select = (id) => {
    setSelectedId(id)
    if (id !== pickingScrollFor) setPickingScrollFor(null)
    if (id !== editingId) setEditingId(null)
    if (id !== textSel?.id) setTextSel(null)
  }

  const onAction = (action) => {
    if (!selected) return
    if (action === 'crop') setEditingId(editingId === selected.id ? null : selected.id)
    else if (action === 'pickScroll') setPickingScrollFor(pickingScrollFor === selected.id ? null : selected.id)
    else if (action === 'delete') removeElement(selected.id)
    else if (action === 'duplicate') duplicateElement(selected)
    else if (action === 'lock') toggleFlag(selected.id, 'locked')
    else reorder(selected.id, action)
  }

  const fitToScreen = () => {
    const available = workspaceRef.current?.clientWidth ?? window.innerWidth - SIDE_PANELS_WIDTH
    setZoom(fitZoom(available - 80, doc.page.width))
  }

  /** "Lưu" button / Ctrl+S: writes the design to Firestore right away instead of waiting for autosave. */
  const saveNow = async () => {
    if (await persist(doc)) showNotice('Đã lưu thiết kế lên đám mây')
  }

  /** Saves pending changes before leaving the editor; asks first if that failed. */
  const leave = async (action, question) => {
    if (!(await persist(doc)) && !confirm(`Chưa lưu được thay đổi gần nhất lên đám mây. ${question}`)) return
    await action()
  }
  const logout = () => leave(signOut, 'Vẫn đăng xuất?')
  const backHome = () => leave(goHome, 'Vẫn về trang chủ?')

  const openPreview = () => {
    document.activeElement?.blur?.()
    setEditingId(null)
    setPickingScrollFor(null)
    document.documentElement.requestFullscreen?.().catch(() => {})
    setPreviewing(true)
  }

  const closePreview = useCallback(() => {
    setPreviewing(false)
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  }, [])

  const openInNewTab = () => {
    const url = URL.createObjectURL(new Blob([exportHtml(doc)], { type: 'text/html' }))
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  const onKeyDown = useEffectEvent((e) => {
    // Shortcuts belong to the dialog while one is open.
    if (previewing || publishing || makingTemplate) return
    const mod = e.ctrlKey || e.metaKey
    const key = e.key.toLowerCase()
    // Works while typing in the inspector too, and keeps the browser's "Save page" dialog away.
    if (mod && key === 's') {
      e.preventDefault()
      saveNow()
      return
    }
    const t = e.target
    const typing = t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)
    if (typing) return

    if (mod && key === 'z') {
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
      return
    }
    if (mod && key === 'y') {
      e.preventDefault()
      redo()
      return
    }
    if (mod && key === 'v') {
      e.preventDefault()
      pasteElement()
      return
    }
    if (e.key === 'Escape') {
      if (pickingScrollFor) setPickingScrollFor(null)
      else if (editingId) setEditingId(null)
      else setSelectedId(null)
      return
    }
    if (!selected) return

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      removeElement(selected.id)
    } else if (mod && key === 'd') {
      e.preventDefault()
      duplicateElement(selected)
    } else if (mod && key === 'c') {
      clipboard.current = structuredClone(selected)
    } else if (e.key === 'Enter' && ['heading', 'text', 'button'].includes(selected.type) && !selected.locked) {
      e.preventDefault()
      setEditingId(selected.id)
    } else if (e.key === 'Enter' && selected.type === 'shape' && selected.props.src && !selected.locked) {
      e.preventDefault()
      setEditingId(editingId === selected.id ? null : selected.id)
    } else if (e.key.startsWith('Arrow') && !selected.locked) {
      e.preventDefault()
      const step = e.shiftKey ? 10 : 1
      const dx = { ArrowLeft: -step, ArrowRight: step }[e.key] ?? 0
      const dy = { ArrowUp: -step, ArrowDown: step }[e.key] ?? 0
      updateElement(selected.id, { x: selected.x + dx, y: selected.y + dy }, 'nudge')
    }
  })

  useEffect(() => {
    const handler = (e) => onKeyDown(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="app">
      <Toolbar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        zoom={zoom}
        onZoom={setZoom}
        onFit={fitToScreen}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((v) => !v)}
        snap={snap}
        onToggleSnap={() => setSnap((v) => !v)}
        doc={doc}
        // The first recolour is an undo step; switching themes after that replaces it.
        onApplyTheme={(design, first) => set(design, { transient: !first })}
        onPreview={openPreview}
        onSave={saveNow}
        saveState={saveState}
        notice={notice}
        user={user}
        onSignOut={logout}
        onHome={backHome}
        onMakeTemplate={isAdmin ? () => setMakingTemplate(true) : null}
        // Only the owner publishes; whoever edits through the share link just sees that it is shared.
        onPublish={isOwner ? () => setPublishing(true) : null}
        share={{
          isOwner,
          on: shareEdit,
          link: shareLink(ownerUid, designId),
          onToggle: toggleSharing,
        }}
      />

      <div className="main">
        <aside className="panel panel-left">
          <Palette onAdd={(type) => addElement(type)} />
          <StorageMeter />
        </aside>

        <Canvas
          doc={doc}
          zoom={zoom}
          selectedId={selectedId}
          editingId={editingId}
          pickingScroll={!!pickingScrollFor && pickingScrollFor === selectedId}
          onPickScroll={(y) => {
            updateElement(pickingScrollFor, { props: { href: scrollYHref(y) } })
            setPickingScrollFor(null)
          }}
          showGrid={showGrid}
          snap={snap}
          workspaceRef={workspaceRef}
          canvasRef={canvasRef}
          set={set}
          checkpoint={checkpoint}
          onSelect={select}
          onEdit={setEditingId}
          onCommitText={commitText}
          textSel={textSel}
          onSelectText={(id, range) => setTextSel(range ? { id, ...range } : null)}
          onDropElement={addElement}
          onDropFiles={addImageFiles}
          onUpdate={updateElement}
          onAction={onAction}
        />

        <aside className="panel panel-right">
          <div className="tabs">
            <button type="button" className={`tab${tab === 'props' ? ' active' : ''}`} onClick={() => setTab('props')}>
              Thuộc tính
            </button>
            <button type="button" className={`tab${tab === 'layers' ? ' active' : ''}`} onClick={() => setTab('layers')}>
              Lớp ({doc.elements.length})
            </button>
          </div>
          {tab === 'props' ? (
            <Inspector
              key={selected?.id ?? 'page'}
              el={selected}
              elements={doc.elements}
              pickingScroll={pickingScrollFor === selected?.id}
              page={doc.page}
              onChange={updateElement}
              onPageChange={updatePage}
              onAction={onAction}
            />
          ) : (
            <Layers elements={doc.elements} selectedId={selectedId} onSelect={select} onToggle={toggleFlag} />
          )}
        </aside>
      </div>

      {previewing && <Preview doc={doc} onClose={closePreview} onOpenTab={openInNewTab} />}
      {publishing && (
        <PublishDialog
          designId={designId}
          page={doc.page}
          onPageChange={updatePage}
          save={() => persist(doc)}
          onClose={() => setPublishing(false)}
        />
      )}
      {makingTemplate && (
        <TemplateDialog
          design={doc}
          source={{ uid: ownerUid, designId }}
          onClose={() => setMakingTemplate(false)}
          onDone={(message) => {
            setMakingTemplate(false)
            showNotice(message)
          }}
        />
      )}
    </div>
  )
}
