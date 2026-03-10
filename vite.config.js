import { defineConfig } from 'vite';

export default defineConfig({
  base: '/CrazyCats/',
  server: {
    port: 3001,
    open: false
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
