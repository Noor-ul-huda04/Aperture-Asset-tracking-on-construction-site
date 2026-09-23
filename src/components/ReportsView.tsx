import React, { useState } from 'react';
import { Asset, Site, Project, WorkOrder, Inspection, Alert, AssetMovement } from '../types';
import { 
  FileText, 
  Download, 
  Printer, 
  Table, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  ShieldAlert, 
  Wrench,
  Boxes
} from 'lucide-react';

interface ReportsViewProps {
  assets: Asset[];
  sites: Site[];
  projects: Project[];
  workOrders: WorkOrder[];
  inspections: Inspection[];
  alerts: Alert[];
  movements: AssetMovement[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  assets = [],
  sites = [],
  projects = [],
  workOrders = [],
  inspections = [],
  alerts = [],
  movements = []
}) => {
  const safeAssets = assets || [];
  const safeSites = sites || [];
  const safeProjects = projects || [];
  const safeWorkOrders = workOrders || [];
  const safeInspections = inspections || [];
  const safeAlerts = alerts || [];
  const safeMovements = movements || [];
  const [activeReport, setActiveReport] = useState<'fleet' | 'utilization' | 'maintenance' | 'security' | 'inspections'>('fleet');
  const [dateRange, setDateRange] = useState('Last 30 Days');

  const downloadCsv = (reportType: string) => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `BuildTrack_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

    if (reportType === 'fleet') {
      headers = ['Asset ID', 'Name', 'Category', 'Manufacturer', 'Model', 'Serial Number', 'Site', 'Status', 'Operating Hours', 'Cost (USD)'];
      rows = safeAssets.map(a => [
        a.id,
        `"${a.name}"`,
        a.category,
        a.manufacturer,
        `"${a.model}"`,
        a.serialNumber || '',
        `"${a.siteName}"`,
        a.status,
        String(a.operatingHours || 0),
        String(a.cost || 0)
      ]);
    } else if (reportType === 'utilization') {
      headers = ['Asset ID', 'Name', 'Category', 'Site', 'Project', 'Utilization %', 'Engine Hours', 'Fuel %', 'Status'];
      rows = safeAssets.map(a => [
        a.id,
        `"${a.name}"`,
        a.category,
        `"${a.siteName}"`,
        `"${a.projectName}"`,
        String(a.utilizationPercent || 0),
        String(a.operatingHours || 0),
        String(a.fuelLevel || 0),
        a.status
      ]);
    } else if (reportType === 'maintenance') {
      headers = ['Work Order ID', 'Asset ID', 'Asset Name', 'Type', 'Priority', 'Technician', 'Est Cost', 'Actual Cost', 'Status', 'Due Date'];
      rows = safeWorkOrders.map(w => [
        w.id,
        w.assetId,
        `"${w.assetName}"`,
        w.type,
        w.priority,
        `"${w.assignedTechnician}"`,
        String(w.estimatedCost || 0),
        String(w.actualCost || 0),
        w.status,
        w.dueDate
      ]);
    } else if (reportType === 'security') {
      headers = ['Alert ID', 'Severity', 'Type', 'Asset ID', 'Asset Name', 'Site', 'Message', 'Status', 'Timestamp'];
      rows = safeAlerts.map(al => [
        al.id,
        al.severity,
        al.type,
        al.assetId || '',
        `"${al.assetName || ''}"`,
        `"${al.siteName || ''}"`,
        `"${al.message}"`,
        al.status || 'New',
        al.triggeredAt
      ]);
    } else {
      headers = ['Inspection ID', 'Asset ID', 'Asset Name', 'Inspector', 'Date', 'Result', 'Safety Status', 'Notes'];
      rows = safeInspections.map(i => [
        i.id,
        i.assetId,
        `"${i.assetName}"`,
        `"${i.inspector}"`,
        i.date,
        i.result,
        i.safetyStatus,
        `"${i.damageNotes || ''}"`
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!assets || assets.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
        <FileText className="w-10 h-10 text-slate-300 mx-auto" />
        <h3 className="font-bold text-base text-slate-800">No data available for analysis.</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">Compliance, fleet audits, and utilization reports will be available once operational data is registered.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-900 text-white rounded-xl">
              <FileText className="w-5 h-5 text-amber-400" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Compliance & Operations Reports</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate, audit, print, and export CSV/PDF reports for project owners, risk insurers, and executive directors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCsv(activeReport)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Report Types Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { id: 'fleet', title: 'Fleet Inventory Audit', icon: <Boxes className="w-4 h-4" /> },
          { id: 'utilization', title: 'Utilization & Idle Hours', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'maintenance', title: 'Maintenance & Service Costs', icon: <Wrench className="w-4 h-4" /> },
          { id: 'security', title: 'Security & Geofence Exceptions', icon: <ShieldAlert className="w-4 h-4" /> },
          { id: 'inspections', title: 'OSHA Inspection Records', icon: <CheckCircle2 className="w-4 h-4" /> }
        ].map((rep) => (
          <button
            key={rep.id}
            onClick={() => setActiveReport(rep.id as any)}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              activeReport === rep.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className={`p-1.5 rounded-lg w-max mb-2 ${activeReport === rep.id ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-slate-600'}`}>
              {rep.icon}
            </div>
            <div className="text-xs font-bold leading-tight">{rep.title}</div>
          </button>
        ))}
      </div>

      {/* Active Report Table Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Report Data Preview • {dateRange}
          </span>
          <span className="text-xs font-mono text-slate-400">
            Generated: {new Date().toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          {activeReport === 'fleet' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Asset ID / Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Model / Serial</th>
                  <th className="px-4 py-3">Current Site</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Asset Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {safeAssets.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{a.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{a.id}</div>
                    </td>
                    <td className="px-4 py-3">{a.category}</td>
                    <td className="px-4 py-3 font-mono text-[11px]">{a.model}</td>
                    <td className="px-4 py-3">{a.siteName}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                      ${(a.cost || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'utilization' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Machinery</th>
                  <th className="px-4 py-3">Assigned Project</th>
                  <th className="px-4 py-3">Operating Hours</th>
                  <th className="px-4 py-3">Utilization Rate</th>
                  <th className="px-4 py-3">Fuel / Energy</th>
                  <th className="px-4 py-3">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {safeAssets.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-bold text-slate-900">{a.name}</td>
                    <td className="px-4 py-3">{a.projectName}</td>
                    <td className="px-4 py-3 font-mono">{a.operatingHours ? `${a.operatingHours.toLocaleString()} hrs` : 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono font-bold ${
                        (a.utilizationPercent || 0) < 40 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {a.utilizationPercent || 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{a.fuelLevel !== undefined ? `${a.fuelLevel}%` : 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'maintenance' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Work Order ID</th>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Service Type</th>
                  <th className="px-4 py-3">Technician</th>
                  <th className="px-4 py-3">Estimated Cost</th>
                  <th className="px-4 py-3">Actual Cost</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {safeWorkOrders.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono font-bold">{w.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{w.assetName}</td>
                    <td className="px-4 py-3">{w.type}</td>
                    <td className="px-4 py-3">{w.assignedTechnician}</td>
                    <td className="px-4 py-3 font-mono">${w.estimatedCost}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-700">${w.actualCost || w.estimatedCost}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'security' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Exception Type</th>
                  <th className="px-4 py-3">Asset / Site</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Resolution Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {safeAlerts.map((al) => (
                  <tr key={al.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(al.triggeredAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        al.severity === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {al.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">{al.type}</td>
                    <td className="px-4 py-3">{al.assetName || al.siteName}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{al.message}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {al.status || 'New'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'inspections' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Inspection ID</th>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Compliance Result</th>
                  <th className="px-4 py-3">Safety Status</th>
                  <th className="px-4 py-3">Inspector Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {safeInspections.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono font-bold">{i.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{i.assetName}</td>
                    <td className="px-4 py-3 font-mono">{i.date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        i.result === 'Passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {i.result}
                      </span>
                    </td>
                    <td className="px-4 py-3">{i.safetyStatus}</td>
                    <td className="px-4 py-3 font-mono text-purple-700">{i.signature}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
