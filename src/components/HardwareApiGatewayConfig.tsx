import React, { useState } from 'react';
import {
  Globe,
  Radio,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  RotateCcw,
  Sliders,
  Zap,
  Lock,
  Wifi,
  Terminal,
  Layers,
  Code2
} from 'lucide-react';
import {
  ApiConnectorConfig,
  getHardwareApiConfig,
  saveHardwareApiConfig,
  resetHardwareApiConfig,
  HardwareApiMode
} from '../services/hardwareApiConfig';

interface HardwareApiGatewayConfigProps {
  onRefreshAll?: () => void;
}

export const HardwareApiGatewayConfig: React.FC<HardwareApiGatewayConfigProps> = ({
  onRefreshAll
}) => {
  const [config, setConfig] = useState<ApiConnectorConfig>(getHardwareApiConfig);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [testEndpointType, setTestEndpointType] = useState<'assets' | 'events'>('events');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testResponseData, setTestResponseData] = useState<any>(null);
  const [testedUrl, setTestedUrl] = useState<string | null>(null);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveHardwareApiConfig(config);
    setSavedStatus('API & Hardware Gateway Connector settings updated successfully!');
    setTimeout(() => setSavedStatus(null), 3500);
    if (onRefreshAll) onRefreshAll();
  };

  const handleReset = () => {
    const resetCfg = resetHardwareApiConfig();
    setConfig(resetCfg);
    setSavedStatus('Reset to default GAO RFID UHF Web API settings.');
    setTimeout(() => setSavedStatus(null), 3000);
    if (onRefreshAll) onRefreshAll();
  };

  const handleTestConnection = async (type: 'assets' | 'events' = testEndpointType) => {
    setTestEndpointType(type);
    setTestStatus('testing');
    setTestMessage(null);
    setTestResponseData(null);

    const relativeEndpoint = type === 'events' ? config.endpoints.getEvents : config.endpoints.getAssets;
    const cleanEndpoint = relativeEndpoint.startsWith('/') ? relativeEndpoint : `/${relativeEndpoint}`;
    const targetUrl = config.baseUrl.replace(/\/$/, '') + cleanEndpoint;
    setTestedUrl(targetUrl);

    const startTime = performance.now();

    // 1. Attempt direct browser fetch first
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json, text/plain, */*'
      };

      if (config.apiKey && config.apiKey.trim()) {
        const headerName = config.authHeaderName || 'X-API-Key';
        headers[headerName] = headerName.toLowerCase() === 'authorization' && !config.apiKey.startsWith('Bearer ')
          ? `Bearer ${config.apiKey}`
          : config.apiKey;
      }

      const res = await fetch(targetUrl, { method: 'GET', headers });
      const durationMs = Math.round(performance.now() - startTime);

      let text = await res.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }

      if (res.ok) {
        setTestStatus('success');
        setTestMessage(`HTTP ${res.status} OK (${durationMs}ms) — Connected directly to ${type === 'events' ? 'Events Telemetry' : 'Assets'} endpoint`);
        setTestResponseData(parsed);
        return;
      }
    } catch (_directErr) {
      // Direct browser fetch failed (e.g. CORS restriction). Proceed to server-side proxy
    }

    // 2. Fall back to backend server-side gateway proxy (bypasses browser CORS & auto-resolves GAO paths)
    try {
      const proxyUrl = `/api/gateway/proxy`;
      const proxyRes = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          authHeaderName: config.authHeaderName || 'X-API-Key',
          apiKey: config.apiKey
        })
      });

      const durationMs = Math.round(performance.now() - startTime);
      const json = await proxyRes.json();

      if (proxyRes.ok && (json.ok || json.status === 200)) {
        setTestStatus('success');
        const resolvedNotice = json.resolvedFrom404 ? ' (Auto-resolved to valid GAO path)' : '';
        setTestMessage(`HTTP ${json.status || 200} OK (${durationMs}ms)${resolvedNotice} — Connected successfully to ${type === 'events' ? 'Events Telemetry' : 'Assets'} endpoint`);
        setTestResponseData(json.data);
      } else {
        setTestStatus('error');
        setTestMessage(`HTTP ${json.status || proxyRes.status} (${durationMs}ms) — ${json.error || 'Server responded with status error.'}`);
        setTestResponseData(json.data || json);
      }
    } catch (proxyErr: any) {
      const durationMs = Math.round(performance.now() - startTime);
      setTestStatus('error');
      setTestMessage(`Gateway Connection Error (${durationMs}ms): ${proxyErr?.message || 'Failed to connect through backend gateway proxy.'}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-mono text-xs">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white font-mono flex items-center gap-2">
                <span>Plug & Play Custom API & Hardware Gateway</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {config.mode}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect your custom REST API, IoT MQTT broker, or hardware RFID reader gateway seamlessly without code changes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Defaults</span>
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Integration</span>
            </button>
          </div>
        </div>

        {savedStatus && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{savedStatus}</span>
          </div>
        )}
      </div>

      {/* Mode Selection */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>1. Select Integration Mode</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              id: 'DEFAULT_GAO',
              label: 'GAO RFID UHF Cloud API',
              desc: 'Official GAO RFID UHF People/Asset tracking Web APIs',
              icon: <Globe className="w-4 h-4 text-blue-600" />
            },
            {
              id: 'CUSTOM_REST',
              label: 'Custom REST API (Your Server)',
              desc: 'Connect your company custom HTTP/JSON endpoints',
              icon: <Code2 className="w-4 h-4 text-emerald-600" />
            },
            {
              id: 'LOCAL_HARDWARE_GATEWAY',
              label: 'Local Hardware Gateway',
              desc: 'Direct IP reader portal & edge gateway integration',
              icon: <Cpu className="w-4 h-4 text-purple-600" />
            },
            {
              id: 'MQTT',
              label: 'MQTT IoT Broker Stream',
              desc: 'Subscribe to active reader push telemetry topics',
              icon: <Radio className="w-4 h-4 text-amber-600" />
            },
            {
              id: 'WEBSOCKET',
              label: 'WebSocket Realtime Stream',
              desc: 'High-frequency RFID tag detection socket stream',
              icon: <Zap className="w-4 h-4 text-cyan-600" />
            }
          ].map((modeItem) => {
            const isSelected = config.mode === modeItem.id;
            return (
              <button
                key={modeItem.id}
                type="button"
                onClick={() => setConfig({ ...config, mode: modeItem.id as HardwareApiMode })}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {modeItem.icon}
                    <span className="font-bold text-slate-900">{modeItem.label}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500 font-sans">{modeItem.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Endpoint & Credential Config */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-600" />
          <span>2. API Base URL, Security Credentials & Endpoints</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-slate-700 font-bold block">API Base URL</label>
            <input
              type="text"
              value={config.baseUrl}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
              placeholder="https://api.yourcompany.com/v1"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
            />
            <p className="text-[10px] text-slate-400">Specify host base URL for all REST API calls</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 font-bold block">Auth Header Name</label>
            <input
              type="text"
              value={config.authHeaderName}
              onChange={(e) => setConfig({ ...config, authHeaderName: e.target.value })}
              placeholder="X-API-Key or Authorization"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
            />
            <p className="text-[10px] text-slate-400">Header key (e.g., X-API-Key, Authorization, X-Token)</p>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-slate-700 font-bold block">API Secret Token / Key</label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="Enter your private API key or bearer token..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
            />
            <p className="text-[10px] text-slate-400">Passed automatically in outgoing request headers</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-bold block">Assets Endpoint Path</label>
              <button
                type="button"
                onClick={() => handleTestConnection('assets')}
                disabled={testStatus === 'testing'}
                className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${testStatus === 'testing' && testEndpointType === 'assets' ? 'animate-spin' : ''}`} />
                <span>Test Assets</span>
              </button>
            </div>
            <input
              type="text"
              value={config.endpoints.getAssets}
              onChange={(e) => setConfig({ ...config, endpoints: { ...config.endpoints, getAssets: e.target.value } })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400">Presets:</span>
              <button
                type="button"
                onClick={() => setConfig({ ...config, endpoints: { ...config.endpoints, getAssets: '/api/GetHistoryRecords/0/30' } })}
                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] cursor-pointer"
              >
                GAO Records: /api/GetHistoryRecords/0/30
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, endpoints: { ...config.endpoints, getAssets: '/api/GetHistoryTotalCount' } })}
                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] cursor-pointer"
              >
                GAO Count: /api/GetHistoryTotalCount
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, endpoints: { ...config.endpoints, getAssets: '/api/v1/assets' } })}
                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] cursor-pointer"
              >
                Custom REST: /api/v1/assets
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-bold block">Events Telemetry Endpoint Path</label>
              <button
                type="button"
                onClick={() => handleTestConnection('events')}
                disabled={testStatus === 'testing'}
                className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${testStatus === 'testing' && testEndpointType === 'events' ? 'animate-spin' : ''}`} />
                <span>Test Events</span>
              </button>
            </div>
            <input
              type="text"
              value={config.endpoints.getEvents}
              onChange={(e) => setConfig({ ...config, endpoints: { ...config.endpoints, getEvents: e.target.value } })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400">Presets:</span>
              <button
                type="button"
                onClick={() => setConfig({ ...config, endpoints: { ...config.endpoints, getEvents: '/api/GetTagsInRealtime' } })}
                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] cursor-pointer"
              >
                GAO Realtime: /api/GetTagsInRealtime
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, endpoints: { ...config.endpoints, getEvents: '/api/v1/events' } })}
                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] cursor-pointer"
              >
                Custom REST: /api/v1/events
              </button>
            </div>
          </div>
        </div>

        {/* Live Test Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTestConnection('events')}
              disabled={testStatus === 'testing'}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' && testEndpointType === 'events' ? 'animate-spin' : ''}`} />
              <span>Test Events Telemetry Endpoint</span>
            </button>
            <button
              type="button"
              onClick={() => handleTestConnection('assets')}
              disabled={testStatus === 'testing'}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${testStatus === 'testing' && testEndpointType === 'assets' ? 'animate-spin' : ''}`} />
              <span>Test Assets Endpoint</span>
            </button>
          </div>
          {testedUrl && (
            <span className="text-[11px] text-slate-500 font-mono truncate max-w-sm">
              Target: {testedUrl}
            </span>
          )}
        </div>

        {testMessage && (
          <div
            className={`p-4 rounded-xl border font-mono text-xs space-y-2 ${
              testStatus === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {testStatus === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{testMessage}</span>
            </div>

            {testResponseData && (
              <div className="bg-slate-950 text-slate-200 p-3 rounded-xl border border-slate-800 max-h-56 overflow-y-auto text-[11px] font-mono">
                <div className="flex items-center justify-between text-slate-400 mb-1 border-b border-slate-800 pb-1">
                  <span>API Response Payload ({Array.isArray(testResponseData) ? `${testResponseData.length} records` : typeof testResponseData}):</span>
                  <span className="text-emerald-400">Valid Response</span>
                </div>
                <pre>{typeof testResponseData === 'string' ? testResponseData : JSON.stringify(testResponseData, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dynamic JSON Schema Field Mapper */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-600" />
          <span>3. Custom Payload JSON Schema Field Mapper</span>
        </h4>
        <p className="text-slate-500 font-sans text-xs">
          Map your custom API's JSON response object properties to Aperture RFID's core data attributes:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(config.fieldMapping).map(([key, val]) => (
            <div key={key} className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <label className="text-[11px] font-bold text-slate-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </label>
              <input
                type="text"
                value={val}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    fieldMapping: { ...config.fieldMapping, [key]: e.target.value }
                  })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 focus:outline-none focus:border-blue-600 text-xs font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Hardware Reader Gateway Settings */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-blue-600" />
          <span>4. Physical Hardware RFID Reader Gateway Settings</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-slate-700 font-bold block">Gateway Reader IP</label>
            <input
              type="text"
              value={config.hardware.readerIp}
              onChange={(e) =>
                setConfig({
                  ...config,
                  hardware: { ...config.hardware, readerIp: e.target.value }
                })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 font-bold block">Gateway Port</label>
            <input
              type="number"
              value={config.hardware.port}
              onChange={(e) =>
                setConfig({
                  ...config,
                  hardware: { ...config.hardware, port: parseInt(e.target.value) || 8080 }
                })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 font-bold block">Antenna Power (dBm)</label>
            <input
              type="number"
              value={config.hardware.antennaPowerDbm}
              onChange={(e) =>
                setConfig({
                  ...config,
                  hardware: { ...config.hardware, antennaPowerDbm: parseInt(e.target.value) || 30 }
                })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 font-bold block">MQTT Telemetry Topic</label>
            <input
              type="text"
              value={config.hardware.mqttTopic}
              onChange={(e) =>
                setConfig({
                  ...config,
                  hardware: { ...config.hardware, mqttTopic: e.target.value }
                })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
