import React, { useState } from 'react';
import { AiInsight, Asset, Project, Site } from '../types';
import { 
  Sparkles, 
  TrendingDown, 
  AlertTriangle, 
  ArrowRightLeft, 
  Boxes, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  Wrench,
  HelpCircle
} from 'lucide-react';

interface AiInsightsViewProps {
  insights: AiInsight[];
  assets: Asset[];
  projects: Project[];
  sites: Site[];
  onExecuteRecommendation?: (insight: AiInsight) => void;
}

export const AiInsightsView: React.FC<AiInsightsViewProps> = ({
  insights,
  assets,
  projects,
  sites,
  onExecuteRecommendation
}) => {
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [acknowledgedInsights, setAcknowledgedInsights] = useState<string[]>([]);

  const filteredInsights = insights.filter(i => {
    if (categoryFilter !== 'ALL' && i.category !== categoryFilter) return false;
    return true;
  });

  const toggleAcknowledge = (id: string) => {
    setAcknowledgedInsights(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">AI Asset Decision Support & Telematics Insights</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Machine learning models continuously evaluate GPS trails, engine hour thresholds, rental idle costs, and multi-site project demands.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Analysis Categories</option>
            <option value="Low Utilization">Low Asset Utilization</option>
            <option value="Maintenance Risk">Maintenance Risk</option>
            <option value="Movement Anomaly">Movement Anomaly</option>
            <option value="Asset Allocation">Multi-Project Allocation</option>
          </select>
        </div>
      </div>

      {/* Mandatory Advisory Notice Banner (Requested in Section 15) */}
      <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 text-indigo-950 flex items-start gap-3 shadow-2xs">
        <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-black text-indigo-900 block text-sm">
            AI Recommendations & Decision Support Notice
          </span>
          <p className="text-indigo-800/90 mt-0.5 leading-relaxed">
            All intelligence suggestions are <strong>strictly advisory decision-support recommendations</strong>. 
            Automated field dispatches and machinery reallocations are disabled by system safety policy; human operational approval from a certified Project Manager or Equipment Director is required prior to execution.
          </p>
        </div>
      </div>

      {/* Insights Cards Feed */}
      <div className="space-y-4">
        {filteredInsights.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Insufficient operational data for analysis.</h3>
              <p className="text-xs text-slate-500">
                AI decision-support analysis requires real operational data from GPS trails, engine hour logs, or maintenance records in the database.
              </p>
            </div>
          </div>
        ) : (
          filteredInsights.map((insight) => {
          const isAcked = acknowledgedInsights.includes(insight.id);

          return (
            <div
              key={insight.id}
              className={`p-6 rounded-2xl border bg-white shadow-xs transition-all text-left space-y-4 ${
                insight.severity === 'Critical' 
                  ? 'border-rose-300 ring-1 ring-rose-200' 
                  : insight.severity === 'High'
                  ? 'border-amber-200'
                  : 'border-slate-200'
              } ${isAcked ? 'opacity-70 bg-slate-50/60' : ''}`}
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <span className={`p-2.5 rounded-xl shrink-0 ${
                    insight.category === 'Low Utilization'
                      ? 'bg-amber-100 text-amber-800'
                      : insight.category === 'Maintenance Risk'
                      ? 'bg-purple-100 text-purple-800'
                      : insight.category === 'Movement Anomaly'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {insight.category === 'Low Utilization' && <TrendingDown className="w-5 h-5" />}
                    {insight.category === 'Maintenance Risk' && <Wrench className="w-5 h-5" />}
                    {insight.category === 'Movement Anomaly' && <ShieldAlert className="w-5 h-5" />}
                    {insight.category === 'Asset Allocation' && <Boxes className="w-5 h-5" />}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        insight.severity === 'Critical'
                          ? 'bg-rose-600 text-white'
                          : insight.severity === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {insight.severity} Priority
                      </span>

                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {insight.category}
                      </span>

                      <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-bold">
                        {insight.confidenceScore}% Confidence
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 mt-1.5">{insight.title}</h3>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">
                      Asset: <strong className="text-slate-800">{insight.assetName || 'Multi-Asset Cluster'}</strong> • 
                      Project: <strong className="text-slate-800">{insight.projectName}</strong>
                    </div>
                  </div>
                </div>

                {/* Metric Capsule */}
                <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Telemetry Anomaly Metric</span>
                  <span className="text-sm font-black text-slate-900 font-mono">{insight.metric}</span>
                </div>
              </div>

              {/* Description and Actionable Recommendation */}
              <div className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  {insight.description}
                </p>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-900">
                  <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider block mb-1">
                    AI Decision-Support Recommendation:
                  </span>
                  <div className="font-semibold leading-relaxed">
                    {insight.recommendation}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                <span className="text-[11px] font-mono text-slate-400">
                  Calculated: {new Date(insight.timestamp).toLocaleString()}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAcknowledge(insight.id)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold transition-colors"
                  >
                    {isAcked ? 'Mark Unread' : 'Acknowledge'}
                  </button>

                  {onExecuteRecommendation && (
                    <button
                      onClick={() => onExecuteRecommendation(insight)}
                      className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-xs"
                    >
                      <span>Take Recommended Action</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
      </div>
    </div>
  );
};
