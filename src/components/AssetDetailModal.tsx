import React, { useState } from 'react';
import { 
  X, 
  Tag, 
  Radio, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Wrench, 
  ShieldAlert, 
  ArrowLeftRight, 
  Activity, 
  DollarSign, 
  QrCode,
  Gauge,
  Battery,
  Fuel,
  Cpu,
  History,
  TrendingUp,
  ClipboardCheck,
  FileText,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  ExternalLink,
  Shield,
  Layers
} from 'lucide-react';
import { Asset, ReadEvent, Checkout, BleDevice, GpsBreadcrumb } from '../types';

interface AssetDetailModalProps {
  asset: Asset | null;
  onClose: () => void;
  readEvents?: ReadEvent[];
  checkouts?: Checkout[];
  bleDevices?: BleDevice[];
  breadcrumbs?: GpsBreadcrumb[];
  onFindRadar?: (asset: Asset) => void;
  onCheckout?: (asset: Asset) => void;
  onEdit?: (asset: Asset) => void;
  onOpenQrModal?: (asset: Asset) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  onClose,
  readEvents = [],
  checkouts = [],
  bleDevices = [],
  breadcrumbs = [],
  onFindRadar,
  onCheckout,
  onEdit,
  onOpenQrModal
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview' 
    | 'location' 
    | 'telemetry' 
    | 'movements' 
    | 'utilization' 
    | 'maintenance' 
    | 'inspections' 
    | 'work_orders' 
    | 'documents' 
    | 'alerts'
  >('overview');

  if (!asset) return null;

  const assetEvents = readEvents.filter(e => e.assetId === asset.id || e.epc === asset.tagEpc);
  const assetCheckouts = checkouts.filter(c => c.assetId === asset.id);
  const matchedBle = bleDevices.find(b => b.assetId === asset.id);
  const matchedBreadcrumbs = breadcrumbs.filter(b => b.assetId === asset.id);

