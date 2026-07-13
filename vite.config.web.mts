import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Standalone web build of the same renderer used by the desktop app.
// Production is served at the domain root (https://finmate.com.lk) — see
// server/README.md#production — so the default base is "/". The old
// /finwise-app/ prefix (bare-IP and sslip.io hosts) was decommissioned
// 2026-07-13; pass VITE_BASE=/finwise-app/ only if resurrecting that path.
// The API base defaults to the same-origin /finwise path (see src/web/config.ts).
//
// Local dev talks to the remote backend through a same-origin proxy so the
// browser never makes a cross-origin request: it hits localhost /finwise/*,
// Vite forwards it (path unchanged — the VPS Caddy strips the /finwise prefix)
// to the backend. This keeps cookie + bearer auth and Socket.IO working without
// widening the server's CORS allowlist. Override the target with VITE_PROXY_TARGET.
const proxyTarget = process.env.VITE_PROXY_TARGET ?? 'https://84-247-139-75.sslip.io'
export default defineConfig({
  root: 'src/renderer',
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src/renderer/src') },
  },
  server: {
    // Trailing slash so this never captures the app's own base path.
    proxy: {
      '/finwise/': {
        target: proxyTarget,
        changeOrigin: true,
        secure: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist-web'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
  },
})
