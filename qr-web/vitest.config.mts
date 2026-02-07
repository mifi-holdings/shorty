import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: false,
        include: ['src/**/*.test.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/lib/**/*.ts', 'src/types/**/*.ts'],
            exclude: ['src/**/*.test.{ts,tsx}'],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80,
            },
        },
    },
    resolve: {
        alias: { '@': path.resolve(__dirname, './src') },
    },
});
