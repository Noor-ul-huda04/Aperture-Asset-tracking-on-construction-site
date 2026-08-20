import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app, initMongoDB } from '../src/serverApp';

let initialized = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!initialized) {
    try {
      await initMongoDB();
    } catch (err) {
      console.error('[Vercel Serverless] Error initializing MongoDB:', err);
    }
    initialized = true;
  }
  return app(req, res);
}
