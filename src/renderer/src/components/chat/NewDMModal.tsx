import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import type { ChatUser } from '@/types/chat';
import Avatar from './Avatar';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NewDMModal({ open, onClose }: Props) {
  const { allUsers, openDM } = useChat();
  const [query, setQuery] = useState('');

  const filtered = allUsers.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (user: ChatUser) => {
    openDM(user);
    onClose();
    setQuery('');
  };

  return (
    <AnimatePresence>
      {open && (
        <div style={{ display: 'contents' }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm rounded-2xl p-5 pointer-events-auto"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>New Direct Message</h2>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Search */}
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}
            >
              <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                autoFocus
                type="text"
                placeholder="Search users…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: 13, color: 'var(--text-primary)' }}
              />
            </div>

            {/* User list */}
            <div className="flex flex-col gap-1" style={{ maxHeight: 260, overflowY: 'auto', scrollbarWidth: 'thin' }}>
              {filtered.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                  No users found
                </p>
              ) : filtered.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleSelect(u)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/5 text-left"
                >
                  <Avatar name={u.name} avatar={u.avatar} size={32} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
