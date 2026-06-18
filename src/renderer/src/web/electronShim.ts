import { api, ApiError } from './http'
import { getSocket, reconnectSocket } from './socket'
import { setToken } from './config'

// ── helpers ──────────────────────────────────────────────────────────────────
function errMsg(e: unknown, fallback: string): string {
  const m = (e as ApiError)?.message
  return typeof m === 'string' ? m : fallback
}

const fileStash = new Map<string, File>()

function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.style.position = 'fixed'
    input.style.left = '-9999px'
    let settled = false
    const done = (f: File | null) => {
      if (settled) return
      settled = true
      input.remove()
      resolve(f)
    }
    input.onchange = () => done(input.files?.[0] ?? null)
    // If the dialog is cancelled there is no change event; resolve null on refocus.
    window.addEventListener('focus', () => setTimeout(() => done(null), 400), { once: true })
    document.body.appendChild(input)
    input.click()
  })
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('read failed'))
    r.readAsDataURL(file)
  })
}

async function notify(title: string, body: string): Promise<void> {
  try {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
      new Notification(title, { body })
    } else if (Notification.permission !== 'denied') {
      const p = await Notification.requestPermission()
      if (p === 'granted') new Notification(title, { body })
    }
  } catch {
    /* notifications unavailable — ignore */
  }
}

const RESOURCES = ['transactions', 'goals', 'bills', 'accounts', 'notifications'] as const

