import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/archidekt': {
        target: 'https://archidekt.com/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/archidekt/, ''),
      },
      '/api/mtgtop8': {
        target: 'https://www.mtgtop8.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mtgtop8/, ''),
      },
      '/api/moxfield': {
        target: 'https://api2.moxfield.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/moxfield/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader(
              'User-Agent',
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            )
            proxyReq.setHeader('Accept', 'application/json')
          })
        },
      },
    }
  }
})
