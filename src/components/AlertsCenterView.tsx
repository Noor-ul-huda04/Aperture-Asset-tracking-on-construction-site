import React, { useState } from 'react';
import { Alert, User, Site } from '../types';
import { 
  ShieldAlert, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  UserCheck, 
  BellOff, 
  Radio, 
  Wrench, 
  Compass,
  ArrowRight
} from 'lucide-react';

interface AlertsCenterViewProps {
  alerts: Alert[];
  sites: Site[];
  users: User[];
  onUpdateAlertStatus: (alertId: string, status: Alert['status'], assignedUser?: string) => void;
}

export const AlertsCenterView: React.FC<AlertsCenterViewProps> = ({
  alerts = [],
  sites = [],
  users = [],
  onUpdateAlertStatus
}) => {
  const safeAlerts = alerts || [];
  const safeSites = sites || [];
  const safeUsers = users || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [siteFilter, setSiteFilter] = useState('ALL');

  const filteredAlerts = safeAlerts.filter(a => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (siteFilter !== 'ALL' && a.siteId !== siteFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        a.message.toLowerCase().includes(q) ||
        a.assetName?.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const criticalCount = safeAlerts.filter(a => a.severity === 'Critical' && a.status !== 'Resolved').length;
  const highCount = safeAlerts.filter(a => a.severity === 'High' && a.status !== 'Resolved').length;
  const unassignedCount = safeAlerts.filter(a => !a.assignedUser && a.status !== 'Resolved').length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-900 text-white rounded-xl">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Security & Operations Alerts Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry exception monitoring, geofence departures, safety compliance breaches, and maintenance triggers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              {criticalCount} Critical Exceptions
            </span>
          )}
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Critical Breaches</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-rose-600">{criticalCount}</span>
            <span className="text-xs text-slate-400 font-medium">Require immediate action</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">High Priority Alerts</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-600">{highCount}</span>
            <span className="text-xs text-slate-400 font-medium">Inspection & idle alerts</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Unassigned Exceptions</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-600">{unassignedCount}</span>
            <span className="text-xs text-slate-400 font-medium">Pending dispatcher</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Resolved (Today)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600">
              {alerts.filter(a => a.status === 'Resolved').length}
            </span>
            <span className="text-xs text-slate-400 font-medium">Cleared events</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alerts by asset, breach type, site, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="New">New</option>
            <option value="Investigating">Investigating</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Sites</option>
            {safeSites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerts Feed */}
      {alerts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">No active alerts.</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Security exceptions, geofence breaches, curfew violations, and maintenance triggers will appear here in real time.</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">No matching alerts</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">No alerts match the selected severity, status, or search filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
          const isCritical = alert.severity === 'Critical';
          const isHigh = alert.severity === 'High';

          return (
            <div
              key={alert.id}
              className={`p-5 rounded-2xl border bg-white shadow-xs text-left transition-all ${
                isCritical 
                  ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20' 
                  : isHigh 
                  ? 'border-amber-200' 
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <span className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                    isCritical 
                      ? 'bg-rose-600 text-white' 
                      : isHigh 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-slate-800 text-white'
                  }`}>
                    {isCritical ? <AlertOctagon className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isCritical 
                          ? 'bg-rose-100 text-rose-800' 
                          : isHigh 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {alert.severity} SEVERITY
                      </span>

                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {alert.type}
                      </span>

                      {alert.assetName && (
                        <span className="text-xs font-bold text-slate-900">
                          {alert.assetName}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-1">{alert.message}</h3>
                    {alert.description && (
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <select
                    value={alert.status || 'New'}
                    onChange={(e) => onUpdateAlertStatus(alert.id, e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Acknowledged">Acknowledged</option>
                    <option value="Investigating">Investigating</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {/* Context Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 text-xs text-slate-500">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(alert.triggeredAt).toLocaleString()}
                  </span>
                  <span>
                    Site: <strong className="text-slate-800">{alert.siteName || 'Global Fleet'}</strong>
                  </span>
                  <span>
                    Assigned: <strong className="text-slate-800">{alert.assignedUser || 'Unassigned'}</strong>
                  </span>
                </div>

                {alert.status !== 'Resolved' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateAlertStatus(alert.id, 'Resolved')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};
