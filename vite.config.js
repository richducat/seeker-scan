import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
// Import node polyfills plugin to provide built‑in Node modules (Buffer, process, crypto, etc.)
// in the browser environment. Without these polyfills, libraries such as
// @solana/web3.js and wallet adapters will fail at runtime when bundled with Vite.
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// Vite configuration for the SeekerScan dApp. This config enables React
// support and adds the PWA plugin which will generate a service worker and
// manifest for the application. When building for production the service
// worker will automatically precache the static assets and enable offline
// functionality. The manifest defined here describes your dApp to Android
// clients when published as a Progressive Web App.

export default defineConfig({
  plugins: [
    react(),
    // Enable Node.js core module polyfills. The plugin must come before any
    // other plugins that rely on Node built‑ins (such as wallet adapters).
    nodePolyfills(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SeekerScan',
        short_name: 'SeekerScan',
        description: 'A dashboard for monitoring airdrop assets and earning rewards.',
        theme_color: '#0A0B0D',
        background_color: '#0A0B0D',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  // Define global variables expected by some node‑based libraries. Without
  // this, modules that reference `global` may throw at runtime. Set `global`
  // to `globalThis` which is available in all modern browsers.
  define: {
    global: 'globalThis'
  },
  // Provide aliases for node built‑in modules. Here we alias `buffer` to
  // the `buffer` package installed via polyfill plugin. This helps Vite
  // resolve Buffer usage in @solana/web3.js and other dependencies.
  resolve: {
    alias: {
      buffer: 'buffer/'
    }
  },
  // Include Buffer polyfill during dependency optimization so that it is
  // available when dependencies are pre-bundled.
  optimizeDeps: {
    include: ['buffer']
  },
  server: {
    port: 5173,
    open: true
  }
});