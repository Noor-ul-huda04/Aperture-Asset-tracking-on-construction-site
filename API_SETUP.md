# Aperture Asset Tracking - API & Database Setup Guide

This guide describes how to configure, run, and integrate the **Aperture RFID & IoT Asset Tracking System** with MongoDB Atlas, external REST APIs (such as Beeceptor), and server-side services.

---

## Architecture Overview

1. **MongoDB Atlas (Persistent Data Engine)**:
   - Serves as the primary persistent database storing Assets, Job Sites, Users, Readers, Checkouts, Maintenance Logs, Alerts, Inventory, and Telemetry Events.
   - Connected via `MONGODB_URI`.
   - On startup, if documents exist in Atlas collections, the application loads them dynamically.
   - No hardcoded seed files or local dummy files (`data_db.json` / `initialData.ts`) are required.

2. **REST API Service Layer**:
   - Built-in Express server exposes REST endpoints (`/api/...`) for complete CRUD operations.
   - All client views fetch and sync data directly via REST endpoints.
   - Polling interval is set to **15 seconds** across client views and background workers to prevent exhausting free API quotas.

3. **External GAO RFID & Beeceptor Gateway Integration**:
   - Connects to external RFID reader endpoints (e.g., Beeceptor mock server or real GAO RFID middleware).
   - Ingests real-time Tag EPC reads, updates asset spatiotemporal coordinates, and generates audit logs.
   - The interactive **Developer API Tester** in the dashboard issues real outbound HTTP requests to the configured gateway URL (`https://<your-subdomain>.free.beeceptor.com`) so requests appear live in endpoint logs.

---

## Environment Variables

To configure persistent storage and AI capabilities, add the following secrets in **Settings > Environment Variables**:

| Variable | Description |
| :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/aperture_asset_db`) |
| `GEMINI_API_KEY` | Gemini API key for server-side AI event behavior anomaly detection |

---

## REST API Endpoints Reference

### 1. Personnel / Users API (`/api/users`)
- **`GET /api/users`**: List all registered personnel and operators.
- **`POST /api/users`**: Register a new user.
  - *Payload*: `{ "name": "Sarah Jenkins", "email": "sjenkins@apex.com", "role": "Site Manager", "badgeId": "BDG-8801", "siteAccess": ["site-1"] }`
- **`PUT /api/users/:id`**: Update existing user details.
- **`PATCH /api/users/:id`**: Patch individual user fields.
- **`DELETE /api/users/:id`**: Delete a user account.

### 2. Assets API (`/api/assets`)
- **`GET /api/assets`**: Retrieve all tracked assets.
- **`POST /api/assets`**: Create a new asset with RFID tag assignment.
- **`PUT /api/assets/:id`**: Update asset status, zone location, or condition.
- **`DELETE /api/assets/:id`**: Remove an asset from inventory.

### 3. Job Sites & Geofence Zones API (`/api/sites`)
- **`GET /api/sites`**: Fetch all construction job sites and zones.
- **`POST /api/sites`**: Add a new job site.

### 4. RFID Tag Ingestion & Inbound Events (`/api/gao/read-tags`)
- **`POST /api/gao/read-tags`**: Ingest an inbound RFID scan event from hardware portals.
  - *Payload*: `{ "epc": "E2801191A000001000000888", "readerId": "reader-101", "rssi": -45 }`

### 5. Interactive Database View (`/api/db`)
- **`GET /api/db`**: Live JSON snapshot of all active collections in memory / MongoDB Atlas.

---

## Quick Start & Verification

1. **Verify Server Health**:
   ```bash
   curl http://localhost:3000/api/health
   ```
2. **Fetch Active Users**:
   ```bash
   curl http://localhost:3000/api/users
   ```
3. **Create a Test User**:
   ```bash
   curl -X POST http://localhost:3000/api/users \
     -H "Content-Type: application/json" \
     -d '{"name":"Alex Rivers","email":"arivers@apex.com","role":"Equipment Operator"}'
   ```
4. **Trigger RFID Tag Read Ingestion**:
   ```bash
   curl -X POST http://localhost:3000/api/gao/read-tags \
     -H "Content-Type: application/json" \
     -d '{"epc":"E2801191A000001000000999","readerId":"reader-101","rssi":-48}'
   ```
