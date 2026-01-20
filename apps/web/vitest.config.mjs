import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['src/test/integration/**/*.test.ts', 'node_modules/**'],
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 30000, // 30s for API calls
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './src'),
    },
  },
});
