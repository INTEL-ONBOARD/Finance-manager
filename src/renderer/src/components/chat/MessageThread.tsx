import { MessageSquare } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import ThreadHeader from './ThreadHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function MessageThread() {
  const { activeConversationId } = useChat();

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <MessageSquare size={24} style={{ color: 'rgba(99,102,241,0.7)' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            Select a conversation
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Choose a chat from the sidebar or start a DM
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ThreadHeader />
      <MessageList />
      <MessageInput />
    </div>
  );
}
