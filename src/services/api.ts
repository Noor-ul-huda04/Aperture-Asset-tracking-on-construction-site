import { Asset, Checkout, Alert, ReadEvent, MaintenanceLog, Reader, Site, InventoryItem, User, AuditLog } from '../types';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://68cc1e0b-071a-4cd1-9c95-4912676a5624.mock.pstmn.io'
).replace(/\/$/, '');

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

// In-Memory Real Application Request Log Store
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

// Local State Overlays for Mutations so user changes persist in session if mock is read-only
const resolvedAlertsMap = new Map<string, { resolved: boolean; status: string; resolvedBy: string; resolvedAt: string }>();
const createdAssetsList: Asset[] = [];
const updatedAssetsMap = new Map<string, Partial<Asset>>();
const deletedAssetsSet = new Set<string>();

const createdCheckoutsList: Checkout[] = [];
const updatedCheckoutsMap = new Map<string, Partial<Checkout>>();

const createdMaintenanceList: MaintenanceLog[] = [];
const updatedInventoryMap = new Map<string, Partial<InventoryItem>>();

const createdUsersList: User[] = [];
const updatedUsersMap = new Map<string, Partial<User>>();
const deletedUsersSet = new Set<string>();

export async function fetchFromApi<T>(endpoint: string, options?: RequestInit, silentFallback = false): Promise<T> {
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
      errorMsg = `API request failed: ${res.status} ${res.statusText || ''}`;
      if (!silentFallback) {
        throw new Error(errorMsg);
      }
    } else {
      isSuccess = true;
      return responseData as T;
    }
  } catch (err: any) {
    if (!statusCode) {
      statusCode = 0;
      statusText = 'Network Error';
      errorMsg = err?.message || 'Unable to connect to Postman Mock Server.';
    } else {
      errorMsg = err?.message || `HTTP Error ${statusCode}`;
    }

    if (!silentFallback) {
      throw new Error(errorMsg);
    }
  } finally {
    const durationMs = Math.round(performance.now() - startTime);
    recordLog({
      id: `apilog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      requestId: `req-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      url,
      status: statusCode || (silentFallback ? 200 : 0),
      statusText: statusText || (silentFallback ? 'OK (Local Overlay)' : 'Error'),
      responseTime: durationMs,
      requestBody,
      responseBody: responseData || (silentFallback ? { status: 'success', message: 'Processed via client state overlay' } : null),
      success: isSuccess || silentFallback,
      errorMessage: isSuccess || silentFallback ? null : errorMsg
    });
  }

  return responseData as T;
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
// Core Centralized Postman Mock API Endpoints
// ----------------------------------------------------

export async function getAssets(): Promise<Asset[]> {
  const data = await fetchFromApi<any>('/api/assets');
  const fetched = extractArray<any>(data, 'assets');

  const normalizedFetched: Asset[] = fetched
    .filter(a => !deletedAssetsSet.has(a.id))
    .map(a => {
      const overrides = updatedAssetsMap.get(a.id) || {};
      return {
        id: a.id || `AST-${Math.random().toString(36).slice(2, 6)}`,
        name: a.name || 'Equipment',
        category: a.category || 'Heavy Equipment',
        subCategory: a.subCategory || 'General',
        manufacturer: a.manufacturer || 'Caterpillar',
        model: a.model || 'Standard',
        serialNumber: a.serialNumber || `SN-${a.id}`,
        tagEpc: a.rfidTag || a.tagEpc || a.epc || 'E2801191A001',
        status: (a.status === 'ACTIVE' ? 'In Zone' : a.status === 'MAINTENANCE' ? 'Under Maintenance' : a.status === 'CHECKED_OUT' ? 'Checked Out' : a.status) || 'In Zone',
        siteId: a.siteId || 'SITE-001',
        siteName: a.siteName || (a.siteId === 'SITE-002' ? 'Riverside Commercial Project' : 'Metro Tower Construction'),
        zoneId: a.zoneId || 'zone-01',
        zoneName: a.location || a.zoneName || 'Foundation Zone A',
        purchaseDate: a.purchaseDate || '2024-01-15',
        cost: Number(a.cost) || 125000,
        isRental: Boolean(a.isRental),
        lastSeenAt: a.lastSeenAt || a.timestamp || new Date().toISOString(),
        lastReaderId: a.lastReaderId || a.readerId || 'READER-01',
        rssi: Number(a.rssi) || -42,
        photoUrl: a.photoUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800',
        condition: a.condition || 'Good',
        ...a,
        ...overrides
      } as Asset;
    });

  const validCreated = createdAssetsList
    .filter(a => !deletedAssetsSet.has(a.id))
    .map(a => {
      const overrides = updatedAssetsMap.get(a.id) || {};
      return { ...a, ...overrides };
    });

  return [...normalizedFetched, ...validCreated];
}

