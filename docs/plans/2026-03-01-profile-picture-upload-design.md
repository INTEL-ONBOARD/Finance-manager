# Design: Profile Picture Upload

**Date:** 2026-03-01
**Status:** Approved

## Context

The Settings page profile section displays an initials badge with a camera icon overlay. The camera button is currently decorative — no file picker, no upload, no persistence. Users expect to be able to set a profile photo.

## Goal

Wire the camera button to open a native Electron file dialog, read and validate the selected image in the main process, store it as a base64 JPEG in the MongoDB `users` collection, and display it in place of the initials badge throughout the app.

## Architecture

### Storage
- `avatar` field added to the `users` MongoDB collection (string, `data:image/jpeg;base64,...`)
- Also persisted to `localStorage` as part of the `AuthContext` user object for fast initial render

### IPC Channels (new)

| Channel | Direction | Purpose |
|---|---|---|
| `dialog:openImage` | renderer → main | Opens native file picker filtered to images, returns selected file path |
| `db:user:avatar:save` | renderer → main | Reads file at path, validates size, encodes base64, upserts `users.avatar` |

### Data Flow

1. Camera button click → `ipcRenderer.invoke('dialog:openImage')` → native file picker
2. User picks image → main returns `filePath` string (or `null` if cancelled)
3. Renderer invokes `ipcRenderer.invoke('db:user:avatar:save', { userId, filePath })`
4. Main reads file: if raw size > 2MB → returns `{ error: 'Image too large (max 2MB)' }`
5. Main encodes to `data:image/jpeg;base64,...` string, upserts `users` collection: `{ $set: { avatar } }` where `userId`
6. Returns `{ avatar: 'data:image/jpeg;base64,...' }`
7. Renderer calls `updateUser({ avatar })` → updates `AuthContext` + `localStorage`
8. Settings profile section re-renders with `<img src={user.avatar}>` replacing initials badge

### Resize Strategy
No server-side resize (avoids native dependency complexity). Instead, cap raw file at **2MB** and reject with a user-facing error. Profile photos are typically well under this limit. If sharp is confirmed present in the project, resize to 256×256 max in a future iteration.

### Error Handling
- File too large → inline error below avatar: "Image must be under 2MB"
- Dialog cancelled → no-op
- DB write failure → inline error: "Failed to save photo. Please try again."

## Files to Modify

| File | Change |
|---|---|
| `src/main/index.ts` | Add `dialog:openImage` and `db:user:avatar:save` IPC handlers |
| `src/preload/index.ts` | Expose `dialog.openImage()` and `db.user.avatar.save()` |
| `src/renderer/src/types/electron.d.ts` | Type both channels; add `avatar?` to `User` |
| `src/renderer/src/context/AuthContext.tsx` | Add `avatar?` to `User` interface; persist in localStorage |
| `src/renderer/src/pages/SettingsPage.tsx` | Wire camera button; show `<img>` when avatar exists; inline error state |

## Verification

1. Run `npm run dev`
2. Go to Settings → Profile
3. Click the camera icon → native file picker opens
4. Select an image ≤ 2MB → avatar appears in profile header
5. Reload app → avatar persists (loaded from DB via `db:settings:get` on mount or from localStorage)
6. Select an image > 2MB → inline error appears, no crash
7. Cancel the dialog → nothing changes
