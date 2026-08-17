import React from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { Site, User, Alert } from '../types';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';

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
}

export const Header: React.FC<HeaderProps> = ({
  sites,
  selectedSiteId,
  onSelectSite,
  alerts,
  onOpenAlertsModal,
  onOpenHardwareDrawer,
  onOpenMobileView,
  currentUser,
  onSwitchUserRole,
  allUsers,
  isStreaming,
  offlineMode,
  isFirestoreOnline = true,
  onManualSync,
  isSyncing = false,
  lastSyncedAt,
  onNavigateTab
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const unresolvedAlerts = (alerts || []).filter(a => !a.resolved && (a as any).status !== 'RESOLVED');
  const criticalCount = unresolvedAlerts.filter(a => a.severity === 'CRITICAL').length;
  const { user: fbUser, authReady, signInWithGoogle, signOut } = useFirebaseAuth();

  return (
    <header className="bg-slate-950 border-b border-slate-800/60 text-white sticky top-0 z-30 shadow-md backdrop-blur-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand & Site Context Selector */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/10 ring-1 ring-blue-400/40 shrink-0">
            <Radio className="w-5 h-5 stroke-[2.2] animate-pulse" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="font-black tracking-widest text-base sm:text-lg text-white font-mono whitespace-nowrap leading-none">APERTURE</span>
              <span className="bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 font-mono whitespace-nowrap">
                <Flame className="w-3 h-3 text-blue-400 fill-blue-400" /> RFID UHF
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-normal text-left whitespace-nowrap mt-0.5">
              Enterprise Asset Intelligence
            </span>
          </div>
 
          {/* Site Context Selector */}
          <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800/80 rounded-xl px-3 py-1.5 shrink-0 ml-2 shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <select
              value={selectedSiteId}
              onChange={(e) => onSelectSite(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer truncate max-w-[140px] lg:max-w-[180px]"
            >
              <option value="ALL" className="bg-slate-950 text-white font-semibold">All Sites (Multi-Site)</option>
              {(sites || []).map(s => (
                <option key={s.id} value={s.id} className="bg-slate-950 text-white font-semibold">
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Clean, Essential Actions & Status */}
        <div className="flex items-center gap-2.5 shrink-0 ml-auto">

          {/* Postman API Connection Badge & Quick Refresh */}
          <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 p-1 rounded-xl shrink-0">
            <div 
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono font-medium border transition-all whitespace-nowrap ${
                isFirestoreOnline
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                  : 'bg-amber-950/80 text-amber-300 border-amber-700/60'
              }`}
              title={isFirestoreOnline ? 'Live API Connected' : 'Working in Offline Mode'}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isFirestoreOnline ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isFirestoreOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">{isFirestoreOnline ? 'API Live' : 'Offline'}</span>
            </div>

            {onManualSync && (
              <button
                onClick={onManualSync}
                disabled={isSyncing}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-xs px-2 py-1 rounded-lg transition-all shadow-xs disabled:opacity-50 shrink-0 whitespace-nowrap"
                title={lastSyncedAt ? `Refresh Live API (Last: ${lastSyncedAt})` : 'Refresh Live API data'}
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">{isSyncing ? 'Refreshing' : 'Refresh'}</span>
              </button>
            )}
          </div>

          {/* Handheld Field Scanner Quick Button */}
          <button
            onClick={onOpenMobileView}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-colors shrink-0 whitespace-nowrap"
            title="Open Mobile Field Scanner Simulator"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="hidden lg:inline">Scanner</span>
          </button>

          {/* Active Alerts Bell Button */}
          <button
            onClick={onOpenAlertsModal}
            className="relative p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors shrink-0"
            title="View Active System Alerts"
          >
            <Bell className="w-4 h-4" />
            {unresolvedAlerts.length > 0 && (
              <span className={`absolute -top-1 -right-1 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center text-white ${
                criticalCount > 0 ? 'bg-red-600 animate-bounce' : 'bg-blue-500'
              }`}>
                {unresolvedAlerts.length}
              </span>
            )}
          </button>

          {/* User Persona & Role Switcher */}
          <div className="relative group shrink-0">
            <button 
              onClick={() => setUserDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-2 py-1.5 transition-colors cursor-pointer"
              title="Switch user role persona"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-5 h-5 rounded-full object-cover border border-blue-400 shrink-0"
              />
              <span className="text-xs font-semibold text-slate-200 hidden md:inline whitespace-nowrap">{currentUser.name}</span>
            </button>

            {/* Dropdown menu */}
            <div className={`absolute right-0 top-full mt-1 w-60 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50 ${userDropdownOpen ? 'block' : 'hidden group-hover:block'}`}>
              {onNavigateTab && (
                <div className="p-1.5 border-b border-slate-800">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigateTab('users');
                    }}
                    className="w-full text-left px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-between transition-colors shadow-xs"
                  >
                    <span className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      User Portal & Account
                    </span>
                    <ExternalLink className="w-3 h-3 text-blue-200" />
                  </button>
                </div>
              )}
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Quick Persona Switcher
              </div>
              {(allUsers || []).map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    onSwitchUserRole(u);
                    setUserDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    u.id === currentUser.id ? 'bg-blue-900/60 text-blue-200 font-bold' : 'text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img src={u.avatarUrl} className="w-5 h-5 rounded-full object-cover shrink-0" />
                    <div>
                      <p className="leading-none">{u.name}</p>
                      <p className="text-[10px] text-slate-400 leading-tight">{u.role}</p>
                    </div>
                  </div>
                  {u.id === currentUser.id && <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
