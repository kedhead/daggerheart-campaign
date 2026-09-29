import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Remove base path for Vercel/Netlify (use '/')
  // Only use base: '/daggerheart/' for GitHub Pages
  base: '/',
  build: {
    // Emit bundler output to /build-assets/ rather than the default /assets/.
    //
    // public/assets/ already holds dice-box's themes, its ammo wasm and the
    // character-sheet template — files copied verbatim, with stable names and
    // no content hash. Vite's own output is content-hashed and therefore safe
    // to cache forever, but while the two shared one URL prefix there was no
    // way to say so in vercel.json without also pinning the dice assets for a
    // year, so everything had to revalidate on every load. Separate prefixes
    // let each get the caching it actually wants.
    assetsDir: 'build-assets',
  },
})
