import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const root = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  root: path.resolve(root, 'src'),
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy: { '/api': 'http://127.0.0.1:3000' } },
  build: { outDir: path.resolve(root, 'dist'), emptyOutDir: true }
});
