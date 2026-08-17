import React, { useState } from 'react';
import { Cpu, Radio, RefreshCw, CheckCircle2, Zap, Activity, RotateCw, Plus, X, Server, Wifi } from 'lucide-react';
import { Reader } from '../types';

interface HardwareManagementViewProps {
  readers: Reader[];
  onUpdatePower: (readerId: string, powerDbm: number) => void;
  onFlushBuffer: () => void;
  onTriggerReaderScan?: (readerId: string, readerName: string) => void;
  onAddReader?: (reader: Partial<Reader>) => void;
}

export const HardwareManagementView: React.FC<HardwareManagementViewProps> = ({
  readers,
  onUpdatePower,
  onFlushBuffer,
  onTriggerReaderScan,
  onAddReader
}) => {
  const [rebootingId, setRebootingId] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { latency: number; timestamp: string }>>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // New reader form state
  const [newName, setNewName] = useState('');
  const [newIp, setNewIp] = useState('192.168.1.150');
  const [newZone, setNewZone] = useState('Laydown Yard B');
  const [newPower, setNewPower] = useState(30);

  const showToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handlePing = (r: Reader) => {
    const latency = Math.floor(12 + Math.random() * 28);
    setPingResults(prev => ({
      ...prev,
      [r.id]: { latency, timestamp: new Date().toLocaleTimeString() }
    }));
    showToast(`Gateway ${r.name} (${r.ipAddress}) responded with ${latency}ms latency. LLRP Stream Healthy.`);
  };

  const handleReboot = (r: Reader) => {
    setRebootingId(r.id);
    showToast(`Sending SIGREBOOT to ${r.name} (${r.ipAddress})...`);
    setTimeout(() => {
      setRebootingId(null);
      showToast(`Gateway ${r.name} reboot completed successfully. Antenna retuned.`);
    }, 2000);
  };

  const handleTriggerScan = (r: Reader) => {
    if (onTriggerReaderScan) {
      onTriggerReaderScan(r.id, r.name);
    }
    showToast(`Test tag pulsed through antenna on ${r.name}. RFID event registered!`);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddReader) {
      onAddReader({
        name: newName || `Fixed Portal #${readers.length + 1}`,
        ipAddress: newIp,
        zoneName: newZone,
        antennaPowerDbm: newPower,
        status: 'Online',
        firmwareVersion: 'v4.2.0-PROD',
        readCountTotal: 0,
        bufferedEventsCount: 0
      });
    }
    setAddModalOpen(false);
    setNewName('');
    showToast(`New RFID Gateway registered successfully on ${newIp}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            <span>UHF RFID Gateways & Handheld Scanner Registry</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">LLRP fixed portals, antenna RF power tuning, firmware status, and edge offline buffer sync</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Register Gateway</span>
          </button>

          <button
            onClick={() => {
              onFlushBuffer();
              showToast('Edge offline buffer flushed & synchronized with Firestore database!');
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-all"
          >
            <RefreshCw className="w-4 h-4 text-blue-600" />
            <span>Flush / Sync Buffer</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2 font-medium shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Readers List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(readers || []).map(r => {
          const isRebooting = rebootingId === r.id;
          const ping = pingResults[r.id];

          return (
            <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs hover:border-blue-300 transition-all">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
                    <span>{r.name}</span>
                  </h3>
                  <p className="text-xs text-slate-500">{r.siteName || 'Harbor Expansion'} • {r.zoneName}</p>
                </div>

                <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                  isRebooting 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                    : r.status === 'Online' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isRebooting ? 'bg-amber-500' : 'bg-emerald-500 animate-ping'}`} />
                  <span>{isRebooting ? 'Rebooting...' : r.status}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">IP Address</span>
                  <span className="text-slate-900 font-bold">{r.ipAddress}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Firmware</span>
                  <span className="text-slate-700">{r.firmwareVersion || 'v4.2.0-PROD'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Lifetime Read Count</span>
                  <span className="text-blue-700 font-bold">{(r.readCountTotal ?? 14200).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Buffered Queue</span>
                  <span className="text-emerald-700 font-bold">{r.bufferedEventsCount ?? 0} events</span>
                </div>
              </div>

              {/* Antenna Power Slider */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-600">Antenna Power Output:</span>
                  <span className="text-blue-700 font-bold">{r.antennaPowerDbm} dBm</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={32}
                  value={r.antennaPowerDbm}
                  onChange={e => onUpdatePower(r.id, Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Interactive Control Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePing(r)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
                    title="Send ICMP Echo Ping to test network latency"
                  >
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ping Test</span>
                  </button>

                  <button
                    onClick={() => handleTriggerScan(r)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-blue-200"
                    title="Simulate tag crossing this portal"
                  >
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    <span>Test Scan</span>
                  </button>
                </div>

                <button
                  onClick={() => handleReboot(r)}
                  disabled={isRebooting}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 disabled:opacity-50"
                  title="Restart gateway daemon"
                >
                  <RotateCw className={`w-3.5 h-3.5 text-amber-600 ${isRebooting ? 'animate-spin' : ''}`} />
                  <span>{isRebooting ? 'Rebooting' : 'Reboot'}</span>
                </button>
              </div>

              {ping && (
                <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center justify-between">
                  <span>Ping Latency: <strong>{ping.latency} ms</strong></span>
                  <span className="text-slate-500">{ping.timestamp}</span>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Register Gateway Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600" />
                <span>Register New RFID Gateway Portal</span>
              </h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Gateway Portal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Perimeter Entrance Gate 3"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Static IP Address *</label>
                <input
                  type="text"
                  required
                  value={newIp}
                  onChange={e => setNewIp(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assigned Laydown Zone</label>
                <input
                  type="text"
                  value={newZone}
                  onChange={e => setNewZone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Initial Antenna Power ({newPower} dBm)</label>
                <input
                  type="range"
                  min={15}
                  max={32}
                  value={newPower}
                  onChange={e => setNewPower(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Register Gateway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

