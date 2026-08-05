import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        login: resolve(__dirname, 'index.html'),
        home: resolve(__dirname, 'home.html'),
        admin: resolve(__dirname, 'admin.html')
      }
    }
  }
})
