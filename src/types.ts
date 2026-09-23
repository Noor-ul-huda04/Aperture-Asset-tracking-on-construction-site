export type AssetCategory = 'Tools' | 'Heavy Equipment' | 'Vehicles' | 'PPE' | 'Materials' | 'Containers' | 'Equipment';
export type AssetStatus = 
  | 'Active' 
  | 'Idle' 
  | 'In Transit' 
  | 'Maintenance' 
  | 'Damaged' 
  | 'Lost' 
  | 'Off-Site' 
  | 'Retired'
  | 'In Zone' 
  | 'Checked Out' 
  | 'Under Maintenance' 
  | 'Missing';

export type AssetCondition = 'Excellent' | 'Good' | 'Fair' | 'Damaged';

export type ConstructionAssetType = 
  | 'Excavator' 
  | 'Crane' 
  | 'Bulldozer' 
  | 'Truck' 
  | 'Generator' 
  | 'Compressor' 
  | 'Drill' 
  | 'Mixer'
  | 'Scissor Lift'
  | 'Materials' 
  | 'Other';

export interface AssetDocument {
  id: string;
  name: string;
  type: 'Manual' | 'Certificate' | 'Registration' | 'Inspection Record' | 'Warranty' | 'Invoice';
  url: string;
  date: string;
  fileSize?: string;
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  assetType?: ConstructionAssetType;
  subCategory?: string;
  manufacturer: string;
  model: string;
  year?: number;
  serialNumber: string;
  tagEpc: string;
  qrCode?: string;
  bleDeviceId?: string;
  gpsDeviceId?: string;
  trackingMethod?: 'GPS' | 'RFID' | 'QR Code' | 'BLE' | 'Manual' | string;
  status: AssetStatus;
  siteId: string;
  siteName: string;
  zoneId: string;
  zoneName: string;
  projectId?: string;
  projectName?: string;
  assignedWorker?: string;
  assignedOperator?: string;
  assignedDepartment?: string;
  custodianId?: string;
  custodianName?: string;
  purchaseDate: string;
  cost: number;
  currentValue?: number;
  rentalCostPerDay?: number;
  dailyRate?: number;
  isRental: boolean;
  ownershipType?: 'Owned' | 'Rented' | 'Leased' | string;
  rentalEndDate?: string;
  lastSeenAt: string;
  lastReaderId?: string;
  rssi?: number; // e.g. -45 dBm
  photoUrl: string;
  condition: AssetCondition;
  operatingHours?: number;
  fuelLevel?: number; // percentage 0-100
  batteryLevel?: number; // percentage 0-100
  speedKmh?: number;
  utilizationPercent?: number; // percentage 0-100
  nextServiceDueHours?: number;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  coordinates?: { lat: number; lng: number };
  gpsBreadcrumbs?: Array<{ timestamp: string; lat: number; lng: number; zoneName?: string }>;
  documents?: AssetDocument[];
  photos?: string[];
  customFields?: Record<string, string | number>;
  kitId?: string;
  kitName?: string;
  notes?: string;
  hoursUsed?: number;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  client: string;
  projectManager: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: 'Planning' | 'Active' | 'Paused' | 'Completed';
  siteIds: string[];
  description?: string;
}

export interface Geofence {
  id: string;
  name: string;
  siteId: string;
  siteName: string;
  type: 'Construction Site' | 'Equipment Yard' | 'Warehouse' | 'Restricted Area' | 'Storage Area' | 'Parking Area';
  shape: 'polygon' | 'circle';
  center?: { lat: number; lng: number };
  radiusMeters?: number;
  coordinates?: { lat: number; lng: number }[];
  color: string;
  rules: {
    alertOnExit: boolean;
    alertOnUnauthorizedEntry: boolean;
    restrictedHoursActive: boolean;
    restrictedHoursStart?: string; // e.g. "19:00"
    restrictedHoursEnd?: string; // e.g. "06:00"
  };
  active: boolean;
  assetCount?: number;
}