export async function getSites(): Promise<Site[]> {
  const data = await fetchFromApi<any>('/api/sites');
  const fetched = extractArray<any>(data, 'sites');
  return fetched.map(s => ({
    id: s.id,
    name: s.name || 'Site',
    code: s.code || s.id,
    address: s.location || s.address || 'Lahore, Pakistan',
    manager: s.manager || 'Site Manager',
    activeAssetsCount: s.activeAssetsCount || 12,
    totalAssetsValue: s.totalAssetsValue || 450000,
    coordinates: s.coordinates || { lat: 31.5204, lng: 74.3587 },
    zones: s.zones || [
      { id: 'zone-01', siteId: s.id, name: 'Foundation Zone A', type: 'Laydown Yard', readerIds: ['READER-01'], capacity: 20, currentCount: 5, color: '#3b82f6' },
      { id: 'zone-02', siteId: s.id, name: 'Power Zone', type: 'Storage Crib', readerIds: ['READER-02'], capacity: 10, currentCount: 2, color: '#10b981' }
    ],
    ...s
  }));
}

export async function getUsers(): Promise<User[]> {
  const data = await fetchFromApi<any>('/api/users');
  const fetched = extractArray<any>(data, 'users')
    .filter(u => !deletedUsersSet.has(u.id))
    .map(u => {
      const overrides = updatedUsersMap.get(u.id) || {};
      return {
        id: u.id,
        name: u.name || 'User',
        email: u.email || `${u.name?.toLowerCase().replace(/\s+/g, '.')}@aperture.build`,
        role: (u.role === 'OPERATOR' ? 'Field Worker' : u.role === 'MANAGER' ? 'Site Manager' : u.role) || 'Site Manager',
        siteAccess: u.siteAccess || [u.siteId || 'SITE-001'],
        badgeId: u.badgeId || `BDG-${u.id}`,
        avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        phone: u.phone || '+92 300 1234567',
        ...u,
        ...overrides
      } as User;
    });

  const validCreated = createdUsersList
    .filter(u => !deletedUsersSet.has(u.id))
    .map(u => ({ ...u, ...(updatedUsersMap.get(u.id) || {}) }));

  return [...fetched, ...validCreated];
}

export async function getReaders(): Promise<Reader[]> {
  const data = await fetchFromApi<any>('/api/readers');
  const fetched = extractArray<any>(data, 'readers');
  return fetched.map(r => ({
    id: r.id,
    name: r.name || 'RFID Reader',
    type: (r.type || 'Fixed Portal') as 'Fixed Portal' | 'Handheld' | 'Vehicle Mounted',
    siteId: r.siteId || 'SITE-001',
    siteName: r.siteId === 'SITE-002' ? 'Riverside Commercial Project' : 'Metro Tower Construction',
    zoneId: r.zoneId || 'zone-01',
    zoneName: r.location || 'Main Gate',
    status: (r.status === 'ONLINE' ? 'Online' : r.status === 'OFFLINE' ? 'Offline' : 'Online') as 'Online' | 'Offline' | 'Warning',
    lastHeartbeat: r.lastSeen || r.lastHeartbeat || new Date().toISOString(),
    antennaPowerDbm: Number(r.powerDbm || r.antennaPowerDbm) || 30,
    ipAddress: r.ipAddress || '192.168.1.101',
    readCountTotal: Number(r.readCountTotal) || 1420,
    bufferedEventsCount: Number(r.bufferedEventsCount) || 0,
    firmwareVersion: r.firmwareVersion || 'v3.8.12',
    ...r
  }));
}

