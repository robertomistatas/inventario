import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/inventario/',
  build: {
    outDir: 'dist'
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  server: {
    port: 3000
  }
});
