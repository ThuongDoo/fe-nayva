import { signIn } from '../lib/cloud.js'

export default function UserChip({ user, onSignOut }) {
  // An anonymous guest (opened a share link without an account) can sign in with Google instead.
  if (user.isAnonymous) {
    return (
      <div className="user-chip" title="Bạn đang sửa trang với tư cách khách, chưa đăng nhập">
        <span className="user-initial">K</span>
        <button type="button" className="btn ghost" onClick={() => signIn().catch((e) => console.error(e))}>
          Đăng nhập
        </button>
      </div>
    )
  }
  return (
    <div className="user-chip" title={[user.displayName, user.email].filter(Boolean).join('\n')}>
      {user.photoURL ? (
        <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
      ) : (
        <span className="user-initial">{(user.displayName || user.email || '?')[0].toUpperCase()}</span>
      )}
      <button type="button" className="btn ghost" onClick={onSignOut}>
        Đăng xuất
      </button>
    </div>
  )
}
