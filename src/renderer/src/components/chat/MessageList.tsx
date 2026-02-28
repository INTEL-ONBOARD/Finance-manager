import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import MessageBubble from './MessageBubble';

export default function MessageList() {
  const { user } = useAuth();
  const { messages, hasMore, loadOlderMessages } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  // Auto-scroll to bottom when new messages arrive (only if near bottom)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom || messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center" ref={containerRef}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No messages yet. Say hello!</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto py-4" style={{ scrollbarWidth: 'thin' }}>
      {hasMore && (
        <div className="flex justify-center mb-3">
          <button
            onClick={loadOlderMessages}
            className="px-4 py-1.5 rounded-full text-xs font-medium transition-all hover:brightness-110"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-muted)',
            }}
          >
            Load older messages
          </button>
        </div>
      )}

      {messages.map(msg => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isSelf={msg.senderId === user?.id}
        />
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
