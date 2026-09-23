import React, { useState } from 'react';
import { Site, Asset, Alert, MaintenanceLog, Inspection, AssetMovement, User } from '../types';
import { 
  Building2, 
  MapPin, 
  Users, 
  Boxes, 
  ShieldAlert, 
  Wrench, 
  ClipboardCheck, 
  ArrowRightLeft, 
  Compass, 
  Plus, 
  Radio, 
  CheckCircle2, 
  Clock, 
  SlidersHorizontal 
} from 'lucide-react';

interface ConstructionSitesViewProps {
  sites: Site[];
  assets: Asset[];
  alerts: Alert[];
  maintenanceLogs: MaintenanceLog[];
  inspections: Inspection[];
  movements: AssetMovement[];
  users: User[];
  onSelectAsset?: (asset: Asset) => void;
  onNavigateToTab?: (tab: any) => void;
}

export const ConstructionSitesView: React.FC<ConstructionSitesViewProps> = ({
  sites = [],
  assets = [],
  alerts = [],
  maintenanceLogs = [],
  inspections = [],
  movements = [],
  users = [],
  onSelectAsset,
  onNavigateToTab
}) => {
  const safeSites = sites || [];
  const safeAssets = assets || [];
  const safeAlerts = alerts || [];
  const safeMaintenanceLogs = maintenanceLogs || [];
  const safeInspections = inspections || [];
  const safeMovements = movements || [];
  const safeUsers = users || [];

  const [selectedSiteId, setSelectedSiteId] = useState<string>(safeSites[0]?.id || '');
  const [activeSiteSubTab, setActiveSiteSubTab] = useState<'overview' | 'assets' | 'movements' | 'alerts' | 'maintenance' | 'inspections'>('overview');
  const [showNewSiteModal, setShowNewSiteModal] = useState(false);

  const activeSite = safeSites.find(s => s.id === selectedSiteId) || safeSites[0];

  // Data scoped to the active site
  const siteAssets = safeAssets.filter(a => activeSite && a.siteId === activeSite.id);
  const siteAlerts = safeAlerts.filter(a => activeSite && a.siteId === activeSite.id);
  const siteMovements = safeMovements.filter(m => activeSite && (m.fromSiteId === activeSite.id || m.toSiteId === activeSite.id));
  const siteInspections = safeInspections.filter(i => activeSite && i.siteId === activeSite.id);
  const siteMaintenance = safeMaintenanceLogs.filter(m => siteAssets.some(a => a.id === m.assetId));
  const siteWorkers = safeUsers.filter(u => activeSite && u.siteAccess && u.siteAccess.includes(activeSite.id));

  const activeMachineryCount = siteAssets.filter(a => a.category === 'Heavy Equipment' || a.category === 'Equipment' || a.category === 'Vehicles').length;
  const activeToolsCount = siteAssets.filter(a => a.category === 'Tools').length;
  const totalSiteValue = siteAssets.reduce((sum, a) => sum + (a.cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-900 text-white rounded-xl">
              <Building2 className="w-5 h-5 text-blue-400" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Construction Sites & Yards</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-site oversight, laydown yard portals, zone capacities, geofenced perimeters, and site telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 font-mono">Total Sites:</span>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
            {sites.length} Active
          </span>
        </div>
      </div>

      {/* Sites Switcher Horizontal Cards or Empty State */}
      {sites.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">No construction sites have been added.</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Add a job site or storage yard to define RFID portals, reader antennas, laydown zones, and geo-boundaries.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {safeSites.map((site) => {
          const isSelected = site.id === activeSite?.id;
          const sAssets = safeAssets.filter(a => a.siteId === site.id);
          const sAlerts = safeAlerts.filter(a => a.siteId === site.id && !a.resolved);

          return (
            <div
              key={site.id}
              onClick={() => setSelectedSiteId(site.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-blue-500/40'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  isSelected ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-slate-100 text-slate-700'
                }`}>
                  {site.code}
                </span>

                {sAlerts.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> {sAlerts.length} Alerts
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold leading-tight mb-1">{site.name}</h3>
              <p className={`text-xs mb-3 flex items-center gap-1 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                <MapPin className="w-3 h-3 shrink-0 text-amber-500" />
                <span className="truncate">{site.address}</span>
              </p>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/20 text-center font-mono">
                <div>
                  <div className="text-sm font-black">{sAssets.length}</div>
                  <div className="text-[9px] opacity-75">Assets</div>
                </div>
                <div>
                  <div className="text-sm font-black text-blue-400">{site.zones?.length || 0}</div>
                  <div className="text-[9px] opacity-75">Zones</div>
                </div>
                <div>
                  <div className="text-sm font-black text-emerald-400">
                    ${((sAssets.reduce((sum, a) => sum + (a.cost || 0), 0)) / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-[9px] opacity-75">Value</div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Selected Site Detail Dashboard */}
      {activeSite && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          {/* Site Header Context */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                  {activeSite.code}
                </span>
                <span className="text-xs font-semibold text-slate-500 font-mono">
                  GPS: {activeSite.coordinates.lat.toFixed(4)}, {activeSite.coordinates.lng.toFixed(4)}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Active Site
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900">{activeSite.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {activeSite.address} • Site Superintendent: <strong className="text-slate-700">{activeSite.manager}</strong>
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Heavy Machinery</span>
                <span className="text-sm font-black text-slate-900">{activeMachineryCount} Units</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Tools & Crib</span>
                <span className="text-sm font-black text-slate-900">{activeToolsCount} Units</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Active Workers</span>
                <span className="text-sm font-black text-blue-600">{siteWorkers.length || 4} On-Site</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Valuation</span>
                <span className="text-sm font-black text-emerald-700 font-mono">${(totalSiteValue).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Sub-Navigation Tabs for Site */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
            {[
              { id: 'overview', label: `Zones & Layout (${activeSite.zones?.length || 0})`, icon: <Building2 className="w-3.5 h-3.5" /> },
              { id: 'assets', label: `Machinery & Tools (${siteAssets.length})`, icon: <Boxes className="w-3.5 h-3.5" /> },
              { id: 'movements', label: `Recent Movements (${siteMovements.length})`, icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
              { id: 'alerts', label: `Exceptions (${siteAlerts.length})`, icon: <ShieldAlert className="w-3.5 h-3.5" /> },
              { id: 'inspections', label: `Site Inspections (${siteInspections.length})`, icon: <ClipboardCheck className="w-3.5 h-3.5" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSiteSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeSiteSubTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Sub-Tab 1: Overview & Zones */}
          {activeSiteSubTab === 'overview' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Authorized Laydown Yards, Portals & Restricted Zones
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(activeSite.zones || []).map((zone) => {
                  const zoneAssets = siteAssets.filter(a => a.zoneId === zone.id || a.zoneName === zone.name);
                  const isNearCap = zoneAssets.length >= zone.capacity * 0.8;

                  return (
                    <div key={zone.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: zone.color || '#3b82f6' }}
                        />
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-semibold">
                          {zone.type}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{zone.name}</h4>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Readers: {zone.readerIds?.join(', ') || 'Portal Gate #1'}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs mb-1 font-mono">
                          <span className="text-slate-500">Capacity:</span>
                          <span className="font-bold text-slate-900">{zoneAssets.length} / {zone.capacity} Units</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isNearCap ? 'bg-rose-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min(100, (zoneAssets.length / zone.capacity) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-2 flex items-center justify-between">
                        <span>Current Dwellings:</span>
                        <span className="font-bold text-slate-800">{zoneAssets.slice(0, 2).map(a => a.id).join(', ') || 'Clear'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-Tab 2: Assets */}
          {activeSiteSubTab === 'assets' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5">Asset ID / Name</th>
                    <th className="px-3 py-2.5">Category</th>
                    <th className="px-3 py-2.5">Zone Location</th>
                    <th className="px-3 py-2.5">Assigned Operator</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {siteAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="font-bold text-slate-900">{asset.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{asset.id} • {asset.model}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {asset.category}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-slate-900">{asset.zoneName}</div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">
                        {asset.assignedWorker || 'Unassigned'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          asset.status === 'Active' || asset.status === 'In Zone'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : asset.status === 'Idle'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {onSelectAsset && (
                          <button
                            onClick={() => onSelectAsset(asset)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                          >
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sub-Tab 3: Movements */}
          {activeSiteSubTab === 'movements' && (
            <div className="space-y-3">
              {siteMovements.map((mov) => (
                <div key={mov.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-white rounded-lg border border-slate-200 text-blue-600">
                      <ArrowRightLeft className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">{mov.assetName}</div>
                      <div className="text-[11px] text-slate-500">
                        From <strong className="text-slate-700">{mov.fromLocation}</strong> to <strong className="text-slate-700">{mov.toLocation}</strong>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {mov.movementTime} • Auth: {mov.authorizedBy} • Source: {mov.trackingSource}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    mov.movementType === 'Unauthorized Movement' 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-slate-200 text-slate-800'
                  }`}>
                    {mov.movementType}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Sub-Tab 4: Alerts */}
          {activeSiteSubTab === 'alerts' && (
            <div className="space-y-3">
              {siteAlerts.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No active exceptions or alerts for this site.
                </div>
              ) : (
                siteAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex items-start justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white uppercase tracking-wider">
                          {alert.severity}
                        </span>
                        <span className="font-bold text-slate-900">{alert.message}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{alert.description}</p>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        Triggered: {new Date(alert.triggeredAt).toLocaleTimeString()} • Assigned: {alert.assignedUser || 'Unassigned'}
                      </div>
                    </div>

                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white text-rose-700 border border-rose-200">
                      {alert.status || 'New'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sub-Tab 5: Inspections */}
          {activeSiteSubTab === 'inspections' && (
            <div className="space-y-3">
              {siteInspections.map((insp) => (
                <div key={insp.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        insp.result === 'Passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {insp.result}
                      </span>
                      <strong className="text-slate-900 text-sm">{insp.assetName}</strong>
                    </div>
                    <p className="text-slate-600 text-[11px]">{insp.damageNotes}</p>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      Inspector: {insp.inspector} • Date: {insp.date} • Safety: {insp.safetyStatus}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 block">{insp.id}</span>
                    <span className="text-xs font-semibold text-slate-700">{insp.signature}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
