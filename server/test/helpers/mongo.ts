import { MongoMemoryServer } from 'mongodb-memory-server'
import { connectDb, closeDb } from '../../src/db'

export interface MongoHandle {
  stop: () => Promise<void>
}

export async function withMongo(): Promise<MongoHandle> {
  const mem = await MongoMemoryServer.create()
  process.env.MONGO_URI = mem.getUri()
  process.env.JWT_SECRET ??= 'test-secret'
  await connectDb()
  return {
    stop: async () => {
      await closeDb()
      await mem.stop()
    },
  }
}
