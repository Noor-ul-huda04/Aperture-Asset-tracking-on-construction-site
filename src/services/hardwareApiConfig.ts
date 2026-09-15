/**
 * Dynamic API & Hardware Integration Gateway Service Configuration
 * Allows connecting custom REST APIs, WebSockets, MQTT brokers, or hardware reader gateways seamlessly.
 */

export type HardwareApiMode = 
  | 'DEFAULT_GAO' 
  | 'CUSTOM_REST' 
  | 'WEBSOCKET' 
  | 'MQTT' 
  | 'LOCAL_HARDWARE_GATEWAY';

export interface CustomFieldMapping {
  assetId: string;
  assetName: string;
  tagEpc: string;
  serialNumber: string;
  status: string;
  siteId: string;
  zoneName: string;
  category: string;
  cost: string;
  readerIp: string;
  rssiDbm: string;
  timestamp: string;
}

export interface HardwareGatewaySettings {
  readerIp: string;
  port: number;
  antennaPowerDbm: number;
  frequencyMHz: number;
  gatewayProtocol: 'HTTP_REST' | 'TCP_SOCKET' | 'MQTT' | 'WEBSOCKET';
  mqttTopic: string;
  autoIngest: boolean;
  heartbeatIntervalSec: number;
}

export interface ApiConnectorConfig {
  mode: HardwareApiMode;
  baseUrl: string;
  apiKey: string;
  authHeaderName: string;
  pollingIntervalMs: number;
  endpoints: {
    getAssets: string;
    getEvents: string;
    getReaders: string;
    getSites: string;
    postTagRead: string;
  };
  fieldMapping: CustomFieldMapping;
  hardware: HardwareGatewaySettings;
}

export const DEFAULT_CONNECTOR_CONFIG: ApiConnectorConfig = {
  mode: 'DEFAULT_GAO',
  baseUrl: 'https://www.i360services.com/peopletrackinguhf',
  apiKey: '',
  authHeaderName: 'X-API-Key',
  pollingIntervalMs: 5000,
  endpoints: {
    getAssets: '/api/GetHistoryRecords/0/30',
    getEvents: '/api/GetTagsInRealtime',
    getReaders: '/api/v1/readers',
    getSites: '/api/v1/sites',
    postTagRead: '/api/v1/telemetry/tag-read',
  },
  fieldMapping: {
    assetId: 'PersonID',
    assetName: 'PersonName',
    tagEpc: 'CardID',
    serialNumber: 'UserSN',
    status: 'UserRole',
    siteId: 'ReaderIp',
    zoneName: 'ReaderName',
    category: 'Department',
    cost: 'Cost',
    readerIp: 'ReaderIp',
    rssiDbm: 'SignalStrength',
    timestamp: 'Time',
  },
  hardware: {
    readerIp: '192.168.1.100',
    port: 8080,
    antennaPowerDbm: 30,
    frequencyMHz: 915.0,
    gatewayProtocol: 'HTTP_REST',
    mqttTopic: 'gao/rfid/reads',
    autoIngest: true,
    heartbeatIntervalSec: 10,
  },
};

const STORAGE_KEY = 'aperture_hardware_api_config';

export function getHardwareApiConfig(): ApiConnectorConfig {
  if (typeof window === 'undefined') return DEFAULT_CONNECTOR_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const merged: ApiConnectorConfig = { ...DEFAULT_CONNECTOR_CONFIG, ...parsed };
      // Auto-migrate legacy 404 paths for GAO endpoints
      if (merged.endpoints?.getAssets?.includes('GetHistoryDateCount')) {
        merged.endpoints.getAssets = '/api/GetHistoryRecords/0/30';
      }
      if (merged.endpoints?.getEvents?.includes('GetHistoryRealtimeCount')) {
        merged.endpoints.getEvents = '/api/GetTagsInRealtime';
      }
      return merged;
    }
  } catch (err) {
    console.warn('Failed to parse hardware API config from localStorage:', err);
  }
  return DEFAULT_CONNECTOR_CONFIG;
}

export function saveHardwareApiConfig(config: ApiConnectorConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save hardware API config:', err);
  }
}

export function resetHardwareApiConfig(): ApiConnectorConfig {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  return DEFAULT_CONNECTOR_CONFIG;
}
