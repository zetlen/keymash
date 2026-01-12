import path from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['lib/keymash.ts', 'types.ts'],
      outDir: 'dist/lib',
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'lib/keymash.ts'),
      name: 'keymash',
      formats: ['es'],
      fileName: 'keymash',
    },
    outDir: 'dist/lib',
    minify: 'terser',
    terserOptions: {
      compress: {
        pure_funcs: ['console.warn'],
        drop_console: false,
        passes: 2,
      },
      mangle: true,
    },
    rollupOptions: {
      external: [],
      output: {
        preserveModules: false,
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
