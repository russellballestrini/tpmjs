import path from 'node:path';
import { glob } from 'glob';
import { defineConfig } from 'tsup';

/**
 * Auto-discover all component entry points
 * Looks for src/ComponentName/ComponentName.tsx files where the folder name matches the file name
 */
const allFiles = glob.sync('src/**/[A-Z]*.{ts,tsx}', {
  ignore: [
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.stories.ts',
    '**/types.ts',
    '**/tokens.ts',
    '**/variants.ts',
    '**/index.ts',
    'src/test-setup.ts',
    'src/tokens/**',
    'src/system/**',
  ],
});

// Filter to only include files where the folder name matches the file name
// e.g., src/Button/Button.tsx is included, but src/Button/helpers.ts is not
const entries = allFiles.filter((file) => {
  const dir = path.dirname(file);
  const folderName = path.basename(dir);
  const fileName = path.basename(file).replace(/\.(ts|tsx)$/, '');
  return folderName === fileName;
});

// Manually add RadioGroup which doesn't match the folder/file naming convention
entries.push('src/Radio/RadioGroup.tsx');

// Manually add system hooks
entries.push('src/system/hooks/useScrollReveal.ts');
entries.push('src/system/hooks/useCountUp.ts');
entries.push('src/system/hooks/useParallax.ts');

export default defineConfig({
  entry: entries,
  format: ['esm'],
  dts: {
    // Reduce memory usage in CI by disabling concurrent workers
    // This prevents "JS heap out of memory" errors when building many components
    compilerOptions: {
      composite: false,
    },
  },
  clean: true,
  treeshake: false, // Disable treeshaking to preserve 'use client'
  splitting: false,
  external: ['react', 'react-dom'],
  banner: {
    js: '"use client";',
  },
  esbuildOptions(options) {
    options.jsx = 'automatic';
    // Try to preserve directives
    options.legalComments = 'inline';
  },
  // Reduce bundle size by minifying in production
  minify: false, // Disable minification to preserve directives
});
