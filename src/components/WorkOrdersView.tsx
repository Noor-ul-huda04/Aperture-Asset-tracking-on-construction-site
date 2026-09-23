import React, { useState } from 'react';
import { WorkOrder, Asset, Site } from '../types';
import { 
  Wrench, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  UserCheck, 
  Filter, 
  Search, 
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

interface WorkOrdersViewProps {
  workOrders: WorkOrder[];
  assets: Asset[];
  sites: Site[];
  onCreateWorkOrder: (newWo: WorkOrder) => void;
  onUpdateWorkOrderStatus?: (woId: string, status: WorkOrder['status']) => void;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  workOrders = [],
  assets = [],
  sites = [],
  onCreateWorkOrder,
  onUpdateWorkOrderStatus
}) => {
  const safeWorkOrders = workOrders || [];
  const safeAssets = assets || [];
  const safeSites = sites || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [assetId, setAssetId] = useState(safeAssets[0]?.id || '');
  const [type, setType] = useState<WorkOrder['type']>('Preventive Maintenance');
  const [priority, setPriority] = useState<WorkOrder['priority']>('High');
  const [assignedTechnician, setAssignedTechnician] = useState('Marco Rossi (Certified Diesel Tech)');
  const [description, setDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(850);
  const [laborHours, setLaborHours] = useState(4);
  const [dueDate, setDueDate] = useState('2024-03-25');
  const [partsInput, setPartsInput] = useState('Service Kit #2, Synthetic Hydraulic Fluid (10L)');

  const filteredOrders = safeWorkOrders.filter(wo => {
    if (statusFilter !== 'ALL' && wo.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && wo.priority !== priorityFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        wo.id.toLowerCase().includes(q) ||
        wo.assetName.toLowerCase().includes(q) ||
        wo.description.toLowerCase().includes(q) ||
        wo.assignedTechnician.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreate = () => {
    const selectedAsset = assets.find(a => a.id === assetId);
    if (!selectedAsset) return;

    const newWo: WorkOrder = {
      id: `WO-${Math.floor(1000 + Math.random() * 9000)}`,
      assetId: selectedAsset.id,
      assetName: selectedAsset.name,
      type,
      priority,
      assignedTechnician,
      description: description || `${type} for ${selectedAsset.name}`,
      parts: partsInput.split(',').map(s => s.trim()).filter(Boolean),
      laborHours,
      estimatedCost,
      startDate: new Date().toISOString().split('T')[0],
      dueDate,
      status: 'Open',
      siteId: selectedAsset.siteId,
      siteName: selectedAsset.siteName
    };

    onCreateWorkOrder(newWo);
    setShowCreateModal(false);
    setDescription('');
  };

  const totalEstimatedCost = workOrders.reduce((sum, wo) => sum + (wo.estimatedCost || 0), 0);
  const totalActualCost = workOrders.reduce((sum, wo) => sum + (wo.actualCost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-900 text-white rounded-xl">
              <Wrench className="w-5 h-5 text-amber-400" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Maintenance Work Orders</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch repair orders, track technician labor, manage spare parts inventory, and control machinery service expenses.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Work Order</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Work Orders</span>
          <span className="text-2xl font-black text-slate-900">{workOrders.length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">In Progress / Open</span>
          <span className="text-2xl font-black text-blue-600">
            {workOrders.filter(w => w.status === 'In Progress' || w.status === 'Open').length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Critical / High Priority</span>
          <span className="text-2xl font-black text-rose-600">
            {workOrders.filter(w => w.priority === 'Critical' || w.priority === 'High').length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Est vs Actual Cost</span>
          <span className="text-lg font-black text-emerald-700 font-mono">
            ${totalActualCost.toLocaleString()} <span className="text-xs text-slate-400">/ ${totalEstimatedCost.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by work order ID, asset name, technician, or repair description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Waiting on Parts">Waiting on Parts</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Work Orders List */}
      <div className="space-y-3">
        {filteredOrders.map((wo) => {
          const isCritical = wo.priority === 'Critical';

          return (
            <div
              key={wo.id}
              className={`p-5 rounded-2xl border transition-all text-left bg-white shadow-xs ${
                isCritical ? 'border-rose-300 ring-1 ring-rose-300/40' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-slate-900 text-white">
                    {wo.id}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    wo.priority === 'Critical'
                      ? 'bg-rose-600 text-white'
                      : wo.priority === 'High'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {wo.priority} Priority
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    {wo.type}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={wo.status}
                    onChange={(e) => onUpdateWorkOrderStatus && onUpdateWorkOrderStatus(wo.id, e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="Open">Open</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Waiting on Parts">Waiting on Parts</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 text-xs">
                <div className="lg:col-span-6 space-y-1.5">
                  <h3 className="text-sm font-black text-slate-900">{wo.assetName}</h3>
                  <p className="text-slate-600 leading-relaxed">{wo.description}</p>
                  
                  {wo.parts && wo.parts.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Parts Required:</span>
                      {wo.parts.map((p, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Technician</span>
                    <span className="font-semibold text-slate-800 truncate block">{wo.assignedTechnician}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Labor Hours</span>
                    <span className="font-bold text-slate-800">{wo.laborHours} hrs</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Est / Actual Cost</span>
                    <span className="font-bold text-emerald-700">
                      ${wo.actualCost || wo.estimatedCost}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Due Date</span>
                    <span className="font-semibold text-slate-700">{wo.dueDate}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Site Location</span>
                    <span className="font-semibold text-slate-700 truncate block">{wo.siteName}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Work Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-lg font-black text-slate-900">Create Machinery Work Order</h2>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Asset</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Work Order Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="Preventive Maintenance">Preventive Maintenance</option>
                    <option value="Corrective Repair">Corrective Repair</option>
                    <option value="Inspection Follow-up">Inspection Follow-up</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Technician</label>
                  <input
                    type="text"
                    value={assignedTechnician}
                    onChange={(e) => setAssignedTechnician(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimated Cost ($ USD)</label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Est. Labor Hours</label>
                  <input
                    type="number"
                    value={laborHours}
                    onChange={(e) => setLaborHours(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Spare Parts (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Fuel filter, Hydraulic seal kit, O-rings"
                  value={partsInput}
                  onChange={(e) => setPartsInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Detailed Work Description</label>
                <textarea
                  rows={2}
                  placeholder="Steps to repair, torque specs, safety lockout procedures..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Dispatch Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
