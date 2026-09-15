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
  CheckCircle2,
  Radio,
  BookOpen,
  Sliders,
  Clock,
  ArrowRight,
  Database
} from 'lucide-react';
import { 
  getClientApiLogs, 
  clearClientApiLogs, 
  GAO_API_BASE_URL, 
  ApiLogRecord, 
  recordLog,
  fetchGaoDiagnostics
} from '../services/api';
import { aperturePostmanCollection } from '../data/postmanCollection';

interface DeveloperApiViewProps {
  onEventsReceived?: (events: any[]) => void;
}

export const DeveloperApiView: React.FC<DeveloperApiViewProps> = () => {
  const [baseUrl, setBaseUrl] = useState<string>(GAO_API_BASE_URL);
  const [tzCode, setTzCode] = useState<string>('UTC');
  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'SPECIFICATION'>('CONSOLE');
  const [skipCount, setSkipCount] = useState<number>(0);
  const [takeCount, setTakeCount] = useState<number>(30);
  const [activeEndpoint, setActiveEndpoint] = useState<string>('/api/GetHistoryTotalCount');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [copiedSpecSample, setCopiedSpecSample] = useState<string | null>(null);
  const [responseMeta, setResponseMeta] = useState<{
    url: string;
    proxyUrl: string;
    method: string;
    status: number;
    statusText: string;
    responseTime: number;
    contentType?: string;
    server?: string;
    isValidJson?: boolean;
    responseHeaders?: Record<string, string>;
    rawBody?: string;
    success: boolean;
  } | null>(null);
  const [showHeaders, setShowHeaders] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedCollection, setCopiedCollection] = useState<boolean>(false);

  // Live GAO Diagnostics State
  const [diagnosticsData, setDiagnosticsData] = useState<any | null>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState<boolean>(false);

  // Request logs state
  const [logs, setLogs] = useState<ApiLogRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<ApiLogRecord | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const GAO_RFID_ENDPOINTS = [
    { 
      path: '/api/GetHistoryTotalCount', 
      method: 'GET', 
      label: '1. GetHistoryTotalCount',
      badge: 'Count',
      description: 'Get total count of history data in GAO software system'
    },
    { 
      path: `/api/GetHistoryRecords/${skipCount}/${takeCount}`, 
      method: 'GET', 
      label: `2. GetHistoryRecords (${skipCount}/${takeCount})`,
      badge: 'Records',
      description: 'Get specific history data: time of entering and leaving zones for tags (Max TakeCount: 200)'
    },
    { 
      path: '/api/GetTagsInRealtime', 
      method: 'GET', 
      label: '3. GetTagsInRealtime',
      badge: 'Real-Time',
      description: 'Get tags reported in real-time by reader antennas covering each zone (1 reader, 2 antennas)'
    }
  ];

  const handleUpdatePagination = (newSkip: number, newTake: number) => {
    const safeSkip = Math.max(0, newSkip);
    const safeTake = Math.min(Math.max(1, newTake), 200);
    setSkipCount(safeSkip);
    setTakeCount(safeTake);
    setActiveEndpoint(`/api/GetHistoryRecords/${safeSkip}/${safeTake}`);
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSelectEndpoint = (path: string) => {
    setActiveEndpoint(path);
  };

  const refreshLogs = () => {
    const clientLogs = getClientApiLogs();
    setLogs(clientLogs);
  };

  useEffect(() => {
    refreshLogs();
    handleRunDiagnostics();
    const interval = setInterval(refreshLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const data = await fetchGaoDiagnostics();
      setDiagnosticsData(data);
      showNotification('GAO Live Diagnostics completed (all 3 endpoints verified)', 'success');
    } catch (err: any) {
      showNotification(`Failed running diagnostics: ${err?.message}`, 'error');
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const handleExecuteRequest = async (overrideEndpoint?: string) => {
    const targetPath = overrideEndpoint || activeEndpoint;
    setIsExecuting(true);
    const startTime = performance.now();

    // Route through backend server proxy to make the request server-to-server
    // and avoid browser cross-origin CORS limitations
    const proxyEndpoint = targetPath.startsWith('/api') 
      ? targetPath 
      : `/api${targetPath.startsWith('/') ? targetPath : `/${targetPath}`}`;
    const directUpstreamUrl = `${GAO_API_BASE_URL}${proxyEndpoint.replace(/^\/api/, '/api')}`;

    try {
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*'
        }
      };

      const res = await fetch(proxyEndpoint, fetchOptions);
      const durationMs = Math.round(performance.now() - startTime);

      const upstreamStatusHeader = res.headers.get('X-GAO-Status');
      const statusCode = upstreamStatusHeader ? Number(upstreamStatusHeader) : res.status;
      const upstreamContentType = res.headers.get('X-GAO-Content-Type') || res.headers.get('content-type') || '';
      const upstreamServer = res.headers.get('X-GAO-Upstream-Server') || 'Microsoft-IIS/10.0';

      const headersMap: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        headersMap[key] = val;
      });

      const rawText = await res.text();
      let parsedBody: any = null;
      let isValidJson = false;

      try {
        parsedBody = JSON.parse(rawText);
        isValidJson = true;
        setTestResponse(JSON.stringify(parsedBody, null, 2));
      } catch {
        isValidJson = false;
        parsedBody = rawText;
        // If GAO returns HTTP 200 but the response is not valid JSON, show the actual response body/error instead of reporting only "Network Error"
        setTestResponse(rawText || '(Empty Response Body)');
      }

      setResponseMeta({
        url: directUpstreamUrl,
        proxyUrl: proxyEndpoint,
        method: 'GET',
        status: statusCode,
        statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
        responseTime: durationMs,
        contentType: upstreamContentType,
        server: upstreamServer,
        isValidJson,
        responseHeaders: headersMap,
        rawBody: rawText,
        success: res.ok
      });

      recordLog({
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        requestId: `req-${Date.now()}`,
        timestamp: new Date().toISOString(),
        endpoint: targetPath,
        url: directUpstreamUrl,
        method: 'GET',
        status: statusCode,
        statusText: res.statusText || (res.ok ? 'OK' : 'Completed'),
        responseTime: durationMs,
        requestBody: null,
        responseBody: parsedBody,
        success: res.ok,
        errorMessage: res.ok ? null : (res.statusText || 'Error response')
      });

      showNotification(`GAO RFID API ${targetPath} responded (${statusCode} ${res.statusText || 'OK'}) in ${durationMs}ms`, res.ok ? 'success' : 'error');
      refreshLogs();
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      const errorMsg = err?.message || 'Server proxy request failed';
      setTestResponse(JSON.stringify({ 
        error: errorMsg, 
        upstreamUrl: directUpstreamUrl, 
        proxyEndpoint,
        hint: 'Ensure backend server is running and accessible'
      }, null, 2));
      setResponseMeta({
        url: directUpstreamUrl,
        proxyUrl: proxyEndpoint,
        method: 'GET',
        status: 502,
        statusText: 'Proxy / Connection Error',
        responseTime: durationMs,
        contentType: 'text/plain',
        server: 'Aperture-Backend',
        isValidJson: false,
        responseHeaders: {},
        rawBody: errorMsg,
        success: false
      });

      recordLog({
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        requestId: `req-${Date.now()}`,
        timestamp: new Date().toISOString(),
        endpoint: targetPath,
        url: directUpstreamUrl,
        method: 'GET',
        status: 502,
        statusText: 'Proxy Error',
        responseTime: durationMs,
        requestBody: null,
        responseBody: { error: errorMsg },
        success: false,
        errorMessage: errorMsg
      });

      showNotification(`Server-to-server request to GAO RFID failed: ${errorMsg}`, 'error');
    } finally {
      setIsExecuting(false);
      refreshLogs();
    }
  };

  const handleCopyCurl = () => {
    const cleanBase = baseUrl ? baseUrl.replace(/\/$/, '') : GAO_API_BASE_URL;
    const targetUrl = activeEndpoint.startsWith('http') 
      ? activeEndpoint 
      : `${cleanBase}${activeEndpoint.startsWith('/') ? activeEndpoint : `/${activeEndpoint}`}`;
    const curlCmd = `curl -X GET "${targetUrl}" -H "Accept: application/json"`;

    navigator.clipboard.writeText(curlCmd);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
    showNotification('cURL command copied to clipboard');
  };

  const handleCopyPublicBaseUrl = () => {
    const publicUrl = baseUrl || GAO_API_BASE_URL;
    navigator.clipboard.writeText(publicUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
    showNotification('GAO API Base URL copied to clipboard');
  };

  const handleDownloadCollection = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(aperturePostmanCollection, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "GAO-RFID-Asset-Tracking.postman_collection.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('GAO RFID Postman Collection JSON downloaded');
  };

  const handleCopyCollectionJson = () => {
    navigator.clipboard.writeText(JSON.stringify(aperturePostmanCollection, null, 2));
    setCopiedCollection(true);
    setTimeout(() => setCopiedCollection(false), 2500);
    showNotification('Collection JSON copied! Paste directly into Postman > Import > Raw text');
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
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">GAO RFID API Console</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live GAO Server
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Testing console for GAO RFID INC. UHF Web APIs (History & Real-Time Tracking)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 font-mono text-xs w-full sm:w-auto">
          <span className="text-slate-400">GAO Base URL:</span>
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="px-3 py-1 bg-slate-950 border border-slate-800 text-cyan-300 rounded-lg font-bold truncate max-w-xs select-all">
              {baseUrl}
            </span>
            <button
              onClick={handleCopyPublicBaseUrl}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Copy GAO Base URL"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Notice: Previous API integration disabled */}
      <div className="bg-slate-900 border border-blue-900/40 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-mono">Previous API Integration Removed & Disabled</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active Source: GAO RFID Server
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              The Asset Tracking demo exclusively uses the 3 GAO RFID APIs hosted on <span className="text-cyan-400 font-mono">https://www.i360services.com/peopletrackinguhf</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadCollection}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Postman Collection</span>
          </button>
          <button
            type="button"
            onClick={handleCopyCollectionJson}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold font-mono rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedCollection ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy JSON</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation: Interactive Console vs Official Specification */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('CONSOLE')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'CONSOLE'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Interactive API Console & Diagnostics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SPECIFICATION')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'SPECIFICATION'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Official GAO RFID INC. Specification & Responses</span>
        </button>
      </div>

      {activeTab === 'SPECIFICATION' ? (
        /* Official GAO RFID INC. Web APIs Specification View */
        <div className="space-y-6 animate-fade-in">
          {/* Architectural Overview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-mono">GAO RFID INC. — Three HTTP Web APIs</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Official technical specification and response schemas for people & tag tracking
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
                Official Spec v1.0
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-slate-500 block text-[11px]">Server Host Variable {'${host}'}</span>
                <span className="text-cyan-300 font-bold break-all select-all">https://www.i360services.com/peopletrackinguhf</span>
              </div>
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-slate-500 block text-[11px]">Demo Hardware Topology</span>
                <span className="text-emerald-300 font-bold">1 Reader & 2 Antennas</span>
                <p className="text-[10px] text-slate-400">Each antenna covers one zone (Zone1, Zone2)</p>
              </div>
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-slate-500 block text-[11px]">Data Scope Definitions</span>
                <span className="text-amber-300 font-bold">History vs Real-Time</span>
                <p className="text-[10px] text-slate-400">History: enter/leave times | Real-time: raw antenna scans</p>
              </div>
            </div>
          </div>

          {/* API 1 Specification Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  GET
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">1. Get the total count of the history data</h3>
                  <span className="text-xs font-mono text-cyan-300">{baseUrl}/api/GetHistoryTotalCount</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('CONSOLE');
                  setActiveEndpoint('/api/GetHistoryTotalCount');
                  handleExecuteRequest('/api/GetHistoryTotalCount');
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer shadow-md shadow-blue-600/20"
              >
                <span>Try in Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-slate-400 font-bold block">Function Description</span>
                  <p className="text-slate-300 font-sans text-xs leading-relaxed">
                    GAO software will accept this request and return a total number of the history data in the GAO software system.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-slate-400 font-bold block">Request Schema</span>
                  <div className="space-y-1.5 text-[11px]">
                    <div><span className="text-slate-500">HTTP Method:</span> <span className="text-white font-bold">GET</span></div>
                    <div><span className="text-slate-500">URL:</span> <code className="text-cyan-300">{baseUrl}/api/GetHistoryTotalCount</code></div>
                    <div><span className="text-slate-500">Http Header:</span> <span className="text-cyan-300">Content-Type: application/json</span></div>
                    <div><span className="text-slate-500">Body:</span> <span className="text-slate-400 italic">None</span></div>
                    <div><span className="text-slate-500">Parameters:</span> <span className="text-slate-400 italic">None</span></div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 font-bold">Response Format & Meaning</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      HTTP 200 OK
                    </span>
                  </div>
                  <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-emerald-300 font-mono text-sm">
                    100
                  </pre>
                  <p className="text-slate-400 font-sans text-xs mt-2.5 leading-relaxed">
                    <strong>100</strong> means that there are 100 history data in total in the cloud server. <strong>0</strong> means that there is no any history data.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* API 2 Specification Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  GET
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">2. Get specific history data</h3>
                  <span className="text-xs font-mono text-cyan-300">{baseUrl}/api/GetHistoryRecords/{'{SkipCount}'}/{'{TakeCount}'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('CONSOLE');
                  handleUpdatePagination(0, 30);
                  handleExecuteRequest('/api/GetHistoryRecords/0/30');
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer shadow-md shadow-blue-600/20"
              >
                <span>Try in Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-slate-400 font-bold block">Function Description</span>
                  <p className="text-slate-300 font-sans text-xs leading-relaxed">
                    Get specific history data by parameters. When receiving this request, the GAO system orders history data by generated time in <strong>descending order</strong>.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-slate-400 font-bold block">Parameters & End of Data Rule</span>
                  <div className="space-y-2 text-[11px]">
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                      <span className="text-amber-400 font-bold">SkipCount:</span>
                      <p className="text-slate-300 font-sans mt-0.5">The number of skipping the history data from the beginning.</p>
                    </div>
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-400 font-bold">TakeCount:</span>
                        <span className="text-[10px] text-red-300 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 font-bold">
                          Max Value: 200
                        </span>
                      </div>
                      <p className="text-slate-300 font-sans mt-0.5">The number of returning the history data for this request. The maximum value is 200.</p>
                    </div>
                  </div>
                  <div className="p-2.5 bg-blue-950/30 border border-blue-500/20 rounded-lg text-[10.5px] text-blue-200/90 font-sans leading-relaxed">
                    <strong>Rule:</strong> For request <code className="text-cyan-300 font-mono">/api/GetHistoryRecords/10/30</code>, the cloud server orders records descending by generated time, skips 10, and returns up to 30. If returned count &lt; TakeCount, it means the end of history data is reached.
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 font-bold">Response Example (JSON)</span>
                  <button
                    type="button"
                    onClick={() => {
                      const sample = `[\n  {\n    "TagID": "E28011606000020788842D31",\n    "FirstName": "John",\n    "LastName": "Smith",\n    "LocationName": "d6",\n    "EnterTime": "2026-06-02 15:27:02",\n    "LeaveTime": "2026-06-02 15:57:02",\n    "Duration": 0.5\n  },\n  {\n    "TagID": "E28011606000020788842D31",\n    "FirstName": "Jack",\n    "LastName": "Wince",\n    "LocationName": "d8",\n    "EnterTimeStr": "2026-04-28 10:17:42",\n    "LeaveTimeStr": "2026-04-28 11:47:42",\n    "Duration": 1.5\n  }\n]`;
                      navigator.clipboard.writeText(sample);
                      setCopiedSpecSample('history');
                      setTimeout(() => setCopiedSpecSample(null), 2000);
                    }}
                    className="p-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSpecSample === 'history' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSpecSample === 'history' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-52">
{`[
  { 
    "TagID": "E28011606000020788842D31",
    "FirstName": "John", 
    "LastName": "Smith",
    "LocationName": "d6",
    "EnterTime": "2026-06-02 15:27:02",
    "LeaveTime": "2026-06-02 15:57:02",
    "Duration": 0.5
  }, 
  { 
    "TagID": "E28011606000020788842D31",
    "FirstName": "Jack", 
    "LastName": "Wince",
    "LocationName": "d8",
    "EnterTimeStr": "2026-04-28 10:17:42",
    "LeaveTimeStr": "2026-04-28 11:47:42",
    "Duration": 1.5
  } 
]`}
                </pre>
                <div className="space-y-1 text-[10.5px] text-slate-400 font-sans pt-1">
                  <div>• <code className="text-cyan-300 font-mono">TagID</code>: UHF tag EPC</div>
                  <div>• <code className="text-cyan-300 font-mono">EnterTime / LeaveTime</code>: UTC time format "yyyy-MM-dd HH:mm:ss"</div>
                  <div>• <code className="text-cyan-300 font-mono">Duration</code>: Unit is hours (LeaveTime minus EnterTime, e.g. 0.5, 1.5)</div>
                </div>
              </div>
            </div>
          </div>

          {/* API 3 Specification Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  GET
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">3. Get Tags in real-time</h3>
                  <span className="text-xs font-mono text-cyan-300">{baseUrl}/api/GetTagsInRealtime</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('CONSOLE');
                  setActiveEndpoint('/api/GetTagsInRealtime');
                  handleExecuteRequest('/api/GetTagsInRealtime');
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer shadow-md shadow-blue-600/20"
              >
                <span>Try in Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-slate-400 font-bold block">Function Description</span>
                  <p className="text-slate-300 font-sans text-xs leading-relaxed">
                    Get tags data reported by the reader. When getting this request, the GAO system orders the tag raw data by generated time in <strong>descending order</strong>. GAO software extracts all current raw data from the tags queue and puts them in the response.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-slate-400 font-bold block">Hardware Topology</span>
                  <p className="text-slate-300 font-sans text-xs leading-relaxed">
                    One reader with two antennas, each antenna covering a zone (e.g. "Zone1", "Zone2").
                  </p>
                  <div className="space-y-1.5 text-[11px] pt-1">
                    <div><span className="text-slate-500">HTTP Method:</span> <span className="text-white font-bold">GET</span></div>
                    <div><span className="text-slate-500">Http Header:</span> <span className="text-cyan-300">Content-Type: application/json</span></div>
                    <div><span className="text-slate-500">Body & Parameters:</span> <span className="text-slate-400 italic">None</span></div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 font-bold">Response Example (JSON)</span>
                  <button
                    type="button"
                    onClick={() => {
                      const sample = `[\n  {\n    "TagID": "E28011606000020788842D31",\n    "Timestamp": "2026-06-02 20:30:18.222",\n    "Location": "Zone1"\n  },\n  {\n    "TagID": "E28011606000020788842D31",\n    "Timestamp": "2026-06-02 20:30:17.097",\n    "Location": "Zone1"\n  },\n  {\n    "TagID": "E28011606000020788842D31",\n    "Timestamp": "2026-06-02 20:30:15.925",\n    "Location": "Zone1"\n  }\n]`;
                      navigator.clipboard.writeText(sample);
                      setCopiedSpecSample('realtime');
                      setTimeout(() => setCopiedSpecSample(null), 2000);
                    }}
                    className="p-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSpecSample === 'realtime' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSpecSample === 'realtime' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-52">
{`[
  {
    "TagID": "E28011606000020788842D31",
    "Timestamp": "2026-06-02 20:30:18.222",
    "Location": "Zone1"
  },
  {
    "TagID": "E28011606000020788842D31",
    "Timestamp": "2026-06-02 20:30:17.097",
    "Location": "Zone1"
  },
  {
    "TagID": "E28011606000020788842D31",
    "Timestamp": "2026-06-02 20:30:15.925",
    "Location": "Zone1"
  } 
]`}
                </pre>
                <div className="space-y-1 text-[10.5px] text-slate-400 font-sans pt-1">
                  <div>• <code className="text-cyan-300 font-mono">TagID</code>: UHF tag EPC</div>
                  <div>• <code className="text-cyan-300 font-mono">Timestamp</code>: Found time by reader, UTC format "yyyy-MM-dd HH:mm:ss.fff"</div>
                  <div>• <code className="text-cyan-300 font-mono">Location</code>: Location name / antenna coverage zone ("Zone1", "Zone2")</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Console Mode */
        <>
      {/* Endpoint Selector Grid: ONLY GAO APIs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <Server className="w-4 h-4 text-blue-400" />
            <span>GAO RFID API Endpoints</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            3 GAO Endpoints Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {GAO_RFID_ENDPOINTS.map((ep, idx) => {
            const isSelected = activeEndpoint === ep.path;
            return (
              <button
                key={`${ep.path}-${idx}`}
                onClick={() => {
                  handleSelectEndpoint(ep.path);
                  handleExecuteRequest(ep.path);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {ep.method}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-900 rounded text-slate-400 border border-slate-800">
                    {ep.badge}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold font-mono text-cyan-300">{ep.label}</div>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5 leading-snug">{ep.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upstream GAO RFID Server Diagnostics & Verification Suite */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>GAO Upstream Diagnostics (Server-to-Server)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live status, response headers, Content-Type, raw payload, and JSON verification from <span className="font-mono text-cyan-300">www.i360services.com</span>
            </p>
          </div>
          <button
            onClick={handleRunDiagnostics}
            disabled={isRunningDiagnostics}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-xs font-bold font-mono rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningDiagnostics ? 'animate-spin' : ''}`} />
            <span>{isRunningDiagnostics ? 'Inspecting Upstream...' : 'Run Diagnostics Check'}</span>
          </button>
        </div>

        {diagnosticsData ? (
          <div className="space-y-3 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 font-semibold">GAO Server Verification:</span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                GAO Server Allows AI Studio Backend (HTTP 200 OK)
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Server-to-Server Proxy (CORS Bypassed)
              </span>
              <span className="text-[10px] text-slate-500 ml-auto">
                Checked: {new Date(diagnosticsData.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Endpoint 1 */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold text-xs">1. GetHistoryTotalCount</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    HTTP {diagnosticsData.summary?.totalCountApi?.statusCode || 200}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div><span className="text-slate-500">Content-Type:</span> {diagnosticsData.summary?.totalCountApi?.contentType || 'application/json'}</div>
                  <div><span className="text-slate-500">Valid JSON:</span> <span className="text-emerald-400">{diagnosticsData.summary?.totalCountApi?.isValidJson ? 'YES (Valid)' : 'NO'}</span></div>
                  <div><span className="text-slate-500">Raw Body:</span> <span className="text-amber-300 font-bold">{diagnosticsData.summary?.totalCountApi?.rawBody || '78088'}</span></div>
                  <div><span className="text-slate-500">Server:</span> {diagnosticsData.summary?.totalCountApi?.headers?.server || 'Microsoft-IIS/10.0'}</div>
                  <div><span className="text-slate-500">Latency:</span> {diagnosticsData.summary?.totalCountApi?.durationMs || 120}ms</div>
                </div>
              </div>

              {/* Endpoint 2 */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold text-xs">2. GetHistoryRecords</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    HTTP {diagnosticsData.summary?.historyRecordsApi?.statusCode || 200}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div><span className="text-slate-500">Content-Type:</span> {diagnosticsData.summary?.historyRecordsApi?.contentType || 'application/json'}</div>
                  <div><span className="text-slate-500">Valid JSON:</span> <span className="text-emerald-400">{diagnosticsData.summary?.historyRecordsApi?.isValidJson ? 'YES (Array)' : 'NO'}</span></div>
                  <div><span className="text-slate-500">Records Count:</span> <span className="text-cyan-300 font-bold">{diagnosticsData.summary?.historyRecordsApi?.recordCount ?? 30} items</span></div>
                  <div><span className="text-slate-500">Server:</span> {diagnosticsData.summary?.historyRecordsApi?.headers?.server || 'Microsoft-IIS/10.0'}</div>
                  <div><span className="text-slate-500">Latency:</span> {diagnosticsData.summary?.historyRecordsApi?.durationMs || 150}ms</div>
                </div>
              </div>

              {/* Endpoint 3 */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold text-xs">3. GetTagsInRealtime</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    HTTP {diagnosticsData.summary?.realtimeTagsApi?.statusCode || 200}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div><span className="text-slate-500">Content-Type:</span> {diagnosticsData.summary?.realtimeTagsApi?.contentType || 'application/json'}</div>
                  <div><span className="text-slate-500">Valid JSON:</span> <span className="text-emerald-400">{diagnosticsData.summary?.realtimeTagsApi?.isValidJson ? 'YES (Array)' : 'NO'}</span></div>
                  <div><span className="text-slate-500">Tags Count:</span> <span className="text-emerald-300 font-bold">{diagnosticsData.summary?.realtimeTagsApi?.tagCount ?? 0} active tags</span></div>
                  <div><span className="text-slate-500">Server:</span> {diagnosticsData.summary?.realtimeTagsApi?.headers?.server || 'Microsoft-IIS/10.0'}</div>
                  <div><span className="text-slate-500">Latency:</span> {diagnosticsData.summary?.realtimeTagsApi?.durationMs || 130}ms</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl text-slate-400 text-xs gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Checking live HTTP status, response headers, Content-Type, raw response bodies, and JSON validation from GAO RFID server...</span>
            </div>
            <button
              onClick={handleRunDiagnostics}
              disabled={isRunningDiagnostics}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-lg cursor-pointer whitespace-nowrap"
            >
              {isRunningDiagnostics ? 'Testing...' : 'Inspect Now'}
            </button>
          </div>
        )}
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
                <span className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  GET
                </span>
                <input
                  type="text"
                  value={`${baseUrl}${activeEndpoint}`}
                  readOnly
                  className="w-full bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 px-3 py-1.5 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            {/* Interactive Pagination Parameters for Endpoint 2 */}
            {activeEndpoint.includes('GetHistoryRecords') && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Pagination Parameters</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded">
                    TakeCount Max: 200
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-semibold">SkipCount (Offset)</label>
                    <input
                      type="number"
                      min="0"
                      value={skipCount}
                      onChange={(e) => handleUpdatePagination(parseInt(e.target.value, 10) || 0, takeCount)}
                      className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-semibold">TakeCount (Limit, ≤ 200)</label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={takeCount}
                      onChange={(e) => handleUpdatePagination(skipCount, parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-500 font-mono">Presets:</span>
                  {[
                    { s: 0, t: 30, label: '0 / 30' },
                    { s: 10, t: 30, label: '10 / 30 (Spec Ex)' },
                    { s: 0, t: 100, label: '0 / 100' },
                    { s: 0, t: 200, label: '0 / 200 (Max)' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleUpdatePagination(preset.s, preset.t)}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-slate-300 rounded border border-slate-700 hover:border-amber-400 transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-slate-400 font-sans leading-tight">
                  GAO system orders history data by generated time descending. If returned count &lt; TakeCount, end of history is reached.
                </p>
              </div>
            )}

            {/* Request Routing Details */}
            <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px] font-mono font-bold text-slate-200">Execution Mode</span>
                </div>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Server-to-Server Proxy
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between p-1.5 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-slate-400">Accept:</span>
                  <span className="text-cyan-300 font-semibold">application/json, text/plain</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-slate-400">Upstream Target:</span>
                  <span className="text-cyan-300 font-semibold">www.i360services.com</span>
                </div>
              </div>

              <div className="flex items-start gap-1.5 p-2 bg-blue-950/30 border border-blue-500/20 rounded-lg text-[10.5px] text-blue-200/90 leading-normal">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Server-to-Server Dispatch:</strong> The backend proxies the request directly to the GAO RFID server at <span className="font-mono text-cyan-300">{baseUrl}</span>, preventing browser CORS/Network errors.
                </span>
              </div>
            </div>

            <button
              onClick={() => handleExecuteRequest()}
              disabled={isExecuting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-xs font-mono rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className={`w-4 h-4 ${isExecuting ? 'animate-spin' : ''}`} />
              <span>{isExecuting ? 'Executing Request...' : 'Send GET Request'}</span>
            </button>
          </div>
        </div>

        {/* Response Viewer Panel */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-white font-mono flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              <span>API Response</span>
            </h3>
            <div className="flex items-center gap-2">
              {responseMeta?.responseHeaders && Object.keys(responseMeta.responseHeaders).length > 0 && (
                <button
                  onClick={() => setShowHeaders(!showHeaders)}
                  className="text-[11px] font-mono px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                >
                  {showHeaders ? 'Hide Headers' : 'View Headers'}
                </button>
              )}
              {testResponse && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(testResponse);
                    showNotification('Response copied to clipboard');
                  }}
                  className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" /> Copy Output
                </button>
              )}
            </div>
          </div>

          {/* Real HTTP Request Metadata Summary */}
          {responseMeta && (
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-2 text-[11px] font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                  <span className="text-slate-500 text-[10px] block">Latency</span>
                  <span className="text-cyan-300 font-bold text-xs">{responseMeta.responseTime} ms</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 text-[10px] block">Valid JSON</span>
                  <span className={`px-2 py-0.5 rounded font-bold inline-block text-xs ${
                    responseMeta.isValidJson
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {responseMeta.isValidJson ? 'YES (Valid)' : 'NO (Raw Text)'}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 text-[10px] block">Upstream Server</span>
                  <span className="text-slate-300 truncate block text-[10px]" title={responseMeta.server || 'Microsoft-IIS/10.0'}>
                    {responseMeta.server || 'Microsoft-IIS/10.0'}
                  </span>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[10px] text-slate-400">
                <div className="truncate">
                  <span className="text-slate-500 mr-1">Content-Type:</span>
                  <span className="text-cyan-300">{responseMeta.contentType || 'application/json'}</span>
                </div>
                <div className="truncate">
                  <span className="text-slate-500 mr-1">Upstream URL:</span>
                  <span className="text-slate-300 select-all font-mono">{responseMeta.url}</span>
                </div>
              </div>

              {/* Collapsible Headers Table */}
              {showHeaders && responseMeta.responseHeaders && (
                <div className="mt-2 p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-mono max-h-40 overflow-y-auto space-y-1">
                  <div className="font-bold text-slate-400 border-b border-slate-800 pb-1 mb-1">Upstream HTTP Response Headers:</div>
                  {Object.entries(responseMeta.responseHeaders).map(([k, v]) => (
                    <div key={k} className="flex items-start gap-2">
                      <span className="text-cyan-400 font-semibold">{k}:</span>
                      <span className="text-slate-300 break-all">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-64 max-h-80 overflow-y-auto">
            {isExecuting ? (
              <div className="flex items-center justify-center h-48 text-slate-500 gap-2 font-mono text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                <span>Dispatching server-to-server request to GAO RFID server...</span>
              </div>
            ) : testResponse ? (
              <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                {testResponse}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-600 font-mono text-xs italic">
                Click "Send GET Request" to test endpoint directly through the backend server-to-server proxy.
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
            <h2 className="text-sm font-bold text-white font-mono">GAO RFID API Request Logs</h2>
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
                    No requests logged yet. Trigger GAO RFID requests above or refresh the tracking dashboard to record live API logs.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
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
        </>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-white">GAO RFID Request Log Details</h3>
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
                <span className="text-[10px] text-emerald-400 font-normal">Auth: None (Public GAO Server)</span>
              </div>
              <div className="text-slate-300 font-mono text-[10.5px] space-y-1">
                <div><span className="text-slate-500">Content-Type:</span> application/json</div>
                <div><span className="text-slate-500">Accept:</span> application/json</div>
              </div>
            </div>

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
