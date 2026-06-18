import { API_BASE, getToken, CREDENTIALS, setToken } from './config'

export interface ApiError {
  status: number
  message: string
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: CREDENTIALS, // web: cookie (same-origin). desktop: omit (bearer only)
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    // A 401 on a data call means the session expired or is invalid. Clear it and
    // reload so the app returns to the login screen for a fresh sign-in. Skip
    // auth endpoints, whose 401 (bad credentials) the caller handles itself.
    if (res.status === 401 && !path.startsWith('/api/auth/')) {
      setToken(null)
      try {
        localStorage.removeItem('finmate-auth-user')
      } catch {
        /* ignore */
      }
      if (typeof window !== 'undefined') window.location.reload()
    }
    const message = (data && (data.error || data.message)) || res.statusText
    throw { status: res.status, message } as ApiError
  }
  return data as T
}

export const api = {
  get: <T>(p: string) => request<T>('GET', p),
  post: <T>(p: string, b?: unknown) => request<T>('POST', p, b),
  put: <T>(p: string, b?: unknown) => request<T>('PUT', p, b),
  patch: <T>(p: string, b?: unknown) => request<T>('PATCH', p, b),
  del: <T>(p: string, b?: unknown) => request<T>('DELETE', p, b),
}
