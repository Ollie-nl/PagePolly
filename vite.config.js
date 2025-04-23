// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    base: '/', // Use absolute paths for production
    server: {
      port: 5174,
      strictPort: false,
    },
    define: {
      // Ensure environment variables are properly exposed to the client
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      // Prevent bundling errors when environment variables are undefined
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'MISSING_ENVIRONMENT_VARIABLES') return;
          warn(warning);
        },
      },
    },
  };
});