// Builds an object matching the Electron preload API, backed by the HTTP API
// and a Socket.IO connection. userId args are ignored — the server derives the
// user from the auth token, never from the client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createElectronShim(): any {
  const resource = (name: string) => ({
    getAll: () => api.get(`/api/${name}`),
    add: (_userId: string, doc: unknown) => api.post(`/api/${name}`, doc).then(() => undefined),
    update: (_userId: string, id: string, updates: unknown) =>
      api.patch(`/api/${name}/${id}`, updates).then(() => undefined),
    delete: (_userId: string, id: string) => api.del(`/api/${name}/${id}`).then(() => undefined),
  })

  return {
    platform: 'web',
    getVersion: () => Promise.resolve('web'),
    openExternal: (url: string) => {
      window.open(url, '_blank', 'noopener,noreferrer')
      return Promise.resolve()
    },

    auth: {
      register: async (name: string, email: string, password: string) => {
        try {
          const r = await api.post<{ user: unknown; sessionId: string; accessToken: string }>(
            '/api/auth/register',
            { name, email, password }
          )
          setToken(r.accessToken)
          reconnectSocket()
          return { ok: true, user: r.user, sessionId: r.sessionId }
        } catch (e) {
          return { ok: false, error: errMsg(e, 'Registration failed') }
        }
      },
      login: async (email: string, password: string) => {
        try {
          const r = await api.post<{ user: unknown; sessionId: string; accessToken: string }>(
            '/api/auth/login',
            { email, password }
          )
          setToken(r.accessToken)
          reconnectSocket()
          return { ok: true, user: r.user, sessionId: r.sessionId }
        } catch (e) {
          return { ok: false, error: errMsg(e, 'Login failed') }
        }
      },
      userExists: async (email: string) => {
        try {
          const r = await api.get<{ exists: boolean }>(`/api/auth/exists?email=${encodeURIComponent(email)}`)
          return r.exists
        } catch {
          return false
        }
      },
      changePassword: async (_userId: string, oldPassword: string, newPassword: string) => {
        try {
          await api.post('/api/auth/change-password', { oldPassword, newPassword })
          return { ok: true }
        } catch (e) {
          return { ok: false, error: errMsg(e, 'Could not change password') }
        }
      },
    },

    store: {
      get: (key: string) => {
        try {
          const v = localStorage.getItem(`fw-store:${key}`)
          return Promise.resolve(v ? JSON.parse(v) : null)
        } catch {
          return Promise.resolve(null)
        }
      },
      set: (key: string, value: unknown) => {
        try {
          localStorage.setItem(`fw-store:${key}`, JSON.stringify(value))
        } catch {
          /* ignore */
        }
        return Promise.resolve()
      },
      delete: (key: string) => {
        try {
          localStorage.removeItem(`fw-store:${key}`)
        } catch {
          /* ignore */
        }
        return Promise.resolve()
      },
    },

    dialog: {
      openImage: async () => {
        const file = await pickFile('image/png,image/jpeg,image/webp')
        return file ? await fileToDataUrl(file) : null
      },
      openFile: async (filters?: { name: string; extensions: string[] }[]) => {
        const accept = filters?.flatMap((f) => f.extensions.map((e) => `.${e}`)).join(',') ?? '.xlsx,.xls,.csv'
        const file = await pickFile(accept)
        if (!file) return null
        const key = `web:${file.name}:${file.size}`
        fileStash.set(key, file)
        return key
      },
      readFile: async (pathOrKey: string) => {
        const file = fileStash.get(pathOrKey)
        if (!file) throw new Error('file not available')
        const dataUrl = await fileToDataUrl(file)
        return dataUrl.split(',')[1] ?? '' // base64 payload only, matching desktop
      },
    },

    db: {
      status: () => api.get('/api/db/status').catch((e) => ({ ready: false, error: errMsg(e, 'offline') })),
      reconnect: () => Promise.resolve({ ok: true }),
      transactions: resource('transactions'),
      goals: resource('goals'),
      bills: {
        ...resource('bills'),
        togglePaid: (_userId: string, id: string) =>
          api.post(`/api/bills/${id}/toggle-paid`).then(() => undefined),
      },
      accounts: resource('accounts'),
      notifications: {
        getAll: () => api.get('/api/notifications'),
        add: (_userId: string, doc: unknown) => api.post('/api/notifications', doc).then(() => undefined),
        markRead: (_userId: string, id: string) =>
          api.post(`/api/notifications/${id}/read`).then(() => undefined),
        markAllRead: () => api.post('/api/notifications/read-all').then(() => undefined),
      },
      clearUserData: () => api.del('/api/user/data').then(() => undefined),
      settings: {
        get: () => api.get('/api/settings'),
        save: (_userId: string, settings: unknown) => api.put('/api/settings', settings).then(() => undefined),
      },
      sessions: {
        list: () => api.get('/api/sessions'),
        revoke: (_userId: string, sessionId: string) =>
          api.del(`/api/sessions/${sessionId}`).then(() => undefined),
      },
      user: {
        avatar: {
          save: async (_userId: string, dataUrl: string) => {
            try {
              return await api.post<{ ok: boolean; avatar?: string }>('/api/user/avatar', { avatar: dataUrl })
            } catch (e) {
              return { ok: false, error: errMsg(e, 'Could not save avatar') }
            }
          },
        },
      },
    },

    notify: { send: (title: string, body: string) => notify(title, body) },

    // Web auto-updates on deploy; updater commands are no-ops.
    updater: {
      check: () => Promise.resolve(),
      download: () => Promise.resolve(),
      install: () => Promise.resolve(),
      onChecking: () => () => {},
      onAvailable: () => () => {},
      onNotAvailable: () => () => {},
      onProgress: () => () => {},
      onDownloaded: () => () => {},
      onError: () => () => {},
    },

    chat: {
      listUsers: () => api.get('/api/chat/users'),
      presencePing: () => {
        getSocket().emit('presence:ping')
        return Promise.resolve()
      },
      fetchMessages: (conversationId: string, limit: number, beforeSentAt?: string) => {
        const q = new URLSearchParams({ conversationId, limit: String(limit) })
        if (beforeSentAt) q.set('before', beforeSentAt)
        return api.get(`/api/chat/messages?${q.toString()}`)
      },
      sendMessage: (doc: unknown) => api.post('/api/chat/messages', doc).then(() => undefined),
      listConversations: () => api.get('/api/chat/conversations'),
      watchConversation: (conversationId: string) => {
        getSocket().emit('conversation:join', conversationId)
        return Promise.resolve()
      },
      unwatchConversation: (conversationId: string) => {
        getSocket().emit('conversation:leave', conversationId)
        return Promise.resolve()
      },
      onMessage: (cb: (p: { conversationId: string; message: unknown }) => void) => {
        const s = getSocket()
        s.on('chat:message', cb)
        return () => s.off('chat:message', cb)
      },
      onPresenceUpdate: (cb: (p: { userId: string; lastActiveAt: string }) => void) => {
        const s = getSocket()
        s.on('presence:update', cb)
        return () => s.off('presence:update', cb)
      },
    },

    // Cross-device live sync for finance data (not present on desktop).
    realtime: {
      onResourceChange: (
        cb: (e: { resource: string; action: 'created' | 'updated' | 'deleted'; payload: unknown }) => void
      ) => {
        const s = getSocket()
        const bound: Array<[string, (p: unknown) => void]> = []
        for (const r of RESOURCES) {
          for (const action of ['created', 'updated', 'deleted'] as const) {
            const handler = (payload: unknown) => cb({ resource: r, action, payload })
            s.on(`${r}:${action}`, handler)
            bound.push([`${r}:${action}`, handler])
          }
        }
        return () => bound.forEach(([ev, h]) => s.off(ev, h))
      },
    },
  }
}
