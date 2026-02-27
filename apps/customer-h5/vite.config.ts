import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  base: mode === 'production' ? '/petlianbao-h5/' : '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5175,
    host: '0.0.0.0',
    allowedHosts: ['20401104.r22.cpolar.top', '.cpolar.top', '.loca.lt', '.ngrok.io'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
}))
