/// <reference types="vitest" />
import { defineConfig as defineViteConfig } from 'vite';
import { defineConfig as defineVitestConfig, mergeConfig } from 'vitest/config';
import path from 'node:path';
import tailwindcss from "@tailwindcss/vite";
import electron from 'vite-plugin-electron/simple';
import react from '@vitejs/plugin-react';

const viteConfig = defineViteConfig({
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
      // Disable renderer process during tests if not needed for unit tests
      renderer: process.env.NODE_ENV === 'test' ? undefined : {},
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // use “@/…” in your React code
    },
  },
});

const vitestConfig = defineVitestConfig({
  test: {
    globals: true, // Use Vitest globals (describe, test, expect, vi)
    environment: 'node', // For main process/Node.js tests. Use 'jsdom' for React components.
    setupFiles: ['./tests/setupTests.ts'], // Path to your test setup file
    include: ['tests/**/*.test.ts'], // Pattern for test files
    // Vitest attempts to reuse Vite's `resolve.alias` automatically.
    // Add specific deps optimization if needed for Electron or native modules.
    deps: {
      optimizer: {
        web: {
          include: ['electron'],
        },
        ssr: {
          include: ['electron'],
        }
      }
    },
  },
});

export default mergeConfig(viteConfig, vitestConfig);
