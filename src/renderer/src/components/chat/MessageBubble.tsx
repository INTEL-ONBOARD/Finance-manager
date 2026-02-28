import Avatar from './Avatar';
import type { ChatMessage } from '@/types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function MessageBubble({ message, isSelf }: MessageBubbleProps) {
  if (isSelf) {
    return (
      <div className="flex justify-end mb-2 px-4">
        <div style={{ maxWidth: '68%' }}>
          <div
            className="px-4 py-2.5 rounded-2xl rounded-tr-sm"
            style={{
              background: 'var(--accent-brand-dim, rgba(99,102,241,0.18))',
              border: '1px solid rgba(99,102,241,0.25)',
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
      <Avatar name={message.senderName} size={28} />
      <div style={{ maxWidth: '68%' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, paddingLeft: 2 }}>
          {message.senderName}
        </div>
        <div
          className="px-4 py-2.5 rounded-2xl rounded-tl-sm"
          style={{
            background: 'var(--bg-card, #1a2035)',
            border: '1px solid var(--border, rgba(255,255,255,0.06))',
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
