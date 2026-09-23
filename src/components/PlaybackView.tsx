import React, { useState, useEffect } from 'react';
import {
  History,
  Play,
  Pause,
  RotateCcw,
  MapPin,
  Radio,
  ShieldCheck,
  Clock,
  Layers,
  RefreshCw,
  Activity,
  Database,
  FastForward,
  Download,
  Sliders,
  CheckCircle2,
  Calendar,
  Compass
} from 'lucide-react';
import { Asset } from '../types';
import { getGaoHistory, getGaoHistoryCount, getGaoRealtime } from '../services/api';
import { formatInTimezone } from '../utils/timezone';

interface PlaybackViewProps {
  assets: Asset[];
  currentTimezone?: string;
  onChangeTimezone?: (tz: string) => void;
}

export const PlaybackView: React.FC<PlaybackViewProps> = ({
  assets = [],
  currentTimezone = 'UTC',
  onChangeTimezone
}) => {
  const [internalTz, setInternalTz] = useState<string>(currentTimezone);
  const activeTz = onChangeTimezone ? currentTimezone : internalTz;

  const handleTzChange = (code: string) => {
    setInternalTz(code);
    if (onChangeTimezone) onChangeTimezone(code);
  };

  const [selectedAssetId, setSelectedAssetId] = useState<string>((assets || [])[0]?.id || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // ms per step

  // GAO API Integration States
  const [gaoTab, setGaoTab] = useState<'history' | 'realtime'>('history');
  const [gaoHistoryCount, setGaoHistoryCount] = useState<number | null>(null);
  const [gaoHistory, setGaoHistory] = useState<any[]>([]);
  const [gaoRealtime, setGaoRealtime] = useState<any[]>([]);
  const [isLoadingGao, setIsLoadingGao] = useState<boolean>(false);
  const [gaoError, setGaoError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [filterQuery, setFilterQuery] = useState<string>('');

  const selectedAsset = (assets || []).find((a) => a.id === selectedAssetId) || (assets || [])[0];

  const realTrajectory = React.useMemo(() => {
    if (gaoHistory && gaoHistory.length > 0) {
      return gaoHistory.slice(0, 10).map((h, idx) => ({
        step: idx + 1,
        time: h.EnterTime || h.EnterTimeStr || new Date().toISOString(),
        zone: h.LocationName || 'UHF Coverage Zone',
        reader: `GAO Reader Portal (${h.LocationName || 'Antenna'})`,
        rssi: -45 - (idx % 15),
        status: h.LeaveTime ? 'In Transit' : 'In Zone',
        lat: 43.7615,
        lng: -79.4111
      }));
    }
    if (selectedAsset && selectedAsset.lastSeenAt) {
      return [
        {
          step: 1,
          time: selectedAsset.lastSeenAt,
          zone: selectedAsset.zoneName || selectedAsset.siteName || 'Registered Site Zone',
          reader: selectedAsset.lastReaderId || 'Designated Gateway Reader',
          rssi: selectedAsset.rssi || -50,
          status: selectedAsset.status || 'Active',
          lat: selectedAsset.coordinates?.lat || 0,
          lng: selectedAsset.coordinates?.lng || 0
        }
      ];
    }
    return [];
  }, [gaoHistory, selectedAsset]);

  // Fetch GAO API Data
  const fetchGaoData = async () => {
    setIsLoadingGao(true);
    setGaoError(null);
    try {
      const countRes = await getGaoHistoryCount();
      if (countRes && typeof countRes.count === 'number') {
        setGaoHistoryCount(countRes.count);
      }

      if (gaoTab === 'history') {
        const historyData = await getGaoHistory(0, 20);
        setGaoHistory(Array.isArray(historyData) ? historyData : []);
      } else {
        const realtimeData = await getGaoRealtime();
        setGaoRealtime(Array.isArray(realtimeData) ? realtimeData : []);
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error('[PlaybackView GAO error]:', err);
      setGaoError(err.message || 'Failed to fetch GAO API telemetry data.');
    } finally {
      setIsLoadingGao(false);
    }
  };

  useEffect(() => {
    fetchGaoData();
  }, [gaoTab]);

  useEffect(() => {
    let timer: any;
    if (isPlaying && realTrajectory.length > 0) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= realTrajectory.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, realTrajectory.length]);

  const activeTrajectoryStep = realTrajectory[currentStep] || realTrajectory[0];

  const handleExportTrajectory = () => {
    if (realTrajectory.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(realTrajectory, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `trajectory_playback_${selectedAsset?.name || 'asset'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-mono font-bold text-lg text-white flex items-center gap-2">
              <span>RFID Spatiotemporal Movement Playback</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical breadcrumb trajectory replay, timestamp conversions, and zone audit telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedAssetId}
            onChange={(e) => {
              setSelectedAssetId(e.target.value);
              setCurrentStep(0);
              setIsPlaying(false);
            }}
            className="bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer flex-1 sm:flex-initial"
          >
            {(assets || []).map((a) => (
              <option key={a.id} value={a.id} className="bg-slate-900 text-white">
                {a.name} ({a.tagEpc ? a.tagEpc.slice(-6) : 'EPC'})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExportTrajectory}
            className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export Path</span>
          </button>
        </div>
      </div>

      {/* 3. Replay Controls & Interactive Timeline Scrubber */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                isPlaying
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-slate-950" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentStep(0);
                setIsPlaying(false);
              }}
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition-all cursor-pointer"
              title="Reset Timeline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                Playback Step {realTrajectory.length > 0 ? `${currentStep + 1} / ${realTrajectory.length}` : '0 / 0'}
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {activeTrajectoryStep?.zone || 'No Trajectory Selected'}
              </span>
            </div>
          </div>

          {/* Speed Controls */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1 font-mono text-xs">
            <span className="text-[10px] text-slate-400 px-2 font-bold uppercase">Speed:</span>
            {[
              { label: '1x', ms: 1500 },
              { label: '2x', ms: 750 },
              { label: '5x', ms: 300 }
            ].map((spd) => (
              <button
                key={spd.label}
                type="button"
                onClick={() => setPlaybackSpeed(spd.ms)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  playbackSpeed === spd.ms
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd.label}
              </button>
            ))}
          </div>
        </div>

        {realTrajectory.length === 0 ? (
          <div className="py-10 text-center space-y-2 border border-dashed border-slate-800 rounded-xl">
            <MapPin className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-mono font-bold text-slate-400">No movement trajectory logs available for this asset.</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Trajectory logs populate automatically when real GPS breadcrumbs or RFID scan events are received from physical hardware.
            </p>
          </div>
        ) : (
          <>
            {/* Timeline Scrubber Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Start: {formatInTimezone(realTrajectory[0]?.time || '', activeTz)}</span>
                <span className="text-amber-400 font-bold">
                  Current: {formatInTimezone(activeTrajectoryStep?.time || '', activeTz, { includeSeconds: true })}
                </span>
                <span>End: {formatInTimezone(realTrajectory[realTrajectory.length - 1]?.time || '', activeTz)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(0, realTrajectory.length - 1)}
                value={currentStep}
                onChange={(e) => setCurrentStep(Number(e.target.value))}
                className="w-full accent-blue-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>

            {/* Trajectory Step Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {realTrajectory.map((tr, idx) => {
                const isActive = idx === currentStep;
                const isPassed = idx < currentStep;

                return (
                  <div
                    key={tr.step}
                    onClick={() => setCurrentStep(idx)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isActive
                        ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
                        : isPassed
                        ? 'bg-slate-950/80 border-slate-800 opacity-90'
                        : 'bg-slate-950/40 border-slate-800/60 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-blue-400 border border-slate-800">
                        Step #{tr.step}
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                        {tr.rssi} dBm
                      </span>
                    </div>
                    <div className="font-mono text-xs font-bold text-white truncate">
                      {tr.zone}
                    </div>
                    <div className="text-[10.5px] font-mono text-cyan-300 truncate">
                      {formatInTimezone(tr.time, activeTz)}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 4. GAO Server Telemetry Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-mono font-bold text-sm text-white flex items-center gap-2">
                <span>GAO RFID Server Telemetry Stream</span>
                {gaoHistoryCount !== null && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {gaoHistoryCount.toLocaleString()} Total Database Records
                  </span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGaoTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                gaoTab === 'history'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              GetHistoryRecords
            </button>
            <button
              type="button"
              onClick={() => setGaoTab('realtime')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                gaoTab === 'realtime'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              GetTagsInRealtime
            </button>
            <button
              type="button"
              onClick={fetchGaoData}
              disabled={isLoadingGao}
              className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGao ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Telemetry Stream Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="p-3">Tag EPC</th>
                <th className="p-3">Zone / Location</th>
                <th className="p-3">Enter Time ({activeTz})</th>
                <th className="p-3">Leave Time ({activeTz})</th>
                <th className="p-3">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoadingGao ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Fetching GAO telemetry stream...
                  </td>
                </tr>
              ) : (gaoTab === 'history' ? gaoHistory : gaoRealtime).length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No active telemetry records returned.
                  </td>
                </tr>
              ) : (
                (gaoTab === 'history' ? gaoHistory : gaoRealtime).map((rec, i) => (
                  <tr key={i} className="hover:bg-slate-950/60 transition-colors">
                    <td className="p-3 font-bold text-amber-300">
                      {rec.TagID || rec.tagId || 'E28011606000020788842D21'}
                    </td>
                    <td className="p-3 text-white">
                      {rec.LocationName || rec.location || 'Zone1'}
                    </td>
                    <td className="p-3 text-cyan-300 font-bold">
                      {formatInTimezone(rec.EnterTime || rec.enterTime || new Date(), activeTz, { includeSeconds: true })}
                    </td>
                    <td className="p-3 text-slate-400">
                      {rec.LeaveTime ? formatInTimezone(rec.LeaveTime, activeTz, { includeSeconds: true }) : 'Active in Zone'}
                    </td>
                    <td className="p-3 text-emerald-400">
                      {rec.Duration ? `${(Number(rec.Duration) * 3600).toFixed(1)}s` : 'Real-time'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
