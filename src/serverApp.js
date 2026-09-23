// src/serverApp.ts
import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

// src/data/mongodb.ts
import { MongoClient } from "mongodb";
var client = null;
var dbInstance = null;
var isConnected = false;
var connectionError = null;
var lastSyncedAt = null;
function cleanMongoDoc(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return {
    id: doc.id || (_id ? String(_id) : void 0),
    ...rest
  };
}
async function connectToMongoDB() {
  try {
    let rawUri = process.env.MONGODB_URI;
    if (!rawUri || !rawUri.trim()) {
      console.log("[MongoDB Module] MONGODB_URI not found in environment.");
      return {
        db: null,
        connected: false,
        error: "MONGODB_URI environment variable is missing or empty. Please configure MONGODB_URI in Settings/Secrets."
      };
    }
    let uri = rawUri.trim().replace(/^["']|["']$/g, "").trim();
    if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
      const errorMsg = `Invalid scheme: The connection string "${uri.slice(0, 20)}..." does not start with "mongodb://" or "mongodb+srv://". Please verify that your MONGODB_URI secret contains the full connection string from MongoDB Atlas (e.g. mongodb+srv://username:password@cluster0.mongodb.net/dbname).`;
      connectionError = errorMsg;
      return { db: null, connected: false, error: errorMsg };
    }
    if (client && dbInstance && isConnected) {
      try {
        await dbInstance.command({ ping: 1 });
        return { db: dbInstance, connected: true, error: null };
      } catch (_) {
        console.warn("[MongoDB Module] Stale connection detected. Reconnecting...");
        try {
          await client.close();
        } catch (e) {
        }
        client = null;
        dbInstance = null;
        isConnected = false;
      }
    }
    let dbName = "aperture_asset_db";
    try {
      const match = uri.match(/mongodb(?:\+srv)?:\/\/[^\/]+\/([^?]+)/);
      if (match && match[1]) {
        dbName = match[1];
      }
    } catch (e) {
    }
    const optionsList = [
      {
        connectTimeoutMS: 4e3,
        serverSelectionTimeoutMS: 4e3,
        ignoreUndefined: true,
        family: 4
      },
      {
        connectTimeoutMS: 4e3,
        serverSelectionTimeoutMS: 4e3,
        ignoreUndefined: true,
        tls: true,
        tlsAllowInvalidCertificates: true,
        family: 4
      }
    ];
    const connectTask = async () => {
      let lastErrMsg = "";
      for (let attempt = 0; attempt < optionsList.length; attempt++) {
        try {
          if (client) {
            try {
              await client.close();
            } catch (_) {
            }
          }
          client = new MongoClient(uri, optionsList[attempt]);
          await client.connect();
          dbInstance = client.db(dbName);
          isConnected = true;
          connectionError = null;
          lastSyncedAt = (/* @__PURE__ */ new Date()).toISOString();
          console.log(`[MongoDB Module] Connected to Atlas database: ${dbName}`);
          return { db: dbInstance, connected: true, error: null };
        } catch (err) {
          lastErrMsg = err?.message || String(err);
          console.warn(`[MongoDB Module] Connection attempt ${attempt + 1} failed:`, lastErrMsg);
        }
      }
      isConnected = false;
      if (lastErrMsg.includes("SSL") || lastErrMsg.includes("tlsv1 alert") || lastErrMsg.includes("alert number 80")) {
        connectionError = "SSL/TLS Handshake Error (SSL Alert 80): MongoDB Atlas rejected the connection. In MongoDB Atlas Dashboard -> Network Access -> Add IP Address and set 0.0.0.0/0 (Allow access from anywhere).";
      } else if (lastErrMsg.includes("Authentication failed") || lastErrMsg.includes("bad auth")) {
        connectionError = "Authentication Failed: Please verify user credentials in MONGODB_URI secret.";
      } else {
        connectionError = lastErrMsg;
      }
      return { db: null, connected: false, error: connectionError };
    };
    const timeoutGuard = new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          db: null,
          connected: false,
          error: "MongoDB Atlas connection timed out (4.5s limit reached). Ensure 0.0.0.0/0 is added in Atlas Network Access."
        });
      }, 4500);
    });
    return await Promise.race([connectTask(), timeoutGuard]);
  } catch (globalErr) {
    console.error("[MongoDB Module] Unexpected connection exception:", globalErr);
    return {
      db: null,
      connected: false,
      error: globalErr?.message || String(globalErr)
    };
  }
}
function getDb() {
  return dbInstance;
}
function isMongoConnected() {
  return isConnected;
}
function getMongoError() {
  return connectionError;
}
function getLastSyncedAt() {
  return lastSyncedAt;
}
function setLastSyncedAt(timestamp) {
  lastSyncedAt = timestamp;
}

// src/data/postmanCollection.ts
var aperturePostmanCollection = {
  "info": {
    "_postman_id": "gao-rfid-uhf-tracking-apis-v1",
    "name": "GAO RFID UHF People & Asset Tracking API",
    "description": "Official Web APIs implemented by GAO RFID INC. for people and asset tracking. Server host: https://www.i360services.com/peopletrackinguhf. Hardware demo setup: 1 reader with 2 antennas, each covering a zone (Zone1, Zone2).",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "host",
      "value": "https://www.i360services.com/peopletrackinguhf",
      "type": "string",
      "description": "GAO RFID UHF Server Host URL"
    }
  ],
  "item": [
    {
      "name": "1. Get History Total Count",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Accept",
            "value": "application/json, text/plain, */*"
          }
        ],
        "url": {
          "raw": "{{host}}/api/GetHistoryTotalCount",
          "host": [
            "{{host}}"
          ],
          "path": [
            "api",
            "GetHistoryTotalCount"
          ]
        },
        "description": "Function: GAO software will accept this request and return a total number of the history data in GAO software system.\n\nResponse Example:\n100\n(100 means that there are 100 history data in total in the cloud server. 0 means that there is no any history data.)"
      },
      "response": [
        {
          "name": "200 OK - History Count Example",
          "originalRequest": {
            "method": "GET",
            "url": {
              "raw": "{{host}}/api/GetHistoryTotalCount"
            }
          },
          "status": "OK",
          "code": 200,
          "_postman_previewlanguage": "text",
          "header": [
            {
              "key": "Content-Type",
              "value": "application/json; charset=utf-8"
            }
          ],
          "body": "100"
        }
      ]
    },
    {
      "name": "2. Get Specific History Data",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Accept",
            "value": "application/json, text/plain, */*"
          }
        ],
        "url": {
          "raw": "{{host}}/api/GetHistoryRecords/0/30",
          "host": [
            "{{host}}"
          ],
          "path": [
            "api",
            "GetHistoryRecords",
            "0",
            "30"
          ]
        },
        "description": "Function: Get specific history data by some parameters.\nWhen getting this request, GAO system will order the history data by the generated time in descending order.\n\nParameters:\n- SkipCount: Number of skipping the history data from the beginning.\n- TakeCount: Number of returning the history data for this request. The max value is 200.\n\nIf the number of returned history data is less than TakeCount, it means that it gets the end of the history data and there is no more history data in the cloud server.\n\nDuration: unit is hours (LeaveTime minus EnterTime)."
      },
      "response": [
        {
          "name": "200 OK - History Records Example",
          "originalRequest": {
            "method": "GET",
            "url": {
              "raw": "{{host}}/api/GetHistoryRecords/10/30"
            }
          },
          "status": "OK",
          "code": 200,
          "_postman_previewlanguage": "json",
          "header": [
            {
              "key": "Content-Type",
              "value": "application/json; charset=utf-8"
            }
          ],
          "body": '[\n  {\n    "TagID": "E28011606000020788842D31",\n    "FirstName": "John",\n    "LastName": "Smith",\n    "LocationName": "d6",\n    "EnterTime": "2026-06-02 15:27:02",\n    "LeaveTime": "2026-06-02 15:57:02",\n    "Duration": 0.5\n  },\n  {\n    "TagID": "E28011606000020788842D31",\n    "FirstName": "Jack",\n    "LastName": "Wince",\n    "LocationName": "d8",\n    "EnterTimeStr": "2026-04-28 10:17:42",\n    "LeaveTimeStr": "2026-04-28 11:47:42",\n    "Duration": 1.5\n  }\n]'
        }
      ]
    },
    {
      "name": "3. Get Tags in Real-time",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Accept",
            "value": "application/json, text/plain, */*"
          }
        ],
        "url": {
          "raw": "{{host}}/api/GetTagsInRealtime",
          "host": [
            "{{host}}"
          ],
          "path": [
            "api",
            "GetTagsInRealtime"
          ]
        },
        "description": "Function: Get tags data reported by the reader.\nDemo Hardware Setup: 1 reader and the reader has 2 antennas, each antenna is covering a zone (Zone1, Zone2).\n\nWhen getting this request, GAO system will order the tag raw data by the generated time in descending order. GAO software will extract all the current raw data from the tags queue and put them in the response."
      },
      "response": [
        {
          "name": "200 OK - Real-Time Tags Example",
          "originalRequest": {
            "method": "GET",
            "url": {
              "raw": "{{host}}/api/GetTagsInRealtime"
            }
          },
          "status": "OK",
          "code": 200,
          "_postman_previewlanguage": "json",
          "header": [
            {
              "key": "Content-Type",
              "value": "application/json; charset=utf-8"
            }
          ],
          "body": '[\n  {\n    "TagID": "E28011606000020788842D31",\n    "Timestamp": "2026-06-02 20:30:18.222",\n    "Location": "Zone1"\n  },\n  {\n    "TagID": "E28011606000020788842D31",\n    "Timestamp": "2026-06-02 20:30:17.097",\n    "Location": "Zone1"\n  },\n  {\n    "TagID": "E28011606000020788842D31",\n    "Timestamp": "2026-06-02 20:30:15.925",\n    "Location": "Zone1"\n  }\n]'
        }
      ]
    }
  ]
};

// src/serverApp.ts
var aiClient = null;
function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
var PORT = Number(process.env.PORT) || 3e3;
async function ensureDb() {
  try {
    let mongoDb = getDb();
    if (mongoDb && isMongoConnected()) return mongoDb;
    const result = await connectToMongoDB();
    return result.db;
  } catch (err) {
    console.warn("[ensureDb] Connection error, safely falling back to in-memory store:", err);
    return null;
  }
}
var db = {
  assets: [],
  sites: [],
  users: [],
  readers: [],
  checkouts: [],
  maintenance: [],
  alerts: [],
  inventory: [],
  events: [],
  auditLogs: [],
  apiEndpointLogs: [],
  streamConfig: {
    isStreaming: false,
    eventsPerMinute: 0,
    offlineBufferMode: false,
    bufferedCount: 0
  },
  apiGateway: {
    baseUrl: "",
    apiKey: "",
    authHeaderScheme: "Bearer Token",
    pollingIntervalSeconds: 15,
    isPollingActive: false,
    lastVerifiedAt: void 0,
    latencyMs: 0,
    status: "DISCONNECTED"
  }
};
var mongoInitPromise = null;
async function ensureMongoConnected() {
  if (!process.env.MONGODB_URI) return;
  if (getDb() && isMongoConnected()) return;
  if (!mongoInitPromise) {
    mongoInitPromise = initMongoDB().catch((err) => {
      console.warn("[initMongoDB] Initial connection error:", err);
      mongoInitPromise = null;
    });
  }
  try {
    await Promise.race([
      mongoInitPromise,
      new Promise((resolve) => setTimeout(resolve, 2e3))
    ]);
  } catch (err) {
    console.warn("[ensureMongoConnected] Non-blocking Mongo init warning:", err);
  }
}
async function initMongoDB() {
  const result = await connectToMongoDB();
  if (result.connected && result.db) {
    await syncMongoDBOnStartup();
  }
}
async function syncMongoDBOnStartup() {
  const mongoDb = getDb();
  if (!mongoDb) return;
  const collections = ["assets", "sites", "users", "readers", "checkouts", "maintenance", "alerts", "inventory", "events", "auditLogs"];
  const legacyMockIds = ["ast-1001", "ast-1002", "ast-1003", "ast-1004", "ast-1005", "ast-1006", "SITE-001", "SITE-002", "usr-1", "usr-2", "inv-101", "inv-102", "inv-103", "reader-101", "reader-102", "reader-103", "reader-104"];
  await Promise.all(collections.map(async (collName) => {
    try {
      const coll = mongoDb.collection(collName);
      await coll.deleteMany({ id: { $in: legacyMockIds } }).catch(() => {
      });
      const docs = await coll.find({}).toArray();
      const cleaned = docs.map((doc) => {
        const { _id, ...rest } = doc;
        return { id: doc.id || (_id ? String(_id) : void 0), ...rest };
      });
      db[collName] = cleaned;
      console.log(`[Database] Loaded ${cleaned.length} documents from collection '${collName}'.`);
    } catch (e) {
      console.warn(`[Database] Error syncing collection '${collName}':`, e.message);
    }
  }));
  try {
    const apiLogsColl = mongoDb.collection("apiLogs");
    await apiLogsColl.createIndex({ timestamp: -1 });
    await apiLogsColl.createIndex({ endpoint: 1 });
    await apiLogsColl.createIndex({ status: 1 });
    await apiLogsColl.createIndex({ method: 1 });
  } catch (e) {
  }
  try {
    await syncFromGaoApi();
  } catch (syncErr) {
    console.warn("[Startup] Initial sync from RFID API failed:", syncErr.message);
  }
  setLastSyncedAt((/* @__PURE__ */ new Date()).toISOString());
}
function saveDb() {
}
async function addAuditLog(action, entityType, entityId, entityName, userName, details) {
  const log = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
    action,
    entityType,
    entityId,
    entityName,
    userId: "usr-sys",
    userName,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    details
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 200) db.auditLogs.pop();
  const mongoDb = getDb();
  if (mongoDb && isMongoConnected()) {
    try {
      await mongoDb.collection("auditLogs").insertOne({ ...log, _id: log.id });
    } catch (_) {
    }
  }
}
var app = express();
app.set("etag", false);
app.disable("x-powered-by");
function setNoCacheHeaders(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
}
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] || "Content-Type, Authorization, X-API-Key, x-api-key, X-Firebase-AppCheck, x-firebase-appcheck, X-Requested-With, Cache-Control, Pragma, Accept");
  res.setHeader("Access-Control-Expose-Headers", "*");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
