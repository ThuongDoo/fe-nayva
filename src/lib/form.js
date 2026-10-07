/**
 * Contact / sign-up forms (`form` elements). What a visitor types is posted to the backend, which looks
 * the form up by its site and element id and passes it on to the owner's Google Sheet and / or Telegram
 * chat. The destination settings (FORM_SECRET_PROPS) therefore never go into a page's HTML: a Telegram
 * bot token there would let anyone use the bot.
 *
 * The editor (ElementContent) and published pages (formHtml + FORM_SCRIPT) draw the same markup.
 */
import { firstColor } from './gradient.js'

export const FORM_FIELD_TYPES = [
  ['text', 'Chữ ngắn'],
  ['tel', 'Số điện thoại'],
  ['email', 'Email'],
  ['textarea', 'Đoạn dài'],
  ['select', 'Chọn một'],
]

export const DEFAULT_FORM_FIELDS = [
  { id: 'name', label: 'Họ và tên', type: 'text', required: true, placeholder: 'Nguyễn Văn A' },
  { id: 'phone', label: 'Số điện thoại', type: 'tel', required: true, placeholder: '0901 234 567' },
  { id: 'note', label: 'Bạn cần tư vấn gì?', type: 'textarea', required: false, placeholder: '' },
]

/** Where submissions go: kept out of published HTML and out of templates (see the top of this file). */
export const FORM_SECRET_PROPS = ['sheetUrl', 'telegramToken', 'telegramChatId']

/** The props without the destination settings, for templates other users copy. */
export const withoutFormSecrets = (props) => ({ ...props, ...Object.fromEntries(FORM_SECRET_PROPS.map((k) => [k, ''])) })

/** Whether the form has somewhere to send to. */
export const formHasDestination = (p) => !!(p.sheetUrl || (p.telegramToken && p.telegramChatId))

/** The choices of a 'select' field: one per line of its `options`. */
export const fieldOptions = (f) =>
  String(f.options ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

/** Inline styles (React style objects) of the form's parts; contentStyle styles the outer box. */
export function formStyles(el) {
  const p = el.props
  const s = el.style
  const field = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    border: `1px solid ${firstColor(p.fieldBorderColor)}`,
    borderRadius: p.fieldRadius,
    background: p.fieldColor,
    color: firstColor(p.fieldTextColor),
    font: 'inherit',
    fontWeight: 400,
    margin: 0,
  }
  return {
    form: { display: 'flex', flexDirection: 'column', gap: 14, margin: 0 },
    label: { display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: Math.round(s.fontSize * 0.9) },
    field,
    textarea: { ...field, minHeight: 88, resize: 'vertical' },
    button: {
      padding: '12px 18px',
      border: 0,
      borderRadius: p.fieldRadius,
      background: p.accentColor,
      color: firstColor(p.accentTextColor),
      font: 'inherit',
      fontWeight: 700,
      cursor: 'pointer',
      marginTop: 4,
    },
    status: { margin: 0, fontSize: Math.round(s.fontSize * 0.9), minHeight: '1.2em' },
    required: { color: '#dc2626' },
  }
}

// ---------------------------------------------------------------- published pages

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const attr = (s = '') => esc(s).replace(/"/g, '&quot;')

/**
 * The form's markup for a published page. `forms`: `{ endpoint, site }` where submissions are posted
 * and the site they belong to, or null (exported HTML, previews): the page then says it doesn't send.
 * `css(obj)` turns a style object into a style attribute value.
 */
export function formHtml(el, forms, css) {
  const p = el.props
  const st = formStyles(el)
  const fields = (p.fields ?? [])
    .map((f) => {
      const name = `f_${f.id}`
      const req = f.required ? ' required' : ''
      const ph = f.placeholder ? ` placeholder="${attr(f.placeholder)}"` : ''
      const control =
        f.type === 'textarea'
          ? `<textarea name="${attr(name)}" rows="3"${req}${ph} style="${attr(css(st.textarea))}"></textarea>`
          : f.type === 'select'
            ? `<select name="${attr(name)}"${req} style="${attr(css(st.field))}"><option value="">— Chọn —</option>${fieldOptions(f)
                .map((o) => `<option>${esc(o)}</option>`)
                .join('')}</select>`
            : `<input name="${attr(name)}" type="${f.type === 'tel' || f.type === 'email' ? f.type : 'text'}"${req}${ph} style="${attr(css(st.field))}">`
      const star = f.required ? ` <span style="${attr(css(st.required))}">*</span>` : ''
      return `<label data-label="${attr(f.label)}" style="${attr(css(st.label))}"><span>${esc(f.label)}${star}</span>${control}</label>`
    })
    .join('')
  const data = forms ? ` data-endpoint="${attr(forms.endpoint)}" data-site="${attr(forms.site)}"` : ''
  return (
    `<form data-nv-form="${attr(el.id)}"${data} data-success="${attr(p.successText)}" style="${attr(css(st.form))}">` +
    fields +
    // A field people never see: bots that fill in everything give themselves away.
    '<input name="_hp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">' +
    `<button type="submit" style="${attr(css(st.button))}">${esc(p.submitText)}</button>` +
    `<p data-nv-status role="status" style="${attr(css(st.status))}"></p>` +
    '</form>'
  )
}

/**
 * Sends the forms of a published page (see formHtml). The visitor sees the form's message (successText)
 * as soon as they press send: the entry goes out in the background, without waiting for the answer,
 * and keeps going even if they leave the page right away.
 */
export const FORM_SCRIPT = `document.addEventListener('submit', function (e) {
  var form = e.target.closest && e.target.closest('form[data-nv-form]');
  if (!form) return;
  e.preventDefault();
  var values = [];
  form.querySelectorAll('label[data-label]').forEach(function (l) {
    var c = l.querySelector('input,textarea,select');
    values.push({ label: l.getAttribute('data-label'), value: c ? c.value.trim() : '' });
  });
  var hp = form.querySelector('[name=_hp]');
  if (form.dataset.endpoint) {
    var body = JSON.stringify({ site: form.dataset.site, form: form.getAttribute('data-nv-form'), values: values, hp: hp ? hp.value : '' });
    var sent = false;
    try { sent = navigator.sendBeacon(form.dataset.endpoint, new Blob([body], { type: 'text/plain;charset=utf-8' })); } catch (err) {}
    if (!sent) fetch(form.dataset.endpoint, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body }).catch(function () {});
  }
  form.reset();
  var status = form.querySelector('[data-nv-status]');
  status.textContent = form.dataset.success || 'Đã gửi!';
  status.style.color = '#16a34a';
});`
