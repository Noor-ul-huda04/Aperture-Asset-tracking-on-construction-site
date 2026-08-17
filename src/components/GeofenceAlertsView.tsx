import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  Sliders, 
  Clock, 
  AlertTriangle,
  Plus,
  Compass,
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Save,
  Trash2,
  X
} from 'lucide-react';
import { Alert } from '../types';

interface GeofenceAlertsViewProps {
  alerts: Alert[];
  onResolveAlert: (id: string) => void;
  onOpenSettings?: () => void;
}

export const GeofenceAlertsView: React.FC<GeofenceAlertsViewProps> = ({
  alerts,
  onResolveAlert
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'incidents' | 'setup'>('incidents');

  const unresolved = (alerts || []).filter(a => !a.resolved && (a as any).status !== 'RESOLVED');
  const resolved = (alerts || []).filter(a => a.resolved || (a as any).status === 'RESOLVED');

  // Interactive Geofence Zones
  const [geofenceZones, setGeofenceZones] = useState([
    { id: 'zone-01', name: 'Main Construction Site Outer Perimeter', radiusMeters: 250, status: 'ACTIVE', type: 'OUTER_BOUNDARY', site: 'Harbor Expansion Site A' },
    { id: 'zone-02', name: 'Tool Crib & Heavy Equipment Enclosure', radiusMeters: 45, status: 'ACTIVE', type: 'RESTRICTED_ZONE', site: 'Harbor Expansion Site A' },
    { id: 'zone-03', name: 'South Loading Dock & RFID Portal Gate 1', radiusMeters: 20, status: 'ACTIVE', type: 'GATEWAY_PORTAL', site: 'Downtown Tower Site B' },
    { id: 'zone-04', name: 'East Storage Yard B', radiusMeters: 100, status: 'MONITORED', type: 'STORAGE_YARD', site: 'Substation Yard C' }
  ]);

  // Geofence Security Rules State
  const [curfewHour, setCurfewHour] = useState('18:00');
  const [autoFlagMissingDays, setAutoFlagMissingDays] = useState('3');
  const [offHoursAlarm, setOffHoursAlarm] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);

  const [rulesSaveMsg, setRulesSaveMsg] = useState<string | null>(null);
  const [createZoneModalOpen, setCreateZoneModalOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneSite, setNewZoneSite] = useState('Harbor Expansion Site A');
  const [newZoneRadius, setNewZoneRadius] = useState(150);

  const showToast = (msg: string) => {
    setRulesSaveMsg(msg);
    setTimeout(() => setRulesSaveMsg(null), 3500);
  };

  const handleSaveGeofenceRules = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Geofence boundary rules & curfew security preferences saved!');
  };

  const handleDeleteZone = (id: string, name: string) => {
    setGeofenceZones(prev => prev.filter(z => z.id !== id));
    showToast(`Geofence boundary "${name}" deactivated and removed.`);
  };

  const handleCreateZone = (e: React.FormEvent) => {
    e.preventDefault();
    const newZone = {
      id: `zone-${Date.now()}`,
      name: newZoneName || 'New Perimeter Zone',
      radiusMeters: Number(newZoneRadius),
      status: 'ACTIVE',
      type: 'CUSTOM_ZONE',
      site: newZoneSite
    };
    setGeofenceZones(prev => [...prev, newZone]);
    setCreateZoneModalOpen(false);
    setNewZoneName('');
    showToast(`Created new geofence zone "${newZone.name}" with ${newZone.radiusMeters}m radius.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2 font-mono">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            <span>Geofence Alerts & Perimeter Setup Hub</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Primary center for site breach monitoring, curfew security, and boundary zone setup</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-red-50 text-red-700 border border-red-200 px-3.5 py-2 rounded-xl whitespace-nowrap">
            {unresolved.length} Active Incidents
          </span>
        </div>
      </div>

      {/* Sub-Tab Navigation (Incidents vs Geofence Setup Area) */}
      <div className="bg-slate-100 p-1.5 rounded-xl flex gap-2 font-semibold text-xs border border-slate-200 max-w-md">
        <button
          onClick={() => setActiveSubTab('incidents')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'incidents'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
          <span>Active Incidents ({unresolved.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('setup')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'setup'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>Geofence Setup Area</span>
        </button>
      </div>

      {/* VIEW 1: Active Incidents List */}
      {activeSubTab === 'incidents' && (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Active Perimeter Incidents ({unresolved.length})</h3>

            {unresolved.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 shadow-xs">
                <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-sm">All Site Perimeter Geofences Clear</p>
                <p className="text-xs text-slate-500 mt-0.5">No unauthorized movements or curfew breaches detected across active job sites.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unresolved.map(alt => (
                  <div
                    key={alt.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xs ${
                      alt.severity === 'CRITICAL'
                        ? 'bg-red-50/80 border-red-200 text-red-950'
                        : 'bg-amber-50/80 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        alt.severity === 'CRITICAL' ? 'bg-red-100 text-red-600 animate-bounce' : 'bg-amber-100 text-amber-700'
                      }`}>
                        <ShieldAlert className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{alt.type}</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            alt.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {alt.severity}
                          </span>
                        </div>

                        <p className="text-xs mt-1 text-slate-700">{alt.message}</p>

                        <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2 font-mono">
                          <span>Site: <strong className="text-slate-800">{alt.siteName}</strong></span>
                          <span>Triggered: {alt.triggeredAt ? new Date(alt.triggeredAt).toLocaleString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onResolveAlert(alt.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shrink-0 flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Acknowledge & Resolve</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resolved Log */}
          {resolved.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Incident Audit Log ({resolved.length})</h3>
              <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 text-xs shadow-xs">
                {resolved.map(r => (
                  <div key={r.id} className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">{r.type}: </span>
                      <span className="text-slate-600">{r.message}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                      Resolved: {r.resolvedAt ? new Date(r.resolvedAt).toLocaleTimeString() : 'Yes'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Geofence Setup & Perimeter Area */}
      {activeSubTab === 'setup' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Active Geofence Zone Configuration */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            {/* Geofence Zone Configuration Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Geofence Zone Perimeter Configuration</span>
                </h3>
                <p className="text-xs text-slate-500">Manage virtual boundaries, warning radii, and site curfew thresholds</p>
              </div>

              <button
                type="button"
                onClick={() => setCreateZoneModalOpen(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Virtual Boundary Zone</span>
              </button>
            </div>

            {/* Geofence Zone Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {geofenceZones.map((zone) => (
                <div key={zone.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <span className="font-bold text-slate-900 text-xs">{zone.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                        {zone.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteZone(zone.id, zone.name)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        title="Delete zone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-white p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Site Context:</span>
                      <span className="font-bold text-slate-800">{zone.site}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Perimeter Radius:</span>
                      <span className="font-bold text-blue-700">{zone.radiusMeters} meters</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Rules & Notification Preferences */}
          <form onSubmit={handleSaveGeofenceRules} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-4 h-4 text-red-600" />
              <span>Curfew & Perimeter Alert Trigger Rules</span>
            </h3>

            {rulesSaveMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{rulesSaveMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nightly Curfew Hours</label>
                <input 
                  type="time" 
                  value={curfewHour}
                  onChange={(e) => setCurfewHour(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Auto-Flag Missing Threshold (Days)</label>
                <input 
                  type="number" 
                  min="1"
                  max="14"
                  value={autoFlagMissingDays}
                  onChange={(e) => setAutoFlagMissingDays(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 bg-slate-50 p-3.5 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Off-Hours Motion Alarm</span>
                  <span className="text-[11px] text-slate-500">Trigger immediate breach alert for any movement after curfew hours</span>
                </div>
                <input 
                  type="checkbox"
                  checked={offHoursAlarm}
                  onChange={(e) => setOffHoursAlarm(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
              </div>

              <div className="sm:col-span-2 space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-900 block text-xs">Active Notification Channels for Breaches</span>
                <div className="flex flex-wrap gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <input 
                      type="checkbox" 
                      checked={emailAlerts} 
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Email Dispatch</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <input 
                      type="checkbox" 
                      checked={smsAlerts} 
                      onChange={(e) => setSmsAlerts(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>SMS Emergency Alert</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <input 
                      type="checkbox" 
                      checked={inAppAlerts} 
                      onChange={(e) => setInAppAlerts(e.target.checked)}
                      className="w-4 h-4 accent-purple-600 rounded"
                    />
                    <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                    <span>In-App Banner</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Geofence Rules</span>
              </button>
            </div>
          </form>

        </div>
      )}

      {/* Create Geofence Zone Modal */}
      {createZoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Define Virtual Geofence Boundary</span>
              </h3>
              <button onClick={() => setCreateZoneModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateZone} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Zone / Boundary Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. West Perimeter Fuel & Flammable Depot"
                  value={newZoneName}
                  onChange={e => setNewZoneName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Facility / Site Location</label>
                <input
                  type="text"
                  required
                  value={newZoneSite}
                  onChange={e => setNewZoneSite(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Containment Radius ({newZoneRadius} meters)</label>
                <input
                  type="range"
                  min={20}
                  max={500}
                  value={newZoneRadius}
                  onChange={e => setNewZoneRadius(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateZoneModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Create Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
