import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { config as loadEnv } from 'dotenv'

loadEnv({ override: false }) // loads .env for local dev; won't override CI env vars

// Backend-mode builds (VITE_USE_BACKEND=true) route all data through the
// server API and never touch MongoDB from the main process — so the real
// connection string must never be inlined into that bundle. This is the mode
// used for every distributed build (see package.json `dist*` scripts); only
// an explicit local `npm run build` (direct-Mongo, dev-only) gets the real URI.
const isBackendMode = process.env.VITE_USE_BACKEND === 'true'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: {
      'process.env.MONGO_URI': JSON.stringify(isBackendMode ? '' : process.env.MONGO_URI ?? ''),
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    root: 'src/renderer',
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/renderer/index.html') },
      },
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': resolve(__dirname, 'src/renderer/src') },
    },
  },
})
