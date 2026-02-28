import {
  createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import type { ChatMessage, ChatUser } from '@/types/chat';

// ── Types ────────────────────────────────────────────────────────────────────

interface ConversationEntry {
  id: string;
  lastMessage: string;
  lastMessageAt: string;
}

interface ChatContextType {
  // Sidebar
  conversations: ConversationEntry[];
  activeConversationId: string | null;
  unreadCounts: Record<string, number>;
  allUsers: ChatUser[];
  // Thread
  messages: ChatMessage[];
  hasMore: boolean;
  // Actions
  openConversation: (id: string) => void;
  openDM: (otherUser: ChatUser) => void;
  sendMessage: (body: string) => void;
  loadOlderMessages: () => void;
  markConversationRead: (id: string) => void;
  refreshUsers: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 40;
const GROUP_STUB: ConversationEntry = { id: 'group', lastMessage: '', lastMessageAt: '' };

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { addNotification } = useFinance();

  // Group chat is always present — initialize immediately so sidebar is never empty
  const [conversations, setConversations] = useState<ConversationEntry[]>([GROUP_STUB]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [allUsers, setAllUsers] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);

  // Ref keeps activeConversationId accessible in the onMessage closure without re-registering
  const activeConversationIdRef = useRef<string | null>(null);
  activeConversationIdRef.current = activeConversationId;

  // Load sidebar conversations + all users on mount; auto-watch all known conversations
  useEffect(() => {
    const el = window.electron?.chat;
    if (!user || !el) return;
    el.listConversations(user.id).then(convos => {
      // Merge DB convos with the guaranteed group stub
      const hasGroup = convos.some(c => c.id === 'group');
      const entries: ConversationEntry[] = hasGroup
        ? convos
        : [GROUP_STUB, ...convos];
      setConversations(entries);
      // Watch all known conversations so incoming messages are received even without opening them
      const allIds = [...new Set([...entries.map(c => c.id), 'group'])];
      for (const id of allIds) {
        el.watchConversation(id).catch(() => {});
        watchedIdsRef.current.add(id);
      }
    }).catch(() => {
      // Keep the group stub already in state; still watch group
      el.watchConversation('group').catch(() => {});
      watchedIdsRef.current.add('group');
    });
    el.listUsers(user.id).then(users => {
      setAllUsers(users);
      // Pre-watch all possible DM conversations so first-ever messages are received
      for (const other of users) {
        const dmId = `dm_${[user.id, other.id].sort().join('_')}`;
        if (!watchedIdsRef.current.has(dmId)) {
          el.watchConversation(dmId).catch(() => {});
          watchedIdsRef.current.add(dmId);
        }
      }
    }).catch(() => {});
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ref keeps addNotification accessible in the onMessage closure without re-registering
  const addNotificationRef = useRef(addNotification);
  addNotificationRef.current = addNotification;
  const userRef = useRef(user);
  userRef.current = user;

  // Global message listener — registered once on mount
  useEffect(() => {
    const el = window.electron?.chat;
    if (!el) return;
    const unsubscribe = el.onMessage(({ conversationId, message }) => {
      if (conversationId === activeConversationIdRef.current) {
        setMessages(prev => [...prev, message]);
      } else {
        setUnreadCounts(prev => ({ ...prev, [conversationId]: (prev[conversationId] ?? 0) + 1 }));
      }
      // Update sidebar last message
      setConversations(prev => {
        const existing = prev.find(c => c.id === conversationId);
        const updated: ConversationEntry = {
          id: conversationId,
          lastMessage: message.body,
          lastMessageAt: message.sentAt,
        };
        if (existing) {
          return [updated, ...prev.filter(c => c.id !== conversationId)];
        }
        return [updated, ...prev];
      });
      // Notify for messages from other users
      if (message.senderId !== userRef.current?.id) {
        addNotificationRef.current({
          id: `notif_chat_${message.id}`,
          title: conversationId === 'group'
            ? `New message in Group Chat`
            : `New message from ${message.senderName}`,
          body: message.body.length > 80 ? message.body.slice(0, 80) + '…' : message.body,
          time: 'Just now',
          type: 'info',
        });
      }
    });
    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Switch active conversation
  const openConversation = useCallback(async (id: string) => {
    const el = window.electron?.chat;
    setActiveConversationId(id);
    setMessages([]);
    setHasMore(false);
    if (!el) return;
    // Fetch initial messages; start watch only if not already watching
    try {
      const msgs = await el.fetchMessages(id, PAGE_SIZE);
      setMessages(msgs);
      setHasMore(msgs.length === PAGE_SIZE);
      if (!watchedIdsRef.current.has(id)) {
        await el.watchConversation(id);
        watchedIdsRef.current.add(id);
      }
    } catch {
      // Silently ignore — user sees empty thread
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openDM = useCallback((otherUser: ChatUser) => {
    if (!user) return;
    const dmId = `dm_${[user.id, otherUser.id].sort().join('_')}`;
    // Ensure entry exists in sidebar
    setConversations(prev => {
      if (prev.find(c => c.id === dmId)) return prev;
      return [...prev, { id: dmId, lastMessage: '', lastMessageAt: '' }];
    });
    openConversation(dmId);
  }, [user, openConversation]);

  const sendMessage = useCallback((body: string) => {
    const el = window.electron?.chat;
    if (!user || !activeConversationIdRef.current || !body.trim() || !el) return;
    const doc: Omit<ChatMessage, 'id'> = {
      conversationId: activeConversationIdRef.current,
      senderId: user.id,
      senderName: user.name,
      body: body.trim(),
      sentAt: new Date().toISOString(),
    };
    el.sendMessage(doc).catch(() => {});
    // No optimistic update — Change Stream will deliver it in ~50ms
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadOlderMessages = useCallback(async () => {
    const el = window.electron?.chat;
    if (!el || !activeConversationIdRef.current || messages.length === 0) return;
    const oldest = messages[0].sentAt;
    try {
      const older = await el.fetchMessages(activeConversationIdRef.current, PAGE_SIZE, oldest);
      setMessages(prev => [...older, ...prev]);
      setHasMore(older.length === PAGE_SIZE);
    } catch {
      // Ignore
    }
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  const markConversationRead = useCallback((id: string) => {
    setUnreadCounts(prev => ({ ...prev, [id]: 0 }));
  }, []);

  const refreshUsers = useCallback(() => {
    const el = window.electron?.chat;
    if (!user || !el) return;
    el.listUsers(user.id).then(users => {
      setAllUsers(users);
      // Watch any new DM conversations not yet watched
      for (const other of users) {
        const dmId = `dm_${[user.id, other.id].sort().join('_')}`;
        if (!watchedIdsRef.current.has(dmId)) {
          el.watchConversation(dmId).catch(() => {});
          watchedIdsRef.current.add(dmId);
        }
      }
    }).catch(() => {});
  }, [user]);

  // Track all watched conversation IDs for cleanup
  const watchedIdsRef = useRef<Set<string>>(new Set());

  // Cleanup on unmount — unwatch all streams
  useEffect(() => {
    return () => {
      const el = window.electron?.chat;
      if (!el) return;
      for (const id of watchedIdsRef.current) {
        el.unwatchConversation(id).catch(() => {});
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ChatContext.Provider value={{
      conversations, activeConversationId, unreadCounts, allUsers,
      messages, hasMore,
      openConversation, openDM, sendMessage, loadOlderMessages, markConversationRead, refreshUsers,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
