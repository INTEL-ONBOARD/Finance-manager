# Real-Time Presence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show a live green dot (online) or grey dot (offline) next to each DM contact in the community sidebar, updating in real-time (~50ms) via a MongoDB Change Stream on the `sessions` collection.

**Architecture:** The main process opens a single persistent Change Stream on `sessions` at startup. When any session's `lastActiveAt` is updated by a heartbeat ping, the stream fires and pushes a `presence:update` IPC push event (`win.webContents.send`) to the renderer. `ChatContext` merges the update into `allUsers` state in-place, causing `ConversationItem` to re-render with the correct dot instantly. The 60s polling interval for `listUsers` is removed — the stream replaces it.

**Tech Stack:** Electron IPC (ipcMain push via `webContents.send`), MongoDB Change Stream (`sessions` collection), React Context state update, TypeScript.

---

### Task 1: Add presence Change Stream in main process

**Context:** `src/main/index.ts` already has `registerChatStreamHandlers(win)` which opens Change Streams on the `messages` collection and wires up `win.on('closed')` cleanup. We add a second stream that watches `sessions` updates and pushes a `presence:update` event.

**Files:**
- Modify: `src/main/index.ts` — `registerChatStreamHandlers` function (lines 417–448) and the module-level `activeStreams` declaration (line 33)

**Step 1: Add a `presenceStream` module-level variable**

Find this line at the top of the file (line 33):
```ts
const activeStreams = new Map<string, ChangeStream>()
```

Add immediately after it:
```ts
let presenceStream: ChangeStream | null = null
```

**Step 2: Open the presence Change Stream inside `registerChatStreamHandlers`**

Find the closing lines of `registerChatStreamHandlers` (the `win.on('closed', ...)` block, lines 444–447):
```ts
  win.on('closed', async () => {
    for (const [, stream] of activeStreams) await stream.close()
    activeStreams.clear()
  })
```

Insert the presence stream setup **before** `win.on('closed', ...)`:
```ts
  // ── Presence Change Stream — watches sessions for lastActiveAt updates ──────
  try {
    presenceStream = col('sessions').watch([], { fullDocument: 'updateLookup' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    presenceStream.on('change', (change: any) => {
      if (
        (change.operationType === 'update' || change.operationType === 'replace') &&
        change.fullDocument &&
        change.fullDocument.userId &&
        change.fullDocument.lastActiveAt
      ) {
        if (!win.isDestroyed()) {
          win.webContents.send('presence:update', {
            userId: change.fullDocument.userId,
            lastActiveAt: change.fullDocument.lastActiveAt,
          })
        }
      }
    })
  } catch {
    // Presence stream unavailable — degraded gracefully (polling fallback still works)
  }
```

**Step 3: Close the presence stream in `win.on('closed')`**

Update the existing `win.on('closed', ...)` block to also close `presenceStream`:
```ts
  win.on('closed', async () => {
    for (const [, stream] of activeStreams) await stream.close()
    activeStreams.clear()
    if (presenceStream) { await presenceStream.close(); presenceStream = null }
  })
```

**Step 4: Verify the app still starts**

Run: `npm run dev`
Expected: App launches without errors in the terminal. No `presence` errors in the console.

**Step 5: Commit**
```bash
git add src/main/index.ts
git commit -m "feat: open presence Change Stream on sessions collection"
```

---

### Task 2: Expose `onPresenceUpdate` in preload + types

**Context:** The preload (`src/preload/index.ts`) exposes IPC to the renderer via `contextBridge`. We need to add `chat.onPresenceUpdate` as a listener registration function (same pattern as `chat.onMessage`). We also update the TypeScript declaration in `electron.d.ts`.

**Files:**
- Modify: `src/preload/index.ts` — inside the `chat:` object (lines 80–101)
- Modify: `src/renderer/src/types/electron.d.ts` — inside the `chat:` interface

**Step 1: Add `onPresenceUpdate` to preload**

In `src/preload/index.ts`, find the `onMessage` function inside `chat:` (around line 96):
```ts
    onMessage(cb: (payload: { conversationId: string; message: unknown }) => void): () => void {
      const l = (_e: Electron.IpcRendererEvent, payload: { conversationId: string; message: unknown }) => cb(payload)
      ipcRenderer.on('chat:message:new', l)
      return () => ipcRenderer.removeListener('chat:message:new', l)
    },
```

Add immediately after it (before the closing `},` of the `chat:` object):
```ts
    onPresenceUpdate(cb: (payload: { userId: string; lastActiveAt: string }) => void): () => void {
      const l = (_e: Electron.IpcRendererEvent, payload: { userId: string; lastActiveAt: string }) => cb(payload)
      ipcRenderer.on('presence:update', l)
      return () => ipcRenderer.removeListener('presence:update', l)
    },
```

**Step 2: Add `onPresenceUpdate` to TypeScript declaration**

In `src/renderer/src/types/electron.d.ts`, find the `chat:` interface. It currently ends with:
```ts
        onMessage:          (cb: (payload: { conversationId: string; message: import('@/types/chat').ChatMessage }) => void) => () => void;
```

