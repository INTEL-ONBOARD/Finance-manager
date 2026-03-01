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

  // Auth / Users
  auth: {
    register: (name: string, email: string, password: string): Promise<{ ok: boolean; user?: { id: string; name: string; email: string }; sessionId?: string; error?: string }> =>
      ipcRenderer.invoke('auth:register', name, email, password),
    login: (email: string, password: string): Promise<{ ok: boolean; user?: { id: string; name: string; email: string }; sessionId?: string; error?: string }> =>
      ipcRenderer.invoke('auth:login', email, password),
    userExists: (email: string): Promise<boolean> =>
      ipcRenderer.invoke('auth:userExists', email),
    changePassword: (userId: string, oldPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> =>
      ipcRenderer.invoke('auth:changePassword', userId, oldPassword, newPassword),
  },

  dialog: {
    openImage: (): Promise<string | null> => ipcRenderer.invoke('dialog:openImage'),
    openFile: (filters?: { name: string; extensions: string[] }[]): Promise<string | null> =>
      ipcRenderer.invoke('dialog:openFile', filters),
    readFile: (filePath: string): Promise<string> => ipcRenderer.invoke('fs:readFile', filePath),
  },

  // MongoDB-backed collections (all scoped by userId)
  db: {
    transactions: {
      getAll: (userId: string): Promise<unknown[]> => ipcRenderer.invoke('db:transactions:getAll', userId),
      add: (userId: string, doc: unknown): Promise<void> => ipcRenderer.invoke('db:transactions:add', userId, doc),
      update: (userId: string, id: string, updates: unknown): Promise<void> => ipcRenderer.invoke('db:transactions:update', userId, id, updates),
      delete: (userId: string, id: string): Promise<void> => ipcRenderer.invoke('db:transactions:delete', userId, id),
    },
    goals: {
      getAll: (userId: string): Promise<unknown[]> => ipcRenderer.invoke('db:goals:getAll', userId),
      add: (userId: string, doc: unknown): Promise<void> => ipcRenderer.invoke('db:goals:add', userId, doc),
      update: (userId: string, id: string, updates: unknown): Promise<void> => ipcRenderer.invoke('db:goals:update', userId, id, updates),
      delete: (userId: string, id: string): Promise<void> => ipcRenderer.invoke('db:goals:delete', userId, id),
    },
    bills: {
      getAll: (userId: string): Promise<unknown[]> => ipcRenderer.invoke('db:bills:getAll', userId),
      togglePaid: (userId: string, id: string): Promise<void> => ipcRenderer.invoke('db:bills:togglePaid', userId, id),
      add: (userId: string, doc: unknown): Promise<void> => ipcRenderer.invoke('db:bills:add', userId, doc),
      update: (userId: string, id: string, updates: unknown): Promise<void> => ipcRenderer.invoke('db:bills:update', userId, id, updates),
      delete: (userId: string, id: string): Promise<void> => ipcRenderer.invoke('db:bills:delete', userId, id),
    },
    accounts: {
      getAll: (userId: string): Promise<unknown[]> => ipcRenderer.invoke('db:accounts:getAll', userId),
      add: (userId: string, doc: unknown): Promise<void> => ipcRenderer.invoke('db:accounts:add', userId, doc),
      update: (userId: string, id: string, updates: unknown): Promise<void> => ipcRenderer.invoke('db:accounts:update', userId, id, updates),
      delete: (userId: string, id: string): Promise<void> => ipcRenderer.invoke('db:accounts:delete', userId, id),
    },
    notifications: {
      getAll: (userId: string): Promise<unknown[]> => ipcRenderer.invoke('db:notifications:getAll', userId),
      markRead: (userId: string, id: string): Promise<void> => ipcRenderer.invoke('db:notifications:markRead', userId, id),
      markAllRead: (userId: string): Promise<void> => ipcRenderer.invoke('db:notifications:markAllRead', userId),
      add: (userId: string, doc: unknown): Promise<void> => ipcRenderer.invoke('db:notifications:add', userId, doc),
    },
    clearUserData: (userId: string): Promise<void> => ipcRenderer.invoke('db:user:clearData', userId),
    settings: {
      get: (userId: string): Promise<unknown> => ipcRenderer.invoke('db:settings:get', userId),
      save: (userId: string, settings: object): Promise<void> => ipcRenderer.invoke('db:settings:save', userId, settings),
    },
    sessions: {
      list: (userId: string): Promise<unknown[]> => ipcRenderer.invoke('db:sessions:list', userId),
      revoke: (userId: string, sessionId: string): Promise<void> => ipcRenderer.invoke('db:sessions:revoke', userId, sessionId),
    },
    user: {
      avatar: {
        save: (userId: string, filePath: string): Promise<{ ok: boolean; avatar?: string; error?: string }> =>
          ipcRenderer.invoke('db:user:avatar:save', userId, filePath),
      },
    },
  },

  // Chat
  chat: {
    listUsers: (selfId: string): Promise<unknown[]> =>
      ipcRenderer.invoke('chat:users:list', selfId),
    presencePing: (sessionId: string): Promise<void> =>
      ipcRenderer.invoke('chat:presence:ping', sessionId),
    fetchMessages: (conversationId: string, limit: number, beforeSentAt?: string): Promise<unknown[]> =>
      ipcRenderer.invoke('chat:messages:fetch', conversationId, limit, beforeSentAt),
    sendMessage: (doc: object): Promise<void> =>
      ipcRenderer.invoke('chat:messages:send', doc),
    listConversations: (userId: string): Promise<unknown[]> =>
      ipcRenderer.invoke('chat:conversations:list', userId),
    watchConversation: (conversationId: string): Promise<void> =>
      ipcRenderer.invoke('chat:stream:watch', conversationId),
    unwatchConversation: (conversationId: string): Promise<void> =>
      ipcRenderer.invoke('chat:stream:unwatch', conversationId),
    onMessage(cb: (payload: { conversationId: string; message: unknown }) => void): () => void {
      const l = (_e: Electron.IpcRendererEvent, payload: { conversationId: string; message: unknown }) => cb(payload)
      ipcRenderer.on('chat:message:new', l)
      return () => ipcRenderer.removeListener('chat:message:new', l)
    },
    onPresenceUpdate(cb: (payload: { userId: string; lastActiveAt: string }) => void): () => void {
      const l = (_e: Electron.IpcRendererEvent, payload: { userId: string; lastActiveAt: string }) => cb(payload)
      ipcRenderer.on('presence:update', l)
      return () => ipcRenderer.removeListener('presence:update', l)
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
