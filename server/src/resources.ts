// Collections that share the standard per-user CRUD shape. Each maps 1:1 to the
// desktop `db:<name>:*` IPC handlers. Special operations (bills togglePaid,
// notifications markRead/markAllRead) are added in resource.routes.ts.
export interface ResourceDef {
  name: string
}

export const RESOURCES: ResourceDef[] = [
  { name: 'transactions' },
  { name: 'goals' },
  { name: 'bills' },
  { name: 'accounts' },
  { name: 'notifications' },
]
