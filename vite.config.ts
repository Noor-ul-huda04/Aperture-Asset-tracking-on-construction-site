import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('https://ais-dev-ot7rtvum7gckl5jiwdqz2d-817249406448.asia-east1.run.app'),
      'process.env.VITE_API_BASE_URL': JSON.stringify('https://ais-dev-ot7rtvum7gckl5jiwdqz2d-817249406448.asia-east1.run.app')
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: false,
      ws: false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
