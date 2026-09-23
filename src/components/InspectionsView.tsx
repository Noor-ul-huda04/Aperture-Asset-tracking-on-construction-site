import React, { useState } from 'react';
import { Inspection, Asset, Site, Alert, WorkOrder } from '../types';
import { 
  ClipboardCheck, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Filter, 
  Camera, 
  PenTool, 
  FileText,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

interface InspectionsViewProps {
  inspections: Inspection[];
  assets: Asset[];
  sites: Site[];
  onCompleteInspection: (newInsp: Inspection, createdAlert?: Alert, createdWorkOrder?: WorkOrder) => void;
}

export const InspectionsView: React.FC<InspectionsViewProps> = ({
  inspections = [],
  assets = [],
  sites = [],
  onCompleteInspection
}) => {
  const safeInspections = inspections || [];
  const safeAssets = assets || [];
  const safeSites = sites || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState('ALL');
  const [showInspectionModal, setShowInspectionModal] = useState(false);

  // Form State
  const [assetId, setAssetId] = useState(safeAssets[0]?.id || '');
  const [inspector, setInspector] = useState('Dave Miller (Certified Inspector)');
  const [inspectorRole, setInspectorRole] = useState('Heavy Equipment Compliance Officer');
  const [safetyStatus, setSafetyStatus] = useState<Inspection['safetyStatus']>('Safe to Operate');
  const [damageNotes, setDamageNotes] = useState('');
  const [signature, setSignature] = useState('D. Miller');

  // Interactive Checklist
  const [checklist, setChecklist] = useState([
    { id: 'c-1', label: 'Engine condition & oil levels', category: 'Engine', passed: true, notes: '' },
    { id: 'c-2', label: 'Tires / tracks tension & sprockets', category: 'Tires/Tracks', passed: true, notes: '' },
    { id: 'c-3', label: 'Hydraulic system hoses & pressure', category: 'Hydraulics', passed: true, notes: '' },
    { id: 'c-4', label: 'Safety horn, beacon & reverse alarm', category: 'Safety Equipment', passed: true, notes: '' },
    { id: 'c-5', label: 'Coolant and hydraulic fluid levels', category: 'Fluid Levels', passed: true, notes: '' },
    { id: 'c-6', label: 'Visible damage & structural cracks', category: 'Visible Damage', passed: true, notes: '' }
  ]);

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, passed: !item.passed } : item));
  };

  const failedItemsCount = checklist.filter(c => !c.passed).length;
  const computedResult: Inspection['result'] = 
    failedItemsCount === 0 ? 'Passed' : failedItemsCount === 1 ? 'Passed with Issues' : 'Failed';

  const handleSubmit = () => {
    const selectedAsset = assets.find(a => a.id === assetId);
    if (!selectedAsset) return;

    const newInspId = `insp-${Date.now().toString().slice(-4)}`;
    
    let createdAlert: Alert | undefined = undefined;
    let createdWorkOrder: WorkOrder | undefined = undefined;

    if (computedResult === 'Failed') {
      createdAlert = {
        id: `alt-insp-${Date.now().toString().slice(-4)}`,
        type: 'Inspection Failed',
        severity: 'High',
        assetId: selectedAsset.id,
        assetName: selectedAsset.name,
        siteId: selectedAsset.siteId,
        siteName: selectedAsset.siteName,
        triggeredAt: new Date().toISOString(),
        resolved: false,
        message: `${selectedAsset.name} failed mandatory inspection (${failedItemsCount} items flagged)`,
        description: `Safety Status: ${safetyStatus}. Inspector notes: ${damageNotes || 'Critical mechanical defect noted during routine pass.'}`,
        status: 'New'
      };

      createdWorkOrder = {
        id: `WO-${Math.floor(1000 + Math.random() * 9000)}`,
        assetId: selectedAsset.id,
        assetName: selectedAsset.name,
        type: 'Inspection Follow-up',
        priority: 'High',
        assignedTechnician: 'Marco Rossi (Certified Diesel Tech)',
        description: `Resolve failed inspection items: ${checklist.filter(c => !c.passed).map(c => c.label).join(', ')}`,
        parts: ['Inspection Replacement Components'],
        laborHours: 4.0,
        estimatedCost: 750,
        startDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Open',
        siteId: selectedAsset.siteId,
        siteName: selectedAsset.siteName
      };
    }

    const newInsp: Inspection = {
      id: newInspId,
      assetId: selectedAsset.id,
      assetName: selectedAsset.name,
      inspector,
      inspectorRole,
      date: new Date().toISOString().split('T')[0],
      location: `${selectedAsset.siteName} (${selectedAsset.zoneName})`,
      siteId: selectedAsset.siteId,
      siteName: selectedAsset.siteName,
      condition: computedResult === 'Passed' ? 'Good' : computedResult === 'Passed with Issues' ? 'Fair' : 'Damaged',
      safetyStatus: computedResult === 'Failed' ? 'Unsafe - Red Tagged' : safetyStatus,
      damageNotes: damageNotes || (computedResult === 'Passed' ? 'All systems within factory operating limits.' : 'Defects logged on checklist.'),
      checklist,
      result: computedResult,
      signature: `${signature} (${new Date().toLocaleDateString()})`,
      createdAlertId: createdAlert?.id,
      createdWorkOrderId: createdWorkOrder?.id
    };

    onCompleteInspection(newInsp, createdAlert, createdWorkOrder);
    setShowInspectionModal(false);
    setDamageNotes('');
  };

  const filteredInspections = safeInspections.filter(i => {
    if (resultFilter !== 'ALL' && i.result !== resultFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        i.assetName.toLowerCase().includes(q) ||
        i.inspector.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.siteName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-900 text-white rounded-xl">
              <ClipboardCheck className="w-5 h-5 text-purple-400" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Equipment & Tool Inspections</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Digital safety check-sheets, OSHA compliance logs, sign-offs, red-tag isolation, and automatic corrective work orders.
          </p>
        </div>

        <button
          onClick={() => setShowInspectionModal(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Inspection Sheet</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search inspections by asset name, inspector, site, or defect notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
        >
          <option value="ALL">All Compliance Results</option>
          <option value="Passed">Passed (100% Compliant)</option>
          <option value="Passed with Issues">Passed with Issues</option>
          <option value="Failed">Failed (Red-Tagged)</option>
        </select>
      </div>

      {/* Inspections History List */}
      <div className="space-y-3">
        {filteredInspections.map((insp) => (
          <div
            key={insp.id}
            className={`p-5 rounded-2xl border bg-white shadow-xs text-left space-y-3 ${
              insp.result === 'Failed' 
                ? 'border-rose-300 ring-1 ring-rose-300/40' 
                : 'border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {insp.id}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                  insp.result === 'Passed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : insp.result === 'Passed with Issues'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-600 text-white'
                }`}>
                  {insp.result === 'Passed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {insp.result === 'Passed with Issues' && <AlertTriangle className="w-3.5 h-3.5" />}
                  {insp.result === 'Failed' && <XCircle className="w-3.5 h-3.5" />}
                  {insp.result}
                </span>
                <span className="text-xs text-slate-500 font-semibold">{insp.safetyStatus}</span>
              </div>

              <div className="text-xs font-mono text-slate-500">
                {insp.date} • {insp.location}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
              <div className="md:col-span-8 space-y-2">
                <h3 className="text-sm font-black text-slate-900">{insp.assetName}</h3>
                <p className="text-slate-600 leading-relaxed">{insp.damageNotes}</p>

                {/* Checklist Summary Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {insp.checklist?.map((item) => (
                    <span 
                      key={item.id} 
                      className={`text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium ${
                        item.passed 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {item.passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="md:col-span-4 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 font-mono text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Inspector</span>
                  <span className="font-bold text-slate-800 block truncate">{insp.inspector}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Role & Cert</span>
                  <span className="text-slate-600 block truncate">{insp.inspectorRole}</span>
                </div>
                <div className="pt-1 border-t border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Digital Verification Sign-off</span>
                  <span className="text-purple-700 font-bold block truncate">{insp.signature}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Inspection Form Modal */}
      {showInspectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Conduct Digital Safety Inspection</h2>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                computedResult === 'Passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                Outcome: {computedResult}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Asset for Inspection</label>
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                >
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.category} • {a.siteName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Digital Checklist */}
              <div>
                <label className="font-bold text-slate-700 block mb-2">Mandatory Safety Check-Sheet</label>
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                  {checklist.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => toggleChecklistItem(c.id)}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={c.passed}
                          onChange={() => {}}
                          className="rounded text-emerald-600"
                        />
                        <span className="font-semibold text-slate-800">{c.label}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        c.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {c.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Safety Status</label>
                  <select
                    value={safetyStatus}
                    onChange={(e) => setSafetyStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="Safe to Operate">Safe to Operate</option>
                    <option value="Operate with Caution">Operate with Caution</option>
                    <option value="Unsafe - Red Tagged">Unsafe - Red Tagged</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Inspector Sign-off</label>
                  <input
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Signature name..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Inspector Notes & Defect Description</label>
                <textarea
                  rows={2}
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  placeholder="Record cracks, leaks, hydraulic hose fraying, or maintenance requirements..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                />
              </div>

              {computedResult === 'Failed' && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Automated Corrective Workflow Triggered
                  </div>
                  <p className="text-[11px] text-rose-700">
                    Submitting this failed inspection will automatically log a <strong>Critical Alert</strong> in the Operations Center and dispatch a <strong>High-Priority Work Order</strong> to the site maintenance technician.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowInspectionModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Submit Inspection Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
