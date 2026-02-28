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
          getAll: () => Promise<Transaction[]>;
          add: (doc: Transaction) => Promise<void>;
          delete: (id: string) => Promise<void>;
        };
        goals: {
          getAll: () => Promise<SavingsGoal[]>;
          add: (doc: SavingsGoal) => Promise<void>;
          update: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
          delete: (id: string) => Promise<void>;
        };
        bills: {
          getAll: () => Promise<Bill[]>;
          togglePaid: (id: string) => Promise<void>;
        };
        accounts: {
          getAll: () => Promise<Account[]>;
        };
        notifications: {
          getAll: () => Promise<Notification[]>;
          markRead: (id: string) => Promise<void>;
          markAllRead: () => Promise<void>;
        };
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
    };
  }
}
