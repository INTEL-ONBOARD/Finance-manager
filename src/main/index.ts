import { app, BrowserWindow, shell, session, ipcMain } from 'electron'
import { join } from 'path'
import { MongoClient, Db, Collection } from 'mongodb'

const isDev = !app.isPackaged

// ── electron-store (theme only) ───────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let store: any = null

async function initStore() {
  const { default: Store } = await import('electron-store')
  store = new Store({ name: 'finmate-data' })
}

// ── MongoDB Atlas ─────────────────────────────────────────────────────────────
const MONGO_URI =
  'mongodb+srv://Vercel-Admin-atlas-aqua-anchor:T8K5CIeJfKOndJBL@atlas-aqua-anchor.gzur2aj.mongodb.net/?retryWrites=true&w=majority'
const DB_NAME = 'finwise'

let mongoClient: MongoClient | null = null
let db: Db | null = null

function col(name: string): Collection {
  if (!db) throw new Error('MongoDB not initialized')
  return db.collection(name)
}

// ── Seed data (mirrors FinanceContext.tsx SEED_* arrays) ─────────────────────
const SEED_TRANSACTIONS = [
  { id: 't1',  name: 'Monthly Salary',      category: 'Salary',     date: '2026-02-25', amount:  5200,   account: 'Checking',    note: 'February paycheck' },
  { id: 't2',  name: 'Whole Foods Market',  category: 'Groceries',  date: '2026-02-24', amount: -84.32,  account: 'Visa ••4521' },
  { id: 't3',  name: 'Netflix',             category: 'Netflix',    date: '2026-02-23', amount: -15.99,  account: 'Visa ••4521' },
  { id: 't4',  name: 'Freelance Project',   category: 'Freelance',  date: '2026-02-22', amount:  850,    account: 'Checking',    note: 'UI design for client' },
  { id: 't5',  name: 'Rent — Feb',          category: 'Rent',       date: '2026-02-20', amount: -1450,   account: 'Checking' },
  { id: 't6',  name: 'Uber',                category: 'Transport',  date: '2026-02-19', amount: -18.50,  account: 'Visa ••4521' },
  { id: 't7',  name: 'Chipotle',            category: 'Dining',     date: '2026-02-18', amount: -13.75,  account: 'Visa ••4521' },
  { id: 't8',  name: 'Gym Membership',      category: 'Gym',        date: '2026-02-15', amount: -49.99,  account: 'Checking' },
  { id: 't9',  name: 'Electric Bill',       category: 'Utilities',  date: '2026-02-14', amount: -112.40, account: 'Checking' },
  { id: 't10', name: 'Spotify',             category: 'Spotify',    date: '2026-02-13', amount: -9.99,   account: 'Visa ••4521' },
  { id: 't11', name: 'Amazon Order',        category: 'Shopping',   date: '2026-02-11', amount: -67.40,  account: 'Visa ••4521' },
  { id: 't12', name: 'Doctor Visit',        category: 'Health',     date: '2026-02-08', amount: -45.00,  account: 'Checking' },
  { id: 't13', name: 'Investment Dividend', category: 'Investment', date: '2026-02-05', amount:  142.50, account: 'Investment' },
  { id: 't14', name: "Trader Joe's",        category: 'Groceries',  date: '2026-02-04', amount: -52.10,  account: 'Visa ••4521' },
  { id: 't15', name: 'Gas Station',         category: 'Transport',  date: '2026-02-02', amount: -48.20,  account: 'Visa ••4521' },
]

const SEED_GOALS = [
  { id: 'g1', name: 'Emergency Fund',     icon: 'Umbrella', target: 15000, current: 9840,  color: '#60a5fa', deadline: 'Jun 2026' },
  { id: 'g2', name: 'Japan Trip',         icon: 'Plane',    target: 4500,  current: 2200,  color: '#f59e0b', deadline: 'Aug 2026' },
  { id: 'g3', name: 'New Laptop',         icon: 'Laptop',   target: 2000,  current: 1650,  color: '#4ade80', deadline: 'Mar 2026' },
  { id: 'g4', name: 'House Down Payment', icon: 'Home',     target: 40000, current: 11200, color: '#a78bfa', deadline: 'Dec 2027' },
]

const SEED_BILLS = [
  { id: 'b1', name: 'Rent',          amount: 1450,  dueDay: 1,  category: 'Housing',      color: '#f87171', paid: true },
  { id: 'b2', name: 'Electric',      amount: 112,   dueDay: 14, category: 'Utilities',    color: '#60a5fa', paid: true },
  { id: 'b3', name: 'Internet',      amount: 59.99, dueDay: 18, category: 'Utilities',    color: '#60a5fa', paid: false },
  { id: 'b4', name: 'Netflix',       amount: 15.99, dueDay: 23, category: 'Subscription', color: '#f87171', paid: true },
  { id: 'b5', name: 'Spotify',       amount: 9.99,  dueDay: 13, category: 'Subscription', color: '#4ade80', paid: true },
  { id: 'b6', name: 'Gym',           amount: 49.99, dueDay: 15, category: 'Health',       color: '#34d399', paid: true },
  { id: 'b7', name: 'Phone Plan',    amount: 45,    dueDay: 28, category: 'Utilities',    color: '#a78bfa', paid: false },
  { id: 'b8', name: 'Car Insurance', amount: 142,   dueDay: 5,  category: 'Insurance',    color: '#fbbf24', paid: false },
]

const SEED_ACCOUNTS = [
  { id: 'a1', name: 'Checking Account', type: 'checking',   balance: 4820.50,  color: '#4ade80' },
  { id: 'a2', name: 'Savings Account',  type: 'savings',    balance: 9840.00,  color: '#60a5fa' },
  { id: 'a3', name: 'Visa ••4521',      type: 'credit',     balance: -1260.00, limit: 7000, color: '#f87171' },
  { id: 'a4', name: 'Investment',       type: 'investment', balance: 8240.00,  color: '#a78bfa' },
]

const SEED_NOTIFICATIONS = [
  { id: 'n1', title: 'Bill Due Tomorrow',    body: 'Internet bill of $59.99 is due on Feb 27.',         time: '2h ago', read: false, type: 'alert' },
  { id: 'n2', title: 'Goal Almost Reached!', body: 'New Laptop goal is at 83% — only $350 to go!',      time: '1d ago', read: false, type: 'success' },
  { id: 'n3', title: 'Large Transaction',    body: 'Rent payment of $1,450 was processed.',              time: '6d ago', read: true,  type: 'info' },
  { id: 'n4', title: 'Monthly Summary Ready',body: 'Your February 2026 summary is available.',           time: '1w ago', read: true,  type: 'info' },
]

async function seedIfEmpty(): Promise<void> {
  const seedMap: Record<string, object[]> = {
    transactions: SEED_TRANSACTIONS,
    goals: SEED_GOALS,
    bills: SEED_BILLS,
    accounts: SEED_ACCOUNTS,
    notifications: SEED_NOTIFICATIONS,
  }
  for (const [name, seed] of Object.entries(seedMap)) {
    const count = await col(name).countDocuments()
    if (count === 0) await col(name).insertMany(seed)
  }
}

async function initMongo(): Promise<void> {
  mongoClient = new MongoClient(MONGO_URI)
  await mongoClient.connect()
  db = mongoClient.db(DB_NAME)
  await seedIfEmpty()
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
              "connect-src 'self' https://*.mongodb.net wss://*.mongodb.net",
            ].join('; '),
          ],
        },
      })
    })
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
