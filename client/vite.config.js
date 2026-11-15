import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development, React runs on :5173 and forwards /api calls to Express on :5000,
// so the browser sees a single site and the login cookie just works.
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': 'http://localhost:5000',
        },
    },
});
