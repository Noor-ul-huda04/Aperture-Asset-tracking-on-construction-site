import React, { useState } from 'react';
import { Wrench, Plus, Clock, CheckCircle2, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { MaintenanceLog, Asset } from '../types';

interface MaintenanceViewProps {
  maintenanceLogs: MaintenanceLog[];
  assets: Asset[];
  onCreateMaintenance: (data: Partial<MaintenanceLog>) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  maintenanceLogs,
  assets,
  onCreateMaintenance
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState((assets || [])[0]?.id || '');
  const [maintType, setMaintType] = useState<'Preventive' | 'Repair' | 'Calibration' | 'Inspection'>('Preventive');
  const [technician, setTechnician] = useState('Elena Rostova');
  const [cost, setCost] = useState(450);
  const [notes, setNotes] = useState('Scheduled oil & hydraulic seal replacement');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find(a => a.id === selectedAssetId);
    onCreateMaintenance({
      assetId: selectedAssetId,
      assetName: asset?.name || 'Asset',
      type: maintType,
      technician,
      cost: Number(cost),
      notes,
      status: 'In Progress',
      date: new Date().toISOString().split('T')[0],
      scheduledDate: new Date().toISOString().split('T')[0]
    });
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-600" />
            <span>Equipment Maintenance & Service Work Orders</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Preventive maintenance intervals, breakdown repairs, calibration logs, and total repair costs</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create Work Order</span>
        </button>
      </div>

      {/* Maintenance Logs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Work Order #</th>
              <th className="py-3 px-4">Asset Equipment</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Technician</th>
              <th className="py-3 px-4">Scheduled Date</th>
              <th className="py-3 px-4 text-right">Service Cost</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(maintenanceLogs || []).map(m => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono font-bold text-amber-800">
                  {m.workOrderId}
                </td>

                <td className="py-3 px-4 font-bold text-slate-900">
                  {m.assetName}
                </td>

                <td className="py-3 px-4 text-slate-700 font-medium">
                  {m.type}
                </td>

                <td className="py-3 px-4 text-slate-700">
                  {m.technician}
                </td>

                <td className="py-3 px-4 font-mono text-slate-500">
                  {m.scheduledDate}
                </td>

                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                  ${(m.cost ?? 0).toLocaleString()}
                </td>

                <td className="py-3 px-4 text-center">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    m.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    m.status === 'In Progress' ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-slate-900">Generate Maintenance Work Order</h3>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Equipment</label>
                <select
                  value={selectedAssetId}
                  onChange={e => setSelectedAssetId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                >
                  {(assets || []).map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Service Type</label>
                <select
                  value={maintType}
                  onChange={e => setMaintType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                >
                  <option value="Preventive">Preventive Maintenance</option>
                  <option value="Repair">Breakdown Repair</option>
                  <option value="Calibration">Calibration & Alignment</option>
                  <option value="Inspection">Safety & OSHA Inspection</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assigned Technician</label>
                <input
                  type="text"
                  value={technician}
                  onChange={e => setTechnician(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Estimated Cost ($)</label>
                <input
                  type="number"
                  value={cost}
                  onChange={e => setCost(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Work Description & Parts Needed</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-xs"
                >
                  Create Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );

};
