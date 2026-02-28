import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { config as loadEnv } from 'dotenv'

loadEnv({ override: false }) // loads .env for local dev; won't override CI env vars

const MONGO_URI = process.env.MONGO_URI ?? ''
console.log('[build] MONGO_URI present:', MONGO_URI.length > 0, '| starts with:', MONGO_URI.slice(0, 20) || '(empty)')

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: {
      'process.env.MONGO_URI': JSON.stringify(MONGO_URI),
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
