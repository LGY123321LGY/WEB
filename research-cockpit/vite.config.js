import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const zoteroProxy = {
  '/zotero-api': {
    target: 'http://127.0.0.1:23119',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/zotero-api/, ''),
  },
}

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: { proxy: zoteroProxy },
  preview: { proxy: zoteroProxy },
})
