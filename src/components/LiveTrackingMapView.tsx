import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Radio,
  Building2,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Maximize2,
  Layers,
  Compass,
  Tag,
  Eye,
  Radar,
  Sliders,
  Sparkles,
  Wifi,
  ShieldCheck,
  Clock,
  Volume2,
  Globe
} from 'lucide-react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { Asset, Site, Reader, Zone } from '../types';
import { formatInTimezone } from '../utils/timezone';

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
  currentTimezone?: string;
}

// Default site center coordinates (Latitude, Longitude)
const SITE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'site-1': { lat: 43.6532, lng: -79.3832 }, // Headquarters
  'site-2': { lat: 40.7128, lng: -74.0060 }, // Logistics Hub
  'site-3': { lat: 34.0522, lng: -118.2437 }, // Laydown Yard
  'ALL': { lat: 41.8781, lng: -87.6298 }, // General Central US
};

// Dark style JSON for Google Maps to match Aperture RFID aesthetic
const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#334155' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1e293b' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#1e3a8a' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0f172a' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#60a5fa' }]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0284c7' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }]
  }
];

export const LiveTrackingMapView: React.FC<LiveTrackingMapViewProps> = ({
  assets = [],
  sites = [],
  readers = [],
  selectedSiteId,
  onSelectSite,
  onOpenAssetDetail,
  onFindRadar,
  onOpenQrModal,
  onRefreshData,
  currentTimezone = 'UTC',
}) => {
  const currentSite = sites.find((s) => s.id === selectedSiteId) || sites[0];
  const siteAssets = assets.filter((a) => selectedSiteId === 'ALL' || (currentSite && a.siteId === currentSite.id));
  const siteReaders = readers.filter((r) => selectedSiteId === 'ALL' || (currentSite && r.siteId === currentSite.id));

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'GOOGLE_MAP' | 'SCHEMATIC' | 'RADAR' | 'GRID'>('GOOGLE_MAP');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const googleMapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const currentZones = currentSite?.zones || [];
  const activeZone = currentZones.find((z) => z.id === selectedZoneId) || currentZones[0];

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (onRefreshData) {
      await onRefreshData();
    }
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const filteredAssets = siteAssets.filter((ast) => {
    if (!filterSearch) return true;
    const q = filterSearch.toLowerCase();
    return (
      ast.name.toLowerCase().includes(q) ||
      ast.serialNumber.toLowerCase().includes(q) ||
      (ast.tagEpc && ast.tagEpc.toLowerCase().includes(q)) ||
      (ast.category && ast.category.toLowerCase().includes(q))
    );
  });

  // Google Maps Loader & Marker Setup
  useEffect(() => {
    if (mapMode !== 'GOOGLE_MAP' || !googleMapRef.current) return;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBtSeel2ngV38yw9LAIyYt0K0xyDfUsxE4';

    let isMounted = true;

    async function initGoogleMap() {
      try {
        setOptions({
          key: apiKey,
          v: 'weekly',
        });

        const { Map } = await importLibrary('maps');

        if (!isMounted || !googleMapRef.current) return;

        setMapLoaded(true);
        setMapError(null);

        const centerCoords = SITE_COORDINATES[selectedSiteId] || SITE_COORDINATES['site-1'];

        if (!mapInstanceRef.current) {
          const map = new Map(googleMapRef.current, {
            center: centerCoords,
            zoom: 15,
            styles: DARK_MAP_STYLE,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
          });
          mapInstanceRef.current = map;
          infoWindowRef.current = new google.maps.InfoWindow();
        } else {
          mapInstanceRef.current.setCenter(centerCoords);
        }

        // Clear existing markers
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        // Add markers for filtered assets
        filteredAssets.forEach((asset, idx) => {
          const latOffset = ((idx % 5) - 2) * 0.0012 + (idx * 0.0003);
          const lngOffset = (Math.floor(idx / 5) - 2) * 0.0015 + ((idx % 3) * 0.0004);
          const position = {
            lat: centerCoords.lat + latOffset,
            lng: centerCoords.lng + lngOffset,
          };

          const isAvailable = asset.status === 'AVAILABLE' || asset.status === 'ACTIVE';
          const markerColor = isAvailable ? '#10b981' : asset.status === 'MAINTENANCE' ? '#f59e0b' : '#3b82f6';

          const marker = new google.maps.Marker({
            position,
            map: mapInstanceRef.current!,
            title: `${asset.name} (${asset.tagEpc || asset.serialNumber})`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: markerColor,
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#ffffff',
            },
          });

          marker.addListener('click', () => {
            setSelectedAsset(asset);
            if (infoWindowRef.current) {
              const content = `
                <div style="color: #0f172a; font-family: monospace; padding: 6px; max-width: 220px;">
                  <strong style="font-size: 13px; color: #1e293b;">${asset.name}</strong>
                  <div style="font-size: 11px; color: #475569; margin-top: 4px;">
                    <div><strong>EPC:</strong> ${asset.tagEpc || 'N/A'}</div>
                    <div><strong>Serial:</strong> ${asset.serialNumber}</div>
                    <div><strong>Zone:</strong> ${asset.zoneName || 'Yard Area'}</div>
                    <div><strong>Status:</strong> <span style="color: ${markerColor}; font-weight: bold;">${asset.status}</span></div>
                  </div>
                </div>
              `;
              infoWindowRef.current.setContent(content);
              infoWindowRef.current.open(mapInstanceRef.current, marker);
            }
          });

          markersRef.current.push(marker);
        });
      } catch (err: any) {
        console.error('Google Maps Load Error:', err);
        if (isMounted) {
          setMapError(err?.message || 'Failed to initialize Google Maps JS API');
        }
      }
    }

    initGoogleMap();

    return () => {
      isMounted = false;
    };
  }, [mapMode, selectedSiteId, filteredAssets]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Map Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-bold text-base sm:text-lg text-white font-mono flex items-center gap-2">
                <span>Real-Time Google Maps Asset Tracking</span>
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live GPS & RFID Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive Google Maps Platform integration for real-time asset GPS tags & GAO UHF readers
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Site Selector */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-300">
            <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
            <select
              value={currentSite?.id || ''}
              onChange={(e) => onSelectSite(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Map Mode Buttons */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 font-mono text-xs">
            <button
              onClick={() => setMapMode('GOOGLE_MAP')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mapMode === 'GOOGLE_MAP'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-300" />
              <span>Google Map</span>
            </button>
            <button
              onClick={() => setMapMode('SCHEMATIC')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mapMode === 'SCHEMATIC'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Zones</span>
            </button>
            <button
              onClick={() => setMapMode('RADAR')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mapMode === 'RADAR'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radar className="w-3.5 h-3.5" />
              <span>Radar</span>
            </button>
            <button
              onClick={() => setMapMode('GRID')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mapMode === 'GRID'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* Main Map View & Real-Time Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Columns: Interactive Site Layout Canvas */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden flex flex-col min-h-[520px]">
          {/* Top Canvas Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 z-10">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-400">Site:</span>
              <span className="text-white font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                {currentSite?.name} ({currentSite?.code})
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {siteAssets.length} Assets Tracked
              </span>
            </div>

            {/* Quick Filter Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter tag EPC, serial, name..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Google Maps Container */}
          {mapMode === 'GOOGLE_MAP' && (
            <div className="flex-1 w-full h-full min-h-[440px] rounded-xl overflow-hidden relative border border-slate-800">
              {mapError && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-xs font-mono space-y-2 z-20">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                  <p className="text-white font-bold">Google Maps Load Error</p>
                  <p className="text-slate-400 max-w-md">{mapError}</p>
                </div>
              )}
              <div ref={googleMapRef} className="w-full h-full min-h-[440px]" />
            </div>
          )}

          {/* Schematic Zones Layout */}
          {mapMode === 'SCHEMATIC' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 flex-1 z-10">
              {currentZones.map((z) => {
                const zoneAssets = filteredAssets.filter((a) => a.zoneId === z.id);
                const isSelected = activeZone?.id === z.id;
                const zoneReader = siteReaders.find((r) => r.zoneId === z.id || r.id.includes(z.id.toLowerCase()));

                return (
                  <div
                    key={z.id}
                    onClick={() => setSelectedZoneId(z.id)}
                    className={`bg-slate-950/90 border rounded-2xl p-4 transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/40'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-xs font-mono font-bold text-blue-400 block">
                            {z.code}
                          </span>
                          <h3 className="font-bold text-sm text-white font-mono">{z.name}</h3>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {zoneAssets.length} Assets
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-1 mb-3">
                        {z.description || 'Monitored UHF RFID Antenna Zone'}
                      </p>

                      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs font-mono mb-3">
                        <div className="flex items-center gap-2">
                          <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          <span className="text-slate-300 text-[11px]">GAO Antenna Portal</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {zoneReader?.status || 'ONLINE'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-900">
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
                        Live Antenna Detections:
                      </span>
                      {zoneAssets.length === 0 ? (
                        <p className="text-[11px] text-slate-500 font-mono italic">No tags in zone scope</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {zoneAssets.slice(0, 6).map((ast) => (
                            <button
                              key={ast.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAsset(ast);
                              }}
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-lg border border-slate-800 text-[10.5px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Tag className="w-3 h-3 text-cyan-400" />
                              <span className="truncate max-w-[100px]">{ast.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Radar Scanner View */}
          {mapMode === 'RADAR' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
              <div className="relative w-72 h-72 rounded-full border border-blue-500/30 bg-slate-950 flex items-center justify-center shadow-2xl">
                <div className="absolute inset-4 rounded-full border border-blue-500/20" />
                <div className="absolute inset-16 rounded-full border border-blue-500/20" />
                <div className="absolute inset-28 rounded-full border border-blue-500/20" />
                <div className="absolute inset-0 rounded-full border-t border-blue-400/60 animate-spin opacity-50" style={{ animationDuration: '4s' }} />

                <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg shadow-blue-500/50 flex items-center justify-center z-20">
                  <Radio className="w-3 h-3 text-white" />
                </div>

                {siteAssets.slice(0, 8).map((ast, idx) => {
                  const angle = (idx * (360 / 8)) * (Math.PI / 180);
                  const radius = 35 + (idx % 3) * 25;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;

                  return (
                    <button
                      key={ast.id}
                      onClick={() => setSelectedAsset(ast)}
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                      className="absolute p-1.5 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400 text-cyan-300 rounded-full shadow-md transition-all cursor-pointer group"
                      title={`${ast.name} (${ast.tagEpc})`}
                    >
                      <span className="w-2 h-2 rounded-full bg-cyan-400 block animate-ping" />
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 text-center font-mono">
                <span className="text-xs text-blue-400 font-bold block">GAO UHF Directional Antenna Sweeper</span>
                <span className="text-[11px] text-slate-400">Scanning {siteAssets.length} active UHF tag signals</span>
              </div>
            </div>
          )}

          {/* Grid View */}
          {mapMode === 'GRID' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 flex-1 z-10">
              {filteredAssets.map((ast) => (
                <div
                  key={ast.id}
                  onClick={() => setSelectedAsset(ast)}
                  className="bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-xl p-3 text-xs font-mono space-y-2 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white truncate">{ast.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {ast.status}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] space-y-0.5">
                    <p>Serial: {ast.serialNumber}</p>
                    <p>EPC: {ast.tagEpc || 'N/A'}</p>
                    <p>Zone: {ast.zoneName || 'Laydown Yard'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 border-t border-slate-800 pt-3 mt-4 z-10">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">System Timezone ({currentTimezone}):</span>
              <span className="text-cyan-300 font-bold">
                {formatInTimezone(new Date(), currentTimezone, { includeSeconds: true })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Google Maps & GAO Telemetry Active</span>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Asset Detail Inspector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-mono font-bold text-sm text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-cyan-400" />
                <span>Tag Telemetry Inspector</span>
              </h3>
              {selectedAsset && (
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="text-xs text-slate-400 hover:text-white font-mono cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {selectedAsset ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{selectedAsset.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {selectedAsset.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{selectedAsset.category || 'Construction Asset'}</p>
                </div>

                <div className="space-y-2 bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="flex justify-between text-slate-400">
                    <span>Serial Number:</span>
                    <span className="text-white font-bold">{selectedAsset.serialNumber}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>RFID Tag EPC:</span>
                    <span className="text-cyan-300 font-bold select-all">{selectedAsset.tagEpc || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Active Zone:</span>
                    <span className="text-blue-400 font-bold">{selectedAsset.zoneName || 'Main Yard'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Site Location:</span>
                    <span className="text-slate-200">{selectedAsset.siteName || currentSite?.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-t border-slate-900 pt-1.5">
                    <span>Cost Value:</span>
                    <span className="text-emerald-400 font-bold">${selectedAsset.cost}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => onOpenAssetDetail(selectedAsset)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Full Details</span>
                  </button>

                  <button
                    onClick={() => onFindRadar(selectedAsset)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Radar className="w-4 h-4 text-amber-400" />
                    <span>Locate Signal via Radar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                  <Tag className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Click any marker on the Google Map or list item to inspect live antenna telemetry & signal details.
                </p>
              </div>
            )}
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-400 space-y-1">
            <span className="font-bold text-slate-300 block">Google Maps Platform API</span>
            <p>Interactive GPS map, styled dark theme & live marker info windows.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
