import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: 'https://pagepolly-server-u0ndvd-e75ef-fb9511.mgx.dev',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    target: 'es2015'
  }
});