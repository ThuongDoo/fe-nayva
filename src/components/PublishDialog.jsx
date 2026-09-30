import { useEffect, useRef, useState } from "react";
import DomainPicker from "./DomainPicker.jsx";
import Icon from "./Icon.jsx";
import { useUpload } from "./useUpload.jsx";
import {
  cancelDomainChange,
  cancelPublish,
  getPublishStatus,
  requestPublish,
  setMyDomain,
} from "../lib/api.js";
import { uploadIcon } from "../lib/cloud.js";
import { formatTime } from "../lib/format.js";
import { slugify } from "../lib/slug.js";
import { QuotaError } from "../lib/storageQuota.js";
import { normalizeThreadsUrl } from "../lib/threads.js";
import { TRIAL_DAYS, formatDate, siteExpiry } from "../lib/expiry.js";
import { useMissingImage } from "../lib/useMissingImage.js";

const POLL_MS = 5000;
const FAILED = ["ERROR", "CANCELED"];
const toDate = (iso) => (iso ? new Date(iso) : null);

/** Whether the site is still being built, so the dialog should keep checking. */
const inProgress = (s) =>
  s?.request?.status === "deploying" ||
  (s?.site && !s.site.url && !FAILED.includes(s.site.status));

const STEPS = ["Tiêu đề & icon", "Tên miền", "Liên hệ Threads", "Xác nhận"];

