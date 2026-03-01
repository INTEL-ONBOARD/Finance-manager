import Avatar from './Avatar';

function isOnline(lastActiveAt?: string | null): boolean {
  if (!lastActiveAt) return false;
  return Date.now() - new Date(lastActiveAt).getTime() < 10 * 60 * 1000; // 10 min window
}

function lastSeenLabel(lastActiveAt?: string | null): string | null {
  if (!lastActiveAt) return null;
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 10) return null; // online — don't show "last seen"
  if (mins < 60) return `Active ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Active ${hrs}h ago`;
  return `Active ${Math.floor(hrs / 24)}d ago`;
}

interface ConversationItemProps {
  id: string;
  name: string;
  avatar?: string | null;
  lastActiveAt?: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  isActive: boolean;
  onClick: () => void;
}

function relativeTime(iso: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function ConversationItem({
  id, name, avatar, lastActiveAt, lastMessage, lastMessageAt, unread, isActive, onClick,
}: ConversationItemProps) {
  const isGroup = id === 'group';
  const online = !isGroup && isOnline(lastActiveAt);
  const seenLabel = !isGroup && !online ? lastSeenLabel(lastActiveAt) : null;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
      style={{
        background: isActive ? 'var(--accent-brand-dim, rgba(99,102,241,0.12))' : 'transparent',
        borderLeft: isActive ? '2px solid var(--accent-brand, #6366f1)' : '2px solid transparent',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {isGroup ? (
          <div
            style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(99,102,241,0.15)', border: '1.5px solid rgba(99,102,241,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14,
            }}
          >
            #
          </div>
        ) : (
          <Avatar name={name} avatar={avatar} size={32} />
        )}
        {online && (
          <span style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 9, height: 9, borderRadius: '50%',
            background: '#22c55e',
            border: '2px solid var(--bg-sidebar, var(--bg-main))',
          }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">
            {name}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 4 }}>
            {relativeTime(lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 12, color: online ? '#22c55e' : 'var(--text-muted)' }} className="truncate">
            {online ? 'Online' : (lastMessage || seenLabel || (isGroup ? 'Group chat' : 'No messages yet'))}
          </span>
          {unread > 0 && (
            <span
              style={{
                marginLeft: 4, minWidth: 18, height: 18, borderRadius: 9,
                background: 'var(--accent-brand, #6366f1)',
                color: '#fff', fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 5px', flexShrink: 0,
              }}
            >
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
