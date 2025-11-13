import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'public-react',
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
});
