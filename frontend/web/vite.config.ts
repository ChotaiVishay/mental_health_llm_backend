import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite-only config (no `test:` block here)
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' }
})
