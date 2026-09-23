import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Download, 
  Upload, 
  Radio, 
  Tag, 
  Boxes, 
  LayoutGrid, 
  List, 
  MapPin, 
  User, 
  ArrowLeftRight, 
  Eye, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert,
  SlidersHorizontal,
  QrCode,
  Compass,
  Gauge,
  Fuel,
  TrendingUp,
  Clock,
  Wrench,
  FileCheck
} from 'lucide-react';
import { Asset, Site } from '../types';
import { downloadFile } from '../lib/download';

interface AssetRegistryViewProps {
  assets: Asset[];
  sites: Site[];
  initialCategoryFilter?: string;
  onOpenRegisterModal: () => void;
  onOpenDetailModal: (asset: Asset) => void;
  onOpenQrModal?: (asset: Asset) => void;
  onFindRadar: (asset: Asset) => void;
  onCheckoutAsset: (asset: Asset) => void;
  onEditAsset: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
  onImportCsv: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const AssetRegistryView: React.FC<AssetRegistryViewProps> = ({
  assets,
  sites,
  initialCategoryFilter = 'ALL',
  onOpenRegisterModal,
  onOpenDetailModal,
  onOpenQrModal,
  onFindRadar,
  onCheckoutAsset,
  onEditAsset,
  onDeleteAsset,
  onImportCsv,
  onNavigateTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryFilter);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedTracking, setSelectedTracking] = useState<string>('ALL');
  const [selectedOwnership, setSelectedOwnership] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const categories: string[] = [
    'ALL',
    'Heavy Equipment',
    'Excavator',
    'Crane',
    'Bulldozer',
    'Truck',
    'Generator',
    'Compressor',
    'Tools',
    'Power Tools',
    'Hand Tools',
    'Vehicles',
    'Materials',
    'Scaffolding',
    'Survey Equipment'
  ];

  const statuses: string[] = ['ALL', 'Active', 'Idle', 'In Transit', 'Under Maintenance', 'Missing'];

  const filteredAssets = assets.filter(a => {
    // Category match
    let matchesCategory = selectedCategory === 'ALL';
    if (!matchesCategory) {
      if (selectedCategory === 'Heavy Equipment') {
        matchesCategory = ['Excavator', 'Crane', 'Bulldozer', 'Heavy Equipment'].includes(a.category);
      } else if (selectedCategory === 'Tools') {
        matchesCategory = ['Tools', 'Power Tools', 'Hand Tools'].includes(a.category);
      } else if (selectedCategory === 'Vehicles') {
        matchesCategory = ['Vehicles', 'Truck'].includes(a.category);
      } else {
        matchesCategory = a.category === selectedCategory;
      }
    }

    // Status match
    const matchesStatus = selectedStatus === 'ALL' || a.status === selectedStatus;
    
    // Tracking method match
    const matchesTracking = selectedTracking === 'ALL' || a.trackingMethod === selectedTracking;

    // Ownership match
    const matchesOwnership = selectedOwnership === 'ALL' || (
      selectedOwnership === 'Rented' ? a.isRental :
      selectedOwnership === 'Owned' ? !a.isRental : true
    );

    // Search query match
    const q = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      a.name.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      (a.serialNumber && a.serialNumber.toLowerCase().includes(q)) ||
      (a.manufacturer && a.manufacturer.toLowerCase().includes(q)) ||
      (a.model && a.model.toLowerCase().includes(q)) ||
      (a.projectName && a.projectName.toLowerCase().includes(q)) ||
      (a.siteName && a.siteName.toLowerCase().includes(q));

    return matchesCategory && matchesStatus && matchesTracking && matchesOwnership && matchesSearch;
  });

