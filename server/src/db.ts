import { MongoClient, Db, Collection } from 'mongodb'
import { config } from './config'
import { logger } from './logger'

let client: MongoClient | null = null
let db: Db | null = null

export async function connectDb(): Promise<Db> {
  if (db) return db
  client = new MongoClient(config.mongoUri)
  await client.connect()
  db = client.db(config.dbName)

  // The desktop app only indexed `messages`. Add per-user indexes so the hot
  // read paths stay fast as data grows. Non-unique to avoid failing on any
  // pre-existing data; uniqueness for users/email is enforced in app logic.
  await Promise.all([
    db.collection('transactions').createIndex({ userId: 1 }),
    db.collection('goals').createIndex({ userId: 1 }),
    db.collection('bills').createIndex({ userId: 1 }),
    db.collection('accounts').createIndex({ userId: 1 }),
    db.collection('notifications').createIndex({ userId: 1 }),
    db.collection('settings').createIndex({ userId: 1 }),
    db.collection('sessions').createIndex({ userId: 1 }),
    db.collection('sessions').createIndex({ sessionId: 1 }),
    db.collection('users').createIndex({ email: 1 }),
    db.collection('users').createIndex({ id: 1 }),
    db.collection('messages').createIndex({ conversationId: 1, sentAt: -1 }),
  ]).catch((err) => logger.warn({ err }, 'index creation skipped'))

  logger.info('MongoDB connected')
  return db
}

export function col(name: string): Collection {
  if (!db) throw new Error('Database not connected')
  return db.collection(name)
}

export async function closeDb(): Promise<void> {
  if (client) await client.close()
  client = null
  db = null
}
