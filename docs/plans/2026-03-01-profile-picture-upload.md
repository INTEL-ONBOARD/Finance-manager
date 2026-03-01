# Profile Picture Upload Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the camera button in Settings → Profile to open a native Electron file dialog, store the selected image as a base64 JPEG in MongoDB `users` collection, and display it throughout the app.

**Architecture:** Two new IPC channels — `dialog:openImage` (opens native file picker, returns path) and `db:user:avatar:save` (reads file, validates ≤2MB, base64-encodes, upserts `users.avatar`). The avatar string is returned to the renderer, saved in `AuthContext` + `localStorage`, and displayed as an `<img>` tag replacing the initials badge.

**Tech Stack:** Electron `dialog` API, Node `fs.readFileSync`, MongoDB `updateOne`, React state, TypeScript

---

### Task 1: Add IPC handlers in main process

**Files:**
- Modify: `src/main/index.ts` — after the `db:sessions:revoke` handler (around line 212)

**Step 1: Add the `dialog:openImage` handler**

Insert after the existing `db:sessions:revoke` handler:

```typescript
ipcMain.handle('dialog:openImage', async () => {
  const { dialog } = await import('electron')
  const result = await dialog.showOpenDialog({
    title: 'Choose Profile Photo',
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }],
    properties: ['openFile']
  })
  return result.canceled ? null : result.filePaths[0]
})
```

**Step 2: Add the `db:user:avatar:save` handler**

Insert immediately after the handler from Step 1:

```typescript
ipcMain.handle('db:user:avatar:save', async (_e, userId: string, filePath: string) => {
  const { readFileSync, statSync } = await import('fs')
  const stat = statSync(filePath)
  if (stat.size > 2 * 1024 * 1024) {
    return { ok: false, error: 'Image must be under 2MB' }
  }
  const ext = filePath.split('.').pop()?.toLowerCase() ?? 'jpeg'
  const mimeMap: Record<string, string> = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp', gif: 'gif' }
  const mime = mimeMap[ext] ?? 'jpeg'
  const data = readFileSync(filePath)
  const avatar = `data:image/${mime};base64,${data.toString('base64')}`
  await col('users').updateOne({ id: userId }, { $set: { avatar } }, { upsert: false })
  return { ok: true, avatar }
})
```

**Step 3: Verify the file compiles**

Run: `npm run build 2>&1 | head -40`
Expected: no TypeScript errors. If errors appear, fix them before continuing.

**Step 4: Commit**

```bash
git add src/main/index.ts
git commit -m "feat: add dialog:openImage and db:user:avatar:save IPC handlers"
```

---

### Task 2: Expose channels in preload

**Files:**
- Modify: `src/preload/index.ts`

**Step 1: Add `dialog` namespace**

In `src/preload/index.ts`, find the `contextBridge.exposeInMainWorld('electron', {` block. Add a `dialog` key at the top level (after `auth:`, before `db:`):

```typescript
    dialog: {
      openImage: (): Promise<string | null> => ipcRenderer.invoke('dialog:openImage'),
    },
```

**Step 2: Add `db.user.avatar.save` under the `db` namespace**

Inside the `db:` object, find `sessions:` and add `user:` after it:

```typescript
    user: {
      avatar: {
        save: (userId: string, filePath: string): Promise<{ ok: boolean; avatar?: string; error?: string }> =>
          ipcRenderer.invoke('db:user:avatar:save', userId, filePath),
      },
    },
```

**Step 3: Verify**

Run: `npm run build 2>&1 | head -40`
Expected: no errors.

**Step 4: Commit**

```bash
git add src/preload/index.ts
git commit -m "feat: expose dialog.openImage and db.user.avatar.save in preload"
```

---

### Task 3: Update TypeScript types

**Files:**
- Modify: `src/renderer/src/types/electron.d.ts`

**Step 1: Add `avatar?` to `UserSettings`**

Find the `UserSettings` interface (lines 5–17) and add `avatar?`:

```typescript
interface UserSettings {
  name?: string;
  email?: string;
  currency?: string;
  timezone?: string;
  avatar?: string;
  notifs?: {
    billReminders: boolean;
    goalProgress: boolean;
    largeTransactions: boolean;
    monthlyReport: boolean;
    weeklyDigest: boolean;
  };
}
```

**Step 2: Add `dialog` namespace to `Window['electron']`**

In the `interface Window` block, find `auth:` and add `dialog:` before it:

```typescript
      dialog: {
        openImage: () => Promise<string | null>;
      };
```

**Step 3: Add `db.user` namespace**

Inside `db:`, after `sessions:`, add:

```typescript
        user: {
          avatar: {
            save: (userId: string, filePath: string) => Promise<{ ok: boolean; avatar?: string; error?: string }>;
          };
        };
```

**Step 4: Verify**

Run: `npm run build 2>&1 | head -40`
Expected: no errors.

**Step 5: Commit**

```bash
git add src/renderer/src/types/electron.d.ts
git commit -m "feat: add avatar and dialog types to electron.d.ts"
```

