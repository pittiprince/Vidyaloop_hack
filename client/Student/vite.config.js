import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      includeAssets: ['favicon.ico', 'logo.png', ],

      manifest: {
        name: 'Bridge',
        short_name: 'Bridge',
        description: 'An online-cum-offline platform to learn',
        theme_color: '#a101a1',
        start_url: './',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,mp4,webm}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'script' || request.destination === 'style',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache',
            }
          },
          {
            // Cache Cloudinary PDFs
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*\.pdf$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-pdf-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache for videos
            urlPattern: ({ request }) => request.destination === 'video' || 
                        /\.(mp4|webm|ogg)$/.test(request.url),
            handler: 'CacheFirst',
            options: {
              cacheName: 'video-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 14, // 14 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              rangeRequests: true, // Important for video streaming
            },
          },
          {
            // Cache for Cloudinary videos
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*\.(mp4|webm|ogg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-video-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 14, // 14 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              rangeRequests: true,
            },
          },
          {
            // Cache for audio files
            urlPattern: ({ request }) => request.destination === 'audio' || 
                        /\.(mp3|wav|ogg)$/.test(request.url),
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache for API calls
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Fallback cache for other resources
            urlPattern: /.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'fallback-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          }
        ],
        
      },

      devOptions: {
        enabled: true,
        suppressWarnings: true,
        type: 'module',
      },
    })
  ]
})