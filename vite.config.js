import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/  ·  https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',          // a fake browser DOM for React components
    globals: true,                 // describe/it/expect without imports; lets Testing Library clean up after each test
    setupFiles: './src/test/setup.js',
    testTimeout: 30000,            // whole-app tests click through many screens; parallel runs on a busy machine need headroom
    maxWorkers: '50%',             // fewer workers = less CPU contention, so long click-throughs don't time out
    css: { modules: { classNameStrategy: 'non-scoped' } },  // readable class names in test output
  },
})
