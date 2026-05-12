import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [preact()],
  root: path.resolve(__dirname, 'src/frontend'),
  envDir: path.resolve(__dirname),
  resolve: {
    alias: {
      // Allow shadcn/ui and Radix UI (which expect React) to work with Preact
      'react':            'preact/compat',
      'react-dom':        'preact/compat',
      'react-dom/client': 'preact/compat/client',
      'react/jsx-runtime': 'preact/jsx-runtime',
      // Absolute import alias for UI components
      '@': path.resolve(__dirname, 'src/frontend'),
    },
  },
  css: {
    postcss: path.resolve(__dirname, 'postcss.config.cjs'),
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks: {
          maplibre:  ['maplibre-gl'],
          'ui-radix': [
            // Will grow as we add shadcn components; listed here for predictable chunking
          ],
        },
      },
    },
  },
  server: {
    port: process.env.PORT || 3000,
  },
});