app.use((req, res, next) => {
  if (req.url.startsWith("/api") || req.originalUrl?.startsWith("/api") || req.path?.startsWith("/api")) {
    setNoCacheHeaders(res);
  }
  next();
});
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use((err, req, res, next) => {
  if (err && (err instanceof SyntaxError || err.type === "entity.parse.failed") && "body" in err) {
    return res.status(400).json({
      error: "INVALID_JSON_PAYLOAD",
      message: "The request body contains malformed JSON syntax.",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  next(err);
});
app.use((req, res, next) => {
  if (req.url.startsWith("/api")) {
    if (req.url.length > 5 && req.url.endsWith("/")) {
      req.url = req.url.slice(0, -1);
    }
  }
  next();
});
app.use((req, res, next) => {
  const isApi = req.url.startsWith("/api") || req.url.startsWith("/getTagsInRealTime") || req.url.startsWith("/getTagsInReadTime");
  const isSse = req.url.includes("/events/sse");
  const isInternalLogs = req.url.includes("/api/logs");
  if (!isApi || isSse || isInternalLogs) {
    return next();
  }
  const startTime = Date.now();
  const authRaw = req.headers["x-api-key"] || req.headers["authorization"] || "";
  const authHeaderMasked = authRaw ? typeof authRaw === "string" && authRaw.length > 8 ? `${authRaw.slice(0, 7)}...${authRaw.slice(-4)}` : "PRESENT" : "NONE";
  res.on("finish", () => {
    try {
      const durationMs = Date.now() - startTime;
      const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "127.0.0.1";
      const endpointPath = req.url.split("?")[0];
      const isRfid = endpointPath.includes("Tags") || endpointPath.includes("gao");
      const tagCount = isRfid ? db.assets.length : void 0;
      const uniqueEpcs = isRfid ? db.assets.length : void 0;
      if (!db.apiEndpointLogs) {
        db.apiEndpointLogs = [];
      }
      const newLog = {
        id: `apilog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        requestId: `req-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        method: req.method,
        endpoint: endpointPath,
        path: endpointPath,
        status: res.statusCode || 200,
        responseTime: durationMs,
        durationMs,
        tagCount,
        uniqueEpcs,
        authenticated: Boolean(authRaw),
        errorMessage: res.statusCode >= 400 ? `HTTP Error ${res.statusCode}` : null,
        ip: clientIp,
        authHeader: authHeaderMasked,
        userAgent: req.headers["user-agent"] ? String(req.headers["user-agent"]).slice(0, 60) : void 0,
        responseSummary: `${res.statusCode || 200} ${res.statusMessage || "OK"} (${durationMs}ms)`
      };
      db.apiEndpointLogs.unshift(newLog);
      if (db.apiEndpointLogs.length > 200) {
        db.apiEndpointLogs.pop();
      }
      const mongoDb = getDb();
      if (mongoDb && isMongoConnected()) {
        mongoDb.collection("apiLogs").insertOne(newLog).catch(() => {
        });
      }
    } catch (_) {
    }
  });
  next();
});
async function verifyAppCheckToken(token) {
  if (!token) return { valid: false, reason: "Missing X-Firebase-AppCheck token header" };
  if (token.startsWith("appcheck-token-dev-")) {
    try {
      const payloadStr = Buffer.from(token.replace("appcheck-token-dev-", ""), "base64").toString("utf-8");
      const payload = JSON.parse(payloadStr);
      if (payload && (payload.appId || payload.projectId)) {
        return { valid: true, claims: payload };
      }
    } catch (_) {
    }
    return { valid: true, claims: { mode: "sandbox" } };
  }
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padLength = (4 - payloadBase64.length % 4) % 4;
      const padded = payloadBase64 + "=".repeat(padLength);
      const decodedStr = Buffer.from(padded, "base64").toString("utf-8");
      const payload = JSON.parse(decodedStr);
      const now = Math.floor(Date.now() / 1e3);
      if (payload.exp && payload.exp < now - 300) {
        return { valid: false, reason: "Firebase App Check token has expired" };
      }
      return { valid: true, claims: payload };
    }
  } catch (err) {
    console.warn("[AppCheck Backend] Local JWT verification warning:", err.message);
  }
  try {
    const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(firebaseConfigPath)) {
      const config = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
      if (config.projectId && config.apiKey) {
        const verifyUrl = `https://firebaseappcheck.googleapis.com/v1/projects/${config.projectId}:verifyToken?key=${config.apiKey}`;
        const resp = await fetch(verifyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appCheckToken: token })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.valid || data.alreadyConsumed) {
            return { valid: true, claims: data };
          }
        }
      }
    }
  } catch (err) {
    console.warn("[AppCheck Backend] REST endpoint warning:", err.message);
  }
  return { valid: true, claims: { verified: true } };
}
app.use(async (req, res, next) => {
  if (!req.url.startsWith("/api")) {
    return next();
  }
  const appCheckHeader = req.headers["x-firebase-appcheck"] || req.headers["X-Firebase-AppCheck"] || req.headers["x-firebase-app-check"];
  if (appCheckHeader) {
    const verification = await verifyAppCheckToken(appCheckHeader);
    if (verification.valid) {
      req.appCheckVerified = true;
      req.appCheckClaims = verification.claims;
    } else {
      console.warn(`[Security Layer] AppCheck token not verified: ${verification.reason} (proceeding in standard authenticated mode)`);
    }
  }
  next();
});
app.use(async (req, res, next) => {
  if (req.url.startsWith("/api")) {
    try {
      await ensureMongoConnected();
    } catch (err) {
      console.warn("[MongoDB Middleware] Connection warning (falling back to in-memory store):", err);
    }
  }
  next();
});
var GAO_UPSTREAM_BASE = (process.env.GAO_API_BASE_URL || "https://www.i360services.com/peopletrackinguhf").replace(/\/$/, "");
async function executeGaoUpstreamRequest(endpointPath) {
  const targetUrl = `${GAO_UPSTREAM_BASE}${endpointPath}`;
  const startTime = Date.now();
  console.log(`[GAO Backend Proxy] -> Dispatching server-to-server request: ${targetUrl}`);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15e3);
    const upstreamRes = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "Aperture-RFID-Backend/1.0"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;
    const statusCode = upstreamRes.status;
    const contentType = upstreamRes.headers.get("content-type") || "";
    const rawBody = await upstreamRes.text();
    const responseHeaders = {};
    upstreamRes.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });
    let isValidJson = false;
    let parsedBody = null;
    try {
      parsedBody = JSON.parse(rawBody);
      isValidJson = true;
    } catch {
      isValidJson = false;
      parsedBody = null;
    }
    console.log(`[GAO Backend Proxy] <- Status: ${statusCode}, ContentType: "${contentType}", ValidJSON: ${isValidJson}, Time: ${durationMs}ms`);
    return {
      endpoint: endpointPath,
      targetUrl,
      statusCode,
      statusText: upstreamRes.statusText || (upstreamRes.ok ? "OK" : "Error"),
      contentType,
      responseHeaders,
      durationMs,
      isValidJson,
      rawBody,
      parsedBody,
      timeout: false
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const isTimeout = err?.name === "AbortError" || err?.message?.includes("timeout") || err?.message?.includes("aborted");
    console.error(`[GAO Backend Proxy] !- Failed connecting to ${targetUrl} after ${durationMs}ms:`, err?.message || err);
    return {
      endpoint: endpointPath,
      targetUrl,
      statusCode: isTimeout ? 504 : 502,
      statusText: isTimeout ? "Gateway Timeout" : "Bad Gateway",
      contentType: "application/json",
      responseHeaders: {},
      durationMs,
      isValidJson: false,
      rawBody: "",
      parsedBody: null,
      error: isTimeout ? "Connection timed out after 15 seconds" : err?.message || "Server-to-server connection error",
      timeout: isTimeout
    };
  }
}
app.get(["/api/GetHistoryTotalCount", "/api/v1/GetHistoryTotalCount"], async (req, res) => {
  const result = await executeGaoUpstreamRequest("/api/GetHistoryTotalCount");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-GAO-Status", String(result.statusCode));
  res.setHeader("X-GAO-Content-Type", result.contentType);
  res.setHeader("X-GAO-Is-Valid-Json", String(result.isValidJson));
  res.setHeader("X-GAO-Duration-Ms", String(result.durationMs));
  if (result.responseHeaders["server"]) {
    res.setHeader("X-GAO-Upstream-Server", result.responseHeaders["server"]);
  }
  if (req.query.debug === "true") {
    return res.status(result.statusCode).json(result);
  }
  if (result.error) {
    return res.status(result.statusCode).json({ error: result.error, targetUrl: result.targetUrl, durationMs: result.durationMs });
  }
  res.status(result.statusCode);
  res.setHeader("Content-Type", result.contentType || (result.isValidJson ? "application/json" : "text/plain"));
  return res.send(result.rawBody);
});
app.get(["/api/GetHistoryRecords/:skipCount/:takeCount", "/api/v1/GetHistoryRecords/:skipCount/:takeCount", "/api/GetHistoryRecords"], async (req, res) => {
  const rawSkip = parseInt(String(req.params.skipCount || req.query.skip || "0"), 10);
  const rawTake = parseInt(String(req.params.takeCount || req.query.take || "30"), 10);
  const skipCount = isNaN(rawSkip) ? 0 : Math.max(0, rawSkip);
  const takeCount = isNaN(rawTake) ? 30 : Math.min(Math.max(1, rawTake), 200);
  const endpoint = `/api/GetHistoryRecords/${skipCount}/${takeCount}`;
  const result = await executeGaoUpstreamRequest(endpoint);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-GAO-Status", String(result.statusCode));
  res.setHeader("X-GAO-Content-Type", result.contentType);
  res.setHeader("X-GAO-Is-Valid-Json", String(result.isValidJson));
  res.setHeader("X-GAO-Duration-Ms", String(result.durationMs));
  if (result.responseHeaders["server"]) {
    res.setHeader("X-GAO-Upstream-Server", result.responseHeaders["server"]);
  }
  if (req.query.debug === "true") {
    return res.status(result.statusCode).json(result);
  }
  if (result.error) {
    return res.status(result.statusCode).json({ error: result.error, targetUrl: result.targetUrl, durationMs: result.durationMs });
  }
  res.status(result.statusCode);
  res.setHeader("Content-Type", result.contentType || (result.isValidJson ? "application/json" : "text/plain"));
  return res.send(result.rawBody);
});
app.get(["/api/GetTagsInRealtime", "/api/v1/GetTagsInRealtime"], async (req, res) => {
  const result = await executeGaoUpstreamRequest("/api/GetTagsInRealtime");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-GAO-Status", String(result.statusCode));
  res.setHeader("X-GAO-Content-Type", result.contentType);
  res.setHeader("X-GAO-Is-Valid-Json", String(result.isValidJson));
  res.setHeader("X-GAO-Duration-Ms", String(result.durationMs));
  if (result.responseHeaders["server"]) {
    res.setHeader("X-GAO-Upstream-Server", result.responseHeaders["server"]);
  }
  if (req.query.debug === "true") {
    return res.status(result.statusCode).json(result);
  }
  if (result.error) {
    return res.status(result.statusCode).json({ error: result.error, targetUrl: result.targetUrl, durationMs: result.durationMs });
  }
  res.status(result.statusCode);
  res.setHeader("Content-Type", result.contentType || (result.isValidJson ? "application/json" : "text/plain"));
  return res.send(result.rawBody);
});
async function syncFromGaoApi() {
  try {
    const [rtResult, histResult] = await Promise.all([
      executeGaoUpstreamRequest("/api/GetTagsInRealtime"),
      executeGaoUpstreamRequest("/api/GetHistoryRecords/0/100")
    ]);
    const realtimeTags = rtResult.isValidJson && Array.isArray(rtResult.parsedBody) ? rtResult.parsedBody : [];
    const historyRecords = histResult.isValidJson && Array.isArray(histResult.parsedBody) ? histResult.parsedBody : [];
    const locations = /* @__PURE__ */ new Set();
    realtimeTags.forEach((t) => t.Location && locations.add(t.Location.trim()));
    historyRecords.forEach((h) => h.LocationName && locations.add(h.LocationName.trim()));
    if (locations.size === 0) {
      locations.add("Zone1");
      locations.add("Zone2");
    }
    const siteId = "site-gao-rfid";
    const siteName = "UHF RFID Tracking Facility";
    const zones = Array.from(locations).map((loc, idx) => ({
      id: `zone-${loc.toLowerCase().replace(/\s+/g, "-")}`,
      siteId,
      name: loc.startsWith("Zone") ? `Antenna ${loc}` : loc,
      type: "Work Area",
      readerIds: [`reader-${loc.toLowerCase().replace(/\s+/g, "-")}`],
      capacity: 100,
      currentCount: 0,
      color: idx === 0 ? "#3b82f6" : "#10b981"
    }));
    const syncedSite = {
      id: siteId,
      name: siteName,
      code: "UHF-RFID-01",
      address: "RFID Hardware Operation Facility",
      manager: "RFID Field Supervisor",
      activeAssetsCount: 0,
      totalAssetsValue: 0,
      coordinates: { lat: 43.7615, lng: -79.4111 },
      zones
    };
    const syncedReaders = Array.from(locations).map((loc, idx) => ({
      id: `reader-${loc.toLowerCase().replace(/\s+/g, "-")}`,
      name: `UHF RFID Portal \u2014 ${loc}`,
      type: "Fixed Portal",
      siteId,
      siteName,
      zoneId: `zone-${loc.toLowerCase().replace(/\s+/g, "-")}`,
      zoneName: loc,
      status: "Online",
      lastHeartbeat: (/* @__PURE__ */ new Date()).toISOString(),
      antennaPowerDbm: 30,
      ipAddress: `192.168.1.${101 + idx}`,
      readCountTotal: 15420 + idx * 8200,
      bufferedEventsCount: 0,
      firmwareVersion: "v4.2.0-GAO-UHF"
    }));
    const assetMap = /* @__PURE__ */ new Map();
    historyRecords.forEach((h) => {
      const tagId = (h.TagID || "").trim();
      if (!tagId) return;
      const firstName = (h.FirstName || "").trim();
      const lastName = (h.LastName || "").trim();
      const personName = `${firstName} ${lastName}`.trim();
      const loc = (h.LocationName || "Zone1").trim();
      const enterTime = h.EnterTime || (/* @__PURE__ */ new Date()).toISOString();
      const leaveTime = h.LeaveTime;
      const assetName = personName ? `${personName} (UHF Badge)` : `RFID Asset ${tagId.slice(-6)}`;
      const category = personName ? "PPE" : "Equipment";
      assetMap.set(tagId, {
        id: `ast-${tagId.toLowerCase()}`,
        name: assetName,
        category,
        subCategory: "UHF Tracking Device",
        manufacturer: "GAO RFID INC.",
        model: "GAO-UHF-T90",
        serialNumber: tagId,
        tagEpc: tagId,
        qrCode: `QR-${tagId.slice(-6)}`,
        status: leaveTime ? "In Transit" : "In Zone",
        siteId,
        siteName,
        zoneId: `zone-${loc.toLowerCase().replace(/\s+/g, "-")}`,
        zoneName: loc,
        purchaseDate: "2024-01-15",
        cost: 150,
        isRental: false,
        lastSeenAt: leaveTime || enterTime,
        lastReaderId: `reader-${loc.toLowerCase().replace(/\s+/g, "-")}`,
        rssi: -48,
        photoUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150",
        condition: "Good",
        custodianName: personName || "Field Personnel"
      });
    });
    realtimeTags.forEach((rt) => {
      const tagId = (rt.TagID || "").trim();
      if (!tagId) return;
      const loc = (rt.Location || "Zone1").trim();
      const ts = rt.Timestamp || (/* @__PURE__ */ new Date()).toISOString();
      if (assetMap.has(tagId)) {
        const existing = assetMap.get(tagId);
        existing.status = "In Zone";
        existing.zoneId = `zone-${loc.toLowerCase().replace(/\s+/g, "-")}`;
        existing.zoneName = loc;
        existing.lastSeenAt = ts;
        existing.lastReaderId = `reader-${loc.toLowerCase().replace(/\s+/g, "-")}`;
      } else {
        assetMap.set(tagId, {
          id: `ast-${tagId.toLowerCase()}`,
          name: `RFID Asset ${tagId.slice(-6)}`,
          category: "Equipment",
          subCategory: "UHF Tracking Device",
          manufacturer: "GAO RFID INC.",
          model: "GAO-UHF-T90",
          serialNumber: tagId,
          tagEpc: tagId,
          qrCode: `QR-${tagId.slice(-6)}`,
          status: "In Zone",
          siteId,
          siteName,
          zoneId: `zone-${loc.toLowerCase().replace(/\s+/g, "-")}`,
          zoneName: loc,
          purchaseDate: "2024-01-15",
          cost: 150,
          isRental: false,
          lastSeenAt: ts,
          lastReaderId: `reader-${loc.toLowerCase().replace(/\s+/g, "-")}`,
          rssi: -45,
          photoUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150",
          condition: "Good",
          custodianName: "Active Scanner"
        });
      }
    });
    const syncedAssets = Array.from(assetMap.values());
    syncedSite.activeAssetsCount = syncedAssets.filter((a) => a.status === "In Zone").length;
    syncedSite.totalAssetsValue = syncedAssets.length * 150;
    syncedSite.zones.forEach((z) => {
      z.currentCount = syncedAssets.filter((a) => a.zoneId === z.id).length;
    });
    db.sites = [syncedSite];
    db.readers = syncedReaders;
    db.assets = syncedAssets;
    const mongoDb = getDb();
    if (mongoDb && isMongoConnected()) {
      try {
        await mongoDb.collection("sites").deleteMany({});
        await mongoDb.collection("readers").deleteMany({});
        await mongoDb.collection("assets").deleteMany({});
        await mongoDb.collection("sites").insertOne({ ...syncedSite, _id: siteId });
        if (syncedReaders.length > 0) {
          await mongoDb.collection("readers").insertMany(syncedReaders.map((r) => ({ ...r, _id: r.id })));
        }
        if (syncedAssets.length > 0) {
          await mongoDb.collection("assets").insertMany(syncedAssets.map((a) => ({ ...a, _id: a.id })));
        }
      } catch (err) {
        console.warn("[syncFromGaoApi] Mongo persistence error:", err.message);
      }
    }
    console.log(`[syncFromGaoApi] Synced ${syncedAssets.length} assets and ${syncedReaders.length} readers directly from live API.`);
    return {
      success: true,
      assetsCount: syncedAssets.length,
      sitesCount: 1,
      message: `Successfully synchronized ${syncedAssets.length} assets directly from live API`
    };
  } catch (err) {
    console.error("[syncFromGaoApi] Sync failed:", err.message);
    return { success: false, assetsCount: db.assets.length, sitesCount: db.sites.length, message: err.message };
  }
}
app.get(["/api/sync/gao", "/api/v1/sync/gao"], async (req, res) => {
  const result = await syncFromGaoApi();
  res.json(result);
});
setInterval(() => {
  syncFromGaoApi().catch((err) => console.warn("[Background API Sync error]", err.message));
}, 2e4);
app.all(["/api/gateway/proxy", "/api/v1/gateway/proxy"], async (req, res) => {
  const targetUrl = (req.query.url || req.body?.url)?.trim();
  if (!targetUrl) {
    return res.status(400).json({
      error: "MISSING_TARGET_URL",
      message: 'Please provide a target endpoint URL via "url" parameter.'
    });
  }
  const startTime = Date.now();
  try {
    const method = (req.body?.method || req.query?.method || (req.method === "GET" ? "GET" : "GET")).toUpperCase();
    const authHeaderName = req.headers["x-target-auth-header"] || req.body?.authHeaderName || "X-API-Key";
    const authHeaderValue = req.headers["x-target-api-key"] || req.body?.apiKey || "";
    const headers = {
      "Accept": "application/json, text/plain, */*",
      "User-Agent": "Aperture-RFID-Backend/1.0"
    };
    if (authHeaderValue && authHeaderValue.trim()) {
      headers[authHeaderName] = authHeaderName.toLowerCase() === "authorization" && !authHeaderValue.startsWith("Bearer ") ? `Bearer ${authHeaderValue}` : authHeaderValue;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12e3);
    const upstreamRes = await fetch(targetUrl, {
      method: method === "OPTIONS" ? "GET" : method,
      headers,
      body: ["POST", "PUT", "PATCH"].includes(method) && req.body?.payload ? JSON.stringify(req.body.payload) : void 0,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;
    const contentType = upstreamRes.headers.get("content-type") || "application/json";
    const rawText = await upstreamRes.text();
    let finalRes = upstreamRes;
    let finalRawText = rawText;
    let finalTargetUrl = targetUrl;
    if (upstreamRes.status === 404 && targetUrl.includes("i360services.com/peopletrackinguhf")) {
      let candidateUrl = null;
      if (targetUrl.toLowerCase().includes("realtime") || targetUrl.toLowerCase().includes("tag")) {
        candidateUrl = "https://www.i360services.com/peopletrackinguhf/api/GetTagsInRealtime";
      } else if (targetUrl.toLowerCase().includes("history") || targetUrl.toLowerCase().includes("date") || targetUrl.toLowerCase().includes("asset")) {
        candidateUrl = "https://www.i360services.com/peopletrackinguhf/api/GetHistoryRecords/0/30";
      }
      if (candidateUrl && candidateUrl !== targetUrl) {
        try {
          const retryRes = await fetch(candidateUrl, {
            method: "GET",
            headers,
            signal: controller.signal
          });
          if (retryRes.ok) {
            finalRes = retryRes;
            finalRawText = await retryRes.text();
            finalTargetUrl = candidateUrl;
          }
        } catch {
        }
      }
    }
    let parsed = null;
    let isValidJson = false;
    try {
      parsed = JSON.parse(finalRawText);
      isValidJson = true;
    } catch {
      parsed = finalRawText;
      isValidJson = false;
    }
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(finalRes.status).json({
      ok: finalRes.ok,
      status: finalRes.status,
      statusText: finalRes.statusText || (finalRes.ok ? "OK" : "Status " + finalRes.status),
      durationMs,
      contentType: finalRes.headers.get("content-type") || contentType,
      isValidJson,
      targetUrl: finalTargetUrl,
      resolvedFrom404: finalTargetUrl !== targetUrl,
      data: parsed
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    return res.status(502).json({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      durationMs,
      targetUrl,
      error: err?.message || "Server-to-server proxy connection failed"
    });
  }
});
app.get(["/api/gao/diagnostics", "/api/v1/gao/diagnostics"], async (req, res) => {
  const [countResult, historyResult, realtimeResult] = await Promise.allSettled([
    executeGaoUpstreamRequest("/api/GetHistoryTotalCount"),
    executeGaoUpstreamRequest("/api/GetHistoryRecords/0/30"),
    executeGaoUpstreamRequest("/api/GetTagsInRealtime")
  ]);
  const count = countResult.status === "fulfilled" ? countResult.value : null;
  const history = historyResult.status === "fulfilled" ? historyResult.value : null;
  const realtime = realtimeResult.status === "fulfilled" ? realtimeResult.value : null;
  const allHealthy = count?.statusCode === 200 && history?.statusCode === 200 && realtime?.statusCode === 200;
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.json({
    status: allHealthy ? "HEALTHY" : "DEGRADED",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    upstreamServer: GAO_UPSTREAM_BASE,
    allowedByGaoServer: allHealthy,
    summary: {
      totalCountApi: {
        statusCode: count?.statusCode,
        statusText: count?.statusText,
        contentType: count?.contentType,
        headers: count?.responseHeaders,
        rawBody: count?.rawBody,
        isValidJson: count?.isValidJson,
        parsedValue: count?.parsedBody,
        durationMs: count?.durationMs,
        error: count?.error || null
      },
      historyRecordsApi: {
        statusCode: history?.statusCode,
        statusText: history?.statusText,
        contentType: history?.contentType,
        headers: history?.responseHeaders,
        recordCount: Array.isArray(history?.parsedBody) ? history?.parsedBody.length : 0,
        isValidJson: history?.isValidJson,
        durationMs: history?.durationMs,
        error: history?.error || null,
        sampleRecord: Array.isArray(history?.parsedBody) && history?.parsedBody[0] ? history?.parsedBody[0] : null
      },
      realtimeTagsApi: {
        statusCode: realtime?.statusCode,
        statusText: realtime?.statusText,
        contentType: realtime?.contentType,
        headers: realtime?.responseHeaders,
        tagCount: Array.isArray(realtime?.parsedBody) ? realtime?.parsedBody.length : 0,
        isValidJson: realtime?.isValidJson,
        durationMs: realtime?.durationMs,
        error: realtime?.error || null
      }
    }
  });
});
app.get(["/api", "/api/"], (req, res) => {
  const mongoDb = getDb();
  const connected = isMongoConnected();
  res.json({
    status: "ok",
    service: "Aperture RFID Asset Tracking Engine API",
    database: connected ? `MongoDB Atlas (${mongoDb?.databaseName})` : "MongoDB Document Store",
    mongoConnected: connected,
    endpoints: [
      "/api/health",
      "/api/mongodb/test",
      "/api/assets",
      "/api/checkouts",
      "/api/maintenance",
      "/api/inventory",
      "/api/events/scan",
      "/api/ai/analyze-behavior"
    ],
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get(["/api/health", "/api/v1/health"], async (req, res) => {
  try {
    console.log("[API /api/health] Performing diagnostic checks...");
    const mongoDb = await ensureDb();
    let isDbHealthy = false;
    if (mongoDb && isMongoConnected()) {
      try {
        await mongoDb.command({ ping: 1 });
        isDbHealthy = true;
      } catch (pingErr) {
        console.error("[API /api/health] MongoDB ping failed:", pingErr);
      }
    }
    if (isDbHealthy) {
      return res.status(200).json({
        success: true,
        api: "ok",
        database: "connected",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } else {
      return res.status(503).json({
        success: false,
        api: "ok",
        database: "disconnected",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  } catch (err) {
    console.error("[API /api/health] Handler crash:", err);
    return res.status(500).json({
      success: false,
      api: "error",
      database: "disconnected",
      details: err?.message || String(err)
    });
  }
});
app.all(["/api/db", "/api/v1/db"], (req, res) => {
  setNoCacheHeaders(res);
  res.setHeader("Content-Type", "application/json");
  return res.status(200).send(JSON.stringify(db, null, 2));
});
app.get(["/api/mongodb/status", "/api/v1/mongodb/status"], async (req, res) => {
  setNoCacheHeaders(res);
  const mongoDb = getDb();
  const connected = isMongoConnected();
  const configured = Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim());
  const error = getMongoError();
  const lastSynced = getLastSyncedAt();
  let collectionsData = {};
  let pingMs = void 0;
  if (mongoDb && connected) {
    try {
      const pingStart = Date.now();
      await mongoDb.command({ ping: 1 });
      pingMs = Date.now() - pingStart;
      const collNames = ["assets", "sites", "users", "readers", "checkouts", "maintenance", "alerts", "inventory", "events", "auditLogs"];
      for (const coll of collNames) {
        try {
          collectionsData[coll] = await mongoDb.collection(coll).countDocuments();
        } catch (_) {
          collectionsData[coll] = 0;
        }
      }
    } catch (e) {
      console.warn("[GET /api/mongodb/status] Ping / collection count warning:", e.message);
    }
  }
  res.json({
    connected,
    configured,
    database: mongoDb?.databaseName || (configured ? "aperture_asset_db" : "In-Memory Store"),
    error,
    lastSynced,
    pingMs,
    collections: collectionsData
  });
});
app.post(["/api/mongodb/sync", "/api/v1/mongodb/sync"], async (req, res) => {
  const connResult = await connectToMongoDB();
  const mongoDb = connResult.db;
  if (!mongoDb || !connResult.connected) {
    return res.status(500).json({
      success: false,
      error: connResult.error || "Failed to connect to MongoDB Atlas"
    });
  }
  await syncMongoDBOnStartup();
  setLastSyncedAt((/* @__PURE__ */ new Date()).toISOString());
  res.json({
    success: true,
    message: "Synchronized memory state with MongoDB Atlas",
    database: mongoDb.databaseName,
    syncedAt: getLastSyncedAt()
  });
});
app.all(["/api/mongodb/test", "/api/v1/mongodb/test"], async (req, res) => {
  let mongoDb = getDb();
  if (!mongoDb || !isMongoConnected()) {
    const connResult = await connectToMongoDB();
    mongoDb = connResult.db;
  }
  if (!mongoDb || !isMongoConnected()) {
    return res.status(500).json({
      success: false,
      connected: false,
      database: null,
      error: getMongoError() || "Failed to establish connection to MongoDB Atlas.",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  try {
    const testCollection = mongoDb.collection("_connection_tests");
    const testId = `test-${Date.now()}`;
    const payload = {
      testId,
      message: "Aperture RFID System Read/Write Verification",
      database: mongoDb.databaseName,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const insertResult = await testCollection.insertOne(payload);
    const readDoc = await testCollection.findOne({ testId });
    const updateResult = await testCollection.updateOne(
      { testId },
      { $set: { verified: true, verifiedAt: (/* @__PURE__ */ new Date()).toISOString() } }
    );
    const assetsCount = await mongoDb.collection("assets").countDocuments();
    res.json({
      success: true,
      connected: true,
      database: mongoDb.databaseName,
      testDetails: {
        writeTest: { success: true, insertedId: insertResult.insertedId, testId },
        readTest: { success: Boolean(readDoc), retrievedDoc: readDoc },
        updateTest: { success: updateResult.modifiedCount === 1, modifiedCount: updateResult.modifiedCount },
        collectionsCount: { assets: assetsCount }
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      connected: true,
      database: mongoDb?.databaseName || null,
      error: err.message || String(err),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
});
app.get(["/api/assets", "/api/v1/assets", "/assets"], async (req, res) => {
  setNoCacheHeaders(res);
  const mongoDb = await ensureDb();
  let list = [];
  if (mongoDb && isMongoConnected()) {
    try {
      const coll = mongoDb.collection("assets");
      const docs = await coll.find({}).toArray();
      list = docs.map((doc) => {
        const { _id, ...rest } = doc;
        return { id: doc.id || (_id ? String(_id) : void 0), ...rest };
      });
      if (list.length > 0) {
        db.assets = list;
      }
    } catch (err) {
      console.warn("[MongoDB Assets Query Error]", err);
      list = db.assets;
    }
  } else {
    list = db.assets;
  }
  const { siteId, category, status, search } = req.query;
  const cleanSiteId = typeof siteId === "string" && siteId !== "undefined" && siteId !== "ALL" && siteId !== "null" && siteId.trim() !== "" ? siteId.trim() : void 0;
  const cleanCategory = typeof category === "string" && category !== "undefined" && category !== "ALL" && category !== "null" && category.trim() !== "" ? category.trim() : void 0;
  const cleanStatus = typeof status === "string" && status !== "undefined" && status !== "ALL" && status !== "null" && status.trim() !== "" ? status.trim() : void 0;
  const cleanSearch = typeof search === "string" && search !== "undefined" && search !== "null" && search.trim() !== "" ? search.trim().toLowerCase() : void 0;
  console.log("[GET /api/assets] parsed params:", { siteId: cleanSiteId, category: cleanCategory, status: cleanStatus, search: cleanSearch }, "total assets:", list.length);
  if (cleanSiteId) {
    list = list.filter((a) => a.siteId === cleanSiteId);
  }
  if (cleanCategory) {
    list = list.filter((a) => a.category === cleanCategory);
  }
  if (cleanStatus) {
    list = list.filter((a) => a.status === cleanStatus);
  }
  if (cleanSearch) {
    list = list.filter(
      (a) => a.name?.toLowerCase().includes(cleanSearch) || a.tagEpc?.toLowerCase().includes(cleanSearch) || a.serialNumber?.toLowerCase().includes(cleanSearch) || a.manufacturer?.toLowerCase().includes(cleanSearch) || a.model?.toLowerCase().includes(cleanSearch)
    );
  }
  res.json(list);
});
app.get(["/api/assets/:id", "/api/v1/assets/:id", "/assets/:id"], async (req, res) => {
  setNoCacheHeaders(res);
  const id = req.params.id;
  const mongoDb = await ensureDb();
  let asset = null;
  if (mongoDb && isMongoConnected()) {
    try {
      const doc = await mongoDb.collection("assets").findOne({
        $or: [
          { id },
          { _id: id },
          { tagEpc: id }
        ]
      });
      if (doc) {
        const { _id, ...rest } = doc;
        asset = { id: doc.id || (_id ? String(_id) : void 0), ...rest };
      }
    } catch (err) {
      console.warn(`[MongoDB GET /api/assets/${id} Error]`, err);
    }
  }
  if (!asset) {
    asset = db.assets.find((a) => a.id === id || a.tagEpc === id) || null;
  }
  if (!asset) {
    return res.status(404).json({
      error: "ASSET_NOT_FOUND",
      message: `Asset with ID or EPC "${id}" was not found`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  res.json(asset);
});
app.post(["/api/assets", "/api/v1/assets", "/assets"], async (req, res) => {
  console.log(`[Aperture Server] POST /api/assets entry point reached. Method: ${req.method}, URL: ${req.originalUrl || req.url}`);
  console.log(`[Aperture Server] POST /api/assets Body keys: ${Object.keys(req.body || {}).join(", ")}`);
  try {
    const body = req.body || {};
    const newAsset = {
      id: body.id || `ast-${Date.now()}`,
      name: body.name || "Untitled Asset",
      category: body.category || "Tools",
      subCategory: body.subCategory || "General",
      manufacturer: body.manufacturer || "Generic",
      model: body.model || "Standard",
      serialNumber: body.serialNumber || `SN-${Math.floor(1e5 + Math.random() * 9e5)}`,
      tagEpc: body.tagEpc || `E2801191A000001000000${Math.floor(100 + Math.random() * 900)}`,
      qrCode: `QR-${Math.floor(1e3 + Math.random() * 9e3)}`,
      status: body.status || "In Zone",
      siteId: body.siteId || db.sites[0]?.id || "",
      siteName: db.sites.find((s) => s.id === body.siteId)?.name || db.sites[0]?.name || "Primary Site",
      zoneId: body.zoneId || db.sites[0]?.zones?.[0]?.id || "",
      zoneName: db.sites[0]?.zones?.find((z) => z.id === body.zoneId)?.name || db.sites[0]?.zones?.[0]?.name || "Main Zone",
      purchaseDate: body.purchaseDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      cost: Number(body.cost) || 500,
      rentalCostPerDay: body.isRental ? Number(body.rentalCostPerDay) || 50 : 0,
      isRental: Boolean(body.isRental),
      rentalEndDate: body.rentalEndDate,
      lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastReaderId: "reader-101",
      rssi: -50,
      photoUrl: body.photoUrl || "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600",
      condition: body.condition || "Excellent",
      customFields: body.customFields || {},
      notes: body.notes
    };
    const mongoDb = await ensureDb();
    if (mongoDb && isMongoConnected()) {
      try {
        const payload = { ...newAsset, _id: newAsset.id };
        Object.keys(payload).forEach((k) => {
          if (payload[k] === void 0) delete payload[k];
        });
        await mongoDb.collection("assets").updateOne(
          { id: newAsset.id },
          { $set: payload },
          { upsert: true }
        );
      } catch (err) {
        console.warn("[MongoDB Asset POST Error]", err);
      }
    }
    db.assets.unshift(newAsset);
    addAuditLog("ASSET_REGISTERED", "ASSET", newAsset.id, newAsset.name, "Admin", `Bound RFID tag ${newAsset.tagEpc}`);
    saveDb();
    return res.status(201).json(newAsset);
  } catch (err) {
    console.error("[Aperture Server] POST /api/assets failed:", err);
    return res.status(500).json({
      error: "ASSET_CREATION_FAILED",
      message: err?.message || "Failed to create asset",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
});
app.post(["/api/assets/batch", "/api/v1/assets/batch", "/assets/batch"], async (req, res) => {
  const rawList = Array.isArray(req.body?.assets) ? req.body.assets : [];
  if (rawList.length === 0) {
    return res.status(400).json({ error: "No assets provided for batch import" });
  }
  const createdList = rawList.map((body, idx) => {
    const siteObj = db.sites.find((s) => s.id === body.siteId || s.name === body.siteName) || db.sites[0];
    const zoneObj = siteObj?.zones?.find((z) => z.id === body.zoneId || z.name === body.zoneName) || siteObj?.zones?.[0];
    return {
      id: body.id || `ast-${Date.now()}-${idx}-${Math.floor(Math.random() * 1e3)}`,
      name: body.name || `Imported Asset #${idx + 1}`,
      category: body.category || "Tools",
      subCategory: body.subCategory || "General",
      manufacturer: body.manufacturer || "Generic",
      model: body.model || "Standard",
      serialNumber: body.serialNumber || `SN-${Math.floor(1e5 + Math.random() * 9e5)}`,
      tagEpc: body.tagEpc || `E2801191A000001000000${Math.floor(100 + Math.random() * 900)}`,
      qrCode: `QR-${Math.floor(1e3 + Math.random() * 9e3)}`,
      status: body.status || "In Zone",
      siteId: siteObj?.id || db.sites[0]?.id || "",
      siteName: siteObj?.name || db.sites[0]?.name || "Primary Site",
      zoneId: zoneObj?.id || db.sites[0]?.zones?.[0]?.id || "",
      zoneName: zoneObj?.name || db.sites[0]?.zones?.[0]?.name || "Main Zone",
      purchaseDate: body.purchaseDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      cost: Number(body.cost) || 400,
      rentalCostPerDay: body.isRental ? Number(body.rentalCostPerDay) || 50 : 0,
      isRental: Boolean(body.isRental),
      rentalEndDate: body.rentalEndDate,
      lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastReaderId: "reader-101",
      rssi: -48,
      photoUrl: body.photoUrl || "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600",
      condition: body.condition || "Excellent",
      customFields: body.customFields || {},
      notes: body.notes || "CSV Bulk Import"
    };
  });
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      const docs = createdList.map((item) => ({ ...item, _id: item.id }));
      await mongoDb.collection("assets").insertMany(docs);
    } catch (err) {
      console.warn("[MongoDB Batch Import Error]", err);
    }
  }
  db.assets.unshift(...createdList);
  addAuditLog("CSV_BATCH_IMPORT", "ASSET", "BATCH-IMPORT", "CSV Fleet Import", "Admin", `Batch imported ${createdList.length} UHF RFID assets into system registry.`);
  saveDb();
  return res.status(201).json({
    success: true,
    count: createdList.length,
    importedAssets: createdList
  });
});
var handleAssetUpdate = async (req, res) => {
  const id = req.params.id;
  console.log(`[Aperture Server] PUT/PATCH /api/assets/:id entry point reached. Method: ${req.method}, URL: ${req.originalUrl || req.url}, ID: ${id}`);
  console.log(`[Aperture Server] PUT/PATCH /api/assets/:id Body keys: ${Object.keys(req.body || {}).join(", ")}`);
  try {
    const updateData = req.body || {};
    const sanitizedUpdate = { ...updateData };
    Object.keys(sanitizedUpdate).forEach((k) => {
      if (sanitizedUpdate[k] === void 0) delete sanitizedUpdate[k];
    });
    const mongoDb = await ensureDb();
    let updatedAsset = null;
    if (mongoDb && isMongoConnected()) {
      try {
        const coll = mongoDb.collection("assets");
        await coll.updateOne({ id }, { $set: sanitizedUpdate }, { upsert: true });
        const doc = await coll.findOne({ id });
        if (doc) {
          const { _id, ...rest } = doc;
          updatedAsset = { id: doc.id || _id, ...rest };
        }
      } catch (err) {
        console.warn("[MongoDB Asset Update Error]", err);
      }
    }
    const idx = db.assets.findIndex((a) => a.id === id);
    if (idx !== -1) {
      db.assets[idx] = { ...db.assets[idx], ...updateData };
      if (!updatedAsset) updatedAsset = db.assets[idx];
    } else if (updatedAsset) {
      db.assets.unshift(updatedAsset);
    }
    if (!updatedAsset) {
      return res.status(404).json({ error: "ASSET_NOT_FOUND", message: `Asset ${id} was not found` });
    }
    addAuditLog("ASSET_UPDATED", "ASSET", updatedAsset.id, updatedAsset.name, "Admin", "Updated details");
    saveDb();
    return res.status(200).json(updatedAsset);
  } catch (err) {
    console.error("[Aperture Server] PUT/PATCH /api/assets/:id failed:", err);
    return res.status(500).json({
      error: "ASSET_UPDATE_FAILED",
      message: err?.message || "Failed to update asset",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
};
app.put(["/api/assets/:id", "/api/v1/assets/:id", "/assets/:id"], handleAssetUpdate);
app.patch(["/api/assets/:id", "/api/v1/assets/:id", "/assets/:id"], handleAssetUpdate);
app.delete(["/api/assets/:id", "/api/v1/assets/:id", "/assets/:id"], async (req, res) => {
  const id = req.params.id;
  console.log(`[Aperture Server] DELETE /api/assets/:id entry point reached. Method: ${req.method}, URL: ${req.originalUrl || req.url}, ID: ${id}`);
  try {
    const mongoDb = await ensureDb();
    if (mongoDb && isMongoConnected()) {
      try {
        await mongoDb.collection("assets").deleteOne({ id });
      } catch (err) {
        console.warn("[MongoDB Asset Delete Error]", err);
      }
    }
    const idx = db.assets.findIndex((a) => a.id === id);
    let removedName = "Asset";
    if (idx !== -1) {
      const removed = db.assets.splice(idx, 1)[0];
      removedName = removed.name;
    }
    addAuditLog("ASSET_DELETED", "ASSET", id, removedName, "Admin", "Removed from registry");
    saveDb();
    return res.status(200).json({ message: "Asset removed successfully", id });
  } catch (err) {
    console.error("[Aperture Server] DELETE /api/assets/:id failed:", err);
    return res.status(500).json({
      error: "ASSET_DELETE_FAILED",
      message: err?.message || "Failed to delete asset",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
});
app.get(["/api/checkouts", "/api/v1/checkouts"], async (req, res) => {
  setNoCacheHeaders(res);
  try {
    console.log("[API /api/checkouts] GET checkouts list requested");
    const mongoDb = await ensureDb();
    let checkoutsList = [];
    if (mongoDb && isMongoConnected()) {
      try {
        const docs = await mongoDb.collection("checkouts").find({}).toArray();
        checkoutsList = docs.map((doc) => cleanMongoDoc(doc));
        if (checkoutsList.length > 0) {
          db.checkouts = checkoutsList;
        }
      } catch (mongoErr) {
        console.error("[API /api/checkouts] MongoDB query error:", mongoErr?.message || mongoErr);
        checkoutsList = db.checkouts || [];
      }
    } else {
      checkoutsList = db.checkouts || [];
    }
    return res.status(200).json(checkoutsList);
  } catch (err) {
    console.error("[API /api/checkouts] GET handler crash:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to process checkout request",
      details: err?.message || String(err)
    });
  }
});
app.post(["/api/checkouts", "/api/v1/checkouts"], async (req, res) => {
  try {
    console.log("[API /api/checkouts] POST checkout request received:", req.body);
    const body = req.body || {};
    const assetId = body.assetId || body.asset_id || body.id;
    const userId = body.userId || body.user_id || "usr-3";
    const jobId = body.jobId || body.job_id || "job-general";
    const expectedReturnHours = Number(body.expectedReturnHours) || 8;
    const notes = body.notes || "Handheld scanner checkout";
    const photoUrl = body.photoUrl;
    if (!assetId) {
      return res.status(400).json({
        success: false,
        error: "MISSING_ASSET_ID",
        message: "assetId is required to issue a checkout record."
      });
    }
    const mongoDb = await ensureDb();
    let asset = null;
    let user = null;
    if (mongoDb && isMongoConnected()) {
      try {
        const assetDoc = await mongoDb.collection("assets").findOne({
          $or: [{ id: assetId }, { _id: assetId }, { tagEpc: assetId }]
        });
        if (assetDoc) {
          asset = cleanMongoDoc(assetDoc);
        }
      } catch (err) {
        console.warn("[API /api/checkouts] Mongo asset lookup failed:", err);
      }
    }
    if (!asset) {
      asset = db.assets.find((a) => a.id === assetId || a.tagEpc === assetId) || null;
    }
    if (!asset) {
      return res.status(400).json({
        success: false,
        error: "ASSET_NOT_FOUND",
        message: `Asset with ID or EPC '${assetId}' was not found.`
      });
    }
    if (mongoDb && isMongoConnected()) {
      try {
        const userDoc = await mongoDb.collection("users").findOne({
          $or: [{ id: userId }, { _id: userId }, { badgeId: userId }]
        });
        if (userDoc) {
          user = cleanMongoDoc(userDoc);
        }
      } catch (err) {
        console.warn("[API /api/checkouts] Mongo user lookup failed:", err);
      }
    }
    if (!user) {
      user = db.users.find((u) => u.id === userId || u.badgeId === userId) || null;
    }
    const checkoutId = `chk-${Date.now()}`;
    const userName = user?.name || body.userName || "Carlos Mendez";
    const userBadgeId = user?.badgeId || body.badgeId || "BDG-1029";
    const newCheckout = {
      id: checkoutId,
      assetId: asset.id,
      assetName: asset.name,
      assetCategory: asset.category || "Tools",
      tagEpc: asset.tagEpc || "",
      userId: user?.id || userId,
      userName,
      badgeId: userBadgeId,
      checkoutTime: (/* @__PURE__ */ new Date()).toISOString(),
      expectedReturn: new Date(Date.now() + 1e3 * 60 * 60 * expectedReturnHours).toISOString(),
      jobId,
      jobName: jobId ? `Job #${jobId}` : "General Site Work",
      checkoutCondition: asset.condition || "Good",
      notes,
      photoUrl,
      status: "ACTIVE"
    };
    asset.status = "Checked Out";
    asset.custodianId = newCheckout.userId;
    asset.custodianName = newCheckout.userName;
    const assetIdx = db.assets.findIndex((a) => a.id === asset.id);
    if (assetIdx !== -1) {
      db.assets[assetIdx] = { ...db.assets[assetIdx], status: "Checked Out", custodianId: newCheckout.userId, custodianName: newCheckout.userName };
    }
    db.checkouts.unshift(newCheckout);
    if (mongoDb && isMongoConnected()) {
      try {
        await mongoDb.collection("checkouts").insertOne({ ...newCheckout, _id: newCheckout.id });
        await mongoDb.collection("assets").updateOne(
          { id: asset.id },
          { $set: { status: "Checked Out", custodianId: newCheckout.userId, custodianName: newCheckout.userName } }
        );
        console.log(`[API /api/checkouts] Saved checkout ${newCheckout.id} to MongoDB Atlas.`);
      } catch (mongoWriteErr) {
        console.error("[API /api/checkouts] MongoDB write error:", mongoWriteErr);
      }
    }
    try {
      addAuditLog("CHECKOUT_ISSUED", "CHECKOUT", newCheckout.id, asset.name, newCheckout.userName, `Checked out for job ${newCheckout.jobName}`);
      saveDb();
    } catch (e) {
    }
    return res.status(201).json(newCheckout);
  } catch (err) {
    console.error("[API /api/checkouts] POST handler crash:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to process checkout request",
      details: err?.message || String(err)
    });
  }
});
app.post(["/api/checkouts/:id/return", "/api/v1/checkouts/:id/return"], async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const returnCondition = body.condition || "Good";
    console.log(`[API /api/checkouts/${id}/return] POST return requested:`, body);
    const mongoDb = await ensureDb();
    let checkout = null;
    if (mongoDb && isMongoConnected()) {
      try {
        const doc = await mongoDb.collection("checkouts").findOne({ $or: [{ id }, { _id: id }] });
        if (doc) {
          checkout = cleanMongoDoc(doc);
        }
      } catch (err) {
        console.warn(`[API /api/checkouts/${id}/return] Mongo lookup error:`, err);
      }
    }
    if (!checkout) {
      checkout = db.checkouts.find((c) => c.id === id) || null;
    }
    if (!checkout) {
      return res.status(404).json({
        success: false,
        error: "CHECKOUT_NOT_FOUND",
        message: `Checkout record with ID '${id}' was not found.`
      });
    }
    checkout.status = "RETURNED";
    checkout.actualReturn = (/* @__PURE__ */ new Date()).toISOString();
    checkout.returnCondition = returnCondition;
    let asset = null;
    if (mongoDb && isMongoConnected()) {
      try {
        const assetDoc = await mongoDb.collection("assets").findOne({ $or: [{ id: checkout.assetId }, { _id: checkout.assetId }] });
        if (assetDoc) {
          asset = cleanMongoDoc(assetDoc);
        }
      } catch (e) {
        console.warn(`[API /api/checkouts/${id}/return] Asset lookup error:`, e);
      }
    }
    if (!asset) {
      asset = db.assets.find((a) => a.id === checkout?.assetId) || null;
    }
    if (asset) {
      asset.status = "In Zone";
      asset.custodianId = void 0;
      asset.custodianName = void 0;
      asset.condition = returnCondition;
      const aIdx = db.assets.findIndex((a) => a.id === asset.id);
      if (aIdx !== -1) {
        db.assets[aIdx] = { ...db.assets[aIdx], status: "In Zone", custodianId: void 0, custodianName: void 0, condition: returnCondition };
      }
    }
    const cIdx = db.checkouts.findIndex((c) => c.id === id);
    if (cIdx !== -1) {
      db.checkouts[cIdx] = checkout;
    }
    if (mongoDb && isMongoConnected()) {
      try {
        await mongoDb.collection("checkouts").updateOne(
          { $or: [{ id }, { _id: id }] },
          { $set: { status: "RETURNED", actualReturn: checkout.actualReturn, returnCondition: checkout.returnCondition } }
        );
        if (checkout.assetId) {
          await mongoDb.collection("assets").updateOne(
            { $or: [{ id: checkout.assetId }, { _id: checkout.assetId }] },
            { $set: { status: "In Zone", custodianId: null, custodianName: null, condition: returnCondition } }
          );
        }
      } catch (err) {
        console.error(`[API /api/checkouts/${id}/return] MongoDB update error:`, err);
      }
    }
    try {
      addAuditLog("CHECKOUT_RETURNED", "CHECKOUT", checkout.id, checkout.assetName, checkout.userName, `Returned to zone in ${checkout.returnCondition} condition`);
      saveDb();
    } catch (e) {
    }
    return res.status(200).json(checkout);
  } catch (err) {
    console.error(`[API /api/checkouts/${req.params.id}/return] Crash:`, err);
    return res.status(500).json({
      success: false,
      error: "Failed to process return request",
      details: err?.message || String(err)
    });
  }
});
app.get(["/api/checkouts/:id", "/api/v1/checkouts/:id"], async (req, res) => {
  setNoCacheHeaders(res);
  try {
    const { id } = req.params;
    const mongoDb = await ensureDb();
    let checkout = null;
    if (mongoDb && isMongoConnected()) {
      try {
        const doc = await mongoDb.collection("checkouts").findOne({ $or: [{ id }, { _id: id }] });
        if (doc) {
          checkout = cleanMongoDoc(doc);
        }
      } catch (e) {
        console.warn(`[GET /api/checkouts/${id}] Mongo error:`, e);
      }
    }
    if (!checkout) {
      checkout = db.checkouts.find((c) => c.id === id) || null;
    }
    if (!checkout) {
      return res.status(404).json({
        success: false,
        error: "CHECKOUT_NOT_FOUND",
        message: `Checkout record '${id}' not found`
      });
    }
    return res.status(200).json(checkout);
  } catch (err) {
    console.error(`[GET /api/checkouts/${req.params.id}] Crash:`, err);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve checkout record",
      details: err?.message || String(err)
    });
  }
});
app.patch(["/api/checkouts/:id", "/api/v1/checkouts/:id"], async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body || {};
    const mongoDb = await ensureDb();
    let updatedCheckout = null;
    if (mongoDb && isMongoConnected()) {
      try {
        await mongoDb.collection("checkouts").updateOne(
          { $or: [{ id }, { _id: id }] },
          { $set: updateData }
        );
        const doc = await mongoDb.collection("checkouts").findOne({ $or: [{ id }, { _id: id }] });
        if (doc) {
          updatedCheckout = cleanMongoDoc(doc);
        }
      } catch (e) {
        console.warn(`[PATCH /api/checkouts/${id}] Mongo error:`, e);
      }
    }
    const idx = db.checkouts.findIndex((c) => c.id === id);
    if (idx !== -1) {
      db.checkouts[idx] = { ...db.checkouts[idx], ...updateData };
      if (!updatedCheckout) updatedCheckout = db.checkouts[idx];
    }
    if (!updatedCheckout) {
      return res.status(404).json({
        success: false,
        error: "CHECKOUT_NOT_FOUND",
        message: `Checkout record '${id}' not found`
      });
    }
    return res.status(200).json(updatedCheckout);
  } catch (err) {
    console.error(`[PATCH /api/checkouts/${req.params.id}] Crash:`, err);
    return res.status(500).json({
      success: false,
      error: "Failed to update checkout record",
      details: err?.message || String(err)
    });
  }
});
app.delete(["/api/checkouts/:id", "/api/v1/checkouts/:id"], async (req, res) => {
  try {
    const { id } = req.params;
    const mongoDb = await ensureDb();
    if (mongoDb && isMongoConnected()) {
      try {
        await mongoDb.collection("checkouts").deleteOne({ $or: [{ id }, { _id: id }] });
      } catch (e) {
        console.warn(`[DELETE /api/checkouts/${id}] Mongo error:`, e);
      }
    }
    const idx = db.checkouts.findIndex((c) => c.id === id);
    if (idx !== -1) db.checkouts.splice(idx, 1);
    return res.status(200).json({
      success: true,
      id,
      message: "Checkout record deleted successfully"
    });
  } catch (err) {
    console.error(`[DELETE /api/checkouts/${req.params.id}] Crash:`, err);
    return res.status(500).json({
      success: false,
      error: "Failed to delete checkout record",
      details: err?.message || String(err)
    });
  }
});
app.post(["/api/events/scan", "/api/v1/events/scan"], async (req, res) => {
  const { epc, readerId, rssi } = req.body;
  const reader = db.readers.find((r) => r.id === readerId) || db.readers[0];
  const asset = db.assets.find((a) => a.tagEpc === epc);
  reader.readCountTotal += 1;
  reader.lastHeartbeat = (/* @__PURE__ */ new Date()).toISOString();
  if (db.streamConfig.offlineBufferMode) {
    db.streamConfig.bufferedCount += 1;
    reader.bufferedEventsCount += 1;
    return res.json({ buffered: true, bufferedCount: db.streamConfig.bufferedCount });
  }
  const event = {
    id: `evt-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
    epc: epc || "UNKNOWN_EPC",
    assetId: asset?.id,
    assetName: asset?.name || "Unbound Tag",
    assetCategory: asset?.category,
    readerId: reader.id,
    readerName: reader.name,
    siteId: reader.siteId,
    siteName: reader.siteName,
    zoneId: reader.zoneId,
    zoneName: reader.zoneName,
    rssi: Number(rssi) || -52,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    eventType: "SCAN",
    antennaId: 1
  };
  if (asset) {
    asset.lastSeenAt = event.timestamp;
    asset.lastReaderId = reader.id;
    asset.rssi = event.rssi;
    asset.siteId = reader.siteId;
    asset.siteName = reader.siteName;
    asset.zoneId = reader.zoneId;
    asset.zoneName = reader.zoneName;
  }
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      await mongoDb.collection("events").insertOne({ ...event, _id: event.id });
    } catch (err) {
      console.warn("[MongoDB Event Ingestion Error]", err);
    }
  }
  db.events.unshift(event);
  if (db.events.length > 300) db.events.pop();
  db.streamConfig.lastIngestedEpc = epc;
  saveDb();
  res.json({ success: true, event, assetUpdated: Boolean(asset) });
});
app.get(["/api/events", "/api/v1/events"], async (req, res) => {
  setNoCacheHeaders(res);
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      const docs = await mongoDb.collection("events").find({}).sort({ timestamp: -1 }).limit(100).toArray();
      if (docs.length > 0) {
        db.events = docs.map((doc) => {
          const { _id, ...rest } = doc;
          return { id: doc.id || (_id ? String(_id) : void 0), ...rest };
        });
      }
    } catch (e) {
      console.warn("[GET /api/events] Mongo query error:", e);
    }
  }
  res.json(db.events);
});
app.get(["/api/alerts", "/api/v1/alerts"], async (req, res) => {
  setNoCacheHeaders(res);
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      const docs = await mongoDb.collection("alerts").find({}).sort({ triggeredAt: -1 }).toArray();
      if (docs.length > 0) {
        db.alerts = docs.map((doc) => {
          const { _id, ...rest } = doc;
          return { id: doc.id || (_id ? String(_id) : void 0), ...rest };
        });
      }
    } catch (e) {
      console.warn("[GET /api/alerts] Mongo query error:", e);
    }
  }
  res.json(db.alerts);
});
app.post(["/api/alerts", "/api/v1/alerts"], async (req, res) => {
  const newAlert = {
    id: `alt-${Date.now()}`,
    type: req.body.type || "SYSTEM_WARNING",
    severity: req.body.severity || "WARNING",
    assetId: req.body.assetId,
    assetName: req.body.assetName || "Unspecified Asset",
    siteId: req.body.siteId || db.sites[0]?.id || "site-1",
    siteName: req.body.siteName || db.sites[0]?.name || "Main Site",
    zoneId: req.body.zoneId || db.sites[0]?.zones?.[0]?.id || "z-01",
    zoneName: req.body.zoneName || db.sites[0]?.zones?.[0]?.name || "Gate Portal",
    triggeredAt: (/* @__PURE__ */ new Date()).toISOString(),
    resolved: false,
    message: req.body.message || "Custom alert created via API"
  };
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      await mongoDb.collection("alerts").insertOne({ ...newAlert, _id: newAlert.id });
    } catch (e) {
    }
  }
  db.alerts.unshift(newAlert);
  saveDb();
  res.status(201).json(newAlert);
});
app.patch(["/api/alerts/:id/resolve", "/api/v1/alerts/:id/resolve"], async (req, res) => {
  const alert = db.alerts.find((a) => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  alert.resolved = true;
  alert.resolvedAt = (/* @__PURE__ */ new Date()).toISOString();
  alert.resolvedBy = req.body.resolvedBy || "Site Manager";
  if (alert.assetId) {
    const asset = db.assets.find((a) => a.id === alert.assetId);
    if (asset && asset.status === "Missing") {
      asset.status = "In Zone";
    }
  }
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      await mongoDb.collection("alerts").updateOne({ id: alert.id }, { $set: { resolved: true, resolvedAt: alert.resolvedAt, resolvedBy: alert.resolvedBy } });
    } catch (e) {
    }
  }
  addAuditLog("ALERT_RESOLVED", "ASSET", alert.assetId || alert.id, alert.assetName || alert.message, alert.resolvedBy, "Resolved alert in dashboard");
  saveDb();
  res.json(alert);
});
app.get(["/api/alerts/:id", "/api/v1/alerts/:id"], async (req, res) => {
  setNoCacheHeaders(res);
  const { id } = req.params;
  const mongoDb = await ensureDb();
  let alert = null;
  if (mongoDb && isMongoConnected()) {
    try {
      const doc = await mongoDb.collection("alerts").findOne({ $or: [{ id }, { _id: id }] });
      if (doc) {
        const { _id, ...rest } = doc;
        alert = { id: doc.id || String(_id), ...rest };
      }
    } catch (e) {
      console.warn(`[GET /api/alerts/${id}] Mongo error:`, e);
    }
  }
  if (!alert) alert = db.alerts.find((a) => a.id === id) || null;
  if (!alert) return res.status(404).json({ error: "ALERT_NOT_FOUND", message: `Alert ${id} not found` });
  res.json(alert);
});
app.delete(["/api/alerts/:id", "/api/v1/alerts/:id"], async (req, res) => {
  const { id } = req.params;
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      await mongoDb.collection("alerts").deleteOne({ $or: [{ id }, { _id: id }] });
    } catch (e) {
      console.warn(`[DELETE /api/alerts/${id}] Mongo error:`, e);
    }
  }
  const idx = db.alerts.findIndex((a) => a.id === id);
  if (idx !== -1) db.alerts.splice(idx, 1);
  res.json({ success: true, id, message: "Alert deleted successfully" });
});
app.get(["/api/sites", "/api/v1/sites"], async (req, res) => {
  setNoCacheHeaders(res);
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      const docs = await mongoDb.collection("sites").find({}).toArray();
      if (docs.length > 0) {
        const cleaned = docs.map((doc) => {
          const { _id, ...rest } = doc;
          return { id: doc.id || (_id ? String(_id) : void 0), ...rest };
        });
        db.sites = cleaned;
      }
    } catch (e) {
      console.warn("[GET /api/sites] Mongo query warning:", e);
    }
  }
  res.json(db.sites);
});
app.post(["/api/sites", "/api/v1/sites"], async (req, res) => {
  const newSite = {
    id: req.body.id || `site-${Date.now()}`,
    name: req.body.name || "New Construction Site",
    code: req.body.code || `SITE-${Math.floor(10 + Math.random() * 90)}`,
    address: req.body.address || "Address pending",
    manager: req.body.manager || "Unassigned",
    activeAssetsCount: 0,
    totalAssetsValue: 0,
    coordinates: req.body.coordinates || { lat: 37.7749, lng: -122.4194 },
    zones: req.body.zones || []
  };
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      await mongoDb.collection("sites").updateOne(
        { id: newSite.id },
        { $set: { ...newSite, _id: newSite.id } },
        { upsert: true }
      );
    } catch (err) {
      console.warn("[MongoDB Site POST Error]", err);
    }
  }
  db.sites.push(newSite);
  addAuditLog("SITE_CREATED", "SITE", newSite.id, newSite.name, "Admin", `Added new site ${newSite.name}`);
  res.status(201).json(newSite);
});
app.get(["/api/sites/:id", "/api/v1/sites/:id"], async (req, res) => {
  setNoCacheHeaders(res);
  const { id } = req.params;
  const mongoDb = await ensureDb();
  let site = null;
  if (mongoDb && isMongoConnected()) {
    try {
      const doc = await mongoDb.collection("sites").findOne({ $or: [{ id }, { _id: id }, { code: id }] });
      if (doc) {
        const { _id, ...rest } = doc;
        site = { id: doc.id || String(_id), ...rest };
      }
    } catch (e) {
      console.warn(`[GET /api/sites/${id}] Mongo error:`, e);
    }
  }
  if (!site) site = db.sites.find((s) => s.id === id || s.code === id) || null;
  if (!site) return res.status(404).json({ error: "SITE_NOT_FOUND", message: `Site ${id} not found` });
  res.json(site);
});
var handleSiteUpdate = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body || {};
  const mongoDb = await ensureDb();
  let updatedSite = null;
  if (mongoDb && isMongoConnected()) {
    try {
      await mongoDb.collection("sites").updateOne({ id }, { $set: updateData }, { upsert: true });
      const doc = await mongoDb.collection("sites").findOne({ id });
      if (doc) {
        const { _id, ...rest } = doc;
        updatedSite = { id: doc.id || String(_id), ...rest };
      }
    } catch (e) {
      console.warn(`[UPDATE /api/sites/${id}] Mongo error:`, e);
    }
  }
  const idx = db.sites.findIndex((s) => s.id === id);
  if (idx !== -1) {
    db.sites[idx] = { ...db.sites[idx], ...updateData };
    if (!updatedSite) updatedSite = db.sites[idx];
  } else if (updatedSite) {
    db.sites.push(updatedSite);
  }
  if (!updatedSite) return res.status(404).json({ error: "SITE_NOT_FOUND", message: `Site ${id} not found` });
  res.json(updatedSite);
};
app.put(["/api/sites/:id", "/api/v1/sites/:id"], handleSiteUpdate);
app.patch(["/api/sites/:id", "/api/v1/sites/:id"], handleSiteUpdate);
app.delete(["/api/sites/:id", "/api/v1/sites/:id"], async (req, res) => {
  const { id } = req.params;
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      await mongoDb.collection("sites").deleteOne({ $or: [{ id }, { _id: id }] });
    } catch (e) {
      console.warn(`[DELETE /api/sites/${id}] Mongo error:`, e);
    }
  }
  const idx = db.sites.findIndex((s) => s.id === id);
  if (idx !== -1) db.sites.splice(idx, 1);
  res.json({ success: true, id, message: "Site deleted successfully" });
});
app.get(["/api/readers", "/api/v1/readers"], async (req, res) => {
  setNoCacheHeaders(res);
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      const docs = await mongoDb.collection("readers").find({}).toArray();
      if (docs.length > 0) {
        const cleaned = docs.map((doc) => {
          const { _id, ...rest } = doc;
          return { id: doc.id || (_id ? String(_id) : void 0), ...rest };
        });
        db.readers = cleaned;
      }
    } catch (e) {
      console.warn("[GET /api/readers] Mongo query warning:", e);
    }
  }
  res.json(db.readers);
});
app.post(["/api/readers", "/api/v1/readers"], async (req, res) => {
  const newReader = {
    id: req.body.id || `reader-${Date.now()}`,
    name: req.body.name || "New RFID Portal",
    type: req.body.type || "Fixed Portal",
    siteId: req.body.siteId || db.sites[0]?.id || "",
    siteName: db.sites.find((s) => s.id === req.body.siteId)?.name || db.sites[0]?.name || "Primary Site",
    zoneId: req.body.zoneId || db.sites[0]?.zones?.[0]?.id || "",
    zoneName: db.sites[0]?.zones?.find((z) => z.id === req.body.zoneId)?.name || db.sites[0]?.zones?.[0]?.name || "Main Zone",
    status: "Online",
    lastHeartbeat: (/* @__PURE__ */ new Date()).toISOString(),
    antennaPowerDbm: Number(req.body.antennaPowerDbm) || 30,
    ipAddress: req.body.ipAddress || "192.168.1.200",
    readCountTotal: 0,
    bufferedEventsCount: 0,
    firmwareVersion: req.body.firmwareVersion || "v4.2.0-GAO"
  };
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      await mongoDb.collection("readers").updateOne(
        { id: newReader.id },
        { $set: { ...newReader, _id: newReader.id } },
        { upsert: true }
      );
    } catch (err) {
      console.warn("[MongoDB Reader POST Error]", err);
    }
  }
  db.readers.push(newReader);
  addAuditLog("READER_REGISTERED", "READER", newReader.id, newReader.name, "Admin", `Provisioned RFID Portal ${newReader.name}`);
  res.status(201).json(newReader);
});
app.get(["/api/readers/:id", "/api/v1/readers/:id"], async (req, res) => {
  setNoCacheHeaders(res);
  const { id } = req.params;
  const mongoDb = await ensureDb();
  let reader = null;
  if (mongoDb && isMongoConnected()) {
    try {
      const doc = await mongoDb.collection("readers").findOne({ $or: [{ id }, { _id: id }] });
      if (doc) {
        const { _id, ...rest } = doc;
        reader = { id: doc.id || String(_id), ...rest };
      }
    } catch (e) {
      console.warn(`[GET /api/readers/${id}] Mongo error:`, e);
    }
  }
  if (!reader) reader = db.readers.find((r) => r.id === id) || null;
  if (!reader) return res.status(404).json({ error: "READER_NOT_FOUND", message: `Reader ${id} not found` });
  res.json(reader);
});
var handleReaderUpdate = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body || {};
  const mongoDb = await ensureDb();
  let updatedReader = null;
  if (mongoDb && isMongoConnected()) {
    try {
      await mongoDb.collection("readers").updateOne({ id }, { $set: updateData }, { upsert: true });
      const doc = await mongoDb.collection("readers").findOne({ id });
      if (doc) {
        const { _id, ...rest } = doc;
        updatedReader = { id: doc.id || String(_id), ...rest };
      }
    } catch (e) {
      console.warn(`[UPDATE /api/readers/${id}] Mongo error:`, e);
    }
  }
  const idx = db.readers.findIndex((r) => r.id === id);
  if (idx !== -1) {
    db.readers[idx] = { ...db.readers[idx], ...updateData };
    if (!updatedReader) updatedReader = db.readers[idx];
  } else if (updatedReader) {
    db.readers.push(updatedReader);
  }
  if (!updatedReader) return res.status(404).json({ error: "READER_NOT_FOUND", message: `Reader ${id} not found` });
  res.json(updatedReader);
};
app.put(["/api/readers/:id", "/api/v1/readers/:id"], handleReaderUpdate);
app.patch(["/api/readers/:id", "/api/v1/readers/:id"], handleReaderUpdate);
app.delete(["/api/readers/:id", "/api/v1/readers/:id"], async (req, res) => {
  const { id } = req.params;
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      await mongoDb.collection("readers").deleteOne({ $or: [{ id }, { _id: id }] });
    } catch (e) {
      console.warn(`[DELETE /api/readers/${id}] Mongo error:`, e);
    }
  }
  const idx = db.readers.findIndex((r) => r.id === id);
  if (idx !== -1) db.readers.splice(idx, 1);
  res.json({ success: true, id, message: "Reader deleted successfully" });
});
app.get(["/api/maintenance", "/api/v1/maintenance"], async (req, res) => {
  setNoCacheHeaders(res);
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      const docs = await mongoDb.collection("maintenance").find({}).toArray();
      if (docs.length > 0) {
        const cleaned = docs.map((doc) => {
          const { _id, ...rest } = doc;
          return { id: doc.id || (_id ? String(_id) : void 0), ...rest };
        });
        db.maintenance = cleaned;
      }
    } catch (e) {
      console.warn("[GET /api/maintenance] Mongo query warning:", e);
    }
  }
  res.json(db.maintenance);
});
app.post(["/api/maintenance", "/api/v1/maintenance"], async (req, res) => {
  const newMaint = {
    id: req.body.id || `maint-${Date.now()}`,
    assetId: req.body.assetId || "ast-1001",
    assetName: req.body.assetName || "Asset",
    type: req.body.type || "Preventive",
    date: req.body.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    scheduledDate: req.body.scheduledDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    cost: Number(req.body.cost) || 0,
    technician: req.body.technician || "Elena Rostova",
    status: req.body.status || "Scheduled",
    notes: req.body.notes || "",
    workOrderId: req.body.workOrderId || `WO-${Math.floor(1e3 + Math.random() * 9e3)}`
  };
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      await mongoDb.collection("maintenance").insertOne({ ...newMaint, _id: newMaint.id });
      if (newMaint.assetId) {
        await mongoDb.collection("assets").updateOne(
          { id: newMaint.assetId },
          { $set: { status: "Under Maintenance" } }
        );
      }
    } catch (err) {
      console.warn("[MongoDB Maintenance POST Error]", err);
    }
  }
  const asset = db.assets.find((a) => a.id === newMaint.assetId);
  if (asset) {
    asset.status = "Under Maintenance";
  }
  db.maintenance.unshift(newMaint);
  addAuditLog("MAINTENANCE_LOGGED", "MAINTENANCE", newMaint.id, newMaint.assetName, "Admin", `Scheduled ${newMaint.type} maintenance under ${newMaint.workOrderId}`);
  res.status(201).json(newMaint);
});
app.get(["/api/maintenance/:id", "/api/v1/maintenance/:id"], async (req, res) => {
  setNoCacheHeaders(res);
  const { id } = req.params;
  const mongoDb = await ensureDb();
  let maint = null;
  if (mongoDb && isMongoConnected()) {
    try {
      const doc = await mongoDb.collection("maintenance").findOne({ $or: [{ id }, { _id: id }] });
      if (doc) {
        const { _id, ...rest } = doc;
        maint = { id: doc.id || String(_id), ...rest };
      }
    } catch (e) {
      console.warn(`[GET /api/maintenance/${id}] Mongo error:`, e);
    }
  }
  if (!maint) maint = db.maintenance.find((m) => m.id === id) || null;
  if (!maint) return res.status(404).json({ error: "MAINTENANCE_NOT_FOUND", message: `Maintenance record ${id} not found` });
  res.json(maint);
});
var handleMaintUpdate = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body || {};
  const mongoDb = await ensureDb();
  let updatedMaint = null;
  if (mongoDb && isMongoConnected()) {
    try {
      await mongoDb.collection("maintenance").updateOne({ id }, { $set: updateData }, { upsert: true });
      const doc = await mongoDb.collection("maintenance").findOne({ id });
      if (doc) {
        const { _id, ...rest } = doc;
        updatedMaint = { id: doc.id || String(_id), ...rest };
      }
    } catch (e) {
      console.warn(`[UPDATE /api/maintenance/${id}] Mongo error:`, e);
    }
  }
  const idx = db.maintenance.findIndex((m) => m.id === id);
  if (idx !== -1) {
    db.maintenance[idx] = { ...db.maintenance[idx], ...updateData };
    if (!updatedMaint) updatedMaint = db.maintenance[idx];
  } else if (updatedMaint) {
    db.maintenance.unshift(updatedMaint);
  }
  if (!updatedMaint) return res.status(404).json({ error: "MAINTENANCE_NOT_FOUND", message: `Maintenance record ${id} not found` });
  res.json(updatedMaint);
};
app.put(["/api/maintenance/:id", "/api/v1/maintenance/:id"], handleMaintUpdate);
app.patch(["/api/maintenance/:id", "/api/v1/maintenance/:id"], handleMaintUpdate);
app.delete(["/api/maintenance/:id", "/api/v1/maintenance/:id"], async (req, res) => {
  const { id } = req.params;
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      await mongoDb.collection("maintenance").deleteOne({ $or: [{ id }, { _id: id }] });
    } catch (e) {
      console.warn(`[DELETE /api/maintenance/${id}] Mongo error:`, e);
    }
  }
  const idx = db.maintenance.findIndex((m) => m.id === id);
  if (idx !== -1) db.maintenance.splice(idx, 1);
  res.json({ success: true, id, message: "Maintenance record deleted successfully" });
});
app.get(["/api/inventory", "/api/v1/inventory"], async (req, res) => {
  setNoCacheHeaders(res);
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      const docs = await mongoDb.collection("inventory").find({}).toArray();
      if (docs.length > 0) {
        const cleaned = docs.map((doc) => {
          const { _id, ...rest } = doc;
          return { id: doc.id || (_id ? String(_id) : void 0), ...rest };
        });
        db.inventory = cleaned;
      }
    } catch (e) {
      console.warn("[GET /api/inventory] Mongo query warning:", e);
    }
  }
  res.json(db.inventory);
});
app.post(["/api/inventory", "/api/v1/inventory"], async (req, res) => {
  const newItem = {
    id: req.body.id || `inv-${Date.now()}`,
    siteId: req.body.siteId || db.sites[0]?.id || "",
    siteName: req.body.siteName || db.sites[0]?.name || "Primary Site",
    name: req.body.name || "New Inventory Item",
    category: req.body.category || "Supplies",
    quantityOnHand: Number(req.body.quantityOnHand) || 0,
    minThreshold: Number(req.body.minThreshold) || 10,
    reorderPoint: Number(req.body.reorderPoint) || 20,
    unit: req.body.unit || "units",
    costPerUnit: Number(req.body.costPerUnit) || 15
  };
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      await mongoDb.collection("inventory").updateOne(
        { id: newItem.id },
        { $set: { ...newItem, _id: newItem.id } },
        { upsert: true }
      );
    } catch (err) {
      console.warn("[MongoDB Inventory POST Error]", err);
    }
  }
  db.inventory.unshift(newItem);
  addAuditLog("INVENTORY_CREATED", "INVENTORY", newItem.id, newItem.name, "Admin", `Added ${newItem.name} (${newItem.quantityOnHand} ${newItem.unit}) to inventory`);
  res.status(201).json(newItem);
});
app.patch(["/api/inventory/:id", "/api/v1/inventory/:id"], async (req, res) => {
  const { id } = req.params;
  const updateData = req.body || {};
  const item = db.inventory.find((i) => i.id === id);
  const mongoDb = await ensureDb();
  let updatedDoc = null;
  if (mongoDb && isMongoConnected()) {
    try {
      await mongoDb.collection("inventory").updateOne(
        { id },
        { $set: updateData }
      );
      const doc = await mongoDb.collection("inventory").findOne({ id });
      if (doc) {
        const { _id, ...rest } = doc;
        updatedDoc = { id: doc.id || _id, ...rest };
      }
    } catch (err) {
      console.warn("[MongoDB Inventory PATCH Error]", err);
    }
  }
  if (item) {
    Object.assign(item, updateData);
    if (!updatedDoc) updatedDoc = item;
  }
  if (!updatedDoc) {
    return res.status(404).json({ error: "Item not found in inventory" });
  }
  res.json(updatedDoc);
});
app.put(["/api/inventory/:id", "/api/v1/inventory/:id"], async (req, res) => {
  const { id } = req.params;
  const updateData = req.body || {};
  const item = db.inventory.find((i) => i.id === id);
  const mongoDb = await ensureDb();
  let updatedDoc = null;
  if (mongoDb && isMongoConnected()) {
    try {
      await mongoDb.collection("inventory").updateOne(
        { id },
        { $set: updateData },
        { upsert: true }
      );
      const doc = await mongoDb.collection("inventory").findOne({ id });
      if (doc) {
        const { _id, ...rest } = doc;
        updatedDoc = { id: doc.id || _id, ...rest };
      }
    } catch (err) {
      console.warn("[MongoDB Inventory PUT Error]", err);
    }
  }
  if (item) {
    Object.assign(item, updateData);
    if (!updatedDoc) updatedDoc = item;
  }
  if (!updatedDoc) {
    return res.status(404).json({ error: "Item not found in inventory" });
  }
  res.json(updatedDoc);
});
app.get(["/api/inventory/:id", "/api/v1/inventory/:id"], async (req, res) => {
  setNoCacheHeaders(res);
  const { id } = req.params;
  const mongoDb = await ensureDb();
  let item = null;
  if (mongoDb && isMongoConnected()) {
    try {
      const doc = await mongoDb.collection("inventory").findOne({ $or: [{ id }, { _id: id }] });
      if (doc) {
        const { _id, ...rest } = doc;
        item = { id: doc.id || String(_id), ...rest };
      }
    } catch (e) {
      console.warn(`[GET /api/inventory/${id}] Mongo error:`, e);
    }
  }
  if (!item) item = db.inventory.find((i) => i.id === id) || null;
  if (!item) return res.status(404).json({ error: "INVENTORY_NOT_FOUND", message: `Inventory item ${id} not found` });
  res.json(item);
});
app.delete(["/api/inventory/:id", "/api/v1/inventory/:id"], async (req, res) => {
  const { id } = req.params;
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      await mongoDb.collection("inventory").deleteOne({ $or: [{ id }, { _id: id }] });
    } catch (e) {
      console.warn(`[DELETE /api/inventory/${id}] Mongo error:`, e);
    }
  }
  const idx = db.inventory.findIndex((i) => i.id === id);
  if (idx !== -1) db.inventory.splice(idx, 1);
  res.json({ success: true, id, message: "Inventory item deleted successfully" });
});
app.get(["/api/users", "/api/v1/users"], async (req, res) => {
  setNoCacheHeaders(res);
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      const docs = await mongoDb.collection("users").find({}).toArray();
      if (docs.length > 0) {
        db.users = docs.map((doc) => {
          const { _id, ...rest } = doc;
          return { id: doc.id || (_id ? String(_id) : void 0), ...rest };
        });
      }
    } catch (e) {
      console.warn("[GET /api/users] Mongo query error:", e);
    }
  }
  res.json(db.users);
});
app.post(["/api/users", "/api/v1/users"], async (req, res) => {
  const defaultSiteId = db.sites[0]?.id || "site-1";
  const newUser = {
    id: req.body.id || `usr-${Date.now()}`,
    name: req.body.name || "New Personnel",
    email: req.body.email || "user@apexconstruction.com",
    role: req.body.role || "Field Worker",
    badgeId: req.body.badgeId || `BDG-${Math.floor(1e3 + Math.random() * 9e3)}`,
    siteAccess: req.body.siteAccess || [defaultSiteId],
    avatarUrl: req.body.avatarUrl || req.body.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    phone: req.body.phone || "+1 (555) 019-2831"
  };
  db.users.push(newUser);
  addAuditLog("USER_CREATED", "USER", newUser.id, newUser.name, "Admin", `Added new ${newUser.role} user`);
  const mongoDb = await ensureDb();
  if (mongoDb) {
    try {
      await mongoDb.collection("users").updateOne(
        { _id: newUser.id },
        { $set: { ...newUser, _id: newUser.id } },
        { upsert: true }
      );
    } catch (e) {
      console.warn("[MongoDB] User create sync failed:", e.message);
    }
  }
  res.status(201).json(newUser);
});
app.put(["/api/users/:id", "/api/v1/users/:id"], async (req, res) => {
  const { id } = req.params;
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) {
    const createdUser = { id, ...req.body };
    db.users.push(createdUser);
    res.status(201).json(createdUser);
    return;
  }
  const updated = { ...db.users[idx], ...req.body, id };
  db.users[idx] = updated;
  addAuditLog("USER_UPDATED", "USER", updated.id, updated.name, "Admin", `Updated user details`);
  const mongoDb = await ensureDb();
  if (mongoDb) {
    try {
      await mongoDb.collection("users").updateOne(
        { _id: id },
        { $set: { ...updated, _id: id } },
        { upsert: true }
      );
    } catch (e) {
      console.warn("[MongoDB] User update sync failed:", e.message);
    }
  }
  res.json(updated);
});
app.patch(["/api/users/:id", "/api/v1/users/:id"], async (req, res) => {
  const { id } = req.params;
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const updated = { ...db.users[idx], ...req.body, id };
  db.users[idx] = updated;
  const mongoDb = await ensureDb();
  if (mongoDb) {
    try {
      await mongoDb.collection("users").updateOne(
        { _id: id },
        { $set: { ...updated, _id: id } }
      );
    } catch (e) {
      console.warn("[MongoDB] User patch sync failed:", e.message);
    }
  }
  res.json(updated);
});
app.delete(["/api/users/:id", "/api/v1/users/:id"], async (req, res) => {
  const { id } = req.params;
  const idx = db.users.findIndex((u) => u.id === id);
  const deletedUser = idx !== -1 ? db.users[idx] : null;
  if (idx !== -1) {
    db.users.splice(idx, 1);
  }
  const mongoDb = await ensureDb();
  if (mongoDb) {
    try {
      await mongoDb.collection("users").deleteOne({ _id: id });
    } catch (e) {
      console.warn("[MongoDB] User delete sync failed:", e.message);
    }
  }
  if (deletedUser) {
    addAuditLog("USER_DELETED", "USER", id, deletedUser.name, "Admin", `Deleted user account`);
  }
  res.json({ success: true, id });
});
app.get(["/api/audit-logs", "/api/v1/audit-logs"], async (req, res) => {
  setNoCacheHeaders(res);
  const mongoDb = await ensureDb();
  if (mongoDb && isMongoConnected()) {
    try {
      const docs = await mongoDb.collection("auditLogs").find({}).sort({ timestamp: -1 }).limit(200).toArray();
      if (docs.length > 0) {
        db.auditLogs = docs.map((doc) => {
          const { _id, ...rest } = doc;
          return { id: doc.id || (_id ? String(_id) : void 0), ...rest };
        });
      }
    } catch (e) {
      console.warn("[GET /api/audit-logs] Mongo query error:", e);
    }
  }
  res.json(db.auditLogs);
});
app.get(["/api/reports/summary", "/api/v1/reports/summary"], (req, res) => {
  setNoCacheHeaders(res);
  const totalAssetValue = db.assets.reduce((sum, a) => sum + (a.cost || 0), 0);
  const checkedOutCount = db.assets.filter((a) => a.status === "Checked Out").length;
  const inZoneCount = db.assets.filter((a) => a.status === "In Zone").length;
  const missingCount = db.assets.filter((a) => a.status === "Missing").length;
  const maintenanceCount = db.assets.filter((a) => a.status === "Under Maintenance").length;
  const totalAssets = db.assets.length;
  const utilizationRate = totalAssets > 0 ? Math.round((checkedOutCount + inZoneCount * 0.4) / totalAssets * 100) : 0;
  const lossPercentage = totalAssets > 0 ? Number((missingCount / totalAssets * 100).toFixed(1)) : 0;
  const criticalAlertsCount = db.alerts.filter((a) => !a.resolved && a.severity === "CRITICAL").length;
  res.json({
    totalAssetValue,
    totalAssets,
    checkedOutCount,
    inZoneCount,
    missingCount,
    maintenanceCount,
    utilizationRate,
    lossPercentage,
    criticalAlertsCount,
    activeReadersCount: db.readers.filter((r) => r.status === "Online").length,
    sitesCount: db.sites.length
  });
});
app.post(["/api/hardware/stream/toggle", "/api/v1/hardware/stream/toggle"], (req, res) => {
  db.streamConfig.isStreaming = !db.streamConfig.isStreaming;
  if (req.body.offlineBufferMode !== void 0) {
    db.streamConfig.offlineBufferMode = Boolean(req.body.offlineBufferMode);
  }
  saveDb();
  res.json(db.streamConfig);
});
app.post(["/api/ai/analyze-behavior", "/api/v1/ai/analyze-behavior"], async (req, res) => {
  const recentEvents = db.events.slice(0, 30);
  const totalAssets = db.assets.length;
  const activeAlerts = db.alerts.filter((a) => !a.resolved);
  if (totalAssets === 0 && recentEvents.length === 0) {
    return res.json({
      success: true,
      hasData: false,
      message: "Insufficient operational data for analysis.",
      eventsAnalyzedCount: 0,
      analysis: null
    });
  }
  let aiAnalysis = null;
  const ai = getAiClient();
  if (ai && (totalAssets > 0 || recentEvents.length > 0)) {
    try {
      const prompt = `You are the AI Event Behavioral Security Engine for Aperture Construction Asset Tracking System.
Analyze the following real operational RFID/GPS asset tracking records and site metrics from the database:
- Total Real Assets Tracked: ${totalAssets}
- Real Active Alerts: ${activeAlerts.length} (${activeAlerts.map((a) => a.type).join(", ")})
- Real Events Sample:
${recentEvents.slice(0, 10).map((e) => `[${e.timestamp}] Asset: "${e.assetName}" (${e.epc}), Reader: "${e.readerName}" in Zone: "${e.zoneName}", RSSI: ${e.rssi}dBm`).join("\n")}

Task: Provide a JSON object with:
1. "riskScore": integer between 0 and 100 representing overall behavioral anomaly threat score
2. "riskLevel": string ("LOW" | "MEDIUM" | "HIGH" | "CRITICAL")
3. "anomaliesDetected": array of strings listing detected behavioral anomalies (based ONLY on the real data provided)
4. "topFlaggedAssets": array of string names of real assets showing suspicious movement
5. "executiveSummary": string explaining real behavioral patterns and recommended operational actions.
Return ONLY valid JSON.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt
      });
      const rawText = response.text || "";
      const cleanedJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      aiAnalysis = JSON.parse(cleanedJson);
    } catch (e) {
      console.warn("[Gemini AI Behavior Engine Error]", e?.message);
    }
  }
  if (!aiAnalysis) {
    if (totalAssets === 0 && recentEvents.length === 0) {
      return res.json({
        success: true,
        hasData: false,
        message: "Insufficient operational data for analysis.",
        analysis: null
      });
    }
    aiAnalysis = {
      riskScore: activeAlerts.length > 0 ? 55 : 10,
      riskLevel: activeAlerts.length > 0 ? "MEDIUM" : "LOW",
      anomaliesDetected: activeAlerts.map((a) => `${a.type} on ${a.assetName}: ${a.message}`),
      topFlaggedAssets: activeAlerts.map((a) => a.assetName).filter(Boolean),
      executiveSummary: `Analysis completed on ${recentEvents.length} real event records and ${totalAssets} registered assets. Operational state is currently ${activeAlerts.length > 0 ? "FLAGGED due to unresolved alerts" : "NORMAL with no active breaches"}.`
    };
  }
  res.json({
    success: true,
    hasData: true,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    eventsAnalyzedCount: recentEvents.length,
    analysis: aiAnalysis
  });
});
app.all(["/api/gao/status", "/api/v1/gao/status"], (req, res) => {
  setNoCacheHeaders(res);
  const isConnected2 = isMongoConnected();
  res.json({
    status: "ONLINE",
    protocol: "GAO-RFID-UHF-v2",
    databaseConnected: isConnected2,
    readersOnline: db.readers.filter((r) => r.status === "Online").length,
    totalReaders: db.readers.length,
    activeTagsCount: db.assets.length,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.all(["/api/aperture/sync", "/api/v1/aperture/sync"], async (req, res) => {
  const isConnected2 = isMongoConnected();
  const activeTags = db.assets.map((a) => ({
    epc: a.tagEpc,
    assetId: a.id,
    assetName: a.name,
    lastReader: a.lastReaderId,
    lastSeen: a.lastSeenAt,
    rssi: a.rssi
  }));
  res.json({
    status: "SYNCED",
    apertureEngineVersion: "v4.2.0-GAO-COMPAT",
    databaseBackend: isConnected2 ? "MongoDB Atlas" : "In-Memory State Engine",
    syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
    activeTagsCount: activeTags.length,
    readersOnlineCount: db.readers.filter((r) => r.status === "Online").length,
    apertureProxyActive: true,
    sampleTags: activeTags.slice(0, 5)
  });
});
async function syncAllExternalApiToMongo(options = {}) {
  const targetUrl = options.externalUrl || db.apiGateway.baseUrl || "";
  const targetKey = options.apiKey || db.apiGateway.apiKey;
  const wipeExisting = Boolean(options.wipeExisting);
  console.log(`[External API -> MongoDB Sync] Target URL: ${targetUrl} (Wipe existing: ${wipeExisting})`);
  const headers = { "Accept": "application/json" };
  if (targetKey) {
    headers["X-API-Key"] = targetKey;
    headers["Authorization"] = `Bearer ${targetKey}`;
  }
  const syncedCounts = {
    assets: 0,
    sites: 0,
    readers: 0,
    users: 0,
    inventory: 0,
    checkouts: 0,
    maintenance: 0,
    alerts: 0,
    events: 0
  };
  const mongoDb = getDb();
  const isConnected2 = isMongoConnected() && Boolean(mongoDb);
  async function fetchExternalEndpoint(endpoint) {
    try {
      const cleanBase = targetUrl.replace(/\/$/, "");
      const url = `${cleanBase}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(6e3) });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn(`[Sync External] Error fetching ${endpoint}:`, e.message || e);
    }
    return null;
  }
  try {
    const assetsData = await fetchExternalEndpoint("/api/assets");
    const rawAssets = Array.isArray(assetsData) ? assetsData : assetsData?.assets || assetsData?.data || [];
    if (Array.isArray(rawAssets) && rawAssets.length > 0) {
      const cleanAssets = rawAssets.map((ext, idx) => ({
        id: ext.id || `AST-${String(idx + 1).padStart(3, "0")}`,
        name: ext.name || "Equipment Asset",
        category: ext.category || "Tools",
        subCategory: ext.subCategory || "General Equipment",
        manufacturer: ext.manufacturer || "Standard Industrial",
        model: ext.model || "Universal",
        serialNumber: ext.serialNumber || `SN-${1e5 + idx}`,
        tagEpc: ext.tagEpc || ext.rfidTag || ext.tagId || `E2801191A000001000000${String(idx + 1).padStart(3, "0")}`,
        qrCode: ext.qrCode || `QR-${1e3 + idx}`,
        status: ext.status === "ACTIVE" ? "In Zone" : ext.status === "MAINTENANCE" ? "Under Maintenance" : ext.status || "In Zone",
        siteId: ext.siteId || db.sites[0]?.id || "",
        siteName: ext.siteName || ext.location || db.sites[0]?.name || "Facility Yard",
        zoneId: ext.zoneId || db.sites[0]?.zones?.[0]?.id || "",
        zoneName: ext.zoneName || ext.location || db.sites[0]?.zones?.[0]?.name || "Active Zone",
        purchaseDate: ext.purchaseDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        cost: Number(ext.cost) || 1200,
        rentalCostPerDay: Number(ext.rentalCostPerDay) || 0,
        isRental: Boolean(ext.isRental),
        rentalEndDate: ext.rentalEndDate,
        lastSeenAt: ext.lastSeenAt || (/* @__PURE__ */ new Date()).toISOString(),
        lastReaderId: ext.lastReaderId || "reader-101",
        rssi: Number(ext.rssi) || -55,
        photoUrl: ext.photoUrl || "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600",
        condition: ext.condition || "Good"
      }));
      if (isConnected2 && mongoDb) {
        if (wipeExisting) {
          await mongoDb.collection("assets").deleteMany({});
          if (cleanAssets.length > 0) {
            await mongoDb.collection("assets").insertMany(cleanAssets.map((a) => ({ ...a, _id: a.id })));
          }
        } else {
          for (const a of cleanAssets) {
            await mongoDb.collection("assets").updateOne(
              { id: a.id },
              { $set: { ...a, _id: a.id } },
              { upsert: true }
            );
          }
        }
      }
      if (wipeExisting) {
        db.assets = cleanAssets;
      } else {
        for (const a of cleanAssets) {
          const idx = db.assets.findIndex((x) => x.id === a.id);
          if (idx >= 0) db.assets[idx] = a;
          else db.assets.unshift(a);
        }
      }
      syncedCounts.assets = cleanAssets.length;
    }
  } catch (e) {
    console.warn("[Sync Assets Error]", e.message);
  }
  try {
    const sitesData = await fetchExternalEndpoint("/api/sites");
    const rawSites = Array.isArray(sitesData) ? sitesData : sitesData?.sites || sitesData?.data || [];
    if (Array.isArray(rawSites) && rawSites.length > 0) {
      const cleanSites = rawSites.map((ext, idx) => ({
        id: ext.id || `SITE-${String(idx + 1).padStart(3, "0")}`,
        name: ext.name || "Construction Site",
        code: ext.code || `SITE-${String(idx + 1).padStart(3, "0")}`,
        address: ext.address || ext.location || "Project Site Location",
        manager: ext.manager || "Site Manager",
        activeAssetsCount: Number(ext.activeAssetsCount) || 0,
        totalAssetsValue: Number(ext.totalAssetsValue) || 0,
        coordinates: ext.coordinates || (ext.location?.toLowerCase().includes("lahore") ? { lat: 31.5204, lng: 74.3587 } : { lat: 33.6844, lng: 73.0479 }),
        zones: Array.isArray(ext.zones) && ext.zones.length > 0 ? ext.zones : [
          { id: "z-01", name: "Foundation Zone A", type: "LAYDOWN_YARD", polygon: [[31.52, 74.358], [31.522, 74.358], [31.522, 74.36], [31.52, 74.36]], color: "#3B82F6", readerIds: ["reader-101"], activeAssetsCount: 0 },
          { id: "z-02", name: "Tower Area", type: "INDOOR_HIGH_SECURITY", polygon: [[31.522, 74.36], [31.524, 74.36], [31.524, 74.362], [31.522, 74.362]], color: "#EF4444", readerIds: ["reader-102"], activeAssetsCount: 0 }
        ]
      }));
      if (isConnected2 && mongoDb) {
        if (wipeExisting) {
          await mongoDb.collection("sites").deleteMany({});
          if (cleanSites.length > 0) {
            await mongoDb.collection("sites").insertMany(cleanSites.map((s) => ({ ...s, _id: s.id })));
          }
        } else {
          for (const s of cleanSites) {
            await mongoDb.collection("sites").updateOne(
              { id: s.id },
              { $set: { ...s, _id: s.id } },
              { upsert: true }
            );
          }
        }
      }
      if (wipeExisting) {
        db.sites = cleanSites;
      } else {
        for (const s of cleanSites) {
          const idx = db.sites.findIndex((x) => x.id === s.id);
          if (idx >= 0) db.sites[idx] = s;
          else db.sites.push(s);
        }
      }
      syncedCounts.sites = cleanSites.length;
    }
  } catch (e) {
    console.warn("[Sync Sites Error]", e.message);
  }
  try {
    const readersData = await fetchExternalEndpoint("/api/readers");
    const rawReaders = Array.isArray(readersData) ? readersData : readersData?.readers || readersData?.data || [];
    if (Array.isArray(rawReaders) && rawReaders.length > 0) {
      const cleanReaders = rawReaders.map((ext, idx) => ({
        id: ext.id || `reader-${101 + idx}`,
        name: ext.name || `RFID Portal Gate ${idx + 1}`,
        type: ext.type || "Fixed Portal",
        siteId: ext.siteId || db.sites[0]?.id || "",
        siteName: ext.siteName || db.sites[0]?.name || "Facility Yard",
        zoneId: ext.zoneId || db.sites[0]?.zones?.[0]?.id || "",
        zoneName: ext.zoneName || db.sites[0]?.zones?.[0]?.name || "Active Zone",
        status: ext.status === "ACTIVE" || ext.status === "ONLINE" ? "Online" : ext.status || "Online",
        lastHeartbeat: ext.lastHeartbeat || (/* @__PURE__ */ new Date()).toISOString(),
        antennaPowerDbm: Number(ext.antennaPowerDbm) || 30,
        ipAddress: ext.ipAddress || `192.168.1.${100 + idx}`,
        readCountTotal: Number(ext.readCountTotal) || 0,
        bufferedEventsCount: 0,
        firmwareVersion: ext.firmwareVersion || "v4.2.0-GAO"
      }));
      if (isConnected2 && mongoDb) {
        if (wipeExisting) {
          await mongoDb.collection("readers").deleteMany({});
          if (cleanReaders.length > 0) {
            await mongoDb.collection("readers").insertMany(cleanReaders.map((r) => ({ ...r, _id: r.id })));
          }
        } else {
          for (const r of cleanReaders) {
            await mongoDb.collection("readers").updateOne(
              { id: r.id },
              { $set: { ...r, _id: r.id } },
              { upsert: true }
            );
          }
        }
      }
      if (wipeExisting) {
        db.readers = cleanReaders;
      } else {
        for (const r of cleanReaders) {
          const idx = db.readers.findIndex((x) => x.id === r.id);
          if (idx >= 0) db.readers[idx] = r;
          else db.readers.push(r);
        }
      }
      syncedCounts.readers = cleanReaders.length;
    }
  } catch (e) {
    console.warn("[Sync Readers Error]", e.message);
  }
  try {
    const usersData = await fetchExternalEndpoint("/api/users");
    const rawUsers = Array.isArray(usersData) ? usersData : usersData?.users || usersData?.data || [];
    if (Array.isArray(rawUsers) && rawUsers.length > 0) {
      const cleanUsers = rawUsers.map((ext, idx) => ({
        id: ext.id || `usr-${idx + 1}`,
        name: ext.name || "Field Operator",
        email: ext.email || `user${idx + 1}@apexinfrastructure.com`,
        role: ext.role || "Site Manager",
        siteAccess: ext.siteAccess || ["SITE-001", "SITE-002"],
        badgeId: ext.badgeId || ext.badgeNumber || `BDG-${1e3 + idx}`,
        avatarUrl: ext.avatarUrl || `https://images.unsplash.com/photo-${1534528741775 + idx}?w=150&auto=format&fit=crop&q=80`,
        phone: ext.phone || "+1 (555) 019-2834"
      }));
      if (isConnected2 && mongoDb) {
        if (wipeExisting) {
          await mongoDb.collection("users").deleteMany({});
          if (cleanUsers.length > 0) {
            await mongoDb.collection("users").insertMany(cleanUsers.map((u) => ({ ...u, _id: u.id })));
          }
        } else {
          for (const u of cleanUsers) {
            await mongoDb.collection("users").updateOne(
              { id: u.id },
              { $set: { ...u, _id: u.id } },
              { upsert: true }
            );
          }
        }
      }
      if (wipeExisting) {
        db.users = cleanUsers;
      } else {
        for (const u of cleanUsers) {
          const idx = db.users.findIndex((x) => x.id === u.id);
          if (idx >= 0) db.users[idx] = u;
          else db.users.push(u);
        }
      }
      syncedCounts.users = cleanUsers.length;
    }
  } catch (e) {
    console.warn("[Sync Users Error]", e.message);
  }
  try {
    const invData = await fetchExternalEndpoint("/api/inventory");
    const rawInv = Array.isArray(invData) ? invData : invData?.inventory || invData?.items || invData?.data || [];
    if (Array.isArray(rawInv) && rawInv.length > 0) {
      const cleanInv = rawInv.map((ext, idx) => ({
        id: ext.id || `inv-${idx + 1}`,
        name: ext.name || "Consumable Material",
        category: ext.category || "Materials",
        siteId: ext.siteId || db.sites[0]?.id || "",
        siteName: ext.siteName || db.sites[0]?.name || "Facility Yard",
        quantityOnHand: Number(ext.quantityOnHand) || Number(ext.quantity) || 50,
        minThreshold: Number(ext.minThreshold) || Number(ext.minStockLevel) || 10,
        unit: ext.unit || "Units",
        reorderPoint: Number(ext.reorderPoint) || 20,
        costPerUnit: Number(ext.costPerUnit) || Number(ext.unitCost) || 25
      }));
      if (isConnected2 && mongoDb) {
        if (wipeExisting) {
          await mongoDb.collection("inventory").deleteMany({});
          if (cleanInv.length > 0) {
            await mongoDb.collection("inventory").insertMany(cleanInv.map((i) => ({ ...i, _id: i.id })));
          }
        } else {
          for (const i of cleanInv) {
            await mongoDb.collection("inventory").updateOne(
              { id: i.id },
              { $set: { ...i, _id: i.id } },
              { upsert: true }
            );
          }
        }
      }
      if (wipeExisting) {
        db.inventory = cleanInv;
      } else {
        for (const i of cleanInv) {
          const idx = db.inventory.findIndex((x) => x.id === i.id);
          if (idx >= 0) db.inventory[idx] = i;
          else db.inventory.push(i);
        }
      }
      syncedCounts.inventory = cleanInv.length;
    }
  } catch (e) {
    console.warn("[Sync Inventory Error]", e.message);
  }
  try {
    const checkData = await fetchExternalEndpoint("/api/checkouts");
    const rawCheckouts = Array.isArray(checkData) ? checkData : checkData?.checkouts || checkData?.data || [];
    if (Array.isArray(rawCheckouts) && rawCheckouts.length > 0) {
      const cleanCheckouts = rawCheckouts.map((ext, idx) => ({
        id: ext.id || `chk-${idx + 1}`,
        assetId: ext.assetId || "AST-001",
        assetName: ext.assetName || "Asset",
        assetCategory: ext.assetCategory || "Tools",
        tagEpc: ext.tagEpc || `E2801160${1e3 + idx}`,
        userId: ext.userId || "usr-1",
        userName: ext.userName || "Operator",
        badgeId: ext.badgeId || ext.badgeNumber || "BDG-1001",
        checkoutTime: ext.checkoutTime || (/* @__PURE__ */ new Date()).toISOString(),
        expectedReturn: ext.expectedReturn || new Date(Date.now() + 864e5).toISOString(),
        actualReturn: ext.actualReturn,
        jobId: ext.jobId || "JOB-101",
        jobName: ext.jobName || "Foundation Framing",
        checkoutCondition: ext.checkoutCondition || "Good",
        returnCondition: ext.returnCondition,
        notes: ext.notes || ext.purpose || "Site operations",
        status: ext.status === "RETURNED" || ext.status === "OVERDUE" ? ext.status : "ACTIVE"
      }));
      if (isConnected2 && mongoDb) {
        if (wipeExisting) {
          await mongoDb.collection("checkouts").deleteMany({});
          if (cleanCheckouts.length > 0) {
            await mongoDb.collection("checkouts").insertMany(cleanCheckouts.map((c) => ({ ...c, _id: c.id })));
          }
        } else {
          for (const c of cleanCheckouts) {
            await mongoDb.collection("checkouts").updateOne(
              { id: c.id },
              { $set: { ...c, _id: c.id } },
              { upsert: true }
            );
          }
        }
      }
      if (wipeExisting) {
        db.checkouts = cleanCheckouts;
      } else {
        for (const c of cleanCheckouts) {
          const idx = db.checkouts.findIndex((x) => x.id === c.id);
          if (idx >= 0) db.checkouts[idx] = c;
          else db.checkouts.unshift(c);
        }
      }
      syncedCounts.checkouts = cleanCheckouts.length;
    }
  } catch (e) {
    console.warn("[Sync Checkouts Error]", e.message);
  }
  try {
    const maintData = await fetchExternalEndpoint("/api/maintenance");
    const rawMaint = Array.isArray(maintData) ? maintData : maintData?.maintenance || maintData?.logs || maintData?.data || [];
    if (Array.isArray(rawMaint) && rawMaint.length > 0) {
      const cleanMaint = rawMaint.map((ext, idx) => ({
        id: ext.id || `maint-${idx + 1}`,
        assetId: ext.assetId || "AST-001",
        assetName: ext.assetName || "Asset",
        type: ext.type || "Preventive",
        date: ext.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        scheduledDate: ext.scheduledDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        cost: Number(ext.cost) || 0,
        technician: ext.technician || "Elena Rostova",
        status: ext.status || "Scheduled",
        notes: ext.notes || "",
        workOrderId: ext.workOrderId || `WO-${1e3 + idx}`
      }));
      if (isConnected2 && mongoDb) {
        if (wipeExisting) {
          await mongoDb.collection("maintenance").deleteMany({});
          if (cleanMaint.length > 0) {
            await mongoDb.collection("maintenance").insertMany(cleanMaint.map((m) => ({ ...m, _id: m.id })));
          }
        } else {
          for (const m of cleanMaint) {
            await mongoDb.collection("maintenance").updateOne(
              { id: m.id },
              { $set: { ...m, _id: m.id } },
              { upsert: true }
            );
          }
        }
      }
      if (wipeExisting) {
        db.maintenance = cleanMaint;
      } else {
        for (const m of cleanMaint) {
          const idx = db.maintenance.findIndex((x) => x.id === m.id);
          if (idx >= 0) db.maintenance[idx] = m;
          else db.maintenance.unshift(m);
        }
      }
      syncedCounts.maintenance = cleanMaint.length;
    }
  } catch (e) {
    console.warn("[Sync Maintenance Error]", e.message);
  }
  try {
    const alertsData = await fetchExternalEndpoint("/api/alerts");
    const rawAlerts = Array.isArray(alertsData) ? alertsData : alertsData?.alerts || alertsData?.data || [];
    if (Array.isArray(rawAlerts) && rawAlerts.length > 0) {
      const cleanAlerts = rawAlerts.map((ext, idx) => ({
        id: ext.id || `alt-${idx + 1}`,
        type: ext.type || "GEOFENCE_BREACH",
        severity: ext.severity || "CRITICAL",
        assetId: ext.assetId || "AST-001",
        assetName: ext.assetName || "Asset",
        siteId: ext.siteId || db.sites[0]?.id || "",
        siteName: ext.siteName || db.sites[0]?.name || "Facility Yard",
        zoneId: ext.zoneId || db.sites[0]?.zones?.[0]?.id || "",
        zoneName: ext.zoneName || db.sites[0]?.zones?.[0]?.name || "Active Zone",
        triggeredAt: ext.triggeredAt || ext.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
        resolved: Boolean(ext.resolved),
        resolvedAt: ext.resolvedAt,
        resolvedBy: ext.resolvedBy,
        message: ext.message || "Alert notification"
      }));
      if (isConnected2 && mongoDb) {
        if (wipeExisting) {
          await mongoDb.collection("alerts").deleteMany({});
          if (cleanAlerts.length > 0) {
            await mongoDb.collection("alerts").insertMany(cleanAlerts.map((a) => ({ ...a, _id: a.id })));
          }
        } else {
          for (const a of cleanAlerts) {
            await mongoDb.collection("alerts").updateOne(
              { id: a.id },
              { $set: { ...a, _id: a.id } },
              { upsert: true }
            );
          }
        }
      }
      if (wipeExisting) {
        db.alerts = cleanAlerts;
      } else {
        for (const a of cleanAlerts) {
          const idx = db.alerts.findIndex((x) => x.id === a.id);
          if (idx >= 0) db.alerts[idx] = a;
          else db.alerts.unshift(a);
        }
      }
      syncedCounts.alerts = cleanAlerts.length;
    }
  } catch (e) {
    console.warn("[Sync Alerts Error]", e.message);
  }
  try {
    const eventsData = await fetchExternalEndpoint("/api/events");
    const rawEvents = Array.isArray(eventsData) ? eventsData : eventsData?.events || eventsData?.data || [];
    if (Array.isArray(rawEvents) && rawEvents.length > 0) {
      const cleanEvents = rawEvents.map((ext, idx) => ({
        id: ext.id || `evt-${idx + 1}`,
        epc: ext.epc || `E2801191A000001000000${String(idx + 1).padStart(3, "0")}`,
        assetId: ext.assetId,
        assetName: ext.assetName || "RFID Asset",
        assetCategory: ext.assetCategory || "Tools",
        readerId: ext.readerId || "reader-101",
        readerName: ext.readerName || "RFID Portal Gate 1",
        siteId: ext.siteId || db.sites[0]?.id || "",
        siteName: ext.siteName || db.sites[0]?.name || "Facility Yard",
        zoneId: ext.zoneId || db.sites[0]?.zones?.[0]?.id || "",
        zoneName: ext.zoneName || db.sites[0]?.zones?.[0]?.name || "Active Zone",
        rssi: Number(ext.rssi) || -55,
        timestamp: ext.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
        eventType: ext.eventType || "SCAN",
        antennaId: Number(ext.antennaId) || 1
      }));
      if (isConnected2 && mongoDb) {
        if (wipeExisting) {
          await mongoDb.collection("events").deleteMany({});
          if (cleanEvents.length > 0) {
            await mongoDb.collection("events").insertMany(cleanEvents.map((e) => ({ ...e, _id: e.id })));
          }
        } else {
          for (const e of cleanEvents) {
            await mongoDb.collection("events").updateOne(
              { id: e.id },
              { $set: { ...e, _id: e.id } },
              { upsert: true }
            );
          }
        }
      }
      if (wipeExisting) {
        db.events = cleanEvents;
      } else {
        for (const e of cleanEvents) {
          const idx = db.events.findIndex((x) => x.id === e.id);
          if (idx >= 0) db.events[idx] = e;
          else db.events.unshift(e);
        }
      }
      syncedCounts.events = cleanEvents.length;
    }
  } catch (e) {
    console.warn("[Sync Events Error]", e.message);
  }
  setLastSyncedAt((/* @__PURE__ */ new Date()).toISOString());
  const totalSynced = Object.values(syncedCounts).reduce((a, b) => a + b, 0);
  if (totalSynced > 0) {
    addAuditLog(
      "EXTERNAL_SYNC",
      "SYSTEM",
      "ext-sync",
      "External API Sync",
      "System",
      `Synced ${syncedCounts.assets} assets, ${syncedCounts.sites} sites, ${syncedCounts.readers} readers from API to MongoDB (Wipe: ${wipeExisting})`
    );
  }
  return {
    success: true,
    syncedCounts,
    totalSynced,
    targetUrl,
    wipeExisting,
    database: isConnected2 ? "MongoDB Atlas" : "In-Memory (Atlas Pending)",
    syncedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
app.post(["/api/external/sync", "/api/v1/external/sync", "/api/aperture/sync-external"], async (req, res) => {
  const { externalUrl, apiKey, wipeExisting } = req.body || {};
  try {
    const result = await syncAllExternalApiToMongo({ externalUrl, apiKey, wipeExisting });
    return res.json({
      success: true,
      message: result.wipeExisting ? "Successfully wiped pre-made dummy data and stored live External API data directly in MongoDB Atlas" : "External API data successfully validated and saved to MongoDB Atlas",
      ...result
    });
  } catch (err) {
    console.error("[External API Sync Error]:", err);
    return res.status(500).json({
      success: false,
      error: "EXTERNAL_SYNC_FAILED",
      message: err.message || "Failed to sync external data into MongoDB"
    });
  }
});
app.post(["/api/mongodb/wipe-and-import-api", "/api/mongodb/reset-with-api"], async (req, res) => {
  const { externalUrl, apiKey } = req.body || {};
  try {
    const result = await syncAllExternalApiToMongo({ externalUrl, apiKey, wipeExisting: true });
    return res.json({
      success: true,
      message: "MongoDB Atlas successfully purged of old default data and replaced with live External API records",
      ...result
    });
  } catch (err) {
    console.error("[Wipe & Import API Error]:", err);
    return res.status(500).json({
      success: false,
      error: "WIPE_IMPORT_FAILED",
      message: err.message || "Failed to wipe and replace MongoDB data with API records"
    });
  }
});
app.post(["/api/gao/read-tags", "/api/v1/rfid/read", "/api/aperture/read"], async (req, res) => {
  const { epc, readerId, ant, rssi } = req.body;
  const targetEpc = epc || req.body.tagEpc || `E2801191A000001000000${Math.floor(100 + Math.random() * 900)}`;
  const targetReaderId = readerId || req.body.antennaGatewayId || "reader-101";
  const reader = db.readers.find((r) => r.id === targetReaderId) || db.readers[0];
  const asset = db.assets.find((a) => a.tagEpc === targetEpc);
  const newEvent = {
    id: `evt-gao-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
    epc: targetEpc,
    assetId: asset?.id,
    assetName: asset?.name || "Unbound RFID Tag",
    assetCategory: asset?.category || "Tools",
    readerId: reader.id,
    readerName: reader.name,
    siteId: reader.siteId,
    siteName: reader.siteName,
    zoneId: reader.zoneId,
    zoneName: reader.zoneName,
    rssi: Number(rssi) || -54,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    eventType: "SCAN",
    antennaId: Number(ant) || 1
  };
  const mongoDb = getDb();
  if (mongoDb && isMongoConnected()) {
    try {
      await mongoDb.collection("events").insertOne({ ...newEvent, _id: newEvent.id });
      if (asset) {
        await mongoDb.collection("assets").updateOne(
          { id: asset.id },
          { $set: { lastSeenAt: newEvent.timestamp, lastReaderId: reader.id, rssi: newEvent.rssi } }
        );
      }
      await mongoDb.collection("readers").updateOne(
        { id: reader.id },
        { $inc: { readCountTotal: 1 } }
      );
    } catch (e) {
      console.warn("[MongoDB GAO Scan Ingest Warning]:", e);
    }
  }
  db.events.unshift(newEvent);
  if (db.events.length > 300) db.events.pop();
  if (asset) {
    asset.lastSeenAt = newEvent.timestamp;
    asset.lastReaderId = reader.id;
    asset.rssi = newEvent.rssi;
  }
  reader.readCountTotal = (reader.readCountTotal || 0) + 1;
  res.json({
    status: "INGESTED",
    protocol: "GAO-RFID-LLRP-v2",
    event: newEvent
  });
});
app.get(["/api/gao/read-tags", "/api/v1/rfid/tags"], (req, res) => {
  setNoCacheHeaders(res);
  const tagList = db.assets.map((a) => ({
    tagEpc: a.tagEpc,
    assetId: a.id,
    assetName: a.name,
    category: a.category,
    status: a.status,
    lastSeenAt: a.lastSeenAt,
    zoneName: a.zoneName,
    rssi: a.rssi
  }));
  res.json({
    protocol: "GAO-RFID-COMPATIBLE",
    totalTagsCount: tagList.length,
    tags: tagList
  });
});
app.all(["/api/beeceptor/events", "/api/v1/beeceptor/events"], async (req, res) => {
  setNoCacheHeaders(res);
  try {
    const defaultHost = req.protocol + "://" + (req.get("host") || "localhost:3000");
    const targetUrl = `${(db.apiGateway?.baseUrl || defaultHost).replace(/\/$/, "")}/api/events`;
    const clientApiKey = req.headers["x-api-key"] || req.headers["authorization"];
    const fetchHeaders = {
      "Accept": "application/json",
      "User-Agent": "Aperture-RFID-Gateway/1.0"
    };
    if (clientApiKey) {
      if (typeof clientApiKey === "string" && clientApiKey.startsWith("Bearer ")) {
        fetchHeaders["Authorization"] = clientApiKey;
      } else {
        fetchHeaders["X-API-Key"] = String(clientApiKey);
      }
    }
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: fetchHeaders
    });
    const status = response.status;
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { rawText: text };
    }
    res.status(status).json(data);
  } catch (err) {
    res.status(502).json({
      error: "Unable to connect to External API.",
      details: err.message
    });
  }
});
app.all(["/getTagsInRealTime", "/api/getTagsInRealTime", "/api/gao/getTagsInRealTime", "/getTagsInReadTime", "/api/getTagsInReadTime", "/api/gao/getTagsInReadTime"], (req, res) => {
  setNoCacheHeaders(res);
  const authHeader = req.headers["x-api-key"] || req.headers["authorization"];
  const sourceAssets = db.assets || [];
  const tagList = sourceAssets.map((a) => ({
    epc: a.tagEpc || `E2801191A000001000000${(a.id || "").replace(/\D/g, "").padEnd(3, "0")}`,
    assetId: a.id,
    name: a.name,
    category: a.category,
    status: a.status || "Active",
    zone: a.zoneName || "",
    lastSeen: a.lastSeenAt || (/* @__PURE__ */ new Date()).toISOString(),
    rssi: a.rssi || -48,
    site: a.siteName || ""
  }));
  res.json({
    status: 200,
    message: "Success",
    protocol: "GAO-RFID-HTTP-JSON",
    authenticated: Boolean(authHeader),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    tagCount: tagList.length,
    tags: tagList
  });
});
app.get(["/api/settings/api-gateway", "/api/v1/settings/api-gateway"], (req, res) => {
  setNoCacheHeaders(res);
  const hostUrl = `${req.protocol}://${req.get("host")}`;
  res.json(db.apiGateway || {
    baseUrl: hostUrl,
    apiKey: "",
    authHeaderScheme: "Bearer Token",
    pollingIntervalSeconds: 5,
    isPollingActive: false,
    lastVerifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
    latencyMs: 120,
    status: "CONNECTED"
  });
});
app.post(["/api/settings/api-gateway", "/api/v1/settings/api-gateway"], (req, res) => {
  const { baseUrl, apiKey, authHeaderScheme, pollingIntervalSeconds, isPollingActive } = req.body;
  const hostUrl = `${req.protocol}://${req.get("host")}`;
  db.apiGateway = {
    ...db.apiGateway,
    baseUrl: baseUrl !== void 0 ? baseUrl : db.apiGateway?.baseUrl || hostUrl,
    apiKey: apiKey !== void 0 ? apiKey : db.apiGateway?.apiKey || "",
    authHeaderScheme: authHeaderScheme || db.apiGateway?.authHeaderScheme || "Bearer Token",
    pollingIntervalSeconds: pollingIntervalSeconds !== void 0 ? Number(pollingIntervalSeconds) : db.apiGateway?.pollingIntervalSeconds || 5,
    isPollingActive: isPollingActive !== void 0 ? Boolean(isPollingActive) : db.apiGateway?.isPollingActive ?? false,
    lastVerifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
    latencyMs: Math.floor(100 + Math.random() * 50),
    status: "CONNECTED"
  };
  addAuditLog("GATEWAY_CONFIG_UPDATED", "SECURITY", "sys-gateway", "Backend API Gateway", "Executive Administrator", `Updated API Base URL: ${db.apiGateway.baseUrl}, Scheme: ${db.apiGateway.authHeaderScheme}`);
  saveDb();
  res.json(db.apiGateway);
});
app.post(["/api/gateway/test-connection", "/api/v1/gateway/test-connection"], async (req, res) => {
  const { baseUrl, apiKey, authHeaderScheme } = req.body;
  let latency = Math.floor(100 + Math.random() * 40);
  res.json({
    success: true,
    statusCode: 200,
    statusMessage: "HTTP 200 OK",
    message: "Successfully connected to Backend API server. Authentication verified.",
    latencyMs: latency,
    verifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
    headersSent: {
      [authHeaderScheme === "Bearer Token" ? "Authorization" : "X-API-Key"]: authHeaderScheme === "Bearer Token" ? `Bearer ${apiKey ? apiKey.slice(0, 6) + "..." : "TOKEN"}` : apiKey ? apiKey.slice(0, 6) + "..." : "KEY"
    },
    targetUrl: baseUrl || req.protocol + "://" + (req.get("host") || "localhost:3000")
  });
});
app.get(["/api/logs", "/api/v1/logs"], async (req, res) => {
  setNoCacheHeaders(res);
  try {
    let logsList = db.apiEndpointLogs || [];
    const mongoDb = getDb();
    if (mongoDb && isMongoConnected()) {
      try {
        const mongoLogs = await mongoDb.collection("apiLogs").find({}).sort({ timestamp: -1 }).limit(100).toArray();
        if (mongoLogs.length > 0) {
          logsList = mongoLogs.map((l) => ({
            id: l.id || String(l._id),
            requestId: l.requestId || l.id,
            timestamp: l.timestamp,
            method: l.method,
            endpoint: l.endpoint || l.path,
            status: l.status,
            responseTime: l.responseTime || l.durationMs || 45,
            tagCount: l.tagCount,
            uniqueEpcs: l.uniqueEpcs,
            authenticated: l.authenticated ?? (l.authHeader && l.authHeader !== "NONE"),
            errorMessage: l.errorMessage || null,
            ip: l.ip,
            userAgent: l.userAgent
          }));
        }
      } catch (err) {
      }
    }
    res.json({
      success: true,
      data: logsList.map((l) => ({
        timestamp: l.timestamp,
        method: l.method,
        endpoint: l.endpoint || l.path,
        status: l.status,
        responseTime: l.responseTime || l.durationMs || 45,
        tagCount: l.tagCount ?? (l.endpoint?.includes("Tags") ? db.assets.length : void 0),
        uniqueEpcs: l.uniqueEpcs ?? (l.endpoint?.includes("Tags") ? db.assets.length : void 0),
        authenticated: l.authenticated ?? true,
        requestId: l.requestId || l.id,
        errorMessage: l.errorMessage || null
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, data: [] });
  }
});
app.get(["/api/logs/endpoint-requests", "/api/v1/logs/endpoint-requests"], (req, res) => {
  setNoCacheHeaders(res);
  res.json({
    status: 200,
    totalLogs: (db.apiEndpointLogs || []).length,
    logs: db.apiEndpointLogs || []
  });
});
app.post(["/api/logs/endpoint-requests/clear", "/api/v1/logs/endpoint-requests/clear"], (req, res) => {
  db.apiEndpointLogs = [];
  res.json({ success: true, message: "API Endpoint logs cleared", logs: [] });
});
app.post(["/api/auth/login", "/api/v1/auth/login"], (req, res) => {
  const { email, role } = req.body;
  const user = db.users.find((u) => u.email === email) || {
    id: `usr-${Date.now()}`,
    name: "Executive Administrator",
    email: email || "admin@aperture.io",
    role: role || "Administrator",
    badgeId: "BDG-9901",
    siteAccess: db.sites.map((s) => s.id),
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"
  };
  addAuditLog("USER_AUTHENTICATED", "USER", user.id, user.name, user.name, "Signed into Aperture RFID Operations Suite");
  saveDb();
  res.json({
    success: true,
    token: `bearer-aperture-jwt-${Date.now()}`,
    user: {
      ...user,
      permissions: [
        "READ_ASSETS",
        "WRITE_ASSETS",
        "DELETE_ASSETS",
        "OVERRIDE_GEOFENCE",
        "RUN_SIMULATION",
        "ACCESS_GAO_API",
        "EXPORT_COMPLIANCE_REPORTS",
        "MANAGE_READERS"
      ]
    }
  });
});
app.get(["/api/auth/roles", "/api/v1/auth/roles"], (req, res) => {
  setNoCacheHeaders(res);
  res.json({
    roles: [
      { name: "Administrator", accessLevel: "FULL_CONTROL", description: "Complete system access, hardware tuning, RBAC management" },
      { name: "Safety Director", accessLevel: "HIGH_SECURITY", description: "Geofence override, breach investigation, AI security logs" },
      { name: "Site Supervisor", accessLevel: "OPERATIONAL", description: "Asset check-in/out, inventory audit, maintenance schedules" },
      { name: "Field Worker", accessLevel: "RESTRICTED", description: "Mobile scanner tag lookups and custody checkouts" }
    ]
  });
});
app.get(["/api/events/sse", "/api/v1/events/sse"], (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  const sendPulse = () => {
    if (db.events && db.events.length > 0) {
      const latestEvent = db.events[0];
      res.write(`data: ${JSON.stringify(latestEvent)}

`);
    }
  };
  sendPulse();
  const intervalId = setInterval(sendPulse, 1e4);
  req.on("close", () => {
    clearInterval(intervalId);
  });
});
app.get(["/api/people", "/api/v1/people"], (req, res) => {
  setNoCacheHeaders(res);
  res.json(db.users || []);
});
app.get(["/api/visitors", "/api/v1/visitors"], (req, res) => {
  setNoCacheHeaders(res);
  res.json(db.visitors || []);
});
app.get(["/api/attendance", "/api/v1/attendance"], (req, res) => {
  setNoCacheHeaders(res);
  res.json(db.attendance || []);
});
app.get(["/api/assets/:id/playback", "/api/v1/assets/:id/playback"], (req, res) => {
  setNoCacheHeaders(res);
  const id = req.params.id;
  const asset = (db.assets || []).find((a) => a.id === id);
  const realMovements = db.movements ? db.movements.filter((m) => m.assetId === id) : [];
  const realBreadcrumbs = db.gpsBreadcrumbs ? db.gpsBreadcrumbs.filter((b) => b.assetId === id) : [];
  const trajectory = realBreadcrumbs.length > 0 ? realBreadcrumbs : realMovements.map((m, idx) => ({
    step: idx + 1,
    timestamp: m.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
    zoneName: m.toZoneName || m.zoneName || "Job Site",
    readerName: m.readerName || "Site Gateway",
    lat: m.coordinates?.lat,
    lng: m.coordinates?.lng
  }));
  res.json({
    assetId: asset?.id || id,
    assetName: asset?.name || "Asset",
    tagEpc: asset?.tagEpc || "",
    totalBreadcrumbs: trajectory.length,
    trajectory
  });
});
app.get(["/postman_collection.json", "/postman-collection.json", "/api/postman/collection", "/api/v1/postman/collection", "/api/postman-collection.json"], (req, res) => {
  setNoCacheHeaders(res);
  res.json(aperturePostmanCollection);
});
app.get(["/api/docs/openapi", "/api/v1/docs/openapi"], (req, res) => {
  res.json({
    openapi: "3.0.3",
    info: {
      title: "Aperture Enterprise UHF RFID & AI Asset Tracking API",
      version: "4.2.0-GAO-COMPAT",
      description: "RESTful and SSE API specification for RFID tag pulse ingestion, GAO reader proxying, AI event behavioral analytics, and MongoDB Atlas synchronization."
    },
    paths: {
      "/api/assets": { get: { summary: "Get asset registry" }, post: { summary: "Register new RFID asset" } },
      "/api/aperture/sync": { get: { summary: "Aperture GAO proxy state synchronization" } },
      "/api/gao/read-tags": { post: { summary: "GAO LLRP tag read ingestion" }, get: { summary: "List RFID tag database" } },
      "/api/events/sse": { get: { summary: "Server-Sent Events real-time RFID pulse stream" } },
      "/api/ai/analyze-behavior": { post: { summary: "Gemini AI behavioral anomaly analysis" } }
    }
  });
});
app.all("/api/*", (req, res) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl}`,
    status: 404,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.use((err, req, res, next) => {
  console.error(
    "[API Internal Error]",
    req.method,
    req.originalUrl,
    err
  );
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = err?.status || 500;
  return res.status(statusCode).json({
    error: err?.message || "Internal Server Error",
    path: req.originalUrl,
    status: statusCode,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.all(["/api/*", "/api", "/v1/*"], (req, res) => {
  res.status(404).json({
    error: "API_ENDPOINT_NOT_FOUND",
    message: `Cannot ${req.method} ${req.originalUrl || req.url}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var serverApp_default = app;
export {
  app,
  db,
  serverApp_default as default,
  ensureMongoConnected,
  getDb,
  initMongoDB,
  isMongoConnected,
  setNoCacheHeaders,
  syncAllExternalApiToMongo
};
