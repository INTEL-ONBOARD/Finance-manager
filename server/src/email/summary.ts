import { col } from '../db'
import { MonthlySummary } from './templates'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function prevMonthRange(now: Date): { start: Date; end: Date; label: string } {
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth() // 0-based; "previous month" is m-1
  const start = new Date(Date.UTC(y, m - 1, 1))
  const end = new Date(Date.UTC(y, m, 1))
  return { start, end, label: `${MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()}` }
}

export async function buildMonthlySummary(
  userId: string,
  range: { start: Date; end: Date; label: string }
): Promise<MonthlySummary> {
  const startIso = range.start.toISOString().slice(0, 10)
  const endIso = range.end.toISOString().slice(0, 10)
  const txns = (await col('transactions')
    .find({ userId, date: { $gte: startIso, $lt: endIso } })
    .toArray()) as Array<{ type?: string; amount?: number; category?: string }>

  let income = 0
  let spending = 0
  const byCat = new Map<string, number>()
  for (const t of txns) {
    const amt = Number(t.amount) || 0
    if (t.type === 'income') income += amt
    else {
      spending += amt
      const cat = t.category || 'Uncategorized'
      byCat.set(cat, (byCat.get(cat) ?? 0) + amt)
    }
  }
  const topCategories = [...byCat.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  const goalDocs = (await col('goals').find({ userId }).toArray()) as Array<{ name?: string; currentAmount?: number; targetAmount?: number }>
  const goals = goalDocs.map((g) => ({
    name: g.name || 'Goal',
    progressPct: g.targetAmount ? Math.min(100, Math.round(((g.currentAmount ?? 0) / g.targetAmount) * 100)) : 0,
  }))

  const billDocs = (await col('bills').find({ userId, paid: { $ne: true } }).toArray()) as Array<{ name?: string; amount?: number; dueDate?: string }>
  const upcomingBills = billDocs
    .filter((b) => b.dueDate)
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))
    .slice(0, 5)
    .map((b) => ({ name: b.name || 'Bill', amount: Number(b.amount) || 0, dueDate: b.dueDate! }))

  return { monthLabel: range.label, income, spending, net: income - spending, topCategories, goals, upcomingBills }
}