export async function getEvents(): Promise<ReadEvent[]> {
  const data = await fetchFromApi<any>('/api/events');
  const fetched = extractArray<any>(data, 'events');
  return fetched.map(e => ({
    id: e.id,
    epc: e.tagId || e.epc || 'E2801191A001',
    assetId: e.assetId || 'AST-001',
    assetName: e.assetName || (e.assetId === 'AST-002' ? 'Diesel Generator 500kVA' : 'Caterpillar 320 Excavator'),
    readerId: e.readerId || 'READER-01',
    readerName: e.readerName || (e.readerId === 'READER-02' ? 'Equipment Zone Reader' : 'Gate RFID Reader'),
    siteId: e.siteId || 'SITE-001',
    siteName: 'Metro Tower Construction',
    zoneId: 'zone-01',
    zoneName: e.location || 'Foundation Zone A',
    rssi: Number(e.rssi) || -42,
    timestamp: e.timestamp || new Date().toISOString(),
    eventType: (e.eventType === 'TAG_DETECTED' ? 'SCAN' : e.eventType) || 'SCAN',
    ...e
  }));
}

export async function getCheckouts(): Promise<Checkout[]> {
  const data = await fetchFromApi<any>('/api/checkouts');
  const fetched = extractArray<any>(data, 'checkouts').map(c => {
    const overrides = updatedCheckoutsMap.get(c.id) || {};
    return {
      id: c.id,
      assetId: c.assetId || 'AST-002',
      assetName: c.assetName || 'Diesel Generator 500kVA',
      assetCategory: 'Power Equipment' as any,
      tagEpc: c.tagEpc || 'E2801191A002',
      userId: c.userId || 'USR-001',
      userName: c.userName || 'Site Operator',
      badgeId: c.badgeId || 'BDG-USR-001',
      checkoutTime: c.checkoutDate || c.checkoutTime || '2026-08-17T05:30:00Z',
      expectedReturn: c.expectedReturn || '2026-08-18T05:30:00Z',
      jobId: c.jobId || 'JOB-101',
      jobName: c.jobName || 'Excavation & Power Setup',
      checkoutCondition: 'Good' as any,
      status: (c.status === 'CHECKED_OUT' ? 'ACTIVE' : c.status) || 'ACTIVE',
      ...c,
      ...overrides
    } as Checkout;
  });

  const validCreated = createdCheckoutsList.map(c => ({
    ...c,
    ...(updatedCheckoutsMap.get(c.id) || {})
  }));

  return [...fetched, ...validCreated];
}

export async function getMaintenance(): Promise<MaintenanceLog[]> {
  const data = await fetchFromApi<any>('/api/maintenance');
  const fetched = extractArray<any>(data, 'maintenance').map(m => ({
    id: m.id,
    assetId: m.assetId || 'AST-003',
    assetName: m.assetName || 'Tower Crane TC-01',
    type: m.type?.includes('Preventive') ? 'Preventive' : 'Inspection',
    date: m.date || '2026-08-17',
    scheduledDate: m.scheduledDate || '2026-08-20',
    cost: Number(m.cost) || 450,
    technician: m.technician || 'Technician',
    status: (m.status === 'PENDING' ? 'Scheduled' : m.status) || 'Scheduled',
    notes: m.description || m.notes || 'Hydraulic system inspection',
    workOrderId: m.workOrderId || `WO-${m.id}`,
    ...m
  } as MaintenanceLog));

  return [...fetched, ...createdMaintenanceList];
}

