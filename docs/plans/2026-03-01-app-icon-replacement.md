# App Icon Replacement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all app icon files in `assets/` with the FinMate brand icon from `src/renderer/public/icon.png` (green hexagon + wallet), generating proper `.icns` (macOS), `.ico` (Windows), and `.png` (Linux) formats.

**Architecture:** Use macOS `sips` to resize the source PNG into all required sizes, `iconutil` to assemble the macOS `.icns`, and a Python/Pillow script to pack a multi-resolution `.ico` for Windows. The source file at `src/renderer/public/icon.png` is left untouched.

**Tech Stack:** macOS `sips`, `iconutil`, Python 3 + Pillow

---

### Task 1: Copy source PNG as Linux icon

**Files:**
- Modify: `assets/icon.png`

**Step 1: Copy the source icon**

```bash
cp "src/renderer/public/icon.png" "assets/icon.png"
```

**Step 2: Verify the file**

```bash
sips -g pixelWidth -g pixelHeight "assets/icon.png"
```
Expected output:
```
  pixelWidth: 1024
  pixelHeight: 1024
```

**Step 3: Commit**

```bash
git add assets/icon.png
git commit -m "chore: replace app icon PNG with FinMate brand icon"
```

---

### Task 2: Generate macOS `.icns` icon

**Files:**
- Create: `/tmp/FinMate.iconset/` (temporary, deleted after)
- Modify: `assets/icon.icns`

**Step 1: Create the iconset directory**

```bash
mkdir -p /tmp/FinMate.iconset
```

**Step 2: Generate all required sizes using sips**

```bash
sips -z 16 16     "assets/icon.png" --out /tmp/FinMate.iconset/icon_16x16.png
sips -z 32 32     "assets/icon.png" --out /tmp/FinMate.iconset/icon_16x16@2x.png
sips -z 32 32     "assets/icon.png" --out /tmp/FinMate.iconset/icon_32x32.png
sips -z 64 64     "assets/icon.png" --out /tmp/FinMate.iconset/icon_32x32@2x.png
sips -z 128 128   "assets/icon.png" --out /tmp/FinMate.iconset/icon_128x128.png
sips -z 256 256   "assets/icon.png" --out /tmp/FinMate.iconset/icon_128x128@2x.png
sips -z 256 256   "assets/icon.png" --out /tmp/FinMate.iconset/icon_256x256.png
sips -z 512 512   "assets/icon.png" --out /tmp/FinMate.iconset/icon_256x256@2x.png
sips -z 512 512   "assets/icon.png" --out /tmp/FinMate.iconset/icon_512x512.png
sips -z 1024 1024 "assets/icon.png" --out /tmp/FinMate.iconset/icon_512x512@2x.png
```

**Step 3: Verify the iconset directory has 10 files**

```bash
ls /tmp/FinMate.iconset | wc -l
```
Expected: `10`

**Step 4: Build the .icns file**

```bash
iconutil -c icns /tmp/FinMate.iconset -o "assets/icon.icns"
```

**Step 5: Verify the .icns was created**

```bash
ls -lh "assets/icon.icns"
```
Expected: file exists, size > 100KB

**Step 6: Clean up temp directory**

```bash
rm -rf /tmp/FinMate.iconset
```

**Step 7: Commit**

```bash
git add assets/icon.icns
git commit -m "chore: regenerate macOS .icns icon from FinMate brand icon"
```

---

### Task 3: Generate Windows `.ico` icon using Python + Pillow

**Files:**
- Modify: `assets/icon.ico`

**Step 1: Run the Python command to create the .ico**

```bash
python3 - << 'EOF'
from PIL import Image
import os

src = "assets/icon.png"
out = "assets/icon.ico"

img = Image.open(src).convert("RGBA")
sizes = [(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)]
imgs = [img.resize(s, Image.LANCZOS) for s in sizes]
imgs[0].save(out, format="ICO", sizes=sizes, append_images=imgs[1:])
print(f"Created {out} with sizes: {sizes}")
EOF
```

Expected output:
```
Created assets/icon.ico with sizes: [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
```

**Step 2: Verify the .ico file**

```bash
ls -lh "assets/icon.ico"
python3 -c "from PIL import Image; img = Image.open('assets/icon.ico'); print('ICO sizes:', img.info.get('sizes', 'n/a'))"
```
Expected: file exists, size > 50KB

**Step 3: Commit**

```bash
git add assets/icon.ico
git commit -m "chore: regenerate Windows .ico icon from FinMate brand icon"
```

---

### Task 4: Verify icons in electron-builder config

**Files:**
- Read: `electron-builder.yml`

**Step 1: Confirm icon paths are correct**

```bash
grep -E "icon:" electron-builder.yml
```
Expected output (no changes needed — paths already correct):
```
  icon: assets/icon.icns
  icon: assets/icon.ico
  icon: assets/icon.png
```

**Step 2: Final sanity check — all three asset files exist and have reasonable sizes**

```bash
ls -lh assets/icon.png assets/icon.icns assets/icon.ico
```
Expected: all three files present, `.icns` > 200KB, `.ico` > 50KB, `.png` > 100KB
