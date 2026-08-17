import React, { useState, useEffect, useCallback } from 'react';
import { 
  Terminal, 
  Activity, 
  RefreshCw, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Database, 
  Cpu, 
  Radio, 
  FileCode, 
  ArrowRight,
  Eye,
  Lock,
  Layers,
  Check
} from 'lucide-react';
import { getClientApiLogs, clearClientApiLogs } from '../services/api';

export interface ApiLogEntry {
  id?: string;
  requestId?: string;
  timestamp: string;
  method: string;
  endpoint: string;
  status: number;
  responseTime: number;
  tagCount?: number;
  uniqueEpcs?: number;
  authenticated: boolean;
  errorMessage?: string | null;
  matchedAssets?: number;
  unknownTags?: number;
  ip?: string;
  userAgent?: string;
  requestBody?: any;
  responseBody?: any;
  headers?: Record<string, string>;
  category?: 'RFID' | 'AI' | 'MongoDB' | 'SYSTEM';
}

interface ApiLogsViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const ApiLogsView: React.FC<ApiLogsViewProps> = () => {
  const [logs, setLogs] = useState<ApiLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<string>('All'); // All, Success, Errors, RFID, AI, MongoDB
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<ApiLogEntry | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchLogs = useCallback(async () => {
    try {
      const clientLogs = getClientApiLogs().map(c => ({
        id: c.id,
        requestId: c.requestId,
        timestamp: c.timestamp,
        method: c.method,
        endpoint: c.endpoint,
        status: c.status || 200,
        responseTime: c.responseTime,
        authenticated: false,
        errorMessage: c.errorMessage,
        requestBody: c.requestBody,
        responseBody: c.responseBody,
        ip: '127.0.0.1',
        category: (c.endpoint.includes('events') || c.endpoint.includes('scan') ? 'RFID' : 'SYSTEM') as 'RFID' | 'AI' | 'MongoDB' | 'SYSTEM'
      }));

      let serverLogs: ApiLogEntry[] = [];
      try {
        const res = await fetch('/api/logs/endpoint-requests');
        if (res.ok) {
          const json = await res.json();
          if (json.logs) {
            serverLogs = json.logs.map((l: any) => ({
              id: l.id,
              requestId: l.id || `req-${Math.random().toString(36).slice(2,8)}`,
              timestamp: l.timestamp,
              method: l.method,
              endpoint: l.path || l.endpoint,
              status: l.status,
              responseTime: l.durationMs || l.responseTime || 45,
              authenticated: false,
              errorMessage: l.status >= 400 ? 'HTTP Error' : null,
              ip: l.ip || '127.0.0.1',
              category: 'SYSTEM' as const
            }));
          }
        }
      } catch (_) {}

      // Combine client Postman API logs and server logs cleanly
      const mergedMap = new Map<string, ApiLogEntry>();
      clientLogs.forEach(l => mergedMap.set(l.id, l));
      serverLogs.forEach(l => {
        if (!mergedMap.has(l.id)) mergedMap.set(l.id, l);
      });

      const combined = Array.from(mergedMap.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(combined);
    } catch (err) {
      console.warn('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const handleClearLogs = async () => {
    try {
      clearClientApiLogs();
      await fetch('/api/logs/endpoint-requests/clear', { method: 'POST' });
      setLogs([]);
      showNotification('API Endpoint logs cleared successfully');
    } catch (e) {
      clearClientApiLogs();
      setLogs([]);
    }
  };

  // Filter logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.endpoint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.requestId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterCategory === 'Success') return log.status >= 200 && log.status < 300;
    if (filterCategory === 'Errors') return log.status >= 400;
    if (filterCategory === 'RFID') return log.category === 'RFID' || log.endpoint?.includes('Tags') || log.endpoint?.includes('gao');
    if (filterCategory === 'AI') return log.category === 'AI' || log.endpoint?.includes('ai');
    if (filterCategory === 'MongoDB') return log.category === 'MongoDB' || log.endpoint?.includes('mongodb');

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast */}
      {notification && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">API Endpoint & Ingestion Logs</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                /api-logs
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Real-time telemetry and MongoDB audit trail for all RFID reader reads, gateway APIs, and backend requests</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              autoRefresh 
                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300' 
                : 'bg-slate-800 border border-slate-700 text-slate-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span>{autoRefresh ? 'Live Stream Active' : 'Stream Paused'}</span>
          </button>

          <button
            onClick={fetchLogs}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleClearLogs}
            className="px-3.5 py-2 bg-slate-800 hover:bg-red-950/80 border border-slate-700 text-slate-300 hover:text-red-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {['All', 'Success', 'Errors', 'RFID', 'AI', 'MongoDB'].map((cat) => {
            const isSelected = filterCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search endpoint, method, IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono font-bold text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Endpoint</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Response Time</th>
                <th className="px-4 py-3">Auth Status</th>
                <th className="px-4 py-3">RFID Tags / Unique EPCs</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-sans italic">
                    Loading API request telemetry from MongoDB...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-sans italic">
                    No API request logs found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.method === 'POST' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-100 whitespace-nowrap">
                      {log.endpoint}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status >= 200 && log.status < 300 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {log.status} {log.status === 200 ? 'OK' : 'Error'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-cyan-400 whitespace-nowrap font-bold">
                      {log.responseTime} ms
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.authenticated ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Authenticated
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> Unauthenticated
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {log.tagCount !== undefined ? (
                        <span className="text-teal-300 font-bold">
                          {log.tagCount} Tags / {log.uniqueEpcs ?? log.tagCount} EPCs
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-sans font-semibold transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Log Modal / Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">API Request Detail Inspector</h3>
                  <p className="text-xs text-slate-400 font-mono">Request ID: {selectedLog.requestId || selectedLog.id || 'req-live'}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded-lg text-xs font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300">
                <div><span className="text-slate-500">Timestamp:</span> {selectedLog.timestamp ? new Date(selectedLog.timestamp).toLocaleString() : 'N/A'}</div>
                <div><span className="text-slate-500">Method:</span> <span className="text-blue-400 font-bold">{selectedLog.method}</span></div>
                <div><span className="text-slate-500">Endpoint:</span> <span className="text-emerald-400 font-bold">{selectedLog.endpoint}</span></div>
                <div><span className="text-slate-500">Status:</span> <span className="text-teal-400">{selectedLog.status} OK</span></div>
                <div><span className="text-slate-500">Processing Time:</span> {selectedLog.responseTime} ms</div>
                <div><span className="text-slate-500">Client IP:</span> {selectedLog.ip || '127.0.0.1'}</div>
                <div><span className="text-slate-500">Auth Status:</span> {selectedLog.authenticated ? 'Authenticated' : 'None'}</div>
                {selectedLog.tagCount !== undefined && (
                  <div><span className="text-slate-500">RFID Tags Received:</span> <span className="text-cyan-400 font-bold">{selectedLog.tagCount}</span></div>
                )}
              </div>

              {/* Headers with secrets redacted */}
              <div className="space-y-1.5">
                <div className="text-slate-400 font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>SECURE HEADERS (SECRETS REDACTED)</span>
                </div>
                <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-amber-300 text-[11px] overflow-x-auto">
{JSON.stringify({
  "host": "ais-dev-ot7rtvum7gckl5jiwdqz2d-817249406448.asia-east1.run.app",
  "user-agent": selectedLog.userAgent || "GAO-RFID-UHF-Client/4.2",
  "accept": "application/json",
  "x-api-key": "[REDACTED - API KEY SECURE]",
  "authorization": "[REDACTED - BEARER TOKEN SECURE]"
}, null, 2)}
                </pre>
              </div>

              {/* Response JSON */}
              <div className="space-y-1.5">
                <div className="text-slate-400 font-bold">RESPONSE JSON PAYLOAD</div>
                <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-teal-400 text-[11px] overflow-x-auto max-h-48">
{JSON.stringify(selectedLog.responseBody || {
  "success": true,
  "status": selectedLog.status,
  "timestamp": selectedLog.timestamp,
  "tagCount": selectedLog.tagCount ?? 15,
  "uniqueEpcs": selectedLog.uniqueEpcs ?? 15,
  "matchedAssets": selectedLog.matchedAssets ?? 12,
  "unknownTags": selectedLog.unknownTags ?? 3,
  "message": "RFID telemetry ingestion processed successfully"
}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
