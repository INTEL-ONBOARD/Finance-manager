export {};

import type { Transaction, SavingsGoal, Bill, Account, Notification } from '@/context/FinanceContext';

declare global {
  interface Window {
    electron?: {
      platform: 'darwin' | 'win32' | 'linux';
      getVersion: () => Promise<string>;
      openExternal: (url: string) => Promise<void>;
      auth: {
        register: (name: string, email: string, password: string) => Promise<{ ok: boolean; user?: { id: string; name: string; email: string }; error?: string }>;
        login: (email: string, password: string) => Promise<{ ok: boolean; user?: { id: string; name: string; email: string }; error?: string }>;
        userExists: (email: string) => Promise<boolean>;
      };
      store: {
        get: (key: string) => Promise<unknown>;
        set: (key: string, value: unknown) => Promise<void>;
        delete: (key: string) => Promise<void>;
      };
      db: {
        transactions: {
          getAll: (userId: string) => Promise<Transaction[]>;
          add: (userId: string, doc: Transaction) => Promise<void>;
          delete: (userId: string, id: string) => Promise<void>;
        };
        goals: {
          getAll: (userId: string) => Promise<SavingsGoal[]>;
          add: (userId: string, doc: SavingsGoal) => Promise<void>;
          update: (userId: string, id: string, updates: Partial<SavingsGoal>) => Promise<void>;
          delete: (userId: string, id: string) => Promise<void>;
        };
        bills: {
          getAll: (userId: string) => Promise<Bill[]>;
          togglePaid: (userId: string, id: string) => Promise<void>;
        };
        accounts: {
          getAll: (userId: string) => Promise<Account[]>;
        };
        notifications: {
          getAll: (userId: string) => Promise<Notification[]>;
          markRead: (userId: string, id: string) => Promise<void>;
          markAllRead: (userId: string) => Promise<void>;
          add: (userId: string, doc: Notification) => Promise<void>;
        };
        clearUserData: (userId: string) => Promise<void>;
      };
      updater: {
        check:          () => Promise<void>;
        download:       () => Promise<void>;
        install:        () => Promise<void>;
        onChecking:     (cb: () => void) => () => void;
        onAvailable:    (cb: (info: { version: string; releaseNotes: string | null }) => void) => () => void;
        onNotAvailable: (cb: () => void) => () => void;
        onProgress:     (cb: (p: { percent: number }) => void) => () => void;
        onDownloaded:   (cb: () => void) => () => void;
        onError:        (cb: (msg: string) => void) => () => void;
      };
      chat: {
        listUsers:          (selfId: string) => Promise<import('@/types/chat').ChatUser[]>;
        fetchMessages:      (conversationId: string, limit: number, beforeSentAt?: string) => Promise<import('@/types/chat').ChatMessage[]>;
        sendMessage:        (doc: Omit<import('@/types/chat').ChatMessage, 'id'>) => Promise<void>;
        listConversations:  (userId: string) => Promise<Array<{ id: string; lastMessage: string; lastMessageAt: string }>>;
        watchConversation:  (conversationId: string) => Promise<void>;
        unwatchConversation:(conversationId: string) => Promise<void>;
        onMessage:          (cb: (payload: { conversationId: string; message: import('@/types/chat').ChatMessage }) => void) => () => void;
      };
    };
  }
}
