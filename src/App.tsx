/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { SidebarNav, TabType } from './components/SidebarNav';
import { DashboardView } from './components/DashboardView';
import { AssetRegistryView } from './components/AssetRegistryView';
import { AssetDetailModal } from './components/AssetDetailModal';
import { AssetFormModal } from './components/AssetFormModal';
import { LiveTrackingMapView } from './components/LiveTrackingMapView';
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

import {
  getAssets,
  getSites,
  getCheckouts,
  getAlerts,
  getEvents,
  getMaintenance,
  getInventory,
  getReaders,
  getUsers,
  getAuditLogs,
  createAsset,
  createAssetsBatch,
  updateAsset,
  deleteAsset,
  createCheckout,
  returnCheckout,
  resolveAlert,
  createMaintenance,
  createInventoryItem,
  updateInventory,
  createReader,
  submitRfidScan,
  simulateScan,
  API_BASE_URL
} from './services/api';

import { Asset, Site, Checkout, Alert, ReadEvent, MaintenanceLog, InventoryItem, Reader, User, AuditLog } from './types';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('ALL');

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

  // Current User Persona
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-1',
    name: 'Sarah Jenkins',
    email: 'sjenkins@apertureconst.com',
    role: 'Site Manager',
    siteAccess: ['site-1', 'site-2'],
    badgeId: 'BDG-8801',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    phone: '+1 (555) 234-5678'
  });

  const isFetchingRef = useRef<boolean>(false);

  // Primary Data Fetcher for Real Backend API & MongoDB Atlas
  const loadAllData = useCallback(async () => {
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const [
        astRes,
        stRes,
        chkRes,
        altRes,
        evtRes,
        mntRes,
        invRes,
        rdrRes,
        usrRes,
        audRes
      ] = await Promise.allSettled([
        getAssets(),
        getSites(),
        getCheckouts(),
        getAlerts(),
        getEvents(),
        getMaintenance(),
        getInventory(),
        getReaders(),
        getUsers(),
        getAuditLogs()
      ]);

      const allRejected = [
        astRes, stRes, chkRes, altRes, evtRes, mntRes, invRes, rdrRes, usrRes, audRes
      ].every(r => r.status === 'rejected');

      if (allRejected) {
        setApiError('Unable to load data from Backend API & MongoDB Atlas.');
        return;
      }

      setApiError(null);

      if (astRes.status === 'fulfilled') setAssets(astRes.value);
      if (stRes.status === 'fulfilled') setSites(stRes.value);
      if (chkRes.status === 'fulfilled') setCheckouts(chkRes.value);
      if (altRes.status === 'fulfilled') setAlerts(altRes.value);
      if (evtRes.status === 'fulfilled') setReadEvents(evtRes.value);
      if (mntRes.status === 'fulfilled') setMaintenanceLogs(mntRes.value);
      if (invRes.status === 'fulfilled') setInventory(invRes.value);
      if (rdrRes.status === 'fulfilled') setReaders(rdrRes.value);
      if (usrRes.status === 'fulfilled') setUsers(usrRes.value);
      if (audRes.status === 'fulfilled') setAuditLogs(audRes.value);

      setLastSyncedAt(new Date().toLocaleTimeString());
    } catch (err: any) {
      setApiError('Unable to load data from Backend API & MongoDB Atlas.');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Polling ONLY live endpoints (/api/events and /api/alerts) every 15 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [evt, alt] = await Promise.all([
          getEvents().catch(() => null),
          getAlerts().catch(() => null)
        ]);
        if (evt) setReadEvents(evt);
        if (alt) setAlerts(alt);
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

  // Handler functions with Postman API calls
  const handleSaveAsset = async (data: Partial<Asset>) => {
    try {
      if (editingAsset) {
        await updateAsset(editingAsset.id, data);
        showToast('Asset specifications updated successfully');
      } else {
        await createAsset(data);
        showToast('New asset registered successfully into Aperture catalog');
      }
    } catch (err: any) {
      console.error('Failed to save asset:', err);
      showToast(`Error saving asset: ${err.message || String(err)}`, 'error');
    } finally {
      setEditingAsset(null);
      setAssetFormOpen(false);
      await loadAllData();
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      await deleteAsset(id);
      showToast('Asset removed from Aperture registry');
    } catch (err: any) {
      console.error('Failed to delete asset:', err);
      showToast(`Error deleting asset: ${err.message || String(err)}`, 'error');
    } finally {
      await loadAllData();
    }
  };

  const handleCreateCheckout = async (data: { assetId: string; userId: string; jobId?: string; expectedReturnHours?: number; notes?: string }) => {
    try {
      await createCheckout(data);
      showToast('Asset checked out successfully & custody recorded');
    } catch (err: any) {
      console.error('Failed to create checkout:', err);
      showToast(`Error creating checkout: ${err.message || String(err)}`, 'error');
    } finally {
      await loadAllData();
    }
  };

  const handleReturnCheckout = async (checkoutId: string, condition: string = 'GOOD') => {
    try {
      await returnCheckout(checkoutId, condition);
      showToast(`Asset return checked in with condition: ${condition}`);
    } catch (err: any) {
      console.error('Failed to return checkout:', err);
      showToast(`Error returning asset: ${err.message || String(err)}`, 'error');
    } finally {
      await loadAllData();
    }
  };

  const handleResolveAlert = async (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true, status: 'RESOLVED', resolvedBy: currentUser.name, resolvedAt: new Date().toISOString() } : a));
    try {
      await resolveAlert(id, currentUser.name);
      showToast('Alert resolved and logged in security audit history');
    } catch (err: any) {
      console.warn('Note on resolving alert:', err);
    } finally {
      await loadAllData();
    }
  };

  const handleCreateMaintenance = async (data: Partial<MaintenanceLog>) => {
    try {
      await createMaintenance(data);
      showToast('Maintenance work order logged successfully');
    } catch (err: any) {
      console.error('Failed to create maintenance:', err);
      showToast(`Error creating maintenance log: ${err.message || String(err)}`, 'error');
    } finally {
      await loadAllData();
    }
  };

  const handleUpdateInventoryQuantity = async (id: string, delta: number) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantityOnHand + delta);
    try {
      await updateInventory(id, { quantityOnHand: newQty });
      showToast(`Stock updated for ${item.name}: ${newQty} ${item.unit}`);
    } catch (err: any) {
      console.error('Failed to update inventory:', err);
    } finally {
      await loadAllData();
    }
  };

  const handleAddInventoryItem = async (data: Partial<InventoryItem>) => {
    try {
      const newItem = await createInventoryItem({
        siteId: selectedSiteId === 'ALL' ? (sites[0]?.id || 'SITE-001') : selectedSiteId,
        siteName: sites.find(s => s.id === selectedSiteId)?.name || 'Downtown Metro Tower',
        name: data.name || 'New Item SKU',
        category: data.category || 'Supplies',
        quantityOnHand: data.quantityOnHand || 0,
        minThreshold: data.minThreshold || 10,
        reorderPoint: data.reorderPoint || 15,
        unit: data.unit || 'units',
        costPerUnit: data.costPerUnit || 10,
        ...data
      });
      showToast(`Inventory item "${newItem.name}" saved to stock catalog`);
    } catch (err: any) {
      console.error('Failed to add inventory item:', err);
      showToast(`Error adding inventory item: ${err.message || String(err)}`, 'error');
    } finally {
      await loadAllData();
    }
  };

  const handleAddReader = async (data: Partial<Reader>) => {
    try {
      const newReader = await createReader({
        siteId: selectedSiteId === 'ALL' ? (sites[0]?.id || 'SITE-001') : selectedSiteId,
        siteName: sites.find(s => s.id === selectedSiteId)?.name || 'Downtown Metro Tower',
        name: data.name || 'New Gateway Portal',
        type: data.type || 'Fixed Portal',
        ipAddress: data.ipAddress || '192.168.1.200',
        zoneId: data.zoneId || 'zone-01',
        zoneName: data.zoneName || 'Laydown Yard',
        antennaPowerDbm: data.antennaPowerDbm || 28,
        status: 'Online',
        firmwareVersion: 'v4.2.0-PROD',
        ...data
      });
      showToast(`Reader gateway "${newReader.name}" connected and saved`);
    } catch (err: any) {
      console.error('Failed to add reader:', err);
      showToast(`Error adding reader: ${err.message || String(err)}`, 'error');
    } finally {
      await loadAllData();
    }
  };

  const handleTriggerReaderScan = async (readerId: string, readerName: string) => {
    const sampleAsset = assets[0] || { id: 'ast-cat-320', name: 'CAT 320D Excavator #401', tagEpc: 'E2801191A001' };
    try {
      await simulateScan(sampleAsset.tagEpc || 'E2801191A001', readerId, -58);
      showToast(`Live tag read recorded on ${readerName} for ${sampleAsset.name}`);
    } catch (err: any) {
      console.error('Failed to trigger scan:', err);
    } finally {
      await loadAllData();
    }
  };

  const handleBatchImportAssets = async (newAssetsList: Partial<Asset>[]) => {
    await createAssetsBatch(newAssetsList);
    showToast(`Imported ${newAssetsList.length} assets successfully into catalog`);
    await loadAllData();
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
                  <h3 className="font-bold text-sm text-red-950">Unable to load data from Backend API & MongoDB Atlas.</h3>
                  <p className="text-xs text-red-700 mt-0.5">{apiError}</p>
                  <p className="text-[11px] text-red-500 font-mono mt-1">
                    Target Endpoint: {API_BASE_URL}
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
              <h3 className="font-bold text-sm text-slate-800">Loading asset tracking data from Backend API...</h3>
              <p className="text-xs text-slate-500 font-mono">{API_BASE_URL}</p>
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
                await createCheckout({ assetId, userId, jobId: 'job-mobile-field' });
                loadAllData();
              }}
              onScanReturn={async (checkoutId) => {
                await returnCheckout(checkoutId, 'Good');
                loadAllData();
              }}
            />
          )}

          {activeTab === 'playback' && (
            <PlaybackView assets={filteredAssets} />
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
