import { 
  Asset, 
  Checkout, 
  Alert, 
  ReadEvent, 
  MaintenanceLog, 
  Reader, 
  Site, 
  InventoryItem, 
  User, 
  AuditLog,
  GaoHistoryRecord,
  GaoRealtimeTag,
  GaoHistoryTotalCountResponse
} from '../types';
import { getHardwareApiConfig } from './hardwareApiConfig';

/**
 * Frontend API Service Layer
 * Primary API Source: GAO RFID UHF Web APIs or Custom Plugged User REST APIs
 */

export const GAO_API_BASE_URL = 'https://www.i360services.com/peopletrackinguhf';

export function getActiveApiBaseUrl(): string {
  const cfg = getHardwareApiConfig();
  if (cfg.baseUrl && cfg.baseUrl.trim()) {
    return cfg.baseUrl.replace(/\/$/, '');
  }
  const envUrl = import.meta.env?.VITE_GAO_API_BASE_URL || import.meta.env?.GAO_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.replace(/\/$/, '');
  }
  return GAO_API_BASE_URL;
}

export const API_BASE_URL = getActiveApiBaseUrl();

export interface ApiLogRecord {
  id: string;
  requestId: string;
  timestamp: string;
  method: string;
  endpoint: string;
  url: string;
  status: number;
  statusText: string;
  responseTime: number;
  requestBody: any;
  responseBody: any;
  success: boolean;
  errorMessage?: string | null;
}

// In-Memory Telemetry / Request Log Store for UI Diagnostics
const apiLogsStore: ApiLogRecord[] = [];

export function getClientApiLogs(): ApiLogRecord[] {
  return [...apiLogsStore];
}

export function clearClientApiLogs(): void {
  apiLogsStore.length = 0;
}

export function recordLog(record: ApiLogRecord) {
  apiLogsStore.unshift(record);
  if (apiLogsStore.length > 200) {
    apiLogsStore.pop();
  }
}