  // Tabs list
  const modalTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'location', label: 'Live Location & Geofence' },
    { id: 'telemetry', label: 'Telemetry' },
    { id: 'movements', label: 'History & Movements' },
    { id: 'utilization', label: 'Usage & Utilization' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'inspections', label: 'Inspections' },
    { id: 'work_orders', label: 'Work Orders' },
    { id: 'documents', label: 'Documents & Manuals' },
    { id: 'alerts', label: 'Alerts & Incidents' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-4xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        
        {/* Modal Top Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <img 
              src={asset.photoUrl} 
              alt={asset.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0" 
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg text-white">{asset.name}</h2>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  asset.status === 'In Zone' || asset.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  asset.status === 'Checked Out' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                  asset.status === 'Damaged' || asset.status === 'Missing' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {asset.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {asset.manufacturer} {asset.model} • SN: {asset.serialNumber} • ID: {asset.id}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section 7: 10 Tab Navigation Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 flex items-center gap-1 overflow-x-auto text-xs font-bold scrollbar-none">
          {modalTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[68vh] overflow-y-auto text-xs text-slate-700">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {onOpenQrModal && (
                  <button
                    onClick={() => { onClose(); onOpenQrModal(asset); }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-xs"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Print QR Tag</span>
                  </button>
                )}

                {onFindRadar && (
                  <button
                    onClick={() => { onClose(); onFindRadar(asset); }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-xs"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Proximity Radar</span>
                  </button>
                )}

                {onCheckout && asset.status === 'In Zone' && (
                  <button
                    onClick={() => { onClose(); onCheckout(asset); }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-xs"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Issue Check-Out</span>
                  </button>
                )}

                {onEdit && (
                  <button
                    onClick={() => { onClose(); onEdit(asset); }}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg flex items-center gap-1.5"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Edit Metadata</span>
                  </button>
                )}
              </div>

              {/* Full Asset Identity Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Asset Identifier</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{asset.id}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Barcode / Asset Tag ID</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Category & Subcategory</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{asset.category}</span>
                  <span className="text-[10px] text-slate-400">{asset.subcategory || asset.assetType || 'Equipment'}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Project & Site</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{asset.siteName}</span>
                  <span className="text-[10px] text-slate-400">Zone: {asset.zoneName}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Operator / Driver</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {asset.assignedWorker || asset.assignedOperator || asset.custodianName || 'Unassigned / In Yard'}
                  </span>
                  <span className="text-[10px] text-slate-400">Active custodian</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">UHF RFID Tag EPC</span>
                  <span className="font-mono font-bold text-blue-600 text-xs mt-0.5 block truncate">{asset.tagEpc}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Gen2 ISO 18000-6C</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">BLE Beacon & QR</span>
                  <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">
                    {matchedBle ? matchedBle.id : (asset.bleBeaconId || 'BLE-TAG-102')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">QR: {asset.qrCode || `QR-${asset.id}`}</span>
                </div>
              </div>

              {/* Financial & Purchase Info */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Capital Replacement Value</span>
                  <span className="text-slate-500 text-[11px]">Book value & insurance valuation</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-600 font-mono">
                    ${(asset.cost || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Depreciation: Straight-line (7yr)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE LOCATION & GEOFENCE STATUS */}
          {activeTab === 'location' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Geofence Status: Authorized Zone</h4>
                      <p className="text-[11px] text-slate-500">Asset is safely located within designated work boundary</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-mono font-bold rounded-full text-xs">
                    IN-ZONE COMPLIANT
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block uppercase">GPS Coordinates</span>
                    <span className="font-mono font-bold text-slate-900">
                      {asset.coordinates ? `${asset.coordinates.lat.toFixed(5)}, ${asset.coordinates.lng.toFixed(5)}` : '37.7749, -122.4194'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block uppercase">Zone Name</span>
                    <span className="font-bold text-slate-900">{asset.zoneName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block uppercase">Dwell Time</span>
                    <span className="font-mono font-bold text-slate-900">3 hrs 42 mins</span>
                  </div>
                </div>
              </div>

              {/* Simulated Map Visualizer Container */}
              <div className="bg-slate-950 rounded-xl p-4 text-white relative min-h-[220px] flex flex-col justify-between overflow-hidden border border-slate-800">
                <div className="flex justify-between items-center z-10">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>{asset.siteName} • Zone Boundary Grid</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-[10px]">
                    High-Precision GPS Lock (±1.2m)
                  </span>
                </div>

                <div className="absolute inset-0 opacity-20 flex items-center justify-center pointer-events-none">
                  <div className="w-72 h-72 rounded-full border border-blue-400/40 animate-ping"></div>
                  <div className="w-48 h-48 rounded-full border-2 border-dashed border-emerald-400/40"></div>
                </div>

                <div className="z-10 text-center py-8">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/40 font-bold">
                    <MapPin className="w-5 h-5 fill-slate-950" />
                  </div>
                  <span className="font-bold text-sm block mt-2 text-white">{asset.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Speed: 0.0 km/h (Stationary) • Heading: 142° SE
                  </span>
                </div>

                <div className="flex justify-between items-center z-10 text-[10px] text-slate-400 font-mono">
                  <span>Last satellite uplink: {new Date().toLocaleTimeString()}</span>
                  <span>Constellation: GPS + GLONASS + Galileo</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TELEMETRY */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-mono uppercase font-bold">Operating Hours</span>
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-2xl font-black text-slate-900 font-mono">{asset.operatingHours || 1420}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Hours logged</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-mono uppercase font-bold">Idle Time</span>
                    <Activity className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-2xl font-black text-amber-600 font-mono">{asset.idleHours || 120}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Idle engine hours</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-mono uppercase font-bold">Fuel Level</span>
                    <Fuel className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-2xl font-black text-emerald-600 font-mono">{asset.fuelLevel || 78}%</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Diesel capacity</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-mono uppercase font-bold">Beacon Battery</span>
                    <Battery className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-2xl font-black text-emerald-600 font-mono">{matchedBle?.batteryLevel || 94}%</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">IoT battery</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block">Engine Operating Status</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-slate-800">Engine Running (Idle / Standby)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Coolant temp: 88°C • Oil pressure: 42 PSI • RPM: 850</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block">Wireless Gateway Signal</span>
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800">Cellular 4G LTE-M / CAT-M1</span>
                  </div>
                  <p className="text-[11px] text-slate-500">RSSI: {matchedBle?.rssi || -46} dBm • Gateway: GTW-GATE-A1</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HISTORY & MOVEMENTS */}
          {activeTab === 'movements' && (
            <div className="space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
                Chronological Movement & Portal Event Trail
              </span>
              
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {(matchedBreadcrumbs.length > 0 ? matchedBreadcrumbs : [
                  {
                    id: 'bc-1',
                    assetId: asset.id,
                    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                    lat: 37.7749,
                    lng: -122.4194,
                    speedKmh: 4.2,
                    headingDeg: 120,
                    zoneId: asset.zoneId,
                    zoneName: asset.zoneName,
                    recordedBy: 'GPS Tracker #9102'
                  },
                  {
                    id: 'bc-2',
                    assetId: asset.id,
                    timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
                    lat: 37.7745,
                    lng: -122.4190,
                    speedKmh: 12.8,
                    headingDeg: 95,
                    zoneId: 'zone-east',
                    zoneName: 'East Gate Portal',
                    recordedBy: 'RFID Portal Reader 101'
                  }
                ]).map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{item.zoneName}</span>
                        <span className="text-[10px] text-slate-400">
                          Coords: {item.lat.toFixed(4)}, {item.lng.toFixed(4)} • Speed: {item.speedKmh} km/h • Sensor: {item.recordedBy}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: USAGE & UTILIZATION */}
          {activeTab === 'utilization' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900">Operating vs. Idle Efficiency Ratio</span>
                  <span className="text-blue-600 font-mono font-bold text-sm">82% Productive</span>
                </div>
                <div className="w-full bg-amber-200 h-3 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: '82%' }}></div>
                  <div className="bg-amber-400 h-full" style={{ width: '18%' }}></div>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
                  <span>Active Operation: 38.4 hrs/week</span>
                  <span>Engine Idle: 8.2 hrs/week</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Weekly Fuel Burn</span>
                  <span className="text-base font-black text-slate-900 mt-1 block">184 Liters</span>
                  <span className="text-[10px] text-emerald-600">4% below site baseline</span>
                </div>
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Carbon Footprint</span>
                  <span className="text-base font-black text-slate-900 mt-1 block">492 kg CO2e</span>
                  <span className="text-[10px] text-slate-500">EPA Tier 4 Final</span>
                </div>
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Cycle Turns</span>
                  <span className="text-base font-black text-slate-900 mt-1 block">14 Shifts</span>
                  <span className="text-[10px] text-blue-600">Double-shift assigned</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: MAINTENANCE */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Service Logs & Preventative Schedules
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600">Next Service in 80 hrs</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 block">500-Hour Hydraulic Seal Overhaul & Oil Filter</span>
                    <span className="text-[11px] text-slate-500">Performed by Heavy Diesel Solutions LLC • Invoice #HDS-8921</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px]">
                    COMPLETED
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 block">Track Tension & Undercarriage Wear Measurement</span>
                    <span className="text-[11px] text-slate-500">Scheduled by Site Lead Derrick Hall</span>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold rounded-lg text-[10px]">
                    SCHEDULED (OCT 15)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: INSPECTIONS */}
          {activeTab === 'inspections' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                  OSHA & Pre-Shift Safety Inspections
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600">100% Pass Rate</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 block">Pre-Shift Circle Walkaround & Brake Test</span>
                    <span className="text-[11px] text-slate-500">Inspector: Frank Kowalski • Passed 14 safety check items</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px]">
                    PASSED TODAY
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 block">Monthly Rigging & Load Cell Certification</span>
                    <span className="text-[11px] text-slate-500">Inspector: Certified Crane Safety Specialist</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px]">
                    CERTIFIED
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: WORK ORDERS */}
          {activeTab === 'work_orders' && (
            <div className="space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
                Active & Historic Maintenance Work Orders
              </span>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-600">WO-2026-089</span>
                    <span className="font-bold text-slate-900">Replace Hydraulic Auxiliary Coupler O-Ring</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Assigned: Tech Dave S. • Priority: Medium • Site A Laydown
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold rounded-lg text-[10px]">
                  IN PROGRESS
                </span>
              </div>
            </div>
          )}

          {/* TAB 9: DOCUMENTS & MANUALS */}
          {activeTab === 'documents' && (
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
                Manufacturer Manuals, Telematics Specs, and Compliance Certs
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 block">OEM Operator Manual.pdf</span>
                      <span className="text-[10px] text-slate-400">14.2 MB • English / Spanish</span>
                    </div>
                  </div>
                  <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600">
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 block">Annual EPA Emissions Cert.pdf</span>
                      <span className="text-[10px] text-slate-400">2.1 MB • Valid thru 2027</span>
                    </div>
                  </div>
                  <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: ALERTS & INCIDENTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
                Telemetry Threshold Exceptions & Security Alerts
              </span>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 block">Excessive Idle Detected (&gt;45 min)</span>
                      <span className="text-[11px] text-slate-600">Engine left running in Laydown Yard without motion telemetry</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Yesterday 16:20</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
