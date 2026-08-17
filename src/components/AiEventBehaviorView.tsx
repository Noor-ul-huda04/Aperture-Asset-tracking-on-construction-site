import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  ShieldAlert, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  TrendingUp, 
  Search, 
  Boxes, 
  Clock, 
  MapPin, 
  Zap,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { ReadEvent, Asset } from '../types';

interface AiEventBehaviorViewProps {
  events: ReadEvent[];
  assets: Asset[];
  onRefreshData?: () => void;
}

export const AiEventBehaviorView: React.FC<AiEventBehaviorViewProps> = ({
  events,
  assets,
  onRefreshData
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [analysisResult, setAnalysisResult] = useState<{
    riskScore: number;
    riskLevel: string;
    anomaliesDetected: string[];
    topFlaggedAssets: string[];
    executiveSummary: string;
  } | null>(null);

  const handleRunAiBehaviorAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze-behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          setAnalysisResult(data.analysis);
        }
      }
    } catch (e) {
      console.error('Failed to run AI behavior analysis:', e);
    } finally {
      setAnalyzing(false);
      if (onRefreshData) onRefreshData();
    }
  };

  const filteredEvents = (events || []).filter(e => 
    (e.assetName || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
    (e.readerName || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
    (e.zoneName || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
    (e.epc || '').toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 uppercase tracking-widest font-mono">
              AI Event Analytics Engine
            </span>
            <span className="text-xs text-slate-500 font-mono">Gemini 3.7 Flash Active</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <BrainCircuit className="w-7 h-7 text-blue-600" />
            <span>Real-Time RFID Event Behavioral Intelligence</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Detect asset movement anomalies, off-hours scans, zone-hopping patterns, and equipment hoarding behaviors using server-side Gemini AI.
          </p>
        </div>

        <button
          onClick={handleRunAiBehaviorAnalysis}
          disabled={analyzing}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/10 flex items-center gap-2 transition-all active:scale-95 shrink-0"
        >
          {analyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Event Stream...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>Run AI Behavioral Scan</span>
            </>
          )}
        </button>
      </div>

      {/* AI Behavioral Overview & Risk Card */}
      {analysisResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Anomaly Threat Gauge Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Behavioral Risk Index
            </span>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-4xl font-black text-slate-900 font-mono">
                  {analysisResult.riskScore}
                </span>
                <span className="text-xs text-slate-500 font-mono"> / 100 Risk</span>
              </div>

              <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase font-mono border ${
                analysisResult.riskLevel === 'HIGH' || analysisResult.riskLevel === 'CRITICAL'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : analysisResult.riskLevel === 'MEDIUM'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {analysisResult.riskLevel} THREAT
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  analysisResult.riskScore > 60 ? 'bg-red-600' : analysisResult.riskScore > 30 ? 'bg-amber-500' : 'bg-emerald-600'
                }`}
                style={{ width: `${analysisResult.riskScore}%` }}
              />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
              {analysisResult.executiveSummary}
            </p>
          </div>

          {/* Detected Anomalies List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3 lg:col-span-2">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block flex items-center justify-between">
              <span>Flagged Behavioral Anomalies ({(analysisResult.anomaliesDetected || []).length})</span>
              <ShieldAlert className="w-4 h-4 text-amber-600" />
            </span>

            <div className="space-y-2">
              {(analysisResult.anomaliesDetected || []).map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-slate-800 leading-tight">{item}</span>
                </div>
              ))}
            </div>

            {(analysisResult.topFlaggedAssets || []).length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[11px] font-mono text-slate-500 font-bold block mb-1.5">
                  High-Risk Assets Under Observation:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(analysisResult.topFlaggedAssets || []).map((name, i) => (
                    <span key={i} className="text-xs font-mono px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 font-semibold">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
          <BrainCircuit className="w-10 h-10 text-blue-600 animate-pulse" />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Ready for Behavioral Stream Scan</h3>
            <p className="text-xs text-slate-500 mt-0.5">Click "Run AI Behavioral Scan" above to analyze real-time RFID event velocity, worker dwell time, and zone transitions.</p>
          </div>
        </div>
      )}

      {/* Real-Time RFID Event Stream Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span>Server-Synced RFID Event Telemetry Stream</span>
            </h3>
            <p className="text-xs text-slate-500">Live incoming tag pulses from reader gateways and mobile handhelds</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder="Search event logs..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono text-[11px]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Asset Item</th>
                <th className="py-2.5 px-3">Tag EPC</th>
                <th className="py-2.5 px-3">Gateway Reader</th>
                <th className="py-2.5 px-3">Zone</th>
                <th className="py-2.5 px-3">RSSI</th>
                <th className="py-2.5 px-3">Event Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.slice(0, 20).map(evt => (
                <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                    {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'N/A'}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    {evt.assetName}
                  </td>
                  <td className="py-3 px-3 font-mono text-blue-800 font-bold">
                    {evt.epc ? (evt.epc.length > 12 ? evt.epc.slice(-12) : evt.epc) : 'N/A'}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {evt.readerName}
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-semibold">
                    {evt.zoneName}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-amber-700">
                    {evt.rssi} dBm
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      evt.eventType === 'ENTER' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      evt.eventType === 'EXIT' ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}>
                      {evt.eventType}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
