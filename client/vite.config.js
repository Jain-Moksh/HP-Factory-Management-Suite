import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // 🔥 this exposes to LAN
    port: 5000,       // 🔥 this is the port you want to use
    // The app calls the API at "/api" on whichever server it was loaded from (no hardcoded IP).
    // In dev mode that is the Vite server, so /api is forwarded to the backend.
    // Set VITE_DEV_API_TARGET if the backend runs elsewhere.
    proxy: {
      '/api': process.env.VITE_DEV_API_TARGET || 'http://localhost:5000',
    },
  }
})
