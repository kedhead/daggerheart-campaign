import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Remove base path for Vercel/Netlify (use '/')
  // Only use base: '/daggerheart/' for GitHub Pages
  base: '/',
})
