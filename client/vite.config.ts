import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared')
    }
  }
})