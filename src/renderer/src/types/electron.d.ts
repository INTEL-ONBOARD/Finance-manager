export {};

import type { Transaction, SavingsGoal, Bill, Account, Notification } from '@/context/FinanceContext';

interface UserSettings {
  name?: string;
  email?: string;
  currency?: string;
  timezone?: string;
  notifs?: {
    systemNotifications: boolean;
    billReminders: boolean;
    goalProgress: boolean;
    largeTransactions: boolean;
    monthlyReport: boolean;
    weeklyDigest: boolean;
  };
  avatar?: string;
}

interface Session {
  sessionId: string;
  userId: string;
  deviceLabel: string;
  createdAt: string;
  lastActiveAt: string;
}

declare global {
  interface Window {
    electron?: {
      platform: 'darwin' | 'win32' | 'linux';
      getVersion: () => Promise<string>;
      openExternal: (url: string) => Promise<void>;
      auth: {
        register: (name: string, email: string, password: string) => Promise<{ ok: boolean; user?: { id: string; name: string; email: string; avatar?: string | null }; sessionId?: string; error?: string }>;
        login: (email: string, password: string) => Promise<{ ok: boolean; user?: { id: string; name: string; email: string; avatar?: string | null }; sessionId?: string; error?: string }>;
        userExists: (email: string) => Promise<boolean>;
        changePassword: (userId: string, oldPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
      };
      store: {
        get: (key: string) => Promise<unknown>;
        set: (key: string, value: unknown) => Promise<void>;
        delete: (key: string) => Promise<void>;
      };
      dialog: {
        openImage: () => Promise<string | null>;
        openFile: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>;
        readFile: (filePath: string) => Promise<string>;
      };
      db: {
        transactions: {
          getAll: (userId: string) => Promise<Transaction[]>;
          add: (userId: string, doc: Transaction) => Promise<void>;
          update: (userId: string, id: string, updates: Partial<Transaction>) => Promise<void>;
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
          add: (userId: string, doc: Omit<Bill, 'id'>) => Promise<void>;
          update: (userId: string, id: string, updates: Partial<Bill>) => Promise<void>;
          delete: (userId: string, id: string) => Promise<void>;
        };
        accounts: {
          getAll: (userId: string) => Promise<Account[]>;
          add: (userId: string, doc: Omit<Account, 'id'>) => Promise<void>;
          update: (userId: string, id: string, updates: Partial<Account>) => Promise<void>;
          delete: (userId: string, id: string) => Promise<void>;
        };
        notifications: {
          getAll: (userId: string) => Promise<Notification[]>;
          markRead: (userId: string, id: string) => Promise<void>;
          markAllRead: (userId: string) => Promise<void>;
          add: (userId: string, doc: Notification) => Promise<void>;
        };
        clearUserData: (userId: string) => Promise<void>;
        settings: {
          get: (userId: string) => Promise<UserSettings | null>;
          save: (userId: string, settings: UserSettings) => Promise<void>;
        };
        sessions: {
          list: (userId: string) => Promise<Session[]>;
          revoke: (userId: string, sessionId: string) => Promise<void>;
        };
        user: {
          avatar: {
            save: (userId: string, filePath: string) => Promise<{ ok: boolean; avatar?: string; error?: string }>;
          };
        };
      };
      notify: {
        send: (title: string, body: string) => Promise<void>;
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
      windowControls: {
        minimize:    () => Promise<void>;
        maximize:    () => Promise<void>;
        unmaximize:  () => Promise<void>;
        close:       () => Promise<void>;
        isMaximized: () => Promise<boolean>;
      };
      chat: {
        listUsers:          (selfId: string) => Promise<import('@/types/chat').ChatUser[]>;
        presencePing:       (sessionId: string) => Promise<void>;
        fetchMessages:      (conversationId: string, limit: number, beforeSentAt?: string) => Promise<import('@/types/chat').ChatMessage[]>;
        sendMessage:        (doc: Omit<import('@/types/chat').ChatMessage, 'id'>) => Promise<void>;
        listConversations:  (userId: string) => Promise<Array<{ id: string; lastMessage: string; lastMessageAt: string }>>;
        watchConversation:  (conversationId: string) => Promise<void>;
        unwatchConversation:(conversationId: string) => Promise<void>;
        onMessage:          (cb: (payload: { conversationId: string; message: import('@/types/chat').ChatMessage }) => void) => () => void;
        onPresenceUpdate:   (cb: (payload: { userId: string; lastActiveAt: string }) => void) => () => void;
      };
    };
  }
}
