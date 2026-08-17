import React, { useState } from 'react';
import { 
  User, 
  UserRole, 
  Checkout, 
  MaintenanceLog, 
  Site, 
  AuditLog 
} from '../types';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';
import { 
  UserCheck, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  Plus, 
  ArrowRight, 
  Wrench, 
  BadgeCheck, 
  KeyRound, 
  Smartphone, 
  Building2, 
  Clock, 
  HardHat, 
  CheckCircle2, 
  Search, 
  Edit3, 
  Trash2, 
  Sparkles,
  Database,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import { createUser, updateUser, deleteUser } from '../services/api';

interface UserPortalViewProps {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  sites: Site[];
  checkouts: Checkout[];
  maintenanceLogs: MaintenanceLog[];
  auditLogs: AuditLog[];
  onNavigateTab: (tab: any) => void;
  onReturnCheckout?: (checkoutId: string, condition?: string) => Promise<void> | void;
}

export const UserPortalView: React.FC<UserPortalViewProps> = ({
  currentUser,
  setCurrentUser,
  users,
  sites,
  checkouts,
  maintenanceLogs,
  auditLogs,
  onNavigateTab,
  onReturnCheckout
}) => {
  const { user: firebaseUser, authReady, signInWithGoogle, signOut: firebaseSignOut } = useFirebaseAuth();

  // Local state for User Directory Management
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // New user form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Field Worker' as UserRole,
    siteAccess: ['site-1'],
    badgeId: '',
    phone: '',
    avatarUrl: ''
  });

  const [saving, setSaving] = useState(false);
  const [dbMessage, setDbMessage] = useState<string | null>(null);

  // Sync Google Auth user with Firestore when available
  React.useEffect(() => {
    if (firebaseUser) {
      const googleSyncedUser: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Google Authenticated User',
        email: firebaseUser.email || 'user@apertureconst.com',
        role: 'Site Manager',
        siteAccess: ['site-1', 'site-2', 'site-3'],
        badgeId: `BDG-${firebaseUser.uid.substring(0, 5).toUpperCase()}`,
        avatarUrl: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        phone: firebaseUser.phoneNumber || '+1 (555) 890-1234'
      };
      
      setCurrentUser(googleSyncedUser);
      // Persist user to database
      updateUser(googleSyncedUser.id, googleSyncedUser).then(() => {
        setDbMessage(`Synced Google Account (${firebaseUser.email})`);
        setTimeout(() => setDbMessage(null), 4000);
      }).catch(err => console.error('Error syncing user:', err));
    }
  }, [firebaseUser]);

  // Active checkouts for the logged in user
  const userCheckouts = (checkouts || []).filter(c => c.status === 'ACTIVE' && (c.userId === currentUser?.id || c.userName === currentUser?.name));

  // Maintenance tasks assigned to user
  const userMaintenance = (maintenanceLogs || []).filter(m => m.technician === currentUser?.name || (m.technician && currentUser?.name && m.technician.includes(currentUser.name.split(' ')[0])));

  // User audit history
  const userLogs = (auditLogs || []).filter(l => l.userId === currentUser?.id || l.userName === currentUser?.name);

  // Filtered users for directory
  const filteredUsers = (users || []).filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.badgeId || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSelectPersona = (u: User) => {
    setCurrentUser(u);
    updateUser(u.id, u).then(() => {
      setDbMessage(`Active persona updated to ${u.name}`);
      setTimeout(() => setDbMessage(null), 3000);
    }).catch(console.error);
  };

  const handleSaveUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
        setDbMessage(`Updated user ${formData.name}`);
      } else {
        const created = await createUser(formData);
        setDbMessage(`Created new user ${created.name}`);
      }
      setNewUserModalOpen(false);
      setEditingUser(null);
      resetForm();
    } catch (err) {
      console.error('Error saving user:', err);
    } finally {
      setSaving(false);
      setTimeout(() => setDbMessage(null), 4000);
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (confirm(`Are you sure you want to remove user "${userToDelete.name}" from the database?`)) {
      try {
        await deleteUser(userToDelete.id);
        setDbMessage(`Removed user ${userToDelete.name}`);
        setTimeout(() => setDbMessage(null), 3000);
      } catch (err) {
        console.error('Error deleting user:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'Field Worker',
      siteAccess: ['site-1'],
      badgeId: `BDG-${Math.floor(1000 + Math.random() * 9000)}`,
      phone: '+1 (555) ' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(1000 + Math.random() * 9000),
      avatarUrl: ''
    });
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      siteAccess: u.siteAccess,
      badgeId: u.badgeId,
      phone: u.phone || '',
      avatarUrl: u.avatarUrl || ''
    });
    setNewUserModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Toast Notification for Firestore database updates */}
      {dbMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{dbMessage}</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">SYSTEM SYNCED</span>
        </div>
      )}

      {/* SECTION 1: AUTHENTICATION & LOGIN HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                <UserCheck className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight font-mono text-white">USER AUTHENTICATION & PORTAL</h2>
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase font-mono">
                    Cloud Sync Active
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Authenticate credentials, manage site security access, and enter the active asset tracking system.
                </p>
              </div>
            </div>
          </div>

          {/* Authentication Action Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {firebaseUser ? (
              <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/80 px-3.5 py-2 rounded-xl">
                <img 
                  src={firebaseUser.photoURL || currentUser.avatarUrl} 
                  alt="Auth User" 
                  className="w-8 h-8 rounded-full border border-blue-400 object-cover" 
                />
                <div className="text-left leading-tight">
                  <p className="text-xs font-bold text-white flex items-center gap-1">
                    {firebaseUser.displayName || firebaseUser.email}
                    <BadgeCheck className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">Google Auth UID: {firebaseUser.uid.substring(0, 10)}...</p>
                </div>
                <button
                  type="button"
                  onClick={() => firebaseSignOut()}
                  className="ml-2 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 border border-slate-300"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Log In with Google</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                resetForm();
                setEditingUser(null);
                setNewUserModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Register New User</span>
            </button>
          </div>

        </div>

        {/* Quick Persona Account Selector */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2.5">
            <span className="flex items-center gap-1.5 font-mono uppercase text-[11px] text-slate-300">
              <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              Switch Active User Persona (Database Profiles):
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{(users || []).length} Database Users Registered</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {(users || []).slice(0, 5).map((u) => {
              const isSelected = currentUser.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => handleSelectPersona(u)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                    isSelected 
                      ? 'bg-blue-600/30 border-blue-400 text-white ring-1 ring-blue-400' 
                      : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <img src={u.avatarUrl} alt={u.name} className="w-7 h-7 rounded-full object-cover border border-slate-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate leading-tight">{u.name}</p>
                    <p className="text-[10px] text-slate-400 truncate font-mono">{u.role}</p>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* SECTION 2: LOGGED-IN USER PROFILE & ENTER PORTAL CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.name} 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-600 shadow-xs" 
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] text-white font-bold" title="Online Active">
                ✓
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-black text-slate-900">{currentUser.name}</h3>
                <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
                  {currentUser.role}
                </span>
                <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-slate-500" />
                  {currentUser.badgeId}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                <span>Email: <strong className="text-slate-800">{currentUser.email}</strong></span>
                <span>•</span>
                <span>Phone: <strong className="text-slate-800">{currentUser.phone || '+1 (555) 019-2831'}</strong></span>
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-slate-700">Assigned Job Sites:</span>
                <div className="flex gap-1">
                  {(currentUser?.siteAccess || []).map(siteId => {
                    const siteObj = sites.find(s => s.id === siteId);
                    return (
                      <span key={siteId} className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                        {siteObj?.name || siteId}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* MAIN ENTER PORTAL ACTION BUTTON */}
          <div className="w-full lg:w-auto bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 shrink-0 shadow-xs">
            <div className="space-y-0.5 text-center sm:text-left">
              <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5 justify-center sm:justify-start">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>USER ACCESS VERIFIED</span>
              </div>
              <p className="text-[11px] text-blue-700">Authenticated for construction site asset tracking operations.</p>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 group"
            >
              <span>ENTER ASSET TRACKING SYSTEM</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

        {/* LOGGED IN USER OPERATIONAL DASHBOARD METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          
          {/* Box 1: User's Checked Out Equipment */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <HardHat className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase font-mono">My Checked Out Equipment</h4>
              </div>
              <span className="bg-blue-100 text-blue-800 font-bold text-xs px-2 py-0.5 rounded-full font-mono">
                {userCheckouts.length} Active
              </span>
            </div>

            {userCheckouts.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No active equipment checked out to your account.</p>
            ) : (
              <div className="space-y-2">
                {userCheckouts.map(checkout => (
                  <div key={checkout.id} className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-xs">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{checkout.assetName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Job: {checkout.jobName}</p>
                    </div>
                    {onReturnCheckout && (
                      <button
                        type="button"
                        onClick={() => onReturnCheckout(checkout.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-md transition-colors shrink-0"
                      >
                        Return
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => onNavigateTab('checkouts')}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All Checkouts & Custody Hub</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Box 2: User Maintenance Work Orders */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase font-mono">Assigned Maintenance</h4>
              </div>
              <span className="bg-amber-100 text-amber-800 font-bold text-xs px-2 py-0.5 rounded-full font-mono">
                {userMaintenance.length} Assigned
              </span>
            </div>

            {userMaintenance.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No pending work orders assigned to you.</p>
            ) : (
              <div className="space-y-2">
                {userMaintenance.map(m => (
                  <div key={m.id} className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-xs">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{m.assetName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{m.workOrderId} • {m.type}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      m.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => onNavigateTab('maintenance')}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View Maintenance Schedule</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Box 3: User Activity Audit Trail */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase font-mono">My Recent Activity</h4>
              </div>
              <span className="bg-slate-200 text-slate-700 font-bold text-xs px-2 py-0.5 rounded-full font-mono">
                Activity Logged
              </span>
            </div>

            {(userLogs || []).length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No recent audit log activity found.</p>
            ) : (
              <div className="space-y-2">
                {(userLogs || []).slice(0, 3).map(log => (
                  <div key={log.id} className="bg-white border border-slate-200 rounded-lg p-2 text-left">
                    <p className="text-xs font-bold text-slate-800">{log.action}</p>
                    <p className="text-[10px] text-slate-500 truncate">{log.details}</p>
                    <span className="text-[9px] text-slate-400 font-mono">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View Full System Audit Trail</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

        </div>
      </div>

      {/* SECTION 3: USER DIRECTORY & AUTHORIZED PERSONNEL LIST */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>Registered Personnel Directory</span>
            </h3>
            <p className="text-xs text-slate-500">Live site user authorization directory synced in real time.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search user, email, badge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Roles</option>
              <option value="Site Manager">Site Manager</option>
              <option value="Project Manager">Project Manager</option>
              <option value="Yard Staff">Yard Staff</option>
              <option value="Field Worker">Field Worker</option>
              <option value="Maintenance Tech">Maintenance Tech</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Personnel</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Badge ID</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Assigned Sites</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">
                    No matching personnel found in database.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isActiveUser = currentUser.id === u.id;
                  return (
                    <tr key={u.id} className={`hover:bg-slate-50/80 transition-colors ${isActiveUser ? 'bg-blue-50/50 font-medium' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={u.avatarUrl} alt={u.name} className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-1.5">
                              {u.name}
                              {isActiveUser && (
                                <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">YOU</span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                          u.role === 'Site Manager' || u.role === 'Project Manager' 
                            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                            : u.role === 'Maintenance Tech'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono font-bold text-slate-700">
                        {u.badgeId}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {u.phone || '+1 (555) 019-2831'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(u.siteAccess || []).map(sId => {
                            const siteObj = sites.find(s => s.id === sId);
                            return (
                              <span key={sId} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded border border-slate-200">
                                {siteObj?.name ? siteObj.name.split(' ')[0] : sId}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectPersona(u)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded transition-colors"
                          >
                            Switch to
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit User"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL: REGISTER / EDIT USER FORM */}
      {newUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <span>{editingUser ? 'Edit Personnel Record' : 'Register New Construction User'}</span>
              </h3>
              <button 
                onClick={() => setNewUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Marcus Vance"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. mvance@apertureconst.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Site Manager">Site Manager</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Yard Staff">Yard Staff</option>
                    <option value="Field Worker">Field Worker</option>
                    <option value="Maintenance Tech">Maintenance Tech</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Badge / Tag ID</label>
                  <input
                    type="text"
                    value={formData.badgeId}
                    onChange={(e) => setFormData({ ...formData, badgeId: e.target.value })}
                    placeholder="e.g. BDG-9921"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 019-2831"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Avatar Image URL (Optional)</label>
                <input
                  type="url"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving User...' : 'Save User Record'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
