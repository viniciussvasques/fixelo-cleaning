/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        exclude: ['**/node_modules/**', '**/e2e/**', '**/*.spec.ts'],
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        coverage: {
            reporter: ['text', 'json', 'html'],
            provider: 'v8',
            include: ['src/lib/**', 'src/app/actions/**', 'src/app/api/**'],
            exclude: ['src/test/**', '**/*.d.ts', '**/*.test.ts', '**/page.tsx', '**/layout.tsx', '**/e2e/**'],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80
            }
        },
    },
})
