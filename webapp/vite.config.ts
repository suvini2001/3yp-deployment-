import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), 
    },
  },
  base: process.env.VERCEL ? '/' : '/e21-3yp-RAID/webapp/',
  build: {
    outDir: process.env.VERCEL ? 'dist' : '../docs/webapp',
    emptyOutDir: true, 
  },

  // 
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/components/ui/**', 'src/main.tsx'],
    },
  },
})
