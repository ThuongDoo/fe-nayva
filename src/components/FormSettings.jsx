import { useState } from 'react'
import Icon from './Icon.jsx'
import { ColorInput, Field, NumberInput, Section, Select } from './fields.jsx'
import { uid } from '../lib/elements.js'
import { FORM_FIELD_TYPES } from '../lib/form.js'
import { findTelegramChats, testFormDestination } from '../lib/api.js'

/** Google Apps Script that appends every submission as a row (new labels become new columns). */
const SHEET_SCRIPT = `function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var lastCol = sheet.getLastColumn();
  var headers = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  var added = Object.keys(data).filter(function (key) { return headers.indexOf(key) < 0; });
  if (added.length) {
    headers = headers.concat(added);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  sheet.appendRow(headers.map(function (h) { return data[h] !== undefined ? data[h] : ''; }));
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}`

const SHEET_URL = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/
const BOT_TOKEN = /^\d+:[\w-]{20,}$/

function CopyButton({ text, label = 'Chép' }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className="btn"
      onClick={() =>
        navigator.clipboard.writeText(text).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        })
      }
    >
      <Icon name={done ? 'check' : 'copy'} size={14} />
      {done ? 'Đã chép' : label}
    </button>
  )
}

/** One field of the form: its label, kind, whether it must be filled, and its choices for a select. */
function FieldRow({ f, index, count, onChange, onMove, onRemove }) {
  return (
    <div className="form-field-row">
      <div className="form-field-top">
        <input className="input" value={f.label} placeholder="Tên ô" onChange={(e) => onChange({ label: e.target.value }, 'label')} />
        <button type="button" className="icon-btn sm" title="Lên" disabled={index === 0} onClick={() => onMove(-1)}>
          <Icon name="front" size={13} />
        </button>
        <button type="button" className="icon-btn sm" title="Xuống" disabled={index === count - 1} onClick={() => onMove(1)}>
          <Icon name="back" size={13} />
        </button>
        <button type="button" className="icon-btn sm danger" title="Xoá ô này" disabled={count <= 1} onClick={onRemove}>
          <Icon name="trash" size={13} />
        </button>
      </div>
      <div className="grid2">
        <Select value={f.type} options={FORM_FIELD_TYPES} onChange={(v) => onChange({ type: v })} />
        <label className="check">
          <input type="checkbox" checked={!!f.required} onChange={(e) => onChange({ required: e.target.checked })} />
          Bắt buộc
        </label>
      </div>
      {f.type === 'select' ? (
        <textarea
          className="input"
          rows={3}
          value={f.options ?? ''}
          placeholder={'Mỗi dòng một lựa chọn\nVD: Căn hộ\nNhà phố'}
          onChange={(e) => onChange({ options: e.target.value }, 'options')}
        />
      ) : (
        <input className="input" value={f.placeholder ?? ''} placeholder="Chữ gợi ý trong ô (không bắt buộc)" onChange={(e) => onChange({ placeholder: e.target.value }, 'placeholder')} />
      )}
    </div>
  )
}

