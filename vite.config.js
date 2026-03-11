import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/CrazyCats/' : '/',
  server: {
    port: 3001,
    open: false
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
}));
