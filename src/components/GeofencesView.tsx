import React, { useState } from 'react';
import { Geofence, Site, Asset } from '../types';
import { 
  Compass, 
  MapPin, 
  ShieldAlert, 
  Clock, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  SlidersHorizontal, 
  CircleDot, 
  Shapes,
  Boxes,
  BellRing
} from 'lucide-react';

interface GeofencesViewProps {
  geofences: Geofence[];
  sites: Site[];
  assets: Asset[];
  onCreateGeofence: (newGeo: Geofence) => void;
}

export const GeofencesView: React.FC<GeofencesViewProps> = ({
  geofences = [],
  sites = [],
  assets = [],
  onCreateGeofence
}) => {
  const safeGeofences = geofences || [];
  const safeSites = sites || [];
  const safeAssets = assets || [];

  const [selectedSiteId, setSelectedSiteId] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Geofence Form State
  const [name, setName] = useState('');
  const [siteId, setSiteId] = useState(safeSites[0]?.id || '');
  const [type, setType] = useState<Geofence['type']>('Construction Site');
  const [radiusMeters, setRadiusMeters] = useState(400);
  const [color, setColor] = useState('#2563eb');
  const [alertOnExit, setAlertOnExit] = useState(true);
  const [alertOnUnauthorizedEntry, setAlertOnUnauthorizedEntry] = useState(true);
  const [restrictedHoursActive, setRestrictedHoursActive] = useState(false);
  const [restrictedHoursStart, setRestrictedHoursStart] = useState('19:00');
  const [restrictedHoursEnd, setRestrictedHoursEnd] = useState('06:00');

  const filteredGeofences = safeGeofences.filter(g => {
    if (selectedSiteId !== 'ALL' && g.siteId !== selectedSiteId) return false;
    return true;
  });

  const handleCreate = () => {
    if (!name) return;
    const parentSite = sites.find(s => s.id === siteId);

    const newG: Geofence = {
      id: `geo-${Date.now().toString().slice(-4)}`,
      name,
      siteId,
      siteName: parentSite?.name || siteId,
      type,
      shape: 'circle',
      center: parentSite ? { ...parentSite.coordinates } : { lat: 31.5204, lng: 74.3587 },
      radiusMeters,
      color,
      rules: {
        alertOnExit,
        alertOnUnauthorizedEntry,
        restrictedHoursActive,
        restrictedHoursStart: restrictedHoursActive ? restrictedHoursStart : undefined,
        restrictedHoursEnd: restrictedHoursActive ? restrictedHoursEnd : undefined
      },
      active: true,
      assetCount: 0
    };

    onCreateGeofence(newG);
    setShowCreateModal(false);
    setName('');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-900 text-white rounded-xl">
              <Compass className="w-5 h-5 text-emerald-400" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Geofences & Security Perimeters</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Site boundaries, restricted core perimeters, off-hours movement detection, and automatic telemetry exit alarms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Site Perimeters</option>
            {safeSites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Geofence</span>
          </button>
        </div>
      </div>

      {/* Geofences Grid or Empty State */}
      {geofences.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <Compass className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">No active geofences configured.</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Create geofences to monitor asset exit events, curfew violations, and restricted perimeter entries.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs mt-2"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Create Geofence</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGeofences.map((geo) => (
          <div key={geo.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-left">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span 
                  className="w-4 h-4 rounded-full ring-4 ring-slate-100 shrink-0" 
                  style={{ backgroundColor: geo.color }} 
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{geo.name}</h3>
                  <div className="text-[11px] text-slate-500">{geo.siteName}</div>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {geo.type}
              </span>
            </div>

            {/* Perimeter Details */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center font-mono text-xs">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Radius / Shape</span>
                <span className="font-bold text-slate-800">{geo.radiusMeters}m {geo.shape}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Assets Inside</span>
                <span className="font-bold text-blue-600">{geo.assetCount || 0} Units</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Rule State</span>
                <span className="font-bold text-emerald-600">Active</span>
              </div>
            </div>

            {/* Active Automated Trigger Rules (Requested explicitly in Section 8) */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Telemetry Automated Trigger Rules:
              </span>
              <div className="grid grid-cols-1 gap-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-700">
                  {geo.rules.alertOnExit ? (
                    <BellRing className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-200 inline-block" />
                  )}
                  <span><strong>Alert on Exit:</strong> Trigger high-priority exception if machinery leaves without manifest.</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-700">
                  {geo.rules.alertOnUnauthorizedEntry ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-200 inline-block" />
                  )}
                  <span><strong>Restricted Access:</strong> Alert if unauthorized assets or tools enter this zone.</span>
                </div>

                {geo.rules.restrictedHoursActive && (
                  <div className="flex items-center gap-1.5 text-purple-700 bg-purple-50 p-1.5 rounded-lg border border-purple-200">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span><strong>Curfew Hours:</strong> Motion alarm active between {geo.rules.restrictedHoursStart} and {geo.rules.restrictedHoursEnd}.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Create Geofence Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-lg font-black text-slate-900">Define Security Geofence / Zone</h2>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Geofence Name</label>
                <input
                  type="text"
                  placeholder="e.g. Laydown Yard B High-Security Perimeter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Site</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  >
                    {safeSites.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Zone Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="Construction Site">Construction Site</option>
                    <option value="Equipment Yard">Equipment Yard</option>
                    <option value="Restricted Area">Restricted Area</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Storage Area">Storage Area</option>
                    <option value="Parking Area">Parking Area</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Radius (Meters)</label>
                  <input
                    type="number"
                    value={radiusMeters}
                    onChange={(e) => setRadiusMeters(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Color Theme</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-9 bg-slate-50 border border-slate-200 rounded-xl p-1 cursor-pointer"
                  />
                </div>
              </div>

              {/* Rule Toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 block">Automated Rule Triggers</span>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertOnExit}
                    onChange={(e) => setAlertOnExit(e.target.checked)}
                    className="rounded text-slate-900"
                  />
                  <span>Alert immediately if asset exits geofence boundary</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertOnUnauthorizedEntry}
                    onChange={(e) => setAlertOnUnauthorizedEntry(e.target.checked)}
                    className="rounded text-slate-900"
                  />
                  <span>Alert on unauthorized asset entry</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restrictedHoursActive}
                    onChange={(e) => setRestrictedHoursActive(e.target.checked)}
                    className="rounded text-slate-900"
                  />
                  <span>Enforce after-hours curfew / restricted motion hours</span>
                </label>

                {restrictedHoursActive && (
                  <div className="grid grid-cols-2 gap-2 pl-6 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Curfew Start</span>
                      <input
                        type="time"
                        value={restrictedHoursStart}
                        onChange={(e) => setRestrictedHoursStart(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Curfew End</span>
                      <input
                        type="time"
                        value={restrictedHoursEnd}
                        onChange={(e) => setRestrictedHoursEnd(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Save Geofence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
