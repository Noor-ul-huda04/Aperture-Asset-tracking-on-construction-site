export type AssetCategory = 'Tools' | 'Heavy Equipment' | 'Vehicles' | 'PPE' | 'Materials' | 'Containers';
export type AssetStatus = 'In Zone' | 'Checked Out' | 'In Transit' | 'Under Maintenance' | 'Missing' | 'Retired';
export type AssetCondition = 'Excellent' | 'Good' | 'Fair' | 'Damaged';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  subCategory: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  tagEpc: string;
  qrCode?: string;
  status: AssetStatus;
  siteId: string;
  siteName: string;
  zoneId: string;
  zoneName: string;
  custodianId?: string;
  custodianName?: string;
  purchaseDate: string;
  cost: number;
  rentalCostPerDay?: number;
  isRental: boolean;
  rentalEndDate?: string;
  lastSeenAt: string;
  lastReaderId: string;
  rssi: number; // e.g. -45 dBm
  photoUrl: string;
  condition: AssetCondition;
  customFields?: Record<string, string | number>;
  kitId?: string;
  kitName?: string;
  notes?: string;
  hoursUsed?: number;
  nextMaintenanceDate?: string;
}

export interface Tag {
  epc: string;
  assetId?: string;
  assetName?: string;
  status: 'Active' | 'Unassigned' | 'Damaged' | 'Lost';
  type: 'Passive UHF (860-960 MHz)' | 'Active BLE/GPS Hybrid';
  batteryPercent?: number;
  assignedDate?: string;
}

export type EventType = 'ENTER' | 'EXIT' | 'SCAN' | 'HEARTBEAT' | 'GEOFENCE_BREACH';

export interface ReadEvent {
  id: string;
  epc: string;
  assetId?: string;
  assetName?: string;
  assetCategory?: AssetCategory;
  readerId: string;
  readerName: string;
  siteId: string;
  siteName: string;
  zoneId: string;
  zoneName: string;
  rssi: number;
  timestamp: string;
  eventType: EventType;
  antennaId?: number;
}

export interface Checkout {
  id: string;
  assetId: string;
  assetName: string;
  assetCategory: AssetCategory;
  tagEpc: string;
  userId: string;
  userName: string;
  badgeId: string;
  checkoutTime: string;
  expectedReturn: string;
  actualReturn?: string;
  jobId: string;
  jobName: string;
  checkoutCondition: AssetCondition;
  returnCondition?: AssetCondition;
  checkoutSignature?: string;
  notes?: string;
  photoUrl?: string;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
}

export interface Zone {
  id: string;
  siteId: string;
  name: string;
  type: 'Laydown Yard' | 'Entry Gate' | 'Storage Crib' | 'Floor Level' | 'Work Area' | 'Restricted Zone';
  readerIds: string[];
  capacity: number;
  currentCount: number;
  color: string;
  geofenceCoords?: { x: number; y: number }[]; // 2D layout representation
}

export interface Site {
  id: string;
  name: string;
  code: string;
  address: string;
  manager: string;
  activeAssetsCount: number;
  totalAssetsValue: number;
  coordinates: { lat: number; lng: number };
  zones: Zone[];
}

export interface MaintenanceLog {
  id: string;
  assetId: string;
  assetName: string;
  type: 'Preventive' | 'Repair' | 'Calibration' | 'Inspection';
  date: string;
  scheduledDate: string;
  cost: number;
  technician: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue';
  notes: string;
  workOrderId: string;
}

export type AlertType = 
  | 'GEOFENCE_BREACH' 
  | 'OVERDUE_CHECKOUT' 
  | 'UNAUTHORIZED_MOVEMENT' 
  | 'LOW_BATTERY' 
  | 'MAINTENANCE_DUE' 
  | 'LOW_STOCK' 
  | 'MISSING_ASSET';

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  assetId?: string;
  assetName?: string;
  siteId: string;
  siteName: string;
  zoneId?: string;
  zoneName?: string;
  triggeredAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  message: string;
}

export type UserRole = 'Admin' | 'Project Manager' | 'Site Manager' | 'Yard Staff' | 'Field Worker' | 'Maintenance Tech' | 'Equipment Foreman' | 'Safety & Compliance Inspector';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  siteAccess: string[]; // Site IDs
  badgeId: string;
  avatarUrl: string;
  phone: string;
}