export interface AssetMovement {
  id: string;
  assetId: string;
  assetName: string;
  assetCategory?: string;
  fromLocation: string;
  toLocation: string;
  fromSiteId?: string;
  toSiteId?: string;
  movementTime: string;
  movementType: 'Site Transfer' | 'Check-Out' | 'Check-In' | 'Delivery' | 'Maintenance' | 'Unauthorized Movement';
  authorizedBy: string;
  status: 'Completed' | 'In Transit' | 'Pending Approval' | 'Flagged';
  trackingSource: 'GPS' | 'RFID' | 'QR Scan' | 'BLE' | 'Manual';
  coordinates?: { lat: number; lng: number };
  notes?: string;
}

export interface InspectionChecklistItem {
  id: string;
  label: string;
  category: 'Engine' | 'Tires/Tracks' | 'Hydraulics' | 'Safety Equipment' | 'Fluid Levels' | 'Visible Damage' | 'General';
  passed: boolean;
  notes?: string;
}

export interface Inspection {
  id: string;
  assetId: string;
  assetName: string;
  inspector: string;
  inspectorRole: string;
  date: string;
  location: string;
  siteId: string;
  siteName?: string;
  condition: AssetCondition;
  safetyStatus: 'Safe to Operate' | 'Operate with Caution' | 'Unsafe - Red Tagged';
  damageNotes: string;
  checklist: InspectionChecklistItem[];
  result: 'Passed' | 'Passed with Issues' | 'Failed';
  signature: string;
  photoUrl?: string;
  createdAlertId?: string;
  createdWorkOrderId?: string;
}

export interface WorkOrder {
  id: string;
  assetId: string;
  assetName: string;
  type: 'Preventive Maintenance' | 'Corrective Repair' | 'Emergency Fix' | 'Inspection Followup' | 'Inspection Follow-up' | 'Recalibration';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  assignedTechnician: string;
  description: string;
  parts: string[];
  laborHours: number;
  estimatedCost: number;
  actualCost?: number;
  startDate: string;
  dueDate: string;
  completionDate?: string;
  status: 'Open' | 'Assigned' | 'In Progress' | 'Waiting' | 'Completed' | 'Cancelled';
  siteId: string;
  siteName: string;
  notes?: string;
}

export interface AiInsight {
  id: string;
  title: string;
  category: 'Low Utilization' | 'Maintenance Risk' | 'Movement Anomaly' | 'Asset Allocation' | 'Idle Fuel Loss' | 'Compliance Flag';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  assetId?: string;
  assetName?: string;
  projectId?: string;
  projectName?: string;
  siteId?: string;
  siteName?: string;
  description: string;
  recommendation: string;
  metric: string;
  timestamp: string;
  status: 'Active' | 'Reviewed' | 'Dismissed';
  confidenceScore: number;
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

export type EventType = 'ENTER' | 'ENTRY' | 'EXIT' | 'SCAN' | 'HEARTBEAT' | 'GEOFENCE_BREACH' | 'DWELL';

export interface ReadEvent {
  id: string;
  epc?: string;
  tagEpc?: string;
  assetId?: string;
  assetName?: string;
  assetCategory?: AssetCategory;
  readerId: string;
  readerName: string;
  siteId?: string;
  siteName?: string;
  zoneId?: string;
  zoneName?: string;
  location?: string;
  rssi: number;
  timestamp: string;
  eventType: EventType;
  antennaId?: number;
  antennaPort?: number;
}

export type RfidEvent = ReadEvent;

export interface Checkout {
  id: string;
  assetId: string;
  assetName: string;
  assetCategory?: AssetCategory;
  tagEpc?: string;
  userId: string;
  userName: string;
  badgeId?: string;
  checkoutTime?: string;
  checkedOutAt?: string;
  expectedReturn?: string;
  expectedReturnAt?: string;
  actualReturn?: string;
  returnedAt?: string;
  jobId: string;
  jobName?: string;
  checkoutCondition?: AssetCondition;
  returnCondition?: AssetCondition;
  checkoutSignature?: string;
  notes?: string;
  photoUrl?: string;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'Active' | 'Returned';
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
  serviceType?: string;
  date: string;
  scheduledDate: string;
  cost: number;
  technician: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue';
  notes: string;
  workOrderId?: string;
  description?: string;
  completedAt?: string;
  nextServiceDue?: string;
}

export type AlertType = 
  | 'Unauthorized Movement'
  | 'Geofence Exit'
  | 'Geofence Breach'
  | 'Restricted Zone Entry'
  | 'After-Hours Movement'
  | 'Maintenance Due'
  | 'Maintenance Overdue'
  | 'Asset Idle'
  | 'Asset Offline'
  | 'Low Fuel'
  | 'Inspection Failed'
  | 'Missing Asset'
  | 'RFID Reader Offline'
  | 'GPS Device Offline'
  | 'GEOFENCE_BREACH' 
  | 'OVERDUE_CHECKOUT' 
  | 'UNAUTHORIZED_MOVEMENT' 
  | 'LOW_BATTERY' 
  | 'LOW_STOCK' 
  | 'MISSING_ASSET';

export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'CRITICAL' | 'WARNING' | 'INFO';

export type AlertStatus = 'New' | 'Acknowledged' | 'Investigating' | 'Resolved';

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
  timestamp?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  message: string;
  status?: AlertStatus;
  assignedUser?: string;
  description?: string;
}

