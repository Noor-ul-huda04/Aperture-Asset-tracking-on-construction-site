import { Asset, Checkout, Alert, ReadEvent, MaintenanceLog, Reader, Site, InventoryItem, User, AuditLog } from '../types';

/**
 * Frontend API Service Layer
 * Strict Architecture: Frontend -> Backend API (/api/*) -> MongoDB Atlas
 */

export const API_BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL || 
  'https://ais-dev-ot7rtvum7gckl5jiwdqz2d-817249406448.asia-east1.run.app'
).replace(/\/$/, '').replace(/\/api$/, '');

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

function recordLog(record: ApiLogRecord) {
  apiLogsStore.unshift(record);
  if (apiLogsStore.length > 200) {
    apiLogsStore.pop();
  }
}

export async function fetchFromApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase();
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
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

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
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
      url,
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