export interface Reader {
  id: string;
  name: string;
  type: 'Fixed Portal' | 'Handheld' | 'Vehicle Mounted';
  siteId: string;
  siteName: string;
  zoneId: string;
  zoneName: string;
  status: 'Online' | 'Offline' | 'Warning';
  lastHeartbeat: string;
  antennaPowerDbm: number;
  ipAddress: string;
  readCountTotal: number;
  bufferedEventsCount: number;
  firmwareVersion: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  siteId: string;
  siteName: string;
  quantityOnHand: number;
  minThreshold: number;
  unit: string; // e.g. 'Boxes', 'Liters', 'Units', 'Pallets'
  reorderPoint: number;
  costPerUnit: number;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: 'ASSET' | 'CHECKOUT' | 'MAINTENANCE' | 'ZONE' | 'READER' | 'USER' | 'TAG' | 'DATABASE' | 'SECURITY' | 'SITE' | 'INVENTORY' | 'SYSTEM';
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: string;
}

export interface HardwareStreamState {
  isStreaming: boolean;
  eventsPerMinute: number;
  offlineBufferMode: boolean;
  bufferedCount: number;
  lastIngestedEpc?: string;
}

export type AuthHeaderScheme = 'X-API-Key' | 'Bearer Token';

export interface ApiGatewayConfig {
  baseUrl: string;
  apiKey: string;
  authHeaderScheme: AuthHeaderScheme;
  pollingIntervalSeconds: number; // e.g. 5, 10, 15, 30
  isPollingActive: boolean;
  lastVerifiedAt?: string;
  latencyMs?: number;
  status: 'CONNECTED' | 'DISCONNECTED' | 'TESTING';
}

export interface ApiEndpointLogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  ip: string;
  durationMs: number;
  authHeader: string;
  userAgent?: string;
  responseSummary?: string;
  requestBody?: any;
}

// ====================================================
// GAO RFID INC. OFFICIAL WEB APIS SPECIFICATION TYPES
// Host: https://www.i360services.com/peopletrackinguhf
// 1 Reader, 2 Antennas (Antenna 1 -> Zone 1, Antenna 2 -> Zone 2)
// ====================================================

/**
 * 1. History Total Count: Total number of history records in GAO cloud database.
 * Endpoint: GET /api/GetHistoryTotalCount
 * Response: number (e.g. 100, 0 means no history data)
 */
export interface GaoHistoryTotalCountResponse {
  count: number;
  rawResponse?: string;
}

/**
 * 2. Specific History Data: Record of entering and leaving a zone for a UHF tag.
 * Endpoint: GET /api/GetHistoryRecords/{SkipCount}/{TakeCount}
 * Ordered by generated time descending. TakeCount maximum value is 200.
 * If returned count < TakeCount, end of history reached.
 */
export interface GaoHistoryRecord {
  TagID: string; // UHF tag EPC (e.g. "E28011606000020788842D31")
  FirstName?: string; // Personnel first name (e.g. "John")
  LastName?: string; // Personnel last name (e.g. "Smith")
  LocationName: string; // Location or zone name (e.g. "Zone1", "Zone2", "d6", "d8")
  EnterTime?: string; // UTC time, "yyyy-MM-dd HH:mm:ss"
  LeaveTime?: string; // UTC time, "yyyy-MM-dd HH:mm:ss"
  EnterTimeStr?: string; // Alternate UTC time string
  LeaveTimeStr?: string; // Alternate UTC time string
  Duration: number; // Unit is hours (LeaveTime minus EnterTime, e.g. 0.5 = 30 minutes)
}

/**
 * 3. Real-time Tag Data: Raw data reported by reader antennas.
 * Endpoint: GET /api/GetTagsInRealtime
 * 1 Reader, 2 Antennas each covering a zone (Zone1, Zone2).
 * Ordered by generated time descending, extracted from tags queue.
 */
export interface GaoRealtimeTag {
  TagID: string; // UHF tag EPC
  Timestamp: string; // Reader found time, UTC "yyyy-MM-dd HH:mm:ss.fff"
  Location: string; // Antenna zone name (e.g. "Zone1", "Zone2")
}

/**
 * GAO RFID Hardware Topology
 * 1 Reader with 2 Antennas covering 2 Zones
 */
export interface GaoReaderTopology {
  readerId: string;
  readerName: string;
  model: string;
  host: string;
  status: 'ONLINE' | 'OFFLINE';
  antennas: {
    antennaId: number;
    zoneName: string;
    description: string;
    activeTagsCount: number;
  }[];
}

