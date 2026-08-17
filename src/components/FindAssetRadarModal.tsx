import React, { useState, useEffect } from 'react';
import { X, Radio, Volume2, VolumeX, MapPin, Signal, ShieldCheck, RefreshCw } from 'lucide-react';
import { Asset } from '../types';

interface FindAssetRadarModalProps {
  asset: Asset | null;
  onClose: () => void;
}

export const FindAssetRadarModal: React.FC<FindAssetRadarModalProps> = ({
  asset,
  onClose
}) => {
  const [rssi, setRssi] = useState(asset?.rssi || -48);
  const [isScanning, setIsScanning] = useState(true);
  const [soundMuted, setSoundMuted] = useState(false);

  useEffect(() => {
    if (asset?.rssi) {
      setRssi(asset.rssi);
    }
  }, [asset]);

  // Pulse simulated RSSI variance when handheld scanner sweeps
  useEffect(() => {
    if (!isScanning || !asset) return;
    const timer = setInterval(() => {
      setRssi(prev => {
        const delta = Math.floor(Math.random() * 7) - 3;
        const next = Math.min(-30, Math.max(-80, prev + delta));
        return next;
      });
    }, 1200);
    return () => clearInterval(timer);
  }, [isScanning, asset]);

  if (!asset) return null;

  // Calculate distance & signal percentage based on RSSI dBm
  // dBm ranges from -30 (very close < 1m) to -85 (far / edge of read range ~10m)
  const signalPercent = Math.min(100, Math.max(5, Math.round(((rssi + 85) / 55) * 100)));
  const estimatedDistanceMeters = ((100 - signalPercent) / 10).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Handheld RSSI Proximity Finder</h2>
              <p className="text-xs text-slate-400">860–960 MHz Directional UHF Signal Meter</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Radar & Signal Gauge */}
        <div className="p-6 text-center space-y-6">
          
          {/* Target Info */}
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center gap-3 text-left">
            <img src={asset.photoUrl} className="w-12 h-12 rounded-lg object-cover border border-amber-500/30" />
            <div className="flex-1">
              <h3 className="font-bold text-white text-sm">{asset.name}</h3>
              <p className="text-xs font-mono text-amber-400 font-bold">Tag EPC: {asset.tagEpc}</p>
              <p className="text-[11px] text-slate-400">Last Zone: {asset.zoneName} ({asset.siteName})</p>
            </div>
          </div>

          {/* Animated Radar Pulse Visualizer */}
          <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
            
            {/* Concentric Radar Rings */}
            <div className="absolute inset-0 rounded-full border border-amber-500/20" />
            <div className="absolute inset-6 rounded-full border border-amber-500/30" />
            <div className="absolute inset-12 rounded-full border border-amber-500/40" />
            <div className="absolute inset-20 rounded-full border border-amber-500/60" />

            {/* Sweep Beam */}
            {isScanning && (
              <div className="absolute inset-0 rounded-full border-2 border-amber-500/60 animate-ping opacity-20" />
            )}

            {/* Signal Indicator Core */}
            <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all ${
              signalPercent > 70 
                ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300' 
                : signalPercent > 40 
                ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300' 
                : 'bg-red-500/20 border-2 border-red-400 text-red-300'
            }`}>
              <span className="text-2xl font-black font-mono">{rssi}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">dBm RSSI</span>
            </div>

          </div>

          {/* Signal Bar & Distance Estimate */}
          <div className="space-y-2 max-w-xs mx-auto">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-slate-400">Signal Strength:</span>
              <span className="text-amber-400">{signalPercent}%</span>
            </div>

            <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  signalPercent > 70 ? 'bg-emerald-400' : signalPercent > 40 ? 'bg-amber-400' : 'bg-red-500'
                }`}
                style={{ width: `${signalPercent}%` }}
              />
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-300 border-t border-slate-800">
              <span>Estimated Proximity:</span>
              <span className="font-mono font-bold text-white text-sm">~{estimatedDistanceMeters} meters away</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsScanning(!isScanning)}
              className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 ${
                isScanning ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Active Reader Sweep' : 'Resume Sweep'}</span>
            </button>

            <button
              onClick={() => setSoundMuted(!soundMuted)}
              className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
              title="Toggle Audio Beep"
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
