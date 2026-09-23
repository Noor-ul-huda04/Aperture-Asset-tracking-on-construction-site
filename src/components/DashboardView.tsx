import React, { useState } from 'react';
import { 
  Boxes, 
  ArrowLeftRight, 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Wrench, 
  Search, 
  Layers, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Radio,
  Cpu,
  Terminal,
  BrainCircuit,
  Database,
  LayoutDashboard,
  ArrowRight,
  Sparkles,
  Zap,
  MapPin,
  AlertOctagon,
  AlertCircle,
  Info,
  Truck,
  Compass,
  FileCheck,
  Building2,
  RefreshCw,
  Eye
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Asset, Alert, ReadEvent, Site, Checkout } from '../types';

interface DashboardViewProps {
  assets: Asset[];
  alerts: Alert[];
  readEvents: ReadEvent[];
  sites: Site[];
  checkouts: Checkout[];
  onNavigateTab: (tab: any) => void;
  onOpenAssetDetail: (asset: Asset) => void;
  onOpenAlertsModal: () => void;
  currentTimezone?: string;
  onChangeTimezone?: (tz: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  assets = [],
  alerts = [],
  readEvents = [],
  sites = [],
  checkouts = [],
  onNavigateTab,
  onOpenAssetDetail,
  onOpenAlertsModal,
  currentTimezone = 'UTC',
  onChangeTimezone
}) => {
  const safeAssets = assets || [];
  const safeAlerts = alerts || [];
  const safeReadEvents = readEvents || [];
  const safeSites = sites || [];
  const safeCheckouts = checkouts || [];

  // Top 8 KPIs required in Section 3
  const totalAssetsCount = safeAssets.length;
  const activeCount = safeAssets.filter(a => a.status === 'Active' || a.status === 'In Zone').length;
  const idleCount = safeAssets.filter(a => a.status === 'Idle').length;
  const maintenanceCount = safeAssets.filter(a => a.status === 'Under Maintenance').length;
  const inTransitCount = safeAssets.filter(a => a.status === 'In Transit').length;
  const offSiteCount = safeAssets.filter(a => a.status === 'Off-Site' || a.status === 'Missing').length;
  const openAlertsCount = safeAlerts.filter(a => !a.resolved && a.status !== 'Resolved').length;
  const maintenanceDueCount = safeAssets.filter(a => {
    if (!a.nextServiceDueHours || !a.operatingHours) return false;
    return (a.nextServiceDueHours - a.operatingHours) <= 100;
  }).length;

  // Alerts breakdown
  const criticalAlerts = safeAlerts.filter(a => a.severity === 'Critical');
  const highAlerts = safeAlerts.filter(a => a.severity === 'High');
  const mediumAlerts = safeAlerts.filter(a => a.severity === 'Medium');
  const lowAlerts = safeAlerts.filter(a => a.severity === 'Low');

  // Chart data: Status breakdown
  const statusData = [
    { name: 'Active / On-Site', value: activeCount, color: '#10b981' },
    { name: 'Idle Machinery', value: idleCount, color: '#f59e0b' },
    { name: 'In Transit', value: inTransitCount, color: '#3b82f6' },
    { name: 'In Maintenance', value: maintenanceCount, color: '#8b5cf6' },
    { name: 'Off-Site / Flagged', value: offSiteCount, color: '#f43f5e' }
  ].filter(d => d.value > 0);

  // Site asset data for chart
  const siteChartData = safeSites.map(s => {
    const siteAssets = safeAssets.filter(a => a.siteId === s.id);
    const active = siteAssets.filter(a => a.status === 'Active' || a.status === 'In Zone').length;
    const idle = siteAssets.filter(a => a.status === 'Idle').length;
    return {
      name: s.name.replace('Site ', ''),
      fullName: s.name,
      total: siteAssets.length,
      active,
      idle,
      utilization: siteAssets.length > 0 ? Math.round((active / siteAssets.length) * 100) : 0
    };
  });

  // Real Activities derived from real ReadEvents and Checkouts
  const realActivities = [
    ...safeReadEvents.slice(0, 10).map(e => ({
      id: e.id,
      text: `${e.assetName || e.epc} detected by ${e.readerName || 'Reader'} in ${e.zoneName || 'Zone'}`,
      time: e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : 'Just now',
      type: 'SCAN',
      assetId: e.assetId || e.epc,
      badge: 'Portal Read'
    })),
    ...checkouts.slice(0, 10).map(c => ({
      id: c.id,
      text: `${c.assetName} checked out by ${c.workerName}`,
      time: c.checkoutTime ? new Date(c.checkoutTime).toLocaleTimeString() : 'Recent',
      type: 'CHECKOUT',
      assetId: c.assetId,
      badge: 'Custody Handover'
    }))
  ].slice(0, 6);

  // STRICT EMPTY STATE: When no real operational data is available
  if (assets.length === 0 && alerts.length === 0 && readEvents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 mx-auto flex items-center justify-center">
            <Boxes className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">No operational data available.</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Aperature Asset Tracking requires operational records from real external APIs, GPS telematics, RFID/BLE portals, or authorized manual entries.
            </p>
          </div>
          <div className="pt-3 flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => onNavigateTab('assets')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              + Register First Asset
            </button>
            <button
              onClick={() => onNavigateTab('projects')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors"
            >
              + Create Project
            </button>
            <button
              onClick={() => onNavigateTab('hardware')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors"
            >
              Configure Hardware Gateway
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Top 8 KPI Cards Grid (Section 3 requirement) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs text-left">
          <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Total Assets</span>
          <span className="text-2xl font-black text-slate-900 block mt-1">{totalAssetsCount}</span>
          <span className="text-[10px] text-slate-500 font-medium">All fleets</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs text-left">
          <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Active Assets</span>
          <span className="text-2xl font-black text-emerald-600 block mt-1">{activeCount}</span>
          <span className="text-[10px] text-emerald-700 font-medium">Operating on-site</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs text-left">
          <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Idle Assets</span>
          <span className="text-2xl font-black text-amber-600 block mt-1">{idleCount}</span>
          <span className="text-[10px] text-amber-700 font-medium">&gt;4 hrs stationary</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs text-left">
          <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">In Maintenance</span>
          <span className="text-2xl font-black text-purple-600 block mt-1">{maintenanceCount}</span>
          <span className="text-[10px] text-purple-700 font-medium">Shop / Service</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs text-left">
          <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">In Transit</span>
          <span className="text-2xl font-black text-blue-600 block mt-1">{inTransitCount}</span>
          <span className="text-[10px] text-blue-700 font-medium">Between sites</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs text-left">
          <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Off-Site / Lost</span>
          <span className="text-2xl font-black text-rose-600 block mt-1">{offSiteCount}</span>
          <span className="text-[10px] text-rose-700 font-medium">Outside bounds</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs text-left">
          <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Open Alerts</span>
          <span className="text-2xl font-black text-rose-700 block mt-1">{openAlertsCount}</span>
          <span className="text-[10px] text-slate-500 font-medium">{criticalAlerts.length} Critical</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs text-left">
          <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Maint. Due</span>
          <span className="text-2xl font-black text-amber-700 block mt-1">{maintenanceDueCount}</span>
          <span className="text-[10px] text-slate-500 font-medium">&lt;100 hrs left</span>
        </div>
      </div>

      {/* Fleet Distribution & Utilization Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Fleet Status Pie Chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-left space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <PieChart className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900">Fleet Status Distribution</h3>
                <p className="text-[11px] text-slate-500">Live equipment operational states</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('tracking')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors"
            >
              Live Map →
            </button>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {statusData.length === 0 ? (
              <div className="text-xs text-slate-400 font-mono">No asset status data recorded</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] text-slate-600 truncate">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 ml-2">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Site Asset Allocation Bar Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-left space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Building2 className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900">Site Asset Deployment</h3>
                <p className="text-[11px] text-slate-500">Active vs idle machinery per construction site</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('sites')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              All Sites →
            </button>
          </div>

          <div className="h-56 w-full">
            {siteChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">
                No site deployment data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={siteChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Bar dataKey="active" name="Active Assets" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="idle" name="Idle Assets" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Active Operating</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Stationary / Idle</span>
            </div>
            <span>{safeSites.length} Construction Projects Monitored</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Activity Feed & Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Asset Activity Feed (Section 3 Requirement) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Activity className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-black text-slate-900">Recent Asset Field Activity</h3>
            </div>
            <button
              onClick={() => onNavigateTab('movements')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              View Movements Log →
            </button>
          </div>

          <div className="space-y-3">
            {realActivities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-mono">
                No recent asset activity recorded.
              </div>
            ) : (
              realActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs hover:bg-slate-100/60 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                        {act.assetId}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {act.badge}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">{act.text}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 mt-0.5">
                    {act.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alerts Section with Distinct Severity Icons (Section 3 Requirement) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-black text-slate-900">Active Fleet Alerts</h3>
            </div>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs font-bold text-rose-600 hover:text-rose-700"
            >
              Open Alerts Center →
            </button>
          </div>

          <div className="space-y-2.5">
            {alerts.slice(0, 4).map((al) => {
              const isCrit = al.severity === 'Critical';
              const isHigh = al.severity === 'High';
              const isMed = al.severity === 'Medium';

              return (
                <div
                  key={al.id}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    isCrit ? 'bg-rose-50/70 border-rose-200 text-rose-950' :
                    isHigh ? 'bg-amber-50/70 border-amber-200 text-amber-950' :
                    'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      {isCrit && <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />}
                      {isHigh && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
                      {isMed && <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />}
                      {!isCrit && !isHigh && !isMed && <Info className="w-4 h-4 text-slate-500 shrink-0" />}
                      {al.type}
                    </span>
                    <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-white/80 border border-slate-200">
                      {al.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{al.message}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
