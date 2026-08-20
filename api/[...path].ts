import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app, ensureMongoConnected } from '../src/serverApp';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Ensure MongoDB connection attempt is initiated cleanly
    await ensureMongoConnected();

    // Pass the request directly to the Express application
    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel API Handler Error]', err);
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'SERVERLESS_FUNCTION_ERROR',
        message: err?.message || String(err),
        timestamp: new Date().toISOString()
      });
    }
  }
}
