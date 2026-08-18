import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync } from 'fs'

export default defineConfig({
  plugins: [{
    name: 'copy-investigation-pack-data',

    closeBundle() {
      // Copy Java OOP investigation data into the final build
      copyFileSync(
        resolve(__dirname, 'java_oop_unit1.js'),
        resolve(__dirname, 'dist/java_oop_unit1.js')
      )
    }
  }],

  build: {
    rollupOptions: {
      input: {
        login: resolve(__dirname, 'index.html'),
        home: resolve(__dirname, 'home.html'),
        admin: resolve(__dirname, 'admin.html'),
        playground: resolve(__dirname, 'playground.html'),
        resetPassword: resolve(__dirname, 'reset-password.html')
      }
    }
  }
})