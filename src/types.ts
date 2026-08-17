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

export type UserRole = 'Admin' | 'Project Manager' | 'Site Manager' | 'Yard Staff' | 'Field Worker' | 'Maintenance Tech';

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
  entityType: 'ASSET' | 'CHECKOUT' | 'MAINTENANCE' | 'ZONE' | 'READER' | 'USER' | 'TAG' | 'DATABASE' | 'SECURITY';
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

