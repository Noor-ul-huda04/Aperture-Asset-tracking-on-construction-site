import React, { useState } from 'react';
import { MapPin, Radio, Layers, Search, Eye, ShieldAlert, Cpu, Activity, Building2, QrCode } from 'lucide-react';
import { Asset, Site, Reader, Zone } from '../types';

interface LiveTrackingMapViewProps {
  assets: Asset[];
  sites: Site[];
  readers: Reader[];
  selectedSiteId: string;
  onSelectSite: (id: string) => void;
  onOpenAssetDetail: (asset: Asset) => void;
  onFindRadar: (asset: Asset) => void;
  onOpenQrModal?: (asset: Asset) => void;
  onRefreshData?: () => Promise<any> | void;
}

export const LiveTrackingMapView: React.FC<LiveTrackingMapViewProps> = ({
  assets,
  sites,
  readers,
  selectedSiteId,
  onSelectSite,
  onOpenAssetDetail,
  onFindRadar,
  onOpenQrModal
}) => {
  const currentSite = (sites || []).find(s => s.id === selectedSiteId) || (sites || [])[0];
  const siteAssets = (assets || []).filter(a => selectedSiteId === 'ALL' || (currentSite && a.siteId === currentSite.id));
  const siteReaders = (readers || []).filter(r => selectedSiteId === 'ALL' || (currentSite && r.siteId === currentSite.id));

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<boolean>(false);
  const [filterSearch, setFilterSearch] = useState<string>('');

  const currentZones = currentSite?.zones || [];
  const activeZone = currentZones.find(z => z.id === selectedZoneId) || currentZones[0];
  const activeZoneAssets = siteAssets.filter(a => a.zoneId === activeZone?.id);

  return (
    <div className="space-y-5">
      
      {/* Top Header & Map Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div>
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-600" />
            <span>Real-Time Site Map & Zone Tracking</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Live fixed reader zone triggers, tag density, and RFID reader health</p>
        </div>

        <div className="flex items-center gap-3">
          
          <button
            onClick={() => setHeatmapMode(!heatmapMode)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
              heatmapMode 
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs' 
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Density Heatmap Mode</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <Building2 className="w-4 h-4 text-amber-600" />
            <select
              value={currentSite?.id || ''}
              onChange={(e) => onSelectSite(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer"
            >
              {(sites || []).map(s => (
                <option key={s.id} value={s.id} className="bg-white text-slate-900">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Main Map & Zone Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 2D Schematic Construction Site Layout Canvas */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 relative min-h-[480px] flex flex-col justify-between overflow-hidden shadow-xs">
          
          <div className="flex items-center justify-between z-10 mb-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-800 uppercase tracking-widest bg-amber-50 border border-amber-200 px-2.5 py-1 rounded">
                {currentSite?.name || 'All Job Sites'} ({currentSite?.code || 'ALL'})
              </span>
              <span className="text-xs text-slate-500">{siteAssets.length} Assets Tagged</span>
            </div>
            
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Portal Online</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Active Tag</span>
              </span>
            </div>
          </div>

          {/* Site Schematic Zones Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {currentZones.map(zone => {
              const zoneAssetList = siteAssets.filter(a => a.zoneId === zone.id);
              const zoneReaders = siteReaders.filter(r => r.zoneId === zone.id);
              const isSelected = activeZone?.id === zone.id;

              return (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`relative p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-50/40 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  } ${
                    heatmapMode && zoneAssetList.length > 10 ? 'bg-amber-100/80 border-amber-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                      <h3 className="font-bold text-slate-900 text-sm">{zone.name}</h3>
                    </div>
                    <span className="font-mono text-xs font-bold bg-white text-amber-800 px-2 py-0.5 rounded border border-slate-200">
                      {zoneAssetList.length} Assets
                    </span>
                  </div>

                  {/* Readers in zone */}
                  <div className="py-3 space-y-1.5">
                    {zoneReaders.map(r => (
                      <div key={r.id} className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                        <Cpu className="w-3 h-3 text-emerald-600" />
                        <span className="truncate">{r.name}</span>
                        <span className="text-emerald-700 font-bold ml-auto">ONLINE</span>
                      </div>
                    ))}
                  </div>

                  {/* Asset Tag Dot Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200">
                    {(zoneAssetList || []).slice(0, 6).map(ast => (
                      <span
                        key={ast.id}
                        onClick={(e) => { e.stopPropagation(); onOpenAssetDetail(ast); }}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 font-semibold cursor-pointer transition-transform hover:scale-105 ${
                          ast.status === 'Missing' ? 'bg-red-600 text-white animate-pulse' : 'bg-white text-amber-900 border border-slate-200 shadow-2xs'
                        }`}
                        title={ast.name}
                      >
                        <Radio className="w-2.5 h-2.5 text-amber-600" />
                        <span>{ast.name ? ast.name.split(' ')[0] : 'Asset'}</span>
                      </span>
                    ))}
                    {(zoneAssetList || []).length > 6 && (
                      <span className="text-[10px] text-slate-400 font-mono self-center">
                        +{zoneAssetList.length - 6} more
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* Selected Zone Assets Inspector Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-[480px] shadow-xs">
          
          <div className="border-b border-slate-100 pb-3 mb-3">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeZone?.color || '#3b82f6' }} />
              <span>{activeZone?.name || 'Selected Zone'}</span>
            </h3>
            <p className="text-xs text-slate-500">Inspecting {activeZoneAssets.length} active tagged items in zone</p>
          </div>

          {/* Search inside zone */}
          <div className="mb-3">
            <input
              type="text"
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              placeholder="Search assets in zone..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {activeZoneAssets.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No assets present in this zone.</p>
            ) : (
              activeZoneAssets
                .filter(a => (a.name || '').toLowerCase().includes(filterSearch.toLowerCase()))
                .map(ast => (
                  <div
                    key={ast.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{ast.name}</span>
                      <span className="text-[10px] font-mono text-amber-700 font-bold">{ast.rssi} dBm</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>EPC: {ast.tagEpc ? (ast.tagEpc.length > 8 ? ast.tagEpc.slice(-8) : ast.tagEpc) : 'N/A'}</span>
                      <span className="text-emerald-700 font-bold">${ast.cost}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                      {onOpenQrModal && (
                        <button
                          onClick={() => onOpenQrModal(ast)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded transition-colors"
                          title="Generate QR Code & Secure View"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onFindRadar(ast)}
                        className="flex-1 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Radio className="w-3 h-3" />
                        <span>Radar Finder</span>
                      </button>
                      <button
                        onClick={() => onOpenAssetDetail(ast)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded font-semibold border border-slate-200"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>

        </div>

      </div>

    </div>
  );

};
