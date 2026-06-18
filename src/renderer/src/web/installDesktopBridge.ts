import { createElectronShim } from './electronShim'

// Desktop "backend mode": keep the native Electron capabilities (window/theme
// store, OS notifications, auto-updater, platform) but route data, auth, chat,
// and realtime through the shared backend — same as the web app. This makes the
// desktop and web share live state and removes the embedded DB connection.
//
// Enabled at build time with VITE_USE_BACKEND=true (see package.json
// build:desktop:backend). When off, the desktop is completely unchanged.
export function installDesktopBackendBridge(): void {
  if (typeof window === 'undefined' || !window.electron) return
  const native = window.electron
  const backend = createElectronShim()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).electron = {
    ...native, // keep native: platform, getVersion, openExternal, store, notify, updater
    auth: backend.auth,
    db: backend.db,
    chat: backend.chat,
    realtime: backend.realtime,
    // Use the browser file-input dialog so avatar/import produce data the
    // backend understands (the native dialog returns OS file paths instead).
    dialog: backend.dialog,
  }
}
