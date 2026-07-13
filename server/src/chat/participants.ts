// DM conversation ids are `dm_${[idA, idB].sort().join('_')}` where each user id
// is `u_<digits>` (see auth/service.ts createSession/register). Anchoring the
// match to that exact shape — rather than an unanchored substring/regex —
// means one user's id can never accidentally match another user's DM thread.
const DM_ID = /^dm_(u_\d+)_(u_\d+)$/

export function isParticipant(conversationId: string, userId: string): boolean {
  if (conversationId === 'group') return true
  const m = DM_ID.exec(conversationId)
  if (!m) return false
  return m[1] === userId || m[2] === userId
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Anchored regex matching only DM ids where `userId` is exactly one of the two
// participant segments — used for the Mongo aggregation in GET /chat/conversations.
export function dmRegexFor(userId: string): RegExp {
  const u = escapeRegex(userId)
  return new RegExp(`^dm_(${u}_u_\\d+|u_\\d+_${u})$`)
}
