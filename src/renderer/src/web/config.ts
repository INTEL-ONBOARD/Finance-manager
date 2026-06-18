// Where the backend is reachable. On the VPS the web app is served same-origin
// as the API path (/finwise), so a relative base works and cookies flow.
// Override for local dev with VITE_API_BASE (e.g. https://84.247.139.75/finwise).
export const API_BASE: string =
  ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE) ?? '/finwise'

// Desktop backend mode (VITE_USE_BACKEND=true) reaches the backend cross-origin
// from a file:// renderer, so it authenticates with the bearer token only (no
// cookies) and the Electron main process injects the CORS response headers. The
// web build stays same-origin and cookie-based.
export const IS_DESKTOP_BACKEND: boolean =
  ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_USE_BACKEND) === 'true'

export const CREDENTIALS: RequestCredentials = IS_DESKTOP_BACKEND ? 'omit' : 'include'

const TOKEN_KEY = 'finwise-access-token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore storage errors */
  }
}

// Socket.IO connects to the API origin with the prefixed path; Caddy strips
// the /finwise prefix before the request reaches the server (path /socket.io).
export function socketOrigin(): string {
  if (/^https?:\/\//.test(API_BASE)) return new URL(API_BASE).origin
  return window.location.origin
}

export function socketPath(): string {
  const p = /^https?:\/\//.test(API_BASE) ? new URL(API_BASE).pathname : API_BASE
  return `${p.replace(/\/$/, '')}/socket.io`
}
