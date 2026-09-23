import React, { useState, useRef, useEffect } from 'react';
import { 
  Radio, 
  ShieldAlert, 
  Smartphone, 
  Cpu, 
  Building2, 
  UserCheck, 
  Bell, 
  Wifi, 
  WifiOff, 
  Database,
  ExternalLink,
  Flame,
  LogIn,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Globe,
  HardHat,
  ChevronDown,
  Shield,
  QrCode,
  Search,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
  Boxes,
  Compass,
  X
} from 'lucide-react';
import { Site, User, Alert, Asset } from '../types';

interface HeaderProps {
  sites: Site[];
  selectedSiteId: string;
  onSelectSite: (id: string) => void;
  alerts: Alert[];
  onOpenAlertsModal: () => void;
  onOpenHardwareDrawer: () => void;
  onOpenMobileView: () => void;
  currentUser: User;
  onSwitchUserRole: (user: User) => void;
  allUsers: User[];
  isStreaming: boolean;
  offlineMode: boolean;
  isFirestoreOnline?: boolean;
  onManualSync?: () => void;
  isSyncing?: boolean;
  lastSyncedAt?: string | null;
  onNavigateTab?: (tab: any) => void;
  currentTimezone?: string;
  onChangeTimezone?: (tz: string) => void;
  onLogout?: () => void;
  assets?: Asset[];
  onSelectAsset?: (asset: Asset) => void;
  isSimulationActive?: boolean;
  onToggleSimulation?: () => void;
  onResetSimulation?: () => void;
  onGenerateSimulationEvent?: (eventType: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  sites = [],
  selectedSiteId,
  onSelectSite,
  alerts = [],
  onOpenAlertsModal,
  onOpenHardwareDrawer,
  onOpenMobileView,
  currentUser,
  onSwitchUserRole,
  allUsers = [],
  isStreaming,
  offlineMode,
  isFirestoreOnline = true,
  onManualSync,
  isSyncing = false,
  lastSyncedAt,
  onNavigateTab,
  currentTimezone = 'UTC',
  onChangeTimezone,
  onLogout,
  assets = [],
  onSelectAsset,
  apiConnectionStatus = 'checking',
  apiStatusMessage = 'Checking API connection...'
}: HeaderProps & { apiConnectionStatus?: 'connected' | 'not_connected' | 'no_data' | 'checking'; apiStatusMessage?: string }) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const unresolvedAlerts = alerts.filter(a => !a.resolved && (a as any).status !== 'Resolved');
  const criticalCount = unresolvedAlerts.filter(a => a.severity === 'Critical').length;

  // Global search filtering
  const searchResults = searchQuery.trim().length > 0 
    ? assets.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.tagEpc && a.tagEpc.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.qrCode && a.qrCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.siteName && a.siteName.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 6)
    : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Left: Exact Product Name & Subtitle + Site Context Selector */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div 
            onClick={() => onNavigateTab && onNavigateTab('dashboard')}
            className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 ring-1 ring-amber-400 shrink-0 cursor-pointer"
          >
            <HardHat className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div 
            onClick={() => onNavigateTab && onNavigateTab('dashboard')}
            className="flex flex-col justify-center cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="font-black tracking-tight text-base sm:text-lg text-white font-sans whitespace-nowrap leading-none">
                Aperature Asset Tracking
              </span>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider font-mono whitespace-nowrap hidden sm:inline-block">
                IoT Enterprise
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-normal text-left whitespace-nowrap mt-0.5 hidden sm:block">
              Real-Time Construction Site Asset Tracking & Management
            </span>
          </div>

          {/* Site Context Selector */}
          <div className="hidden xl:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 shrink-0 ml-1">
            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={selectedSiteId}
              onChange={(e) => onSelectSite(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Sites ({(sites || []).length})</option>
              {(sites || []).map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Middle: Global Search Bar (Section 3 Requirement) */}
        <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assets, equipment, RFID tags, serials, sites..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              className="w-full pl-9 pr-8 py-1.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Global Search Results Dropdown */}
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 text-xs divide-y divide-slate-800/60">
              <div className="px-3 py-1.5 bg-slate-950 text-[10px] font-mono text-slate-400 font-bold uppercase">
                Matching Assets ({searchResults.length})
              </div>
              {searchResults.map(a => (
                <button
                  key={a.id}
                  onClick={() => {
                    if (onSelectAsset) onSelectAsset(a);
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <img src={a.photoUrl} alt="" className="w-7 h-7 rounded-lg object-cover border border-slate-700 shrink-0" />
                    <div className="truncate">
                      <div className="font-bold text-slate-200 truncate">{a.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {a.id} • {a.siteName} ({a.zoneName})
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 ${
                    a.status === 'Active' || a.status === 'In Zone'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : a.status === 'Maintenance'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {a.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Real API / Hardware Live Status + Alerts + User */}
        <div className="flex items-center gap-2">
          
          {/* Live Hardware & API Connection Status Indicator */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenHardwareDrawer}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                apiConnectionStatus === 'connected'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                  : apiConnectionStatus === 'no_data'
                  ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-850'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/50'
              }`}
              title="Hardware Gateway & API Connection Status"
            >
              <span className="relative flex h-2 w-2">
                {apiConnectionStatus === 'connected' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  apiConnectionStatus === 'connected'
                    ? 'bg-emerald-500'
                    : apiConnectionStatus === 'no_data'
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}></span>
              </span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                {apiStatusMessage || (apiConnectionStatus === 'connected' ? 'API Connected' : 'API not connected.')}
              </span>
            </button>
          </div>

          {/* Manual Refresh / Sync Button */}
          {onManualSync && (
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
              title="Fetch latest updates from database & API"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          )}

          {/* Quick QR Scanner Link */}
          <button
            onClick={onOpenMobileView}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition-colors"
            title="Mobile QR Scanner"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline text-[11px]">QR Scan</span>
          </button>

          {/* Hardware Telemetry Drawer Toggle */}
          <button
            onClick={onOpenHardwareDrawer}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition-colors"
            title="IoT Gateways & Readers"
          >
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden lg:inline text-[11px]">Hardware</span>
          </button>

          {/* Alerts Bell */}
          <button
            onClick={onOpenAlertsModal}
            className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Active Alerts"
          >
            <Bell className="w-4 h-4" />
            {unresolvedAlerts.length > 0 && (
              <span className={`absolute -top-1 -right-1 text-[9px] font-bold font-mono px-1.5 py-0.2 rounded-full text-white ${
                criticalCount > 0 ? 'bg-rose-600 animate-pulse' : 'bg-amber-600'
              }`}>
                {unresolvedAlerts.length}
              </span>
            )}
          </button>

          {/* User Persona / RBAC Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors text-left"
            >
              <img
                src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
                alt={currentUser?.name}
                className="w-6 h-6 rounded-lg object-cover ring-1 ring-amber-400/50 shrink-0"
              />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-200 truncate max-w-[110px] leading-tight">
                  {currentUser?.name || 'Admin User'}
                </div>
                <div className="text-[10px] text-amber-400 font-mono truncate max-w-[110px] leading-tight">
                  {currentUser?.role || 'Project Manager'}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">Logged In As</p>
                  <p className="font-bold text-white text-sm mt-0.5">{currentUser?.name}</p>
                  <p className="text-slate-400 text-[11px] truncate">{currentUser?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30">
                    Role: {currentUser?.role}
                  </span>
                </div>

                <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-400 font-bold">
                  Switch Role / Persona (Preview)
                </div>

                <div className="max-h-48 overflow-y-auto px-1 space-y-0.5">
                  {(allUsers || []).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUserRole(u);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                        u.id === currentUser?.id ? 'bg-amber-400/10 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate">
                        <span className="block truncate">{u.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">{u.role}</span>
                      </div>
                      {u.id === currentUser?.id && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </button>
                  ))}
                </div>

                {onNavigateTab && (
                  <div className="pt-2 border-t border-slate-800 px-2 space-y-1">
                    <button
                      onClick={() => {
                        onNavigateTab('users_roles');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                      <span>Manage Users & Roles (RBAC)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
