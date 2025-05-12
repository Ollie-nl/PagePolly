import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  server: {
    port: 5175
  },
  build: {
    outDir: 'dist',
    target: 'es2015'
  }
});