/** Where submissions go: a Google Sheet (through Apps Script) and / or a Telegram chat. */
function DestinationSection({ p, setProps }) {
  const [showSheetHelp, setShowSheetHelp] = useState(false)
  const [showBotHelp, setShowBotHelp] = useState(false)
  const [chats, setChats] = useState(null)
  const [busy, setBusy] = useState(null)
  const [result, setResult] = useState(null)

  const sheetBad = p.sheetUrl && !SHEET_URL.test(p.sheetUrl)
  const tokenBad = p.telegramToken && !BOT_TOKEN.test(p.telegramToken)
  const ready = (p.sheetUrl && !sheetBad) || (p.telegramToken && !tokenBad && p.telegramChatId)

  const run = async (kind, action) => {
    setBusy(kind)
    setResult(null)
    try {
      await action()
    } catch (e) {
      setResult({ error: e.message })
    } finally {
      setBusy(null)
    }
  }

  const findChats = () =>
    run('chats', async () => {
      const { chats } = await findTelegramChats(p.telegramToken)
      setChats(chats)
      if (chats.length === 1) setProps({ telegramChatId: String(chats[0].id) })
    })

  const test = () =>
    run('test', async () => {
      setResult(await testFormDestination({ sheetUrl: p.sheetUrl, telegramToken: p.telegramToken, telegramChatId: p.telegramChatId }))
    })

  const line = (name, r) => {
    if (r === undefined || r === null) return null
    if (r === 'slow') return <li className="ok">{name}: đã gửi, nhưng phản hồi chậm. Hãy mở Sheet xem dòng thử đã vào chưa.</li>
    return <li className={r === true ? 'ok' : 'bad'}>{name}: {r === true ? 'đã nhận được dòng thử ✓' : r}</li>
  }

  return (
    <Section title="Nhận dữ liệu">
      <p className="hint">
        Thông tin khách gửi sẽ chuyển về Google Sheet và / hoặc Telegram của bạn. Các cài đặt dưới đây không hiện trên trang
        công khai.
      </p>

      <Field label="Google Sheet — đường dẫn Apps Script">
        <input
          className="input"
          value={p.sheetUrl}
          placeholder="https://script.google.com/macros/s/…/exec"
          onChange={(e) => setProps({ sheetUrl: e.target.value.trim() }, 'sheetUrl')}
        />
      </Field>
      {sheetBad && <p className="warn">Đường dẫn phải có dạng https://script.google.com/macros/s/…/exec</p>}
      <button type="button" className="link-btn" onClick={() => setShowSheetHelp((v) => !v)}>
        {showSheetHelp ? 'Ẩn hướng dẫn' : 'Cách lấy đường dẫn Google Sheet'}
      </button>
      {showSheetHelp && (
        <div className="form-help">
          <ol>
            <li>Tạo một Google Sheet mới, vào menu <b>Tiện ích mở rộng → Apps Script</b>.</li>
            <li>Xoá hết code có sẵn, dán đoạn code dưới đây, bấm <b>Lưu</b>.</li>
            <li>
              Bấm <b>Triển khai → Tùy chọn triển khai mới</b>, chọn loại <b>Ứng dụng web</b>, mục “Người có quyền truy cập” chọn{' '}
              <b>Bất kỳ ai</b>, bấm Triển khai và cấp quyền.
            </li>
            <li>Chép <b>URL ứng dụng web</b> (kết thúc bằng /exec) và dán vào ô trên.</li>
          </ol>
          <pre className="form-code">{SHEET_SCRIPT}</pre>
          <CopyButton text={SHEET_SCRIPT} label="Chép code" />
        </div>
      )}

      <Field label="Telegram — token của bot">
        <input
          className="input"
          value={p.telegramToken}
          placeholder="123456789:AA…"
          spellCheck={false}
          onChange={(e) => setProps({ telegramToken: e.target.value.trim() }, 'telegramToken')}
        />
      </Field>
      {tokenBad && <p className="warn">Token chưa đúng dạng. Token do @BotFather gửi, dạng 123456789:AAx…</p>}
      <Field label="Telegram — chat ID nhận tin">
        <div className="form-inline">
          <input
            className="input"
            value={p.telegramChatId}
            placeholder="VD: 123456789 hoặc -100…"
            onChange={(e) => setProps({ telegramChatId: e.target.value.trim() }, 'telegramChatId')}
          />
          <button type="button" className="btn" onClick={findChats} disabled={!p.telegramToken || tokenBad || !!busy}>
            {busy === 'chats' ? 'Đang tìm…' : 'Lấy chat ID'}
          </button>
        </div>
      </Field>
      {chats && !chats.length && <p className="warn">Bot chưa nhận tin nhắn nào. Hãy nhắn cho bot (hoặc thêm bot vào nhóm) một tin bất kỳ rồi bấm lại.</p>}
      {chats && chats.length > 1 && (
        <div className="form-chats">
          {chats.map((c) => (
            <button key={c.id} type="button" className={`btn${String(c.id) === p.telegramChatId ? ' on' : ''}`} onClick={() => setProps({ telegramChatId: String(c.id) })}>
              {c.title}
            </button>
          ))}
        </div>
      )}
      <button type="button" className="link-btn" onClick={() => setShowBotHelp((v) => !v)}>
        {showBotHelp ? 'Ẩn hướng dẫn' : 'Cách tạo bot Telegram'}
      </button>
      {showBotHelp && (
        <div className="form-help">
          <ol>
            <li>Trên Telegram, nhắn cho <b>@BotFather</b> lệnh <code>/newbot</code>, đặt tên cho bot.</li>
            <li>BotFather gửi lại <b>token</b>: chép và dán vào ô token ở trên.</li>
            <li>Mở bot vừa tạo, bấm <b>Start</b> (hoặc thêm bot vào nhóm muốn nhận tin) và nhắn một tin bất kỳ.</li>
            <li>Bấm <b>Lấy chat ID</b> để điền chat ID tự động.</li>
          </ol>
        </div>
      )}

      <button type="button" className="btn block" onClick={test} disabled={!ready || !!busy}>
        <Icon name="send" size={14} />
        {busy === 'test' ? 'Đang gửi thử…' : 'Gửi thử một dòng'}
      </button>
      {result?.error && <p className="warn">{result.error}</p>}
      {result && !result.error && (
        <ul className="form-test-result">
          {line('Google Sheet', result.sheet)}
          {line('Telegram', result.telegram)}
        </ul>
      )}
      {!ready && (
        <p className="warn">
          Form này chưa có nơi nhận: khách bấm gửi sẽ được báo là trang chưa nhận thông tin. Mỗi form trên trang cài riêng.
        </p>
      )}
    </Section>
  )
}

/** Properties panel of a contact form: its fields, texts, colours and where submissions go. */
export default function FormSections({ el, setProps }) {
  const p = el.props
  const fields = p.fields ?? []
  const setFields = (next, key) => setProps({ fields: next }, key)
  const update = (i, patch, key) => setFields(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)), key && `fields.${i}.${key}`)
  const move = (i, d) => {
    const next = [...fields]
    next.splice(i + d, 0, ...next.splice(i, 1))
    setFields(next)
  }

  return (
    <>
      <Section title="Form">
        <Field label="Tên form (hiện trong tin nhắn / Google Sheet)">
          <input className="input" value={p.formName} maxLength={60} onChange={(e) => setProps({ formName: e.target.value }, 'formName')} />
        </Field>
        <Field label="Chữ trên nút gửi">
          <input className="input" value={p.submitText} maxLength={40} onChange={(e) => setProps({ submitText: e.target.value }, 'submitText')} />
        </Field>
        <Field label="Lời cảm ơn sau khi gửi">
          <textarea className="input" rows={2} value={p.successText} maxLength={200} onChange={(e) => setProps({ successText: e.target.value }, 'successText')} />
        </Field>
      </Section>

      <Section title={`Các ô nhập (${fields.length})`}>
        {fields.map((f, i) => (
          <FieldRow
            key={f.id}
            f={f}
            index={i}
            count={fields.length}
            onChange={(patch, key) => update(i, patch, key)}
            onMove={(d) => move(i, d)}
            onRemove={() => setFields(fields.filter((_, j) => j !== i))}
          />
        ))}
        <button
          type="button"
          className="btn block"
          disabled={fields.length >= 12}
          onClick={() => setFields([...fields, { id: uid(), label: 'Ô mới', type: 'text', required: false, placeholder: '' }])}
        >
          <Icon name="plus" size={14} />
          Thêm ô
        </button>
        <p className="hint">Form cao hơn khung sẽ tràn ra ngoài: kéo góc để đổi cỡ cho vừa.</p>
      </Section>

      <Section title="Ô nhập & nút">
        <Field label="Nền ô nhập">
          <ColorInput value={p.fieldColor} allowGradient={false} onChange={(v) => setProps({ fieldColor: v }, 'fieldColor')} />
        </Field>
        <Field label="Chữ trong ô">
          <ColorInput value={p.fieldTextColor} allowGradient={false} onChange={(v) => setProps({ fieldTextColor: v }, 'fieldTextColor')} />
        </Field>
        <Field label="Viền ô">
          <ColorInput value={p.fieldBorderColor} allowGradient={false} onChange={(v) => setProps({ fieldBorderColor: v }, 'fieldBorderColor')} />
        </Field>
        <Field label="Chữ trên nút gửi">
          <ColorInput value={p.accentTextColor} allowGradient={false} onChange={(v) => setProps({ accentTextColor: v }, 'accentTextColor')} />
        </Field>
        <Field label="Bo góc ô và nút">
          <NumberInput value={p.fieldRadius} min={0} max={30} suffix="px" onChange={(v) => setProps({ fieldRadius: v }, 'fieldRadius')} />
        </Field>
      </Section>

      <DestinationSection p={p} setProps={setProps} />
    </>
  )
}
