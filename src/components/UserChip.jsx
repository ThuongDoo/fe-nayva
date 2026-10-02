export default function UserChip({ user, onSignOut }) {
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
