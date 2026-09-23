/**
 * Real Data Mode - No Demo / Mock Data Preloaded
 * Strict No-Demo Data Requirement Enforced:
 * All operational data must originate strictly from real APIs, IoT hardware, or authorized user input.
 */

import { 
  Project, 
  Site, 
  Asset, 
  Geofence, 
  AssetMovement, 
  Inspection, 
  WorkOrder, 
  AiInsight, 
  Alert, 
  User, 
  Reader, 
  Checkout,
  BleDevice,
  GpsBreadcrumb,
  QrScanRecord,
  MaintenanceLog,
  InventoryItem,
  AuditLog
} from '../types';

export const DEMO_PROJECTS: Project[] = [];
export const DEMO_SITES: Site[] = [];
export const DEMO_ASSETS: Asset[] = [];
export const DEMO_GEOFENCES: Geofence[] = [];
export const DEMO_MOVEMENTS: AssetMovement[] = [];
export const DEMO_INSPECTIONS: Inspection[] = [];
export const DEMO_WORK_ORDERS: WorkOrder[] = [];
export const DEMO_ALERTS: Alert[] = [];
export const DEMO_AI_INSIGHTS: AiInsight[] = [];
export const DEMO_USERS: User[] = [];
export const DEMO_BLE_DEVICES: BleDevice[] = [];
export const DEMO_GPS_BREADCRUMBS: GpsBreadcrumb[] = [];
export const DEMO_QR_SCAN_LOGS: QrScanRecord[] = [];
export const DEMO_READERS: Reader[] = [];
export const DEMO_CHECKOUTS: Checkout[] = [];
export const DEMO_MAINTENANCE: MaintenanceLog[] = [];
export const DEMO_INVENTORY: InventoryItem[] = [];
export const DEMO_AUDIT_LOGS: AuditLog[] = [];
