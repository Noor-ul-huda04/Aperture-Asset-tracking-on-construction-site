import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app, initMongoDB } from '../src/serverApp';

let initialized = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!initialized) {
      try {
        await initMongoDB();
      } catch (err) {
        console.warn('[Vercel Serverless] Non-fatal MongoDB initialization warning:', err);
      }
      initialized = true;
    }
    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel Serverless Handler Error]', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'SERVERLESS_FUNCTION_ERROR',
        message: err?.message || String(err),
        timestamp: new Date().toISOString()
      });
    }
  }
}
