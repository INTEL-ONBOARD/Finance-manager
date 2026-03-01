# Real-Time Presence Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan.

## Goal

Show a live green dot (online) or grey dot (offline) next to each DM contact in the community sidebar, updating in real-time (~50ms) via MongoDB Change Stream — no polling.

## Architecture

A single persistent Change Stream watches the `sessions` collection in the main process. When any session's `lastActiveAt` is updated by a heartbeat ping, the stream fires and pushes a `presence:update` IPC event to the renderer. `ChatContext` merges the update into `allUsers` state, causing `ConversationItem` to re-render with the correct dot color instantly.

## Data Flow

```
User B's app          MongoDB Atlas         User A's app
────────────         ──────────────         ────────────
presencePing()  →→  sessions.updateOne()
                          ↓
                    Change Stream fires
                          ↓                →→  'presence:update' IPC event
                                               ChatContext merges allUsers
                                               ConversationItem re-renders
                                               Green/grey dot updates (~50ms)
```

## Files Changed

### `src/main/index.ts`
- Add `presenceStream` variable (`ChangeStream | null`)
- In `registerChatStreamHandlers(win)`: open a Change Stream on `sessions` collection watching `update` operations, extract `userId` + `lastActiveAt` from `fullDocument`, push `win.webContents.send('presence:update', { userId, lastActiveAt })`
- Close `presenceStream` in `win.on('closed')`

### `src/preload/index.ts`
- Add `chat.onPresenceUpdate(cb)` → `ipcRenderer.on('presence:update', ...)` returning an unsubscribe function

### `src/renderer/src/types/electron.d.ts`
- Add to chat namespace: `onPresenceUpdate: (cb: (p: { userId: string; lastActiveAt: string }) => void) => () => void`

### `src/renderer/src/context/ChatContext.tsx`
- Register `onPresenceUpdate` listener on mount; on event, patch matching user's `lastActiveAt` in `allUsers` state in-place
- Remove 60s polling `setInterval` for `listUsers` (replaced by the stream)
- Keep 30s heartbeat ping (produces the DB updates the stream picks up)

### `src/renderer/src/components/chat/ConversationItem.tsx`
- Always render a dot for non-group conversations
- Green `#22c55e` when online (lastActiveAt < 10 min ago)
- Grey `#6b7280` when offline or no lastActiveAt

## Dot Behavior

| State | Color |
|---|---|
| Online (lastActiveAt < 10 min ago) | Green `#22c55e` |
| Offline / never seen | Grey `#6b7280` |
| Group Chat | No dot |
