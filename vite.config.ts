import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // 載入環境變數
    const env = loadEnv(mode, process.cwd(), '');
    const jiraDomain = env.VITE_JIRA_DOMAIN || 'your-company.atlassian.net';
    const jiraTarget = `https://${jiraDomain}`;

    console.log('\n🔧 [Vite Config] Loading environment variables:');
    console.log('  Mode:', mode);
    console.log('  VITE_JIRA_DOMAIN:', jiraDomain);
    console.log('  Proxy Target:', jiraTarget);
    console.log('');

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
              proxy.on('error', (err, _req, _res) => {
                console.log('[Jira Proxy] ❌ Error:', err.message);
              });
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                const originalUrl = req.url || '';
                const rewrittenPath = originalUrl.replace(/^\/api\/jira/, '');
                const finalUrl = `${jiraTarget}${rewrittenPath}`;

                // 🔑 關鍵 1: 設置 X-Atlassian-Token header
                proxyReq.setHeader('X-Atlassian-Token', 'no-check');

                // 🔑 關鍵 2: 設置自定義 User-Agent (workaround for browser-based requests)
                proxyReq.setHeader('User-Agent', 'DeveloperDashboard/1.0');

                console.log('[Jira Proxy] 📤 Request:');
                console.log('  Method:', req.method);
                console.log('  Original URL:', originalUrl);
                console.log('  Rewritten Path:', rewrittenPath);
                console.log('  Final URL:', finalUrl);
                console.log('  Target Domain:', jiraTarget);
                console.log('  Headers Set:');
                console.log('    - X-Atlassian-Token: no-check');
                console.log('    - User-Agent: DeveloperDashboard/1.0');
              });
              proxy.on('proxyRes', (proxyRes, req, _res) => {
                console.log('[Jira Proxy] 📥 Response:');
                console.log('  Status:', proxyRes.statusCode);
                console.log('  URL:', req.url);
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
