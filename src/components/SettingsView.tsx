import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  Database, 
  CheckCircle2, 
  Save, 
  RefreshCw, 
  Sliders, 
  Cpu, 
  ShieldAlert, 
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Volume2,
  AlertTriangle,
  Clock,
  Filter,
  Zap,
  Radio
} from 'lucide-react';
import { Site, User } from '../types';
import { TabType } from './SidebarNav';

interface SettingsViewProps {
  sites: Site[];
  currentUser: User;
  onRefreshAll: () => void;
  onNavigateTab?: (tab: TabType | string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  sites,
  currentUser,
  onRefreshAll,
  onNavigateTab
}) => {
  // Page tab state inside settings: 4 clean, non-overlapping configuration tabs
  type SettingsTab = 'general' | 'notifications' | 'rfid_params' | 'database';
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('general');

  // MongoDB Atlas status state
  const [mongoStatus, setMongoStatus] = useState<any>(null);
  const [mongoLoading, setMongoLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testingMongo, setTestingMongo] = useState(false);

  useEffect(() => {
    if (activeSettingsTab === 'database') {
      fetchMongoStatus();
    }
  }, [activeSettingsTab]);

  const fetchMongoStatus = async () => {
    setMongoLoading(true);
    try {
      const res = await fetch('/api/mongodb/status');
      if (res.ok) {
        const data = await res.json();
        setMongoStatus(data);
      }
    } catch (err) {
      console.error('Error fetching MongoDB status:', err);
    } finally {
      setMongoLoading(false);
    }
  };

  const handleSyncMongo = async () => {
    setMongoLoading(true);
    try {
      await fetch('/api/mongodb/sync', { method: 'POST' });
      await fetchMongoStatus();
      onRefreshAll();
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setMongoLoading(false);
    }
  };

  const handleRunReadWriteTest = async () => {
    setTestingMongo(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/mongodb/test', { method: 'POST' });
      const data = await res.json();
      setTestResult(data);
      await fetchMongoStatus();
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Failed to trigger read/write test'
      });
    } finally {
      setTestingMongo(false);
    }
  };

  // Local state for configuration settings
  const [orgName, setOrgName] = useState('Apex Infrastructure Construction Corp.');
  const [defaultSiteId, setDefaultSiteId] = useState(sites[0]?.id || 'site-01');
  const [timeZone, setTimeZone] = useState('America/New_York (EST)');

  // Notification Destinations & Channel Preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsCriticalBreach, setSmsCriticalBreach] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [audioChimeAlert, setAudioChimeAlert] = useState(true);

  const [notificationEmail, setNotificationEmail] = useState(currentUser.email || 'dispatch@apexinfrastructure.com');
  const [notificationPhone, setNotificationPhone] = useState('+1 (555) 928-3401');
  const [digestTime, setDigestTime] = useState('07:00');
  const [minSeverity, setMinSeverity] = useState<'info' | 'warning' | 'critical'>('warning');

  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('06:00');

  // Event Triggers Matrix
  const [eventTriggers, setEventTriggers] = useState({
    geofenceBreach: { email: true, sms: true, inApp: true },
    offHoursMotion: { email: true, sms: true, inApp: true },
    assetMissing: { email: true, sms: false, inApp: true },
    maintenanceOverdue: { email: true, sms: false, inApp: true },
    overdueCheckout: { email: false, sms: false, inApp: true },
    gatewayOffline: { email: true, sms: true, inApp: true }
  });

  const toggleEventTrigger = (eventKey: keyof typeof eventTriggers, channel: 'email' | 'sms' | 'inApp') => {
    setEventTriggers(prev => ({
      ...prev,
      [eventKey]: {
        ...prev[eventKey],
        [channel]: !prev[eventKey][channel]
      }
    }));
  };

  // RFID Reader Parameters
  const [antennaPowerDbm, setAntennaPowerDbm] = useState('28');
  const [rssiThreshold, setRssiThreshold] = useState('-65');
  const [rfidFrequency, setRfidFrequency] = useState('US_902_928_MHZ');
  const [autoPollIntervalSec, setAutoPollIntervalSec] = useState('3');

  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('aperture_system_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.orgName) setOrgName(parsed.orgName);
        if (parsed.defaultSiteId) setDefaultSiteId(parsed.defaultSiteId);
        if (parsed.timeZone) setTimeZone(parsed.timeZone);

        if (typeof parsed.emailAlerts === 'boolean') setEmailAlerts(parsed.emailAlerts);
        if (typeof parsed.smsCriticalBreach === 'boolean') setSmsCriticalBreach(parsed.smsCriticalBreach);
        if (typeof parsed.inAppAlerts === 'boolean') setInAppAlerts(parsed.inAppAlerts);
        if (typeof parsed.audioChimeAlert === 'boolean') setAudioChimeAlert(parsed.audioChimeAlert);
        if (parsed.notificationEmail) setNotificationEmail(parsed.notificationEmail);
        if (parsed.notificationPhone) setNotificationPhone(parsed.notificationPhone);
        if (parsed.digestTime) setDigestTime(parsed.digestTime);
        if (parsed.minSeverity) setMinSeverity(parsed.minSeverity);
        if (typeof parsed.quietHoursEnabled === 'boolean') setQuietHoursEnabled(parsed.quietHoursEnabled);
        if (parsed.quietHoursStart) setQuietHoursStart(parsed.quietHoursStart);
        if (parsed.quietHoursEnd) setQuietHoursEnd(parsed.quietHoursEnd);
        if (parsed.eventTriggers) setEventTriggers(parsed.eventTriggers);

        if (parsed.antennaPowerDbm) setAntennaPowerDbm(parsed.antennaPowerDbm);
        if (parsed.rssiThreshold) setRssiThreshold(parsed.rssiThreshold);
        if (parsed.rfidFrequency) setRfidFrequency(parsed.rfidFrequency);
        if (parsed.autoPollIntervalSec) setAutoPollIntervalSec(parsed.autoPollIntervalSec);
      }
    } catch (e) {
      console.warn('Could not parse stored settings', e);
    }
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const settingsPayload = {
      orgName,
      defaultSiteId,
      timeZone,
      emailAlerts,
      smsCriticalBreach,
      inAppAlerts,
      audioChimeAlert,
      notificationEmail,
      notificationPhone,
      digestTime,
      minSeverity,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      eventTriggers,
      antennaPowerDbm,
      rssiThreshold,
      rfidFrequency,
      autoPollIntervalSec
    };
    localStorage.setItem('aperture_system_settings', JSON.stringify(settingsPayload));

    setSavedSuccessMsg('System configuration settings and notification preferences saved successfully!');
    setTimeout(() => setSavedSuccessMsg(null), 3500);
  };

  const pages: { id: SettingsTab; label: string; icon: React.ReactNode; desc: string }[] = [
    { 
      id: 'general', 
      label: 'General & Organization', 
      icon: <Building2 className="w-4 h-4" />,
      desc: 'Company information, default job sites, time zones, and global organization defaults'
    },
    { 
      id: 'notifications', 
      label: 'Notifications & Alerts', 
      icon: <Bell className="w-4 h-4" />,
      desc: 'Email, SMS, and in-app alert channels, event trigger matrix, quiet hours, and severity filters'
    },
    { 
      id: 'rfid_params', 
      label: 'RFID Reader Parameters', 
      icon: <Cpu className="w-4 h-4" />,
      desc: 'Default antenna power level, RSSI signal sensitivity, frequency band, and portal auto-poll intervals'
    },
    { 
      id: 'database', 
      label: 'Database & Sync', 
      icon: <Database className="w-4 h-4" />,
      desc: 'Cloud Firestore synchronization status, REST API diagnostics, and cache controls'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/10 text-blue-600 rounded-xl border border-blue-200">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-900 font-mono">System Administration & Settings</h2>
            <p className="text-xs text-slate-500">Configure global organization defaults, notification preferences, RFID parameters, and database sync</p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {savedSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-mono flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      {/* Internal Sub-Pages Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 flex flex-wrap gap-2 shadow-xs">
        {pages.map((p) => {
          const isActive = activeSettingsTab === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActiveSettingsTab(p.id)}
              className={`flex-1 min-w-[170px] px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className={isActive ? 'text-amber-400' : 'text-slate-400'}>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Page Description */}
      <div className="bg-slate-100/70 border border-slate-200/80 px-4 py-3 rounded-xl text-xs text-slate-600 flex items-center gap-2 font-medium">
        <Sliders className="w-4 h-4 text-blue-600 shrink-0" />
        <span>{pages.find(p => p.id === activeSettingsTab)?.desc}</span>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">

        {/* PAGE 1: Organization & Default Site */}
        {activeSettingsTab === 'general' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs animate-fade-in">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>General Organization & Site Defaults</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Organization Name</label>
                <input 
                  type="text" 
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Job Site Default</label>
                <select
                  value={defaultSiteId}
                  onChange={(e) => setDefaultSiteId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">System Time Zone</label>
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="America/New_York (EST)">America/New_York (EST / UTC-5)</option>
                  <option value="America/Chicago (CST)">America/Chicago (CST / UTC-6)</option>
                  <option value="America/Denver (MST)">America/Denver (MST / UTC-7)</option>
                  <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST / UTC-8)</option>
                  <option value="Europe/London (GMT)">Europe/London (GMT / UTC+0)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 2: Notifications & Alerts Configuration */}
        {activeSettingsTab === 'notifications' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Section 1: Delivery Channels */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  <span>Notification Delivery Channels & Destinations</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 font-normal">Active Channels</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                {/* Email Destination & Master Toggle */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span>Email Alert Channel</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={emailAlerts} 
                        onChange={(e) => setEmailAlerts(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Primary Dispatch Email Address</label>
                    <input 
                      type="email" 
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                      disabled={!emailAlerts}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* SMS Destination & Master Toggle */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>SMS Mobile Alert Channel</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={smsCriticalBreach} 
                        onChange={(e) => setSmsCriticalBreach(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Emergency Security Mobile Phone Number</label>
                    <input 
                      type="tel" 
                      value={notificationPhone}
                      onChange={(e) => setNotificationPhone(e.target.value)}
                      disabled={!smsCriticalBreach}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* In-App Bell Center Toggle */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-purple-600" />
                    <div>
                      <span className="font-semibold text-slate-800 block">In-App Notification Center Banner</span>
                      <span className="text-[10px] text-slate-500">Show real-time alert badges in top header and toast overlays</span>
                    </div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={inAppAlerts}
                    onChange={(e) => setInAppAlerts(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer shrink-0"
                  />
                </div>

                {/* Sound Chime Toggle */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Volume2 className="w-4 h-4 text-amber-600" />
                    <div>
                      <span className="font-semibold text-slate-800 block">Audio Sound Chime for Critical Alerts</span>
                      <span className="text-[10px] text-slate-500">Play an audible warning chime when geofence is breached</span>
                    </div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={audioChimeAlert}
                    onChange={(e) => setAudioChimeAlert(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer shrink-0"
                  />
                </div>

              </div>
            </div>

            {/* Section 2: Alert Event Trigger Matrix */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>Asset Status & Geofence Event Trigger Matrix</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">Select notification channel for each event type</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="p-3">Event Type / Trigger</th>
                      <th className="p-3 text-center w-24">
                        <span className="flex items-center justify-center gap-1">
                          <Mail className="w-3 h-3 text-blue-600" /> Email
                        </span>
                      </th>
                      <th className="p-3 text-center w-24">
                        <span className="flex items-center justify-center gap-1">
                          <MessageSquare className="w-3 h-3 text-emerald-600" /> SMS
                        </span>
                      </th>
                      <th className="p-3 text-center w-24">
                        <span className="flex items-center justify-center gap-1">
                          <Smartphone className="w-3 h-3 text-purple-600" /> In-App
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    
                    {/* Event 1: Geofence Breach */}
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                          <span>Unauthorized Geofence / Perimeter Breach</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Triggered when an asset leaves designated site boundaries without authorization</p>
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={eventTriggers.geofenceBreach.email}
                          onChange={() => toggleEventTrigger('geofenceBreach', 'email')}
                          className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={eventTriggers.geofenceBreach.sms}
                          onChange={() => toggleEventTrigger('geofenceBreach', 'sms')}
                          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={eventTriggers.geofenceBreach.inApp}
                          onChange={() => toggleEventTrigger('geofenceBreach', 'inApp')}
                          className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                        />
                      </td>
                    </tr>

                    {/* Event 2: Off-Hours Motion */}
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Off-Hours Site Movement (Curfew Breach)</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Asset detected in motion after site operating curfew hours</p>
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={eventTriggers.offHoursMotion.email}
                          onChange={() => toggleEventTrigger('offHoursMotion', 'email')}
                          className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={eventTriggers.offHoursMotion.sms}
                          onChange={() => toggleEventTrigger('offHoursMotion', 'sms')}
                          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={eventTriggers.offHoursMotion.inApp}
                          onChange={() => toggleEventTrigger('offHoursMotion', 'inApp')}
                          className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                        />
                      </td>
                    </tr>

                    {/* Event 3: Asset Missing */}
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                          <span>Asset Status Flagged Missing / Unread</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">RFID tag unread by any gateway beyond missing threshold</p>
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={eventTriggers.assetMissing.email}
                          onChange={() => toggleEventTrigger('assetMissing', 'email')}
                          className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={eventTriggers.assetMissing.sms}
                          onChange={() => toggleEventTrigger('assetMissing', 'sms')}
                          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={eventTriggers.assetMissing.inApp}
                          onChange={() => toggleEventTrigger('assetMissing', 'inApp')}
                          className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                        />
                      </td>
                    </tr>

                    {/* Event 4: Maintenance Overdue */}
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-blue-600" />
                          <span>Maintenance / Calibration Inspection Overdue</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Asset requires scheduled maintenance or safety inspection</p>
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={eventTriggers.maintenanceOverdue.email}
                          onChange={() => toggleEventTrigger('maintenanceOverdue', 'email')}
                          className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={eventTriggers.maintenanceOverdue.sms}
                          onChange={() => toggleEventTrigger('maintenanceOverdue', 'sms')}
                          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={eventTriggers.maintenanceOverdue.inApp}
                          onChange={() => toggleEventTrigger('maintenanceOverdue', 'inApp')}
                          className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                        />
                      </td>
                    </tr>

                    {/* Event 5: Gateway Offline */}
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <Radio className="w-3.5 h-3.5 text-slate-700" />
                          <span>RFID Portal Gateway Offline / Disconnected</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Gateway loses heartbeat ping or edge network link</p>
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={eventTriggers.gatewayOffline.email}
                          onChange={() => toggleEventTrigger('gatewayOffline', 'email')}
                          className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={eventTriggers.gatewayOffline.sms}
                          onChange={() => toggleEventTrigger('gatewayOffline', 'sms')}
                          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={eventTriggers.gatewayOffline.inApp}
                          onChange={() => toggleEventTrigger('gatewayOffline', 'inApp')}
                          className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                        />
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Quiet Hours & Filters */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <Filter className="w-4 h-4 text-purple-600" />
                <span>Severity Filters, Digest Schedule & Quiet Hours</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Minimum Alert Severity Filter</label>
                  <select
                    value={minSeverity}
                    onChange={(e) => setMinSeverity(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="info">All Events (Informational, Warning & Critical)</option>
                    <option value="warning">Warnings & Critical Breaches Only (Recommended)</option>
                    <option value="critical">Critical Security Breaches & Geofences Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Daily Summary Digest Dispatch Time</label>
                  <input 
                    type="time" 
                    value={digestTime}
                    onChange={(e) => setDigestTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 block">Quiet Hours SMS Suppression</span>
                      <span className="text-[10px] text-slate-500">Suppress non-critical SMS alerts during off-shift night hours</span>
                    </div>
                    <input 
                      type="checkbox"
                      checked={quietHoursEnabled}
                      onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0"
                    />
                  </div>
                  {quietHoursEnabled && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-500 block mb-0.5">Start Time</span>
                        <input 
                          type="time" 
                          value={quietHoursStart} 
                          onChange={(e) => setQuietHoursStart(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs"
                        />
                      </div>
                      <span className="text-slate-400 text-xs self-end pb-2">to</span>
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-500 block mb-0.5">End Time</span>
                        <input 
                          type="time" 
                          value={quietHoursEnd} 
                          onChange={(e) => setQuietHoursEnd(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        )}

        {/* PAGE 3: RFID Reader Parameters */}
        {activeSettingsTab === 'rfid_params' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs animate-fade-in">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Cpu className="w-4 h-4 text-amber-600" />
              <span>RFID Reader Gateways & Hardware Parameters</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reader Antenna Power Level (dBm)</label>
                <div className="flex items-center gap-3 bg-slate-50 p-2.5 border border-slate-200 rounded-xl">
                  <input 
                    type="range" 
                    min="15" 
                    max="33" 
                    value={antennaPowerDbm}
                    onChange={(e) => setAntennaPowerDbm(e.target.value)}
                    className="w-full accent-amber-600"
                  />
                  <span className="font-mono font-bold text-amber-700 w-16 text-right">{antennaPowerDbm} dBm</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Higher power expands scan range up to 25m; lower power confines scan zone</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Minimum RFID Signal Filter (RSSI Sensitivity)</label>
                <select
                  value={rssiThreshold}
                  onChange={(e) => setRssiThreshold(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-xs focus:outline-none"
                >
                  <option value="-80">-80 dBm (Long Range - High Noise Sensitivity)</option>
                  <option value="-70">-70 dBm (Balanced Range - Recommended)</option>
                  <option value="-65">-65 dBm (Strict Proximity Filtering)</option>
                  <option value="-55">-55 dBm (Portal Gate Entrance Only)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Rejects weak signal reflections outside the active scan zone</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">RFID Frequency Band Standard</label>
                <select
                  value={rfidFrequency}
                  onChange={(e) => setRfidFrequency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-xs focus:outline-none"
                >
                  <option value="US_902_928_MHZ">FCC North America (902 - 928 MHz)</option>
                  <option value="EU_865_868_MHZ">ETSI Europe (865 - 868 MHz)</option>
                  <option value="GLOBAL_GEN2">GS1 Class 1 Gen 2 Global Standard</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Portal Reader Auto-Poll Rate (seconds)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="30"
                  value={autoPollIntervalSec}
                  onChange={(e) => setAutoPollIntervalSec(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* PAGE 4: Database Status & Operations */}
        {activeSettingsTab === 'database' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs animate-fade-in">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="w-4 h-4 text-purple-600" />
              <span>Database Synchronization & MongoDB Atlas Status</span>
            </h3>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2.5 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Local Express Backend Server:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active (port 3000)
                </span>
              </div>
              
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                <span className="text-slate-600">MongoDB Atlas Connection:</span>
                {mongoStatus?.connected ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Connected ({mongoStatus.database || 'aperture_asset_db'})
                  </span>
                ) : mongoStatus?.error ? (
                  <span className="text-red-700 font-bold flex items-center gap-1 bg-red-100 px-2 py-0.5 rounded-md border border-red-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    Connection Warning
                  </span>
                ) : mongoStatus?.configured ? (
                  <span className="text-amber-700 font-bold flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                    Connecting...
                  </span>
                ) : (
                  <span className="text-slate-600 font-bold flex items-center gap-1 bg-slate-200 px-2 py-0.5 rounded-md">
                    In-Memory / Local Document Store
                  </span>
                )}
              </div>

              {mongoStatus?.error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 text-xs font-sans space-y-2">
                  <div className="flex items-start gap-2 font-semibold text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>MongoDB Connection Issue Detected:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800 font-mono bg-amber-100/60 p-2 rounded-lg">
                    {mongoStatus.error}
                  </p>
                  <div className="pt-1 border-t border-amber-200/60 text-[11px] space-y-1">
                    <p className="font-bold text-amber-900">How to solve SSL Alert 80 / Atlas connection blocks:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-amber-850 font-normal">
                      <li>Log into <a href="https://cloud.mongodb.com" target="_blank" rel="noopener noreferrer" className="underline font-bold text-amber-950">MongoDB Atlas</a></li>
                      <li>Go to <strong>Security → Network Access</strong> in the left sidebar</li>
                      <li>Click <strong>+ Add IP Address</strong></li>
                      <li>Click <strong>ALLOW ACCESS FROM ANYWHERE</strong> (<code className="bg-amber-200/80 px-1 rounded font-mono">0.0.0.0/0</code>) and save</li>
                      <li>Return here and click <strong>"Sync Atlas MongoDB"</strong> below</li>
                    </ol>
                  </div>
                </div>
              )}

              {mongoStatus?.pingMs !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Cluster Response Ping:</span>
                  <span className="text-blue-700 font-bold">{mongoStatus.pingMs} ms</span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                <span className="text-slate-600">Active Operator Role:</span>
                <span className="text-blue-700 font-bold">{currentUser.name} ({currentUser.role})</span>
              </div>
            </div>

            {/* MongoDB Collections breakdown if connected */}
            {mongoStatus?.collections && Object.keys(mongoStatus.collections).length > 0 && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono">
                  Atlas Database Collections ({mongoStatus.database || 'aperture_asset_db'})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-[11px]">
                  {Object.entries(mongoStatus.collections).map(([coll, cnt]) => (
                    <div key={coll} className="bg-purple-50/60 border border-purple-200/80 rounded-lg p-2 text-center">
                      <div className="text-slate-500 capitalize">{coll}</div>
                      <div className="font-black text-purple-900 text-sm">{cnt as number} docs</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test result output */}
            {testResult && (
              <div className={`p-4 rounded-xl border text-xs space-y-2 font-mono ${testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                <div className="flex items-center justify-between font-bold border-b pb-2 border-emerald-200/60">
                  <span className="flex items-center gap-1.5">
                    {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                    MongoDB Read & Write Test: {testResult.success ? 'PASSED SUCCESSFUL' : 'FAILED'}
                  </span>
                  <span className="text-[10px] text-slate-500">{new Date(testResult.timestamp).toLocaleTimeString()}</span>
                </div>
                {testResult.testDetails && (
                  <div className="space-y-1 pt-1 text-[11px]">
                    <p>✓ Database: <strong>{testResult.database}</strong></p>
                    <p>✓ Write Test: Inserted test document <code className="bg-emerald-100 px-1 rounded">{testResult.testDetails.writeTest.testId}</code></p>
                    <p>✓ Read Test: Verified document write/retrieval in <code className="bg-emerald-100 px-1 rounded">_connection_tests</code> collection</p>
                    <p>✓ Update Test: Updated document modifiedCount: {testResult.testDetails.updateTest.modifiedCount}</p>
                  </div>
                )}
                {testResult.error && (
                  <p className="text-red-700 font-sans text-[11px] font-semibold">{testResult.error}</p>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-mono">
                {mongoStatus?.lastSynced ? `Last Synced: ${new Date(mongoStatus.lastSynced).toLocaleTimeString()}` : 'Realtime Sync Active'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRunReadWriteTest}
                  disabled={testingMongo}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingMongo ? 'animate-spin' : ''}`} />
                  <span>{testingMongo ? 'Testing...' : 'Run Read/Write Test'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSyncMongo}
                  disabled={mongoLoading}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{mongoLoading ? 'Syncing...' : 'Sync Atlas MongoDB'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    fetchMongoStatus();
                    onRefreshAll();
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                  <span>Reload Data</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Submit Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
          <span className="text-xs text-slate-400 font-mono">Active Tab: {pages.find(p => p.id === activeSettingsTab)?.label}</span>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration Changes</span>
          </button>
        </div>

      </form>
    </div>
  );
};
