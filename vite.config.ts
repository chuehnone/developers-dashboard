import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // 載入環境變數
    const env = loadEnv(mode, process.cwd(), '');
    const jiraDomain = env.VITE_JIRA_DOMAIN || 'your-company.atlassian.net';
    const jiraTarget = `https://${jiraDomain}`;

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Proxy for Jira API
          '/api/jira': {
            target: jiraTarget,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/jira/, ''),
            configure: (proxy, _options) => {
              proxy.on('proxyReq', (proxyReq, _req, _res) => {
                // 設置必要的 headers 以繞過 Jira XSRF 檢查
                proxyReq.setHeader('X-Atlassian-Token', 'no-check');
                proxyReq.setHeader('User-Agent', 'DeveloperDashboard/1.0');
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