export async function fetchFromApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const cfg = getHardwareApiConfig();
  const baseUrl = getActiveApiBaseUrl();
  const method = (options?.method || 'GET').toUpperCase();
  const targetUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://') 
    ? endpoint 
    : `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const startTime = performance.now();

  let requestBody: any = null;
  if (options?.body) {
    try {
      requestBody = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch {
      requestBody = options.body;
    }
  }

  let statusCode = 0;
  let statusText = '';
  let responseData: any = null;
  let isSuccess = false;
  let errorMsg: string | null = null;

  const customHeaders: Record<string, string> = {};
  if (cfg.apiKey && cfg.apiKey.trim()) {
    const headerName = cfg.authHeaderName || 'X-API-Key';
    if (headerName.toLowerCase() === 'authorization') {
      customHeaders[headerName] = cfg.apiKey.startsWith('Bearer ') ? cfg.apiKey : `Bearer ${cfg.apiKey}`;
    } else {
      customHeaders[headerName] = cfg.apiKey;
    }
  }

  try {
    const res = await fetch(targetUrl, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...customHeaders,
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options?.headers || {})
      }
    });

    statusCode = res.status;
    statusText = res.statusText || (res.ok ? 'OK' : 'Error');

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      responseData = await res.json();
    } else {
      const text = await res.text();
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = text;
      }
    }

    if (!res.ok) {
      errorMsg = (responseData && (responseData.message || responseData.error)) || `API request failed: ${res.status} ${res.statusText || ''}`;
      throw new Error(errorMsg || 'API Request failed');
    } else {
      isSuccess = true;
      return responseData as T;
    }
  } catch (err: any) {
    // If direct browser fetch failed (e.g., CORS restriction), attempt backend gateway proxy fallback
    if (!statusCode && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) && !endpoint.includes('/api/gateway/proxy')) {
      try {
        const proxyRes = await fetch('/api/gateway/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: targetUrl,
            method,
            authHeaderName: cfg.authHeaderName || 'X-API-Key',
            apiKey: cfg.apiKey,
            payload: requestBody
          })
        });
        const proxyJson = await proxyRes.json();
        statusCode = proxyJson.status || proxyRes.status;
        statusText = proxyJson.statusText || 'OK (via Gateway Proxy)';
        responseData = proxyJson.data;

        if (proxyRes.ok && (proxyJson.ok || proxyJson.status === 200)) {
          isSuccess = true;
          return responseData as T;
        } else {
          errorMsg = proxyJson.error || `Gateway proxy request failed with status ${statusCode}`;
          throw new Error(errorMsg);
        }
      } catch (proxyErr: any) {
        errorMsg = proxyErr?.message || err?.message || 'Network Error';
      }
    }

    if (!statusCode) {
      statusCode = 0;
      statusText = 'Network Error';
      errorMsg = err?.message || 'Unable to connect to Aperture Backend API.';
    } else {
      errorMsg = err?.message || `HTTP Error ${statusCode}`;
    }
    throw err;
  } finally {
    const durationMs = Math.round(performance.now() - startTime);
    recordLog({
      id: `apilog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      requestId: `req-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      url: targetUrl,
      status: statusCode,
      statusText,
      responseTime: durationMs,
      requestBody,
      responseBody: responseData,
      success: isSuccess,
      errorMessage: isSuccess ? null : errorMsg
    });
  }
}

function extractArray<T>(data: any, key: string): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object') {
    if (Array.isArray(data[key])) {
      return data[key];
    }
    if (Array.isArray(data.data)) {
      return data.data;
    }
    const foundArray = Object.values(data).find(v => Array.isArray(v));
    if (foundArray) {
      return foundArray as T[];
    }
  }
  return [];
}

// ----------------------------------------------------
// Core Backend API Endpoints (Saved to MongoDB)
// ----------------------------------------------------

export async function getAssets(params?: { siteId?: string; category?: string; status?: string; search?: string }): Promise<Asset[]> {
  const query = new URLSearchParams();
  if (params?.siteId && params.siteId !== 'ALL') query.set('siteId', params.siteId);
  if (params?.category && params.category !== 'ALL') query.set('category', params.category);
  if (params?.status && params.status !== 'ALL') query.set('status', params.status);
  if (params?.search) query.set('search', params.search);

  const endpoint = `/api/assets${query.toString() ? `?${query.toString()}` : ''}`;
  const data = await fetchFromApi<any>(endpoint);
  return extractArray<Asset>(data, 'assets');
}

export async function getAssetById(id: string): Promise<Asset> {
  return fetchFromApi<Asset>(`/api/assets/${id}`);
}

export async function createAsset(data: Partial<Asset>): Promise<Asset> {
  return fetchFromApi<Asset>('/api/assets', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function createAssetsBatch(assets: Partial<Asset>[]): Promise<{ count: number; importedAssets: Asset[] }> {
  return fetchFromApi<{ count: number; importedAssets: Asset[] }>('/api/assets/batch', {
    method: 'POST',
    body: JSON.stringify({ assets })
  });
}

export async function updateAsset(id: string, data: Partial<Asset>): Promise<Asset> {
  return fetchFromApi<Asset>(`/api/assets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteAsset(id: string): Promise<{ success: boolean; id: string }> {
  return fetchFromApi<{ success: boolean; id: string }>(`/api/assets/${id}`, {
    method: 'DELETE'
  });
}

export async function getSites(): Promise<Site[]> {
  const data = await fetchFromApi<any>('/api/sites');
  return extractArray<Site>(data, 'sites');
}

