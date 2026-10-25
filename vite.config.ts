import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { pathToFileURL } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function studyCoachApiPlugin(env: Record<string, string>, devPort: number): Plugin {
  return {
    name: 'ngolab-study-coach-api',
    apply: 'serve',
    async configureServer(server) {
      // Load server code directly so extraction module URLs stay relative to server/.
      const moduleUrl = pathToFileURL(
        path.resolve(server.config.root, 'server/study-coach-app.mjs'),
      ).href;
      const { createStudyCoachApp } = await import(moduleUrl);
      const app = createStudyCoachApp({ ...process.env, ...env });
      server.httpServer?.once('close', () => app.locals.closeStudyCoach?.());
      server.middlewares.use((req, res, next) => {
        const requestPath = req.url?.split('?')[0];
        if (
          requestPath === '/api/health' ||
          requestPath === '/api/study-coach' ||
          requestPath?.startsWith('/api/study-coach/')
        ) {
          app(req, res, next);
          return;
        }
        next();
      });
      server.config.logger.info(`Study Coach API aktif bersama aplikasi di port ${devPort}.`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const membershipApiTarget = (env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const devPort = Number(env.VITE_PORT || env.PORT || 3001);
  const isHttpsTarget = membershipApiTarget.startsWith('https://');

  return {
    plugins: [
      studyCoachApiPlugin(env, devPort),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: {
          name: 'Ngolab Gami',
          short_name: 'Ngolab',
          description: 'Mobile-first mini-game hub with smooth HTML5 Canvas gameplay.',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          orientation: 'portrait',
          icons: [
            {
              src: '/icon.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
            },
            {
              src: '/icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: devPort,
      strictPort: false,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/membership-api': {
          target: membershipApiTarget,
          changeOrigin: true,
          secure: isHttpsTarget,
          rewrite: (requestPath) => requestPath.replace(/^\/membership-api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyRequest) => {
              proxyRequest.removeHeader('origin');
            });
          },
        },
        '/uploads': {
          target: membershipApiTarget,
          changeOrigin: true,
          secure: isHttpsTarget,
        },
      },
    },
  };
});
