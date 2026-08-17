import React, { useState } from 'react';
import { FileSpreadsheet, Download, Printer, TrendingUp, DollarSign, PieChart as PieIcon, ShieldCheck, CheckCircle2, FileText, X } from 'lucide-react';
import { Asset, MaintenanceLog, AuditLog } from '../types';
import { downloadFile } from '../lib/download';

interface ReportsAnalyticsViewProps {
  assets: Asset[];
  maintenanceLogs: MaintenanceLog[];
  auditLogs: AuditLog[];
}

export const ReportsAnalyticsView: React.FC<ReportsAnalyticsViewProps> = ({
  assets,
  maintenanceLogs,
  auditLogs
}) => {
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const totalFleetCost = (assets || []).reduce((sum, a) => sum + (a.cost || 0), 0);
  const totalRepairCost = (maintenanceLogs || []).reduce((sum, m) => sum + (m.cost || 0), 0);
  const estimatedDepreciation = Math.round(totalFleetCost * 0.15);
  const totalTco = totalFleetCost + totalRepairCost;

  // Breakdown by Category
  const categoryStats: Record<string, { count: number; totalCost: number }> = {};
  (assets || []).forEach(a => {
    const cat = a.category || 'Other';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { count: 0, totalCost: 0 };
    }
    categoryStats[cat].count += 1;
    categoryStats[cat].totalCost += a.cost;
  });

  // Trigger Print
  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Direct print blocked by sandbox iframe, opening print modal preview instead');
      setPrintModalOpen(true);
    }
  };

  // Download Standalone HTML Executive Printable Report File
  const handleSaveHtmlReport = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Aperture Asset Fleet - Executive TCO Report (${dateStr})</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 24px; color: #0f172a; margin-bottom: 4px; }
    p.subtitle { color: #64748b; font-size: 14px; margin-top: 0; }
    .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; rounded: 8px; border-radius: 8px; }
    .card-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
    .card-value { font-size: 22px; font-weight: 800; font-family: monospace; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th { background: #0f172a; color: white; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; }
    td { border-bottom: 1px solid #e2e8f0; padding: 8px 10px; }
    tr:nth-child(even) { background: #f8fafc; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <h1>Aperture Asset Fleet Management</h1>
  <p class="subtitle">Executive Total Cost of Ownership (TCO) & Audit Report &bull; Generated ${new Date().toLocaleString()}</p>
  
  <div class="metric-grid">
    <div class="card">
      <div class="card-label">Total Capital Expenditure</div>
      <div class="card-value" style="color: #0f172a;">$${(totalFleetCost ?? 0).toLocaleString()}</div>
    </div>
    <div class="card">
      <div class="card-label">Cumulative Maintenance Spend</div>
      <div class="card-value" style="color: #d97706;">$${(totalRepairCost ?? 0).toLocaleString()}</div>
    </div>
    <div class="card">
      <div class="card-label">Annual Depreciation (15%)</div>
      <div class="card-value" style="color: #059669;">$${(estimatedDepreciation ?? 0).toLocaleString()}</div>
    </div>
  </div>

  <h2>Asset Fleet Breakdown by Category</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Asset Count</th>
        <th>Total Value ($)</th>
        <th>% Fleet Capital</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(categoryStats).map(([cat, stat]) => `
        <tr>
          <td><strong>${cat}</strong></td>
          <td>${stat.count} items</td>
          <td>$${(stat.totalCost ?? 0).toLocaleString()}</td>
          <td>${((stat.totalCost / (totalFleetCost || 1)) * 100).toFixed(1)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Recent System Audit Trail</h2>
  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>Action</th>
        <th>Target Entity</th>
        <th>User</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
      ${(auditLogs || []).slice(0, 15).map(a => `
        <tr>
          <td>${a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}</td>
          <td><strong>${a.action}</strong></td>
          <td>${a.entityName}</td>
          <td>${a.userName}</td>
          <td>${a.details}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    Aperture UHF RFID Enterprise Asset Management &bull; Verified System Generated Report
  </div>

  <script>
    window.onload = function() {
      // Auto trigger print if opened in new browser tab
      setTimeout(function() { window.print(); }, 500);
    };
  </script>
</body>
</html>`;

    downloadFile(htmlContent, `Aperture_Executive_TCO_Report_${dateStr}.html`, 'text/html');

    setExportSuccess('HTML/PDF Printable Report downloaded successfully!');
    setTimeout(() => setExportSuccess(null), 3000);
  };

  // Export CSV Report
  const handleExportCsvReport = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const rows = [
      ['Aperture Executive Asset & TCO Report', `Generated: ${new Date().toLocaleString()}`],
      [],
      ['FINANCIAL SUMMARY'],
      ['Total Fleet Value', `$${totalFleetCost}`],
      ['Total Cumulative Maintenance', `$${totalRepairCost}`],
      ['Total TCO', `$${totalTco}`],
      ['Annual Depreciation (15%)', `$${estimatedDepreciation}`],
      [],
      ['ASSETS LIST'],
      ['ID', 'Name', 'Category', 'Manufacturer', 'Model', 'Serial #', 'EPC Tag', 'Status', 'Site', 'Cost'],
      ...(assets || []).map(a => [
        a.id,
        `"${a.name.replace(/"/g, '""')}"`,
        a.category,
        a.manufacturer,
        a.model,
        a.serialNumber,
        a.tagEpc,
        a.status,
        `"${a.siteName}"`,
        a.cost
      ]),
      [],
      ['AUDIT LOGS'],
      ['Timestamp', 'Action', 'Entity', 'User', 'Details'],
      ...(auditLogs || []).map(a => [
        a.timestamp,
        a.action,
        `"${a.entityName}"`,
        a.userName,
        `"${a.details.replace(/"/g, '""')}"`
      ])
    ];

    const csvContent = rows.map(r => r.join(',')).join('\n');
    downloadFile(csvContent, `Aperture_Asset_TCO_Report_${dateStr}.csv`, 'text/csv');

    setExportSuccess('Executive CSV Report downloaded successfully!');
    setTimeout(() => setExportSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Control Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-600" />
            <span>Executive Reports & Total Cost of Ownership (TCO)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Custom report exporter, depreciation schedules, loss audit trends, and maintenance expenditure</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleExportCsvReport}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-xs"
            title="Export full asset registry and financial log to CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleSaveHtmlReport}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-xs"
            title="Download formatted HTML document for saving or printing to PDF"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Save HTML/PDF File</span>
          </button>

          <button
            onClick={() => setPrintModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF Report</span>
          </button>
        </div>
      </div>

      {exportSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Capital Expenditure</span>
          <span className="text-2xl font-black font-mono text-slate-900 block">${(totalFleetCost ?? 0).toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 font-mono block">Original asset acquisition</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Cumulative Maintenance</span>
          <span className="text-2xl font-black font-mono text-amber-600 block">${(totalRepairCost ?? 0).toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 font-mono block">{(maintenanceLogs || []).length} total workorders</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Annual Depreciation (15%)</span>
          <span className="text-2xl font-black font-mono text-emerald-600 block">${(estimatedDepreciation ?? 0).toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 font-mono block">Straight-line estimate</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Total Fleet TCO</span>
          <span className="text-2xl font-black font-mono text-blue-700 block">${(totalTco ?? 0).toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 font-mono block">Capital + Maintenance</span>
        </div>
      </div>

      {/* Breakdown Table by Category */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-amber-600" />
            <span>Asset Fleet Value Breakdown by Category</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">{Object.keys(categoryStats).length} categories</span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-center">Asset Count</th>
                <th className="py-2.5 px-3 text-right">Total Capital Cost</th>
                <th className="py-2.5 px-3 text-right">% of Total Fleet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {Object.entries(categoryStats).map(([cat, stat]) => (
                <tr key={cat} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900 font-sans">
                    {cat}
                  </td>
                  <td className="py-2.5 px-3 text-center font-semibold text-slate-600">
                    {stat.count}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    ${(stat.totalCost ?? 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                    {((stat.totalCost / (totalFleetCost || 1)) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Audit Trail */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>System Immutable Activity Audit Trail ({(auditLogs || []).length})</span>
        </h3>
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target Entity</th>
                <th className="py-2.5 px-3">Performed By</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {(auditLogs || []).map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                    {a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-amber-700">
                    {a.action}
                  </td>
                  <td className="py-2.5 px-3 text-slate-900 font-semibold font-sans">
                    {a.entityName}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 font-sans">
                    {a.userName}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                    {a.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print / Report Modal Preview */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden my-8">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-600/30 text-amber-400 rounded-lg">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white font-mono">Executive TCO & Fleet Report Preview</h3>
                  <p className="text-xs text-slate-400">Ready to print or save as PDF document</p>
                </div>
              </div>
              <button 
                onClick={() => setPrintModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto font-sans bg-slate-50/50">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
                  <div>
                    <h1 className="text-xl font-black text-slate-900">Aperture Asset Fleet Executive Report</h1>
                    <p className="text-xs text-slate-500">Total Cost of Ownership & Audit Summary</p>
                  </div>
                  <div className="text-right font-mono text-[11px] text-slate-400">
                    <div>Date: {new Date().toLocaleDateString()}</div>
                    <div>Status: Verified</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center font-mono py-2">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">CapEx</span>
                    <span className="text-lg font-bold text-slate-900">${(totalFleetCost ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Maintenance</span>
                    <span className="text-lg font-bold text-amber-600">${(totalRepairCost ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Annual Depr.</span>
                    <span className="text-lg font-bold text-emerald-600">${(estimatedDepreciation ?? 0).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-xs uppercase text-slate-700 mb-2 font-mono">Category Allocation Summary</h4>
                  <table className="w-full text-xs text-left border border-slate-200 rounded">
                    <thead className="bg-slate-100 font-mono text-[10px] uppercase">
                      <tr>
                        <th className="p-2">Category</th>
                        <th className="p-2">Count</th>
                        <th className="p-2 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {Object.entries(categoryStats).map(([cat, stat]) => (
                        <tr key={cat}>
                          <td className="p-2 font-bold font-sans">{cat}</td>
                          <td className="p-2">{stat.count}</td>
                          <td className="p-2 text-right">${(stat.totalCost ?? 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-mono">Select action to export or print</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveHtmlReport}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download HTML/PDF</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Trigger System Print</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