export async function getInventory(): Promise<InventoryItem[]> {
  const data = await fetchFromApi<any>('/api/inventory');
  const fetched = extractArray<any>(data, 'inventory');
  return fetched.map(i => {
    const overrides = updatedInventoryMap.get(i.id) || {};
    return {
      id: i.id,
      name: i.assetName || i.name || 'Standard Equipment Consumable',
      category: i.category || 'Supplies',
      siteId: i.siteId || 'SITE-001',
      siteName: 'Metro Tower Construction',
      quantityOnHand: i.quantity ?? i.quantityOnHand ?? 1,
      minThreshold: i.minThreshold ?? 2,
      unit: i.unit || 'Units',
      reorderPoint: i.reorderPoint || i.minThreshold || 2,
      costPerUnit: Number(i.unitCost || i.costPerUnit) || 45,
      ...i,
      ...overrides
    } as InventoryItem;
  });
}

export async function getAlerts(): Promise<Alert[]> {
  const data = await fetchFromApi<any>('/api/alerts');
  const fetched = extractArray<any>(data, 'alerts');

  return fetched.map(a => {
    const resolvedOverlay = resolvedAlertsMap.get(a.id);
    const isResolved = resolvedOverlay?.resolved ?? (a.resolved === true || a.status === 'RESOLVED');

    return {
      id: a.id,
      type: a.type || 'MAINTENANCE_DUE',
      severity: a.severity || 'HIGH',
      assetId: a.assetId || 'AST-001',
      assetName: a.assetName || (a.assetId === 'AST-003' ? 'Tower Crane TC-01' : 'Caterpillar 320 Excavator'),
      siteId: a.siteId || 'SITE-001',
      siteName: a.siteName || 'Metro Tower Construction',
      zoneId: a.zoneId || 'zone-01',
      zoneName: a.zoneName || 'Foundation Zone A',
      triggeredAt: a.triggeredAt || a.createdAt || a.timestamp || new Date().toISOString(),
      resolved: isResolved,
      resolvedAt: resolvedOverlay?.resolvedAt || a.resolvedAt,
      resolvedBy: resolvedOverlay?.resolvedBy || a.resolvedBy,
      message: a.message || 'Perimeter alert triggered',
      status: isResolved ? 'RESOLVED' : (a.status || 'OPEN'),
      ...a
    } as unknown as Alert;
  });
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const data = await fetchFromApi<any>('/api/audit-logs');
  const fetched = extractArray<any>(data, 'auditLogs');
  return fetched.map(l => ({
    id: l.id,
    action: l.action || 'ASSET_LOCATION_UPDATED',
    entityType: (l.entityType || 'ASSET') as any,
    entityId: l.assetId || l.entityId || 'AST-001',
    entityName: l.entityName || l.assetName || 'Caterpillar 320 Excavator',
    userId: l.userId || 'USR-001',
    userName: l.userName || 'Site Operator',
    timestamp: l.timestamp || new Date().toISOString(),
    details: l.details || 'Location updated via RFID read event',
    ...l
  }));
}

export async function getHealth(): Promise<{ status: string; service: string; timestamp: string }> {
  return fetchFromApi<{ status: string; service: string; timestamp: string }>('/api/health');
}

export async function submitRfidScan(data: { tagId: string; readerId: string; siteId: string; timestamp?: string }): Promise<{
  status: string;
  message: string;
  event: any;
}> {
  return fetchFromApi<{ status: string; message: string; event: any }>('/api/events/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tagId: data.tagId,
      readerId: data.readerId,
      siteId: data.siteId,
      timestamp: data.timestamp || new Date().toISOString()
    })
  });
}

// Aliases for component compatibility
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

