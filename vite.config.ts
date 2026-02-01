import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/atlas_comparison_tree_web/',
  server: {
    port: 3000,
    open: true
  }
})
