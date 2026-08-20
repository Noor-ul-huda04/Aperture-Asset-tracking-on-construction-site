import app from '../src/serverApp.js';
import { ensureMongoConnected } from '../src/serverApp.js';

export default async function handler(req, res) {
  try {
    console.log(`[Vercel API Catch-all] Incoming request: ${req.method} ${req.url}`);

    // Ensure MongoDB is connected safely
    await ensureMongoConnected();

    // Delegate routing to Express
    return app(req, res);
  } catch (err) {
    console.error('[Vercel API Catch-all Handler Error]', err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'SERVERLESS_FUNCTION_ERROR',
        details: err?.message || String(err),
        timestamp: new Date().toISOString()
      });
    }
  }
}
