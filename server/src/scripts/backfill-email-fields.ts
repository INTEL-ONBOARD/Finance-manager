import { randomBytes } from 'crypto'
import { connectDb, col, closeDb } from '../db'

async function main(): Promise<void> {
  await connectDb()
  const cursor = col('users').find({ $or: [{ emailVerified: { $exists: false } }, { unsubToken: { $exists: false } }] })
  let n = 0
  for await (const u of cursor) {
    await col('users').updateOne(
      { _id: u._id },
      {
        $set: {
          emailVerified: u.emailVerified ?? true, // grandfather existing accounts
          monthlyOptIn: u.monthlyOptIn ?? true,
          unsubToken: u.unsubToken ?? randomBytes(16).toString('hex'),
        },
      }
    )
    n++
  }
  console.log(`backfilled ${n} users`)
  await closeDb()
}
main().catch((e) => { console.error(e); process.exit(1) })
