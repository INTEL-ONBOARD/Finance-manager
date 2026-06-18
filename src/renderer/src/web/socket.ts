import { io, Socket } from 'socket.io-client'
import { getToken, socketOrigin, socketPath, IS_DESKTOP_BACKEND } from './config'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (socket) return socket
  socket = io(socketOrigin(), {
    path: socketPath(),
    withCredentials: !IS_DESKTOP_BACKEND,
    // Desktop (file://) connects WebSocket-only so the polling handshake never
    // triggers CORS; WebSocket connections are not CORS-restricted by browsers.
    transports: IS_DESKTOP_BACKEND ? ['websocket'] : ['websocket', 'polling'],
    // Callback form so the latest token is sent on every (re)connect.
    auth: (cb: (data: { token: string }) => void) => cb({ token: getToken() ?? '' }),
  })
  return socket
}

// Called after login/logout so the socket re-authenticates with the new token.
export function reconnectSocket(): void {
  const s = getSocket()
  if (s.connected) s.disconnect()
  s.connect()
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