/** Step 1: the title shown on the browser tab and the favicon, edited right here. */
function SiteStep({ page, onPageChange }) {
  const fileRef = useRef(null);
  const upload = useUpload();
  const missing = useMissingImage(page.favicon);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      onPageChange({
        favicon: await upload.run((onProgress) =>
          uploadIcon(file, { onProgress }),
        ),
      });
    } catch (err) {
      console.error(err);
      alert(
        err instanceof QuotaError ? err.message : "Không tải được icon lên.",
      );
    }
  };

  return (
    <>
      <label className="wiz-field">
        <span>Tiêu đề web</span>
        <input
          className="input"
          value={page.title}
          maxLength={70}
          placeholder="VD: Tiệm bánh Mây"
          autoFocus
          onChange={(e) => onPageChange({ title: e.target.value }, "title")}
        />
        <small>Hiện trên tab trình duyệt và khi chia sẻ link.</small>
      </label>
      <div className="wiz-field">
        <span>Icon web</span>
        <div className="wiz-favicon">
          <span className="wiz-favicon-preview">
            {page.favicon && !missing ? (
              <img src={page.favicon} alt="" />
            ) : (
              <Icon name="image" size={26} />
            )}
          </span>
          <button
            type="button"
            className="btn upload-btn"
            onClick={() => fileRef.current?.click()}
            disabled={upload.busy}
          >
            <Icon name="upload" size={16} />
            {upload.busy
              ? upload.label
              : page.favicon
                ? "Đổi icon"
                : "Tải icon lên"}
            {upload.bar}
          </button>
          {page.favicon && (
            <button
              type="button"
              className="btn"
              onClick={() => onPageChange({ favicon: "" })}
              disabled={upload.busy}
            >
              Bỏ icon
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
          hidden
          onChange={onFile}
        />
        {missing && (
          <p className="warn">
            Icon đã bị xoá khỏi kho lưu trữ. Hãy tải icon khác lên.
          </p>
        )}
        <small>Nên dùng ảnh vuông, tối thiểu 64×64px. Không bắt buộc.</small>
      </div>
    </>
  );
}

/** Step 2: the user's one domain — pick it the first time, afterwards ask an admin to change it. */
function DomainStep({ domain, title, run, busy }) {
  const [changing, setChanging] = useState(false);

  if (!domain.name) {
    const choose = (name) => {
      const ok = confirm(
        `Chọn tên miền ${name}.${domain.rootDomain}?\n\nMỗi tài khoản chỉ có một tên miền. Sau này muốn đổi sẽ phải chờ quản trị viên duyệt.`,
      );
      if (ok) run(() => setMyDomain(name));
    };
    return (
      <>
        <p className="wiz-lead">
          Trang web của bạn sẽ có địa chỉ này. Mỗi tài khoản chỉ có một tên
          miền.
        </p>
        <DomainPicker
          rootDomain={domain.rootDomain}
          initial={slugify(title)}
          submitLabel="Chọn tên miền này"
          busy={busy}
          onSubmit={choose}
        />
      </>
    );
  }

  const pending = domain.status === "pending" || domain.status === "processing";
  return (
    <>
      <div className="wiz-summary-row big">
        <Icon name="globe" size={22} />
        <strong>{domain.domain}</strong>
        {!pending && !changing && (
          <button
            type="button"
            className="btn"
            onClick={() => setChanging(true)}
            disabled={busy}
          >
            Đổi tên miền
          </button>
        )}
      </div>
      {pending && (
        <div className="publish-state pending">
          <strong>Đang chờ duyệt đổi sang {domain.pendingDomain}</strong>
          <span>
            Gửi lúc {formatTime(toDate(domain.submittedAt))}. Tên mới đã được
            giữ cho bạn trong lúc chờ.
          </span>
          {domain.status === "pending" && (
            <button
              type="button"
              className="btn"
              onClick={() => run(cancelDomainChange)}
              disabled={busy}
            >
              Huỷ yêu cầu đổi
            </button>
          )}
        </div>
      )}
      {domain.status === "rejected" && !changing && (
        <div className="publish-state rejected">
          <strong>Yêu cầu đổi tên miền bị từ chối</strong>
          <span>Lý do: {domain.rejectReason}</span>
        </div>
      )}
      {changing && (
        <>
          <p className="wiz-lead">
            Đổi tên miền cần quản trị viên duyệt. Trang vẫn chạy ở tên miền cũ
            cho tới khi được duyệt.
          </p>
          <DomainPicker
            rootDomain={domain.rootDomain}
            submitLabel="Gửi yêu cầu đổi"
            busy={busy}
            onCancel={() => setChanging(false)}
            onSubmit={(name) =>
              run(() => setMyDomain(name)).then(
                (ok) => ok && setChanging(false),
              )
            }
          />
        </>
      )}
    </>
  );
}

/**
 * Why a Threads link is asked for, said up front in one plain sentence so it doesn't look like a scam:
 * it is only used to tell the user when their site is done.
 */
function ThreadsWhy() {
  return (
    <div className="wiz-why">
      <Icon name="shield" size={34} />
      <div>
        <strong>Vì sao cần link Threads?</strong>
        <p>
          Để chúng tôi <b>nhắn tin báo cho bạn khi trang web đã hoàn thiện</b>.
          Chỉ cần link trang cá nhân, không cần mật khẩu.
        </p>
      </div>
    </div>
  );
}

/** Step 3: how an admin can reach the user. Asked once; afterwards the saved link is just shown. */
function ThreadsStep({ saved, value, onChange, busy }) {
  if (saved) {
    return (
      <>
        <ThreadsWhy />
        <p className="wiz-lead">
          Quản trị viên sẽ liên hệ với bạn qua tài khoản Threads đã lưu:
        </p>
        <div className="wiz-summary-row big">
          <Icon name="at" size={22} />
          <a href={saved} target="_blank" rel="noopener noreferrer">
            {saved.replace(/^https:\/\/www\./, "")}
          </a>
        </div>
      </>
    );
  }
  const url = normalizeThreadsUrl(value);
  const invalid = value.trim() !== "" && !url;
  return (
    <>
      <ThreadsWhy />
      <label className="wiz-field">
        <span>Link tài khoản Threads</span>
        <input
          className="input"
          type="url"
          value={value}
          placeholder="https://www.threads.com/@tentaikhoan"
          autoFocus
          disabled={busy}
          aria-invalid={invalid}
          onChange={(e) => onChange(e.target.value)}
        />
        {invalid ? (
          <p className="warn">
            Link chưa đúng. Ví dụ: https://www.threads.com/@tentaikhoan hoặc
            @tentaikhoan
          </p>
        ) : url && url !== value.trim() ? (
          <small>Sẽ lưu là {url}</small>
        ) : (
          <small>
            Ví dụ: https://www.threads.com/@tentaikhoan hoặc @tentaikhoan. Chỉ
            cần nhập một lần, lần sau không hỏi lại.
          </small>
        )}
      </label>
    </>
  );
}

/**
 * Publishing a page to the user's domain, as four steps: title & icon, domain, Threads contact, confirm.
 * An admin then approves (the backend deploys it) or rejects it with a reason. `save()` must resolve to
 * true once the latest edits are in Firestore, since the backend publishes what is saved there.
 */
export default function PublishDialog({
  designId,
  page,
  onPageChange,
  save,
  onClose,
}) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [step, setStep] = useState(0);
  // Only asked for while the user has no Threads link on their profile.
  const [threads, setThreads] = useState("");
  // Set once the request has gone through: the dialog then just confirms it.
  const [sent, setSent] = useState(false);

  const loaded = useRef(false);
  useEffect(() => {
    let cancelled = false;
    getPublishStatus(designId).then(
      (s) => {
        if (cancelled) return;
        // A request already under way: open straight on the last step, where its state is shown.
        if (
          !loaded.current &&
          ["pending", "deploying"].includes(s.request?.status)
        )
          setStep(3);
        loaded.current = true;
        setStatus(s);
      },
      (e) => !cancelled && setError(e.message),
    );
    return () => {
      cancelled = true;
    };
  }, [designId, refresh]);

  const polling = inProgress(status);
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

  const { request, site, domain, otherOpen, contact } = status ?? {};
  const state = request?.status;
  const hasDomain = !!domain?.name;
  const liveHere = site?.designId === designId;
  const savedThreads = contact?.threadsUrl ?? null;
  const threadsUrl = savedThreads ?? normalizeThreadsUrl(threads);

  // What each step needs before moving on.
  const done = [!!page.title?.trim(), hasDomain, !!threadsUrl, false];
  const blocked = [
    "Hãy nhập tiêu đề web",
    "Hãy chọn tên miền",
    "Hãy nhập link Threads hợp lệ",
    "",
  ];
  const canOpen = (i) => done.slice(0, i).every(Boolean);

  const submit = () => {
    // Asked here, not when the admin approves: approval replaces the live site without further questions.
    if (
      site &&
      !liveHere &&
      !confirm(
        `Tên miền ${domain.domain} đang hiển thị trang “${site.title || "khác"}”.\n\n` +
          "Mỗi tài khoản chỉ được xuất bản một trang web. Khi yêu cầu này được duyệt, trang cũ sẽ bị XOÁ HẲN " +
          "và tên miền chuyển sang trang này.\n\nVẫn gửi yêu cầu?",
      )
    ) {
      return;
    }
    run(async () => {
      if (!(await save()))
        throw new Error(
          "Chưa lưu được thay đổi lên đám mây, nên chưa thể gửi duyệt.",
        );
      await requestPublish(designId, savedThreads ? undefined : threadsUrl);
    }).then((ok) => ok && setSent(true));
  };

  // One site per account, so only one request may wait at a time (the backend enforces this too).
  const canSubmit =
    canOpen(3) && !otherOpen && state !== "pending" && state !== "deploying";

  let requestState = null;
  if (state === "pending") {
    requestState = (
      <div className="publish-state pending">
        <strong>Đang chờ quản trị viên duyệt</strong>
        <span>
          Gửi lúc {formatTime(toDate(request.submittedAt))}. Trang sẽ được xuất
          bản ngay khi được duyệt.
        </span>
        <small>
          Những chỉnh sửa sau thời điểm gửi sẽ không có trong lần xuất bản này.
        </small>
      </div>
    );
  } else if (state === "deploying") {
    requestState = (
      <div className="publish-state pending">
        <strong>Đã được duyệt, đang triển khai…</strong>
      </div>
    );
  } else if (state === "rejected") {
    requestState = (
      <div className="publish-state rejected">
        <strong>Yêu cầu xuất bản trước bị từ chối</strong>
        <span>Lý do: {request.rejectReason}</span>
        <small>Hãy chỉnh sửa theo góp ý rồi gửi lại.</small>
      </div>
    );
  }

  let siteState = null;
  const exp = siteExpiry(site);
  if (site && liveHere && exp?.expired) {
    siteState = (
      <div className="publish-state rejected">
        <strong>Trang web đã hết hạn</strong>
        <span>
          Hết hạn ngày {formatDate(exp.end)}. Khách truy cập đang thấy thông báo
          “Trang web đã hết hạn”. Hãy liên hệ quản trị viên để thanh toán gia
          hạn 3, 6 hoặc 12 tháng — trang sẽ chạy lại ngay.
        </span>
      </div>
    );
  } else if (site && liveHere) {
    siteState = site.url ? (
      <div className="publish-state live">
        <strong>Trang này đang được xuất bản</strong>
        <a href={site.url} target="_blank" rel="noopener noreferrer">
          {site.url}
          <Icon name="external" size={12} />
        </a>
        <small>Cập nhật lần cuối: {formatTime(toDate(site.deployedAt))}</small>
        {exp && (
          <span className={`expiry-line tone-${exp.tone}`}>
            <b>Hạn dùng:</b> {exp.label}
            {exp.trial &&
              ` · đang dùng thử ${TRIAL_DAYS} ngày. Thanh toán để gia hạn 3, 6 hoặc 12 tháng, quản trị viên sẽ liên hệ qua Threads.`}
          </span>
        )}
      </div>
    ) : (
      !FAILED.includes(site.status) && (
        <div className="publish-state pending">
          <strong>Đang triển khai trang…</strong>
        </div>
      )
    );
  } else if (site) {
    siteState = (
      <div className="publish-state pending">
        <strong>Tên miền đang hiển thị trang “{site.title || "khác"}”</strong>
        <span>
          Mỗi tài khoản chỉ được xuất bản một trang web. Khi yêu cầu này được
          duyệt, trang cũ sẽ bị xoá hẳn khỏi máy chủ và tên miền chuyển sang
          trang này.
        </span>
      </div>
    );
  }

  const confirmStep = (
    <>
      <div className="wiz-summary">
        <div className="wiz-summary-row">
          <span className="wiz-favicon-preview sm">
            {page.favicon ? (
              <img src={page.favicon} alt="" />
            ) : (
              <Icon name="image" size={18} />
            )}
          </span>
          <span className="wiz-summary-text">
            <small>Tiêu đề & icon</small>
            <strong>{page.title || "Chưa đặt tiêu đề"}</strong>
          </span>
          <button
            type="button"
            className="btn ghost"
            onClick={() => setStep(0)}
            disabled={busy}
          >
            Sửa
          </button>
        </div>
        <div className="wiz-summary-row">
          <Icon name="globe" size={22} />
          <span className="wiz-summary-text">
            <small>Tên miền</small>
            <strong>{domain?.domain}</strong>
          </span>
          <button
            type="button"
            className="btn ghost"
            onClick={() => setStep(1)}
            disabled={busy}
          >
            Sửa
          </button>
        </div>
        <div className="wiz-summary-row">
          <Icon name="at" size={22} />
          <span className="wiz-summary-text">
            <small>Liên hệ Threads</small>
            <strong>{threadsUrl?.replace(/^https:\/\/www\./, "")}</strong>
          </span>
          {!savedThreads && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => setStep(2)}
              disabled={busy}
            >
              Sửa
            </button>
          )}
        </div>
      </div>
      {siteState}
      {requestState}
      {otherOpen && (
        <div className="publish-state pending">
          <strong>
            Trang “{otherOpen.title}” đang{" "}
            {otherOpen.status === "deploying"
              ? "được triển khai"
              : "chờ duyệt xuất bản"}
          </strong>
          <span>
            Mỗi tài khoản chỉ có một trang web nên chỉ gửi được một yêu cầu mỗi
            lần. Hãy mở trang đó và huỷ yêu cầu, hoặc đợi quản trị viên xử lý
            xong.
          </span>
        </div>
      )}
      <p className="wiz-lead">
        Để tránh spam, mỗi lần xuất bản cần quản trị viên duyệt. Trang sẽ lên
        mạng ngay khi được duyệt.
      </p>
    </>
  );

  const body = !status
    ? null
    : [
        <SiteStep key="site" page={page} onPageChange={onPageChange} />,
        <DomainStep
          key="domain"
          domain={domain}
          title={page.title}
          run={run}
          busy={busy}
        />,
        <ThreadsStep
          key="threads"
          saved={savedThreads}
          value={threads}
          onChange={setThreads}
          busy={busy}
        />,
        confirmStep,
      ][step];

  if (sent) {
    return (
      <div
        className="modal-backdrop"
        onPointerDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="modal wizard wiz-sent"
          role="alertdialog"
          aria-label="Đã gửi yêu cầu xuất bản"
          onKeyDown={(e) => e.key === "Escape" && onClose()}
        >
          <span className="wiz-sent-icon">
            <Icon name="check" size={44} />
          </span>
          <h3>Đã gửi yêu cầu thành công!</h3>
          <p>
            Yêu cầu xuất bản đang <b>chờ quản trị viên xử lý</b>. Chúng tôi sẽ
            nhắn cho bạn qua Threads khi trang web hoàn thiện. Trang mới xuất
            bản có hiệu lực trong 3 tháng.
          </p>
          <button
            type="button"
            className="btn primary"
            onClick={onClose}
            autoFocus
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  const last = step === STEPS.length - 1;
  return (
    <div
      className="modal-backdrop"
      onPointerDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        className="modal wizard"
        role="dialog"
        aria-label="Xuất bản trang"
        onKeyDown={(e) => e.key === "Escape" && !busy && onClose()}
      >
        <div className="wiz-head">
          <h3>Xuất bản trang</h3>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            disabled={busy}
            aria-label="Đóng"
            title="Đóng"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <ol className="wiz-steps">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={`wiz-step${i === step ? " current" : ""}${i < step && done[i] ? " done" : ""}`}
            >
              <button
                type="button"
                onClick={() => setStep(i)}
                disabled={busy || !status || i === step || !canOpen(i)}
              >
                <span className="wiz-dot">
                  {i < step && done[i] ? (
                    <Icon name="check" size={18} />
                  ) : (
                    i + 1
                  )}
                </span>
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
            <button
              type="button"
              className="btn"
              onClick={() => setStep(step - 1)}
              disabled={busy}
            >
              <Icon name="chevronLeft" size={18} />
              Quay lại
            </button>
          )}
          <div className="spacer" />
          {last && state === "pending" && (
            <button
              type="button"
              className="btn"
              onClick={() => run(() => cancelPublish(designId))}
              disabled={busy}
            >
              Huỷ yêu cầu xuất bản
            </button>
          )}
          {!last ? (
            <button
              type="button"
              className="btn primary"
              onClick={() => setStep(step + 1)}
              disabled={busy || !status || !done[step]}
              title={done[step] ? undefined : blocked[step]}
            >
              Tiếp tục
              <Icon name="chevronRight" size={18} />
            </button>
          ) : (
            <button
              type="button"
              className="btn primary"
              onClick={submit}
              disabled={busy || !canSubmit}
            >
              {busy
                ? "Đang gửi…"
                : liveHere && site?.url
                  ? "Gửi bản cập nhật để duyệt"
                  : "Gửi yêu cầu xuất bản"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
