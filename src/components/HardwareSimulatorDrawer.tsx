import React from 'react';
import { X, Radio, Wifi, WifiOff, ShieldAlert, Play, RefreshCw, CheckCircle2 } from 'lucide-react';
import { simulateScan, toggleHardwareStream } from '../services/api';

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
  if (!isOpen) return null;

  const handleToggleStream = async () => {
    await toggleHardwareStream();
    onRefreshAll();
  };

  const handleToggleOfflineMode = async () => {
    await toggleHardwareStream(!offlineMode);
    onRefreshAll();
  };

  const handleTriggerGateBreach = async () => {
    // EPC ast-109 exiting gate without checkout
    await simulateScan('E2801191A000001000000109', 'reader-101', -38);
    onRefreshAll();
  };

  const handleTriggerValidGateScan = async () => {
    // EPC ast-101 in yard
    await simulateScan('E2801191A000001000000101', 'reader-102', -44);
    onRefreshAll();
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl p-6 overflow-y-auto space-y-6 text-xs text-slate-200">
      
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
          <h3 className="font-bold text-white text-base font-mono">RFID Real-Time Stream Middleware</h3>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        
        {/* Stream Toggle */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 font-mono text-[11px] uppercase tracking-wider">Background Real-Time Pulse</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isStreaming ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60' : 'bg-slate-800 text-slate-400'}`}>
              {isStreaming ? 'STREAMING ACTIVE' : 'PAUSED'}
            </span>
          </div>

          <button
            onClick={handleToggleStream}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-sm"
          >
            {isStreaming ? 'Pause Background Reader Pulse' : 'Resume Background Real-Time Stream'}
          </button>
        </div>

        {/* Offline Edge Buffer Toggle */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-200 block font-mono text-[11px] uppercase tracking-wider">Offline Site Edge Buffer</span>
              <span className="text-[10px] text-slate-400">Buffers RFID reads locally when site internet drops</span>
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
            {offlineMode ? 'Disable Offline Mode (Flush & Sync)' : 'Enable Offline Site Buffer'}
          </button>
        </div>

        {/* Instant Hardware Event Triggers */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] font-mono block">Real-Time RFID Tag Scanners</span>

          <button
            onClick={handleTriggerGateBreach}
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-red-950/50"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Simulate Gate 1 Unauthorized Tag Exit</span>
          </button>

          <button
            onClick={handleTriggerValidGateScan}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simulate Real-Time Tag Read Pulse</span>
          </button>
        </div>

      </div>

    </div>
  );
};
