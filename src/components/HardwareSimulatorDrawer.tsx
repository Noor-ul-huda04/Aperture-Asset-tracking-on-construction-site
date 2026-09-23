import React, { useState } from 'react';
import { X, Radio, Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, Activity, Server, Cpu } from 'lucide-react';
import { toggleHardwareStream } from '../services/api';

interface HardwareSimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isStreaming: boolean;
  offlineMode: boolean;
  onRefreshAll: () => void;
}

export const HardwareSimulatorDrawer: React.FC<HardwareSimulatorDrawerProps> = ({
  isOpen,
  onClose,
  isStreaming,
  offlineMode,
  onRefreshAll
}) => {
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ status: 'ok' | 'error'; message: string; latency?: number } | null>(null);

  if (!isOpen) return null;

  const handleToggleStream = async () => {
    await toggleHardwareStream();
    onRefreshAll();
  };

  const handleToggleOfflineMode = async () => {
    await toggleHardwareStream(!offlineMode);
    onRefreshAll();
  };

  const handleTestConnection = async () => {
    setIsPinging(true);
    setPingResult(null);
    const start = Date.now();
    try {
      const res = await fetch('/api/health');
      const latency = Date.now() - start;
      if (res.ok) {
        setPingResult({
          status: 'ok',
          message: 'Hardware Ingress Gateway reachable & ready for real telemetry.',
          latency
        });
      } else {
        setPingResult({
          status: 'error',
          message: `Gateway responded with HTTP status ${res.status}.`
        });
      }
    } catch (e: any) {
      setPingResult({
        status: 'error',
        message: e?.message || 'Unable to establish socket handshake with gateway.'
      });
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl p-6 overflow-y-auto space-y-6 text-xs text-slate-200">
      
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-bold text-white text-base">Hardware & Gateway Diagnostics</h3>
            <span className="text-[10px] text-slate-400 font-mono">Live Telematics Ingress Status</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        
        {/* Gateway Connection Status */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 font-mono text-[11px] uppercase tracking-wider">Gateway Stream Status</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isStreaming ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60' : 'bg-slate-800 text-slate-400'}`}>
              {isStreaming ? 'LISTENER ACTIVE' : 'PAUSED'}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Aperature continuously receives incoming RFID tag scans, GPS telemetry packets, and BLE advertisement beacons from authorized edge hardware.
          </p>

          <button
            onClick={handleToggleStream}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-lg transition-colors shadow-xs"
          >
            {isStreaming ? 'Pause Ingress Listener' : 'Resume Ingress Listener'}
          </button>
        </div>

        {/* Gateway Handshake Probe */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 font-mono text-[11px] uppercase tracking-wider">Gateway Probe</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>

          <p className="text-[11px] text-slate-400">
            Probe the local and external telematics ingress pipeline to verify network latency and socket readiness.
          </p>

          <button
            onClick={handleTestConnection}
            disabled={isPinging}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
            <span>{isPinging ? 'Testing Handshake...' : 'Test Gateway Handshake'}</span>
          </button>

          {pingResult && (
            <div className={`p-2.5 rounded-lg border text-[11px] ${
              pingResult.status === 'ok'
                ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-600/40 text-rose-300'
            }`}>
              <div className="flex items-center gap-1.5 font-bold mb-0.5">
                {pingResult.status === 'ok' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                <span>{pingResult.status === 'ok' ? `Connected (${pingResult.latency}ms)` : 'Connection Error'}</span>
              </div>
              <p className="text-[10px] leading-relaxed">{pingResult.message}</p>
            </div>
          )}
        </div>

        {/* Offline Edge Buffer */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-200 block font-mono text-[11px] uppercase tracking-wider">Offline Site Edge Buffer</span>
              <span className="text-[10px] text-slate-400">Buffers telemetry locally when jobsite cellular link drops</span>
            </div>
          </div>

          <button
            onClick={handleToggleOfflineMode}
            className={`w-full py-2 font-bold rounded-lg transition-all ${
              offlineMode
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {offlineMode ? 'Disable Offline Mode (Flush Buffer)' : 'Enable Offline Edge Buffer'}
          </button>
        </div>

        {/* Ingress Protocol Specifications */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-[10px]">
          <span className="font-bold text-slate-300 uppercase tracking-wider block font-sans text-xs">Supported Real Hardware Ingress</span>
          <div className="space-y-1.5 text-slate-400">
            <div className="flex justify-between border-b border-slate-850 pb-1">
              <span>UHF RFID Portals:</span>
              <span className="text-amber-400 font-bold">LLRP / GAO HTTP JSON</span>
            </div>
            <div className="flex justify-between border-b border-slate-850 pb-1">
              <span>GPS Telematics:</span>
              <span className="text-blue-400 font-bold">Webhook POST / NMEA</span>
            </div>
            <div className="flex justify-between border-b border-slate-850 pb-1">
              <span>BLE Gateways:</span>
              <span className="text-indigo-400 font-bold">iBeacon / Eddystone MQTT</span>
            </div>
            <div className="flex justify-between">
              <span>QR Scanner:</span>
              <span className="text-emerald-400 font-bold">WebRTC Camera / 2D Imager</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
