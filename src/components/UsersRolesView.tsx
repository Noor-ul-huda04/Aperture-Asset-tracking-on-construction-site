import React, { useState } from 'react';
import { User, UserRole, Site } from '../types';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Key, 
  Building2, 
  Mail, 
  Phone, 
  IdCard, 
  CheckCircle2, 
  XCircle,
  Sparkles
} from 'lucide-react';

interface UsersRolesViewProps {
  users: User[];
  currentUser: User;
  sites: Site[];
  onSwitchUserRole: (newRole: UserRole, user?: User) => void;
}

export const UsersRolesView: React.FC<UsersRolesViewProps> = ({
  users = [],
  currentUser,
  sites = [],
  onSwitchUserRole
}) => {
  const safeUsers = users || [];
  const safeSites = sites || [];
  const rolesList: { role: UserRole; title: string; desc: string; sampleName: string }[] = [
    {
      role: 'Administrator',
      title: 'System Administrator',
      desc: 'Full enterprise authority: fleet management, RBAC, hardware gateways, project definitions, financial tracking.',
      sampleName: 'Sarah Jenkins'
    },
    {
      role: 'Project Manager',
      title: 'Senior Project Manager',
      desc: 'Project portfolio access, site assignments, machine allocation, analytics, budget oversight, and fleet reports.',
      sampleName: 'Marcus Vance'
    },
    {
      role: 'Site Manager',
      title: 'Site Superintendent / Manager',
      desc: 'Site-level equipment tracking, gate movements, safety inspections, site geofencing, and security alert triage.',
      sampleName: 'John Sterling'
    },
    {
      role: 'Equipment Manager',
      title: 'Fleet & Equipment Manager',
      desc: 'Heavy machinery tracking, utilization, idle telemetry, telematics gateway, and preventive service scheduling.',
      sampleName: 'Carlos Mendez'
    },
    {
      role: 'Maintenance Manager',
      title: 'Maintenance Lead / Chief Engineer',
      desc: 'Work order dispatch, inspection compliance, spare parts inventory, repair costs, and red-tag overrides.',
      sampleName: 'Marco Rossi'
    },
    {
      role: 'Field Worker',
      title: 'Field Operator / Technician',
      desc: 'Mobile QR scanning, tool crib check-in/out, digital safety walk-around checklists, and machine custody.',
      sampleName: 'Frank Kowalski'
    }
  ];

  const permissionsMatrix = [
    { module: 'Dashboard & Global KPIs', admin: true, pm: true, sm: true, em: true, mm: true, fw: true },
    { module: 'Live Asset Map (GPS/Sat)', admin: true, pm: true, sm: true, em: true, mm: false, fw: false },
    { module: 'Asset Registry & CRUD', admin: true, pm: true, sm: true, em: true, mm: true, fw: false },
    { module: 'Equipment & Telematics', admin: true, pm: true, sm: true, em: true, mm: true, fw: false },
    { module: 'Tool Crib & QR Check-Out', admin: true, pm: true, sm: true, em: true, mm: true, fw: true },
    { module: 'Projects & Budgets', admin: true, pm: true, sm: false, em: false, mm: false, fw: false },
    { module: 'Sites & Laydown Yards', admin: true, pm: true, sm: true, em: false, mm: false, fw: false },
    { module: 'Movements & Gate Portals', admin: true, pm: true, sm: true, em: true, mm: false, fw: true },
    { module: 'RFID & QR Mobile Scanner', admin: true, pm: true, sm: true, em: true, mm: true, fw: true },
    { module: 'Geofence Security Rules', admin: true, pm: true, sm: true, em: false, mm: false, fw: false },
    { module: 'Maintenance & Service', admin: true, pm: false, sm: true, em: true, mm: true, fw: false },
    { module: 'Digital Inspections', admin: true, pm: false, sm: true, em: true, mm: true, fw: true },
    { module: 'Security Alerts & Exceptions', admin: true, pm: true, sm: true, em: true, mm: true, fw: true },
    { module: 'Work Orders & Costs', admin: true, pm: false, sm: true, em: true, mm: true, fw: false },
    { module: 'Analytics & Fleet Reports', admin: true, pm: true, sm: true, em: true, mm: true, fw: false },
    { module: 'AI Decision Support Insights', admin: true, pm: true, sm: false, em: true, mm: true, fw: false },
    { module: 'User Accounts & Roles (RBAC)', admin: true, pm: false, sm: false, em: false, mm: false, fw: false },
    { module: 'Hardware Gateway & Config', admin: true, pm: false, sm: false, em: false, mm: false, fw: false }
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-900 text-white rounded-xl">
              <Users className="w-5 h-5 text-blue-400" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Role-Based Access Control (RBAC) & Users</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise multi-role permissions, field personnel badges, site security access, and authorized user role management.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700">
          <span>Active Persona:</span>
          <span className="font-bold text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
            {currentUser.name} ({currentUser.role})
          </span>
        </div>
      </div>

      {/* Instant Role Switcher Cards (Requested in Section 20) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Instant Interactive Role Switcher (Preview Permissions in Real-Time):
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {rolesList.map((item) => {
            const isCurrent = currentUser.role === item.role;
            const matchedUser = users.find(u => u.role === item.role);

            return (
              <div
                key={item.role}
                onClick={() => onSwitchUserRole(item.role, matchedUser)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative ${
                  isCurrent
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-blue-500/50'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isCurrent ? 'bg-blue-500/30 text-blue-300 border border-blue-400/40' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {item.role}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE SESSION
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold leading-tight mb-1">{item.title}</h3>
                <p className={`text-xs mb-3 leading-relaxed line-clamp-2 ${isCurrent ? 'text-slate-400' : 'text-slate-500'}`}>
                  {item.desc}
                </p>

                <div className="pt-2 border-t border-slate-200/20 flex items-center justify-between text-[11px]">
                  <span className={isCurrent ? 'text-slate-300' : 'text-slate-600'}>
                    Demo User: <strong>{matchedUser?.name || item.sampleName}</strong>
                  </span>
                  <span className={`font-bold ${isCurrent ? 'text-amber-300' : 'text-blue-600'}`}>
                    Switch to Role →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Users Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900">Personnel & Field Credentials Directory</h2>
            <p className="text-xs text-slate-500">Authorized personnel records, badge IDs, and site clearance scopes.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Personnel / Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Badge ID</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Site Security Access</th>
                <th className="px-4 py-3">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {safeUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=128'} 
                        alt={u.name} 
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-600 font-bold">
                    {u.badgeId || 'BT-CARD-00'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {u.department || 'Operations'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {u.siteAccess?.map(s => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-semibold">
                          {s}
                        </span>
                      )) || <span className="text-slate-400">All Sites</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                    {u.phone || '+1 (555) 000-0000'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <h2 className="text-sm font-black text-slate-900">Module Permission Security Matrix</h2>
        <p className="text-xs text-slate-500">Fine-grained operational access gating across all 6 predefined enterprise roles.</p>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-3 py-2.5">Platform Module</th>
                <th className="px-3 py-2.5 text-center">Admin</th>
                <th className="px-3 py-2.5 text-center">Project Mgr</th>
                <th className="px-3 py-2.5 text-center">Site Mgr</th>
                <th className="px-3 py-2.5 text-center">Equipment Mgr</th>
                <th className="px-3 py-2.5 text-center">Maint. Mgr</th>
                <th className="px-3 py-2.5 text-center">Field Worker</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {permissionsMatrix.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80">
                  <td className="px-3 py-2 font-bold text-slate-900">{p.module}</td>
                  <td className="px-3 py-2 text-center">{p.admin ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="px-3 py-2 text-center">{p.pm ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="px-3 py-2 text-center">{p.sm ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="px-3 py-2 text-center">{p.em ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="px-3 py-2 text-center">{p.mm ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="px-3 py-2 text-center">{p.fw ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