export type UserRole = 
  | 'Administrator' 
  | 'Project Manager' 
  | 'Site Manager' 
  | 'Equipment Manager' 
  | 'Maintenance Manager' 
  | 'Field Worker'
  | 'Admin'
  | 'Yard Staff'
  | 'Maintenance Tech'
  | 'Equipment Foreman'
  | 'Safety & Compliance Inspector';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  siteAccess: string[]; // Site IDs
  badgeId: string;
  avatarUrl: string;
  phone: string;
  title?: string;
  department?: string;
}

export interface Reader {
  id: string;
  name: string;
  model?: string;
  type?: 'Fixed Portal' | 'Handheld' | 'Vehicle Mounted' | string;
  siteId: string;
  siteName: string;
  zoneId: string;
  zoneName: string;
  location?: string;
  status: 'Online' | 'Offline' | 'Warning';
  lastHeartbeat: string;
  antennaPowerDbm: number;
  antennaCount?: number;
  ipAddress: string;
  readCountTotal?: number;
  totalReadsCount?: number;
  bufferedEventsCount?: number;
  firmwareVersion?: string;
  lastSeen?: string;
  port?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  siteId: string;
  siteName: string;
  quantityOnHand?: number;
  currentQuantity?: number;
  minThreshold: number;
  unit?: string; // e.g. 'Boxes', 'Liters', 'Units', 'Pallets'
  reorderPoint?: number;
  costPerUnit?: number;
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

export type BleDeviceStatus = 'Online' | 'Offline' | 'Low Battery' | 'Maintenance Required';

export interface BleDevice {
  id: string; // e.g. "BLE-EX-102-B8"
  macAddress: string; // e.g. "C4:4F:33:12:8A:90"
  assetId: string;
  assetName: string;
  assetType: string;
  siteId: string;
  siteName: string;
  zoneId: string;
  zoneName: string;
  batteryLevel: number; // 0-100%
  rssi: number; // -30 to -95 dBm
  txPowerDbm: number; // e.g. +4 dBm
  advertisingIntervalMs: number; // e.g. 500 ms
  status: BleDeviceStatus;
  lastCommunication: string;
  beaconProtocol: 'iBeacon' | 'Eddystone' | 'Custom Telemetry';
  major?: number;
  minor?: number;
  firmwareVersion: string;
  temperatureCelsius?: number;
  motionDetected?: boolean;
}

export interface GpsBreadcrumb {
  id: string;
  assetId: string;
  timestamp: string;
  lat: number;
  lng: number;
  speedKmh: number;
  headingDegrees: number;
  altitudeMeters: number;
  batteryPercent: number;
  satellites: number;
  ignitionState: 'ON' | 'OFF' | 'IDLE';
}

export interface QrScanRecord {
  id: string;
  assetId: string;
  assetName: string;
  qrCode: string;
  scannedAt: string;
  scannedBy: string;
  siteId: string;
  siteName: string;
  actionTaken: 'Check In' | 'Check Out' | 'Assign' | 'Transfer' | 'Inspect' | 'Report Damage' | 'Start Maintenance' | 'View Location' | 'View History';
  notes?: string;
  lat?: number;
  lng?: number;
}

