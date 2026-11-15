import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Project Pages serves this app below /mission-outpost/ instead of the domain root.
  // Keep local development and preview at / while giving production assets the Pages path.
  base: process.env.GITHUB_ACTIONS === 'true' ? '/mission-outpost/' : '/',
  plugins: [react()],
})
