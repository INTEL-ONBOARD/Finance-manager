import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Standalone web build of the same renderer used by the desktop app.
// Served on the VPS under /finwise-app/ (override the base with VITE_BASE).
// The API base defaults to the same-origin /finwise path (see src/web/config.ts).
export default defineConfig({
  root: 'src/renderer',
  base: process.env.VITE_BASE ?? '/finwise-app/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src/renderer/src') },
  },
  build: {
    outDir: resolve(__dirname, 'dist-web'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
  },
})
