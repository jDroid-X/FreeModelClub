import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.{js,ts}'],
    exclude: ['tests/**/*.integration.test.*', 'tests/**/*.e2e.*', 'tests/**/*.spec.*'],
    timeout: 10000,
    reporters: ['verbose']
  }
});
