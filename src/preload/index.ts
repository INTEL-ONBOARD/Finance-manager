import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform as 'darwin' | 'win32' | 'linux',
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url),

  // Kept for finwise-theme only (AppShell.tsx)
  store: {
    get: (key: string): Promise<unknown> => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: unknown): Promise<void> => ipcRenderer.invoke('store:set', key, value),
    delete: (key: string): Promise<void> => ipcRenderer.invoke('store:delete', key),
  },

  // MongoDB-backed collections
  db: {
    transactions: {
      getAll: (): Promise<unknown[]> => ipcRenderer.invoke('db:transactions:getAll'),
      add: (doc: unknown): Promise<void> => ipcRenderer.invoke('db:transactions:add', doc),
      delete: (id: string): Promise<void> => ipcRenderer.invoke('db:transactions:delete', id),
    },
    goals: {
      getAll: (): Promise<unknown[]> => ipcRenderer.invoke('db:goals:getAll'),
      add: (doc: unknown): Promise<void> => ipcRenderer.invoke('db:goals:add', doc),
      update: (id: string, updates: unknown): Promise<void> => ipcRenderer.invoke('db:goals:update', id, updates),
      delete: (id: string): Promise<void> => ipcRenderer.invoke('db:goals:delete', id),
    },
    bills: {
      getAll: (): Promise<unknown[]> => ipcRenderer.invoke('db:bills:getAll'),
      togglePaid: (id: string): Promise<void> => ipcRenderer.invoke('db:bills:togglePaid', id),
    },
    accounts: {
      getAll: (): Promise<unknown[]> => ipcRenderer.invoke('db:accounts:getAll'),
    },
    notifications: {
      getAll: (): Promise<unknown[]> => ipcRenderer.invoke('db:notifications:getAll'),
      markRead: (id: string): Promise<void> => ipcRenderer.invoke('db:notifications:markRead', id),
      markAllRead: (): Promise<void> => ipcRenderer.invoke('db:notifications:markAllRead'),
    },
  },

  // Auto-updater
  updater: {
    check:    (): Promise<void> => ipcRenderer.invoke('updater:check'),
    download: (): Promise<void> => ipcRenderer.invoke('updater:download'),
    install:  (): Promise<void> => ipcRenderer.invoke('updater:install'),

    onChecking(cb: () => void): () => void {
      const l = () => cb()
      ipcRenderer.on('updater:checking', l)
      return () => ipcRenderer.removeListener('updater:checking', l)
    },
    onAvailable(cb: (info: { version: string; releaseNotes: string | null }) => void): () => void {
      const l = (_e: Electron.IpcRendererEvent, info: { version: string; releaseNotes: string | null }) => cb(info)
      ipcRenderer.on('updater:available', l)
      return () => ipcRenderer.removeListener('updater:available', l)
    },
    onNotAvailable(cb: () => void): () => void {
      const l = () => cb()
      ipcRenderer.on('updater:not-available', l)
      return () => ipcRenderer.removeListener('updater:not-available', l)
    },
    onProgress(cb: (p: { percent: number }) => void): () => void {
      const l = (_e: Electron.IpcRendererEvent, p: { percent: number }) => cb(p)
      ipcRenderer.on('updater:progress', l)
      return () => ipcRenderer.removeListener('updater:progress', l)
    },
    onDownloaded(cb: () => void): () => void {
      const l = () => cb()
      ipcRenderer.on('updater:downloaded', l)
      return () => ipcRenderer.removeListener('updater:downloaded', l)
    },
    onError(cb: (msg: string) => void): () => void {
      const l = (_e: Electron.IpcRendererEvent, msg: string) => cb(msg)
      ipcRenderer.on('updater:error', l)
      return () => ipcRenderer.removeListener('updater:error', l)
    },
  },
})