Add the line after it:
```ts
        onPresenceUpdate:   (cb: (payload: { userId: string; lastActiveAt: string }) => void) => () => void;
```

**Step 3: Verify TypeScript compiles**

Run: `npm run build 2>&1 | head -30`
Expected: No TypeScript errors. (Build may fail on other things — only care about type errors in preload/types.)

**Step 4: Commit**
```bash
git add src/preload/index.ts src/renderer/src/types/electron.d.ts
git commit -m "feat: expose onPresenceUpdate IPC listener in preload"
```

---

### Task 3: Wire presence updates into ChatContext

**Context:** `src/renderer/src/context/ChatContext.tsx` currently has a 60s polling interval for `listUsers`. We replace this with a real-time `onPresenceUpdate` listener that patches `allUsers` state in-place when a presence event arrives. We also keep the existing 30s heartbeat ping (it produces the DB writes the stream picks up).

**Files:**
- Modify: `src/renderer/src/context/ChatContext.tsx`

**Step 1: Add the `onPresenceUpdate` listener effect**

Find the existing `onMessage` effect (around line 104–141):
```ts
  // Global message listener — registered once on mount
  useEffect(() => {
    const el = window.electron?.chat;
    if (!el) return;
    const unsubscribe = el.onMessage(({ conversationId, message }) => {
      ...
    });
    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
```

Add a new effect **immediately after** it:
```ts
  // Real-time presence updates via Change Stream push
  useEffect(() => {
    const el = window.electron?.chat;
    if (!el) return;
    const unsubscribe = el.onPresenceUpdate(({ userId, lastActiveAt }) => {
      setAllUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, lastActiveAt } : u)
      );
    });
    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
```

**Step 2: Remove the 60s polling interval for `listUsers`**

Find and delete this entire effect (around lines 234–242):
```ts
  // Refresh user list every 60s to pick up presence changes
  useEffect(() => {
    const el = window.electron?.chat;
    if (!user || !el) return;
    const interval = setInterval(() => {
      el.listUsers(user.id).then(setAllUsers).catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
```

**Step 3: Verify the app runs with no console errors**

Run: `npm run dev`
Open Community. Expected: No TypeScript or runtime errors in dev console related to presence.

**Step 4: Commit**
```bash
git add src/renderer/src/context/ChatContext.tsx
git commit -m "feat: replace presence polling with real-time Change Stream listener"
```

---

### Task 4: Always show green/grey dot on DM items

**Context:** `src/renderer/src/components/chat/ConversationItem.tsx` currently only renders the dot conditionally when `online === true`. We change it to always render a dot for non-group conversations: green when online, grey when offline.

**Files:**
- Modify: `src/renderer/src/components/chat/ConversationItem.tsx`

**Step 1: Replace the conditional dot with always-on green/grey dot**

Find the existing conditional dot (around lines 73–80):
```tsx
        {online && (
          <span style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 9, height: 9, borderRadius: '50%',
            background: '#22c55e',
            border: '2px solid var(--bg-sidebar, var(--bg-main))',
          }} />
        )}
```

Replace with:
```tsx
        {!isGroup && (
          <span style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 9, height: 9, borderRadius: '50%',
            background: online ? '#22c55e' : '#6b7280',
            border: '2px solid var(--bg-sidebar, var(--bg-main))',
          }} />
        )}
```

**Step 2: Verify visually**

Run: `npm run dev`
Open Community page. Expected:
- Each DM contact has a small dot on their avatar (bottom-right)
- Green dot = online (active within last 10 minutes)
- Grey dot = offline

**Step 3: Commit**
```bash
git add src/renderer/src/components/chat/ConversationItem.tsx
git commit -m "feat: always show green/grey presence dot on DM sidebar items"
```

---

### Task 5: End-to-end verification

**Step 1: Restart the app cleanly**

Stop any running dev server. Run: `npm run dev`

**Step 2: Log in**

Log in with any account. Open Community page. Expected:
- All DM contacts show grey dots initially (before their ping has been processed)
- Within ~1 second the logged-in user's own heartbeat ping fires → their session updates → Change Stream fires → BUT the logged-in user is excluded from their own sidebar (`$ne: selfId`), so no dot changes for them

**Step 3: Test with a second user**

Open a second instance of the app (or log in on a separate machine). Log in as a different user. Expected:
- Within ~1 second, the first user's sidebar shows a **green dot** next to the second user's DM entry (Change Stream fires on second user's ping → `presence:update` IPC event → `allUsers` patched → dot turns green)

**Step 4: Test going offline**

Close the second app instance. Wait 10 minutes (or temporarily change the `isOnline` threshold in `ConversationItem.tsx` to 30 seconds for testing). Expected:
- The second user's dot turns grey automatically on the next render (no IPC event needed — `isOnline()` is computed from `lastActiveAt` on each render)

**Step 5: Final commit if any cleanup needed**
```bash
git add -A
git commit -m "fix: presence e2e verification cleanup"
```
