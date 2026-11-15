import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5190, strictPort: true },
  test: { include: ['tests/**/*.test.ts'] },
} as never);
