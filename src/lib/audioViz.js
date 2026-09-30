/**
 * Audio element: a play button plus bars/waves that dance to the music (Web Audio AnalyserNode).
 *
 * `mountAudio` is deliberately self-contained (no imports, no outside references): the editor calls it
 * directly, and exported/published pages embed its source text in a <script> (see AUDIO_SCRIPT), so
 * all three behave the same. Keep it plain ES2017 and free of outside references.
 *
 * The box it mounts on carries the settings as data attributes:
 *   data-src, data-viz (see AUDIO_PRESETS), data-color, data-color2, data-bars, data-loop, data-autoplay,
 *   data-always (dances to a steady beat while nothing plays, even with no file yet: no play button then),
 *   data-inner (round effects: radius of the empty middle, % of the box),
 *   data-editor (in the editor: never autoplays, may show a note when the effect is simulated)
 * It returns a cleanup function.
 */
export function mountAudio(box) {
  var src = box.getAttribute('data-src')
  var always = box.hasAttribute('data-always')
  if (!src && !always) return function () {}
  var viz = box.getAttribute('data-viz') || 'bars'
  var color = box.getAttribute('data-color') || '#a78bfa'
  var color2 = box.getAttribute('data-color2') || color
  var count = Math.max(4, Math.min(128, parseInt(box.getAttribute('data-bars'), 10) || 32))
  // Round effects are drawn around the centre and keep the play button there.
  var radial = viz === 'circle' || viz === 'pulse'
  var inner = Math.max(10, Math.min(40, parseFloat(box.getAttribute('data-inner')) || 20)) / 100

  if (getComputedStyle(box).position === 'static') box.style.position = 'relative'

  var canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block'
  var ctx = canvas.getContext('2d')

  var audio = document.createElement('audio')
  audio.preload = 'none'
  audio.loop = box.hasAttribute('data-loop')
  // Needed to read the audio data from another origin (Firebase Storage in the editor). If the server
  // doesn't allow it, we fall back to playing without analysis (see the error handler).
  audio.crossOrigin = 'anonymous'
  if (src) audio.src = src

  var PLAY = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
  var PAUSE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>'
  var btn = document.createElement('button')
  btn.type = 'button'
  btn.setAttribute('aria-label', 'Phát âm thanh')
  btn.innerHTML = PLAY
  btn.style.cssText =
    'position:absolute;z-index:1;width:40px;height:40px;padding:0;border:0;border-radius:50%;' +
    'background:rgba(255,255,255,.92);color:#111827;display:flex;align-items:center;justify-content:center;' +
    'cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25);' +
    (radial ? 'left:50%;top:50%;transform:translate(-50%,-50%)' : 'left:10px;bottom:10px')

  box.appendChild(canvas)
  if (src) box.appendChild(btn)

  var levels = []
  for (var i = 0; i < count; i++) levels.push(0)
  var analyser = null
  var freq = null
  var fake = false // no audio data available: animate from a pattern instead
  var silentSince = 0
  // Rhythm tracking: `beat` jumps to 1 on each kick/bass hit and decays, pushing the whole effect.
  var beat = 0
  var lastBeat = 0
  var bassAvg = 0
  // Loudest recent bar, so quiet recordings still use the full height.
  var peak = 0.3
  var raw = []
  var raf = 0
  var settleUntil = 0
  var disposed = false
  var dpr = 1 // canvas pixels per CSS pixel, set by resize()

  // Switches to the simulated animation (no audio data readable). In the editor a small note says so,
  // since the effect then keeps a steady beat instead of following the music.
  var note = null
  function simulate() {
    fake = true
    if (note || !box.hasAttribute('data-editor')) return
    note = document.createElement('span')
    note.textContent = 'Mô phỏng'
    note.title =
      'Chưa đọc được dữ liệu nhạc (kho lưu trữ chưa bật CORS), hiệu ứng đang chạy theo nhịp giả lập. ' +
      'Trang đã xuất bản vẫn nhảy theo nhạc thật.'
    note.style.cssText =
      'position:absolute;z-index:1;top:6px;right:6px;padding:1px 6px;border-radius:999px;' +
      'background:rgba(0,0,0,.55);color:#fff;font:600 10px/1.6 system-ui,sans-serif;pointer-events:auto;cursor:help'
    box.appendChild(note)
  }

  function idle(i) {
    return 0.1 + 0.08 * Math.abs(Math.sin(i * 0.9 + 1))
  }

  function update(now) {
    beat *= 0.86
    if (!audio.paused && analyser && !fake) {
      analyser.getByteFrequencyData(freq)

      // Beat: the bass band jumping well above its recent average (kick drums, bass notes).
      var bassBins = Math.max(2, Math.round(freq.length * 0.06))
      var bass = 0
      for (var q = 0; q < bassBins; q++) bass += freq[q]
      bass /= bassBins * 255
      if (bass > 0.3 && bass > bassAvg * 1.2 && now - lastBeat > 220) {
        beat = 1
        lastBeat = now
      }
      bassAvg = bassAvg * 0.93 + bass * 0.07

      // Spread the bins over the bars on a curve, so the bass doesn't take up half of them.
      var n = freq.length * 0.72
      var total = 0
      var loudest = 0
      for (var i = 0; i < count; i++) {
        var a = Math.floor(Math.pow(i / count, 1.7) * n)
        var b = Math.max(a + 1, Math.floor(Math.pow((i + 1) / count, 1.7) * n))
        var sum = 0
        for (var j = a; j < b; j++) sum += freq[j]
        raw[i] = sum / (b - a) / 255
        total += raw[i]
        if (raw[i] > loudest) loudest = raw[i]
      }
      peak = Math.max(peak * 0.996, loudest, 0.3)
      for (var k2 = 0; k2 < count; k2++) {
        // Normalised, with a little extra contrast, and pushed up on every beat.
        var v = Math.min(1, Math.pow(raw[k2] / peak, 1.25) * (0.82 + 0.38 * beat))
        // Rise at once, fall quickly: bars snap to the rhythm instead of floating.
        levels[k2] = v > levels[k2] ? v : levels[k2] * 0.72 + v * 0.28
      }
      // All zeros for a while although playing: the data is blocked, so animate instead.
      if (total === 0 && audio.currentTime > 0.5) {
        if (!silentSince) silentSince = now
        else if (now - silentSince > 2000) simulate()
      } else silentSince = 0
    } else if (!audio.paused || always) {
      // No audio data (e.g. the file's server blocks cross-origin reads), or dancing while nothing plays:
      // a steady 120 bpm pattern.
      if (now - lastBeat > 500) {
        beat = 1
        lastBeat = now
      }
      var t = now / 1000
      for (var k = 0; k < count; k++) {
        var target = (0.28 + 0.26 * Math.sin(t * 5.3 + k * 0.7) * Math.sin(t * 1.9 + k * 0.23) + Math.random() * 0.14) * (0.8 + 0.4 * beat)
        levels[k] += (Math.max(0.05, Math.min(1, target)) - levels[k]) * 0.35
      }
    } else {
      for (var m = 0; m < count; m++) levels[m] += (idle(m) - levels[m]) * 0.12
    }
  }

  function draw() {
    var W = canvas.width
    var H = canvas.height
    ctx.clearRect(0, 0, W, H)
    var s = Math.min(W, H)
    var g = radial
      ? ctx.createRadialGradient(W / 2, H / 2, s * 0.1, W / 2, H / 2, s / 2)
      : viz === 'blocks'
        ? ctx.createLinearGradient(0, H, 0, 0) // LED meters light up from colour 1 at the bottom to colour 2 on top
        : ctx.createLinearGradient(0, 0, W, 0)
    g.addColorStop(0, color)
    g.addColorStop(1, color2)
    ctx.fillStyle = g
    ctx.strokeStyle = g
    var pad = s * 0.1

    if (viz === 'circle') {
      var cx = W / 2
      var cy = H / 2
      var R = s * inner * (1 + beat * 0.08) // the ring swells on each beat
      var maxLen = s / 2 - R - pad / 2
      ctx.lineCap = 'round'
      ctx.lineWidth = Math.max(2, ((2 * Math.PI * R) / count) * 0.55)
      for (var i = 0; i < count; i++) {
        var ang = (i / count) * Math.PI * 2 - Math.PI / 2
        var len = R + 4 + levels[i] * maxLen
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R)
        ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len)
        ctx.stroke()
      }
      return
    }

    if (viz === 'pulse') {
      // A soft blob whose outline follows the levels, around a core that swells with the bass.
      var pcx = W / 2
      var pcy = H / 2
      var base = s * inner
      var reach = s / 2 - base - pad / 2
      var bass = (levels[0] + levels[1] + levels[2]) / 3
      var pts = []
      for (var p = 0; p < count; p++) {
        var pa = (p / count) * Math.PI * 2 - Math.PI / 2
        var pr = base + 6 * dpr + levels[p] * reach
        pts.push([pcx + Math.cos(pa) * pr, pcy + Math.sin(pa) * pr])
      }
      ctx.beginPath()
      for (var q = 0; q <= count; q++) {
        var cur = pts[q % count]
        var nxt = pts[(q + 1) % count]
        var mx = (cur[0] + nxt[0]) / 2
        var my = (cur[1] + nxt[1]) / 2
        if (q === 0) ctx.moveTo(mx, my)
        else ctx.quadraticCurveTo(cur[0], cur[1], mx, my)
      }
      ctx.closePath()
      ctx.globalAlpha = 0.4
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.lineWidth = Math.max(2, s * 0.015)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(pcx, pcy, base * (0.72 + bass * 0.3 + beat * 0.28), 0, Math.PI * 2)
      ctx.fill()
      return
    }

    // Leave room on the left for the play button (bottom-left corner).
    var left = pad + 52 * dpr
    var width = Math.max(10, W - left - pad)

    if (viz === 'wave') {
      var mid = H / 2
      var amp = mid - pad
      var step = width / (count - 1)
      // Tapered to zero at both ends so the wave starts and ends on the centre line.
      var at = function (i, sign) {
        return mid - sign * levels[i] * amp * Math.sin((Math.PI * i) / (count - 1))
      }
      var curve = function (sign) {
        ctx.moveTo(left, mid)
        for (var i = 1; i < count; i++) {
          var px = left + (i - 1) * step
          var py = at(i - 1, sign)
          var x = left + i * step
          ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + at(i, sign)) / 2)
        }
        ctx.lineTo(left + width, mid)
      }
      ctx.beginPath()
      curve(1)
      curve(-1)
      ctx.globalAlpha = 0.35
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.lineWidth = Math.max(2, s * 0.02)
      ctx.lineJoin = 'round'
      ctx.beginPath()
      curve(1)
      ctx.stroke()
      ctx.beginPath()
      curve(-1)
      ctx.stroke()
      return
    }

    var slot = width / count
    var bw = Math.max(1, slot * 0.62)
    var maxH = H - pad * 2

    if (viz === 'blocks') {
      // LED equalizer: each column is a stack of cells; a level lights that share of them.
      var rows = Math.max(4, Math.round(maxH / Math.max(bw * 0.7, 4 * dpr)))
      var cellH = maxH / rows
      for (var c = 0; c < count; c++) {
        var lit = Math.max(1, Math.round(levels[c] * rows))
        var cx0 = left + c * slot + (slot - bw) / 2
        for (var rr = 0; rr < rows; rr++) {
          ctx.globalAlpha = rr < lit ? 1 : 0.12
          ctx.fillRect(cx0, H - pad - (rr + 1) * cellH + cellH * 0.12, bw, cellH * 0.76)
        }
      }
      ctx.globalAlpha = 1
      return
    }

    if (viz === 'dots') {
      // A row of bubbles that swell with their band.
      var maxR = Math.min(slot / 2, H / 2 - pad)
      for (var d = 0; d < count; d++) {
        ctx.beginPath()
        ctx.arc(left + (d + 0.5) * slot, H / 2, Math.max(1.5 * dpr, levels[d] * maxR), 0, Math.PI * 2)
        ctx.fill()
      }
      return
    }

    // bars (from the bottom) and mirror (from the middle)
    for (var b = 0; b < count; b++) {
      var h = Math.max(bw * 0.8, levels[b] * maxH)
      var x = left + b * slot + (slot - bw) / 2
      var y = viz === 'mirror' ? (H - h) / 2 : H - pad - h
      var r = Math.min(bw / 2, h / 2)
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(x, y, bw, h, r)
      else ctx.rect(x, y, bw, h)
      ctx.fill()
    }
  }

  function resize() {
    dpr = window.devicePixelRatio || 1
    // clientWidth ignores CSS transforms, so the editor's zoom doesn't blur or distort the drawing.
    canvas.width = Math.max(1, Math.round(box.clientWidth * dpr))
    canvas.height = Math.max(1, Math.round(box.clientHeight * dpr))
    draw()
  }

  function frame(now) {
    raf = 0
    if (disposed) return
    update(now)
    draw()
    if (!audio.paused || always || now < settleUntil) raf = requestAnimationFrame(frame)
  }
  function run() {
    if (!raf) raf = requestAnimationFrame(frame)
  }

  function connect() {
    if (analyser || fake) return
    try {
      var AC = window.AudioContext || window.webkitAudioContext
      var actx = window.__nayvaAudioCtx || (window.__nayvaAudioCtx = new AC())
      if (actx.state === 'suspended') actx.resume()
      var source = actx.createMediaElementSource(audio)
      analyser = actx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.5 // lower = snappier; beats need to show within a frame or two
      source.connect(analyser)
      analyser.connect(actx.destination)
      freq = new Uint8Array(analyser.frequencyBinCount)
    } catch {
      simulate()
    }
  }

  var retried = false
  audio.addEventListener('error', function () {
    if (disposed) return // cleanup clears the src, which can report an error
    // Most likely the server refused cross-origin access: play it plainly, with the pattern animation.
    if (!retried && audio.crossOrigin && !analyser) {
      retried = true
      simulate()
      audio.removeAttribute('crossorigin')
      audio.src = src
      audio.play().catch(function () {})
    } else {
      btn.disabled = true
      btn.style.opacity = '0.5'
      btn.title = 'Không phát được tệp âm thanh này'
    }
  })

  // Runs `fn` on the visitor's first interaction with the page (the moment browsers allow sound).
  // Not every event of a tap counts: on phones the pointerdown comes first but only the touchend /
  // pointerup lets sound start, so events that don't grant it (userActivation.isActive) are skipped.
  var gestureOffs = []
  function onFirstGesture(fn) {
    var events = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']
    function off() {
      events.forEach(function (t) {
        document.removeEventListener(t, handler, true)
      })
    }
    function handler(e) {
      if (navigator.userActivation && !navigator.userActivation.isActive) return
      off()
      fn(e)
    }
    events.forEach(function (t) {
      document.addEventListener(t, handler, true)
    })
    gestureOffs.push(off)
  }
  function hasInteracted() {
    return !navigator.userActivation || navigator.userActivation.hasBeenActive
  }

  audio.addEventListener('playing', function () {
    // Before any interaction an AudioContext starts suspended, and audio routed through it would be
    // silent. So analysis waits for the first interaction; the pattern animates until then.
    if (hasInteracted()) connect()
    else onFirstGesture(connect)
    btn.innerHTML = PAUSE
    btn.setAttribute('aria-label', 'Tạm dừng')
    run()
  })
  audio.addEventListener('pause', function () {
    btn.innerHTML = PLAY
    btn.setAttribute('aria-label', 'Phát âm thanh')
    settleUntil = performance.now() + 900
    run()
  })

  // Only one audio element plays at a time on a page.
  function onOtherPlay(e) {
    if (e.detail !== audio && !audio.paused) audio.pause()
  }
  document.addEventListener('nayva-audio-play', onOtherPlay)

  // Native listener that stops the pointer event, so pressing play in the editor doesn't start a drag.
  function stop(e) {
    e.stopPropagation()
  }
  btn.addEventListener('pointerdown', stop)

  function start() {
    document.dispatchEvent(new CustomEvent('nayva-audio-play', { detail: audio }))
    var p = audio.play()
    return p && p.then ? p : Promise.resolve()
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation()
    if (audio.paused) start().catch(function () {})
    else audio.pause()
  })

  // Autoplay: only the first autoplaying element on the page. Browsers usually refuse sound before the
  // visitor interacts; then it starts on their first click/tap/key press instead.
  if (src && box.hasAttribute('data-autoplay') && document.querySelector('[data-audio][data-autoplay]') === box) {
    audio.preload = 'auto'
    // Blocked until the visitor interacts: the play button pulses meanwhile, as a hint.
    var hint = null
    function waitForGesture() {
      if (!hint && btn.animate) {
        hint = btn.animate(
          [{ boxShadow: '0 0 0 0 rgba(255,255,255,.75)' }, { boxShadow: '0 0 0 16px rgba(255,255,255,0)' }],
          { duration: 1400, iterations: Infinity },
        )
      }
      onFirstGesture(function (e) {
        if (disposed || !audio.paused) return
        // Pressing a play button is an explicit choice; let that button decide.
        if (e.target && e.target.closest && e.target.closest('[data-audio] button')) return
        // Still refused (a browser without userActivation, on an event that didn't count): wait for the next one.
        start().catch(waitForGesture)
      })
    }
    audio.addEventListener('playing', function () {
      if (hint) hint.cancel()
      hint = null
    })
    start().catch(waitForGesture)
  }

  var ro = window.ResizeObserver ? new ResizeObserver(resize) : null
  if (ro) ro.observe(box)
  for (var n = 0; n < count; n++) levels[n] = idle(n)
  resize()
  if (always) run()

  return function cleanup() {
    disposed = true
    if (raf) cancelAnimationFrame(raf)
    if (ro) ro.disconnect()
    document.removeEventListener('nayva-audio-play', onOtherPlay)
    gestureOffs.forEach(function (off) {
      off()
    })
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
    if (analyser) analyser.disconnect()
    canvas.remove()
    if (note) note.remove()
    btn.remove()
  }
}

