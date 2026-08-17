import { MongoClient, Db } from 'mongodb';

/**
 * Server-side reusable MongoDB connection manager
 * Connects securely to MongoDB Atlas using process.env.MONGODB_URI
 * Optimized for Vercel Serverless Functions and long-running Node processes
 */

let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let isConnected = false;
let connectionError: string | null = null;
let lastSyncedAt: string | null = null;

export async function connectToMongoDB(): Promise<{ db: Db | null; connected: boolean; error: string | null }> {
  let rawUri = process.env.MONGODB_URI;
  
  if (!rawUri || !rawUri.trim()) {
    console.log('[MongoDB Module] MONGODB_URI not found in environment.');
    return { 
      db: null, 
      connected: false, 
      error: 'MONGODB_URI environment variable is missing or empty. Please set MONGODB_URI in Settings/Secrets.' 
    };
  }

  // Sanitize URI: remove surrounding quotes, trailing slashes, leading/trailing whitespace, and newlines
  let uri = rawUri.trim().replace(/^["']|["']$/g, '').trim();

  // Validate connection string scheme
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    const errorMsg = `Invalid scheme: The connection string "${uri.slice(0, 20)}..." does not start with "mongodb://" or "mongodb+srv://". Please verify that your MONGODB_URI secret contains the full connection string from MongoDB Atlas (e.g. mongodb+srv://username:password@cluster0.mongodb.net/dbname).`;
    connectionError = errorMsg;
    return { db: null, connected: false, error: errorMsg };
  }

  // If already connected in warm serverless execution context, reuse
  if (client && dbInstance && isConnected) {
    try {
      await dbInstance.command({ ping: 1 });
      return { db: dbInstance, connected: true, error: null };
    } catch (_) {
      console.warn('[MongoDB Module] Stale connection detected. Reconnecting...');
      try { await client.close(); } catch (e) {}
      client = null;
      dbInstance = null;
      isConnected = false;
    }
  }

  // Extract DB name from URI or fallback to aperture_asset_db
  let dbName = 'aperture_asset_db';
  try {
    const match = uri.match(/mongodb(?:\+srv)?:\/\/[^\/]+\/([^?]+)/);
    if (match && match[1]) {
      dbName = match[1];
    }
  } catch (e) {
    // default
  }

  const optionsList = [
    {
      connectTimeoutMS: 3000,
      serverSelectionTimeoutMS: 3000,
      ignoreUndefined: true,
      family: 4
    },
    {
      connectTimeoutMS: 3000,
      serverSelectionTimeoutMS: 3000,
      ignoreUndefined: true,
      tls: true,
      tlsAllowInvalidCertificates: true,
      family: 4
    }
  ];

  const connectTask = async () => {
    let lastErrMsg = '';

    for (let attempt = 0; attempt < optionsList.length; attempt++) {
      try {
        if (client) {
          try { await client.close(); } catch (_) {}
        }

        client = new MongoClient(uri, optionsList[attempt]);
        await client.connect();

        dbInstance = client.db(dbName);
        isConnected = true;
        connectionError = null;
        lastSyncedAt = new Date().toISOString();
        console.log(`[MongoDB Module] Connected to Atlas database: ${dbName}`);

        return { db: dbInstance, connected: true, error: null };
      } catch (err: any) {
        lastErrMsg = err.message || String(err);
        console.warn(`[MongoDB Module] Connection attempt ${attempt + 1} failed:`, lastErrMsg);
      }
    }

    isConnected = false;
    
    if (lastErrMsg.includes('SSL') || lastErrMsg.includes('tlsv1 alert') || lastErrMsg.includes('alert number 80')) {
      connectionError = 'SSL/TLS Handshake Error (SSL Alert 80): MongoDB Atlas rejected the connection. In MongoDB Atlas Dashboard -> Network Access -> Add IP Address and set 0.0.0.0/0 (Allow access from anywhere).';
    } else if (lastErrMsg.includes('Authentication failed') || lastErrMsg.includes('bad auth')) {
      connectionError = 'Authentication Failed: Please verify user credentials in MONGODB_URI secret.';
    } else {
      connectionError = lastErrMsg;
    }

    return { db: null, connected: false, error: connectionError };
  };

  const timeoutGuard = new Promise<{ db: Db | null; connected: boolean; error: string | null }>((resolve) => {
    setTimeout(() => {
      resolve({
        db: null,
        connected: false,
        error: 'MongoDB Atlas connection timed out (3.5s limit reached). Ensure 0.0.0.0/0 is added in Atlas Network Access.'
      });
    }, 3500);
  });

  return Promise.race([connectTask(), timeoutGuard]);
}

export function getDb(): Db | null {
  return dbInstance;
}

export function getMongoClient(): MongoClient | null {
  return client;
}

export function isMongoConnected(): boolean {
  return isConnected;
}

export function getMongoError(): string | null {
  return connectionError;
}

export function getLastSyncedAt(): string | null {
  return lastSyncedAt;
}

export function setLastSyncedAt(timestamp: string) {
  lastSyncedAt = timestamp;
}
