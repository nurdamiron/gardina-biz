import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'images/logo-header.png',
        'favicon.png',
        'favicon-16x16.png',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'sw-push.js',
      ],
      injectRegister: 'auto',
      manifest: {
        name: 'Gardina — перде бизнесі үшін жүйе',
        short_name: 'Gardina',
        description: 'Перде салондары мен ательелерге арналған жүйе: клиенттер, өлшем, ұсыныс, өндіріс және төлем бір жерде.',
        theme_color: '#1b5e45',
        background_color: '#f1f6f3',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg}'],
        importScripts: ['/sw-push.js'],
        runtimeCaching: [
          {
            urlPattern: /\/api\//i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.(jpg|jpeg|png|gif|webp|svg)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: { enabled: true },
    }),
  ],

  build: {
    // Raise warning threshold to 1MB
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — tiny, loads first
          'react-vendor': ['react', 'react-dom'],
          // Router
          'router': ['react-router-dom'],
          // State management
          'store': ['@reduxjs/toolkit', 'react-redux'],
          // Forms
          'forms': ['react-hook-form'],
          // Landing animations — only loaded when visiting "/"
          'motion': ['framer-motion'],
          // HTTP
          'http': ['axios'],
          // Icons — split from app code so they can be cached separately
          'icons': ['@hugeicons/react', '@hugeicons/core-free-icons'],
        },
      },
    },
  },
})
