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
  FolderGit2,
  Building2,
  Radio,
  QrCode,
  Shield,
  ClipboardCheck,
  Sparkles,
  Truck,
  Compass,
  Layers,
  Sliders
} from 'lucide-react';

export type TabType = 
  | 'dashboard' 
  | 'tracking'
  | 'assets' 
  | 'equipment'
  | 'vehicles'
  | 'tools'
  | 'materials'
  | 'projects'
  | 'sites'
  | 'movements'
  | 'qr_scanner'
  | 'rfid'
  | 'ble_devices'
  | 'geofences'
  | 'maintenance'
  | 'inspections'
  | 'work_orders'
  | 'alerts'
  | 'analytics'
  | 'ai_insights'
  | 'reports'
  | 'users_roles'
  | 'settings'
  // Legacy aliases
  | 'rfid_qr'
  | 'hardware'
  | 'mobile'
  | 'developer'
  | 'api-logs'
  | 'checkouts'
  | 'playback'
  | 'inventory'
  | 'geofencing'
  | 'users'
  | 'audit'
  | 'ai_behavior'
  | 'utilization';

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
  // Navigation modules
  const navigationGroups = [
    {
      title: "Core Operations",
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'tracking', label: 'Live Tracking', icon: <MapPin className="w-4 h-4" /> },
      ]
    },
    {
      title: "Asset Catalog",
      items: [
        { id: 'assets', label: 'Assets (All)', icon: <Boxes className="w-4 h-4" /> },
        { id: 'equipment', label: 'Equipment', icon: <Compass className="w-4 h-4" /> },
        { id: 'vehicles', label: 'Vehicles', icon: <Truck className="w-4 h-4" /> },
        { id: 'tools', label: 'Tools', icon: <Wrench className="w-4 h-4" /> },
        { id: 'materials', label: 'Materials', icon: <PackageSearch className="w-4 h-4" /> },
      ]
    },
    {
      title: "Projects & Sites",
      items: [
        { id: 'projects', label: 'Projects', icon: <FolderGit2 className="w-4 h-4" /> },
        { id: 'sites', label: 'Construction Sites', icon: <Building2 className="w-4 h-4" /> },
      ]
    },
    {
      title: "Telemetry & Hardware",
      items: [
        { id: 'movements', label: 'Asset Movements', icon: <ArrowLeftRight className="w-4 h-4" /> },
        { id: 'qr_scanner', label: 'QR Scanner', icon: <QrCode className="w-4 h-4" /> },
        { id: 'rfid', label: 'RFID Tracking', icon: <Radio className="w-4 h-4" /> },
        { id: 'ble_devices', label: 'BLE Devices', icon: <Cpu className="w-4 h-4" /> },
        { id: 'geofences', label: 'Geofences', icon: <Shield className="w-4 h-4" /> },
      ]
    },
    {
      title: "Fleet Maintenance & Safety",
      items: [
        { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-4 h-4" /> },
        { id: 'inspections', label: 'Inspections', icon: <ClipboardCheck className="w-4 h-4" /> },
        { id: 'work_orders', label: 'Work Orders', icon: <FileText className="w-4 h-4" /> },
        { 
          id: 'alerts', 
          label: 'Alerts', 
          icon: <ShieldAlert className="w-4 h-4" />, 
          badge: unresolvedAlertsCount 
        },
      ]
    },
    {
      title: "Intelligence & Governance",
      items: [
        { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
        { id: 'ai_insights', label: 'AI Insights', icon: <Sparkles className="w-4 h-4" /> },
        { id: 'reports', label: 'Reports', icon: <FileSpreadsheet className="w-4 h-4" /> },
        { id: 'users_roles', label: 'Users & Roles', icon: <Users className="w-4 h-4" /> },
        { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
      ]
    }
  ];

  return (
    <nav className="bg-white border-r border-slate-200 w-full md:w-64 shrink-0 p-3 flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-y-auto sticky top-16 z-20 shadow-xs h-[calc(100vh-4rem)]">
      <div className="flex flex-row md:flex-col gap-3 w-full pb-8">
        {navigationGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="flex flex-row md:flex-col gap-0.5 shrink-0 md:shrink">
            <div className="hidden md:block px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
              {group.title}
            </div>
            {group.items.map((item) => {
              const isActive = activeTab === item.id || (item.id === 'rfid' && activeTab === 'rfid_qr');
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id as TabType)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 whitespace-nowrap text-left w-full ${
                    isActive
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                  }`}
                >
                  <span className={isActive ? 'text-amber-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-slate-800 text-amber-300' : 'bg-rose-600 text-white animate-pulse'
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
    </nav>
  );
};
