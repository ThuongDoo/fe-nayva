/**
 * Scroll-linked image ("Ảnh cuộn"): the frame is a window onto an image that stays put on the screen.
 * When the page scrolls, the image moves the same distance the other way inside the frame (like a
 * fixed background). The image is sized to the screen's height, so the frame never runs past it.
 *
 * Positions are in the page's own px: the screen distances are divided by the page's scale.
 */

/** Style of the <img> inside the frame (which is position: relative, overflow: hidden). */
export const PARALLAX_IMG_STYLE = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
  willChange: 'transform',
}

/** Pins `img` to the screen: it covers the whole screen height, starting at the screen's top. */
export function pinParallax(frame, img, viewH) {
  const r = frame.getBoundingClientRect()
  const scale = r.height / frame.offsetHeight || 1
  img.style.height = `${viewH / scale}px`
  img.style.transform = `translateY(${-r.top / scale}px)`
}

// Published pages: the same as pinParallax for every frame, on scroll and resize.
export const PARALLAX_SCRIPT = `(function () {
  var frames = [].slice.call(document.querySelectorAll('[data-parallax]'));
  var queued = false;
  function update() {
    queued = false;
    var vh = window.innerHeight;
    frames.forEach(function (f) {
      var img = f.firstElementChild;
      if (!img) return;
      var r = f.getBoundingClientRect();
      var s = r.height / f.offsetHeight || 1;
      img.style.height = vh / s + 'px';
      img.style.transform = 'translateY(' + (-r.top / s) + 'px)';
    });
  }
  function queue() {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  update();
})();`
