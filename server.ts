import express from 'express';
import path from 'path';
import { app, initMongoDB, isMongoConnected, ensureMongoConnected } from './src/serverApp';

export { app, ensureMongoConnected };
export default app;

async function startServer() {
  try {
    // Initialize MongoDB before starting the application
    await initMongoDB();

    const isProduction =
      process.env.NODE_ENV === 'production' ||
      process.env.VERCEL === '1';

    if (!isProduction) {
      console.log('[Aperture Server] Starting Vite in middleware mode...');

      const { createServer: createViteServer } = await import('vite');

      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
          ws: false,
          watch: null,
        },
        appType: 'spa',
      });

      // Intercept /@vite/client to serve a clean, WebSocket-free HMR client
      app.get('/@vite/client', (_req, res) => {
        res.type('application/javascript');
        res.send(`
          console.log('[Vite Client] Clean preview mode active (WebSocket disabled).');
          const sheetsMap = new Map();

          export function updateStyle(id, content) {
            let style = sheetsMap.get(id);
            if (!style) {
              style = document.createElement('style');
              style.setAttribute('type', 'text/css');
              style.setAttribute('data-vite-dev-id', id);
              style.textContent = content;
              document.head.appendChild(style);
              sheetsMap.set(id, style);
            } else {
              style.textContent = content;
            }
          }

          export function removeStyle(id) {
            const style = sheetsMap.get(id);
            if (style) {
              document.head.removeChild(style);
              sheetsMap.delete(id);
            }
          }

          export function injectQuery(url, queryToInject) {
            if (url[0] !== '.' && url[0] !== '/') {
              return url;
            }
            if (url.includes('?')) {
              const [pathStr, query] = url.split('?');
              return \`\${pathStr}?\${queryToInject}&\${query}\`;
            }
            return \`\${url}?\${queryToInject}\`;
          }

          export function createHotContext(ownerPath) {
            return {
              accept() {},
              acceptExports() {},
              dispose() {},
              prune() {},
              decline() {},
              invalidate() {},
              on() {},
              off() {},
              send() {},
              data: {}
            };
          }

          export class ErrorOverlay extends HTMLElement {
            constructor() {
              super();
            }
          }
          if (typeof customElements !== 'undefined' && !customElements.get('vite-error-overlay')) {
            customElements.define('vite-error-overlay', ErrorOverlay);
          }
        `);
      });

      app.use(vite.middlewares as any);

      console.log(
        '[Aperture Server] Vite middleware loaded with HMR disabled.'
      );
    } else {
      const distPath = path.join(process.cwd(), 'dist');

      console.log(
        `[Aperture Server] Serving production frontend from ${distPath}`
      );

      app.use(express.static(distPath) as any);

      // SPA fallback
      app.get('*all', (req: any, res: any) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    const PORT = Number(process.env.PORT) || 3000;

    app.listen(PORT, '0.0.0.0', () => {
      console.log(
        `[Aperture Server] Operating on http://0.0.0.0:${PORT}`
      );

      console.log(
        `[Aperture Server] Environment: ${
          isProduction ? 'production' : 'development'
        }`
      );

      console.log(
        `[Aperture Server] MongoDB connected: ${isMongoConnected()}`
      );
    });
  } catch (error) {
    console.error(
      '[Aperture Server] Failed to start server:',
      error
    );

    process.exit(1);
  }
}

// Start standalone server unless running in Vercel or cloud serverless mode
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.NOW_REGION ||
  process.env.AWS_LAMBDA_FUNCTION_NAME
);

if (!isServerless) {
  startServer().catch((err) => {
    console.error(
      '[Aperture Server] Unhandled startup error:',
      err
    );
  });
}
