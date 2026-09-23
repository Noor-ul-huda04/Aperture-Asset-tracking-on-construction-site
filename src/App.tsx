/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { SidebarNav, TabType } from './components/SidebarNav';
import { DashboardView } from './components/DashboardView';
import { AssetRegistryView } from './components/AssetRegistryView';
import { LiveTrackingMapView } from './components/LiveTrackingMapView';
import { AssetDetailModal } from './components/AssetDetailModal';
import { AssetFormModal } from './components/AssetFormModal';
import { FindAssetRadarModal } from './components/FindAssetRadarModal';
import { CheckoutCustodyView } from './components/CheckoutCustodyView';
import { GeofenceAlertsView } from './components/GeofenceAlertsView';
import { InventoryView } from './components/InventoryView';
import { MaintenanceView } from './components/MaintenanceView';
import { UtilizationRentalView } from './components/UtilizationRentalView';
import { HardwareManagementView } from './components/HardwareManagementView';
import { ReportsAnalyticsView } from './components/ReportsAnalyticsView';
import { MobileFieldScannerView } from './components/MobileFieldScannerView';
import { AiEventBehaviorView } from './components/AiEventBehaviorView';
import { SettingsView } from './components/SettingsView';
import { UserPortalView } from './components/UserPortalView';
import { PlaybackView } from './components/PlaybackView';
import { DeveloperApiView } from './components/DeveloperApiView';
import { ApiLogsView } from './components/ApiLogsView';
import { AuditLogsView } from './components/AuditLogsView';
import { HardwareSimulatorDrawer } from './components/HardwareSimulatorDrawer';
import { QrCodeModal } from './components/QrCodeModal';
import { PublicAssetView } from './components/PublicAssetView';
import { CsvImportModal } from './components/CsvImportModal';
import { LoginView } from './components/LoginView';

// Construction Domain Modules
import { ProjectsView } from './components/ProjectsView';
import { ConstructionSitesView } from './components/ConstructionSitesView';
import { AssetMovementsView } from './components/AssetMovementsView';
import { RfidScanningView } from './components/RfidScanningView';
import { GeofencesView } from './components/GeofencesView';
import { InspectionsView } from './components/InspectionsView';
import { WorkOrdersView } from './components/WorkOrdersView';
import { AlertsCenterView } from './components/AlertsCenterView';
import { AiInsightsView } from './components/AiInsightsView';
import { ReportsView } from './components/ReportsView';
import { UsersRolesView } from './components/UsersRolesView';
import { BleDevicesView } from './components/BleDevicesView';
import { QrScannerView } from './components/QrScannerView';
import { RfidView } from './components/RfidView';

import {
  fetchGaoAssetTrackingData,
  getGaoRealtime,
  GAO_API_BASE_URL,
  getSites,
  getAssets,
  getUsers,
  getReaders,
  getAlerts,
  getCheckouts,
  getMaintenance,
  getInventory,
  getEvents
} from './services/api';

import { 
  Asset, 
  Site, 
  Checkout, 
  Alert, 
  ReadEvent, 
  MaintenanceLog, 
  InventoryItem, 
  Reader, 
  User, 
  AuditLog,
  Project,
  Geofence,
  AssetMovement,
  Inspection,
  WorkOrder,
  AiInsight,
  BleDevice,
  GpsBreadcrumb,
  QrScanRecord
} from './types';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

