import { defineConfig } from 'vite';
import { consoleForwardPlugin } from './plugins/vite-console-forward-plugin.ts';

/**
 * Vite configuration for testing LED screen layout in development
 *
 * This config runs a dev server but forces production mode to test
 * the actual LED screen layout that will be used on Balena.
 */
export default defineConfig({
    base: './',
    // Force production mode even in dev server
    mode: 'production',
    define: {
        'import.meta.env.PROD': true,
        'import.meta.env.DEV': false,
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
    },
    server: {
        port: 8080,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    },
    plugins: [
        consoleForwardPlugin({
            enabled: true,
            endpoint: '/api/debug/client-logs',
            levels: ['log', 'warn', 'error', 'info', 'debug']
        })
    ]
});
