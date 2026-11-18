const TOKEN_KEY = 'hiverarchy_access_token'

function apiPrefix() {
  const base = import.meta.env.VITE_API_URL
  if (base) {
    return `${String(base).replace(/\/$/, '')}/api`
  }
  return '/api'
}

/** Resolve a server media path (e.g. `/media/…`) to a full URL for `<img src>`. */
export function mediaUrl(path) {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path
  }
  const base = import.meta.env.VITE_API_URL
  const p = path.startsWith('/') ? path : `/${path}`
  if (base) {
    return `${String(base).replace(/\/$/, '')}${p}`
  }
  return p
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function parseJwtPayload(token) {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

/**
 * @param {string} path - e.g. '/auth/login' (no /api prefix; it is added)
 * @param {RequestInit} [options]
 */
export async function apiFetch(path, options = {}) {
  const prefix = apiPrefix()
  const p = path.startsWith('/') ? path : `/${path}`
  const url = `${prefix}${p}`
  const headers = { ...options.headers }
  const isForm = options.body instanceof FormData
  if (!isForm && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message =
        body.message ||
        (Array.isArray(body.message) ? body.message.join(', ') : null) ||
        body.error ||
        message
    } catch {
      try {
        message = await res.text()
      } catch {
        /* ignore */
      }
    }
    const err = new Error(typeof message === 'string' ? message : res.statusText)
    err.status = res.status
    throw err
  }
  if (res.status === 204) return null
  const ct = res.headers.get('content-type')
  if (ct && ct.includes('application/json')) {
    return res.json()
  }
  return res.text()
}

export const api = {
  login: (body) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  authMe: () => apiFetch('/auth/me'),
  getProfileByUsername: (username) =>
    apiFetch(`/profiles/username/${encodeURIComponent(username)}`),
  getProfileMe: () => apiFetch('/profiles/me'),
  patchProfileMe: (body) =>
    apiFetch('/profiles/me', { method: 'PATCH', body: JSON.stringify(body) }),
  getInterestsByUsername: (username, includeInactive = false) => {
    const q = includeInactive ? '?include_inactive=1' : ''
    return apiFetch(`/interests/by-username/${encodeURIComponent(username)}${q}`)
  },
  getPost: (id) => apiFetch(`/posts/${encodeURIComponent(id)}`),
  getPostsByArc: (arcId) =>
    apiFetch(`/posts?arc_id=${encodeURIComponent(arcId)}`),
  getPostsByParent: (parentId) =>
    apiFetch(`/posts?parent_id=${encodeURIComponent(parentId)}`),
  getPostsByInterest: (name) =>
    apiFetch(`/posts?interest_name=${encodeURIComponent(name)}`),
  getPostsByUser: (userId) =>
    apiFetch(`/posts?user_id=${encodeURIComponent(userId)}`),
  createPost: (body) =>
    apiFetch('/posts', { method: 'POST', body: JSON.stringify(body) }),
  updatePost: (id, body) =>
    apiFetch(`/posts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deletePost: (id) =>
    apiFetch(`/posts/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getComments: (postId) => apiFetch(`/posts/${encodeURIComponent(postId)}/comments`),
  createComment: (postId, body) =>
    apiFetch(`/posts/${encodeURIComponent(postId)}/comments`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteComment: (id) =>
    apiFetch(`/comments/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getRefutations: (postId) =>
    apiFetch(`/posts/${encodeURIComponent(postId)}/refutations`),
  createRefutation: (postId, body) =>
    apiFetch(`/posts/${encodeURIComponent(postId)}/refutations`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteRefutation: (id) =>
    apiFetch(`/refutations/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  uploadMedia: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiFetch('/media/upload', { method: 'POST', body: fd })
  },
  embedPost: (postId) =>
    apiFetch(`/ai/embed-post/${encodeURIComponent(postId)}`, {
      method: 'POST',
      body: '{}',
    }),
  createInterest: (body) =>
    apiFetch('/interests/me', { method: 'POST', body: JSON.stringify(body) }),
  patchInterest: (id, body) =>
    apiFetch(`/interests/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteInterest: (id) =>
    apiFetch(`/interests/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getTagsByUsername: (username) =>
    apiFetch(`/tags/by-username/${encodeURIComponent(username)}`),
  createTag: (name) =>
    apiFetch('/tags/me', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteTag: (id) =>
    apiFetch(`/tags/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
