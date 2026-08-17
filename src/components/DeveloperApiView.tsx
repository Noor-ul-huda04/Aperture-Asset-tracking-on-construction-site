import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Send, 
  Terminal, 
  Server, 
  RefreshCw, 
  Copy, 
  Check, 
  Code, 
  Activity, 
  Search, 
  Trash2, 
  FileCode,
  AlertCircle,
  Unlock,
  Layers,
  Info,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { getClientApiLogs, clearClientApiLogs, API_BASE_URL, ApiLogRecord } from '../services/api';
import { aperturePostmanCollection } from '../data/postmanCollection';

interface DeveloperApiViewProps {
  onEventsReceived?: (events: any[]) => void;
}

export const DeveloperApiView: React.FC<DeveloperApiViewProps> = () => {
  const [baseUrl, setBaseUrl] = useState<string>(API_BASE_URL);
  const [activeEndpoint, setActiveEndpoint] = useState<string>('/api/assets');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [responseMeta, setResponseMeta] = useState<{
    url: string;
    method: string;
    status: number;
    statusText: string;
    responseTime: number;
    success: boolean;
  } | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedCollection, setCopiedCollection] = useState<boolean>(false);

  // Custom body state for tester
  const [customBody, setCustomBody] = useState<string>(
    '{\n  "epc": "E2801191A000001000000456",\n  "readerId": "reader-101",\n  "ant": 1,\n  "rssi": -48\n}'
  );

  // Request logs state
  const [logs, setLogs] = useState<ApiLogRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<ApiLogRecord | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const POSTMAN_ENDPOINTS = [
    { path: '/api/assets', method: 'GET', label: 'Assets' },
    { path: '/api/events', method: 'GET', label: 'Events' },
    { path: '/api/sites', method: 'GET', label: 'Sites' },
    { path: '/api/users', method: 'GET', label: 'Users' },
    { path: '/api/readers', method: 'GET', label: 'Readers' },
    { path: '/api/checkouts', method: 'GET', label: 'Checkouts' },
    { path: '/api/maintenance', method: 'GET', label: 'Maintenance' },
    { path: '/api/inventory', method: 'GET', label: 'Inventory' },
    { path: '/api/alerts', method: 'GET', label: 'Alerts' },
    { path: '/api/audit-logs', method: 'GET', label: 'Audit Logs' },
    { path: '/api/health', method: 'GET', label: 'Health Check' },
    { path: '/api/events/scan', method: 'POST', label: 'RFID Scan (POST)' },
    { path: '/api/gao/read-tags', method: 'POST', label: 'GAO Read Tags (POST)' }
  ];

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const isPostEndpoint = (path: string, method?: string) => {
    if (method) return method === 'POST';
    return (
      path === '/api/events/scan' || 
      path === '/api/checkouts' || 
      path === '/api/maintenance' || 
      path === '/api/alerts' || 
      path === '/api/hardware/stream/toggle' ||
      path === '/api/gao/read-tags'
    );
  };

  const handleSelectEndpoint = (path: string, method?: string) => {
    setActiveEndpoint(path);
    if (path === '/api/gao/read-tags' && method === 'POST') {
      setCustomBody('{\n  "epc": "E2801191A000001000000456",\n  "readerId": "reader-101",\n  "ant": 1,\n  "rssi": -48\n}');
    } else if (path === '/api/events/scan') {
      setCustomBody('{\n  "tagId": "E2801191A000001000000456",\n  "readerId": "reader-101",\n  "siteId": "SITE-001",\n  "timestamp": "' + new Date().toISOString() + '"\n}');
    }
  };

  const refreshLogs = () => {
    const clientLogs = getClientApiLogs();
    setLogs(clientLogs);
  };

  useEffect(() => {
    refreshLogs();
    const interval = setInterval(refreshLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleExecuteRequest = async (overrideEndpoint?: string, overrideMethod?: string) => {
    const targetPath = overrideEndpoint || activeEndpoint;
    const isPost = overrideMethod ? overrideMethod === 'POST' : isPostEndpoint(targetPath);
    setIsExecuting(true);
    const startTime = performance.now();

    const cleanBase = baseUrl ? baseUrl.replace(/\/$/, '') : API_BASE_URL;
    const targetUrl = `${cleanBase}${targetPath.startsWith('/') ? targetPath : `/${targetPath}`}`;
    const httpMethod = isPost ? 'POST' : 'GET';

    try {
      const fetchOptions: RequestInit = {
        method: httpMethod,
        headers: {
          'Accept': 'application/json',
          ...(isPost ? { 'Content-Type': 'application/json' } : {})
        }
      };

      if (isPost) {
        fetchOptions.body = customBody;
      }

      const res = await fetch(targetUrl, fetchOptions);
      const durationMs = Math.round(performance.now() - startTime);

      const rawText = await res.text();
      let parsedBody: any;
      try {
        parsedBody = JSON.parse(rawText);
        setTestResponse(JSON.stringify(parsedBody, null, 2));
      } catch {
        parsedBody = rawText;
        setTestResponse(rawText);
      }

      setResponseMeta({
        url: targetUrl,
        method: httpMethod,
        status: res.status,
        statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
        responseTime: durationMs,
        success: res.ok
      });

      showNotification(`Request to ${targetPath} completed (${res.status} ${res.statusText || 'OK'}) in ${durationMs}ms`, res.ok ? 'success' : 'error');
      refreshLogs();
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      const errorMsg = err?.message || 'Network request failed';
      setTestResponse(JSON.stringify({ error: errorMsg, url: targetUrl }, null, 2));
      setResponseMeta({
        url: targetUrl,
        method: httpMethod,
        status: 0,
        statusText: 'Network Error',
        responseTime: durationMs,
        success: false
      });
      showNotification(`Request failed: ${errorMsg}`, 'error');
    } finally {
      setIsExecuting(false);
      refreshLogs();
    }
  };

  const handleCopyCurl = () => {
    const isPost = isPostEndpoint(activeEndpoint);
    const cleanBase = baseUrl ? baseUrl.replace(/\/$/, '') : window.location.origin;
    const curlCmd = isPost
      ? `curl -X POST "${cleanBase}${activeEndpoint}" -H "Content-Type: application/json" -d '${customBody.replace(/\n/g, '')}'`
      : `curl -X GET "${cleanBase}${activeEndpoint}" -H "Accept: application/json"`;

    navigator.clipboard.writeText(curlCmd);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
    showNotification('cURL command copied to clipboard');
  };

  const handleCopyPublicBaseUrl = () => {
    const publicUrl = baseUrl || window.location.origin;
    navigator.clipboard.writeText(publicUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
    showNotification('Public Base URL copied! Paste this into Postman as {{base_url}}');
  };

  const handleDownloadCollection = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(aperturePostmanCollection, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "Aperture-Asset-Tracking-API.postman_collection.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Postman Collection v2.1.0 JSON downloaded');
  };

  const handleCopyCollectionJson = () => {
    navigator.clipboard.writeText(JSON.stringify(aperturePostmanCollection, null, 2));
    setCopiedCollection(true);
    setTimeout(() => setCopiedCollection(false), 2500);
    showNotification('Collection JSON copied to clipboard! Paste directly into Postman > Import > Raw text');
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(log.status).includes(searchTerm);

    if (!matchesSearch) return false;
    if (filterMethod !== 'ALL' && log.method !== filterMethod) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast */}
      {notification && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xl ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 border border-emerald-500/50 text-emerald-300' 
            : 'bg-red-950/90 border border-red-500/50 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">Developer & Postman API</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Public Live Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive Postman API gateway tester and live request telemetry for Aperture Asset Tracking
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 font-mono text-xs w-full sm:w-auto">
          <span className="text-slate-400">Public Base URL:</span>
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="px-3 py-1 bg-slate-950 border border-slate-800 text-cyan-300 rounded-lg font-bold truncate max-w-xs select-all">
              {baseUrl}
            </span>
            <button
              onClick={handleCopyPublicBaseUrl}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Copy Public Base URL"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Endpoint Selector Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <Server className="w-4 h-4 text-blue-400" />
            <span>Interactive API Endpoints Tester</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            {POSTMAN_ENDPOINTS.length} Endpoints Configured
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {POSTMAN_ENDPOINTS.map((ep, idx) => {
            const isSelected = activeEndpoint === ep.path;
            return (
              <button
                key={`${ep.path}-${ep.method}-${idx}`}
                onClick={() => {
                  handleSelectEndpoint(ep.path, ep.method);
                  handleExecuteRequest(ep.path, ep.method);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-16 ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                    ep.method === 'POST' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {ep.method}
                  </span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />}
                </div>
                <span className="text-xs font-bold font-mono truncate">{ep.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Request & Response Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Request Controls Panel */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-white font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>HTTP Request Console</span>
            </h3>
            <button
              onClick={handleCopyCurl}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedCurl ? 'Copied' : 'cURL'}</span>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-mono font-bold text-slate-400 block mb-1">Target Endpoint</label>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 ${
                  isPostEndpoint(activeEndpoint) ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {isPostEndpoint(activeEndpoint) ? 'POST' : 'GET'}
                </span>
                <input
                  type="text"
                  value={`${baseUrl}${activeEndpoint}`}
                  readOnly
                  className="w-full bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 px-3 py-1.5 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            {/* Request Headers Section */}
            <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px] font-mono font-bold text-slate-200">Request Headers</span>
                </div>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Unlock className="w-3 h-3 text-emerald-400" />
                  Auth: None (Public API)
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between p-1.5 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-slate-400">Accept:</span>
                  <span className="text-cyan-300 font-semibold">application/json</span>
                </div>
                {isPostEndpoint(activeEndpoint) && (
                  <div className="flex items-center justify-between p-1.5 bg-slate-900/80 border border-slate-800 rounded-lg">
                    <span className="text-slate-400">Content-Type:</span>
                    <span className="text-cyan-300 font-semibold">application/json</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-1.5 bg-slate-900/40 border border-slate-800/60 rounded-lg">
                  <span className="text-slate-400">Authorization:</span>
                  <span className="text-slate-400 italic text-[10px]">None (No Bearer Token Required)</span>
                </div>
              </div>

              <div className="flex items-start gap-1.5 p-2 bg-blue-950/30 border border-blue-500/20 rounded-lg text-[10.5px] text-blue-200/90 leading-normal">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Public REST API:</strong> Endpoints are publicly reachable with standard JSON requests. Use this live URL in Postman, cURL, or IoT gateways.
                </span>
              </div>
            </div>

            {isPostEndpoint(activeEndpoint) && (
              <div>
                <label className="text-[11px] font-mono font-bold text-slate-400 block mb-1">POST JSON Body</label>
                <textarea
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <button
              onClick={() => handleExecuteRequest()}
              disabled={isExecuting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-xs font-mono rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className={`w-4 h-4 ${isExecuting ? 'animate-spin' : ''}`} />
              <span>{isExecuting ? 'Executing Request...' : `Send ${isPostEndpoint(activeEndpoint) ? 'POST' : 'GET'} Request`}</span>
            </button>
          </div>
        </div>

        {/* Response Viewer Panel */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-white font-mono flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              <span>API Response JSON</span>
            </h3>
            {testResponse && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(testResponse);
                  showNotification('Response JSON copied');
                }}
                className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" /> Copy Output
              </button>
            )}
          </div>

          {/* Real HTTP Request Metadata Summary */}
          {responseMeta && (
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
              <div className="space-y-0.5">
                <span className="text-slate-500 text-[10px] block">Request Method</span>
                <span className={`px-2 py-0.5 rounded font-bold inline-block text-xs ${
                  responseMeta.method === 'POST' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {responseMeta.method}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-500 text-[10px] block">HTTP Status</span>
                <span className={`px-2 py-0.5 rounded font-bold inline-block text-xs ${
                  responseMeta.status >= 200 && responseMeta.status < 300
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {responseMeta.status} {responseMeta.statusText}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-500 text-[10px] block">Response Time</span>
                <span className="text-cyan-300 font-bold text-xs">{responseMeta.responseTime} ms</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-500 text-[10px] block">Target Host</span>
                <span className="text-slate-300 truncate block text-[10px]" title={responseMeta.url}>
                  pstmn.io
                </span>
              </div>
              <div className="col-span-2 sm:col-span-4 pt-1 border-t border-slate-800/60 text-[10px] text-slate-400 truncate">
                <span className="text-slate-500 mr-1">URL:</span>
                <span className="text-cyan-400 select-all font-bold">{responseMeta.url}</span>
              </div>
            </div>
          )}

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-64 max-h-80 overflow-y-auto">
            {isExecuting ? (
              <div className="flex items-center justify-center h-48 text-slate-500 gap-2 font-mono text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                <span>Executing request to Postman Mock Server...</span>
              </div>
            ) : testResponse ? (
              <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                {testResponse}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-600 font-mono text-xs italic">
                Click "Send Request" to test endpoint directly against the Postman Mock Server.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real Application API Request Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white font-mono">API Endpoint Request Logs</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {logs.length} Recorded
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => {
                clearClientApiLogs();
                refreshLogs();
                showNotification('Request logs cleared');
              }}
              className="p-2 bg-slate-800 hover:bg-red-950/80 border border-slate-700 text-slate-300 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
              title="Clear Logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Endpoint</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Response Time</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500 italic font-sans">
                    No requests logged yet. Trigger endpoint requests above or navigate the app to generate live API logs.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.method === 'POST' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-200 whitespace-nowrap">
                      {log.endpoint}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status >= 200 && log.status < 300 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {log.status || 200} {log.statusText || 'OK'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-cyan-400 font-bold whitespace-nowrap">
                      {log.responseTime} ms
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-sans font-semibold transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-white">API Request Log Details</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Method & Endpoint</span>
                <span className="text-white font-bold">{selectedLog.method} {selectedLog.endpoint}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Status Code & Time</span>
                <span className="text-emerald-400 font-bold">{selectedLog.status} {selectedLog.statusText} ({selectedLog.responseTime} ms)</span>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-400 font-bold">
                <span>Request Headers Sent</span>
                <span className="text-[10px] text-emerald-400 font-normal">Auth: None (Public API)</span>
              </div>
              <div className="text-slate-300 font-mono text-[10.5px] space-y-1">
                <div><span className="text-slate-500">Accept:</span> application/json</div>
                {selectedLog.method === 'POST' && <div><span className="text-slate-500">Content-Type:</span> application/json</div>}
                <div><span className="text-slate-500">Authorization:</span> <span className="text-slate-400 italic">None (Public Access)</span></div>
              </div>
            </div>

            {selectedLog.requestBody && (
              <div>
                <span className="text-slate-400 font-bold block mb-1">Request Body</span>
                <pre className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-amber-300 overflow-x-auto text-[11px]">
                  {JSON.stringify(selectedLog.requestBody, null, 2)}
                </pre>
              </div>
            )}

            <div>
              <span className="text-slate-400 font-bold block mb-1">Response Body</span>
              <pre className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-emerald-300 overflow-x-auto text-[11px] max-h-60">
                {JSON.stringify(selectedLog.responseBody, null, 2)}
              </pre>
            </div>

            <button
              onClick={() => setSelectedLog(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-sans font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
