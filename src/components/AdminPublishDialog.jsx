import { useEffect, useState } from "react";
import DomainPicker from "./DomainPicker.jsx";
import Icon from "./Icon.jsx";
import { SiteStep } from "./PublishDialog.jsx";
import { getAdminSite, publishAdminSite, takeDownAdminSite } from "../lib/api.js";
import { formatTime } from "../lib/format.js";
import { slugify } from "../lib/slug.js";

const POLL_MS = 5000;
const FAILED = ["ERROR", "CANCELED"];
const building = (site) => !!site && !site.url && !FAILED.includes(site.status);

const STEPS = ["Tiêu đề & icon", "Tên miền & xuất bản"];

/**
 * Publishing for admins (see PublishDialog for users'): every design can have its own site at its own
 * domain, deployed at once, without review or expiry. `save()` must resolve to true once the latest
 * edits are in Firestore, since the backend publishes what is saved there.
 */
export default function AdminPublishDialog({ designId, page, onPageChange, save, onClose }) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [step, setStep] = useState(0);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAdminSite(designId).then(
      (s) => !cancelled && setStatus(s),
      (e) => !cancelled && setError(e.message),
    );
    return () => {
      cancelled = true;
    };
  }, [designId, refresh]);

  const site = status?.site ?? null;
  const polling = building(site);
  useEffect(() => {
    if (!polling) return;
    const t = setTimeout(() => setRefresh((n) => n + 1), POLL_MS);
    return () => clearTimeout(t);
  }, [polling, status]);

  /** Runs an API action, then reloads the status. Resolves to whether it succeeded. */
  const run = async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
      setRefresh((n) => n + 1);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const publish = (name) =>
    run(async () => {
      if (!(await save())) throw new Error("Chưa lưu được thay đổi lên đám mây, nên chưa thể xuất bản.");
      const result = await publishAdminSite(designId, name);
      if (result.missingImages?.length) {
        alert(`${result.missingImages.length} ảnh không còn trong kho lưu trữ nên không có trên trang web.`);
      }
    }).then((ok) => ok && setChanging(false));

  const takeDown = () => {
    if (!confirm(`Gỡ trang web ${site.domain}?\n\nTrang sẽ bị xoá khỏi Vercel và tên miền được giải phóng. Thiết kế vẫn được giữ.`)) return;
    run(() => takeDownAdminSite(designId));
  };

  let publishStep = null;
  if (status && (!site || changing)) {
    publishStep = (
      <>
        <p className="wiz-lead">
          {site
            ? "Trang sẽ chuyển sang tên miền mới; tên miền cũ được giải phóng."
            : "Tài khoản quản trị có thể xuất bản bao nhiêu trang cũng được, mỗi trang một tên miền. Trang lên mạng ngay, không cần duyệt và không hết hạn."}
        </p>
        <DomainPicker
          rootDomain={status.rootDomain}
          initial={site?.name ?? slugify(page.title)}
          designId={designId}
          submitLabel={site ? "Chuyển sang tên miền này" : "Xuất bản ngay"}
          busy={busy}
          onCancel={site ? () => setChanging(false) : undefined}
          onSubmit={publish}
        />
      </>
    );
  } else if (site) {
    publishStep = (
      <>
        <div className="wiz-summary-row big">
          <Icon name="globe" size={22} />
          <strong>{site.domain}</strong>
          <button type="button" className="btn" onClick={() => setChanging(true)} disabled={busy}>
            Đổi tên miền
          </button>
        </div>
        {site.url ? (
          <div className="publish-state live">
            <strong>Trang này đang được xuất bản</strong>
            <a href={site.url} target="_blank" rel="noopener noreferrer">
              {site.url}
              <Icon name="external" size={12} />
            </a>
            <small>Cập nhật lần cuối: {formatTime(site.deployedAt && new Date(site.deployedAt))}</small>
          </div>
        ) : FAILED.includes(site.status) ? (
          <div className="publish-state rejected">
            <strong>Triển khai thất bại</strong>
            <span>Hãy thử xuất bản lại.</span>
          </div>
        ) : (
          <div className="publish-state pending">
            <strong>Đang triển khai trang…</strong>
          </div>
        )}
      </>
    );
  }

  const body = !status ? null : step === 0 ? <SiteStep page={page} onPageChange={onPageChange} /> : publishStep;

  return (
    <div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div
        className="modal wizard"
        role="dialog"
        aria-label="Xuất bản trang"
        onKeyDown={(e) => e.key === "Escape" && !busy && onClose()}
      >
        <div className="wiz-head">
          <h3>Xuất bản trang</h3>
          <button type="button" className="icon-btn" onClick={onClose} disabled={busy} aria-label="Đóng" title="Đóng">
            <Icon name="close" size={20} />
          </button>
        </div>

        <ol className="wiz-steps">
          {STEPS.map((label, i) => (
            <li key={label} className={`wiz-step${i === step ? " current" : ""}${i < step ? " done" : ""}`}>
              <button
                type="button"
                onClick={() => setStep(i)}
                disabled={busy || !status || i === step || (i > 0 && !page.title?.trim())}
              >
                <span className="wiz-dot">{i < step ? <Icon name="check" size={18} /> : i + 1}</span>
                <span className="wiz-label">{label}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="wiz-body">
          <h4 className="wiz-title">
            Bước {step + 1}. {STEPS[step]}
          </h4>
          {!status ? !error && <p className="wiz-lead">Đang tải…</p> : body}
          {error && <p className="warn">{error}</p>}
        </div>

        <div className="wiz-actions">
          {step > 0 && (
            <button type="button" className="btn" onClick={() => setStep(0)} disabled={busy}>
              <Icon name="chevronLeft" size={18} />
              Quay lại
            </button>
          )}
          <div className="spacer" />
          {step === 0 ? (
            <button
              type="button"
              className="btn primary"
              onClick={() => setStep(1)}
              disabled={busy || !status || !page.title?.trim()}
              title={page.title?.trim() ? undefined : "Hãy nhập tiêu đề web"}
            >
              Tiếp tục
              <Icon name="chevronRight" size={18} />
            </button>
          ) : (
            site &&
            !changing && (
              <>
                <button type="button" className="btn" onClick={takeDown} disabled={busy}>
                  Gỡ trang web
                </button>
                <button type="button" className="btn primary" onClick={() => publish(site.name)} disabled={busy || polling}>
                  {busy ? "Đang xuất bản…" : "Xuất bản bản mới nhất"}
                </button>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
