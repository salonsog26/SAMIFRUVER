import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/tests/setup.js',
        css: false,
        include: ['src/**/*.test.{js,jsx}'],
        coverage: {
            provider: 'v8',
            include: ['src/utils/**', 'src/context/**', 'src/routes/**', 'src/components/**', 'src/pages/**'],
            reporter: ['text', 'html']
        }
    }
});
