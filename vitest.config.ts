import { defineConfig } from 'vitest/config';
import { coverageConfigurator } from 'vitest/config';

export default defineConfig({
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  modulePathIgnorePatterns: ['lib', 'dist'],
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: ['**/*.test.ts', '**/node_modules/**'],
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
});
