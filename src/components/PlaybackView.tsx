import React, { useState } from 'react';
import { History, Play, Pause, RotateCcw, MapPin, Radio, ShieldCheck, Clock, Layers } from 'lucide-react';
import { Asset } from '../types';

interface PlaybackViewProps {
  assets: Asset[];
}

export const PlaybackView: React.FC<PlaybackViewProps> = ({ assets }) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>((assets || [])[0]?.id || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const selectedAsset = (assets || []).find(a => a.id === selectedAssetId) || (assets || [])[0];

  const mockTrajectory = [
    { step: 1, time: '08:15 AM', zone: 'Central Warehouse Yard B', reader: 'Impinj R700 Portal West', rssi: -62, status: 'In Zone', lat: 37.7749, lng: -122.4194 },
    { step: 2, time: '10:30 AM', zone: 'Gate 2 Loading Bay', reader: 'Handheld UHF Scanner #104', rssi: -42, status: 'In Transit', lat: 37.7758, lng: -122.4182 },
    { step: 3, time: '01:45 PM', zone: 'Main Tower Construction Site', reader: 'Overhead Antenna Array A1', rssi: -48, status: 'In Zone', lat: 37.7765, lng: -122.4170 },
    { step: 4, time: '03:20 PM', zone: selectedAsset?.zoneName || 'Active Laydown Area', reader: 'Gate Portal Gateway', rssi: selectedAsset?.rssi || -50, status: selectedAsset?.status || 'In Zone', lat: 37.7770, lng: -122.4162 }
  ];

  React.useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= mockTrajectory.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>RFID Tag Spatiotemporal Movement Playback</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Historical breadcrumb trajectory replay for security audit, geofence breaches, and loss investigation</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAssetId}
            onChange={(e) => {
              setSelectedAssetId(e.target.value);
              setCurrentStep(0);
              setIsPlaying(false);
            }}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 font-medium focus:ring-2 focus:ring-blue-500"
          >
            {(assets || []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.tagEpc ? (a.tagEpc.length > 8 ? a.tagEpc.slice(-8) : a.tagEpc) : 'N/A'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Playback Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Map & Step Visualizer */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-6 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono text-blue-400 font-semibold block">TRACKED RFID TAG</span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>{selectedAsset?.name}</span>
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">EPC: {selectedAsset?.tagEpc}</p>
            </div>

            <span className="px-3 py-1 bg-blue-900/60 border border-blue-500/40 text-blue-300 font-mono text-xs rounded-full font-bold">
              Step {currentStep + 1} of {mockTrajectory.length}
            </span>
          </div>

          {/* Interactive Trajectory Route Visualization */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-6 relative min-h-[220px] flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative z-10">
              {mockTrajectory.map((tr, idx) => {
                const isActive = idx === currentStep;
                const isPassed = idx <= currentStep;
                return (
                  <div
                    key={tr.step}
                    onClick={() => {
                      setCurrentStep(idx);
                      setIsPlaying(false);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600/30 border-blue-500 text-white shadow-lg ring-2 ring-blue-500/50'
                        : isPassed
                        ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1">
                      <span>STEP {tr.step}</span>
                      <span>{tr.time}</span>
                    </div>
                    <div className="font-bold text-xs truncate">{tr.zone}</div>
                    <div className="text-[10px] font-mono text-slate-400 truncate mt-1 flex items-center gap-1">
                      <Radio className="w-3 h-3 text-blue-400" />
                      <span>{tr.reader}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current Active Step Details */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs font-mono gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 font-bold">Current Location:</span>
                <span className="text-emerald-400">{mockTrajectory[currentStep]?.zone}</span>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <span>Signal RSSI: <strong className="text-blue-400">{mockTrajectory[currentStep]?.rssi} dBm</strong></span>
                <span>Latitude: <strong className="text-slate-200">{mockTrajectory[currentStep]?.lat}</strong></span>
              </div>
            </div>
          </div>

          {/* Scrubber Controls */}
          <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pause' : 'Play Trajectory'}</span>
            </button>

            <button
              onClick={() => {
                setCurrentStep(0);
                setIsPlaying(false);
              }}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>

            <input
              type="range"
              min={0}
              max={mockTrajectory.length - 1}
              value={currentStep}
              onChange={(e) => {
                setCurrentStep(Number(e.target.value));
                setIsPlaying(false);
              }}
              className="flex-1 accent-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Right Info Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Spatiotemporal History Summary</span>
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">First Recorded Scan</span>
              <span className="text-slate-900 font-bold">Today, 08:15 AM</span>
              <p className="text-[11px] font-sans text-slate-600">Central Warehouse Yard B Portal</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Total Zones Crossed</span>
              <span className="text-blue-700 font-bold">4 Strategic Gateways</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Security Status</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Geofence Compliant Trajectory</span>
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
