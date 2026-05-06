import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // 🔥 this exposes to LAN
    port: 5000,       // 🔥 this is the port you want to use
  }
})
