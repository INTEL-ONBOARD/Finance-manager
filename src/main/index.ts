import { app, BrowserWindow, shell, session, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { MongoClient, Db, Collection, ChangeStream } from 'mongodb'
import { autoUpdater } from 'electron-updater'
import { scrypt, randomBytes, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import { readFileSync, statSync } from 'fs'

const scryptAsync = promisify(scrypt)

const isDev = !app.isPackaged

// ── Auto-updater configuration ────────────────────────────────────────────────
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = false
autoUpdater.logger = isDev ? console : null

// ── electron-store (theme only) ───────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let store: any = null

async function initStore() {
  const { default: Store } = await import('electron-store')
  store = new Store({ name: 'finmate-theme' })
}

// ── MongoDB Atlas ─────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI ?? ''
const DB_NAME = 'finwise'

let mongoClient: MongoClient | null = null
let db: Db | null = null
const activeStreams = new Map<string, ChangeStream>()
let presenceStream: ChangeStream | null = null

function col(name: string): Collection {
  if (!db) throw new Error('MongoDB not initialized')
  return db.collection(name)
}

async function initMongo(): Promise<void> {
  mongoClient = new MongoClient(MONGO_URI)
  await mongoClient.connect()
  db = mongoClient.db(DB_NAME)
  await db.collection('messages').createIndex({ conversationId: 1, sentAt: -1 })
}


// ── IPC handlers ──────────────────────────────────────────────────────────────
function registerIpcHandlers(): void {
  // ── electron-store (theme persistence) ──────────────────────────────────────
  ipcMain.handle('store:get', (_e, key: string) => store?.get(key) ?? null)
  ipcMain.handle('store:set', (_e, key: string, value: unknown) => {
    store?.set(key, value)
    if (process.platform === 'win32' && key === 'finmate-theme') {
      const win = BrowserWindow.getAllWindows()[0]
      if (win) {
        const light = value === 'light'
        win.setTitleBarOverlay({
          color: light ? '#f0f4f8' : '#0d1117',
          symbolColor: light ? '#0f172a' : '#ffffff',
          height: 32,
        })
      }
    }
  })
  ipcMain.handle('store:delete', (_e, key: string) => store?.delete(key))

  // ── App utilities ────────────────────────────────────────────────────────────
  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('shell:openExternal', (_e, url: string) => {
    if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url)
  })

  // ── Transactions ─────────────────────────────────────────────────────────────
  ipcMain.handle('db:transactions:getAll', async (_e, userId: string) =>
    col('transactions').find({ userId }, { projection: { _id: 0, userId: 0 } }).toArray()
  )
  ipcMain.handle('db:transactions:add', async (_e, userId: string, doc: object) => {
    await col('transactions').insertOne({ ...doc, userId })
    return null
  })
  ipcMain.handle('db:transactions:delete', async (_e, userId: string, id: string) => {
    await col('transactions').deleteOne({ id, userId })
    return null
  })
  ipcMain.handle('db:transactions:update', async (_e, userId: string, id: string, updates: object) => {
    await col('transactions').updateOne({ id, userId }, { $set: updates })
    return null
  })

  // ── Goals ────────────────────────────────────────────────────────────────────
  ipcMain.handle('db:goals:getAll', async (_e, userId: string) =>
    col('goals').find({ userId }, { projection: { _id: 0, userId: 0 } }).toArray()
  )
  ipcMain.handle('db:goals:add', async (_e, userId: string, doc: object) => {
    await col('goals').insertOne({ ...doc, userId })
    return null
  })
  ipcMain.handle('db:goals:update', async (_e, userId: string, id: string, updates: object) => {
    await col('goals').updateOne({ id, userId }, { $set: updates })
    return null
  })
  ipcMain.handle('db:goals:delete', async (_e, userId: string, id: string) => {
    await col('goals').deleteOne({ id, userId })
    return null
  })

  // ── Bills ────────────────────────────────────────────────────────────────────
  ipcMain.handle('db:bills:getAll', async (_e, userId: string) =>
    col('bills').find({ userId }, { projection: { _id: 0, userId: 0 } }).toArray()
  )
  ipcMain.handle('db:bills:togglePaid', async (_e, userId: string, id: string) => {
    const bill = await col('bills').findOne({ id, userId }, { projection: { _id: 0, paid: 1 } })
    if (bill) await col('bills').updateOne({ id, userId }, { $set: { paid: !bill.paid } })
    return null
  })
  ipcMain.handle('db:bills:add', async (_e, userId: string, doc: object) => {
    await col('bills').insertOne({ ...doc, userId })
    return null
  })
  ipcMain.handle('db:bills:update', async (_e, userId: string, id: string, updates: object) => {
    await col('bills').updateOne({ id, userId }, { $set: updates })
    return null
  })
  ipcMain.handle('db:bills:delete', async (_e, userId: string, id: string) => {
    await col('bills').deleteOne({ id, userId })
    return null
  })

  // ── Accounts ─────────────────────────────────────────────────────────────────
  ipcMain.handle('db:accounts:getAll', async (_e, userId: string) =>
    col('accounts').find({ userId }, { projection: { _id: 0, userId: 0 } }).toArray()
  )
  ipcMain.handle('db:accounts:add', async (_e, userId: string, doc: object) => {
    await col('accounts').insertOne({ ...doc, userId })
    return null
  })
  ipcMain.handle('db:accounts:update', async (_e, userId: string, id: string, updates: object) => {
    await col('accounts').updateOne({ id, userId }, { $set: updates })
    return null
  })
  ipcMain.handle('db:accounts:delete', async (_e, userId: string, id: string) => {
    await col('accounts').deleteOne({ id, userId })
    return null
  })

  // ── Notifications ─────────────────────────────────────────────────────────────
  ipcMain.handle('db:notifications:getAll', async (_e, userId: string) =>
    col('notifications').find({ userId }, { projection: { _id: 0, userId: 0 } }).toArray()
  )
  ipcMain.handle('db:notifications:markRead', async (_e, userId: string, id: string) => {
    await col('notifications').updateOne({ id, userId }, { $set: { read: true } })
    return null
  })
  ipcMain.handle('db:notifications:markAllRead', async (_e, userId: string) => {
    await col('notifications').updateMany({ userId, read: false }, { $set: { read: true } })
    return null
  })
  ipcMain.handle('db:notifications:add', async (_e, userId: string, doc: object) => {
    await col('notifications').insertOne({ ...doc, userId })
    return null
  })

  // ── Auth / Users ──────────────────────────────────────────────────────────────
  ipcMain.handle('auth:register', async (_e, name: string, email: string, password: string) => {
    const users = col('users')
    const existing = await users.findOne({ email })
    if (existing) return { ok: false, error: 'Email already registered' }
    const salt = randomBytes(16).toString('hex')
    const hash = (await scryptAsync(password, salt, 64) as Buffer).toString('hex')
    const id = `u_${Date.now()}`
    await users.insertOne({ id, name, email, salt, hash })
    const sessionId = `s_${Date.now()}`
    const deviceLabel = process.platform === 'darwin' ? 'macOS' : process.platform === 'win32' ? 'Windows' : 'Linux'
    const now = new Date().toISOString()
    await col('sessions').insertOne({ sessionId, userId: id, deviceLabel, createdAt: now, lastActiveAt: now })
    return { ok: true, user: { id, name, email }, sessionId }
  })

  ipcMain.handle('auth:login', async (_e, email: string, password: string) => {
    const users = col('users')
    const doc = await users.findOne({ email })
    if (!doc) return { ok: false, error: 'Invalid email or password' }
    const hashBuf = await scryptAsync(password, doc.salt as string, 64) as Buffer
    const storedBuf = Buffer.from(doc.hash as string, 'hex')
    const match = hashBuf.length === storedBuf.length && timingSafeEqual(hashBuf, storedBuf)
    if (!match) return { ok: false, error: 'Invalid email or password' }
    const sessionId = `s_${Date.now()}`
    const deviceLabel = process.platform === 'darwin' ? 'macOS' : process.platform === 'win32' ? 'Windows' : 'Linux'
    const now = new Date().toISOString()
    await col('sessions').insertOne({ sessionId, userId: doc.id, deviceLabel, createdAt: now, lastActiveAt: now })
    return { ok: true, user: { id: doc.id, name: doc.name, email: doc.email, avatar: (doc.avatar as string | undefined) ?? null }, sessionId }
  })

  ipcMain.handle('auth:userExists', async (_e, email: string) => {
    const doc = await col('users').findOne({ email }, { projection: { _id: 0, id: 1 } })
    return !!doc
  })

  // ── Settings ──────────────────────────────────────────────────────────────────
  ipcMain.handle('db:settings:get', async (_e, userId: string) =>
    col('settings').findOne({ userId }, { projection: { _id: 0, userId: 0 } }) ?? null
  )
  ipcMain.handle('db:settings:save', async (_e, userId: string, settings: Record<string, unknown>) => {
    await col('settings').updateOne({ userId }, { $set: { userId, ...settings } }, { upsert: true })
    const { name, email } = settings as { name?: string; email?: string }
    const userUpdate: Record<string, string> = {}
    if (name) userUpdate.name = name
    if (email) userUpdate.email = email
    if (Object.keys(userUpdate).length) await col('users').updateOne({ id: userId }, { $set: userUpdate })
    return null
  })

  // ── Sessions ──────────────────────────────────────────────────────────────────
  ipcMain.handle('db:sessions:list', async (_e, userId: string) =>
    col('sessions').find({ userId }, { projection: { _id: 0 } }).sort({ lastActiveAt: -1 }).toArray()
  )
  ipcMain.handle('db:sessions:revoke', async (_e, userId: string, sessionId: string) => {
    await col('sessions').deleteOne({ userId, sessionId })
    return null
  })

  // ── Avatar ────────────────────────────────────────────────────────────────────
  ipcMain.handle('dialog:openImage', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getAllWindows()[0]
    const result = await dialog.showOpenDialog(win, {
      title: 'Choose Profile Photo',
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
      properties: ['openFile']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('db:user:avatar:save', async (_e, userId: string, filePath: string) => {
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp']
    const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
    if (!allowedExts.includes(ext)) {
      return { ok: false, error: 'Unsupported image format' }
    }
    try {
      const stat = statSync(filePath)
      if (stat.size > 2 * 1024 * 1024) {
        return { ok: false, error: 'Image must be under 2MB' }
      }
      const mimeMap: Record<string, string> = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp' }
      const mime = mimeMap[ext]
      const data = readFileSync(filePath)
      const avatar = `data:image/${mime};base64,${data.toString('base64')}`
      const result = await col('users').updateOne({ id: userId }, { $set: { avatar } }, { upsert: false })
      if (result.matchedCount === 0) {
        return { ok: false, error: 'User not found' }
      }
      return { ok: true, avatar }
    } catch {
      return { ok: false, error: 'Failed to read image file' }
    }
  })

  // ── Change Password ───────────────────────────────────────────────────────────
  ipcMain.handle('auth:changePassword', async (_e, userId: string, oldPassword: string, newPassword: string) => {
    const userDoc = await col('users').findOne({ id: userId })
    if (!userDoc) return { ok: false, error: 'User not found' }
    const oldHash = await scryptAsync(oldPassword, userDoc.salt as string, 64) as Buffer
    const storedBuf = Buffer.from(userDoc.hash as string, 'hex')
    if (oldHash.length !== storedBuf.length || !timingSafeEqual(oldHash, storedBuf)) {
      return { ok: false, error: 'Incorrect current password' }
    }
    const salt = randomBytes(16).toString('hex')
    const hash = (await scryptAsync(newPassword, salt, 64) as Buffer).toString('hex')
    await col('users').updateOne({ id: userId }, { $set: { salt, hash } })
    return { ok: true }
  })

  // ── Data management ───────────────────────────────────────────────────────────
  ipcMain.handle('db:user:clearData', async (_e, userId: string) => {
    const collections = ['transactions', 'goals', 'bills', 'accounts', 'notifications', 'settings', 'sessions']
    await Promise.all(collections.map(name => col(name).deleteMany({ userId })))
    return null
  })

  // ── Chat ──────────────────────────────────────────────────────────────────────
  ipcMain.handle('chat:users:list', async (_e, selfId: string) => {
    const users = await col('users').find({ id: { $ne: selfId } }, { projection: { _id: 0, id: 1, name: 1, email: 1, avatar: 1 } }).toArray()
    // Attach most-recent lastActiveAt from sessions for presence
    const sessions = await col('sessions').aggregate([
      { $match: { userId: { $in: users.map((u: Record<string, unknown>) => u.id) } } },
      { $sort: { lastActiveAt: -1 } },
      { $group: { _id: '$userId', lastActiveAt: { $first: '$lastActiveAt' } } }
    ]).toArray()
    const presenceMap = new Map(sessions.map((s: Record<string, unknown>) => [s._id, s.lastActiveAt]))
    return users.map((u: Record<string, unknown>) => ({ ...u, lastActiveAt: presenceMap.get(u.id) ?? null }))
  })

  ipcMain.handle('chat:presence:ping', async (_e, sessionId: string) => {
    await col('sessions').updateOne({ sessionId }, { $set: { lastActiveAt: new Date().toISOString() } })
    return null
  })

  ipcMain.handle('chat:messages:fetch', async (_e, conversationId: string, limit: number, beforeSentAt?: string) => {
    const filter: Record<string, unknown> = { conversationId }
    if (beforeSentAt) filter.sentAt = { $lt: beforeSentAt }
    const msgs = await col('messages')
      .find(filter, { projection: { _id: 0 } })
      .sort({ sentAt: -1 })
      .limit(limit)
      .toArray()
    return msgs.reverse()
  })

  ipcMain.handle('chat:messages:send', async (_e, doc: object) => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    await col('messages').insertOne({ ...doc, id })
    return null
  })

  ipcMain.handle('chat:conversations:list', async (_e, userId: string) => {
    const pipeline = [
      { $match: { $or: [{ conversationId: 'group' }, { conversationId: { $regex: userId } }] } },
      { $sort: { sentAt: -1 } },
      { $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$body' },
        lastMessageAt: { $first: '$sentAt' },
      }},
      { $project: { _id: 0, id: '$_id', lastMessage: 1, lastMessageAt: 1 } },
      { $sort: { lastMessageAt: -1 } },
    ]
    return col('messages').aggregate(pipeline).toArray()
  })

  // ── Auto-updater commands ─────────────────────────────────────────────────────
  ipcMain.handle('updater:check',    () => autoUpdater.checkForUpdates())
  ipcMain.handle('updater:download', () => autoUpdater.downloadUpdate())
  ipcMain.handle('updater:install',  () => autoUpdater.quitAndInstall())
}

// ── Auto-updater event forwarding ─────────────────────────────────────────────
function setupUpdaterEvents(win: BrowserWindow): void {
  autoUpdater.on('checking-for-update', () =>
    win.webContents.send('updater:checking'))

  autoUpdater.on('update-available', (info) =>
    win.webContents.send('updater:available', {
      version: info.version,
      releaseNotes: info.releaseNotes ?? null,
    }))

  autoUpdater.on('update-not-available', () =>
    win.webContents.send('updater:not-available'))

  autoUpdater.on('download-progress', (progress) =>
    win.webContents.send('updater:progress', { percent: Math.round(progress.percent) }))

  autoUpdater.on('update-downloaded', () =>
    win.webContents.send('updater:downloaded'))

  autoUpdater.on('error', (err) =>
    win.webContents.send('updater:error', err.message))
}

// ── Window ────────────────────────────────────────────────────────────────────
function getIconPath(): string {
  const base = app.isPackaged ? process.resourcesPath : join(app.getAppPath(), 'assets')
  if (process.platform === 'darwin') return join(base, 'icon.icns')
  if (process.platform === 'win32') return join(base, 'icon.ico')
  return join(base, 'icon.png')
}

function createWindow(): BrowserWindow {
  const savedTheme = store?.get('finmate-theme') as string | undefined
  const bgColor = savedTheme === 'light' ? '#f0f4f8' : '#0d1117'

  const isLight = bgColor === '#f0f4f8'

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    ...(process.platform === 'win32' ? {
      titleBarOverlay: {
        color: bgColor,
        symbolColor: isLight ? '#0f172a' : '#ffffff',
        height: 32,
      },
      autoHideMenuBar: true,
    } : {}),
    backgroundColor: bgColor,
    show: false,
    ...(process.platform !== 'darwin' ? { icon: getIconPath() } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.once('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

// ── Chat Change Streams ────────────────────────────────────────────────────────
function registerChatStreamHandlers(win: BrowserWindow): void {
  ipcMain.handle('chat:stream:watch', async (_e, conversationId: string) => {
    if (activeStreams.has(conversationId)) return null
    const stream = col('messages').watch(
      [{ $match: { 'fullDocument.conversationId': conversationId } }],
      { fullDocument: 'updateLookup' }
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stream.on('change', (change: any) => {
      if (change.operationType === 'insert' && change.fullDocument) {
        if (!win.isDestroyed()) {
          const { _id: _ignored, ...msg } = change.fullDocument
          win.webContents.send('chat:message:new', { conversationId, message: msg })
        }
      }
    })
    activeStreams.set(conversationId, stream)
    return null
  })

  ipcMain.handle('chat:stream:unwatch', async (_e, conversationId: string) => {
    const stream = activeStreams.get(conversationId)
    if (stream) { await stream.close(); activeStreams.delete(conversationId) }
    return null
  })

  // ── Presence Change Stream — watches sessions for lastActiveAt updates ──────
  try {
    presenceStream = col('sessions').watch([], { fullDocument: 'updateLookup' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    presenceStream.on('change', (change: any) => {
      if (
        (change.operationType === 'update' || change.operationType === 'replace') &&
        change.fullDocument &&
        change.fullDocument.userId &&
        change.fullDocument.lastActiveAt
      ) {
        if (!win.isDestroyed()) {
          win.webContents.send('presence:update', {
            userId: change.fullDocument.userId,
            lastActiveAt: change.fullDocument.lastActiveAt,
          })
        }
      }
    })
  } catch {
    // Presence stream unavailable — degraded gracefully
  }

  win.on('closed', async () => {
    for (const [, stream] of activeStreams) await stream.close()
    activeStreams.clear()
    if (presenceStream) { await presenceStream.close(); presenceStream = null }
  })
}

async function bootstrap(): Promise<void> {
  try {
    await initStore()
    await initMongo()
  } catch (err) {
    console.error('Failed to initialize app:', err)
    // Continue without DB — show window so user sees something
  }
  registerIpcHandlers()
  const win = createWindow()

  setupUpdaterEvents(win)
  registerChatStreamHandlers(win)

  if (!isDev) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            [
              "default-src 'self' file:",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "img-src 'self' data: blob:",
              "connect-src 'self' https://*.mongodb.net wss://*.mongodb.net https://github.com https://objects.githubusercontent.com https://github-releases.githubusercontent.com",
            ].join('; '),
          ],
        },
      })
    })

    setTimeout(() => autoUpdater.checkForUpdates(), 3000)
  }

  void win
}

app.whenReady().then(bootstrap)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) bootstrap()
})
