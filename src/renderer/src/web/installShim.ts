import { createElectronShim } from './electronShim'

// On the web there is no Electron preload, so we install a window.electron that
// implements the same interface against the backend. No-op inside Electron.
export function installWebShim(): void {
  if (typeof window === 'undefined') return
  if (window.electron) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).electron = createElectronShim()
}