  const handleExportCsv = () => {
    const headers = ['ID,Name,Category,Manufacturer,Model,SerialNumber,Status,Project,Site,Zone,TrackingMethod,Ownership,OperatingHours,FuelLevel,Cost\n'];
    const rows = filteredAssets.map(a => 
      `"${a.id}","${a.name}","${a.category}","${a.manufacturer || ''}","${a.model || ''}","${a.serialNumber || ''}","${a.status}","${a.projectName || ''}","${a.siteName || ''}","${a.zoneName || ''}","${a.trackingMethod || 'GPS'}","${a.isRental ? 'Rented' : 'Owned'}",${a.operatingHours || 0},${a.fuelLevel || 0},${a.cost || 0}`
    );
    const csvContent = [...headers, ...rows].join('\n');
    downloadFile(csvContent, `BuildTrack_Asset_Registry_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const getTrackingBadge = (method?: string) => {
    const m = method || 'GPS';
    let color = 'bg-blue-50 text-blue-700 border-blue-200';
    let icon = <Compass className="w-3 h-3 text-blue-600" />;
    
    if (m === 'RFID') {
      color = 'bg-purple-50 text-purple-700 border-purple-200';
      icon = <Radio className="w-3 h-3 text-purple-600" />;
    } else if (m === 'QR Code' || m === 'QR') {
      color = 'bg-amber-50 text-amber-700 border-amber-200';
      icon = <QrCode className="w-3 h-3 text-amber-600" />;
    } else if (m === 'BLE') {
      color = 'bg-cyan-50 text-cyan-700 border-cyan-200';
      icon = <Radio className="w-3 h-3 text-cyan-600" />;
    }

    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 font-mono ${color}`}>
        {icon}
        <span>{m}</span>
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    let color = 'bg-slate-100 text-slate-700';
    if (status === 'Active' || status === 'In Zone') color = 'bg-emerald-100 text-emerald-800';
    if (status === 'Idle') color = 'bg-amber-100 text-amber-800';
    if (status === 'In Transit') color = 'bg-blue-100 text-blue-800';
    if (status === 'Under Maintenance') color = 'bg-purple-100 text-purple-800';
    if (status === 'Missing') color = 'bg-rose-100 text-rose-800 font-bold';

    return (
      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${color}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-900 text-white rounded-xl">
              <Boxes className="w-5 h-5 text-amber-400" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Construction Asset Registry</h1>
            <span className="text-xs bg-slate-100 text-slate-800 border border-slate-200 font-mono font-bold px-2.5 py-0.5 rounded-full">
              {filteredAssets.length} / {assets.length} Units
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centrally register, categorize, track, and manage all heavy machinery, vehicles, power tools, and materials across sites.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onImportCsv}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenRegisterModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Register Asset</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by asset ID, model, serial #, project, or site..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-between md:justify-end">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              {statuses.map(st => (
                <option key={st} value={st}>Status: {st}</option>
              ))}
            </select>

            <select
              value={selectedTracking}
              onChange={e => setSelectedTracking(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Tracking (GPS, RFID, QR, BLE)</option>
              <option value="GPS">GPS Telematics</option>
              <option value="RFID">RFID Hard Tags</option>
              <option value="QR Code">QR Code Matrix</option>
              <option value="BLE">BLE Beacons</option>
              <option value="Manual">Manual Entry</option>
            </select>

            <select
              value={selectedOwnership}
              onChange={e => setSelectedOwnership(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Ownership (Owned & Rented)</option>
              <option value="Owned">Company Owned Fleet</option>
              <option value="Rented">Rental Equipment</option>
            </select>

            <div className="bg-slate-100 p-1 border border-slate-200 rounded-xl flex items-center gap-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'table' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'grid' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full font-semibold transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Asset View: Table or Grid */}
      {assets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <Boxes className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">No assets have been added.</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Click "Register Asset" or "Import CSV" to add physical equipment, vehicles, and tools to the fleet.</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <Boxes className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">No matching construction assets found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Try adjusting the search query or clearing category and status filters.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Asset Details & Specs</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Project & Site</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tracking Tech</th>
                <th className="py-3 px-4">Engine / Utilization</th>
                <th className="py-3 px-4">Ownership</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.map(asset => (
                <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                  {/* Photo & Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={asset.photoUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150'} 
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs" 
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <span 
                          onClick={() => onOpenDetailModal(asset)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer text-xs block leading-snug"
                        >
                          {asset.name}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: <strong className="text-slate-600">{asset.id}</strong> • {asset.manufacturer} {asset.model}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {asset.category}
                  </td>

                  {/* Project & Site */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{asset.siteName || 'Unassigned Site'}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{asset.projectName || 'Global Fleet'} • {asset.zoneName || 'Yard'}</div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {getStatusBadge(asset.status)}
                  </td>

                  {/* Tracking Tech */}
                  <td className="py-3 px-4">
                    {getTrackingBadge(asset.trackingMethod)}
                  </td>

                  {/* Telematics & Utilization */}
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-800 font-bold">
                        {asset.operatingHours ? `${asset.operatingHours.toLocaleString()} hrs` : 'N/A'}
                      </span>
                      {asset.utilizationPercent !== undefined && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          asset.utilizationPercent < 40 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {asset.utilizationPercent}%
                        </span>
                      )}
                    </div>
                    {asset.fuelLevel !== undefined && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Fuel className="w-3 h-3 text-slate-400" />
                        <span>{asset.fuelLevel}% Fuel</span>
                      </div>
                    )}
                  </td>

                  {/* Ownership & Cost */}
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      asset.isRental ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {asset.isRental ? 'Rented' : 'Owned'}
                    </span>
                    {asset.dailyRate ? (
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        ${asset.dailyRate}/day
                      </div>
                    ) : null}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onOpenDetailModal(asset)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View Asset Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {onOpenQrModal && (
                        <button
                          onClick={() => onOpenQrModal(asset)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Generate QR / Barcode"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onEditAsset(asset)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Asset Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeleteAsset(asset.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map(asset => (
            <div 
              key={asset.id} 
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 bg-slate-100">
                  <img 
                    src={asset.photoUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300'} 
                    alt={asset.name} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    {getStatusBadge(asset.status)}
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    {getTrackingBadge(asset.trackingMethod)}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                      {asset.id} • {asset.category}
                    </span>
                    <h3 
                      onClick={() => onOpenDetailModal(asset)}
                      className="text-sm font-black text-slate-900 hover:text-blue-600 cursor-pointer truncate"
                    >
                      {asset.name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">
                      {asset.manufacturer} {asset.model}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Site:</span>
                      <span className="font-semibold text-slate-800 truncate">{asset.siteName || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Hours / Util:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {asset.operatingHours ? `${asset.operatingHours}h` : 'N/A'} ({asset.utilizationPercent || 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => onOpenDetailModal(asset)}
                  className="font-bold text-slate-900 hover:text-blue-600"
                >
                  View Details →
                </button>
                <div className="flex items-center gap-1">
                  {onOpenQrModal && (
                    <button onClick={() => onOpenQrModal(asset)} className="p-1.5 text-slate-400 hover:text-slate-700">
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => onEditAsset(asset)} className="p-1.5 text-slate-400 hover:text-slate-700">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
