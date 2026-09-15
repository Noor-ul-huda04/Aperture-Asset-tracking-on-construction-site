import React, { useState } from 'react';
import {
  HardHat,
  ArrowRight,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { User } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  availableUsers: User[];
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, availableUsers }) => {
  const [emailOrBadge, setEmailOrBadge] = useState<string>('');
  const [pinCode, setPinCode] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('Site Manager');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Construction Site Demo Personas
  const demoPersonas: User[] = [
    {
      id: 'usr-1',
      name: 'Sarah Jenkins',
      email: 'sjenkins@apertureconst.com',
      role: 'Site Manager',
      siteAccess: ['site-1', 'site-2'],
      badgeId: 'BDG-8801',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      phone: '+1 (555) 234-5678'
    },
    {
      id: 'usr-2',
      name: 'Marcus Rodriguez',
      email: 'mrodriguez@apertureconst.com',
      role: 'Equipment Foreman',
      siteAccess: ['site-1'],
      badgeId: 'BDG-9920',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
      phone: '+1 (555) 876-5432'
    },
    {
      id: 'usr-3',
      name: 'Jessica Chen',
      email: 'jchen@apertureconst.com',
      role: 'Safety & Compliance Inspector',
      siteAccess: ['site-1', 'site-2', 'site-3'],
      badgeId: 'BDG-3312',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      phone: '+1 (555) 345-6789'
    }
  ];

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const match = (availableUsers.length > 0 ? availableUsers : demoPersonas).find(
        (u) =>
          u.email.toLowerCase() === emailOrBadge.toLowerCase() ||
          u.badgeId.toLowerCase() === emailOrBadge.toLowerCase() ||
          u.name.toLowerCase().includes(emailOrBadge.toLowerCase())
      );

      if (match) {
        onLoginSuccess(match);
      } else {
        // Fallback custom user creation or login
        if (emailOrBadge.trim().length > 0) {
          const newUser: User = {
            id: `usr-${Date.now()}`,
            name: emailOrBadge.includes('@') ? emailOrBadge.split('@')[0].replace('.', ' ') : emailOrBadge,
            email: emailOrBadge.includes('@') ? emailOrBadge : `${emailOrBadge}@apertureconst.com`,
            role: selectedRole as any,
            siteAccess: ['site-1', 'site-2'],
            badgeId: `BDG-${Math.floor(1000 + Math.random() * 9000)}`,
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            phone: '+1 (555) 000-1234'
          };
          onLoginSuccess(newUser);
        } else {
          setErrorMsg('Please enter a valid construction badge ID or user email address.');
        }
      }
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Dynamic Background Mesh Grids & Accent Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b10_1px,transparent_1px),linear-gradient(to_bottom,#1e293b10_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="max-w-md w-full relative z-10 my-auto">
        {/* Single Clean Centered Login Card */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          {/* Header & Logo */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10 mx-auto">
              <HardHat className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 block">
                Aperture OS
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight mt-0.5">
                RFID Asset Tracking System
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Sign in to your account to access the system.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl flex items-center gap-2.5 text-red-200 text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Clean Login Form */}
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1.5">
                Email Address / Badge ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={emailOrBadge}
                  onChange={(e) => setEmailOrBadge(e.target.value)}
                  placeholder="e.g. sjenkins@apertureconst.com or BDG-8801"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1.5">
                Password / PIN
              </label>
              <input
                type="password"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" defaultChecked className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0" />
                <span>Remember me</span>
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact your administrator to reset your credentials.'); }} className="text-blue-400 hover:underline">
                Forgot PIN?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 cursor-pointer active:scale-[0.98]"
            >
              <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Status */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Aperture OS v2.4</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              System Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
