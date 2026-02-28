import { app, BrowserWindow, shell, session, ipcMain } from 'electron'
import { join } from 'path'
import { MongoClient, Db, Collection } from 'mongodb'
import { autoUpdater } from 'electron-updater'
import { scrypt, randomBytes, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

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
  store = new Store({ name: 'finmate-data' })
}

// ── MongoDB Atlas ─────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI ?? ''
const DB_NAME = 'finwise'

let mongoClient: MongoClient | null = null
let db: Db | null = null

function col(name: string): Collection {
  if (!db) throw new Error('MongoDB not initialized')
  return db.collection(name)
}

async function initMongo(): Promise<void> {
  mongoClient = new MongoClient(MONGO_URI)
  await mongoClient.connect()
  db = mongoClient.db(DB_NAME)
}

// ── IPC handlers ──────────────────────────────────────────────────────────────
function registerIpcHandlers(): void {
  // ── electron-store (theme persistence) ──────────────────────────────────────
  ipcMain.handle('store:get', (_e, key: string) => store?.get(key) ?? null)
  ipcMain.handle('store:set', (_e, key: string, value: unknown) => store?.set(key, value))
  ipcMain.handle('store:delete', (_e, key: string) => store?.delete(key))

  // ── App utilities ────────────────────────────────────────────────────────────
  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('shell:openExternal', (_e, url: string) => {
    if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url)
  })

  // ── Transactions ─────────────────────────────────────────────────────────────
  ipcMain.handle('db:transactions:getAll', async () =>
    col('transactions').find({}, { projection: { _id: 0 } }).toArray()
  )
  ipcMain.handle('db:transactions:add', async (_e, doc: object) => {
    await col('transactions').insertOne({ ...doc })
    return null
  })
  ipcMain.handle('db:transactions:delete', async (_e, id: string) => {
    await col('transactions').deleteOne({ id })
    return null
  })

  // ── Goals ────────────────────────────────────────────────────────────────────
  ipcMain.handle('db:goals:getAll', async () =>
    col('goals').find({}, { projection: { _id: 0 } }).toArray()
  )
  ipcMain.handle('db:goals:add', async (_e, doc: object) => {
    await col('goals').insertOne({ ...doc })
    return null
  })
  ipcMain.handle('db:goals:update', async (_e, id: string, updates: object) => {
    await col('goals').updateOne({ id }, { $set: updates })
    return null
  })
  ipcMain.handle('db:goals:delete', async (_e, id: string) => {
    await col('goals').deleteOne({ id })
    return null
  })

  // ── Bills ────────────────────────────────────────────────────────────────────
  ipcMain.handle('db:bills:getAll', async () =>
    col('bills').find({}, { projection: { _id: 0 } }).toArray()
  )
  ipcMain.handle('db:bills:togglePaid', async (_e, id: string) => {
    const bill = await col('bills').findOne({ id }, { projection: { _id: 0, paid: 1 } })
    if (bill) await col('bills').updateOne({ id }, { $set: { paid: !bill.paid } })
    return null
  })

  // ── Accounts ─────────────────────────────────────────────────────────────────
  ipcMain.handle('db:accounts:getAll', async () =>
    col('accounts').find({}, { projection: { _id: 0 } }).toArray()
  )

  // ── Notifications ─────────────────────────────────────────────────────────────
  ipcMain.handle('db:notifications:getAll', async () =>
    col('notifications').find({}, { projection: { _id: 0 } }).toArray()
  )
  ipcMain.handle('db:notifications:markRead', async (_e, id: string) => {
    await col('notifications').updateOne({ id }, { $set: { read: true } })
    return null
  })
  ipcMain.handle('db:notifications:markAllRead', async () => {
    await col('notifications').updateMany({ read: false }, { $set: { read: true } })
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
    return { ok: true, user: { id, name, email } }
  })

  ipcMain.handle('auth:login', async (_e, email: string, password: string) => {
    const users = col('users')
    const doc = await users.findOne({ email })
    if (!doc) return { ok: false, error: 'Invalid email or password' }
    const hashBuf = await scryptAsync(password, doc.salt as string, 64) as Buffer
    const storedBuf = Buffer.from(doc.hash as string, 'hex')
    const match = hashBuf.length === storedBuf.length && timingSafeEqual(hashBuf, storedBuf)
    if (!match) return { ok: false, error: 'Invalid email or password' }
    return { ok: true, user: { id: doc.id, name: doc.name, email: doc.email } }
  })

  ipcMain.handle('auth:userExists', async (_e, email: string) => {
    const doc = await col('users').findOne({ email }, { projection: { _id: 0, id: 1 } })
    return !!doc
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

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
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