export async function createSite(data: Partial<Site>): Promise<Site> {
  return fetchFromApi<Site>('/api/sites', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getUsers(): Promise<User[]> {
  const data = await fetchFromApi<any>('/api/users');
  return extractArray<User>(data, 'users');
}

export async function createUser(userData: Partial<User>): Promise<User> {
  return fetchFromApi<User>('/api/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

export async function updateUser(userId: string, data: Partial<User>): Promise<User> {
  return fetchFromApi<User>(`/api/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteUser(userId: string): Promise<{ success: boolean; id: string }> {
  return fetchFromApi<{ success: boolean; id: string }>(`/api/users/${userId}`, {
    method: 'DELETE'
  });
}

export async function getReaders(): Promise<Reader[]> {
  const data = await fetchFromApi<any>('/api/readers');
  return extractArray<Reader>(data, 'readers');
}

export async function createReader(data: Partial<Reader>): Promise<Reader> {
  return fetchFromApi<Reader>('/api/readers', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getEvents(): Promise<ReadEvent[]> {
  const data = await fetchFromApi<any>('/api/events');
  return extractArray<ReadEvent>(data, 'events');
}

export async function getCheckouts(): Promise<Checkout[]> {
  const data = await fetchFromApi<any>('/api/checkouts');
  return extractArray<Checkout>(data, 'checkouts');
}

export async function createCheckout(data: { assetId: string; userId: string; jobId?: string; expectedReturnHours?: number; notes?: string; photoUrl?: string }): Promise<Checkout> {
  return fetchFromApi<Checkout>('/api/checkouts', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function returnCheckout(checkoutId: string, condition: string): Promise<Checkout> {
  return fetchFromApi<Checkout>(`/api/checkouts/${checkoutId}/return`, {
    method: 'POST',
    body: JSON.stringify({ condition })
  });
}

export async function getMaintenance(): Promise<MaintenanceLog[]> {
  const data = await fetchFromApi<any>('/api/maintenance');
  return extractArray<MaintenanceLog>(data, 'maintenance');
}

export async function createMaintenance(data: Partial<MaintenanceLog>): Promise<MaintenanceLog> {
  return fetchFromApi<MaintenanceLog>('/api/maintenance', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getInventory(): Promise<InventoryItem[]> {
  const data = await fetchFromApi<any>('/api/inventory');
  return extractArray<InventoryItem>(data, 'inventory');
}

export async function createInventoryItem(data: Partial<InventoryItem>): Promise<InventoryItem> {
  return fetchFromApi<InventoryItem>('/api/inventory', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateInventory(id: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
  return fetchFromApi<InventoryItem>(`/api/inventory/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function getAlerts(): Promise<Alert[]> {
  const data = await fetchFromApi<any>('/api/alerts');
  return extractArray<Alert>(data, 'alerts');
}

export async function resolveAlert(id: string, resolvedBy: string): Promise<Alert> {
  return fetchFromApi<Alert>(`/api/alerts/${id}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify({ resolvedBy })
  });
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const data = await fetchFromApi<any>('/api/audit-logs');
  return extractArray<AuditLog>(data, 'auditLogs');
}

export async function getHealth(): Promise<{ status: string; service: string; timestamp: string }> {
  return fetchFromApi<{ status: string; service: string; timestamp: string }>('/api/health');
}

export async function submitRfidScan(data: { tagId: string; readerId: string; siteId?: string; timestamp?: string }): Promise<{
  status: string;
  message?: string;
  event: any;
}> {
  return fetchFromApi<{ status: string; message?: string; event: any }>('/api/events/scan', {
    method: 'POST',
    body: JSON.stringify({
      tagId: data.tagId,
      readerId: data.readerId,
      siteId: data.siteId || 'SITE-001',
      timestamp: data.timestamp || new Date().toISOString()
    })
  });
}

export async function simulateScan(epc: string, readerId: string, _rssi?: number): Promise<{ event: ReadEvent; assetUpdated: boolean }> {
  const result = await submitRfidScan({
    tagId: epc,
    readerId,
    siteId: 'SITE-001'
  });
  return { event: result.event || result, assetUpdated: true };
}

export async function fetchSummary() {
  return fetchFromApi<any>('/api/reports/summary');
}

export async function syncExternalData(externalUrl?: string, apiKey?: string, wipeExisting?: boolean): Promise<{
  success: boolean;
  message: string;
  syncedCounts: Record<string, number>;
  totalSynced?: number;
  database: string;
  syncedAt: string;
}> {
  return fetchFromApi<{
    success: boolean;
    message: string;
    syncedCounts: Record<string, number>;
    totalSynced?: number;
    database: string;
    syncedAt: string;
  }>('/api/external/sync', {
    method: 'POST',
    body: JSON.stringify({ externalUrl, apiKey, wipeExisting })
  });
}

export async function wipeAndReplaceWithApiData(externalUrl?: string, apiKey?: string): Promise<{
  success: boolean;
  message: string;
  syncedCounts: Record<string, number>;
  totalSynced?: number;
  database: string;
  syncedAt: string;
}> {
  return fetchFromApi<{
    success: boolean;
    message: string;
    syncedCounts: Record<string, number>;
    totalSynced?: number;
    database: string;
    syncedAt: string;
  }>('/api/mongodb/wipe-and-import-api', {
    method: 'POST',
    body: JSON.stringify({ externalUrl, apiKey })
  });
}

export async function getMongoStatus(): Promise<{
  connected: boolean;
  database: string;
  hasUri: boolean;
  collections?: Record<string, number>;
  error?: string | null;
  lastSyncedAt?: string | null;
}> {
  return fetchFromApi<any>('/api/mongodb/status');
}

export async function toggleHardwareStream(offlineBufferMode?: boolean) {
  return fetchFromApi<any>('/api/hardware/stream/toggle', {
    method: 'POST',
    body: JSON.stringify({ offlineBufferMode })
  });
}

// GAO RFID UHF Integration helper functions with live telemetry logging
export async function getGaoHistoryCount(): Promise<GaoHistoryTotalCountResponse> {
  const endpoint = '/api/GetHistoryTotalCount';
  const startTime = performance.now();
  let statusCode = 0;
  let statusText = '';
  let responseData: any = null;
  let isSuccess = false;
  let rawBodyText = '';

  try {
    const response = await fetch(endpoint, {
      headers: { 'Accept': 'application/json, text/plain, */*' }
    });
    statusCode = response.status;
    statusText = response.statusText || (response.ok ? 'OK' : 'Error');

    rawBodyText = await response.text();

    if (!response.ok) {
      throw new Error(`GAO Server returned HTTP ${statusCode}: ${rawBodyText || statusText}`);
    }

    const countNum = Number(rawBodyText.trim());
    if (!isNaN(countNum)) {
      responseData = { count: countNum, rawResponse: rawBodyText };
      isSuccess = true;
      return responseData;
    }

    try {
      const json = JSON.parse(rawBodyText);
      const parsedCount = typeof json === 'number' ? json : (json?.count ?? Number(rawBodyText) ?? 0);
      responseData = { count: parsedCount, rawResponse: rawBodyText };
      isSuccess = true;
      return responseData;
    } catch {
      responseData = rawBodyText;
      // Show actual body received instead of generic network error
      throw new Error(`GAO Server returned HTTP 200 with non-JSON response body: "${rawBodyText.slice(0, 200)}"`);
    }
  } catch (err: any) {
    if (!statusCode) {
      statusText = 'Backend Connection Error';
    }
    throw err;
  } finally {
    const durationMs = Math.round(performance.now() - startTime);
    recordLog({
      id: `gao-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      requestId: `req-gao-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      method: 'GET',
      endpoint,
      url: `${GAO_API_BASE_URL}${endpoint}`,
      status: statusCode || 500,
      statusText: statusText || 'OK',
      responseTime: durationMs,
      requestBody: null,
      responseBody: responseData || rawBodyText,
      success: isSuccess
    });
  }
}

/**
 * Get specific history data
 * SkipCount: Number of skipping history data from beginning
 * TakeCount: Number of records to return (Max value: 200)
 */
export async function getGaoHistory(skip: number = 0, take: number = 30): Promise<GaoHistoryRecord[]> {
  const safeSkip = Math.max(0, skip);
  // GAO specification: The max value for TakeCount is 200
  const safeTake = Math.min(Math.max(1, take), 200);
  const endpoint = `/api/GetHistoryRecords/${safeSkip}/${safeTake}`;
  const startTime = performance.now();
  let statusCode = 0;
  let statusText = '';
  let responseData: any = null;
  let isSuccess = false;
  let rawBodyText = '';

  try {
    const response = await fetch(endpoint, {
      headers: { 'Accept': 'application/json, text/plain, */*' }
    });
    statusCode = response.status;
    statusText = response.statusText || (response.ok ? 'OK' : 'Error');

    rawBodyText = await response.text();

    if (!response.ok) {
      throw new Error(`GAO Server returned HTTP ${statusCode}: ${rawBodyText || statusText}`);
    }

    try {
      responseData = JSON.parse(rawBodyText);
      isSuccess = true;
      return Array.isArray(responseData) ? responseData : [];
    } catch {
      responseData = rawBodyText;
      throw new Error(`GAO Server returned HTTP 200 but response is not valid JSON. Upstream body: "${rawBodyText.slice(0, 200)}"`);
    }
  } catch (err: any) {
    if (!statusCode) {
      statusText = 'Backend Connection Error';
    }
    throw err;
  } finally {
    const durationMs = Math.round(performance.now() - startTime);
    recordLog({
      id: `gao-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      requestId: `req-gao-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      method: 'GET',
      endpoint,
      url: `${GAO_API_BASE_URL}${endpoint}`,
      status: statusCode || 500,
      statusText: statusText || 'OK',
      responseTime: durationMs,
      requestBody: null,
      responseBody: responseData || rawBodyText,
      success: isSuccess
    });
  }
}

/**
 * Get tags data in real-time reported by the reader
 * 1 reader with 2 antennas, each covering a zone (Zone1, Zone2)
 */
export async function getGaoRealtime(): Promise<GaoRealtimeTag[]> {
  const endpoint = '/api/GetTagsInRealtime';
  const startTime = performance.now();
  let statusCode = 0;
  let statusText = '';
  let responseData: any = null;
  let isSuccess = false;
  let rawBodyText = '';

  try {
    const response = await fetch(endpoint, {
      headers: { 'Accept': 'application/json, text/plain, */*' }
    });
    statusCode = response.status;
    statusText = response.statusText || (response.ok ? 'OK' : 'Error');

    rawBodyText = await response.text();

    if (!response.ok) {
      throw new Error(`GAO Server returned HTTP ${statusCode}: ${rawBodyText || statusText}`);
    }

    try {
      responseData = JSON.parse(rawBodyText);
      isSuccess = true;
      return Array.isArray(responseData) ? responseData : [];
    } catch {
      responseData = rawBodyText;
      throw new Error(`GAO Server returned HTTP 200 but response is not valid JSON. Upstream body: "${rawBodyText.slice(0, 200)}"`);
    }
  } catch (err: any) {
    if (!statusCode) {
      statusText = 'Backend Connection Error';
    }
    throw err;
  } finally {
    const durationMs = Math.round(performance.now() - startTime);
    recordLog({
      id: `gao-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      requestId: `req-gao-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      method: 'GET',
      endpoint,
      url: `${GAO_API_BASE_URL}${endpoint}`,
      status: statusCode || 500,
      statusText: statusText || 'OK',
      responseTime: durationMs,
      requestBody: null,
      responseBody: responseData || rawBodyText,
      success: isSuccess
    });
  }
}

export async function fetchGaoDiagnostics(): Promise<any> {
  const response = await fetch('/api/gao/diagnostics', {
    headers: { 'Accept': 'application/json' }
  });
  return await response.json();
}

/**
 * Primary Asset Tracking Demo Data Adapter
 * Feeds live data exclusively from GAO RFID UHF Web APIs:
 * 1. GET /api/GetHistoryTotalCount
 * 2. GET /api/GetHistoryRecords/{SkipCount}/{TakeCount}
 * 3. GET /api/GetTagsInRealtime
 */
export async function fetchGaoAssetTrackingData(): Promise<{
  assets: Asset[];
  events: ReadEvent[];
  sites: Site[];
  readers: Reader[];
  historyCount: number;
}> {
  const [historyResult, realtimeResult, countResult] = await Promise.allSettled([
    getGaoHistory(0, 50),
    getGaoRealtime(),
    getGaoHistoryCount()
  ]);

  const rawHistory: any[] = historyResult.status === 'fulfilled' && Array.isArray(historyResult.value) ? historyResult.value : [];
  const rawRealtime: any[] = realtimeResult.status === 'fulfilled' && Array.isArray(realtimeResult.value) ? realtimeResult.value : [];
  const totalCount = countResult.status === 'fulfilled' ? countResult.value.count : rawHistory.length;

  const assetMap = new Map<string, Asset>();
  const eventsList: ReadEvent[] = [];
  const locationsSet = new Set<string>();

  // 1. Process Realtime Tags
  rawRealtime.forEach((rt, idx) => {
    const tagId = String(rt.TagID || rt.tagId || `GAO-TAG-${idx + 1}`).trim();
    const loc = String(rt.Location || rt.location || 'Zone 1').trim();
    locationsSet.add(loc);
    const ts = rt.Timestamp || rt.timestamp || new Date().toISOString();

    assetMap.set(tagId, {
      id: tagId,
      name: `GAO Tag ${tagId.slice(-6)}`,
      category: 'PPE',
      subCategory: 'Personnel UHF Tag',
      manufacturer: 'GAO RFID INC.',
      model: 'GAO-UHF-T90',
      serialNumber: tagId,
      tagEpc: tagId,
      status: 'In Zone',
      siteId: 'site-gao-facility',
      siteName: 'GAO RFID UHF Facility',
      zoneId: `zone-${loc.toLowerCase().replace(/\s+/g, '-')}`,
      zoneName: loc,
      purchaseDate: '2024-01-15',
      cost: 120,
      isRental: false,
      lastSeenAt: ts,
      lastReaderId: 'reader-gao-antenna-1',
      rssi: -45,
      photoUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150',
      condition: 'Good',
      custodianName: 'Field Personnel'
    });

    eventsList.push({
      id: `rt-${tagId}-${idx}`,
      epc: tagId,
      assetId: tagId,
      assetName: `GAO Tag ${tagId.slice(-6)}`,
      assetCategory: 'PPE',
      readerId: 'reader-gao-antenna-1',
      readerName: `GAO Reader (${loc})`,
      siteId: 'site-gao-facility',
      siteName: 'GAO RFID UHF Facility',
      zoneId: `zone-${loc.toLowerCase().replace(/\s+/g, '-')}`,
      zoneName: loc,
      rssi: -45,
      timestamp: ts,
      eventType: 'SCAN',
      antennaId: 1
    });
  });

  // 2. Process History Records
  rawHistory.forEach((rec, idx) => {
    const tagId = String(rec.TagID || rec.tagId || `GAO-HIST-${idx + 1}`).trim();
    const loc = String(rec.LocationName || rec.locationName || 'Antenna Zone').trim();
    locationsSet.add(loc);
    const firstName = rec.FirstName || rec.firstName || '';
    const lastName = rec.LastName || rec.lastName || '';
    const personName = `${firstName} ${lastName}`.trim();
    const enterTime = rec.EnterTime || rec.EnterTimeStr || rec.enterTime || new Date().toISOString();
    const leaveTime = rec.LeaveTime || rec.LeaveTimeStr || rec.leaveTime;

    if (!assetMap.has(tagId)) {
      assetMap.set(tagId, {
        id: tagId,
        name: personName || `GAO Personnel ${tagId.slice(-6)}`,
        category: 'PPE',
        subCategory: 'Personnel UHF Tag',
        manufacturer: 'GAO RFID INC.',
        model: 'GAO-UHF-T90',
        serialNumber: tagId,
        tagEpc: tagId,
        status: leaveTime ? 'In Transit' : 'In Zone',
        siteId: 'site-gao-facility',
        siteName: 'GAO RFID UHF Facility',
        zoneId: `zone-${loc.toLowerCase().replace(/\s+/g, '-')}`,
        zoneName: loc,
        purchaseDate: '2024-01-15',
        cost: 120,
        isRental: false,
        lastSeenAt: leaveTime || enterTime,
        lastReaderId: leaveTime ? 'reader-gao-antenna-2' : 'reader-gao-antenna-1',
        rssi: -50,
        photoUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150',
        condition: 'Good',
        custodianName: personName || 'Field Personnel'
      });
    }

    eventsList.push({
      id: `hist-enter-${tagId}-${idx}`,
      epc: tagId,
      assetId: tagId,
      assetName: personName || `GAO Personnel ${tagId.slice(-6)}`,
      assetCategory: 'PPE',
      readerId: 'reader-gao-antenna-1',
      readerName: `GAO Portal (${loc})`,
      siteId: 'site-gao-facility',
      siteName: 'GAO RFID UHF Facility',
      zoneId: `zone-${loc.toLowerCase().replace(/\s+/g, '-')}`,
      zoneName: loc,
      rssi: -48,
      timestamp: enterTime,
      eventType: 'ENTER',
      antennaId: 1
    });

    if (leaveTime) {
      eventsList.push({
        id: `hist-leave-${tagId}-${idx}`,
        epc: tagId,
        assetId: tagId,
        assetName: personName || `GAO Personnel ${tagId.slice(-6)}`,
        assetCategory: 'PPE',
        readerId: 'reader-gao-antenna-2',
        readerName: `GAO Portal (${loc})`,
        siteId: 'site-gao-facility',
        siteName: 'GAO RFID UHF Facility',
        zoneId: `zone-${loc.toLowerCase().replace(/\s+/g, '-')}`,
        zoneName: loc,
        rssi: -52,
        timestamp: leaveTime,
        eventType: 'EXIT',
        antennaId: 2
      });
    }
  });

  const assets = Array.from(assetMap.values());
  const sites: Site[] = Array.from(locationsSet).map((locName, idx) => ({
    id: `site-${locName.toLowerCase().replace(/\s+/g, '-')}`,
    name: locName || 'GAO Tracking Facility',
    code: `GAO-${idx + 1}`,
    address: 'GAO RFID UHF Coverage Field',
    manager: 'GAO Field Supervisor',
    activeAssetsCount: assets.filter(a => a.zoneName === locName).length,
    totalAssetsValue: assets.filter(a => a.zoneName === locName).length * 120,
    coordinates: { lat: 43.7615, lng: -79.4111 },
    zones: [
      {
        id: `zone-${locName.toLowerCase().replace(/\s+/g, '-')}`,
        siteId: `site-${locName.toLowerCase().replace(/\s+/g, '-')}`,
        name: locName,
        type: 'Work Area',
        readerIds: ['reader-gao-antenna-1', 'reader-gao-antenna-2'],
        capacity: 100,
        currentCount: assets.filter(a => a.zoneName === locName).length,
        color: '#2563eb'
      }
    ]
  }));

  // If real tags arrived with locations, build site/reader records for them; otherwise keep empty
  const readers: Reader[] = sites.length > 0 ? [
    {
      id: 'reader-gao-antenna-1',
      siteId: sites[0]?.id,
      siteName: sites[0]?.name,
      name: `UHF Gateway — ${sites[0]?.name}`,
      type: 'Fixed Portal',
      ipAddress: 'API Connected',
      zoneId: sites[0]?.zones?.[0]?.id || 'zone-1',
      zoneName: sites[0]?.zones?.[0]?.name || 'Coverage Area',
      antennaPowerDbm: 30,
      status: 'Online',
      lastHeartbeat: new Date().toISOString(),
      firmwareVersion: 'v4.2.0',
      readCountTotal: eventsList.length,
      bufferedEventsCount: 0
    }
  ] : [];

  return {
    assets,
    events: eventsList,
    sites,
    readers,
    historyCount: assets.length > 0 ? totalCount : 0
  };
}

// Aliases for compatibility
export const fetchAssets = getAssets;
export const fetchSites = getSites;
export const fetchUsers = getUsers;
export const fetchReaders = getReaders;
export const fetchEvents = getEvents;
export const fetchCheckouts = getCheckouts;
export const fetchMaintenance = getMaintenance;
export const fetchInventory = getInventory;
export const fetchAlerts = getAlerts;
export const fetchAuditLogs = getAuditLogs;
export const fetchHealth = getHealth;