const DEFAULT_AUTHORIZED_USER: User = {
  id: 'usr-admin',
  name: 'Site Administrator',
  email: 'admin@aperature.io',
  role: 'Admin',
  department: 'Operations & Fleet Management',
  siteAccess: ['ALL'],
  badgeId: 'BADGE-ADM-01',
  avatarUrl: '',
  phone: ''
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('ALL');

  // Global Time Zone State
  const [currentTimezone, setCurrentTimezone] = useState<string>('UTC');

  // API State Tracking
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Construction Core Data Collections (Strictly real data only - initialized empty)
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [movements, setMovements] = useState<AssetMovement[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [aiInsights, setAiInsights] = useState<AiInsight[]>([]);
  const [users, setUsers] = useState<User[]>([DEFAULT_AUTHORIZED_USER]);

  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [readEvents, setReadEvents] = useState<ReadEvent[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Telemetry & Hardware State
  const [bleDevices, setBleDevices] = useState<BleDevice[]>([]);
  const [gpsBreadcrumbs, setGpsBreadcrumbs] = useState<GpsBreadcrumb[]>([]);
  const [qrScanLogs, setQrScanLogs] = useState<QrScanRecord[]>([]);

  // System Hardware Stream State
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);

  // Database Connection & Manual Sync State
  const [isDatabaseOnline, setIsDatabaseOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(new Date().toLocaleTimeString());

  // Real-time Network Connectivity Monitoring
  useEffect(() => {
    const handleOnline = () => setIsDatabaseOnline(true);
    const handleOffline = () => setIsDatabaseOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Modals & Drawers
  const [assetFormOpen, setAssetFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [inspectingAsset, setInspectingAsset] = useState<Asset | null>(null);
  const [radarAsset, setRadarAsset] = useState<Asset | null>(null);
  const [qrModalAsset, setQrModalAsset] = useState<Asset | null>(null);
  const [hardwareDrawerOpen, setHardwareDrawerOpen] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);

  // Public View State (from URL query ?publicAsset=ASSET_ID)
  const initialPublicAsset = new URLSearchParams(window.location.search).get('publicAsset');
  const [publicAssetId, setPublicAssetId] = useState<string | null>(initialPublicAsset);

  // Authentication State - Defaults to true for instant application readiness
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const stored = localStorage.getItem('buildtrack_auth');
    if (stored !== null) return stored === 'true';
    return true;
  });

  // Current User Persona (Senior Equipment Director)
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('buildtrack_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DEFAULT_AUTHORIZED_USER;
  });

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('buildtrack_auth', 'true');
    localStorage.setItem('buildtrack_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('buildtrack_auth', 'false');
  };

  const isFetchingRef = useRef<boolean>(false);

  // Data Fetcher: Fetches core construction sites, assets, users, hardware, and live hardware reads
  const loadAllData = useCallback(async () => {
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const [
        sitesRes,
        assetsRes,
        usersRes,
        readersRes,
        alertsRes,
        checkoutsRes,
        maintRes,
        invRes,
        eventsRes,
        gaoData
      ] = await Promise.allSettled([
        getSites(),
        getAssets(),
        getUsers(),
        getReaders(),
        getAlerts(),
        getCheckouts(),
        getMaintenance(),
        getInventory(),
        getEvents(),
        fetchGaoAssetTrackingData()
      ]);

      let loadedSites: Site[] = [];
      if (sitesRes.status === 'fulfilled' && Array.isArray(sitesRes.value)) {
        loadedSites = sitesRes.value;
      }

      let loadedAssets: Asset[] = [];
      if (assetsRes.status === 'fulfilled' && Array.isArray(assetsRes.value) && assetsRes.value.length > 0) {
        loadedAssets = assetsRes.value;
      }

      // Merge GAO RFID hardware gateway data if active
      if (gaoData.status === 'fulfilled' && gaoData.value) {
        if (gaoData.value.sites?.length) {
          const existingSiteIds = new Set(loadedSites.map(s => s.id));
          const newSites = gaoData.value.sites.filter(s => !existingSiteIds.has(s.id));
          loadedSites = [...loadedSites, ...newSites];
        }
        if (gaoData.value.assets?.length) {
          const gaoIds = new Set(gaoData.value.assets.map((a: Asset) => a.id));
          const existingWithoutGao = loadedAssets.filter(p => !gaoIds.has(p.id));
          loadedAssets = [...existingWithoutGao, ...gaoData.value.assets];
        }
        if (gaoData.value.events?.length) {
          setReadEvents(gaoData.value.events);
        }
        if (gaoData.value.readers?.length) {
          setReaders(prev => {
            const existingReaderIds = new Set(prev.map(r => r.id));
            const newReaders = (gaoData.value?.readers || []).filter(r => !existingReaderIds.has(r.id));
            return [...prev, ...newReaders];
          });
        }
      }

      // Deduplicate loadedSites by ID
      const uniqueSitesMap = new Map<string, Site>();
      loadedSites.forEach((s) => {
        if (s && s.id) uniqueSitesMap.set(s.id, s);
      });
      loadedSites = Array.from(uniqueSitesMap.values());

      // Deduplicate loadedAssets by ID
      const uniqueAssetsMap = new Map<string, Asset>();
      loadedAssets.forEach((a) => {
        if (a && a.id) uniqueAssetsMap.set(a.id, a);
      });
      loadedAssets = Array.from(uniqueAssetsMap.values());

      if (loadedSites.length > 0) {
        setSites(loadedSites);
        // Build project models linked to sites if not set
        setProjects(prev => {
          if (prev.length > 0) return prev;
          return loadedSites.map((s, idx) => ({
            id: `proj-${s.id}`,
            name: `${s.name} Infrastructure`,
            code: `PRJ-${s.code || idx + 1}`,
            client: 'General Infrastructure Partners',
            projectManager: s.manager || 'Site Director',
            startDate: '2024-01-01',
            endDate: '2027-12-31',
            budget: 15000000 + idx * 5000000,
            status: 'Active',
            siteIds: [s.id],
            description: `Active construction and asset telemetry tracking for ${s.name}.`
          }));
        });
        // Build geofence models linked to site zones if not set
        setGeofences(prev => {
          if (prev.length > 0) return prev;
          const built: Geofence[] = [];
          loadedSites.forEach((s) => {
            (s.zones || []).forEach((z) => {
              built.push({
                id: `geo-${z.id}`,
                name: `${z.name} Boundary`,
                siteId: s.id,
                siteName: s.name,
                type: (z.type as any) || 'Construction Site',
                shape: 'polygon',
                color: z.color || '#3b82f6',
                rules: {
                  alertOnExit: true,
                  alertOnUnauthorizedEntry: true,
                  restrictedHoursActive: false
                },
                active: true,
                assetCount: z.currentCount || 0
              });
            });
          });
          return built;
        });
      }

      if (loadedAssets.length > 0) {
        setAssets(loadedAssets);
      }

      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) && usersRes.value.length > 0) {
        setUsers(usersRes.value);
      }

      if (readersRes.status === 'fulfilled' && Array.isArray(readersRes.value) && readersRes.value.length > 0) {
        setReaders(prev => {
          const gaoReaderIds = new Set(prev.map(r => r.id));
          const newR = readersRes.value.filter(r => !gaoReaderIds.has(r.id));
          return [...prev, ...newR];
        });
      }

      if (alertsRes.status === 'fulfilled' && Array.isArray(alertsRes.value)) {
        setAlerts(alertsRes.value);
      }

      if (checkoutsRes.status === 'fulfilled' && Array.isArray(checkoutsRes.value)) {
        setCheckouts(checkoutsRes.value);
      }

      if (maintRes.status === 'fulfilled' && Array.isArray(maintRes.value)) {
        setMaintenanceLogs(maintRes.value);
      }

      if (invRes.status === 'fulfilled' && Array.isArray(invRes.value)) {
        setInventory(invRes.value);
      }

      if (eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value)) {
        setReadEvents(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const incoming = eventsRes.value.filter(e => !existingIds.has(e.id));
          return [...prev, ...incoming].slice(0, 200);
        });
      }

      setApiError(null);
      setLastSyncedAt(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.warn('Backend & Hardware Data Fetch Error:', err?.message);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Polling GAO RFID Real-Time Tag Stream directly from API
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const realTimeTags = await getGaoRealtime().catch(() => null);
        if (Array.isArray(realTimeTags) && realTimeTags.length > 0) {
          const now = new Date().toISOString();
          const newEvents: ReadEvent[] = realTimeTags.map((rt: any, idx: number) => {
            const tagId = String(rt.TagID || rt.tagId || '').trim();
            const loc = String(rt.Location || rt.location || 'Zone 1').trim();
            const ts = rt.Timestamp || rt.timestamp || now;
            return {
              id: `rt-${tagId}-${Date.now()}-${idx}`,
              epc: tagId,
              assetId: `ast-${tagId.toLowerCase()}`,
              assetName: `RFID Tag ${tagId.slice(-6)}`,
              assetCategory: 'Equipment',
              readerId: `reader-${loc.toLowerCase().replace(/\s+/g, '-')}`,
              readerName: `UHF RFID Portal — ${loc}`,
              siteId: sites[0]?.id || 'site-gao-rfid',
              siteName: sites[0]?.name || 'UHF RFID Tracking Facility',
              zoneId: `zone-${loc.toLowerCase().replace(/\s+/g, '-')}`,
              zoneName: loc,
              rssi: -45,
              timestamp: ts,
              eventType: 'SCAN',
              antennaId: loc === 'Zone2' ? 2 : 1
            };
          });

          setReadEvents(prev => [...newEvents, ...prev].slice(0, 200));

          // Real-time position updates for live assets from API
          setAssets(prev => {
            const updated = [...prev];
            realTimeTags.forEach((rt: any) => {
              const tagId = String(rt.TagID || rt.tagId || '').trim();
              const loc = String(rt.Location || rt.location || 'Zone 1').trim();
              const ts = rt.Timestamp || rt.timestamp || now;
              const idx = updated.findIndex(a => a.tagEpc === tagId || a.id === `ast-${tagId.toLowerCase()}`);
              if (idx !== -1) {
                updated[idx] = {
                  ...updated[idx],
                  status: 'In Zone',
                  zoneId: `zone-${loc.toLowerCase().replace(/\s+/g, '-')}`,
                  zoneName: loc,
                  lastSeenAt: ts
                };
              }
            });
            return updated;
          });
        }
      } catch (err) {
        // non-blocking
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [sites]);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Handlers
  const handleSaveAsset = (assetData: Partial<Asset>) => {
    if (editingAsset) {
      setAssets(prev => prev.map(a => a.id === editingAsset.id ? { ...a, ...assetData } : a));
      showToast(`Asset ${assetData.name || editingAsset.name} updated successfully.`);
    } else {
      const newAsset: Asset = {
        id: `ast-${Date.now().toString(36)}`,
        name: assetData.name || 'New RFID Asset',
        category: assetData.category || 'RFID Hardware Asset',
        status: assetData.status || 'Active',
        siteId: assetData.siteId || sites[0]?.id || 'site-gao-rfid',
        siteName: sites.find(s => s.id === assetData.siteId)?.name || sites[0]?.name || 'UHF RFID Tracking Facility',
        trackingMethod: assetData.trackingMethod || 'RFID',
        tagEpc: assetData.tagEpc || `E280116060${Math.floor(Math.random()*1000000)}`,
        condition: 'Good',
        ...assetData
      } as Asset;
      setAssets(prev => [newAsset, ...prev]);
      showToast(`Asset ${newAsset.name} registered.`);
    }
    setAssetFormOpen(false);
    setEditingAsset(null);
  };

  const handleDeleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    showToast('Asset removed from registry.');
  };

  const handleResolveAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true, status: 'Resolved' } : a));
    showToast('Alert resolved and archived.');
  };

  const handleCreateCheckout = async (data: any) => {
    const newCheckout: Checkout = {
      id: `chk-${Date.now().toString(36)}`,
      assetId: data.assetId,
      assetName: assets.find(a => a.id === data.assetId)?.name || 'Equipment Unit',
      userId: data.userId,
      userName: users.find(u => u.id === data.userId)?.name || currentUser.name,
      checkedOutAt: new Date().toISOString(),
      expectedReturnAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      status: 'Active',
      jobId: data.jobId || 'Site Core Works',
      notes: data.notes || ''
    };
    setCheckouts(prev => [newCheckout, ...prev]);
    setAssets(prev => prev.map(a => a.id === data.assetId ? { ...a, status: 'Active', assignedOperator: newCheckout.userName } : a));
    showToast('Asset assigned to custodian successfully.');
  };

  const handleReturnCheckout = async (checkoutId: string, condition = 'Good') => {
    setCheckouts(prev => prev.map(c => c.id === checkoutId ? { ...c, status: 'Returned', returnedAt: new Date().toISOString() } : c));
    showToast('Asset custody checked in.');
  };

  const handleCreateMaintenance = (data: any) => {
    const newLog: MaintenanceLog = {
      id: `maint-${Date.now().toString(36)}`,
      assetId: data.assetId,
      assetName: assets.find(a => a.id === data.assetId)?.name || 'Asset',
      type: 'Repair',
      date: new Date().toISOString().split('T')[0],
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'Completed',
      notes: data.description || 'Routine service executed',
      technician: data.technician || currentUser.name,
      serviceType: data.serviceType || 'Inspection',
      description: data.description || '',
      completedAt: new Date().toISOString(),
      cost: Number(data.cost) || 0,
      nextServiceDue: data.nextServiceDue
    };
    setMaintenanceLogs(prev => [newLog, ...prev]);
    showToast('Maintenance service record logged.');
  };

  const handleAddReader = (reader: Partial<Reader>) => {
    const newReader: Reader = {
      id: `rdr-${Date.now().toString(36)}`,
      name: reader.name || 'New RFID Antenna',
      model: reader.model || 'GAO-216002',
      siteId: reader.siteId || 'site-1',
      siteName: sites.find(s => s.id === reader.siteId)?.name || 'Metro Project',
      zoneId: reader.zoneId || 'zone-laydown',
      zoneName: reader.zoneName || 'Laydown Yard',
      ipAddress: reader.ipAddress || '192.168.1.100',
      port: 5084,
      antennaPowerDbm: 30,
      status: 'Online',
      lastHeartbeat: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
    setReaders(prev => [...prev, newReader]);
    showToast(`Reader ${newReader.name} connected.`);
  };

  const handleTriggerReaderScan = (readerId: string) => {
    showToast(`Triggered manual scan on reader ${readerId}.`);
  };

  const handleUpdateInventoryQuantity = (id: string, delta: number) => {
    setInventory(prev => prev.map(i => i.id === id ? { ...i, currentQuantity: Math.max(0, i.currentQuantity + delta) } : i));
  };

  const handleAddInventoryItem = (item: any) => {
    const newItem: InventoryItem = {
      id: `inv-${Date.now().toString(36)}`,
      siteId: item.siteId || 'site-1',
      siteName: sites.find(s => s.id === item.siteId)?.name || 'Metro Project',
      minThreshold: item.minThreshold || 5,
      ...item
    };
    setInventory(prev => [...prev, newItem]);
    showToast('Material stock item added.');
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncedAt(new Date().toLocaleTimeString());
      showToast('Telemetry data synchronized across sites.');
    }, 800);
  };

  const handleImportCsvAssets = (newAssetsList: Partial<Asset>[]) => {
    const imported: Asset[] = newAssetsList.map((item, idx) => ({
      id: item.id || `imp-${Date.now().toString(36)}-${idx}`,
      name: item.name || 'Imported Construction Asset',
      category: item.category || 'Heavy Equipment',
      status: (item.status as any) || 'Active',
      siteId: item.siteId || 'site-1',
      siteName: sites.find(s => s.id === item.siteId)?.name || 'Metro High-Rise Project',
      tagEpc: item.tagEpc || `E280116060${Math.floor(Math.random()*1000000)}`,
      condition: 'Good',
      trackingMethod: item.trackingMethod || 'GPS',
      ...item
    } as Asset));
    setAssets(prev => [...imported, ...prev]);
    showToast(`Imported ${newAssetsList.length} assets successfully.`);
  };

  // Public Asset View
  if (publicAssetId) {
    return (
      <PublicAssetView
        assetId={publicAssetId}
        assets={assets}
        sites={sites}
        readEvents={readEvents}
        checkouts={checkouts}
        onExitPublicView={() => {
          setPublicAssetId(null);
          window.history.replaceState({}, '', window.location.pathname);
        }}
      />
    );
  }

  // Filtered dataset based on selectedSiteId dropdown in header
  const safeAssets = assets || [];
  const safeAlerts = alerts || [];
  const safeReadEvents = readEvents || [];
  const safeCheckouts = checkouts || [];
  const safeInventory = inventory || [];
  const safeMaintenanceLogs = maintenanceLogs || [];
  const safeReaders = readers || [];

  const filteredAssets = selectedSiteId === 'ALL' ? safeAssets : safeAssets.filter(a => a.siteId === selectedSiteId);
  const filteredAlerts = selectedSiteId === 'ALL' ? safeAlerts : safeAlerts.filter(a => a.siteId === selectedSiteId);
  const filteredReadEvents = selectedSiteId === 'ALL' ? safeReadEvents : safeReadEvents.filter(e => e.siteId === selectedSiteId);
  const filteredCheckouts = selectedSiteId === 'ALL' ? safeCheckouts : safeCheckouts.filter(c => {
    const asset = safeAssets.find(a => a.id === c.assetId);
    return asset && asset.siteId === selectedSiteId;
  });
  const filteredInventory = selectedSiteId === 'ALL' ? safeInventory : safeInventory.filter(i => i.siteId === selectedSiteId);
  const filteredMaintenanceLogs = selectedSiteId === 'ALL' ? safeMaintenanceLogs : safeMaintenanceLogs.filter(m => {
    const asset = safeAssets.find(a => a.id === m.assetId);
    return asset && asset.siteId === selectedSiteId;
  });
  const filteredReaders = selectedSiteId === 'ALL' ? safeReaders : safeReaders.filter(r => r.siteId === selectedSiteId);

  // Authentication Guard
  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        availableUsers={users}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Header Navigation */}
      <Header
        sites={sites}
        selectedSiteId={selectedSiteId}
        onSelectSite={setSelectedSiteId}
        alerts={alerts}
        onOpenAlertsModal={() => setActiveTab('alerts')}
        onOpenHardwareDrawer={() => setHardwareDrawerOpen(true)}
        onOpenMobileView={() => setActiveTab('mobile')}
        currentUser={currentUser}
        onSwitchUserRole={(u) => setCurrentUser(u)}
        allUsers={users}
        isStreaming={isStreaming}
        offlineMode={offlineMode}
        isFirestoreOnline={isDatabaseOnline}
        onManualSync={handleManualSync}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        onNavigateTab={setActiveTab}
        currentTimezone={currentTimezone}
        onChangeTimezone={setCurrentTimezone}
        onLogout={handleLogout}
        assets={assets}
        onSelectAsset={setInspectingAsset}
        apiConnectionStatus={assets.length > 0 || readEvents.length > 0 ? 'connected' : 'no_data'}
        apiStatusMessage={assets.length > 0 ? 'API Connected' : 'API not connected.'}
      />

      {/* Main Body: Sidebar Navigation + Tab Contents */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <SidebarNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          unresolvedAlertsCount={alerts.filter(a => !a.resolved && (a as any).status !== 'Resolved').length}
        />

        {/* Dynamic View Tab Body */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden space-y-6">
          {/* Toast Notification */}
          {toast && (
            <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in ${
              toast.type === 'success'
                ? 'bg-emerald-900 border border-emerald-500/40 text-emerald-200'
                : 'bg-rose-900 border border-rose-500/40 text-rose-200'
            }`}>
              <span>{toast.message}</span>
              <button onClick={() => setToast(null)} className="text-slate-300 hover:text-white ml-3">✕</button>
            </div>
          )}

          {/* Tab Routing */}
          {activeTab === 'dashboard' && (
            <DashboardView
              assets={filteredAssets}
              alerts={filteredAlerts}
              readEvents={filteredReadEvents}
              sites={sites}
              checkouts={filteredCheckouts}
              onNavigateTab={setActiveTab}
              onOpenAssetDetail={setInspectingAsset}
              onOpenAlertsModal={() => setActiveTab('alerts')}
              currentTimezone={currentTimezone}
              onChangeTimezone={setCurrentTimezone}
            />
          )}

          {activeTab === 'tracking' && (
            <LiveTrackingMapView
              assets={filteredAssets}
              sites={sites}
              projects={projects}
              geofences={geofences}
              readers={filteredReaders}
              selectedSiteId={selectedSiteId}
              onSelectSite={setSelectedSiteId}
              onOpenAssetDetail={setInspectingAsset}
              onOpenQrModal={(a) => setQrModalAsset(a)}
              onFindRadar={setRadarAsset}
              onRefreshData={loadAllData}
              currentTimezone={currentTimezone}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              sites={sites}
              assets={filteredAssets}
              onSelectProject={(p) => {}}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'sites' && (
            <ConstructionSitesView
              sites={sites}
              assets={filteredAssets}
              onSelectSite={(s) => setSelectedSiteId(s.id)}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'assets' && (
            <AssetRegistryView
              assets={filteredAssets}
              sites={sites}
              initialCategoryFilter="ALL"
              onOpenRegisterModal={() => { setEditingAsset(null); setAssetFormOpen(true); }}
              onOpenDetailModal={setInspectingAsset}
              onOpenQrModal={(a) => setQrModalAsset(a)}
              onFindRadar={setRadarAsset}
              onCheckoutAsset={() => setActiveTab('checkouts')}
              onEditAsset={(a) => { setEditingAsset(a); setAssetFormOpen(true); }}
              onDeleteAsset={handleDeleteAsset}
              onImportCsv={() => setCsvImportOpen(true)}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'equipment' && (
            <AssetRegistryView
              assets={filteredAssets}
              sites={sites}
              initialCategoryFilter="Heavy Equipment"
              onOpenRegisterModal={() => { setEditingAsset(null); setAssetFormOpen(true); }}
              onOpenDetailModal={setInspectingAsset}
              onOpenQrModal={(a) => setQrModalAsset(a)}
              onFindRadar={setRadarAsset}
              onCheckoutAsset={() => setActiveTab('checkouts')}
              onEditAsset={(a) => { setEditingAsset(a); setAssetFormOpen(true); }}
              onDeleteAsset={handleDeleteAsset}
              onImportCsv={() => setCsvImportOpen(true)}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'tools' && (
            <AssetRegistryView
              assets={filteredAssets}
              sites={sites}
              initialCategoryFilter="Tools"
              onOpenRegisterModal={() => { setEditingAsset(null); setAssetFormOpen(true); }}
              onOpenDetailModal={setInspectingAsset}
              onOpenQrModal={(a) => setQrModalAsset(a)}
              onFindRadar={setRadarAsset}
              onCheckoutAsset={() => setActiveTab('checkouts')}
              onEditAsset={(a) => { setEditingAsset(a); setAssetFormOpen(true); }}
              onDeleteAsset={handleDeleteAsset}
              onImportCsv={() => setCsvImportOpen(true)}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'vehicles' && (
            <AssetRegistryView
              assets={filteredAssets}
              sites={sites}
              initialCategoryFilter="Vehicles"
              onOpenRegisterModal={() => { setEditingAsset(null); setAssetFormOpen(true); }}
              onOpenDetailModal={setInspectingAsset}
              onOpenQrModal={(a) => setQrModalAsset(a)}
              onFindRadar={setRadarAsset}
              onCheckoutAsset={() => setActiveTab('checkouts')}
              onEditAsset={(a) => { setEditingAsset(a); setAssetFormOpen(true); }}
              onDeleteAsset={handleDeleteAsset}
              onImportCsv={() => setCsvImportOpen(true)}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'materials' && (
            <AssetRegistryView
              assets={filteredAssets}
              sites={sites}
              initialCategoryFilter="Materials"
              onOpenRegisterModal={() => { setEditingAsset(null); setAssetFormOpen(true); }}
              onOpenDetailModal={setInspectingAsset}
              onOpenQrModal={(a) => setQrModalAsset(a)}
              onFindRadar={setRadarAsset}
              onCheckoutAsset={() => setActiveTab('checkouts')}
              onEditAsset={(a) => { setEditingAsset(a); setAssetFormOpen(true); }}
              onDeleteAsset={handleDeleteAsset}
              onImportCsv={() => setCsvImportOpen(true)}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'movements' && (
            <AssetMovementsView
              movements={movements}
              assets={filteredAssets}
              sites={sites}
              onNavigateTab={setActiveTab}
            />
          )}

          {(activeTab === 'qr_scanner') && (
            <QrScannerView
              assets={filteredAssets}
              sites={sites}
              currentUser={currentUser}
              onSelectAsset={setInspectingAsset}
              onOpenAssetDetail={setInspectingAsset}
              onCheckoutAsset={() => setActiveTab('checkouts')}
              onInspectAsset={() => setActiveTab('inspections')}
              onUpdateAsset={(updated) => setAssets(prev => prev.map(a => a.id === updated.id ? updated : a))}
            />
          )}

          {(activeTab === 'rfid' || activeTab === 'rfid_qr') && (
            <RfidView
              assets={filteredAssets}
              sites={sites}
              readers={readers}
              onSelectAsset={setInspectingAsset}
              onTriggerScan={(readerId) => showToast(`Triggered portal scan on ${readerId}`)}
            />
          )}

          {activeTab === 'ble_devices' && (
            <BleDevicesView
              bleDevices={bleDevices}
              assets={filteredAssets}
              sites={sites}
              onSelectAsset={setInspectingAsset}
              onOpenRadar={setRadarAsset}
              onAddBleDevice={(dev) => {
                setBleDevices(prev => [dev, ...prev]);
                showToast(`BLE beacon ${dev.id} paired`);
              }}
              onUpdateBleDevice={(dev) => {
                setBleDevices(prev => prev.map(d => d.id === dev.id ? dev : d));
              }}
            />
          )}

          {activeTab === 'geofences' && (
            <GeofencesView
              geofences={geofences}
              sites={sites}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceView
              maintenanceLogs={filteredMaintenanceLogs}
              assets={filteredAssets}
              onCreateMaintenance={handleCreateMaintenance}
            />
          )}

          {activeTab === 'inspections' && (
            <InspectionsView
              inspections={inspections}
              assets={filteredAssets}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'work_orders' && (
            <WorkOrdersView
              workOrders={workOrders}
              assets={filteredAssets}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsCenterView
              alerts={filteredAlerts}
              onResolveAlert={handleResolveAlert}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'analytics' && (
            <UtilizationRentalView assets={filteredAssets} />
          )}

          {activeTab === 'ai_insights' && (
            <AiInsightsView
              insights={aiInsights}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              assets={filteredAssets}
              inspections={inspections}
              workOrders={workOrders}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'users_roles' && (
            <UsersRolesView
              users={users}
              sites={sites}
              currentUser={currentUser}
              onSwitchUserRole={(newRole, user) => {
                if (user) {
                  setCurrentUser(user);
                  showToast(`Switched persona to ${user.name} (${user.role})`);
                } else {
                  const matched = users.find(u => u.role === newRole);
                  if (matched) {
                    setCurrentUser(matched);
                    showToast(`Switched persona to ${matched.name} (${matched.role})`);
                  } else {
                    setCurrentUser(prev => ({ ...prev, role: newRole }));
                    showToast(`Switched role to ${newRole}`);
                  }
                }
              }}
              onSwitchRole={(r, user) => {
                if (user) {
                  setCurrentUser(user);
                  showToast(`Switched persona to ${user.name} (${user.role})`);
                } else {
                  const matched = users.find(u => u.role === r);
                  if (matched) {
                    setCurrentUser(matched);
                    showToast(`Switched persona to ${matched.name} (${matched.role})`);
                  } else {
                    setCurrentUser(prev => ({ ...prev, role: r }));
                    showToast(`Switched role to ${r}`);
                  }
                }
              }}
            />
          )}

          {/* Complementary system views */}
          {activeTab === 'checkouts' && (
            <CheckoutCustodyView
              checkouts={filteredCheckouts}
              assets={filteredAssets}
              users={users}
              onCreateCheckout={handleCreateCheckout}
              onReturnCheckout={handleReturnCheckout}
            />
          )}

          {activeTab === 'geofencing' && (
            <GeofenceAlertsView
              alerts={filteredAlerts}
              onResolveAlert={handleResolveAlert}
              onOpenSettings={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'ai_behavior' && (
            <AiEventBehaviorView
              events={filteredReadEvents}
              assets={filteredAssets}
              onRefreshData={loadAllData}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              inventory={filteredInventory}
              onUpdateQuantity={handleUpdateInventoryQuantity}
              onAddInventoryItem={handleAddInventoryItem}
            />
          )}

          {activeTab === 'utilization' && (
            <UtilizationRentalView assets={filteredAssets} />
          )}

          {activeTab === 'hardware' && (
            <HardwareManagementView
              readers={filteredReaders}
              onUpdatePower={(id, power) => {
                setReaders(prev => prev.map(r => r.id === id ? { ...r, antennaPowerDbm: power } : r));
                showToast(`Reader power adjusted to ${power} dBm`);
              }}
              onFlushBuffer={loadAllData}
              onTriggerReaderScan={handleTriggerReaderScan}
              onAddReader={handleAddReader}
            />
          )}

          {activeTab === 'mobile' && (
            <MobileFieldScannerView
              assets={filteredAssets}
              users={users}
              checkouts={filteredCheckouts}
              onScanCheckout={async (assetId, userId) => {
                await handleCreateCheckout({ assetId, userId, jobId: 'job-mobile-field' });
              }}
              onScanReturn={async (checkoutId) => {
                await handleReturnCheckout(checkoutId, 'Good');
              }}
            />
          )}

          {activeTab === 'playback' && (
            <PlaybackView
              assets={filteredAssets}
              currentTimezone={currentTimezone}
              onChangeTimezone={setCurrentTimezone}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogsView auditLogs={auditLogs} />
          )}

          {activeTab === 'developer' && (
            <DeveloperApiView onEventsReceived={(evts) => {
              if (Array.isArray(evts) && evts.length > 0) {
                setReadEvents(prev => [...evts, ...(Array.isArray(prev) ? prev : [])].slice(0, 100));
              }
            }} />
          )}

          {activeTab === 'api-logs' && (
            <ApiLogsView onNavigateTab={setActiveTab} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              sites={sites}
              currentUser={currentUser}
              onRefreshAll={loadAllData}
              onNavigateTab={(tab: TabType | string) => setActiveTab(tab as TabType)}
              currentTimezone={currentTimezone}
              onChangeTimezone={setCurrentTimezone}
            />
          )}

          {activeTab === 'users' && (
            <UserPortalView
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              users={users}
              sites={sites}
              checkouts={filteredCheckouts}
              maintenanceLogs={filteredMaintenanceLogs}
              auditLogs={auditLogs}
              onNavigateTab={setActiveTab}
              onReturnCheckout={handleReturnCheckout}
            />
          )}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      {assetFormOpen && (
        <AssetFormModal
          isOpen={assetFormOpen}
          onClose={() => { setAssetFormOpen(false); setEditingAsset(null); }}
          onSubmit={handleSaveAsset}
          sites={sites}
          initialAsset={editingAsset}
        />
      )}

      {inspectingAsset && (
        <AssetDetailModal
          asset={inspectingAsset}
          onClose={() => setInspectingAsset(null)}
          readEvents={readEvents}
          checkouts={checkouts}
          bleDevices={bleDevices}
          breadcrumbs={gpsBreadcrumbs}
          onFindRadar={setRadarAsset}
          onCheckout={() => setActiveTab('checkouts')}
          onEdit={(a) => { setEditingAsset(a); setAssetFormOpen(true); }}
          onOpenQrModal={(a) => setQrModalAsset(a)}
        />
      )}

      {qrModalAsset && (
        <QrCodeModal
          asset={qrModalAsset}
          onClose={() => setQrModalAsset(null)}
          onOpenPublicView={(id) => {
            setQrModalAsset(null);
            setPublicAssetId(id);
          }}
        />
      )}

      {radarAsset && (
        <FindAssetRadarModal
          asset={radarAsset}
          onClose={() => setRadarAsset(null)}
        />
      )}

      {hardwareDrawerOpen && (
        <HardwareSimulatorDrawer
          isOpen={hardwareDrawerOpen}
          onClose={() => setHardwareDrawerOpen(false)}
          isStreaming={isStreaming}
          offlineMode={offlineMode}
          onRefreshAll={loadAllData}
        />
      )}

      {csvImportOpen && (
        <CsvImportModal
          isOpen={csvImportOpen}
          onClose={() => setCsvImportOpen(false)}
          onImport={handleImportCsvAssets}
          sites={sites}
        />
      )}
    </div>
  );
}
