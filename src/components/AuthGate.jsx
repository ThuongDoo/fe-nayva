import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import App from '../App.jsx'
import AdminPage from './AdminPage.jsx'
import Home from './Home.jsx'
import Login from './Login.jsx'
import { ROLES, loadDesignForEdit, saveUserProfile } from '../lib/cloud.js'
import { auth, firebaseConfigured } from '../lib/firebase.js'
import { goHome, useRoute } from '../lib/route.js'

function Splash({ children }) {
  return (
    <div className="login">
      <div className="login-card">{children}</div>
    </div>
  )
}

/**
 * Loads one design from Firestore, then hands it to the editor. `ownerUid`: whose design it is; another
 * user's design opens only while they share it for editing.
 */
function EditorLoader({ user, ownerUid, designId, isAdmin }) {
  const [loaded, setLoaded] = useState(null)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    loadDesignForEdit(ownerUid, designId).then(
      (d) => !cancelled && (d ? setLoaded(d) : setError(new Error('Trang này không tồn tại hoặc đã bị xoá.'))),
      (e) =>
        !cancelled &&
        setError(
          e.code === 'permission-denied'
            ? new Error('Trang này không được chia sẻ, hoặc chủ trang đã tắt chia sẻ. Hãy xin chủ trang bật lại.')
            : e,
        ),
    )
    return () => {
      cancelled = true
    }
  }, [ownerUid, designId, attempt])

  if (error) {
    return (
      <Splash>
        <h1>Không mở được trang</h1>
        <p className="login-error">{error.message}</p>
        <button type="button" className="login-btn" onClick={() => { setError(null); setAttempt((n) => n + 1) }}>
          Thử lại
        </button>
        <button type="button" className="login-btn" onClick={goHome}>
          Về trang chủ
        </button>
      </Splash>
    )
  }
  if (!loaded) return <Splash><p>Đang mở trang…</p></Splash>
  return (
    <App
      user={user}
      ownerUid={ownerUid}
      designId={designId}
      initialDoc={loaded.design}
      initialShareEdit={loaded.shareEdit}
      isAdmin={isAdmin}
    />
  )
}

export default function AuthGate() {
  // undefined: Firebase is still restoring the session; null: signed out.
  const [user, setUser] = useState(undefined)
  // Tagged with the uid it was checked for, so a previous account's answer is never used.
  const [admin, setAdmin] = useState({ uid: null, value: false })
  const route = useRoute()

  useEffect(() => {
    if (!firebaseConfigured) return
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      if (!u) return
      saveUserProfile(u).then(
        (role) => setAdmin({ uid: u.uid, value: role === ROLES.admin }),
        (e) => {
          console.error('Không lưu được thông tin người dùng', e)
          setAdmin({ uid: u.uid, value: false })
        },
      )
    })
  }, [])

  const adminKnown = !!user && admin.uid === user.uid
  const isAdmin = adminKnown && admin.value

  if (!firebaseConfigured) {
    return (
      <Splash>
        <h1>Chưa cấu hình Firebase</h1>
        <p>
          Sao chép <code>.env.example</code> thành <code>.env.local</code>, điền thông tin dự án Firebase của bạn rồi
          khởi động lại <code>yarn dev</code>.
        </p>
      </Splash>
    )
  }
  if (user === undefined) return <Splash><p>Đang kiểm tra đăng nhập…</p></Splash>
  // A share link asks for Google sign-in too; the link stays in the address bar, so the design opens afterwards.
  if (!user) return <Login />
  if (route.name === 'design') {
    const ownerUid = route.owner ?? user.uid
    return (
      <EditorLoader
        key={`${user.uid}/${ownerUid}/${route.id}`}
        user={user}
        ownerUid={ownerUid}
        designId={route.id}
        isAdmin={isAdmin}
      />
    )
  }
  if (route.name === 'admin') {
    if (!adminKnown) return <Splash><p>Đang kiểm tra quyền…</p></Splash>
    if (!isAdmin) {
      return (
        <Splash>
          <h1>Không có quyền truy cập</h1>
          <p>Trang này chỉ dành cho quản trị viên.</p>
          <button type="button" className="login-btn" onClick={goHome}>
            Về trang chủ
          </button>
        </Splash>
      )
    }
    return <AdminPage key={user.uid} user={user} />
  }
  return <Home key={user.uid} user={user} isAdmin={isAdmin} />
}