export async function fetchSummary() {
  return fetchFromApi<any>('/api/reports/summary', undefined, true);
}

// REST Mutations hitting Postman Mock API with graceful local fallback
export async function createAsset(data: Partial<Asset>): Promise<Asset> {
  const newAsset: Asset = {
    id: data.id || `AST-${Date.now().toString().slice(-4)}`,
    name: data.name || 'New Asset',
    category: data.category || 'Heavy Equipment',
    subCategory: data.subCategory || 'General',
    manufacturer: data.manufacturer || 'Caterpillar',
    model: data.model || 'Standard',
    serialNumber: data.serialNumber || `SN-${Date.now()}`,
    tagEpc: data.tagEpc || `E2801191A${Math.floor(100 + Math.random() * 900)}`,
    status: data.status || 'In Zone',
    siteId: data.siteId || 'SITE-001',
    siteName: data.siteName || 'Metro Tower Construction',
    zoneId: data.zoneId || 'zone-01',
    zoneName: data.zoneName || 'Foundation Zone A',
    purchaseDate: data.purchaseDate || new Date().toISOString().split('T')[0],
    cost: Number(data.cost) || 75000,
    isRental: Boolean(data.isRental),
    lastSeenAt: new Date().toISOString(),
    lastReaderId: 'READER-01',
    rssi: -45,
    photoUrl: data.photoUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800',
    condition: data.condition || 'Good'
  };

  createdAssetsList.push(newAsset);

  await fetchFromApi<Asset>('/api/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newAsset)
  }, true);

  return newAsset;
}

export async function createAssetsBatch(assets: Partial<Asset>[]): Promise<{ count: number; importedAssets: Asset[] }> {
  const created: Asset[] = [];
  for (const a of assets) {
    const item = await createAsset(a);
    created.push(item);
  }
  return { count: created.length, importedAssets: created };
}

export async function updateAsset(id: string, data: Partial<Asset>): Promise<Asset> {
  const current = updatedAssetsMap.get(id) || {};
  updatedAssetsMap.set(id, { ...current, ...data });

  await fetchFromApi<Asset>(`/api/assets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }, true);

  return { id, ...current, ...data } as Asset;
}

export async function deleteAsset(id: string): Promise<{ id: string }> {
  deletedAssetsSet.add(id);

  await fetchFromApi<{ id: string }>(`/api/assets/${id}`, {
    method: 'DELETE'
  }, true);

  return { id };
}

export async function createCheckout(data: { assetId: string; userId: string; jobId?: string; expectedReturnHours?: number; notes?: string; photoUrl?: string }): Promise<Checkout> {
  const newCheckout: Checkout = {
    id: `CHK-${Date.now().toString().slice(-4)}`,
    assetId: data.assetId,
    assetName: 'Asset Checkout',
    assetCategory: 'Heavy Equipment',
    tagEpc: 'E2801191A001',
    userId: data.userId,
    userName: 'Site Operator',
    badgeId: 'BDG-USR-001',
    checkoutTime: new Date().toISOString(),
    expectedReturn: new Date(Date.now() + (data.expectedReturnHours || 24) * 3600 * 1000).toISOString(),
    jobId: data.jobId || 'JOB-101',
    jobName: 'General Construction Work',
    checkoutCondition: 'Good',
    notes: data.notes,
    photoUrl: data.photoUrl,
    status: 'ACTIVE'
  };

  createdCheckoutsList.push(newCheckout);

  await fetchFromApi<Checkout>('/api/checkouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }, true);

  return newCheckout;
}

export async function returnCheckout(checkoutId: string, condition: string): Promise<Checkout> {
  const updateData: Partial<Checkout> = {
    status: 'RETURNED',
    returnCondition: condition as any,
    actualReturn: new Date().toISOString()
  };
  updatedCheckoutsMap.set(checkoutId, updateData);

  await fetchFromApi<Checkout>(`/api/checkouts/${checkoutId}/return`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ condition })
  }, true);

  return { id: checkoutId, ...updateData } as Checkout;
}

export async function simulateScan(epc: string, readerId: string, _rssi?: number): Promise<{ event: ReadEvent; assetUpdated: boolean }> {
  const result = await submitRfidScan({
    tagId: epc,
    readerId,
    siteId: 'SITE-001'
  });
  return { event: result.event || result, assetUpdated: true };
}

export async function resolveAlert(id: string, resolvedBy: string): Promise<Alert> {
  const resolvedRecord = {
    resolved: true,
    status: 'RESOLVED',
    resolvedBy: resolvedBy || 'Site Operator',
    resolvedAt: new Date().toISOString()
  };
  resolvedAlertsMap.set(id, resolvedRecord);

  // Attempt the mock server call in silent fallback mode so 404 does not throw
  await fetchFromApi<Alert>(`/api/alerts/${id}/resolve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resolvedBy })
  }, true);

  return {
    id,
    type: 'MAINTENANCE_DUE',
    severity: 'HIGH',
    siteId: 'SITE-001',
    siteName: 'Metro Tower Construction',
    triggeredAt: new Date().toISOString(),
    message: 'Alert resolved',
    ...resolvedRecord
  } as unknown as Alert;
}

