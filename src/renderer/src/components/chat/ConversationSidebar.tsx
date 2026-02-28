import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import ConversationItem from './ConversationItem';
import NewDMModal from './NewDMModal';

export default function ConversationSidebar() {
  const { conversations, activeConversationId, unreadCounts, allUsers, openConversation, markConversationRead, refreshUsers } = useChat();
  const [dmModalOpen, setDmModalOpen] = useState(false);

  // Group chat always first, then DMs sorted by lastMessageAt DESC
  const group = conversations.find(c => c.id === 'group');
  const dms = conversations
    .filter(c => c.id !== 'group')
    .sort((a, b) => (b.lastMessageAt > a.lastMessageAt ? 1 : -1));
  const sorted = group ? [group, ...dms] : dms;

  const handleOpen = (id: string) => {
    openConversation(id);
    markConversationRead(id);
  };

  function getConversationName(id: string): string {
    if (id === 'group') return 'Group Chat';
    // IDs may contain underscores (e.g. u_123) so match directly instead of splitting
    const peer = allUsers.find(u => id.includes(u.id));
    return peer?.name ?? 'Direct Message';
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: 260,
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-sidebar, var(--bg-main))',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Community</span>
        <button
          onClick={() => { setDmModalOpen(true); refreshUsers(); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title="New Direct Message"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: 'thin' }}>
        {sorted.map(c => {
          const isGroup = c.id === 'group';
          const name = isGroup ? 'Group Chat' : getConversationName(c.id);
          return (
            <ConversationItem
              key={c.id}
              id={c.id}
              name={name}
              lastMessage={c.lastMessage}
              lastMessageAt={c.lastMessageAt}
              unread={unreadCounts[c.id] ?? 0}
              isActive={c.id === activeConversationId}
              onClick={() => handleOpen(c.id)}
            />
          );
        })}
      </div>

      {/* Modal rendered inside a stable parent to avoid AnimatePresence removeChild crash */}
      <NewDMModal open={dmModalOpen} onClose={() => setDmModalOpen(false)} />
    </div>
  );
}
