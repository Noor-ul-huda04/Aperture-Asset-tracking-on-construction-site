import React, { useState } from 'react';
import { AssetMovement, Asset, Site } from '../types';
import { 
  ArrowRightLeft, 
  MapPin, 
  Clock, 
  UserCheck, 
  Plus, 
  Filter, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  Truck, 
  QrCode, 
  Radio, 
  Compass,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

interface AssetMovementsViewProps {
  movements?: AssetMovement[];
  assets?: Asset[];
  sites?: Site[];
  onInitiateTransfer?: (newMovement: AssetMovement) => void;
  onNavigateTab?: (tab: string) => void;
}

export const AssetMovementsView: React.FC<AssetMovementsViewProps> = ({
  movements = [],
  assets = [],
  sites = [],
  onInitiateTransfer,
  onNavigateTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Transfer Form State
  const [transferAssetId, setTransferAssetId] = useState(assets?.[0]?.id || 'EX-104');
  const [toSiteId, setToSiteId] = useState(sites?.[1]?.id || sites?.[0]?.id || 'SITE-B');
  const [toZoneName, setToZoneName] = useState('Staging Laydown');
  const [authorizedBy, setAuthorizedBy] = useState('Sarah Jenkins (Admin)');
  const [movementType, setMovementType] = useState<AssetMovement['movementType']>('Site Transfer');
  const [transferNotes, setTransferNotes] = useState('');

  const filteredMovements = movements.filter(m => {
    if (typeFilter !== 'ALL' && m.movementType !== typeFilter) return false;
    if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        m.assetName.toLowerCase().includes(q) ||
        m.assetId.toLowerCase().includes(q) ||
        m.fromLocation.toLowerCase().includes(q) ||
        m.toLocation.toLowerCase().includes(q) ||
        m.authorizedBy.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateTransfer = () => {
    const selectedAsset = assets.find(a => a.id === transferAssetId);
    const targetSite = sites.find(s => s.id === toSiteId);
    if (!selectedAsset) return;

    const newMov: AssetMovement = {
      id: `mov-${Date.now().toString().slice(-4)}`,
      assetId: selectedAsset.id,
      assetName: selectedAsset.name,
      assetCategory: selectedAsset.category,
      fromLocation: `${selectedAsset.siteName} (${selectedAsset.zoneName})`,
      toLocation: `${targetSite?.name || toSiteId} (${toZoneName})`,
      fromSiteId: selectedAsset.siteId,
      toSiteId: toSiteId,
      movementTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      movementType: movementType,
      authorizedBy: authorizedBy,
      status: movementType === 'Unauthorized Movement' ? 'Flagged' : 'In Transit',
      trackingSource: 'Manual',
      notes: transferNotes || 'Dispatched via BuildTrack Fleet Manager'
    };

    onInitiateTransfer(newMov);
    setShowTransferModal(false);
    setTransferNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-900 text-white rounded-xl">
              <ArrowRightLeft className="w-5 h-5 text-amber-400" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Asset Movements & Transfers</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time movement logs, automated gate portals, custody handoffs, site transfers, and unauthorized exit detection.
          </p>
        </div>

        <button
          onClick={() => setShowTransferModal(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Initiate Site Transfer</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by asset ID, machinery name, gate origin, or destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Movement Types</option>
            <option value="Site Transfer">Site Transfer</option>
            <option value="Check-Out">Check-Out</option>
            <option value="Check-In">Check-In</option>
            <option value="Delivery">Delivery</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Unauthorized Movement">Unauthorized Movement</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="In Transit">In Transit</option>
            <option value="Flagged">Flagged / Breach</option>
          </select>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">From Location</th>
                <th className="px-4 py-3">To Location</th>
                <th className="px-4 py-3">Movement Type</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Authorized By</th>
                <th className="px-4 py-3">Tracking Source</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredMovements.map((mov) => {
                const isUnauthorized = mov.movementType === 'Unauthorized Movement' || mov.status === 'Flagged';

                return (
                  <tr key={mov.id} className={`hover:bg-slate-50/80 transition-colors ${isUnauthorized ? 'bg-rose-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{mov.assetName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{mov.assetId} • {mov.assetCategory}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{mov.fromLocation}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-900 font-semibold">
                      <div className="flex items-center gap-1 text-blue-700">
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[160px]">{mov.toLocation}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isUnauthorized
                          ? 'bg-rose-600 text-white'
                          : mov.movementType === 'Site Transfer'
                          ? 'bg-blue-100 text-blue-800'
                          : mov.movementType === 'Check-Out'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {mov.movementType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {mov.movementTime}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {mov.authorizedBy}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 flex items-center gap-1 w-max">
                        {mov.trackingSource === 'GPS' && <Compass className="w-3 h-3 text-blue-600" />}
                        {mov.trackingSource === 'RFID' && <Radio className="w-3 h-3 text-indigo-600" />}
                        {mov.trackingSource === 'QR Scan' && <QrCode className="w-3 h-3 text-emerald-600" />}
                        {mov.trackingSource}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        mov.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : mov.status === 'In Transit'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {mov.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-lg font-black text-slate-900">Initiate Construction Asset Transfer</h2>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Machinery / Asset</label>
                <select
                  value={transferAssetId}
                  onChange={(e) => setTransferAssetId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.category} • Current: {a.siteName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Destination Site</label>
                  <select
                    value={toSiteId}
                    onChange={(e) => setToSiteId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Zone / Gate</label>
                  <input
                    type="text"
                    value={toZoneName}
                    onChange={(e) => setToZoneName(e.target.value)}
                    placeholder="e.g. Laydown Yard B"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Movement Type</label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="Site Transfer">Site Transfer</option>
                    <option value="Check-Out">Field Check-Out</option>
                    <option value="Delivery">Vendor Delivery</option>
                    <option value="Maintenance">Maintenance Transport</option>
                    <option value="Unauthorized Movement">Simulated Breach</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Authorized By</label>
                  <input
                    type="text"
                    value={authorizedBy}
                    onChange={(e) => setAuthorizedBy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Transfer Manifest Notes</label>
                <textarea
                  rows={2}
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Carrier haul license, flatbed truck reg, bill of lading..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTransfer}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Dispatch Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