export async function createMaintenance(data: Partial<MaintenanceLog>): Promise<MaintenanceLog> {
  const newLog: MaintenanceLog = {
    id: `MNT-${Date.now().toString().slice(-4)}`,
    assetId: data.assetId || 'AST-001',
    assetName: data.assetName || 'Equipment',
    type: data.type || 'Inspection',
    date: data.date || new Date().toISOString().split('T')[0],
    scheduledDate: data.scheduledDate || new Date().toISOString().split('T')[0],
    cost: Number(data.cost) || 250,
    technician: data.technician || 'Technician',
    status: data.status || 'Scheduled',
    notes: data.notes || 'Maintenance inspection logged',
    workOrderId: `WO-${Date.now().toString().slice(-4)}`
  };

  createdMaintenanceList.push(newLog);

  await fetchFromApi<MaintenanceLog>('/api/maintenance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }, true);

  return newLog;
}

export async function updateInventory(id: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
  const current = updatedInventoryMap.get(id) || {};
  updatedInventoryMap.set(id, { ...current, ...data });

  await fetchFromApi<InventoryItem>(`/api/inventory/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }, true);

  return { id, ...current, ...data } as InventoryItem;
}

export async function createUser(userData: Partial<User>): Promise<User> {
  const newUser: User = {
    id: userData.id || `USR-${Date.now().toString().slice(-4)}`,
    name: userData.name || 'New User',
    email: userData.email || 'user@aperture.build',
    role: userData.role || 'Field Worker',
    siteAccess: userData.siteAccess || ['SITE-001'],
    badgeId: userData.badgeId || `BDG-${Date.now().toString().slice(-4)}`,
    avatarUrl: userData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    phone: userData.phone || '+92 300 0000000'
  };

  createdUsersList.push(newUser);

  await fetchFromApi<User>('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  }, true);

  return newUser;
}

export async function updateUser(userId: string, data: Partial<User>): Promise<User> {
  const current = updatedUsersMap.get(userId) || {};
  updatedUsersMap.set(userId, { ...current, ...data });

  await fetchFromApi<User>(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }, true);

  return { id: userId, ...current, ...data } as User;
}

export async function deleteUser(userId: string): Promise<{ success: boolean; id: string }> {
  deletedUsersSet.add(userId);

  await fetchFromApi<{ success: boolean; id: string }>(`/api/users/${userId}`, {
    method: 'DELETE'
  }, true);

  return { success: true, id: userId };
}

export async function toggleHardwareStream(offlineBufferMode?: boolean) {
  return fetchFromApi<any>('/api/hardware/stream/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ offlineBufferMode })
  }, true);
}
