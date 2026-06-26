import { defineConfig } from 'vitest/config'

// Run tests from `src/` only — never the emitted `dist/` copies (tsc mirrors the
// suite into dist, which would otherwise double-run every case).
export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['dist/**', 'node_modules/**'],
  },
})
