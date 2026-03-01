import Avatar from './Avatar';
import type { ChatMessage } from '@/types/chat';
import { useChat } from '@/context/ChatContext';

interface MessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function MessageBubble({ message, isSelf }: MessageBubbleProps) {
  const { allUsers } = useChat();
  const senderAvatar = allUsers.find(u => u.id === message.senderId)?.avatar ?? null;

  if (isSelf) {
    return (
      <div className="flex justify-end mb-2 px-4">
        <div style={{ maxWidth: '68%' }}>
          <div
            className="px-4 py-2.5 rounded-2xl rounded-tr-sm"
            style={{
              background: 'var(--accent-brand-dim)',
              border: '1px solid var(--border-light)',
            }}
          >
            <p style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.5, wordBreak: 'break-word' }}>
              {message.body}
            </p>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textAlign: 'right', marginTop: 3 }}>
            {formatTime(message.sentAt)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 mb-2 px-4">
      <Avatar name={message.senderName} avatar={senderAvatar} size={28} />
      <div style={{ maxWidth: '68%' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, paddingLeft: 2 }}>
          {message.senderName}
        </div>
        <div
          className="px-4 py-2.5 rounded-2xl rounded-tl-sm"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <p style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.5, wordBreak: 'break-word' }}>
            {message.body}
          </p>
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3, paddingLeft: 2 }}>
          {formatTime(message.sentAt)}
        </div>
      </div>
    </div>
  );
}
