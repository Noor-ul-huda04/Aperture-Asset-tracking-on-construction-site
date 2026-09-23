import React, { useState, useRef } from 'react';
import { Asset, RfidEvent, Reader, Site, User } from '../types';
import { 
  QrCode, 
  Radio, 
  Camera, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRightLeft, 
  Wrench, 
  ClipboardCheck, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Search, 
  Scan, 
  Layers,
  Sparkles
} from 'lucide-react';

interface RfidScanningViewProps {
  assets?: Asset[];
  sites?: Site[];
  currentUser?: User;
  onAssetScannedAction?: (asset: Asset, action: string, details?: any) => void;
}

export const RfidScanningView: React.FC<RfidScanningViewProps> = ({
  assets = [],
  sites = [],
  currentUser,
  onAssetScannedAction
}) => {
  const [activeTab, setActiveTab] = useState<'qr-scanner' | 'qr-generator' | 'rfid-stream' | 'readers'>('qr-scanner');

  // Scanner state
  const [scannedAsset, setScannedAsset] = useState<Asset | null>(assets?.[0] || null);
  const [scannerActive, setScannerActive] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);

  // Generator state
  const [selectedAssetForBadge, setSelectedAssetForBadge] = useState<Asset>(assets?.[0] || {} as Asset);

  // RFID Event stream state
  const [rfidEvents, setRfidEvents] = useState<RfidEvent[]>([
    {
      id: 'rfid-evt-1',
      tagEpc: 'E2801191A000001000000457',
      assetId: 'EX-104',
      readerId: 'reader-101',
      readerName: 'Site A East Portal RFID Gate',
      location: 'Site A — Laydown Yard A Portal',
      timestamp: new Date(Date.now() - 3 * 60 * 1000).toLocaleTimeString(),
      rssi: -46,
      eventType: 'ENTRY',
      antennaPort: 1
    },
    {
      id: 'rfid-evt-2',
      tagEpc: 'E2801191A000001000000460',
      assetId: 'GEN-022',
      readerId: 'reader-101',
      readerName: 'Site A East Portal RFID Gate',
      location: 'Site A — Laydown Yard A Portal',
      timestamp: new Date(Date.now() - 14 * 60 * 1000).toLocaleTimeString(),
      rssi: -48,
      eventType: 'DWELL',
      antennaPort: 2
    },
    {
      id: 'rfid-evt-3',
      tagEpc: 'E2801191A000001000000459',
      assetId: 'BD-018',
      readerId: 'reader-201',
      readerName: 'Site B Highway Staging Reader',
      location: 'Site B — Staging Yard North Gate',
      timestamp: new Date(Date.now() - 32 * 60 * 1000).toLocaleTimeString(),
      rssi: -51,
      eventType: 'ENTRY',
      antennaPort: 1
    },
    {
      id: 'rfid-evt-4',
      tagEpc: 'E2801191A000001000000466',
      assetId: 'ST-501',
      readerId: 'reader-101',
      readerName: 'Site A East Portal RFID Gate',
      location: 'Site A — Laydown Yard A Portal',
      timestamp: new Date(Date.now() - 55 * 60 * 1000).toLocaleTimeString(),
      rssi: -41,
      eventType: 'ENTRY',
      antennaPort: 3
    }
  ]);

  // Readers status
  const [readersList, setReadersList] = useState<Reader[]>([
    {
      id: 'reader-101',
      name: 'Site A East Heavy Portal UHF Reader',
      model: 'GAO RFID 216028 Integrated Gen2',
      siteId: 'SITE-A',
      siteName: 'Site A — Downtown Tower Alpha',
      location: 'East Heavy Portal Gate #1',
      status: 'Online',
      lastPing: new Date().toLocaleTimeString(),
      firmwareVersion: 'v4.2.1-GAO',
      antennaCount: 4,
      totalReadsCount: 14208
    },
    {
      id: 'reader-102',
      name: 'Site A Tool Crib B Portal Reader',
      model: 'GAO RFID 216012 Fixed Desktop UHF',
      siteId: 'SITE-A',
      siteName: 'Site A — Downtown Tower Alpha',
      location: 'Secure Tool Crib Doorway',
      status: 'Online',
      lastPing: new Date().toLocaleTimeString(),
      firmwareVersion: 'v4.2.0-GAO',
      antennaCount: 2,
      totalReadsCount: 5410
    },
    {
      id: 'reader-201',
      name: 'Site B Highway Staging Main Portal',
      model: 'GAO RFID 216028 Integrated Gen2',
      siteId: 'SITE-B',
      siteName: 'Site B — Metro Interchange Beta',
      location: 'Highway Access Gate North',
      status: 'Online',
      lastPing: new Date().toLocaleTimeString(),
      firmwareVersion: 'v4.2.1-GAO',
      antennaCount: 4,
      totalReadsCount: 22890
    },
    {
      id: 'reader-301',
      name: 'Site C Harbor Deepwater Wharf Reader',
      model: 'GAO RFID 216028 Marine Grade Gen2',
      siteId: 'SITE-C',
      siteName: 'Site C — Harbor Logistics Yard C',
      location: 'Wharf 8 Heavy Staging Portal',
      status: 'Online',
      lastPing: new Date().toLocaleTimeString(),
      firmwareVersion: 'v4.2.1-GAO',
      antennaCount: 4,
      totalReadsCount: 9140
    }
  ]);

  const handleSimulateScan = (assetToScan: Asset) => {
    setScannedAsset(assetToScan);
    setLastActionStatus(null);
  };

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = manualCodeInput.trim().toLowerCase();
    if (!query) return;

    const matched = assets.find(a => 
      a.id.toLowerCase() === query ||
      a.qrCode?.toLowerCase() === query ||
      a.tagEpc?.toLowerCase() === query ||
      a.serialNumber?.toLowerCase() === query ||
      a.name.toLowerCase().includes(query)
    );

    if (matched) {
      setScannedAsset(matched);
      setLastActionStatus(null);
    } else {
      alert(`No asset matched the scanned code or tag: "${manualCodeInput}"`);
    }
    setManualCodeInput('');
  };

  const executeAction = (action: string) => {
    if (!scannedAsset) return;
    if (onAssetScannedAction) {
      onAssetScannedAction(scannedAsset, action);
    }
    setLastActionStatus(`Successfully performed "${action}" on ${scannedAsset.name}!`);
    setTimeout(() => setLastActionStatus(null), 5000);
  };

  const simulateRfidPulse = () => {
    const randomAsset = assets[Math.floor(Math.random() * assets.length)];
    const randomReader = readersList[Math.floor(Math.random() * readersList.length)];
    const newEvent: RfidEvent = {
      id: `rfid-evt-${Date.now().toString().slice(-4)}`,
      tagEpc: randomAsset.tagEpc || 'E2801191A000001000000999',
      assetId: randomAsset.id,
      readerId: randomReader.id,
      readerName: randomReader.name,
      location: `${randomReader.siteName} (${randomReader.location})`,
      timestamp: new Date().toLocaleTimeString(),
      rssi: Math.floor(Math.random() * 20) - 60,
      eventType: Math.random() > 0.5 ? 'ENTRY' : 'DWELL',
      antennaPort: Math.floor(Math.random() * 4) + 1
    };

    setRfidEvents(prev => [newEvent, ...prev.slice(0, 24)]);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-900 text-white rounded-xl">
              <Scan className="w-5 h-5 text-indigo-400" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">RFID & QR Scanning Suite</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mobile QR scanning, UHF RFID gate event stream, automated check-out/in, tag generation, and reader diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={simulateRfidPulse}
            className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate RFID Tag Detection</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'qr-scanner', label: 'Field QR Code Scanner', icon: <Camera className="w-4 h-4" /> },
          { id: 'qr-generator', label: 'Badge & Tag Generator', icon: <QrCode className="w-4 h-4" /> },
          { id: 'rfid-stream', label: `RFID Event Stream (${rfidEvents.length})`, icon: <Radio className="w-4 h-4" /> },
          { id: 'readers', label: `Gate Readers (${readersList.length})`, icon: <Wifi className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: QR CODE SCANNER & QUICK ACTIONS */}
      {activeTab === 'qr-scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scanner Viewport / Simulator */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600" />
              Mobile & Field Camera Barcode/QR Scanner
            </h2>

            {/* Viewport Box */}
            <div className="relative aspect-video rounded-2xl bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white overflow-hidden border border-slate-800">
              {/* Scan Reticle */}
              <div className="w-48 h-48 border-2 border-dashed border-indigo-400/80 rounded-2xl flex flex-col items-center justify-center relative p-4 bg-indigo-500/5">
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />
                
                <Scan className="w-8 h-8 text-indigo-400 animate-pulse" />
                <span className="text-[11px] font-mono text-indigo-200 mt-2 font-semibold">
                  Point at Asset QR Code
                </span>
              </div>

              <div className="absolute bottom-3 text-center text-[10px] text-slate-400">
                Supports ISO/IEC 18004 QR, Code 128, DataMatrix, and RFID NFC
              </div>
            </div>

            {/* Quick Simulate Buttons for Instant Testing */}
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">
                Click any asset below to simulate immediate camera barcode capture:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {assets.slice(0, 6).map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => handleSimulateScan(asset)}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-all text-xs"
                  >
                    <div className="font-bold text-slate-900 truncate">{asset.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{asset.id}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Tag Entry */}
            <form onSubmit={handleManualScanSubmit} className="flex gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                placeholder="Or type Asset ID, QR code, or RFID EPC (e.g. EX-104)..."
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="submit"
                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Lookup
              </button>
            </form>
          </div>

          {/* Scanned Asset Actions Card */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Scanned Asset Context</h3>
              {scannedAsset && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  MATCH CONFIRMED
                </span>
              )}
            </div>

            {scannedAsset ? (
              <div className="space-y-4">
                {/* Asset Header Info */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                    {scannedAsset.photoUrl ? (
                      <img 
                        src={scannedAsset.photoUrl} 
                        alt={scannedAsset.name} 
                        className="w-full h-full object-cover rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <QrCode className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                        {scannedAsset.id}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        {scannedAsset.category}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 mt-1 truncate">{scannedAsset.name}</h4>
                    <p className="text-slate-500 text-[11px] font-mono mt-0.5">
                      {scannedAsset.model} • SN: {scannedAsset.serialNumber || 'N/A'}
                    </p>
                    <p className="text-slate-600 text-[11px] mt-1">
                      Current Location: <strong className="text-slate-900">{scannedAsset.siteName}</strong> ({scannedAsset.zoneName})
                    </p>
                  </div>
                </div>

                {/* Status Notice */}
                {lastActionStatus && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{lastActionStatus}</span>
                  </div>
                )}

                {/* Scanned Actions Selector (Requested explicitly in Section 7) */}
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">
                    Select Field Action to Execute:
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => executeAction('Check Out')}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-left transition-all group"
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900 group-hover:text-blue-600">
                        <ArrowRightLeft className="w-4 h-4 text-blue-600" /> Check Out to Worker
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Assign custody to a field worker or crew</p>
                    </button>

                    <button
                      onClick={() => executeAction('Return / Check In')}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-left transition-all group"
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900 group-hover:text-emerald-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Return to Crib
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Return asset to tool crib or yard inventory</p>
                    </button>

                    <button
                      onClick={() => executeAction('Transfer Site')}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-left transition-all group"
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900 group-hover:text-amber-600">
                        <ArrowRightLeft className="w-4 h-4 text-amber-600" /> Transfer Site
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Log inter-site transfer manifest</p>
                    </button>

                    <button
                      onClick={() => executeAction('Conduct Inspection')}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-left transition-all group"
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900 group-hover:text-purple-600">
                        <ClipboardCheck className="w-4 h-4 text-purple-600" /> Start Inspection
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Open digital safety checklist</p>
                    </button>

                    <button
                      onClick={() => executeAction('Report Damage')}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-left transition-all group col-span-2"
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-rose-600">
                        <AlertTriangle className="w-4 h-4 text-rose-600" /> Report Damage / Red Tag
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Take asset out of service and dispatch maintenance work order</p>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                Scan a barcode or select an asset on the left to begin field actions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: QR CODE GENERATOR & BADGE PRINT */}
      {activeTab === 'qr-generator' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">Asset QR Tag & RFID Label Generator</h2>
              <p className="text-xs text-slate-500">
                Generate high-resolution printable vinyl barcode tags and UHF RFID EPC encoding stickers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Tag Badge</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Asset Selector */}
            <div className="md:col-span-5 space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Select Asset to Generate Tag:</label>
              <select
                value={selectedAssetForBadge.id}
                onChange={(e) => {
                  const matched = assets.find(a => a.id === e.target.value);
                  if (matched) setSelectedAssetForBadge(matched);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
              >
                {assets.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.id} • {a.category})
                  </option>
                ))}
              </select>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="text-[10px] font-bold uppercase text-slate-400">Tag Specifications</div>
                <div><span className="text-slate-500">Type:</span> <strong className="text-slate-800">ISO/IEC 18004 2D QR + EPC Gen2 RFID</strong></div>
                <div><span className="text-slate-500">Encoding:</span> <code className="text-slate-800 font-mono text-[11px]">{selectedAssetForBadge.tagEpc || 'N/A'}</code></div>
                <div><span className="text-slate-500">Substrate:</span> <strong className="text-slate-800">Anodized Metalcraft Industrial Vinyl (UV Proof)</strong></div>
              </div>
            </div>

            {/* Printable Tag Visual Canvas */}
            <div className="md:col-span-7 flex flex-col items-center justify-center p-6 bg-slate-100 rounded-2xl border border-slate-200">
              {/* Badge Container (Engineered to look like real high-durability construction asset tag) */}
              <div className="w-full max-w-sm bg-white p-5 rounded-2xl border-2 border-slate-900 shadow-md space-y-4 text-slate-900 font-sans">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                  <div className="flex items-center gap-1.5 font-black text-sm tracking-tight text-slate-900">
                    <span className="bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded font-black text-xs">BUILD</span>TRACK
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                    PROPERTY OF ASSET FLEET
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Generated QR Graphic (SVG mock representation) */}
                  <div className="w-28 h-28 border-2 border-slate-900 p-1.5 rounded-xl flex items-center justify-center bg-white shrink-0">
                    <div className="w-full h-full bg-slate-900 rounded flex flex-col items-center justify-center text-white p-2">
                      <QrCode className="w-16 h-16 text-white" />
                    </div>
                  </div>

                  {/* Asset Details */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-[10px] font-mono font-black text-slate-500">ASSET ID:</div>
                    <div className="text-base font-black text-slate-900 leading-tight">{selectedAssetForBadge.id}</div>
                    <div className="text-xs font-bold text-slate-800 truncate mt-1">{selectedAssetForBadge.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">SN: {selectedAssetForBadge.serialNumber || 'CAT-8812'}</div>
                    <div className="text-[9px] text-slate-500 mt-1 font-semibold">Site: {selectedAssetForBadge.siteName}</div>
                  </div>
                </div>

                {/* RFID EPC Strip */}
                <div className="border-t border-slate-200 pt-2 text-[10px] font-mono text-slate-600 flex flex-col gap-0.5">
                  <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">RFID UHF EPC Tag:</span>
                  <span className="font-bold text-slate-900 truncate">{selectedAssetForBadge.tagEpc || 'E2801191A000001000000457'}</span>
                </div>
              </div>

              <span className="text-[11px] text-slate-500 mt-4">
                3.5" x 2.25" Standard Industrial Form Factor with RFID UHF inlay.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RFID EVENT STREAM */}
      {activeTab === 'rfid-stream' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-600" />
                Live UHF RFID Reader Event Stream (Antenna Telemetry)
              </h2>
              <p className="text-xs text-slate-500">
                Continuous portal scans, duplicate filtering, RSSI signal strengths, and gate detections.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                STREAM ACTIVE
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Asset ID</th>
                  <th className="px-4 py-2.5">RFID EPC Tag</th>
                  <th className="px-4 py-2.5">Portal Reader</th>
                  <th className="px-4 py-2.5">Gate Location</th>
                  <th className="px-4 py-2.5">Signal (RSSI)</th>
                  <th className="px-4 py-2.5">Event</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {rfidEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {evt.timestamp}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono">
                        {evt.assetId}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600">
                      {evt.tagEpc}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 font-semibold">
                      {evt.readerName}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {evt.location}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px]">
                      <span className={evt.rssi > -45 ? 'text-emerald-600 font-bold' : 'text-slate-600'}>
                        {evt.rssi} dBm
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        evt.eventType === 'ENTRY' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {evt.eventType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: READERS HARDWARE STATUS */}
      {activeTab === 'readers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {readersList.map((reader) => (
            <div key={reader.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {reader.id}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{reader.name}</h3>
                  <div className="text-[11px] text-slate-500">{reader.model}</div>
                </div>

                <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Wifi className="w-3.5 h-3.5" /> Online
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Assigned Site</span>
                  <span className="font-semibold text-slate-800">{reader.siteName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Physical Portal</span>
                  <span className="font-semibold text-slate-800">{reader.location}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Antenna Ports</span>
                  <span className="font-semibold text-slate-800">{reader.antennaCount} Array Channels</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Lifetime Portal Reads</span>
                  <span className="font-bold text-blue-600 font-mono">{reader.totalReadsCount.toLocaleString()} Reads</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
                <span>Firmware: {reader.firmwareVersion}</span>
                <span>Last Ping: {reader.lastPing}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
