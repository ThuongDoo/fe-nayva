/** Calls to the nayva-be backend, authenticated with the signed-in user's Firebase ID token. */
import { auth } from './firebase.js'

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '')

async function api(path, { method = 'GET', body } = {}) {
  const user = auth.currentUser
  if (!user) throw new Error('Chưa đăng nhập')
  let res
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
        ...(body && { 'Content-Type': 'application/json' }),
      },
      body: body && JSON.stringify(body),
    })
  } catch {
    throw new Error('Không kết nối được máy chủ. Hãy thử lại sau.')
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.message || `Lỗi máy chủ (${res.status})`), { status: res.status })
  return data
}

const enc = encodeURIComponent

// ---------------------------------------------------------------- domain (user)

/** `{ name, domain, available, reason }` for a wanted site name. */
export const checkDomain = (name) => api(`/domains/check?name=${enc(name)}`)

/**
 * `{ rootDomain, domain, name, pendingDomain, pendingName, status, submittedAt, rejectReason }`;
 * `status` is 'pending' while a change waits for an admin.
 */
export const getMyDomain = () => api('/me/domain')

/** Sets the first domain right away; later calls file a change request for an admin to approve. */
export const setMyDomain = (name) => api('/me/domain', { method: 'PUT', body: { name } })

export const cancelDomainChange = () => api('/me/domain/pending', { method: 'DELETE' })

// ---------------------------------------------------------------- publishing (user)

/**
 * `{ request, site, domain, contact }` for one of the user's designs: its publish request (or null), the
 * user's live site (or null; `site.designId` is the design shown there), their domain settings and
 * `contact.threadsUrl` (null until they have given it).
 */
export const getPublishStatus = (designId) => api(`/designs/${enc(designId)}/publish`)

/**
 * Sends the design (as saved in Firestore) for admin review. `threadsUrl`: the user's Threads link, needed
 * the first time (it's kept on their profile afterwards).
 */
export const requestPublish = (designId, threadsUrl) =>
  api(`/designs/${enc(designId)}/publish`, { method: 'POST', ...(threadsUrl && { body: { threadsUrl } }) })

/**
 * `{ requests: { [designId]: request }, site }`: every design's latest publish request, and the live site
 * (or null; `site.designId` is the design being shown). Used for the badges on the home screen.
 */
export const getPublishOverview = () => api('/me/publish-overview')

export const cancelPublish = (designId) => api(`/designs/${enc(designId)}/publish`, { method: 'DELETE' })

// ---------------------------------------------------------------- publishing (admin)

export const listPublishRequests = (status = 'pending') => api(`/admin/publish-requests?status=${enc(status)}`)

/** One request including its design snapshot. */
export const getPublishRequest = (id) => api(`/admin/publish-requests/${enc(id)}`)

export const approvePublishRequest = (id) => api(`/admin/publish-requests/${enc(id)}/approve`, { method: 'POST' })

export const rejectPublishRequest = (id, reason) =>
  api(`/admin/publish-requests/${enc(id)}/reject`, { method: 'POST', body: { reason } })

// ---------------------------------------------------------------- published sites & expiry (admin)

/**
 * `{ sites, extendMonths }`: every published site (expiresAt, expired, extensions…) with its owner
 * (`user: { name, email, picture, threadsUrl }`), the soonest to expire first.
 */
export const listAdminSites = () => api('/admin/sites')

/** Extends a user's site by 3, 6 or 12 months after they paid; an expired site comes back online. */
export const extendAdminSite = (uid, months) => api(`/admin/sites/${enc(uid)}/extend`, { method: 'POST', body: { months } })

/** Takes down every site past its date now (the server also does this every 10 minutes). */
export const expireDueSites = () => api('/admin/sites/expire-due', { method: 'POST' })

/** Cancels the time left on a user's site: it expires and goes offline now (extending brings it back). */
export const revokeAdminSite = (uid) => api(`/admin/sites/${enc(uid)}/revoke`, { method: 'POST' })

/** Admin: `{ starred?, labels? }` on a site (a star for "needs attention", label ids). Resolves to `{ starred, labels }`. */
export const markAdminSite = (uid, marks) => api(`/admin/sites/${enc(uid)}/marks`, { method: 'PATCH', body: marks })

/** Admin: replaces the shared label list `[{ id, name, color }]`. Resolves to `{ labels }`. */
export const saveSiteLabels = (labels) => api('/admin/site-labels', { method: 'PUT', body: { labels } })

// ---------------------------------------------------------------- domain changes (admin)

export const listDomainRequests = (status = 'pending') => api(`/admin/domain-requests?status=${enc(status)}`)

export const approveDomainRequest = (uid) => api(`/admin/domain-requests/${enc(uid)}/approve`, { method: 'POST' })

export const rejectDomainRequest = (uid, reason) =>
  api(`/admin/domain-requests/${enc(uid)}/reject`, { method: 'POST', body: { reason } })

// ---------------------------------------------------------------- storage cleanup

/**
 * Asks the backend to delete this user's uploads that no design uses any more (after a 24h grace
 * period). Fire-and-forget: it is rate-limited server side and failures don't matter to the user.
 */
export const cleanupMyStorage = () => api('/me/storage/cleanup', { method: 'POST' })

/** Admin: sweep every user's uploads and the template images. */
export const cleanupAllStorage = () => api('/admin/storage/cleanup', { method: 'POST' })

// ---------------------------------------------------------------- upload quota

/** `{ usedBytes, limitBytes }` for the signed-in user, recomputed from Storage. */
export const getMyUsage = () => api('/me/storage/usage')

/** Usage plus every uploaded file: `{ usedBytes, limitBytes, files: [{ path, name, kind, size, url, usedIn, … }] }`. */
export const getMyStorage = () => api('/me/storage')

/** Deletes one uploaded file; resolves to the new `{ usedBytes, limitBytes }`. */
export const deleteMyFile = (path) => api(`/me/storage/files?path=${enc(path)}`, { method: 'DELETE' })

/** Deletes several uploaded files in one request; resolves to `{ usedBytes, limitBytes, deleted, failed }`. */
export const deleteMyFiles = (paths) => api('/me/storage/files/delete', { method: 'POST', body: { paths } })
