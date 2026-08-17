import React from 'react';
import { X, Tag, Radio, MapPin, Calendar, Clock, User, Wrench, ShieldAlert, ArrowLeftRight, Activity, DollarSign, QrCode } from 'lucide-react';
import { Asset, ReadEvent, Checkout } from '../types';

interface AssetDetailModalProps {
  asset: Asset | null;
  onClose: () => void;
  readEvents: ReadEvent[];
  checkouts: Checkout[];
  onFindRadar: (asset: Asset) => void;
  onCheckout: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onOpenQrModal?: (asset: Asset) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  onClose,
  readEvents,
  checkouts,
  onFindRadar,
  onCheckout,
  onEdit,
  onOpenQrModal
}) => {
  if (!asset) return null;

  const assetEvents = (readEvents || []).filter(e => e.assetId === asset.id || e.epc === asset.tagEpc);
  const assetCheckouts = (checkouts || []).filter(c => c.assetId === asset.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={asset.photoUrl} className="w-12 h-12 rounded-lg object-cover border border-amber-500/30" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-white">{asset.name}</h2>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  asset.status === 'In Zone' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  asset.status === 'Checked Out' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  asset.status === 'Missing' ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' :
                  'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {asset.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">{asset.manufacturer} {asset.model} • SN: {asset.serialNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            {onOpenQrModal && (
              <button
                onClick={() => { onClose(); onOpenQrModal(asset); }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 shadow-md shadow-blue-500/10"
              >
                <QrCode className="w-4 h-4" />
                <span>QR Tag & Public Link</span>
              </button>
            )}

            <button
              onClick={() => { onClose(); onFindRadar(asset); }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 shadow-md shadow-blue-500/10"
            >
              <Radio className="w-4 h-4" />
              <span>Find Asset Proximity Radar</span>
            </button>

            {asset.status === 'In Zone' && (
              <button
                onClick={() => { onClose(); onCheckout(asset); }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Issue Check-Out</span>
              </button>
            )}

            <button
              onClick={() => { onClose(); onEdit(asset); }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg flex items-center gap-2 border border-slate-700"
            >
              <Tag className="w-4 h-4" />
              <span>Edit Details / Re-bind Tag</span>
            </button>
          </div>

          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">UHF RFID EPC Tag</span>
              <span className="font-mono text-amber-300 font-bold text-xs truncate block mt-0.5">{asset.tagEpc}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">Current Location</span>
              <span className="text-white font-bold block mt-0.5">{asset.zoneName} ({asset.siteName})</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">Current Custodian</span>
              <span className="text-slate-200 font-semibold block mt-0.5">{asset.custodianName || 'Unassigned / In Yard'}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">Replacement Value</span>
              <span className="text-emerald-400 font-mono font-bold text-xs block mt-0.5">${(asset.cost ?? 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Asset Customs & Condition */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Asset Attributes & Condition</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-300">
              <div>Category: <strong className="text-white">{asset.category}</strong></div>
              <div>Condition: <strong className="text-amber-400">{asset.condition}</strong></div>
              <div>Purchase Date: <strong className="text-white">{asset.purchaseDate}</strong></div>
              {asset.isRental && (
                <div className="text-blue-400 font-bold">Rental Rate: ${asset.rentalCostPerDay}/day</div>
              )}
              {asset.hoursUsed && (
                <div>Hours Logged: <strong className="text-white font-mono">{asset.hoursUsed} hrs</strong></div>
              )}
            </div>
            {asset.notes && <p className="text-slate-400 pt-2 border-t border-slate-900 italic">{asset.notes}</p>}
          </div>

          {/* RFID Scan Audit Timeline */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center justify-between">
              <span>RFID Movement & Gateway Scan Logs ({assetEvents.length})</span>
            </h3>

            <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-2 max-h-48 overflow-y-auto">
              {assetEvents.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No recent reader scans logged for this EPC tag.</p>
              ) : (
                assetEvents.map(e => (
                  <div key={e.id} className="flex items-center justify-between text-slate-300 border-b border-slate-900 pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{e.readerName} • <strong>{e.zoneName}</strong></span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-amber-400">{e.rssi} dBm</span>
                      <span className="text-slate-500">{e.timestamp ? new Date(e.timestamp).toLocaleString() : 'N/A'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
