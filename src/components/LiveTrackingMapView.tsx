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
  Globe,
  Briefcase,
  Box,
  Share2,
  Info,
  ChevronRight,
  Crosshair
} from 'lucide-react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { Asset, Site, Reader, Zone, Project, Geofence } from '../types';
import { formatInTimezone } from '../utils/timezone';

interface LiveTrackingMapViewProps {
  assets: Asset[];
  sites: Site[];
  projects?: Project[];
  geofences?: Geofence[];
  readers: Reader[];
  selectedSiteId: string;
  onSelectSite: (id: string) => void;
  onOpenAssetDetail: (asset: Asset) => void;
  onFindRadar: (asset: Asset) => void;
  onOpenQrModal?: (asset: Asset) => void;
  onRefreshData?: () => Promise<any> | void;
  currentTimezone?: string;
}

// Default site center coordinates fallback
const SITE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'site-1': { lat: 43.6532, lng: -79.3832 },
  'site-2': { lat: 40.7128, lng: -74.0060 },
  'site-3': { lat: 34.0522, lng: -118.2437 },
  'ALL': { lat: 41.8781, lng: -87.6298 },
};

// Distinct zone color theme mapping
const ZONE_COLOR_PALETTE = [
  { stroke: '#06b6d4', fill: '#0891b2', name: 'Cyan' },
  { stroke: '#10b981', fill: '#059669', name: 'Emerald' },
  { stroke: '#f59e0b', fill: '#d97706', name: 'Amber' },
  { stroke: '#8b5cf6', fill: '#7c3aed', name: 'Purple' },
  { stroke: '#ec4899', fill: '#db2777', name: 'Pink' },
  { stroke: '#3b82f6', fill: '#2563eb', name: 'Blue' },
];

// Dark style JSON for Google Maps
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

const getMarkerIcon = (category?: string) => {
  switch (category) {
    case 'Excavator':
    case 'Heavy Equipment': return '🚜';
    case 'Crane': return '🏗️';
    case 'Bulldozer': return '🚜';
    case 'Truck':
    case 'Vehicles': return '🚛';
    case 'Generator': return '⚡';
    case 'Compressor': return '💨';
    case 'Tools':
    case 'Power Tools': return '🔧';
    case 'Materials': return '🧱';
    default: return '📍';
  }
};

