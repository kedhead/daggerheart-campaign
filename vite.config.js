import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { rename } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))

/**
 * The mobile build emits mobile.html because that's the entry filename. The
 * Expo shell wants to load a bare origin, so publish it as index.html.
 */
function emitAsIndexHtml(outDir) {
  return {
    name: 'lorelich-mobile-index',
    apply: 'build',
    async closeBundle() {
      await rename(resolve(here, outDir, 'mobile.html'), resolve(here, outDir, 'index.html'))
    },
  }
}

// Two targets out of one source tree:
//
//   npm run build         -> dist/        the full web app, unchanged
//   npm run build:mobile  -> dist-mobile/ the player-only app the Expo shell loads
//
// The mobile target differs in exactly two ways, both enforced here rather
// than at runtime:
//
//  1. Entry is mobile.html -> src/mobile.jsx -> MobileApp, which never imports
//     the router, sidebar, GM views, or any non-Daggerheart data module. That
//     is what keeps Star Wars D6 content (Lucasfilm IP) out of a binary that
//     gets redistributed through app stores.
//
//  2. hopeFear.js is aliased to an empty stub. The Hope & Fear expansion is
//     commercial content, not SRD, and seven data modules import it statically.
//     Aliasing at resolve time means the real module is never in the graph, so
//     the text isn't in the bundle for anyone to extract — a runtime source
//     filter would still ship it. Core SRD content is CC BY 4.0 and stays.
//
// The web build reads none of this: no aliases, same entry, same outDir.
export default defineConfig(({ mode }) => {
  const isMobile = mode === 'mobile'

  return {
    plugins: [react(), ...(isMobile ? [emitAsIndexHtml('dist-mobile')] : [])],
    // Remove base path for Vercel/Netlify (use '/')
    // Only use base: '/daggerheart/' for GitHub Pages
    base: '/',
    ...(isMobile && {
      resolve: {
        alias: [
          {
            find: /^(.*)\/hopeFear\.js$/,
            replacement: resolve(here, 'src/data/hopeFear.empty.js'),
          },
          {
            find: /^(.*)\/data\/hopeFear$/,
            replacement: resolve(here, 'src/data/hopeFear.empty.js'),
          },
        ],
      },
      build: {
        outDir: 'dist-mobile',
        rollupOptions: { input: resolve(here, 'mobile.html') },
      },
    }),
  }
})
