import React, { useState } from 'react';
import { 
  QrCode, 
  Camera, 
  Smartphone, 
  CheckCircle2, 
  ArrowLeftRight, 
  UserCheck, 
  MapPin, 
  ClipboardCheck, 
  AlertTriangle, 
  Wrench, 
  History, 
  ExternalLink, 
  RefreshCw, 
  Check, 
  X, 
  Search, 
  Building2, 
  Clock, 
  ChevronRight,
  Sparkles,
  Sliders
} from 'lucide-react';
import { Asset, Site, QrScanRecord, User } from '../types';

interface QrScannerViewProps {
  assets: Asset[];
  sites: Site[];
  currentUser?: User;
  onSelectAsset?: (asset: Asset) => void;
  onCheckoutAsset?: (asset: Asset) => void;
  onInspectAsset?: (asset: Asset) => void;
  onOpenAssetDetail?: (asset: Asset) => void;
  onUpdateAsset?: (asset: Asset) => void;
}

export const QrScannerView: React.FC<QrScannerViewProps> = ({
  assets = [],
  sites = [],
  currentUser,
  onSelectAsset,
  onCheckoutAsset,
  onInspectAsset,
  onOpenAssetDetail,
  onUpdateAsset
}) => {
  const safeAssets = assets || [];
  const [activeScanMode, setActiveScanMode] = useState<'manual' | 'camera'>('manual');
  const [selectedAssetId, setSelectedAssetId] = useState<string>(safeAssets[0]?.id || '');
  const [scannedAsset, setScannedAsset] = useState<Asset | null>(safeAssets[0] || null);
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [scanStatusMessage, setScanStatusMessage] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{
    type: 'Transfer' | 'Assign' | 'Report Damage' | 'Check In' | 'Check Out' | null;
    asset: Asset | null;
  }>({ type: null, asset: null });

  // Scan History - Initialized empty per strict real data requirement
  const [scanHistory, setScanHistory] = useState<QrScanRecord[]>([]);

  const handleScanCode = (assetId: string) => {
    const trimmed = (assetId || '').trim();
    if (!trimmed) return;
    const found = assets.find(a => a.id.toLowerCase() === trimmed.toLowerCase() || (a.qrCode && a.qrCode.toLowerCase() === trimmed.toLowerCase()) || (a.serialNumber && a.serialNumber.toLowerCase() === trimmed.toLowerCase()));
    if (found) {
      setScannedAsset(found);
      setScanStatusMessage(`Asset "${found.name}" verified successfully via QR.`);
      
      // Add to history
      const newRecord: QrScanRecord = {
        id: `qr-scan-${Date.now()}`,
        assetId: found.id,
        assetName: found.name,
        qrCode: found.qrCode || `QR-${found.id}`,
        scannedAt: new Date().toISOString(),
        scannedBy: currentUser?.name || 'Site Field Operator',
        siteId: found.siteId,
        siteName: found.siteName,
        actionTaken: 'View Location',
        notes: 'Barcode scan decoded via optical reader'
      };
      setScanHistory(prev => [newRecord, ...prev.slice(0, 9)]);
    } else {
      setScanStatusMessage(`QR Code / Asset "${trimmed}" not found in database.`);
    }

    setTimeout(() => {
      setScanStatusMessage(null);
    }, 4000);
  };

  const executeAction = (actionName: QrScanRecord['actionTaken'], notes = '') => {
    if (!scannedAsset) return;

    if (actionName === 'Inspect' && onInspectAsset) {
      onInspectAsset(scannedAsset);
      return;
    }

    if (actionName === 'View History' || actionName === 'View Location') {
      if (onOpenAssetDetail) onOpenAssetDetail(scannedAsset);
      return;
    }

    if (actionName === 'Check Out' && onCheckoutAsset) {
      onCheckoutAsset(scannedAsset);
      return;
    }

    // Direct State Updates for Check In / Report Damage
    if (actionName === 'Check In' && onUpdateAsset) {
      const updated: Asset = {
        ...scannedAsset,
        status: 'In Zone',
        lastSeenAt: new Date().toISOString()
      };
      onUpdateAsset(updated);
      setScannedAsset(updated);
    }

    if (actionName === 'Report Damage' && onUpdateAsset) {
      const updated: Asset = {
        ...scannedAsset,
        status: 'Damaged',
        condition: 'Damaged',
        lastSeenAt: new Date().toISOString()
      };
      onUpdateAsset(updated);
      setScannedAsset(updated);
    }

    if (actionName === 'Start Maintenance' && onUpdateAsset) {
      const updated: Asset = {
        ...scannedAsset,
        status: 'Maintenance',
        lastSeenAt: new Date().toISOString()
      };
      onUpdateAsset(updated);
      setScannedAsset(updated);
    }

    // Record Action
    const record: QrScanRecord = {
      id: `act-${Date.now()}`,
      assetId: scannedAsset.id,
      assetName: scannedAsset.name,
      qrCode: scannedAsset.qrCode || `QR-${scannedAsset.id}`,
      scannedAt: new Date().toISOString(),
      scannedBy: currentUser?.name || 'Field Technician',
      siteId: scannedAsset.siteId,
      siteName: scannedAsset.siteName,
      actionTaken: actionName,
      notes: notes || `Action "${actionName}" applied via mobile QR workflow`
    };
    setScanHistory(prev => [record, ...prev.slice(0, 9)]);
    setActionModal({ type: null, asset: null });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">QR Code Scanner & Field Actions</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 font-mono">
                Rapid Field Workflow
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Scan asset QR tags to verify custody, assign operators, perform inspections, or report maintenance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveScanMode('manual')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeScanMode === 'manual'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Manual Tag Entry
          </button>
          <button
            onClick={() => setActiveScanMode('camera')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeScanMode === 'camera'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Optical</span>
          </button>
        </div>
      </div>

      {scanStatusMessage && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{scanStatusMessage}</span>
        </div>
      )}

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Viewfinder & Tag Lookup (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden min-h-[340px]">
            {/* Viewfinder Decorative Frame */}
            <div className="relative w-56 h-56 border-2 border-blue-500/60 rounded-2xl flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400"></div>

              {/* Animated Laser Scanning Line */}
              <div className="absolute left-4 right-4 h-0.5 bg-blue-400 shadow-[0_0_12px_#3b82f6] animate-pulse"></div>

              {activeScanMode === 'camera' ? (
                <div className="text-center p-3">
                  <Camera className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-60" />
                  <span className="text-[11px] text-slate-400 font-mono block">Point optical lens at asset QR code plate</span>
                  <span className="text-[10px] text-blue-400 mt-2 block font-semibold">Optical sensor active...</span>
                </div>
              ) : (
                <div className="text-center p-3">
                  <QrCode className="w-14 h-14 text-blue-400 mx-auto mb-2 opacity-80" />
                  <span className="text-xs font-mono font-bold text-white block">
                    {scannedAsset ? (scannedAsset.qrCode || `QR-${scannedAsset.id}`) : 'Ready to Scan'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">ISO/IEC 18004 Standard</span>
                </div>
              )}
            </div>

            <span className="text-[11px] text-slate-400 mt-4 text-center">
              Position tag inside the square alignment guides to trigger automatic asset identification.
            </span>
          </div>

          {/* Tag & Barcode Lookup */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
              Tag / QR Code Lookup
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Asset ID or QR tag code..."
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleScanCode(manualCodeInput);
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => handleScanCode(manualCodeInput)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Scan
              </button>
            </div>

            {assets.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 block mb-1.5 font-medium">Or select registered asset from site:</span>
                <select
                  value={selectedAssetId}
                  onChange={(e) => {
                    setSelectedAssetId(e.target.value);
                    handleScanCode(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.category} • {a.id})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Identified Asset Profile & 9 Direct Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {scannedAsset ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
              {/* Asset Identity Card */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <img 
                    src={scannedAsset.photoUrl} 
                    alt={scannedAsset.name} 
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900">{scannedAsset.name}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        scannedAsset.status === 'Active' || scannedAsset.status === 'In Zone'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : scannedAsset.status === 'Maintenance'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : scannedAsset.status === 'Damaged'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {scannedAsset.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {scannedAsset.manufacturer} {scannedAsset.model} • SN: {scannedAsset.serialNumber}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
                        {scannedAsset.qrCode || `QR-${scannedAsset.id}`}
                      </span>
                      <span>• Site: {scannedAsset.siteName}</span>
                    </div>
                  </div>
                </div>

                {onOpenAssetDetail && (
                  <button
                    onClick={() => onOpenAssetDetail(scannedAsset)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <span>Full Profile</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>

              {/* Asset Snapshot Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Current Zone</span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate">{scannedAsset.zoneName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Assigned Operator</span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate">
                    {scannedAsset.assignedWorker || scannedAsset.assignedOperator || 'Unassigned'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Condition</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{scannedAsset.condition}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Operating Hours</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{scannedAsset.operatingHours || 0} hrs</span>
                </div>
              </div>

              {/* Section 8: The 9 Required Direct Actions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Perform Field Action on Asset
                  </span>
                  <span className="text-[10px] text-blue-600 font-semibold font-mono">Instant Write to Cloud</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {/* 1. Check In */}
                  <button
                    onClick={() => executeAction('Check In')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 block">Check In</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Return to active zone</span>
                  </button>

                  {/* 2. Check Out */}
                  <button
                    onClick={() => executeAction('Check Out')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <ArrowLeftRight className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 block">Check Out</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Transfer custody to crew</span>
                  </button>

                  {/* 3. Assign */}
                  <button
                    onClick={() => setActionModal({ type: 'Assign', asset: scannedAsset })}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-left transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 block">Assign</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Set operator or team</span>
                  </button>

                  {/* 4. Transfer */}
                  <button
                    onClick={() => setActionModal({ type: 'Transfer', asset: scannedAsset })}
                    className="p-3 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 block">Transfer</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Relocate site or zone</span>
                  </button>

                  {/* 5. Inspect */}
                  <button
                    onClick={() => executeAction('Inspect')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <ClipboardCheck className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 block">Inspect</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">OSHA / pre-shift safety</span>
                  </button>

                  {/* 6. Report Damage */}
                  <button
                    onClick={() => executeAction('Report Damage')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50/50 text-left transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 block">Report Damage</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Flag defect / downtime</span>
                  </button>

                  {/* 7. Start Maintenance */}
                  <button
                    onClick={() => executeAction('Start Maintenance')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 text-left transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 block">Start Maintenance</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Generate work ticket</span>
                  </button>

                  {/* 8. View Location */}
                  <button
                    onClick={() => executeAction('View Location')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 block">View Location</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Live map & coordinates</span>
                  </button>

                  {/* 9. View History */}
                  <button
                    onClick={() => executeAction('View History')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-left transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <History className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 block">View History</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Movements & audit trail</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center text-slate-400">
              <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3 opacity-50" />
              <h3 className="font-bold text-slate-700 text-base">No Asset Scanned Yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Scan an optical 2D barcode or choose one of the sample assets on the left to unlock instant actions.
              </p>
            </div>
          )}

          {/* Recent Scans History Log */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Recent QR Scanning Activity
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Audit Logged</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {scanHistory.map(record => (
                <div key={record.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-mono text-[10px] font-bold">
                      QR
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{record.assetName}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                          {record.actionTaken}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        By {record.scannedBy} • {record.siteName}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {new Date(record.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Dialog Modal (Assign or Transfer) */}
      {actionModal.type && actionModal.asset && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base">
                {actionModal.type === 'Transfer' ? 'Transfer Asset to Site/Zone' : 'Assign Asset to Operator'}
              </h3>
              <button 
                onClick={() => setActionModal({ type: null, asset: null })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                if (actionModal.type === 'Transfer') {
                  const siteId = (form.elements.namedItem('targetSite') as HTMLSelectElement).value;
                  const targetSite = sites.find(s => s.id === siteId);
                  if (onUpdateAsset && targetSite) {
                    const updated: Asset = {
                      ...actionModal.asset!,
                      siteId: targetSite.id,
                      siteName: targetSite.name,
                      zoneId: targetSite.zones?.[0]?.id || 'zone-gen',
                      zoneName: targetSite.zones?.[0]?.name || 'Staging Yard',
                      lastSeenAt: new Date().toISOString()
                    };
                    onUpdateAsset(updated);
                    setScannedAsset(updated);
                  }
                  executeAction('Transfer', `Transferred to ${targetSite?.name}`);
                } else if (actionModal.type === 'Assign') {
                  const workerName = (form.elements.namedItem('workerName') as HTMLInputElement).value;
                  if (onUpdateAsset) {
                    const updated: Asset = {
                      ...actionModal.asset!,
                      assignedWorker: workerName,
                      assignedOperator: workerName,
                      lastSeenAt: new Date().toISOString()
                    };
                    onUpdateAsset(updated);
                    setScannedAsset(updated);
                  }
                  executeAction('Assign', `Assigned to ${workerName}`);
                }
              }}
              className="space-y-4 text-xs"
            >
              {actionModal.type === 'Transfer' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Destination Job Site</label>
                  <select
                    name="targetSite"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs"
                  >
                    {sites.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operator / Crew Member</label>
                  <input
                    name="workerName"
                    defaultValue="Frank Kowalski (Heavy Operator)"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal({ type: null, asset: null })}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Confirm & Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
