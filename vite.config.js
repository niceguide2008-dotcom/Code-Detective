import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync } from 'fs'

export default defineConfig({
  plugins: [{
    name: 'copy-investigation-pack-data',
    closeBundle() {
      copyFileSync(resolve(__dirname, 'java_oop_unit1.js'), resolve(__dirname, 'dist/java_oop_unit1.js'))
    }
  }],
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
