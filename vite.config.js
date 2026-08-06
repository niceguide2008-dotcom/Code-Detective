import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

export default defineConfig({
  plugins: [{
    name: 'copy-investigation-pack-data',
    closeBundle() {
      copyFileSync(resolve(__dirname, 'java_oop_unit1.js'), resolve(__dirname, 'dist/java_oop_unit1.js'))

      const apkSource = resolve(__dirname, 'android/app/release/app-release.apk')
      const apkTarget = resolve(__dirname, 'dist/android/app/release/app-release.apk')
      mkdirSync(resolve(__dirname, 'dist/android/app/release'), { recursive: true })
      copyFileSync(apkSource, apkTarget)
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
