import { app, ensureMongoConnected } from '../src/serverApp.js';

export default async function handler(req: any, res: any) {
  // Ensure Mongo connection in warm serverless context
  try {
    await ensureMongoConnected();
  } catch (err) {
    console.warn('[Vercel Handler] Mongo init warning:', err);
  }

  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, x-api-key, X-Firebase-AppCheck, x-firebase-appcheck');
    return res.status(200).end();
  }

  // Ensure request URL maintains /api prefix for Express routing when rewritten by Vercel
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }

  // Express app(req, res) does not return a Promise; wait for response to finish so Vercel does not terminate early
  return new Promise<void>((resolve) => {
    res.on('finish', () => resolve());
    res.on('close', () => resolve());
    res.on('error', (err: any) => {
      console.error('[Vercel Handler] Response stream error:', err);
      resolve();
    });

    try {
      app(req, res);
    } catch (err: any) {
      console.error('[Vercel Handler] Express invocation error:', err);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'SERVERLESS_FUNCTION_ERROR',
          message: err?.message || 'A server error occurred',
          timestamp: new Date().toISOString()
        });
      }
      resolve();
    }
  });
}


