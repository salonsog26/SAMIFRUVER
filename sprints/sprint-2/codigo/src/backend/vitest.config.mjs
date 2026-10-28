import { defineConfig } from 'vitest/config';
export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/**/*.test.js'],
        coverage: { provider: 'v8', include: ['app.js', 'controllers/**', 'lib/**', 'routes/**'], reporter: ['text', 'html'] }
    }
});
