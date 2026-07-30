import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@monaco-editor')) return 'vendor-monaco';
          if (id.includes('react-router-dom')) return 'vendor-router';
          if (id.includes('@tanstack')) return 'vendor-query';
          if (id.includes('socket.io-client') || id.includes('engine.io-client')) return 'vendor-socket';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('axios')) return 'vendor-http';
          if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
          return 'vendor';
        },
      },
    },
  },
})
