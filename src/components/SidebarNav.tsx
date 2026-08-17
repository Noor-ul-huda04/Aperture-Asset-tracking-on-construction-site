import React from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  MapPin, 
  ArrowLeftRight, 
  ShieldAlert, 
  PackageSearch, 
  Wrench, 
  TrendingUp, 
  Cpu, 
  FileSpreadsheet, 
  Smartphone, 
  Terminal,
  Activity,
  BrainCircuit,
  Database,
  ShieldCheck,
  UserCheck,
  History,
  FileText,
  Users,
  Settings,
  ArrowRight
} from 'lucide-react';

export type TabType = 
  | 'dashboard' 
  | 'users'
  | 'assets' 
  | 'tracking' 
  | 'checkouts' 
  | 'geofencing' 
  | 'inventory' 
  | 'maintenance' 
  | 'utilization' 
  | 'hardware' 
  | 'reports' 
  | 'mobile' 
  | 'ai_behavior'
  | 'playback'
  | 'audit'
  | 'developer'
  | 'api-logs'
  | 'settings';

interface SidebarNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  unresolvedAlertsCount: number;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onSelectTab,
  unresolvedAlertsCount
}) => {
  const categories = [
    {
      title: "Core Operations",
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
        { id: 'assets', label: 'Asset Registry', icon: <Boxes className="w-3.5 h-3.5" /> },
        { id: 'tracking', label: 'Live Map & Radar', icon: <MapPin className="w-3.5 h-3.5" /> },
        { id: 'playback', label: 'Telemetry Playback', icon: <History className="w-3.5 h-3.5" /> },
        { id: 'checkouts', label: 'Check-In / Out', icon: <ArrowLeftRight className="w-3.5 h-3.5" /> },
      ]
    },
    {
      title: "Personnel & Sites",
      items: [
        { id: 'users', label: 'People & Attendance', icon: <Users className="w-3.5 h-3.5" /> },
        { id: 'geofencing', label: 'Geofence Alerts', icon: <ShieldAlert className="w-3.5 h-3.5" />, badge: unresolvedAlertsCount },
        { id: 'inventory', label: 'Bulk Inventory', icon: <PackageSearch className="w-3.5 h-3.5" /> },
        { id: 'maintenance', label: 'Maintenance Logs', icon: <Wrench className="w-3.5 h-3.5" /> },
        { id: 'utilization', label: 'Asset Utilization', icon: <TrendingUp className="w-3.5 h-3.5" /> },
      ]
    },
    {
      title: "AI & Reporting",
      items: [
        { id: 'ai_behavior', label: 'AI Event Analytics', icon: <BrainCircuit className="w-3.5 h-3.5" /> },
        { id: 'reports', label: 'TCO & Reports', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
      ]
    },
    {
      title: "Gateways & Mobile",
      items: [
        { id: 'hardware', label: 'Reader Gateways', icon: <Cpu className="w-3.5 h-3.5" /> },
        { id: 'mobile', label: 'Field Mode (Scanner)', icon: <Smartphone className="w-3.5 h-3.5" /> },
      ]
    },
    {
      title: "Developer & Logs",
      items: [
        { id: 'developer', label: 'API Console', icon: <Terminal className="w-3.5 h-3.5" /> },
        { id: 'api-logs', label: 'API Endpoint Logs', icon: <Activity className="w-3.5 h-3.5" /> },
        { id: 'audit', label: 'Security Audit Logs', icon: <FileText className="w-3.5 h-3.5" /> },
        { id: 'settings', label: 'Settings & RBAC', icon: <Settings className="w-3.5 h-3.5" /> },
      ]
    }
  ];

  return (
    <nav className="bg-white border-r border-slate-200 w-full md:w-60 shrink-0 p-3.5 flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-y-auto sticky top-16 z-20 shadow-xs h-[calc(100vh-4rem)]">
      
      <div className="flex flex-row md:flex-col gap-4 w-full">
        {categories.map((cat, catIdx) => (
          <div key={catIdx} className="flex flex-row md:flex-col gap-1 shrink-0 md:shrink">
            <div className="hidden md:block px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              {cat.title}
            </div>
            {cat.items.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id as TabType)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <span className={isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-600'}>{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-slate-800 text-blue-300' : 'bg-red-500 text-white animate-pulse'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="hidden md:block mt-auto pt-3 border-t border-slate-100">
        <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 text-slate-700 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              Gateway status
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-normal">v4.2</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            UHF RFID & AI Safety Tracking Active
          </p>
        </div>
      </div>
    </nav>
  );
};
