import Avatar from './Avatar';
import { useChat } from '@/context/ChatContext';

export default function ThreadHeader() {
  const { activeConversationId, allUsers } = useChat();

  if (!activeConversationId) return null;

  const isGroup = activeConversationId === 'group';

  let name = 'Group Chat';
  let subtitle = 'Everyone in Finwise';
  if (!isGroup) {
    // Extract peer user id from dm_<id1>_<id2> — IDs may contain underscores so match directly
    const peer = allUsers.find(u => activeConversationId.includes(u.id));
    name = peer?.name ?? 'Direct Message';
    subtitle = 'Direct Message';
  }

  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5"
      style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}
    >
      {isGroup ? (
        <div
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(99,102,241,0.15)', border: '1.5px solid rgba(99,102,241,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0,
          }}
        >
          #
        </div>
      ) : (
        <Avatar name={name} size={36} />
      )}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{subtitle}</div>
      </div>
    </div>
  );
}
