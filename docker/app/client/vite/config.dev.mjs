import { defineConfig, loadEnv } from 'vite';
import { consoleForwardPlugin } from './plugins/vite-console-forward-plugin.ts';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const backendPort = env.VITE_BACKEND_PORT || '3000';

    return {
        base: './',
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
                    target: `http://localhost:${backendPort}`,
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
    };
});
