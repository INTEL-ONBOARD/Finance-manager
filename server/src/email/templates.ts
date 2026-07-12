export interface MonthlySummary {
  monthLabel: string
  income: number
  spending: number
  net: number
  topCategories: Array<{ category: string; amount: number }>
  goals: Array<{ name: string; progressPct: number }>
  upcomingBills: Array<{ name: string; amount: number; dueDate: string }>
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
}
function money(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
function shell(title: string, inner: string): string {
  return `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;background:#f6f7f9;padding:24px;color:#1a1a2e">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">
  <h1 style="font-size:20px;margin:0 0 16px">${esc(title)}</h1>${inner}
  <p style="color:#8a8a9a;font-size:12px;margin-top:24px">Finwise</p></div></body></html>`
}
function button(url: string, label: string): string {
  return `<a href="${esc(url)}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">${esc(label)}</a>`
}

export function verifyEmailHtml(name: string, url: string): string {
  return shell('Verify your email', `<p>Hi ${esc(name)}, confirm your email to activate your Finwise account.</p>
    <p style="margin:20px 0">${button(url, 'Verify email')}</p>
    <p style="font-size:12px;color:#8a8a9a">This link expires in 24 hours. If you did not sign up, ignore this email.</p>
    <p style="font-size:12px;color:#8a8a9a">Or paste this link: ${esc(url)}</p>`)
}

export function resetEmailHtml(name: string, url: string): string {
  return shell('Reset your password', `<p>Hi ${esc(name)}, we received a request to reset your Finwise password.</p>
    <p style="margin:20px 0">${button(url, 'Reset password')}</p>
    <p style="font-size:12px;color:#8a8a9a">This link expires in 1 hour. If you did not request this, ignore this email.</p>
    <p style="font-size:12px;color:#8a8a9a">Or paste this link: ${esc(url)}</p>`)
}

export function monthlySummaryHtml(name: string, s: MonthlySummary, unsubscribeUrl: string): string {
  const cats = s.topCategories.length
    ? `<ul>${s.topCategories.map((c) => `<li>${esc(c.category)}: ${money(c.amount)}</li>`).join('')}</ul>`
    : '<p style="color:#8a8a9a">No spending recorded.</p>'
  const goals = s.goals.length
    ? `<ul>${s.goals.map((g) => `<li>${esc(g.name)}: ${g.progressPct}%</li>`).join('')}</ul>`
    : ''
  const bills = s.upcomingBills.length
    ? `<ul>${s.upcomingBills.map((b) => `<li>${esc(b.name)}: ${money(b.amount)} due ${esc(b.dueDate)}</li>`).join('')}</ul>`
    : ''
  return shell(`Your ${s.monthLabel} summary`, `<p>Hi ${esc(name)}, here is how last month went.</p>
    <p><strong>Income:</strong> ${money(s.income)} &nbsp; <strong>Spending:</strong> ${money(s.spending)} &nbsp; <strong>Net:</strong> ${money(s.net)}</p>
    <h3 style="font-size:15px">Top spending</h3>${cats}
    ${goals ? `<h3 style="font-size:15px">Goals</h3>${goals}` : ''}
    ${bills ? `<h3 style="font-size:15px">Upcoming bills</h3>${bills}` : ''}
    <p style="font-size:12px;color:#8a8a9a;margin-top:20px"><a href="${esc(unsubscribeUrl)}" style="color:#8a8a9a">Unsubscribe from monthly emails</a></p>`)
}