---

### Task 4: Update AuthContext to support avatar

**Files:**
- Modify: `src/renderer/src/context/AuthContext.tsx`

**Step 1: Add `avatar?` to the `User` interface**

Find the `User` interface (lines 3–8):

```typescript
interface User {
    id: string;
    name: string;
    email: string;
    sessionId?: string;
    avatar?: string;
}
```

**Step 2: Extend `AuthContextType.updateUser` to accept `avatar`**

Find line 17:
```typescript
// Before:
updateUser: (updates: Partial<Pick<User, 'name' | 'email'>>) => void;

// After:
updateUser: (updates: Partial<Pick<User, 'name' | 'email' | 'avatar'>>) => void;
```

**Step 3: Update `updateUser` implementation**

Find the `updateUser` function (lines 65–72):
```typescript
// Before:
const updateUser = (updates: Partial<Pick<User, 'name' | 'email'>>) => {

// After:
const updateUser = (updates: Partial<Pick<User, 'name' | 'email' | 'avatar'>>) => {
```

The body already handles spreading updates generically — no other change needed.

**Step 4: Verify**

Run: `npm run build 2>&1 | head -40`
Expected: no errors.

**Step 5: Commit**

```bash
git add src/renderer/src/context/AuthContext.tsx
git commit -m "feat: add avatar field to AuthContext User type"
```

---

### Task 5: Wire the camera button in SettingsPage

**Files:**
- Modify: `src/renderer/src/pages/SettingsPage.tsx`

**Step 1: Add avatar state and error state**

Near the top of the component, find where other state variables are declared (around lines 80–95). Add:

```typescript
const [avatarError, setAvatarError] = useState('');
```

The `user.avatar` from `AuthContext` is the source of truth — no separate local avatar state needed.

**Step 2: Also load `avatar` when loading settings**

In the `useEffect` that loads settings (lines 99–122), after setting `notifs`, also call `updateUser` if an avatar is stored:

```typescript
// After line 115 (if (n) setNotifs(n)), add:
const av = (s as { avatar?: string }).avatar;
if (av) updateUser({ avatar: av });
```

**Step 3: Add the `handleAvatarClick` handler**

Add this function near `handleSave` (around line 153):

```typescript
const handleAvatarClick = async () => {
  if (!user) return;
  setAvatarError('');
  const filePath = await window.electron?.dialog?.openImage();
  if (!filePath) return; // cancelled
  const result = await window.electron?.db.user?.avatar.save(user.id, filePath);
  if (!result) return;
  if (!result.ok) {
    setAvatarError(result.error ?? 'Failed to upload photo.');
    return;
  }
  if (result.avatar) updateUser({ avatar: result.avatar });
};
```

**Step 4: Update the avatar display section (lines 292–316)**

Replace the entire avatar `<div className="relative">` block (lines 294–303) with:

```tsx
<div className="relative">
  {user?.avatar ? (
    <img
      src={user.avatar}
      alt="Profile"
      className="w-20 h-20 rounded-2xl object-cover shrink-0"
      style={{ border: '2px solid rgba(74,222,128,0.3)' }}
    />
  ) : (
    <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
      style={{ background: 'linear-gradient(135deg, rgba(74,222,128,0.3), rgba(96,165,250,0.3))', border: '2px solid rgba(74,222,128,0.3)', color: 'var(--accent-brand)' }}>
      {profile.name ? profile.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'U'}
    </div>
  )}
  <button
    onClick={handleAvatarClick}
    className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl flex items-center justify-center"
    style={{ background: 'var(--accent-brand)', color: '#0d1117' }}>
    <Camera size={12} />
  </button>
</div>
```

**Step 5: Show the `avatarError` below the avatar card**

After the closing `</div>` of the `card p-6` div (after line 316), add:

```tsx
{avatarError && (
  <p className="mt-2 text-xs" style={{ color: 'var(--color-danger, #f87171)' }}>{avatarError}</p>
)}
```

**Step 6: Verify the build**

Run: `npm run build 2>&1 | head -40`
Expected: no TypeScript errors.

**Step 7: Commit**

```bash
git add src/renderer/src/pages/SettingsPage.tsx
git commit -m "feat: wire profile picture upload in SettingsPage"
```

---

### Task 6: Manual end-to-end verification

**Step 1: Start the app**

Run: `npm run dev`

**Step 2: Log in and go to Settings → Profile**

Confirm: initials badge and camera icon appear as before.

**Step 3: Click the camera icon**

Expected: native macOS/Windows file picker opens, filtered to image files.

**Step 4: Select a valid image ≤ 2MB**

Expected: avatar immediately updates to show the photo; initials badge disappears.

**Step 5: Quit and relaunch**

Expected: avatar still shows (loaded from DB via settings load effect).

**Step 6: Test error case — select a file > 2MB**

Expected: inline error message "Image must be under 2MB" appears below the avatar card; avatar unchanged.

**Step 7: Cancel the dialog**

Expected: nothing changes, no error shown.
