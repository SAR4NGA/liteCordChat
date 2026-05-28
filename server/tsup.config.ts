import { defineConfig } from 'tsup';
import path from 'path';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  // Bundle @shared/* inline so the output is self-contained.
  // Without this alias, the compiled JS retains bare `@shared/index` imports
  // that Node cannot resolve at runtime (the alias only exists in TypeScript).
  esbuildOptions(options) {
    options.alias = {
      '@shared': path.resolve(__dirname, '../shared'),
    };
  },
});