/** Script for exported pages: mounts every audio element once the page has loaded. */
export const AUDIO_SCRIPT =
  'var mountAudio = ' +
  mountAudio.toString() +
  ";\ndocument.querySelectorAll('[data-audio]').forEach(function (b) { mountAudio(b) });"

/**
 * The audio group in the palette, like the shapes group: one tile per effect (`audio:<viz>`), each with
 * its own starting size and colours. `props` overrides the audio defaults in elements.js.
 */
export const AUDIO_PRESETS = {
  bars: { label: 'Cột sóng', w: 420, h: 140, props: { color: '#a78bfa', color2: '#f472b6', bars: 32 } },
  mirror: { label: 'Đối xứng', w: 420, h: 140, props: { color: '#22d3ee', color2: '#6366f1', bars: 40 } },
  wave: { label: 'Sóng', w: 420, h: 140, props: { color: '#34d399', color2: '#facc15', bars: 48 } },
  blocks: { label: 'Đèn LED', w: 420, h: 160, props: { color: '#22c55e', color2: '#ef4444', bars: 20 } },
  dots: { label: 'Bong bóng', w: 420, h: 120, props: { color: '#f472b6', color2: '#fb923c', bars: 14 } },
  circle: { label: 'Vòng tròn', w: 240, h: 240, props: { color: '#a78bfa', color2: '#22d3ee', bars: 48 } },
  pulse: { label: 'Nhịp đập', w: 240, h: 240, props: { color: '#f43f5e', color2: '#fbbf24', bars: 32 } },
}
export const AUDIO_ORDER = Object.keys(AUDIO_PRESETS)

/**
 * Data attributes that configure mountAudio, from an audio element's props. `autoplay: false` keeps it
 * from starting on its own regardless of its setting (the editor does that).
 */
export function audioAttrs(p, { autoplay = true } = {}) {
  const attrs = {
    'data-audio': '',
    'data-src': p.src,
    'data-viz': p.viz,
    'data-color': p.color,
    'data-color2': p.color2,
    'data-bars': String(p.bars),
  }
  if (p.loop) attrs['data-loop'] = ''
  if (p.always) attrs['data-always'] = ''
  if (p.inner) attrs['data-inner'] = String(p.inner)
  if (p.autoplay && autoplay) attrs['data-autoplay'] = ''
  // The editor never autoplays, and is where the "simulated" note may show.
  if (!autoplay) attrs['data-editor'] = ''
  return attrs
}
