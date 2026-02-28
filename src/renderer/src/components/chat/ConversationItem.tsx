import Avatar from './Avatar';

interface ConversationItemProps {
  id: string;
  name: string;
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
  id, name, lastMessage, lastMessageAt, unread, isActive, onClick,
}: ConversationItemProps) {
  const isGroup = id === 'group';

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
      style={{
        background: isActive ? 'var(--accent-brand-dim, rgba(99,102,241,0.12))' : 'transparent',
        borderLeft: isActive ? '2px solid var(--accent-brand, #6366f1)' : '2px solid transparent',
      }}
    >
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
        <Avatar name={name} size={32} />
      )}

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
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }} className="truncate">
            {lastMessage || (isGroup ? 'Group chat' : 'No messages yet')}
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
