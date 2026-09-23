import React, { useState } from 'react';
import { 
  Radio, 
  Tag, 
  Cpu, 
  MapPin, 
  Filter, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Sliders, 
  RefreshCw, 
  ArrowRightLeft, 
  ShieldCheck, 
  Clock, 
  Plus, 
  ExternalLink,
  Wifi,
  WifiOff,
  Sparkles,
  Database
} from 'lucide-react';
import { Asset, Reader, RfidEvent, Site } from '../types';

interface RfidViewProps {
  assets: Asset[];
  sites: Site[];
  readers?: Reader[];
  rfidEvents?: RfidEvent[];
  onTriggerScan?: (readerId: string) => void;
  onSelectAsset?: (asset: Asset) => void;
}

export const RfidView: React.FC<RfidViewProps> = ({
  assets = [],
  sites = [],
  readers = [],
  rfidEvents: initialRfidEvents = [],
  onTriggerScan,
  onSelectAsset
}) => {
  const safeAssets = assets || [];
  const safeSites = sites || [];
  const safeReaders = readers || [];

  const [activeSubTab, setActiveSubTab] = useState<'events' | 'tags' | 'readers' | 'engine'>('events');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReaderFilter, setSelectedReaderFilter] = useState<string>('All');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('All');
  
  // Event Processing Engine Config
  const [duplicateFilterEnabled, setDuplicateFilterEnabled] = useState(true);
  const [suppressionWindowMs, setSuppressionWindowMs] = useState(1500);
  const [zoneDetectionSensitivity, setZoneDetectionSensitivity] = useState<'High' | 'Medium' | 'Low'>('High');
  const [isScanning, setIsScanning] = useState(false);

  const activeReaders: Reader[] = safeReaders;

  // Real-time RFID Events list
  const [eventList, setEventList] = useState<RfidEvent[]>(initialRfidEvents || []);

  const handleManualTrigger = (readerId: string) => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const safeAssetList = assets || [];
      const randomAsset = safeAssetList.length > 0 ? safeAssetList[Math.floor(Math.random() * safeAssetList.length)] : null;
      if (randomAsset) {
        const newEvt: RfidEvent = {
          id: `rfid-evt-${Date.now()}`,
          tagEpc: randomAsset.tagEpc || `E2801191A${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          assetId: randomAsset.id,
          readerId,
          readerName: activeReaders.find(r => r.id === readerId)?.name || 'Gate Portal',
          location: activeReaders.find(r => r.id === readerId)?.location || 'Laydown Portal',
          timestamp: new Date().toLocaleTimeString(),
          rssi: Math.floor(-42 - Math.random() * 15),
          eventType: Math.random() > 0.5 ? 'ENTRY' : 'EXIT',
          antennaPort: Math.floor(1 + Math.random() * 4)
        };
        setEventList(prev => [newEvt, ...prev.slice(0, 19)]);
      }
      if (onTriggerScan) onTriggerScan(readerId);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">RFID Asset Tracking & Portals</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 font-mono">
                EPC Gen 2 / ISO 18000-6C
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Fixed gate portals, UHF on-metal asset tags, multi-antenna beam steering, and real-time zone transition filters.
            </p>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('events')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'events' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Event Stream
          </button>
          <button
            onClick={() => setActiveSubTab('tags')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'tags' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Registered Tags ({assets.length})
          </button>
          <button
            onClick={() => setActiveSubTab('readers')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'readers' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Portals & Antennas ({activeReaders.length})
          </button>
          <button
            onClick={() => setActiveSubTab('engine')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'engine' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Deduplication Engine
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">Active Gate Portals</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{activeReaders.length}</div>
          <span className="text-[10px] text-emerald-600 mt-0.5 block font-medium">3 Online • 1 Warning</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">Bound UHF Tags</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{assets.length}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Weatherproof on-metal tags</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">24h Total Tag Reads</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {activeReaders.reduce((acc, r) => acc + (r.totalReadsCount || 0), 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Across all directional gates</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 font-mono">Deduplication Rate</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">98.4%</div>
          <span className="text-[10px] text-emerald-600 mt-0.5 block font-medium">1,500 ms suppression active</span>
        </div>
      </div>

      {/* Tab 1: Live Event Stream */}
      {activeSubTab === 'events' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Filter Reader:</span>
              <select
                value={selectedReaderFilter}
                onChange={(e) => setSelectedReaderFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="All">All Portal Readers</option>
                {activeReaders.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleManualTrigger((activeReaders || [])[0]?.id || 'reader-101')}
                disabled={isScanning}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>Trigger Manual Portal Scan</span>
              </button>
            </div>
          </div>

          {/* Events Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Event Time</th>
                  <th className="py-3 px-4">Asset Identified</th>
                  <th className="py-3 px-4">RFID Tag EPC</th>
                  <th className="py-3 px-4">Reader Portal</th>
                  <th className="py-3 px-4">Antenna Port</th>
                  <th className="py-3 px-4">RSSI</th>
                  <th className="py-3 px-4">Transition Direction</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eventList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Radio className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No RFID events recorded</p>
                      <p className="text-xs text-slate-400">Events will appear here in real time as RFID readers detect tagged assets.</p>
                    </td>
                  </tr>
                ) : (
                  eventList
                    .filter(e => selectedReaderFilter === 'All' || e.readerId === selectedReaderFilter)
                    .map(evt => {
                      const matched = safeAssets.find(a => a.id === evt.assetId);

                      return (
                        <tr key={evt.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-500">{evt.timestamp}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{matched ? matched.name : evt.assetId}</div>
                            <span className="text-[10px] text-slate-400 font-mono">{matched?.category || 'Asset'}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">{evt.tagEpc}</td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800">{evt.readerName}</div>
                            <span className="text-[10px] text-slate-400">{evt.location}</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">Port #{evt.antennaPort || 1}</td>
                          <td className="py-3 px-4 font-mono text-slate-600">{evt.rssi} dBm</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              evt.eventType === 'ENTRY' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : evt.eventType === 'EXIT'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {evt.eventType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {matched && onSelectAsset && (
                              <button
                                onClick={() => onSelectAsset(matched)}
                                className="text-blue-600 hover:text-blue-800 font-bold text-[11px]"
                              >
                                View Asset
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Registered RFID Tags */}
      {activeSubTab === 'tags' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search EPC or asset..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">Standard 96-bit EPC Gen 2</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">EPC Identifier</th>
                <th className="py-3 px-4">Bound Asset</th>
                <th className="py-3 px-4">Tag Classification</th>
                <th className="py-3 px-4">Site Location</th>
                <th className="py-3 px-4">Last Detected Reader</th>
                <th className="py-3 px-4">Last Read Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safeAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Tag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No RFID tags found</p>
                    <p className="text-xs text-slate-400">Registered tagged assets will be listed here.</p>
                  </td>
                </tr>
              ) : (
                safeAssets
                  .filter(a => (a.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (a.tagEpc || '').toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{a.tagEpc || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{a.name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{a.category} • {a.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 font-mono text-slate-600">
                          Omni-ID Max HD (On-Metal)
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{a.siteName || 'Unassigned'}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{a.lastReaderId || '—'}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {a.lastSeenAt ? new Date(a.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Portals & Antennas */}
      {activeSubTab === 'readers' && (
        <div>
          {activeReaders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <Radio className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-700 text-base">No RFID readers or portals configured</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Active portals will display online status, antenna power levels, and lifetime read counters when connected.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeReaders.map(reader => (
                <div key={reader.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                        reader.status === 'Online'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        {reader.status === 'Online' ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{reader.name}</h3>
                        <p className="text-xs text-slate-500">{reader.model} • IP: {reader.ipAddress || '192.168.1.100'}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      reader.status === 'Online'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {reader.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">Antennas</span>
                      <span className="font-bold text-slate-900">{reader.antennaCount} Beam Ports</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">TX Power</span>
                      <span className="font-bold text-slate-900">{reader.antennaPowerDbm || 30} dBm</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">Lifetime Reads</span>
                      <span className="font-bold text-slate-900">{(reader.totalReadsCount || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 font-mono text-[11px]">Firmware: {reader.firmwareVersion}</span>
                    <button
                      onClick={() => handleManualTrigger(reader.id)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold text-xs transition-colors"
                    >
                      Ping Portal Antenna
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Deduplication & Edge Processing Engine */}
      {activeSubTab === 'engine' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-2xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">RFID Edge Event Filtering & Deduplication Engine</h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure hardware portal event suppression windows, antenna beam overlap filtering, and movement zone hysteresis.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 text-sm block">Duplicate-Read Filtering</span>
                  <span className="text-slate-500 text-xs">Suppresses repeated rapid tag pings from the same reader antenna</span>
                </div>
                <input
                  type="checkbox"
                  checked={duplicateFilterEnabled}
                  onChange={(e) => setDuplicateFilterEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>

              {duplicateFilterEnabled && (
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>Suppression Window Time:</span>
                    <span className="font-mono text-blue-600">{suppressionWindowMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="250"
                    max="5000"
                    step="250"
                    value={suppressionWindowMs}
                    onChange={(e) => setSuppressionWindowMs(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>250 ms (Ultra High Speed)</span>
                    <span>5,000 ms (Strict Suppression)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 text-sm block">Read-Zone Directional Transition Logic</span>
              <span className="text-slate-500 text-xs block">
                Calculates movement vectors by sequencing Antenna 1 (Outer Apron) and Antenna 2 (Inner Laydown).
              </span>
              <div className="flex gap-2 pt-2">
                {(['High', 'Medium', 'Low'] as const).map(sens => (
                  <button
                    key={sens}
                    onClick={() => setZoneDetectionSensitivity(sens)}
                    className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                      zoneDetectionSensitivity === sens
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {sens} Sensitivity
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
