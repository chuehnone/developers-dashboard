import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Proxy for Jira API
          '/api/jira': {
            target: process.env.VITE_JIRA_DOMAIN
              ? `https://${process.env.VITE_JIRA_DOMAIN}`
              : 'https://your-company.atlassian.net', // 替換成你的 Jira domain
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/jira/, ''),
            configure: (proxy, _options) => {
              proxy.on('error', (err, _req, _res) => {
                console.log('[Jira Proxy] Error:', err);
              });
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log('[Jira Proxy] Request:', req.method, req.url);
              });
            },
          },
          // GitHub API 不需要 proxy，因為支援 CORS
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
