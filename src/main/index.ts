import { app, BrowserWindow, shell, session, ipcMain } from 'electron'
import { join } from 'path'
import { MongoClient, Db, Collection, ChangeStream } from 'mongodb'
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
const activeStreams = new Map<string, ChangeStream>()

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

// ── Per-user seed data ────────────────────────────────────────────────────────
async function seedForUser(userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const ym = today.slice(0, 7)
  const seed = (n: string, offset: number) => `${ym}-${String(offset).padStart(2, '0')}`

  const seedMap: Record<string, object[]> = {
    transactions: [
      { id: `t1_${userId}`, name: 'Monthly Salary',     category: 'Salary',    date: seed('', 25), amount:  5200,   account: 'Checking',    note: 'Paycheck' },
      { id: `t2_${userId}`, name: 'Whole Foods Market', category: 'Groceries', date: seed('', 24), amount: -84.32,  account: 'Visa ••4521' },
      { id: `t3_${userId}`, name: 'Netflix',            category: 'Netflix',   date: seed('', 23), amount: -15.99,  account: 'Visa ••4521' },
      { id: `t4_${userId}`, name: 'Freelance Project',  category: 'Freelance', date: seed('', 22), amount:  850,    account: 'Checking',    note: 'UI design' },
      { id: `t5_${userId}`, name: 'Rent',               category: 'Rent',      date: seed('', 20), amount: -1450,   account: 'Checking' },
    ],
    goals: [
      { id: `g1_${userId}`, name: 'Emergency Fund',     icon: 'Umbrella', target: 15000, current: 9840,  color: '#60a5fa', deadline: 'Jun 2026' },
      { id: `g2_${userId}`, name: 'Japan Trip',         icon: 'Plane',    target: 4500,  current: 2200,  color: '#f59e0b', deadline: 'Aug 2026' },
      { id: `g3_${userId}`, name: 'New Laptop',         icon: 'Laptop',   target: 2000,  current: 1650,  color: '#4ade80', deadline: 'Mar 2026' },
    ],
    bills: [
      { id: `b1_${userId}`, name: 'Rent',     amount: 1450,  dueDay: 1,  category: 'Housing',      color: '#f87171', paid: true },
      { id: `b2_${userId}`, name: 'Electric', amount: 112,   dueDay: 14, category: 'Utilities',    color: '#60a5fa', paid: true },
      { id: `b3_${userId}`, name: 'Internet', amount: 59.99, dueDay: 18, category: 'Utilities',    color: '#60a5fa', paid: false },
      { id: `b4_${userId}`, name: 'Netflix',  amount: 15.99, dueDay: 23, category: 'Subscription', color: '#f87171', paid: true },
    ],
    accounts: [
      { id: `a1_${userId}`, name: 'Checking Account', type: 'checking',   balance: 4820.50,  color: '#4ade80' },
      { id: `a2_${userId}`, name: 'Savings Account',  type: 'savings',    balance: 9840.00,  color: '#60a5fa' },
      { id: `a3_${userId}`, name: 'Visa ••4521',      type: 'credit',     balance: -1260.00, limit: 7000, color: '#f87171' },
      { id: `a4_${userId}`, name: 'Investment',       type: 'investment', balance: 8240.00,  color: '#a78bfa' },
    ],
    notifications: [
      { id: `n1_${userId}`, title: 'Bill Due Tomorrow',    body: 'Internet bill of $59.99 is due soon.',   time: '2h ago', read: false, type: 'alert' },
      { id: `n2_${userId}`, title: 'Goal Almost Reached!', body: 'New Laptop goal is at 83%!',             time: '1d ago', read: false, type: 'success' },
      { id: `n3_${userId}`, title: 'Monthly Summary Ready',body: 'Your monthly summary is available.',     time: '1w ago', read: true,  type: 'info' },
    ],
  }
  for (const [name, docs] of Object.entries(seedMap)) {
    const c = col(name)
    const count = await c.countDocuments({ userId })
    if (count === 0) await c.insertMany(docs.map(d => ({ ...d, userId })))
  }
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

  // ── Accounts ─────────────────────────────────────────────────────────────────
  ipcMain.handle('db:accounts:getAll', async (_e, userId: string) =>
    col('accounts').find({ userId }, { projection: { _id: 0, userId: 0 } }).toArray()
  )

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

  // ── Auth / Users ──────────────────────────────────────────────────────────────
  ipcMain.handle('auth:register', async (_e, name: string, email: string, password: string) => {
    const users = col('users')
    const existing = await users.findOne({ email })
    if (existing) return { ok: false, error: 'Email already registered' }
    const salt = randomBytes(16).toString('hex')
    const hash = (await scryptAsync(password, salt, 64) as Buffer).toString('hex')
    const id = `u_${Date.now()}`
    await users.insertOne({ id, name, email, salt, hash })
    await seedForUser(id)
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

  // ── Chat ──────────────────────────────────────────────────────────────────────
  ipcMain.handle('chat:users:list', async (_e, selfId: string) =>
    col('users').find({ id: { $ne: selfId } }, { projection: { _id: 0, id: 1, name: 1, email: 1 } }).toArray()
  )

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

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    ...(process.platform === 'win32' ? {
      titleBarOverlay: {
        color: '#0d1117',
        symbolColor: '#ffffff',
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
          const { _id, ...msg } = change.fullDocument
          void _id
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

  win.on('closed', async () => {
    for (const [, stream] of activeStreams) await stream.close()
    activeStreams.clear()
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
