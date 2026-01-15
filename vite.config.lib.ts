import path from 'node:path';
import terser from '@rollup/plugin-terser';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['lib/keymash.ts', 'lib/keymash-core.ts', 'types.ts'],
      outDir: 'dist/lib',
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        keymash: path.resolve(__dirname, 'lib/keymash.ts'),
        core: path.resolve(__dirname, 'lib/keymash-core.ts'),
      },
      name: 'keymash',
      formats: ['es'],
    },
    outDir: 'dist/lib',
    minify: false, // Let rollup-plugin-terser handle it
    rollupOptions: {
      external: [],
      output: {
        preserveModules: false,
      },
      plugins: [
        terser({
          compress: {
            dead_code: true,
            drop_debugger: true,
            passes: 3,
          },
          mangle: {
            toplevel: true,
          },
          format: {
            comments: false,
          },
        }),
      ],
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    __DEV__: 'false',
  },
});
