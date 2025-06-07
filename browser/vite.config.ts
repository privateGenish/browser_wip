import { defineConfig } from 'vite'
import path from 'node:path'
import tailwindcss from "@tailwindcss/vite"
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',            // ← ensure assets resolve under file:// 
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: 'electron/main.ts',       // your Electron “main” entry
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'), // your preload
      },
      renderer: process.env.NODE_ENV === 'test'
        ? undefined
        : {},       // ← keeps Node/Electron APIs shimmed for renderer
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // use “@/…” in your React code
    },
  },
})