export const LiveTrackingMapView: React.FC<LiveTrackingMapViewProps> = ({
  assets = [],
  sites = [],
  projects = [],
  geofences = [],
  readers = [],
  selectedSiteId,
  onSelectSite,
  onOpenAssetDetail,
  onFindRadar,
  onOpenQrModal,
  onRefreshData,
  currentTimezone = 'UTC',
}) => {
  const safeSites = sites || [];
  const safeAssets = assets || [];
  const safeReaders = readers || [];
  const safeProjects = projects || [];
  const safeGeofences = geofences || [];

  // Project Filter State
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  // Filter sites by active project
  const availableSites = safeSites.filter((s) => {
    if (selectedProjectId === 'ALL') return true;
    const proj = safeProjects.find((p) => p.id === selectedProjectId);
    if (!proj) return true;
    return proj.siteIds?.includes(s.id);
  });

  const currentSite = safeSites.find((s) => s.id === selectedSiteId) || availableSites[0] || safeSites[0];
  
  // Scoped assets by site & project
  const siteAssets = safeAssets.filter((a) => {
    const matchesSite = selectedSiteId === 'ALL' || (currentSite && a.siteId === currentSite.id);
    const matchesProj = selectedProjectId === 'ALL' || a.projectId === selectedProjectId;
    return matchesSite && matchesProj;
  });

  const siteReaders = safeReaders.filter((r) => selectedSiteId === 'ALL' || (currentSite && r.siteId === currentSite.id));

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'GOOGLE_MAP' | 'OPERATIONS_MAP' | 'SCHEMATIC' | 'RADAR' | 'GRID'>('OPERATIONS_MAP');
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [dashboardMapType, setDashboardMapType] = useState<'streets' | 'satellite'>('streets');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Overlay Visibility Layer Toggles
  const [showSiteBoundary, setShowSiteBoundary] = useState<boolean>(true);
  const [showZoneOverlays, setShowZoneOverlays] = useState<boolean>(true);
  const [showReaderPortals, setShowReaderPortals] = useState<boolean>(true);
  const [showAssetRelationships, setShowAssetRelationships] = useState<boolean>(true);

  const googleMapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const siteOverlaysRef = useRef<(google.maps.Circle | google.maps.Polygon)[]>([]);
  const zoneOverlaysRef = useRef<(google.maps.Circle | google.maps.Polygon)[]>([]);
  const zoneLabelsRef = useRef<google.maps.Marker[]>([]);
  const trailPolylineRef = useRef<google.maps.Polyline | null>(null);
  const relationshipPolylineRef = useRef<google.maps.Polyline | null>(null);
  const trailMarkersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const currentZones: Zone[] = currentSite?.zones || [];
  const activeZone = currentZones.find((z) => z.id === selectedZoneId) || null;

  // Dynamic site coordinates resolver
  const getSiteCenter = (siteId: string): { lat: number; lng: number } => {
    const foundSite = safeSites.find((s) => s.id === siteId);
    if (foundSite?.coordinates && typeof foundSite.coordinates.lat === 'number') {
      return foundSite.coordinates;
    }
    if (currentSite?.coordinates && typeof currentSite.coordinates.lat === 'number') {
      return currentSite.coordinates;
    }
    if (safeSites[0]?.coordinates && typeof safeSites[0].coordinates.lat === 'number') {
      return safeSites[0].coordinates;
    }
    return { lat: 40.7128, lng: -74.0060 };
  };

  // Helper to calculate sub-zone centroid based on zone index and site coordinates
  const getZoneCentroid = (siteCenter: { lat: number; lng: number }, zoneIndex: number, totalZones: number) => {
    if (totalZones <= 1) {
      return { lat: siteCenter.lat + 0.0006, lng: siteCenter.lng + 0.0006 };
    }
    const angle = (zoneIndex / totalZones) * (2 * Math.PI) + (Math.PI / 6);
    const distance = 0.0016; // ~180 meters
    return {
      lat: siteCenter.lat + distance * Math.sin(angle),
      lng: siteCenter.lng + distance * Math.cos(angle),
    };
  };

  // Multi-vertex polygon coordinates generator for Outer Construction Site Perimeter Geofence
  const getSitePerimeterPolygonCoords = (center: { lat: number; lng: number }): { lat: number; lng: number }[] => {
    const perimeterOffsets = [
      { dLat: 0.0032, dLng: -0.0036 }, // NW Boundary Post
      { dLat: 0.0039, dLng: 0.0004 },  // North Main Access Gate
      { dLat: 0.0029, dLng: 0.0042 },  // NE Perimeter Corner
      { dLat: -0.0012, dLng: 0.0047 }, // East Materials Intake Portal
      { dLat: -0.0038, dLng: 0.0018 }, // SE Boundary
      { dLat: -0.0035, dLng: -0.0028 },// South Fence Line
      { dLat: -0.0008, dLng: -0.0045 },// SW Checkpoint
    ];
    return perimeterOffsets.map((o) => ({
      lat: center.lat + o.dLat,
      lng: center.lng + o.dLng,
    }));
  };

  // Multi-vertex polygon coordinates generator for Sub-Zone Construction Geofences
  const getZonePolygonCoords = (
    siteCenter: { lat: number; lng: number },
    zoneIndex: number,
    totalZones: number
  ): { lat: number; lng: number }[] => {
    const angle = (zoneIndex / Math.max(1, totalZones)) * (2 * Math.PI) + (Math.PI / 6);
    const dist = 0.0017;
    const cx = siteCenter.lat + dist * Math.sin(angle);
    const cy = siteCenter.lng + dist * Math.cos(angle);

    const dLat = 0.00065;
    const dLng = 0.00082;
    const rot = angle + 0.32;

    const points = [
      { x: -dLng * 0.95, y: -dLat * 0.85 },
      { x: dLng * 0.85, y: -dLat * 1.05 },
      { x: dLng * 1.05, y: dLat * 0.75 },
      { x: 0, y: dLat * 1.15 },
      { x: -dLng * 1.05, y: dLat * 0.85 },
    ];

    return points.map((p) => {
      const rotatedLng = p.x * Math.cos(rot) - p.y * Math.sin(rot);
      const rotatedLat = p.x * Math.sin(rot) + p.y * Math.cos(rot);
      return {
        lat: cx + rotatedLat,
        lng: cy + rotatedLng,
      };
    });
  };

  // Helper to generate historical breadcrumb locations for an asset
  const getAssetBreadcrumbs = (asset: Asset, center: { lat: number; lng: number }, _assetIndex: number) => {
    if (asset.gpsBreadcrumbs && asset.gpsBreadcrumbs.length > 0) {
      return asset.gpsBreadcrumbs.map((b, idx) => ({
        step: idx + 1,
        zoneName: b.zoneName || 'GPS Location',
        timestamp: formatInTimezone(new Date(b.timestamp), currentTimezone, { includeSeconds: false }),
        lat: b.lat,
        lng: b.lng,
      }));
    }
    return [];
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (onRefreshData) {
      await onRefreshData();
    }
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Filter Categories
  const categoriesList = ['ALL', ...Array.from(new Set(siteAssets.map((a) => a.category).filter(Boolean)))];

  // Filtered Assets based on search, category, and selected zone
  const filteredAssets = siteAssets.filter((asset) => {
    const matchesCategory = selectedCategory === 'ALL' || asset.category === selectedCategory;
    const matchesZone = !selectedZoneId || asset.zoneId === selectedZoneId;
    const matchesSearch =
      filterSearch.trim() === '' ||
      asset.name?.toLowerCase().includes(filterSearch.toLowerCase()) ||
      asset.serialNumber?.toLowerCase().includes(filterSearch.toLowerCase()) ||
      asset.tagEpc?.toLowerCase().includes(filterSearch.toLowerCase()) ||
      asset.zoneName?.toLowerCase().includes(filterSearch.toLowerCase());

    return matchesCategory && matchesZone && matchesSearch;
  });

  // Sync Google Map Type
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(mapType);
    }
  }, [mapType]);

  // Google Maps Loader, Construction Site Perimeter & Integrated Zone Overlays
  useEffect(() => {
    if (mapMode !== 'GOOGLE_MAP' || !googleMapRef.current) return;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBtSeel2ngV38yw9LAIyYt0K0xyDfUsxE4';
    let isMounted = true;

    // Timeout detection: if Google Maps hasn't initialized within 3.5s, surface fallback options
    const timeoutTimer = setTimeout(() => {
      if (isMounted && !mapLoaded) {
        setMapError('Google Maps API did not finish loading in this environment. Switch to Operations CAD Map for instant tracking with all pins and geofences.');
      }
    }, 3500);

    // Capture global auth failure if key has restricted domains or quota limits
    (window as any).gm_authFailure = () => {
      if (isMounted) {
        setMapError('Google Maps JS API key authorization failed or domain restricted. Switch to the Operations CAD Map.');
      }
    };

    async function initGoogleMap() {
      try {
        setOptions({
          key: apiKey,
          v: 'weekly',
        });

        const { Map } = await importLibrary('maps');

        if (!isMounted || !googleMapRef.current) return;

        clearTimeout(timeoutTimer);
        setMapLoaded(true);
        setMapError(null);

        const centerCoords = getSiteCenter(selectedSiteId);

        if (!mapInstanceRef.current) {
          const map = new Map(googleMapRef.current, {
            center: centerCoords,
            zoom: 16,
            mapTypeId: mapType,
            styles: mapType === 'hybrid' ? [] : DARK_MAP_STYLE,
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
          mapInstanceRef.current.setMapTypeId(mapType);
          mapInstanceRef.current.setOptions({ styles: mapType === 'hybrid' ? [] : DARK_MAP_STYLE });
        }

        // Clear existing markers & overlays
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
        siteOverlaysRef.current.forEach((o) => o.setMap(null));
        siteOverlaysRef.current = [];
        zoneOverlaysRef.current.forEach((z) => z.setMap(null));
        zoneOverlaysRef.current = [];
        zoneLabelsRef.current.forEach((l) => l.setMap(null));
        zoneLabelsRef.current = [];

        // 1. DRAW CONSTRUCTION SITE OUTER BOUNDARY (GEOFENCE PERIMETER POLYGONS)
        // If a project is selected with multiple sites, render polygon geofences for all project sites
        const sitesToRender = selectedProjectId !== 'ALL' && availableSites.length > 0 ? availableSites : (currentSite ? [currentSite] : []);

        if (showSiteBoundary) {
          sitesToRender.forEach((siteObj) => {
            if (!siteObj.coordinates || typeof siteObj.coordinates.lat !== 'number') return;
            const isMainSite = siteObj.id === currentSite?.id;
            const sitePolyCoords = getSitePerimeterPolygonCoords(siteObj.coordinates);

            const sitePolygon = new google.maps.Polygon({
              paths: sitePolyCoords,
              strokeColor: isMainSite ? '#38bdf8' : '#64748b',
              strokeOpacity: isMainSite ? 0.95 : 0.65,
              strokeWeight: isMainSite ? 3 : 2,
              fillColor: isMainSite ? '#0284c7' : '#475569',
              fillOpacity: isMainSite ? 0.09 : 0.04,
              map: mapInstanceRef.current!,
              clickable: true,
              zIndex: isMainSite ? 2 : 1,
            });

            // Hover feedback on Site Polygon
            sitePolygon.addListener('mouseover', () => {
              sitePolygon.setOptions({
                strokeWeight: 4,
                strokeColor: '#38bdf8',
                fillOpacity: 0.16,
              });
            });
            sitePolygon.addListener('mouseout', () => {
              sitePolygon.setOptions({
                strokeWeight: isMainSite ? 3 : 2,
                strokeColor: isMainSite ? '#38bdf8' : '#64748b',
                fillOpacity: isMainSite ? 0.09 : 0.04,
              });
            });

            // Click to inspect site and fit bounds
            sitePolygon.addListener('click', () => {
              if (onSelectSite && siteObj.id !== selectedSiteId) {
                onSelectSite(siteObj.id);
              }
              if (infoWindowRef.current) {
                infoWindowRef.current.setContent(`
                  <div style="color: #0f172a; font-family: sans-serif; padding: 6px; max-width: 250px;">
                    <div style="font-size: 10px; font-weight: bold; color: #0284c7; text-transform: uppercase;">Construction Geofence Perimeter</div>
                    <strong style="font-size: 13px; color: #0f172a;">🏗️ ${siteObj.name}</strong>
                    <div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4;">
                      <div><strong>Site Code:</strong> ${siteObj.code || 'SITE'}</div>
                      <div><strong>Address:</strong> ${siteObj.address || 'Project Area'}</div>
                      <div><strong>Manager:</strong> ${siteObj.manager || 'Site Lead'}</div>
                      <div><strong>Active Sub-Zones:</strong> ${(siteObj.zones || []).length} Geofenced Sectors</div>
                      <div><strong>Total Assets:</strong> ${safeAssets.filter(a => a.siteId === siteObj.id).length} Active</div>
                    </div>
                  </div>
                `);
                infoWindowRef.current.setPosition(siteObj.coordinates);
                infoWindowRef.current.open(mapInstanceRef.current);
              }
            });

            siteOverlaysRef.current.push(sitePolygon);

            // Perimeter Boundary Corner Beacons & Access Gates
            sitePolyCoords.forEach((coord, vIdx) => {
              const isNorthGate = vIdx === 1;
              const isEastGate = vIdx === 3;
              const isGate = isNorthGate || isEastGate;

              const boundaryMarker = new google.maps.Marker({
                position: coord,
                map: mapInstanceRef.current!,
                title: isGate
                  ? `${siteObj.name} - ${isNorthGate ? 'North Access Gate (Geofence Ingress)' : 'East Logistics Gate (Geofence Egress)'}`
                  : `${siteObj.name} - Boundary Vertex Post #${vIdx + 1}`,
                icon: {
                  path: isGate ? google.maps.SymbolPath.FORWARD_CLOSED_ARROW : google.maps.SymbolPath.CIRCLE,
                  scale: isGate ? 5 : 2.5,
                  fillColor: isGate ? '#38bdf8' : '#94a3b8',
                  fillOpacity: 1,
                  strokeWeight: 1.5,
                  strokeColor: '#ffffff',
                },
              });

              siteOverlaysRef.current.push(boundaryMarker as any);
            });

            // Construction Site HQ Central Marker
            const siteMarker = new google.maps.Marker({
              position: siteObj.coordinates,
              map: mapInstanceRef.current!,
              title: `${siteObj.name} Hub & Site Office`,
              icon: {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: isMainSite ? '#38bdf8' : '#64748b',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#ffffff',
              },
            });

            siteMarker.addListener('click', () => {
              if (infoWindowRef.current) {
                infoWindowRef.current.setContent(`
                  <div style="color: #0f172a; font-family: sans-serif; padding: 6px; max-width: 240px;">
                    <div style="font-size: 10px; font-weight: bold; color: #0284c7; text-transform: uppercase;">Construction Hub</div>
                    <strong style="font-size: 13px; color: #0f172a;">🏗️ ${siteObj.name}</strong>
                    <div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4;">
                      <div><strong>Project Site Code:</strong> ${siteObj.code || 'SITE'}</div>
                      <div><strong>Manager:</strong> ${siteObj.manager || 'Site Lead'}</div>
                      <div><strong>Geofence Status:</strong> <span style="color: #10b981; font-weight: bold;">Active Boundary Guard</span></div>
                    </div>
                  </div>
                `);
                infoWindowRef.current.open(mapInstanceRef.current, siteMarker);
              }
            });
            markersRef.current.push(siteMarker);
          });
        }

        // 2. DRAW SUB-ZONE GEOFENCE POLYGONS
        if (showZoneOverlays && currentSite?.coordinates && currentZones.length > 0) {
          currentZones.forEach((zone, zIdx) => {
            const palette = ZONE_COLOR_PALETTE[zIdx % ZONE_COLOR_PALETTE.length];
            const isZoneActive = selectedZoneId === zone.id;
            const zoneAssetCount = safeAssets.filter((a) => a.zoneId === zone.id).length;

            // Generate multi-vertex polygon for the zone
            const zonePolygonCoords = getZonePolygonCoords(currentSite.coordinates!, zIdx, currentZones.length);

            // Compute polygon centroid for label and pin placement
            const centroidLat = zonePolygonCoords.reduce((sum, p) => sum + p.lat, 0) / zonePolygonCoords.length;
            const centroidLng = zonePolygonCoords.reduce((sum, p) => sum + p.lng, 0) / zonePolygonCoords.length;
            const zoneCentroid = { lat: centroidLat, lng: centroidLng };

            const zonePolygon = new google.maps.Polygon({
              paths: zonePolygonCoords,
              strokeColor: isZoneActive ? '#ffffff' : palette.stroke,
              strokeOpacity: isZoneActive ? 1.0 : 0.9,
              strokeWeight: isZoneActive ? 4 : 2.5,
              fillColor: palette.fill,
              fillOpacity: isZoneActive ? 0.38 : 0.18,
              map: mapInstanceRef.current!,
              clickable: true,
              zIndex: isZoneActive ? 20 : 5,
            });

            // Hover state for crisp boundary clarity
            zonePolygon.addListener('mouseover', () => {
              if (selectedZoneId !== zone.id) {
                zonePolygon.setOptions({
                  strokeColor: '#ffffff',
                  strokeWeight: 3.5,
                  fillOpacity: 0.30,
                });
              }
            });

            zonePolygon.addListener('mouseout', () => {
              if (selectedZoneId !== zone.id) {
                zonePolygon.setOptions({
                  strokeColor: palette.stroke,
                  strokeWeight: 2.5,
                  fillOpacity: 0.18,
                });
              }
            });

            // Click zone polygon to select and focus
            zonePolygon.addListener('click', () => {
              const nextId = selectedZoneId === zone.id ? null : zone.id;
              setSelectedZoneId(nextId);

              if (infoWindowRef.current) {
                infoWindowRef.current.setContent(`
                  <div style="color: #0f172a; font-family: sans-serif; padding: 6px; max-width: 240px;">
                    <div style="font-size: 10px; font-weight: bold; color: ${palette.stroke}; text-transform: uppercase;">Construction Zone Geofence</div>
                    <strong style="font-size: 13px; color: #0f172a;">📍 ${zone.name}</strong>
                    <div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4;">
                      <div><strong>Zone Type:</strong> ${zone.type || 'Work Area'}</div>
                      <div><strong>Occupancy:</strong> <span style="color: ${palette.stroke}; font-weight: bold;">${zoneAssetCount}</span> / ${zone.capacity || 20} Assets</div>
                      <div><strong>Geofence Limits:</strong> Defined Multi-Point Polygon</div>
                      <div style="margin-top: 5px; padding-top: 4px; border-top: 1px solid #e2e8f0;">
                        <span style="color: #0284c7; font-weight: bold; font-size: 10.5px;">Click to toggle asset filtering</span>
                      </div>
                    </div>
                  </div>
                `);
                infoWindowRef.current.setPosition(zoneCentroid);
                infoWindowRef.current.open(mapInstanceRef.current);
              }
            });

            zoneOverlaysRef.current.push(zonePolygon);

            // Zone Centroid Label & Icon Marker
            const zoneLabelMarker = new google.maps.Marker({
              position: zoneCentroid,
              map: mapInstanceRef.current!,
              title: `${zone?.name || 'Zone'} (${zoneAssetCount} assets)`,
              label: {
                text: `${(zone?.name || 'Zone').split(' ')[0]} [${zoneAssetCount}]`,
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 'bold',
                className: 'font-mono',
              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6.5,
                fillColor: palette.stroke,
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#ffffff',
              },
            });

            zoneLabelMarker.addListener('click', () => {
              setSelectedZoneId(selectedZoneId === zone.id ? null : zone.id);
            });

            zoneLabelsRef.current.push(zoneLabelMarker);
          });
        }

        // 3. DRAW RFID READER / PORTAL ANTENNA MARKERS
        if (showReaderPortals && currentSite?.coordinates) {
          siteReaders.forEach((reader, rIdx) => {
            const angle = (rIdx / Math.max(1, siteReaders.length)) * 2 * Math.PI;
            const readerPos = {
              lat: currentSite.coordinates!.lat + 0.0022 * Math.cos(angle),
              lng: currentSite.coordinates!.lng + 0.0025 * Math.sin(angle),
            };

            const readerMarker = new google.maps.Marker({
              position: readerPos,
              map: mapInstanceRef.current!,
              title: `RFID Portal: ${reader.name} (${reader.status})`,
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 5.5,
                fillColor: reader.status === 'Online' ? '#10b981' : '#f59e0b',
                fillOpacity: 1,
                strokeWeight: 1.5,
                strokeColor: '#ffffff',
              },
            });

            readerMarker.addListener('click', () => {
              if (infoWindowRef.current) {
                infoWindowRef.current.setContent(`
                  <div style="color: #0f172a; font-family: sans-serif; padding: 6px; max-width: 210px;">
                    <div style="font-size: 10px; font-weight: bold; color: #10b981; text-transform: uppercase;">GAO RFID Fixed Portal</div>
                    <strong style="font-size: 12px; color: #0f172a;">📡 ${reader.name}</strong>
                    <div style="font-size: 11px; color: #475569; margin-top: 3px; line-height: 1.4;">
                      <div><strong>Model:</strong> ${reader.model || 'GAO UHF Portal'}</div>
                      <div><strong>Status:</strong> <span style="color: ${reader.status === 'Online' ? '#10b981' : '#f59e0b'}; font-weight: bold;">${reader.status}</span></div>
                      <div><strong>Antenna Ports:</strong> ${reader.antennaCount || 4} Multi-Beam</div>
                      <div><strong>Site:</strong> ${currentSite.name}</div>
                    </div>
                  </div>
                `);
                infoWindowRef.current.open(mapInstanceRef.current, readerMarker);
              }
            });
            markersRef.current.push(readerMarker);
          });
        }

        // 4. DRAW ASSET MARKERS & ZONE RELATIONSHIPS
        filteredAssets.forEach((asset, aIdx) => {
          let position: { lat: number; lng: number };

          if (asset.coordinates && typeof asset.coordinates.lat === 'number' && typeof asset.coordinates.lng === 'number') {
            position = {
              lat: asset.coordinates.lat,
              lng: asset.coordinates.lng,
            };
          } else if (currentSite?.coordinates) {
            // If asset is linked to a zone, place within zone subsector
            const zoneIdx = currentZones.findIndex((z) => z.id === asset.zoneId);
            if (zoneIdx >= 0) {
              const zoneCenter = getZoneCentroid(currentSite.coordinates, zoneIdx, currentZones.length);
              const subAngle = (aIdx * 2.1) % (2 * Math.PI);
              const subDist = 0.0003 + ((aIdx * 0.00015) % 0.0006);
              position = {
                lat: zoneCenter.lat + subDist * Math.sin(subAngle),
                lng: zoneCenter.lng + subDist * Math.cos(subAngle),
              };
            } else {
              const angle = (aIdx * 1.37) % (2 * Math.PI);
              const dist = 0.0006 + ((aIdx * 0.0003) % 0.0016);
              position = {
                lat: currentSite.coordinates.lat + dist * Math.cos(angle),
                lng: currentSite.coordinates.lng + dist * Math.sin(angle),
              };
            }
          } else {
            return;
          }

          const isSelected = selectedAsset?.id === asset.id;
          const isAvailable = asset.status === 'AVAILABLE' || asset.status === 'Active' || asset.status === 'In Zone';
          const markerColor = isSelected
            ? '#38bdf8'
            : isAvailable
            ? '#10b981'
            : asset.status === 'Maintenance' || asset.status === 'Under Maintenance'
            ? '#f59e0b'
            : '#3b82f6';

          const marker = new google.maps.Marker({
            position,
            map: mapInstanceRef.current!,
            title: `${asset.name} (${asset.tagEpc || asset.serialNumber})`,
            zIndex: isSelected ? 999 : 10,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: isSelected ? 11 : 8,
              fillColor: markerColor,
              fillOpacity: 1,
              strokeWeight: isSelected ? 3 : 2,
              strokeColor: '#ffffff',
            },
          });

          marker.addListener('click', () => {
            setSelectedAsset(asset);
            if (asset.zoneId) {
              setSelectedZoneId(asset.zoneId);
            }
            if (infoWindowRef.current) {
              const content = `
                <div style="color: #0f172a; font-family: monospace; padding: 6px; max-width: 230px;">
                  <strong style="font-size: 13px; color: #1e293b;">${asset.name}</strong>
                  <div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4;">
                    <div><strong>Category:</strong> ${asset.category}</div>
                    <div><strong>EPC:</strong> ${asset.tagEpc || 'N/A'}</div>
                    <div><strong>Serial:</strong> ${asset.serialNumber || 'N/A'}</div>
                    <div><strong>Zone:</strong> <span style="color: #0284c7; font-weight: bold;">${asset.zoneName || 'Yard Area'}</span></div>
                    <div><strong>Site:</strong> ${asset.siteName || currentSite.name}</div>
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
      clearTimeout(timeoutTimer);
    };
  }, [
    mapMode,
    selectedSiteId,
    selectedProjectId,
    selectedZoneId,
    showSiteBoundary,
    showZoneOverlays,
    showReaderPortals,
    filteredAssets.length
  ]);

  // Effect to draw Asset-to-Zone relationship line and Breadcrumb Polyline Trail
  useEffect(() => {
    if (mapMode !== 'GOOGLE_MAP' || !mapInstanceRef.current) return;

    // Clear previous polyline trails
    if (trailPolylineRef.current) {
      trailPolylineRef.current.setMap(null);
      trailPolylineRef.current = null;
    }
    if (relationshipPolylineRef.current) {
      relationshipPolylineRef.current.setMap(null);
      relationshipPolylineRef.current = null;
    }
    trailMarkersRef.current.forEach((m) => m.setMap(null));
    trailMarkersRef.current = [];

    if (!selectedAsset) return;

    const centerCoords = getSiteCenter(selectedSiteId);
    const assetIdx = Math.max(0, filteredAssets.findIndex((a) => a.id === selectedAsset.id));
    const breadcrumbs = getAssetBreadcrumbs(selectedAsset, centerCoords, assetIdx);

    // Draw asset to zone relationship line if asset is located in a zone
    if (showAssetRelationships && currentSite?.coordinates && selectedAsset.zoneId) {
      const zoneIdx = currentZones.findIndex((z) => z.id === selectedAsset.zoneId);
      if (zoneIdx >= 0) {
        const zoneCentroid = getZoneCentroid(currentSite.coordinates, zoneIdx, currentZones.length);
        const assetPos = selectedAsset.coordinates && typeof selectedAsset.coordinates.lat === 'number'
          ? selectedAsset.coordinates
          : {
              lat: zoneCentroid.lat + 0.0003,
              lng: zoneCentroid.lng + 0.0003,
            };

        const relLine = new google.maps.Polyline({
          path: [zoneCentroid, assetPos],
          geodesic: true,
          strokeColor: '#38bdf8',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          map: mapInstanceRef.current,
        });
        relationshipPolylineRef.current = relLine;
      }
    }

    if (breadcrumbs.length > 0) {
      const pathCoords = breadcrumbs.map((b) => ({ lat: b.lat, lng: b.lng }));

      // Polyline connecting last locations
      const polyline = new google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: '#38bdf8',
        strokeOpacity: 0.95,
        strokeWeight: 4,
        map: mapInstanceRef.current,
      });
      trailPolylineRef.current = polyline;

      // Step markers
      breadcrumbs.forEach((pt) => {
        const isCurrent = pt.step === breadcrumbs.length;
        const marker = new google.maps.Marker({
          position: { lat: pt.lat, lng: pt.lng },
          map: mapInstanceRef.current!,
          title: `Point ${pt.step}: ${pt.zoneName} (${pt.timestamp})`,
          label: {
            text: `${pt.step}`,
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 'bold',
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: isCurrent ? 13 : 9,
            fillColor: isCurrent ? '#10b981' : '#0284c7',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff',
          },
        });
        trailMarkersRef.current.push(marker);
      });

      const bounds = new google.maps.LatLngBounds();
      pathCoords.forEach((pt) => bounds.extend(pt));
      mapInstanceRef.current.fitBounds(bounds, 60);
    }
  }, [selectedAsset, mapMode, selectedSiteId, showAssetRelationships]);

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
              Integrated construction site perimeters, zone geofences, UHF reader portals & asset telematics
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Project Selector Filter */}
          {safeProjects.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-300">
              <Briefcase className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-500 text-[11px] hidden sm:inline">Project:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSelectedZoneId(null);
                }}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Projects</option>
                {safeProjects.map((p, pIdx) => (
                  <option key={`proj-opt-${p.id || pIdx}-${pIdx}`} value={p.id} className="bg-slate-900 text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Construction Site Selector */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-300">
            <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
            <select
              value={currentSite?.id || ''}
              onChange={(e) => {
                onSelectSite(e.target.value);
                setSelectedZoneId(null);
              }}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              {availableSites.map((s, sIdx) => (
                <option key={`site-opt-${s.id || sIdx}-${sIdx}`} value={s.id} className="bg-slate-900 text-white">
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Roadmap vs Satellite Toggle */}
          {mapMode === 'GOOGLE_MAP' && (
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 font-mono text-xs">
              <button
                onClick={() => setMapType('roadmap')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  mapType === 'roadmap'
                    ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Vector Roadmap View"
              >
                <span>Roadmap</span>
              </button>
              <button
                onClick={() => setMapType('hybrid')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  mapType === 'hybrid'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Satellite Aerial Imagery View"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-200" />
                <span>Satellite</span>
              </button>
            </div>
          )}

          {/* Operations Map Street vs Satellite Toggle */}
          {mapMode === 'OPERATIONS_MAP' && (
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 font-mono text-xs">
              <button
                onClick={() => setDashboardMapType('streets')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  dashboardMapType === 'streets'
                    ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="CAD Blueprint Street View"
              >
                <span>Street View</span>
              </button>
              <button
                onClick={() => setDashboardMapType('satellite')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  dashboardMapType === 'satellite'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Satellite Dark Imagery View"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-200" />
                <span>Satellite</span>
              </button>
            </div>
          )}

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
              onClick={() => setMapMode('OPERATIONS_MAP')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mapMode === 'OPERATIONS_MAP'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Operations Map</span>
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

          {/* Sync Button */}
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

      {/* Construction Site & Zone Overlays Inspector Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 px-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Construction Site Zones:</span>
          </span>

          {currentZones.length === 0 ? (
            <span className="text-slate-500 italic">No sub-zones configured for site</span>
          ) : (
            currentZones.map((zone, zIdx) => {
              const palette = ZONE_COLOR_PALETTE[zIdx % ZONE_COLOR_PALETTE.length];
              const isSelected = selectedZoneId === zone.id;
              const count = safeAssets.filter((a) => a.zoneId === zone.id).length;

              return (
                <button
                  key={`zone-filter-btn-${zone.id || zIdx}-${zIdx}`}
                  onClick={() => setSelectedZoneId(isSelected ? null : zone.id)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md ring-1 ring-blue-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                  style={{
                    borderColor: isSelected ? undefined : palette.stroke + '40',
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: palette.stroke }}
                  />
                  <span>{zone.name}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-900 text-slate-400 border border-slate-800">
                    {count}
                  </span>
                </button>
              );
            })
          )}

          {selectedZoneId && (
            <button
              onClick={() => setSelectedZoneId(null)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2 ml-1 cursor-pointer"
            >
              Reset Zone Filter
            </button>
          )}
        </div>

        {/* Layer Visibility Toggles */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showSiteBoundary}
              onChange={(e) => setShowSiteBoundary(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-blue-500 focus:ring-0 cursor-pointer"
            />
            <span>Site Perimeter</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showZoneOverlays}
              onChange={(e) => setShowZoneOverlays(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <span>Zone Overlays</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showReaderPortals}
              onChange={(e) => setShowReaderPortals(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
            />
            <span>RFID Portals</span>
          </label>
        </div>
      </div>

      {/* Main Map View & Real-Time Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Columns: Interactive Site Layout Canvas */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden flex flex-col min-h-[540px]">
          {/* Top Canvas Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 z-10">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-400">Site:</span>
              <span className="text-white font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                {selectedSiteId === 'ALL'
                  ? `All Sites (${safeSites.length})`
                  : currentSite?.name
                  ? `${currentSite.name} (${currentSite.code || currentSite.id})`
                  : safeSites[0]
                  ? `${safeSites[0].name} (${safeSites[0].code})`
                  : 'All Construction Sites'}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {filteredAssets.length} of {siteAssets.length} Pins Shown
              </span>
              {selectedZoneId && activeZone && (
                <span className="text-cyan-300 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>Zone: {activeZone.name}</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Category Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-300">
                <Filter className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-slate-500 text-[11px] hidden sm:inline">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  {categoriesList.map((cat, catIdx) => (
                    <option key={`cat-opt-${cat}-${catIdx}`} value={cat} className="bg-slate-900 text-white">
                      {cat === 'ALL' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Filter Search */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search tag EPC, serial, name..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Google Maps Container */}
          {mapMode === 'GOOGLE_MAP' && (
            <div className="flex-1 w-full h-full min-h-[460px] rounded-xl overflow-hidden relative border border-slate-800">
              {!mapLoaded && !mapError && (
                <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center text-xs font-mono space-y-3 z-20">
                  <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
                  <p className="text-white font-bold">Connecting to Google Maps Platform...</p>
                  <p className="text-slate-400 max-w-sm text-[11px]">Loading geospatial tiles & satellite imagery...</p>
                  <button
                    onClick={() => setMapMode('OPERATIONS_MAP')}
                    className="mt-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-300" />
                    <span>Switch to Operations CAD Map</span>
                  </button>
                </div>
              )}
              {mapError && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-xs font-mono space-y-3 z-20">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                  <p className="text-white font-bold text-sm">Google Maps JS API Notice</p>
                  <p className="text-slate-400 max-w-md text-[11.5px]">{mapError}</p>
                  <button
                    onClick={() => setMapMode('OPERATIONS_MAP')}
                    className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-amber-300" />
                    <span>View Operations CAD Map</span>
                  </button>
                </div>
              )}
              <div ref={googleMapRef} className="w-full h-full min-h-[460px]" />
            </div>
          )}

          {/* Interactive Construction Site Operations CAD Map (from Dashboard) */}
          {mapMode === 'OPERATIONS_MAP' && (
            <div className={`relative min-h-[480px] flex-1 w-full ${
              dashboardMapType === 'satellite' ? 'bg-slate-950' : 'bg-slate-900'
            } rounded-xl overflow-hidden flex items-center justify-center border border-slate-800`}>
              {/* Geofence Overlay Visuals */}
              <div className="absolute inset-0 pointer-events-none opacity-40">
                <svg className="w-full h-full">
                  {/* Site Perimeter Alpha */}
                  {showSiteBoundary && (
                    <polygon
                      points="80,50 620,40 760,420 120,450"
                      fill={dashboardMapType === 'satellite' ? '#3b82f6' : '#0284c7'}
                      fillOpacity="0.12"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                    />
                  )}
                  {/* Sub-Zone Construction Geofence Polygons */}
                  {showZoneOverlays && (
                    <g key="zone-overlays-group">
                      {currentZones.map((zone, zIdx) => {
                        const palette = ZONE_COLOR_PALETTE[zIdx % ZONE_COLOR_PALETTE.length];
                        const isSelected = selectedZoneId === zone.id;
                        
                        // Polygon coordinates mapped across SVG viewport
                        const cols = Math.min(3, currentZones.length);
                        const colIdx = zIdx % cols;
                        const rowIdx = Math.floor(zIdx / cols);
                        const baseX = 120 + colIdx * 240;
                        const baseY = 100 + rowIdx * 170;

                        const pts = `${baseX},${baseY + 30} ${baseX + 160},${baseY} ${baseX + 200},${baseY + 130} ${baseX + 130},${baseY + 160} ${baseX - 20},${baseY + 110}`;

                        return (
                          <polygon
                            key={`zone-poly-${zone.id || zIdx}-${zIdx}`}
                            points={pts}
                            fill={palette.fill}
                            fillOpacity={isSelected ? '0.35' : '0.14'}
                            stroke={isSelected ? '#ffffff' : palette.stroke}
                            strokeWidth={isSelected ? '3.5' : '2'}
                            strokeDasharray={isSelected ? 'none' : '5 3'}
                          />
                        );
                      })}
                    </g>
                  )}
                </svg>
              </div>

              {/* Grid lines for CAD/Site aesthetic */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808015_1px,transparent_1px),linear-gradient(to_bottom,#80808015_1px,transparent_1px)] bg-[size:32px_32px]" />

              {/* Zone Tag Badges in CAD Map */}
              {showZoneOverlays && currentZones.length > 0 && (
                <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 pointer-events-none z-10">
                  {currentZones.map((zone, zIdx) => {
                    const palette = ZONE_COLOR_PALETTE[zIdx % ZONE_COLOR_PALETTE.length];
                    const isSelected = selectedZoneId === zone.id;
                    const zoneAssetCount = safeAssets.filter((a) => a.zoneId === zone.id).length;

                    return (
                      <div
                        key={`zone-cad-badge-${zone.id || zIdx}-${zIdx}`}
                        className={`bg-slate-950/90 border px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold shadow-sm flex items-center gap-1.5 transition-all ${
                          isSelected ? 'border-white text-white ring-2 ring-blue-500/50' : 'text-slate-300'
                        }`}
                        style={{ borderColor: isSelected ? undefined : palette.stroke + '60' }}
                      >
                        <span
                          className="w-2 h-2 rounded-full animate-pulse shrink-0"
                          style={{ backgroundColor: palette.stroke }}
                        />
                        <span>{zone.name}</span>
                        <span className="text-[9px] px-1 py-0.2 bg-slate-900 text-slate-400 rounded">
                          {zoneAssetCount} Assets
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Interactive Asset Markers Scatter */}
              <div className="absolute inset-0 p-8 flex flex-wrap items-center justify-around overflow-y-auto">
                {filteredAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 z-10 m-auto">
                    <p className="text-slate-400 text-xs font-mono">No equipment pins matching current filter.</p>
                    <button
                      onClick={() => { setSelectedCategory('ALL'); setFilterSearch(''); setSelectedZoneId(null); }}
                      className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono rounded-lg border border-slate-700 cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  filteredAssets.map((asset, aIdx) => {
                    const icon = getMarkerIcon(asset.category || asset.assetType);
                    const isSelected = selectedAsset?.id === asset.id;
                    const isMoving = asset.status === 'In Transit' || asset.status === 'Active' || asset.status === 'In Zone';
                    const isIdle = asset.status === 'Idle';
                    const isMaint = asset.status === 'Under Maintenance' || asset.status === 'Maintenance';

                    return (
                      <div
                        key={`op-asset-marker-${asset.id || aIdx}-${aIdx}`}
                        onClick={() => {
                          setSelectedAsset(asset);
                          if (asset.zoneId) setSelectedZoneId(asset.zoneId);
                        }}
                        className="cursor-pointer group flex flex-col items-center transition-all hover:scale-115 relative z-10 m-3"
                        title={`${asset.name} (${asset.category}) - Click to inspect`}
                      >
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shadow-lg border-2 transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-white ring-4 ring-blue-500/50 scale-110 text-white'
                            : isMaint
                            ? 'bg-purple-600 border-purple-300 text-white'
                            : isIdle
                            ? 'bg-amber-500 border-amber-200 text-white'
                            : isMoving
                            ? 'bg-emerald-600 border-emerald-200 text-white'
                            : 'bg-slate-800 border-slate-600 text-white'
                        }`}>
                          <span>{icon}</span>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 shadow-md font-mono truncate max-w-[120px] ${
                          isSelected
                            ? 'bg-blue-600 text-white border border-blue-400 font-black'
                            : 'bg-slate-950/90 text-slate-200 border border-slate-800'
                        }`}>
                          {asset.name}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Map Legend Overlay */}
              <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-xs p-2.5 px-3 rounded-xl border border-slate-800 text-[10.5px] space-y-1 shadow-lg font-mono text-slate-300 z-20">
                <span className="font-bold text-white block text-[10px] uppercase tracking-wider">Live Construction Telemetry Legend</span>
                <div className="flex flex-wrap items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1 text-emerald-400">🟢 Active Machine</span>
                  <span className="flex items-center gap-1 text-amber-400">🟡 Stationary / Idle</span>
                  <span className="flex items-center gap-1 text-purple-400">🟣 In Maintenance</span>
                  <span className="flex items-center gap-1 text-rose-400">🔴 Restricted Zone</span>
                </div>
              </div>
            </div>
          )}

          {/* Schematic Zones Layout */}
          {mapMode === 'SCHEMATIC' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 flex-1 z-10">
              {currentZones.map((z, zIdx) => {
                const zoneAssets = filteredAssets.filter((a) => a.zoneId === z.id);
                const isSelected = activeZone?.id === z.id;
                const zoneReader = siteReaders.find((r) => r.zoneId === z.id || r.id.includes(z.id.toLowerCase()));
                const palette = ZONE_COLOR_PALETTE[zIdx % ZONE_COLOR_PALETTE.length];

                return (
                  <div
                    key={`schematic-zone-${z.id || zIdx}-${zIdx}`}
                    onClick={() => setSelectedZoneId(isSelected ? null : z.id)}
                    className={`bg-slate-950/90 border rounded-2xl p-4 transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/40'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-xs font-mono font-bold block" style={{ color: palette.stroke }}>
                            {z.name.toUpperCase()}
                          </span>
                          <h3 className="font-bold text-sm text-white font-mono">{z.name}</h3>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {zoneAssets.length} Assets
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-1 mb-3">
                        {z.type || 'Monitored Construction Zone & RFID Boundary'}
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
                        Live Tag Detections in Zone:
                      </span>
                      {zoneAssets.length === 0 ? (
                        <p className="text-[11px] text-slate-500 font-mono italic">No tags in zone scope</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {zoneAssets.slice(0, 6).map((ast, astIdx) => (
                            <button
                              key={`schematic-tag-${ast.id || astIdx}-${astIdx}`}
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
                      key={`radar-pin-${ast.id || idx}-${idx}`}
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
              {filteredAssets.map((ast, astIdx) => (
                <div
                  key={`grid-cell-${ast.id || astIdx}-${astIdx}`}
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
              <span>Integrated Construction Boundaries & RFID Telemetry</span>
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
                    <span className="text-cyan-400 font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      {selectedAsset.zoneName || 'Main Yard'}
                    </span>
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

                {/* Breadcrumb Trail (Last 5 Locations) */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="font-bold text-cyan-400 text-[11px] flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-cyan-300" />
                      <span>Breadcrumb Trail (Last 5 Locations)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Polyline Active</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {getAssetBreadcrumbs(
                      selectedAsset,
                      getSiteCenter(selectedSiteId),
                      Math.max(0, filteredAssets.findIndex((a) => a.id === selectedAsset.id))
                    ).map((stepItem, sIdx, sArr) => (
                      <div
                        key={`breadcrumb-step-${stepItem.step || sIdx}-${sIdx}`}
                        className={`flex items-center justify-between p-1.5 rounded-lg border text-[10.5px] font-mono transition-all ${
                          stepItem.step === sArr.length
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${
                              stepItem.step === sArr.length ? 'bg-emerald-500 text-slate-950' : 'bg-cyan-600 text-white'
                            }`}
                          >
                            {stepItem.step}
                          </span>
                          <span className="font-medium truncate">{stepItem.zoneName}</span>
                        </div>
                        <span className="text-[9.5px] text-slate-400 shrink-0">{stepItem.timestamp}</span>
                      </div>
                    ))}
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
                  Click any marker on the Google Map or select a construction zone to inspect live antenna telemetry & asset-zone relationships.
                </p>
              </div>
            )}
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-400 space-y-1">
            <span className="font-bold text-slate-300 block">Google Maps Platform API</span>
            <p>Integrated construction boundaries, zone polygons & real-time telemetry.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
