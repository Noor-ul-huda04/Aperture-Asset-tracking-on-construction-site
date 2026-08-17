import React, { useState } from 'react';
import { 
  DollarSign, 
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
  Zap
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
  Legend,
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
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  assets,
  alerts,
  readEvents,
  sites,
  checkouts,
  onNavigateTab,
  onOpenAssetDetail,
  onOpenAlertsModal
}) => {
  const totalValue = (assets || []).reduce((sum, a) => sum + (a.cost || 125000), 0);
  const checkedOutCount = (assets || []).filter(a => a.status === 'Checked Out' || a.status === 'CHECKED_OUT' || a.status === 'IN_USE').length;
  const inZoneCount = (assets || []).filter(a => a.status === 'In Zone' || a.status === 'ACTIVE' || a.status === 'AVAILABLE').length;
  const missingCount = (assets || []).filter(a => a.status === 'Missing' || a.status === 'LOST').length;
  const maintCount = (assets || []).filter(a => a.status === 'Under Maintenance' || a.status === 'MAINTENANCE' || a.status === 'PENDING').length;
  const totalAssets = (assets || []).length;

  const unresolvedAlerts = (alerts || []).filter(a => !a.resolved && a.status !== 'RESOLVED');
  const criticalAlerts = unresolvedAlerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH');

  // Chart data: Status breakdown
  const statusData = [
    { name: 'In Zone', value: inZoneCount || (totalAssets > 0 ? totalAssets - checkedOutCount - maintCount - missingCount : 0), color: '#10b981' },
    { name: 'Checked Out', value: checkedOutCount, color: '#3b82f6' },
    { name: 'Under Maintenance', value: maintCount, color: '#f59e0b' },
    { name: 'Missing / Flagged', value: missingCount, color: '#ef4444' }
  ];

  // Category breakdown data
  const categoryMap: Record<string, number> = {};
  (assets || []).forEach(a => {
    const cat = a.category || 'General Equipment';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryData = Object.keys(categoryMap).map(cat => ({
    name: cat,
    count: categoryMap[cat]
  }));

  // Site Asset Utilization data for recharts
  const siteUtilizationData = (sites || []).map(s => {
    const siteAssets = (assets || []).filter(a => a.siteId === s.id || a.siteName === s.name);
    const total = siteAssets.length;
    const checkedOut = siteAssets.filter(a => a.status === 'Checked Out' || a.status === 'CHECKED_OUT' || a.status === 'IN_USE').length;
    const inZone = siteAssets.filter(a => a.status === 'In Zone' || a.status === 'ACTIVE' || a.status === 'AVAILABLE').length;
    const maint = siteAssets.filter(a => a.status === 'Under Maintenance' || a.status === 'MAINTENANCE' || a.status === 'PENDING').length;
    const missing = siteAssets.filter(a => a.status === 'Missing' || a.status === 'LOST').length;
    const utilizationRate = total > 0 ? Math.round((checkedOut / total) * 100) : 50;

    return {
      name: s.name ? (s.name.length > 18 ? `${s.name.slice(0, 16)}...` : s.name) : 'Unnamed Site',
      fullName: s.name || 'Unnamed Site',
      code: s.code || s.id,
      utilizationRate,
      checkedOut,
      inZone,
      maint,
      missing,
      totalAssets: total
    };
  });

  const avgUtilizationRate = siteUtilizationData.length > 0
    ? Math.round(siteUtilizationData.reduce((acc, curr) => acc + curr.utilizationRate, 0) / siteUtilizationData.length)
    : 0;

  const CustomUtilizationTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-white text-xs space-y-1.5">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5">
            <span className="font-bold text-slate-100">{data.fullName}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 bg-blue-900/80 text-blue-300 rounded border border-blue-700">
              {data.code}
            </span>
          </div>
          <div className="font-mono text-[11px] space-y-1">
            <div className="flex justify-between gap-4 text-blue-400 font-bold">
              <span>Utilization Rate:</span>
              <span>{data.utilizationRate}%</span>
            </div>
            <div className="flex justify-between gap-4 text-slate-300">
              <span>Active Checked Out:</span>
              <span className="font-bold">{data.checkedOut} / {data.totalAssets}</span>
            </div>
            <div className="flex justify-between gap-4 text-emerald-400">
              <span>In Zone (Laydown Yard):</span>
              <span>{data.inZone}</span>
            </div>
            {data.maint > 0 && (
              <div className="flex justify-between gap-4 text-amber-400">
                <span>Under Maintenance:</span>
                <span>{data.maint}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Critical Notice if alerts exist */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-950/80 border border-red-600/60 rounded-xl p-4 flex items-center justify-between gap-4 text-red-200 shadow-lg shadow-red-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600/30 rounded-lg text-red-400 animate-pulse">
              <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-red-100 flex items-center gap-2">
                CRITICAL SECURITY ALERT DETECTED ({criticalAlerts.length})
              </h3>
              <p className="text-xs text-red-300/90 mt-0.5">
                {criticalAlerts[0].message}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAlertsModal}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition-colors shrink-0 flex items-center gap-1.5"
          >
            <span>Resolve Alerts</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Tracked Value</p>
            <p className="text-3xl font-black text-slate-900 font-mono mt-1.5 leading-none">
              ${(totalValue / 1000).toFixed(1)}k
            </p>
            <p className="text-xs text-blue-600 mt-2 flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{totalAssets} Total Assets Tagged</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <DollarSign className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Checked Out / Active</p>
            <p className="text-3xl font-black text-blue-600 font-mono mt-1.5 leading-none">
              {checkedOutCount}
            </p>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              <span className="font-bold text-slate-700">{Math.round((checkedOutCount / (totalAssets || 1)) * 100)}%</span> Current Utilization
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
            <ArrowLeftRight className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Present In Laydown / Crib</p>
            <p className="text-3xl font-black text-emerald-600 font-mono mt-1.5 leading-none">
              {inZoneCount}
            </p>
            <p className="text-xs text-emerald-600 mt-2 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified RFID Portal</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Boxes className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Missing / Loss Risk</p>
            <p className={`text-3xl font-black font-mono mt-1.5 leading-none ${missingCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {missingCount}
            </p>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {missingCount > 0 ? 'Zone audit recommended' : '0% Asset Loss Rate'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            missingCount > 0 
              ? 'bg-rose-50 border border-rose-100 text-rose-600 animate-pulse' 
              : 'bg-slate-50 border border-slate-100 text-slate-400'
          }`}>
            <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

      </div>

      {/* AI Behavioral Analytics & Reports Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div 
          onClick={() => onNavigateTab('ai_behavior')}
          className="bg-white hover:bg-slate-50/50 border border-slate-200/60 hover:border-blue-400/80 rounded-2xl p-5 cursor-pointer transition-all shadow-sm hover:shadow-md group flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 group-hover:scale-105 transition-transform shrink-0">
              <BrainCircuit className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block font-mono">
                AI BEHAVIOR ENGINE
              </span>
              <h4 className="font-bold text-slate-900 text-sm mt-0.5 group-hover:text-blue-600 transition-colors">Analyze Event Stream Behavior</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Detect zone-hopping, dwell time spikes, and anomaly threat scores using Gemini AI</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
        </div>

        <div 
          onClick={() => onNavigateTab('reports')}
          className="bg-white hover:bg-slate-50/50 border border-slate-200/60 hover:border-emerald-400/80 rounded-2xl p-5 cursor-pointer transition-all shadow-sm hover:shadow-md group flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 group-hover:scale-105 transition-transform shrink-0">
              <TrendingUp className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block font-mono">
                REPORTS & COST ANALYTICS
              </span>
              <h4 className="font-bold text-slate-900 text-sm mt-0.5 group-hover:text-emerald-600 transition-colors">Asset Utilization & TCO Metrics</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Generate operational lifecycle reports and track total cost of ownership across sites</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
        </div>
      </div>

      {/* Main Grid: Charts & Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Status & Category Analytics Charts */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Status Breakdown & Category Distribution */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Asset Distribution & Real-Time Analytics</span>
                </h2>
                <p className="text-xs text-slate-500">Live RFID status breakdown across all connected job sites</p>
              </div>
              <button
                onClick={() => onNavigateTab('assets')}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 transition-colors"
              >
                <span>View All Assets</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Pie Chart */}
              <div className="h-56 w-full flex flex-col items-center justify-center relative min-h-[224px]">
                <ResponsiveContainer width="100%" height={220} minWidth={100} minHeight={200} initialDimension={{ width: 300, height: 220 }}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', fontSize: '11px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center">
                  <span className="text-2xl font-black font-mono text-slate-900 block leading-none">{totalAssets}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider font-sans mt-0.5 block">Total Tags</span>
                </div>
              </div>

              {/* Legend & Summary List */}
              <div className="flex flex-col justify-center space-y-2.5">
                {statusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-200/40 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-semibold text-slate-700">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200/50 shadow-2xs">{item.value}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Site Asset Utilization Rate Chart (Recharts) */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Site Asset Utilization Percentages</span>
                </h3>
                <p className="text-xs text-slate-500">Active checked-out asset utilization rates per construction job site</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right font-mono bg-blue-50/60 border border-blue-100/80 px-3.5 py-1.5 rounded-xl">
                  <span className="text-[9px] text-slate-400 uppercase block font-sans font-bold tracking-wider">Fleet Average</span>
                  <span className="text-sm font-black text-blue-700">{avgUtilizationRate}% Utilization</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full pt-2 min-h-[256px]">
              <ResponsiveContainer width="100%" height={250} minWidth={100} minHeight={200} initialDimension={{ width: 500, height: 250 }}>
                <BarChart data={siteUtilizationData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                    interval={0}
                    angle={-10}
                    textAnchor="end"
                  />
                  <YAxis 
                    unit="%" 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                  />
                  <Tooltip content={<CustomUtilizationTooltip />} />
                  <ReferenceLine y={60} label={{ value: '60% Target', fill: '#059669', fontSize: 9, fontWeight: 'bold', position: 'insideTopRight' }} stroke="#059669" strokeDasharray="3 3" />
                  <Bar 
                    dataKey="utilizationRate" 
                    name="Utilization Rate (%)" 
                    fill="#3b82f6" 
                    radius={[6, 6, 0, 0]} 
                  >
                    {siteUtilizationData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.utilizationRate >= 60 ? '#1d4ed8' : entry.utilizationRate >= 40 ? '#0284c7' : '#f59e0b'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-700 inline-block" />
                  <span className="text-slate-600 font-semibold">High (&gt;60%)</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-600 inline-block" />
                  <span className="text-slate-600 font-semibold">Moderate (40-60%)</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                  <span className="text-slate-600 font-semibold">Low (&lt;40%)</span>
                </span>
              </div>
              <button 
                onClick={() => onNavigateTab('reports')}
                className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 transition-colors"
              >
                <span>Detailed Utilization Reports</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Site Overview List */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center justify-between font-mono">
              <span>Active Construction Sites ({(sites || []).length})</span>
              <button onClick={() => onNavigateTab('tracking')} className="text-xs text-blue-600 hover:text-blue-700 font-bold transition-colors">
                View Site Maps →
              </button>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(sites || []).map(s => {
                const siteAssets = (assets || []).filter(a => a.siteId === s.id);
                const siteValue = siteAssets.reduce((sum, a) => sum + (a.cost || 125000), 0);
                return (
                  <div key={s.id} className="bg-slate-50/50 border border-slate-200/40 rounded-xl p-4 space-y-2 hover:border-blue-400/80 hover:bg-slate-50 transition-all shadow-2xs group">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-800 group-hover:text-blue-700 transition-colors">{s.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50/80 text-blue-800 border border-blue-100/60 rounded font-bold">
                        {s.code || s.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{s.location || s.address || 'Active Site'}</p>
                    <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Assets: <strong className="text-slate-800 font-bold font-mono">{siteAssets.length}</strong></span>
                      <span className="text-slate-500">Value: <strong className="text-emerald-600 font-bold font-mono">${(siteValue/1000).toFixed(0)}k</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Live RFID Event Feed Stream */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex flex-col h-[520px] shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
              <h2 className="font-bold text-base text-slate-900">Real-Time RFID Read Stream</h2>
            </div>
            <span className="text-[10px] font-mono bg-blue-50/80 text-blue-800 border border-blue-100/60 px-2 py-1 rounded-md font-bold flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              860-960 MHz
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {(readEvents || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
                <Radio className="w-6 h-6 animate-pulse text-slate-300" />
                <p className="text-xs text-slate-400 text-center font-medium">Waiting for real-time gateway RFID reads...</p>
              </div>
            ) : (
              (readEvents || []).slice(0, 15).map((evt: any) => {
                const isBreach = evt.eventType === 'GEOFENCE_BREACH' || evt.type === 'GEOFENCE_BREACH';
                return (
                  <div 
                    key={evt.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all shadow-2xs ${
                      isBreach
                        ? 'bg-rose-50/80 border-rose-200/80 text-rose-900 hover:border-rose-300'
                        : 'bg-slate-50/40 border-slate-200/40 text-slate-800 hover:bg-slate-50 hover:border-blue-400/80 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 truncate max-w-[170px]">
                        {evt.assetName || evt.assetId || evt.tagId || 'RFID Tag Detected'}
                      </span>
                      <span className="text-[10px] font-mono font-medium text-slate-400 shrink-0">
                        {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate font-medium">{evt.readerName || evt.readerId || 'Gate RFID Reader'}</span>
                      <span className="font-mono text-blue-900 font-bold bg-blue-50/50 border border-blue-100/40 px-1.5 py-0.2 rounded">{evt.rssi ? `${evt.rssi} dBm` : '-42 dBm'}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 text-slate-400 border-t border-slate-200/50">
                      <span className="truncate select-all">Tag: {evt.tagId || evt.epc || 'N/A'}</span>
                      <span className="text-slate-600 font-semibold">{evt.location || evt.zoneName || evt.siteId || 'Active Zone'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3.5 border-t border-slate-100 mt-3 flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono text-[10px] text-slate-400">UHF RFID Engine v4.2</span>
            <button
              onClick={() => onNavigateTab('api-logs')}
              className="text-blue-600 hover:text-blue-700 font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>API Endpoint Log</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
