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

import {
  fetchGaoAssetTrackingData,
  getGaoRealtime,
  getGaoHistoryCount,
  getGaoHistory,
  GAO_API_BASE_URL,
  API_BASE_URL
} from './services/api';

import { Asset, Site, Checkout, Alert, ReadEvent, MaintenanceLog, InventoryItem, Reader, User, AuditLog, AssetCategory, AssetCondition, AssetStatus } from './types';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('ALL');

  // Global Time Zone State
  const [currentTimezone, setCurrentTimezone] = useState<string>('UTC');

  // API State Tracking
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Core Data Collections State (Populated directly from Backend API & MongoDB Atlas)
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [readEvents, setReadEvents] = useState<ReadEvent[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

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

  // Authentication & Login Session State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('aperture_rfid_auth') === 'true';
  });

  // Current User Persona
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('aperture_rfid_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      id: 'usr-1',
      name: 'Sarah Jenkins',
      email: 'sjenkins@apertureconst.com',
      role: 'Site Manager',
      siteAccess: ['site-1', 'site-2'],
      badgeId: 'BDG-8801',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      phone: '+1 (555) 234-5678'
    };
  });

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('aperture_rfid_auth', 'true');
    localStorage.setItem('aperture_rfid_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('aperture_rfid_auth', 'false');
  };

  const isFetchingRef = useRef<boolean>(false);

  // Primary Data Fetcher: Loads directly from GAO RFID UHF Cloud Web APIs
  const loadAllData = useCallback(async () => {
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const gaoData = await fetchGaoAssetTrackingData();
      setAssets(gaoData.assets);
      setReadEvents(gaoData.events);
      setSites(gaoData.sites);
      setReaders(gaoData.readers);
      setApiError(null);
      setLastSyncedAt(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error('Failed to load data from GAO RFID API:', err);
      setApiError(`GAO RFID API Error: ${err.message || 'Unable to connect to https://www.i360services.com/peopletrackinguhf'}`);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Polling GAO RFID Real-Time Tag Stream (/api/GetTagsInRealtime) every 15 seconds
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
            };
          });

          setReadEvents(prev => [...newEvents, ...prev].slice(0, 200));

          setAssets(prev => {
            const updated = [...prev];
            realTimeTags.forEach((rt: any) => {
              const tagId = String(rt.TagID || rt.tagId || '').trim();
              const loc = String(rt.Location || rt.location || 'Zone 1').trim();
              const ts = rt.Timestamp || rt.timestamp || now;
              const existingIdx = updated.findIndex(a => a.tagEpc === tagId || a.id === tagId);
              if (existingIdx >= 0) {
                updated[existingIdx] = {
                  ...updated[existingIdx],
                  zoneName: loc,
                  lastSeenAt: ts,
                  status: 'In Zone'
                };
              } else {
                updated.unshift({
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
              }
            });
            return updated;
          });

          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      } catch (_) {}
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Manual Refresh Handler
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await loadAllData();
    } catch (err) {
      console.warn('Manual refresh failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Local demo state handlers
  const handleSaveAsset = async (data: Partial<Asset>) => {
    try {
      if (editingAsset) {
        setAssets(prev => prev.map(a => a.id === editingAsset.id ? { ...a, ...data } : a));
        showToast('Asset specifications updated successfully');
      } else {
        const newAsset: Asset = {
          id: data.id || `ast-gao-${Date.now()}`,
          name: data.name || 'New RFID Tag Asset',
          category: data.category || 'PPE',
          subCategory: data.subCategory || 'Personnel UHF Tag',
          manufacturer: 'GAO RFID INC.',
          model: 'GAO-UHF-T90',
          serialNumber: data.serialNumber || `SN-${Date.now()}`,
          tagEpc: data.tagEpc || `E280116060000207888${Math.floor(1000 + Math.random() * 9000)}`,
          status: data.status || 'In Zone',
          siteId: data.siteId || 'site-gao-facility',
          siteName: data.siteName || 'GAO RFID UHF Facility',
          zoneId: data.zoneId || 'zone-1',
          zoneName: data.zoneName || 'Antenna Zone 1',
          purchaseDate: '2024-01-15',
          cost: 120,
          isRental: false,
          lastSeenAt: new Date().toISOString(),
          lastReaderId: 'reader-gao-antenna-1',
          rssi: -48,
          photoUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150',
          condition: 'Good',
          custodianName: data.custodianName || 'Field Personnel',
          ...data
        };
        setAssets(prev => [newAsset, ...prev]);
        showToast('New asset registered successfully into Aperture catalog');
      }
    } catch (err: any) {
      console.error('Failed to save asset:', err);
      showToast(`Error saving asset: ${err.message || String(err)}`, 'error');
    } finally {
      setEditingAsset(null);
      setAssetFormOpen(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      setAssets(prev => prev.filter(a => a.id !== id));
      showToast('Asset removed from registry');
    } catch (err: any) {
      console.error('Failed to delete asset:', err);
      showToast(`Error deleting asset: ${err.message || String(err)}`, 'error');
    }
  };

  const handleCreateCheckout = async (data: { assetId: string; userId: string; jobId?: string; expectedReturnHours?: number; notes?: string }) => {
    try {
      const asset = assets.find(a => a.id === data.assetId);
      const newCheckout: Checkout = {
        id: `chk-${Date.now()}`,
        assetId: data.assetId,
        assetName: asset?.name || 'Tracked Asset',
        assetCategory: asset?.category || 'PPE',
        tagEpc: asset?.tagEpc || '',
        userId: data.userId,
        userName: currentUser.name,
        badgeId: currentUser.badgeId || 'BDG-01',
        checkoutTime: new Date().toISOString(),
        expectedReturn: new Date(Date.now() + (data.expectedReturnHours || 8) * 3600000).toISOString(),
        status: 'ACTIVE',
        jobId: data.jobId || 'job-general',
        jobName: 'General Field Assignment',
        checkoutCondition: 'Good',
        notes: data.notes
      };
      setCheckouts(prev => [newCheckout, ...prev]);
      setAssets(prev => prev.map(a => a.id === data.assetId ? { ...a, status: 'Checked Out', custodianName: currentUser.name } : a));
      showToast('Asset checked out successfully & custody recorded');
    } catch (err: any) {
      console.error('Failed to create checkout:', err);
      showToast(`Error creating checkout: ${err.message || String(err)}`, 'error');
    }
  };

  const handleReturnCheckout = async (checkoutId: string, condition: string = 'Good') => {
    try {
      const chk = checkouts.find(c => c.id === checkoutId);
      if (chk) {
        setCheckouts(prev => prev.map(c => c.id === checkoutId ? { ...c, status: 'RETURNED', actualReturn: new Date().toISOString(), returnCondition: (condition as AssetCondition) || 'Good' } : c));
        setAssets(prev => prev.map(a => a.id === chk.assetId ? { ...a, status: 'In Zone', custodianName: undefined } : a));
      }
      showToast(`Asset return checked in with condition: ${condition}`);
    } catch (err: any) {
      console.error('Failed to return checkout:', err);
      showToast(`Error returning asset: ${err.message || String(err)}`, 'error');
    }
  };

  const handleResolveAlert = async (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true, status: 'RESOLVED', resolvedBy: currentUser.name, resolvedAt: new Date().toISOString() } : a));
    showToast('Alert resolved and logged in security audit history');
  };

  const handleCreateMaintenance = async (data: Partial<MaintenanceLog>) => {
    try {
      const newLog: MaintenanceLog = {
        id: `mnt-${Date.now()}`,
        assetId: data.assetId || assets[0]?.id || 'ast-1',
        assetName: data.assetName || assets[0]?.name || 'Asset',
        date: new Date().toISOString(),
        scheduledDate: data.scheduledDate || new Date().toISOString(),
        type: (data.type as any) || 'Preventive',
        status: (data.status as any) || 'Scheduled',
        technician: data.technician || currentUser.name,
        notes: data.notes || '',
        cost: data.cost || 0,
        workOrderId: `WO-${Date.now().toString().slice(-6)}`
      };
      setMaintenanceLogs(prev => [newLog, ...prev]);
      showToast('Maintenance work order logged successfully');
    } catch (err: any) {
      console.error('Failed to create maintenance:', err);
      showToast(`Error creating maintenance log: ${err.message || String(err)}`, 'error');
    }
  };

  const handleUpdateInventoryQuantity = async (id: string, delta: number) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantityOnHand + delta);
    setInventory(prev => prev.map(i => i.id === id ? { ...i, quantityOnHand: newQty } : i));
    showToast(`Stock updated for ${item.name}: ${newQty} ${item.unit}`);
  };

  const handleAddInventoryItem = async (data: Partial<InventoryItem>) => {
    try {
      const newItem: InventoryItem = {
        id: `inv-${Date.now()}`,
        siteId: selectedSiteId === 'ALL' ? (sites[0]?.id || 'site-gao-facility') : selectedSiteId,
        siteName: sites.find(s => s.id === selectedSiteId)?.name || 'GAO RFID UHF Facility',
        name: data.name || 'New Item SKU',
        category: data.category || 'Supplies',
        quantityOnHand: data.quantityOnHand || 0,
        minThreshold: data.minThreshold || 10,
        reorderPoint: data.reorderPoint || 15,
        unit: data.unit || 'units',
        costPerUnit: data.costPerUnit || 10,
        ...data
      };
      setInventory(prev => [newItem, ...prev]);
      showToast(`Inventory item "${newItem.name}" saved to stock catalog`);
    } catch (err: any) {
      console.error('Failed to add inventory item:', err);
      showToast(`Error adding inventory item: ${err.message || String(err)}`, 'error');
    }
  };

  const handleAddReader = async (data: Partial<Reader>) => {
    try {
      const newReader: Reader = {
        id: `reader-${Date.now()}`,
        siteId: selectedSiteId === 'ALL' ? (sites[0]?.id || 'site-gao-facility') : selectedSiteId,
        siteName: sites.find(s => s.id === selectedSiteId)?.name || 'GAO RFID UHF Facility',
        name: data.name || 'GAO UHF Gateway Portal',
        type: data.type || 'Fixed Portal',
        ipAddress: data.ipAddress || 'www.i360services.com',
        zoneId: data.zoneId || 'zone-01',
        zoneName: data.zoneName || 'Antenna Portal',
        antennaPowerDbm: data.antennaPowerDbm || 30,
        status: 'Online',
        lastHeartbeat: new Date().toISOString(),
        firmwareVersion: 'v4.2.0-GAO',
        readCountTotal: 100,
        bufferedEventsCount: 0,
        ...data
      };
      setReaders(prev => [newReader, ...prev]);
      showToast(`Reader gateway "${newReader.name}" connected and saved`);
    } catch (err: any) {
      console.error('Failed to add reader:', err);
      showToast(`Error adding reader: ${err.message || String(err)}`, 'error');
    }
  };

  const handleTriggerReaderScan = async (readerId: string, readerName: string) => {
    const sampleAsset = assets[0] || { id: 'ast-gao-1', name: 'GAO UHF Tag #1', tagEpc: 'E28011606000020788842D31', category: 'PPE' as const, siteId: 'site-gao-facility', siteName: 'GAO RFID UHF Facility', zoneId: 'zone-1', zoneName: 'Antenna Zone 1' };
    const newEvent: ReadEvent = {
      id: `rt-scan-${Date.now()}`,
      epc: sampleAsset.tagEpc,
      assetId: sampleAsset.id,
      assetName: sampleAsset.name,
      assetCategory: sampleAsset.category,
      readerId,
      readerName,
      siteId: sampleAsset.siteId,
      siteName: sampleAsset.siteName,
      zoneId: sampleAsset.zoneId,
      zoneName: sampleAsset.zoneName,
      rssi: -48,
      timestamp: new Date().toISOString(),
      eventType: 'SCAN',
      antennaId: 1
    };
    setReadEvents(prev => [newEvent, ...prev].slice(0, 200));
    showToast(`Live tag read recorded on ${readerName} for ${sampleAsset.name}`);
  };

  const handleBatchImportAssets = async (newAssetsList: Partial<Asset>[]) => {
    const imported: Asset[] = newAssetsList.map((item, idx) => ({
      id: item.id || `ast-imp-${Date.now()}-${idx}`,
      name: item.name || `Imported Asset ${idx + 1}`,
      category: (item.category as AssetCategory) || 'PPE',
      subCategory: item.subCategory || 'Personnel UHF Tag',
      manufacturer: item.manufacturer || 'GAO RFID INC.',
      model: item.model || 'GAO-UHF-T90',
      serialNumber: item.serialNumber || `SN-${Date.now()}-${idx}`,
      tagEpc: item.tagEpc || `E280116060000207888${Math.floor(1000 + Math.random() * 9000)}`,
      status: item.status || 'In Zone',
      siteId: item.siteId || 'site-gao-facility',
      siteName: item.siteName || 'GAO RFID UHF Facility',
      zoneId: item.zoneId || 'zone-1',
      zoneName: item.zoneName || 'Zone 1',
      purchaseDate: '2024-01-15',
      cost: item.cost || 120,
      isRental: false,
      lastSeenAt: new Date().toISOString(),
      lastReaderId: 'reader-gao-antenna-1',
      rssi: -48,
      photoUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150',
      condition: 'Good',
      ...item
    }));
    setAssets(prev => [...imported, ...prev]);
    showToast(`Imported ${newAssetsList.length} assets successfully into catalog`);
  };

  // If URL query parameter specifies public view mode, render PublicAssetView
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

  const filteredAssets = selectedSiteId === 'ALL' ? (assets || []) : (assets || []).filter(a => a.siteId === selectedSiteId);
  const filteredAlerts = selectedSiteId === 'ALL' ? (alerts || []) : (alerts || []).filter(a => a.siteId === selectedSiteId);
  const filteredReadEvents = selectedSiteId === 'ALL' ? (readEvents || []) : (readEvents || []).filter(e => e.siteId === selectedSiteId);
  const filteredCheckouts = selectedSiteId === 'ALL' ? (checkouts || []) : (checkouts || []).filter(c => {
    const asset = (assets || []).find(a => a.id === c.assetId);
    return asset && asset.siteId === selectedSiteId;
  });
  const filteredInventory = selectedSiteId === 'ALL' ? (inventory || []) : (inventory || []).filter(i => i.siteId === selectedSiteId);
  const filteredMaintenanceLogs = selectedSiteId === 'ALL' ? (maintenanceLogs || []) : (maintenanceLogs || []).filter(m => {
    const asset = (assets || []).find(a => a.id === m.assetId);
    return asset && asset.siteId === selectedSiteId;
  });
  const filteredReaders = selectedSiteId === 'ALL' ? (readers || []) : (readers || []).filter(r => r.siteId === selectedSiteId);

  // Mandatory Authentication Gate: Show Login Screen if user is not authenticated
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
      
      {/* Platform Top Navigation Header */}
      <Header
        sites={sites}
        selectedSiteId={selectedSiteId}
        onSelectSite={setSelectedSiteId}
        alerts={alerts}
        onOpenAlertsModal={() => setActiveTab('geofencing')}
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
      />

      {/* Main Body Area: Sidebar Nav + Tab Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        
        {/* Navigation Sidebar */}
        <SidebarNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          unresolvedAlertsCount={(alerts || []).filter(a => !a.resolved).length}
        />

        {/* Dynamic View Tab Body */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden space-y-6">

          {/* Toast Notification */}
          {toast && (
            <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in ${
              toast.type === 'success'
                ? 'bg-emerald-900 border border-emerald-500/40 text-emerald-200'
                : 'bg-red-900 border border-red-500/40 text-red-200'
            }`}>
              <span>{toast.message}</span>
              <button onClick={() => setToast(null)} className="text-slate-300 hover:text-white ml-3">✕</button>
            </div>
          )}

          {/* Global API Error Notice */}
          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-red-900 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg text-red-600 shrink-0">
                  <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-red-950">Unable to load data from GAO RFID UHF API.</h3>
                  <p className="text-xs text-red-700 mt-0.5">{apiError}</p>
                  <p className="text-[11px] text-red-500 font-mono mt-1">
                    GAO Server: {GAO_API_BASE_URL}
                  </p>
                </div>
              </div>
              <button
                onClick={loadAllData}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors shrink-0 flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Global Initial Loading State */}
          {isLoading && !apiError && assets.length === 0 && sites.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <h3 className="font-bold text-sm text-slate-800">Loading live asset tracking data from GAO RFID UHF Server...</h3>
              <p className="text-xs text-slate-500 font-mono">{GAO_API_BASE_URL}</p>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              assets={filteredAssets}
              alerts={filteredAlerts}
              readEvents={filteredReadEvents}
              sites={sites}
              checkouts={filteredCheckouts}
              onNavigateTab={setActiveTab}
              onOpenAssetDetail={setInspectingAsset}
              onOpenAlertsModal={() => setActiveTab('geofencing')}
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

          {activeTab === 'assets' && (
            <AssetRegistryView
              assets={filteredAssets}
              sites={sites}
              onOpenRegisterModal={() => { setEditingAsset(null); setAssetFormOpen(true); }}
              onOpenDetailModal={setInspectingAsset}
              onOpenQrModal={(a) => setQrModalAsset(a)}
              onFindRadar={setRadarAsset}
              onCheckoutAsset={() => setActiveTab('checkouts')}
              onEditAsset={(a) => { setEditingAsset(a); setAssetFormOpen(true); }}
              onDeleteAsset={handleDeleteAsset}
              onImportCsv={() => setCsvImportOpen(true)}
            />
          )}

          {activeTab === 'tracking' && (
            <LiveTrackingMapView
              assets={filteredAssets}
              sites={sites}
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

          {activeTab === 'maintenance' && (
            <MaintenanceView
              maintenanceLogs={filteredMaintenanceLogs}
              assets={filteredAssets}
              onCreateMaintenance={handleCreateMaintenance}
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

          {activeTab === 'reports' && (
            <ReportsAnalyticsView
              assets={filteredAssets}
              maintenanceLogs={filteredMaintenanceLogs}
              auditLogs={auditLogs}
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
          sites={sites}
          onImportBatch={handleBatchImportAssets}
        />
      )}

    </div>
  );
}
