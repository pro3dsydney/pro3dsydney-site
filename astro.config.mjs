// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Change this one line when moving to ultimate3dprinting.com.au.
const SITE = process.env.SITE_URL || 'https://pro3dsydney.com';

export default defineConfig({
  site: SITE,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  integrations: [
    sitemap({
      // Private pages stay out of Google.
      filter: page => !/\/(order|404)\/?$/.test(new URL(page).pathname),
    }),
  ],
  server: { port: 4321 },
  vite: {
    // three.js (~130 kB gzipped) is lazy-loaded only on pages that show 3D models.
    build: { chunkSizeWarningLimit: 600 },
    server: {
      // `npm run dev` talks to the local API on 8787 through the same origin.
      proxy: { '/api': 'http://localhost:8787', '/dev': 'http://localhost:8787', '/admin': 'http://localhost:8787' },
    },
  },
});
