import { useState, useRef, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

export default function MessageInput() {
  const { sendMessage, activeConversationId } = useChat();
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || !activeConversationId) return;
    sendMessage(trimmed);
    setValue('');
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    // Cap at 4 rows (~96px)
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  };

  if (!activeConversationId) return null;

  return (
    <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)', flexShrink: 0 }}>
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2.5"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 resize-none bg-transparent outline-none"
          style={{
            fontSize: 13.5,
            color: 'var(--text-primary)',
            lineHeight: 1.5,
            maxHeight: 96,
            scrollbarWidth: 'none',
            padding: 0,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim()}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          style={{
            background: value.trim() ? 'var(--accent-brand)' : 'transparent',
            color: value.trim() ? '#fff' : 'var(--text-muted)',
            flexShrink: 0,
          }}
        >
          <Send size={14} />
        </button>
      </div>
      <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 5, textAlign: 'center' }}>
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  );
}
