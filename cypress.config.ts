// cypress.config.ts
import { defineConfig } from 'cypress'
export default defineConfig({
  e2e: {
    baseUrl: 'https://comp-30022-group-30-mental-health-s.vercel.app',
    video: false,
    retries: 1
  }
})
