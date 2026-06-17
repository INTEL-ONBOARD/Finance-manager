import { io, Socket } from 'socket.io-client'
import { getToken, socketOrigin, socketPath } from './config'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (socket) return socket
  socket = io(socketOrigin(), {
    path: socketPath(),
    withCredentials: true,
    // Callback form so the latest token is sent on every (re)connect.
    auth: (cb: (data: { token: string }) => void) => cb({ token: getToken() ?? '' }),
    transports: ['websocket', 'polling'],
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
