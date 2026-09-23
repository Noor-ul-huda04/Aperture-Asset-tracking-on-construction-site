import React, { useState } from 'react';
import { 
  Radio, 
  Battery, 
  BatteryWarning, 
  BatteryCharging, 
  Wifi, 
  Signal, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  Plus, 
  ExternalLink, 
  Cpu, 
  Sliders, 
  MapPin, 
  Layers, 
  ChevronRight,
  Sparkles,
  Smartphone,
  ShieldCheck,
  X
} from 'lucide-react';
import { BleDevice, BleDeviceStatus, Asset, Site } from '../types';

interface BleDevicesViewProps {
  bleDevices: BleDevice[];
  assets: Asset[];
  sites: Site[];
  onSelectAsset?: (asset: Asset) => void;
  onOpenRadar?: (asset: Asset) => void;
  onAddBleDevice?: (device: BleDevice) => void;
  onUpdateBleDevice?: (device: BleDevice) => void;
}

export const BleDevicesView: React.FC<BleDevicesViewProps> = ({
  bleDevices = [],
  assets = [],
  sites = [],
  onSelectAsset,
  onOpenRadar,
  onAddBleDevice,
  onUpdateBleDevice
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [siteFilter, setSiteFilter] = useState<string>('All');
  const [batteryFilter, setBatteryFilter] = useState<string>('All');
  const [selectedDevice, setSelectedDevice] = useState<BleDevice | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  // Filtered devices
  const filteredDevices = bleDevices.filter(device => {
    const matchesSearch = 
      device.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.macAddress.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || device.status === statusFilter;
    const matchesSite = siteFilter === 'All' || device.siteId === siteFilter;
    const matchesBattery = 
      batteryFilter === 'All' ? true :
      batteryFilter === 'Critical' ? device.batteryLevel < 20 :
      batteryFilter === 'Warning' ? device.batteryLevel < 40 : true;

    return matchesSearch && matchesStatus && matchesSite && matchesBattery;
  });

  // KPI Metrics
  const totalCount = bleDevices.length;
  const onlineCount = bleDevices.filter(d => d.status === 'Online').length;
  const lowBatteryCount = bleDevices.filter(d => d.batteryLevel < 25 || d.status === 'Low Battery').length;
  const maintenanceCount = bleDevices.filter(d => d.status === 'Maintenance Required').length;
  const avgBattery = Math.round(bleDevices.reduce((acc, d) => acc + d.batteryLevel, 0) / (totalCount || 1));

  const handleSimulatePing = () => {
    setIsPinging(true);
    setTimeout(() => {
      setIsPinging(false);
      // Randomly tweak signal & battery slightly
      if (onUpdateBleDevice && bleDevices.length > 0) {
        const randomDev = bleDevices[Math.floor(Math.random() * bleDevices.length)];
        onUpdateBleDevice({
          ...randomDev,
          lastCommunication: new Date().toISOString(),
          rssi: Math.min(-35, Math.max(-88, randomDev.rssi + Math.floor(Math.random() * 9) - 4))
        });
      }
    }, 800);
  };

  const getStatusBadge = (status: BleDeviceStatus) => {
    switch (status) {
      case 'Online':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        );
      case 'Low Battery':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <BatteryWarning className="w-3.5 h-3.5 text-amber-600" />
            Low Battery
          </span>
        );
      case 'Maintenance Required':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Maintenance
          </span>
        );
      case 'Offline':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Offline
          </span>
        );
    }
  };

  const getRssiBars = (rssi: number) => {
    const bars = rssi > -50 ? 4 : rssi > -65 ? 3 : rssi > -80 ? 2 : 1;
    const color = bars >= 3 ? 'bg-emerald-500' : bars === 2 ? 'bg-amber-500' : 'bg-rose-500';

    return (
      <div className="flex items-end gap-0.5 h-4" title={`${rssi} dBm`}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`w-1 rounded-xs transition-all ${
              i <= bars ? color : 'bg-slate-200'
            }`}
            style={{ height: `${i * 25}%` }}
          />
        ))}
        <span className="text-[10px] font-mono text-slate-500 ml-1.5">{rssi} dBm</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Module Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">BLE Device Management</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 font-mono">
                  Bluetooth 5.2 Long-Range
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Active Bluetooth Low Energy beacons, micro-locators, telemetry sensors, and tag telemetry status.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSimulatePing}
            disabled={isPinging}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-2 shadow-xs transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isPinging ? 'animate-spin' : ''}`} />
            <span>{isPinging ? 'Pinging Gateways...' : 'Ping Telemetry'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Pair BLE Beacon</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">Total Beacons</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Deployed across 3 sites</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 font-mono">Online & Active</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{onlineCount}</div>
          <span className="text-[10px] text-emerald-600/80 mt-0.5 block">
            {Math.round((onlineCount / (totalCount || 1)) * 100)}% network health
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 font-mono">Low Battery (&lt;25%)</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{lowBatteryCount}</div>
          <span className="text-[10px] text-amber-600/80 mt-0.5 block">Replacement required</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 font-mono">Maintenance</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{maintenanceCount}</div>
          <span className="text-[10px] text-rose-600/80 mt-0.5 block">Signal or sensor faults</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 md:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">Avg Fleet Battery</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{avgBattery}%</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${avgBattery}%` }}></div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Beacon ID, Asset Name, or MAC Address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700 focus:outline-none focus:border-blue-500 text-xs"
          >
            <option value="All">All Statuses</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Low Battery">Low Battery</option>
            <option value="Maintenance Required">Maintenance Required</option>
          </select>

          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700 focus:outline-none focus:border-blue-500 text-xs"
          >
            <option value="All">All Job Sites</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={batteryFilter}
            onChange={(e) => setBatteryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700 focus:outline-none focus:border-blue-500 text-xs"
          >
            <option value="All">All Battery Levels</option>
            <option value="Warning">Battery &lt; 40%</option>
            <option value="Critical">Critical &lt; 20%</option>
          </select>
        </div>
      </div>

      {/* Main Devices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Beacon Device ID</th>
                <th className="py-3 px-4">Associated Asset</th>
                <th className="py-3 px-4">Site & Zone Location</th>
                <th className="py-3 px-4">Signal Strength</th>
                <th className="py-3 px-4">Battery</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Telemetry</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Radio className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-slate-600">No BLE devices match your filters</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try broadening your search or resetting filters</p>
                  </td>
                </tr>
              ) : (
                filteredDevices.map(device => {
                  const matchedAsset = assets.find(a => a.id === device.assetId);

                  return (
                    <tr 
                      key={device.id} 
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedDevice(device)}
                    >
                      {/* Beacon Device ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 font-mono text-[10px] font-bold">
                            BLE
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 font-mono block">{device.id}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{device.macAddress}</span>
                          </div>
                        </div>
                      </td>

                      {/* Associated Asset */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{device.assetName}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{device.assetType} • {device.assetId}</span>
                      </td>

                      {/* Site & Zone */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{device.siteName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block pl-5 font-mono">{device.zoneName}</span>
                      </td>

                      {/* Signal Strength (RSSI) */}
                      <td className="py-3.5 px-4">
                        {getRssiBars(device.rssi)}
                      </td>

                      {/* Battery Level */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                device.batteryLevel > 50 ? 'bg-emerald-500' :
                                device.batteryLevel > 20 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${device.batteryLevel}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-700">{device.batteryLevel}%</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(device.status)}
                      </td>

                      {/* Last Communication */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(device.lastCommunication).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {matchedAsset && onOpenRadar && (
                            <button
                              onClick={() => onOpenRadar(matchedAsset)}
                              title="Open Proximity Radar"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Radio className="w-4 h-4" />
                            </button>
                          )}
                          {matchedAsset && onSelectAsset && (
                            <button
                              onClick={() => onSelectAsset(matchedAsset)}
                              title="View Asset Profile"
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device Detail Drawer / Modal */}
      {selectedDevice && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-mono">{selectedDevice.id}</h3>
                  <p className="text-xs text-slate-400">MAC: {selectedDevice.macAddress} • Protocol: {selectedDevice.beaconProtocol}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDevice(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-600 max-h-[70vh] overflow-y-auto">
              {/* Status Header */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Device Operational State:</span>
                  {getStatusBadge(selectedDevice.status)}
                </div>
                <div className="flex items-center gap-1.5 font-mono text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(selectedDevice.lastCommunication).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Asset Assignment Card */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block mb-2">Bound Asset</span>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{selectedDevice.assetName}</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">Type: {selectedDevice.assetType} • Site: {selectedDevice.siteName} ({selectedDevice.zoneName})</p>
                  </div>
                  {assets.find(a => a.id === selectedDevice.assetId) && onSelectAsset && (
                    <button
                      onClick={() => {
                        const a = assets.find(x => x.id === selectedDevice.assetId);
                        if (a) onSelectAsset(a);
                      }}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold flex items-center gap-1.5 text-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Asset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Hardware Specifications Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Signal Level (RSSI)</span>
                  <div className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
                    {getRssiBars(selectedDevice.rssi)}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Tx Power: {selectedDevice.txPowerDbm} dBm</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Battery Capacity</span>
                  <div className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
                    <Battery className={`w-4 h-4 ${selectedDevice.batteryLevel < 20 ? 'text-rose-500' : 'text-emerald-500'}`} />
                    <span>{selectedDevice.batteryLevel}%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Est. 14 months remaining</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Advertising Interval</span>
                  <div className="text-base font-bold text-slate-900 mt-1 font-mono">{selectedDevice.advertisingIntervalMs} ms</div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Beacon broadcast cycle</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Firmware Version</span>
                  <div className="text-base font-bold text-slate-900 mt-1 font-mono">{selectedDevice.firmwareVersion}</div>
                  <span className="text-[10px] text-emerald-600 mt-1 block font-semibold">Latest release</span>
                </div>
              </div>

              {selectedDevice.temperatureCelsius !== undefined && (
                <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-slate-800">On-Board Sensor Telemetry:</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono font-medium text-slate-700">
                    <span>Temp: {selectedDevice.temperatureCelsius}°C</span>
                    <span>Motion: {selectedDevice.motionDetected ? 'Active (Moving)' : 'Stationary'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                onClick={() => setSelectedDevice(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 text-xs"
              >
                Close
              </button>
              {assets.find(a => a.id === selectedDevice.assetId) && onOpenRadar && (
                <button
                  onClick={() => {
                    const a = assets.find(x => x.id === selectedDevice.assetId);
                    setSelectedDevice(null);
                    if (a) onOpenRadar(a);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2"
                >
                  <Radio className="w-4 h-4" />
                  <span>Locate with Proximity Radar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Register / Pair BLE Beacon Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 text-base">Pair New BLE Beacon</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Attach and bind a new Bluetooth 5.0 / 5.2 beacon tag to an unassigned construction asset.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const devId = (form.elements.namedItem('devId') as HTMLInputElement).value;
                const mac = (form.elements.namedItem('mac') as HTMLInputElement).value;
                const assetId = (form.elements.namedItem('assetId') as HTMLSelectElement).value;
                const selectedAsset = assets.find(a => a.id === assetId);

                if (onAddBleDevice && selectedAsset) {
                  onAddBleDevice({
                    id: devId,
                    macAddress: mac,
                    assetId: selectedAsset.id,
                    assetName: selectedAsset.name,
                    assetType: selectedAsset.assetType || 'Equipment',
                    siteId: selectedAsset.siteId,
                    siteName: selectedAsset.siteName,
                    zoneId: selectedAsset.zoneId,
                    zoneName: selectedAsset.zoneName,
                    batteryLevel: 100,
                    rssi: -45,
                    txPowerDbm: 4,
                    advertisingIntervalMs: 500,
                    status: 'Online',
                    lastCommunication: new Date().toISOString(),
                    beaconProtocol: 'iBeacon',
                    firmwareVersion: 'v2.4.2',
                    temperatureCelsius: 22.0,
                    motionDetected: false
                  });
                }
                setShowAddModal(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Beacon Identifier (ID)</label>
                <input
                  name="devId"
                  defaultValue={`BLE-TAG-${Math.floor(100 + Math.random() * 900)}`}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hardware MAC Address</label>
                <input
                  name="mac"
                  defaultValue={`C4:4F:33:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}`}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign to Asset</label>
                <select
                  name="assetId"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                >
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.category} - {a.id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tx Power</label>
                  <select
                    name="txPower"
                    defaultValue="4"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="4">+4 dBm (Standard Long Range)</option>
                    <option value="0">0 dBm (Medium Range)</option>
                    <option value="-4">-4 dBm (Indoor Crib)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Broadcast Rate</label>
                  <select
                    name="rate"
                    defaultValue="500"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="250">250 ms (High Velocity)</option>
                    <option value="500">500 ms (Standard)</option>
                    <option value="1000">1000 ms (Battery Saver)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
                >
                  Confirm & Bind Beacon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
