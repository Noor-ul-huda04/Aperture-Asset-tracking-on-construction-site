import React, { useState } from 'react';
import { X, Radio, Camera, Tag as TagIcon, Plus } from 'lucide-react';
import { Asset, AssetCategory, AssetCondition, Site } from '../types';

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Asset>) => void;
  sites: Site[];
  initialAsset?: Asset | null;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sites,
  initialAsset
}) => {
  const [name, setName] = useState(initialAsset?.name || '');
  const [category, setCategory] = useState<AssetCategory>(initialAsset?.category || 'Tools');
  const [subCategory, setSubCategory] = useState(initialAsset?.subCategory || '');
  const [manufacturer, setManufacturer] = useState(initialAsset?.manufacturer || '');
  const [model, setModel] = useState(initialAsset?.model || '');
  const [serialNumber, setSerialNumber] = useState(initialAsset?.serialNumber || '');
  const [tagEpc, setTagEpc] = useState(initialAsset?.tagEpc || `E2801191A000001${Math.floor(100000 + Math.random() * 900000)}`);
  const [cost, setCost] = useState(initialAsset?.cost || 1200);
  const [siteId, setSiteId] = useState(initialAsset?.siteId || sites[0]?.id || 'site-1');
  const [zoneId, setZoneId] = useState(initialAsset?.zoneId || sites[0]?.zones?.[0]?.id || 'z-yard');
  const [condition, setCondition] = useState<AssetCondition>(initialAsset?.condition || 'Excellent');
  const [isRental, setIsRental] = useState(initialAsset?.isRental || false);
  const [rentalCostPerDay, setRentalCostPerDay] = useState(initialAsset?.rentalCostPerDay || 75);
  const [photoUrl, setPhotoUrl] = useState(initialAsset?.photoUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600');
  const [notes, setNotes] = useState(initialAsset?.notes || '');

  React.useEffect(() => {
    if (initialAsset) {
      setName(initialAsset.name || '');
      setCategory(initialAsset.category || 'Tools');
      setSubCategory(initialAsset.subCategory || '');
      setManufacturer(initialAsset.manufacturer || '');
      setModel(initialAsset.model || '');
      setSerialNumber(initialAsset.serialNumber || '');
      setTagEpc(initialAsset.tagEpc || '');
      setCost(initialAsset.cost || 1200);
      setSiteId(initialAsset.siteId || sites[0]?.id || 'site-1');
      setZoneId(initialAsset.zoneId || sites[0]?.zones?.[0]?.id || 'z-yard');
      setCondition(initialAsset.condition || 'Excellent');
      setIsRental(initialAsset.isRental || false);
      setRentalCostPerDay(initialAsset.rentalCostPerDay || 75);
      setPhotoUrl(initialAsset.photoUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600');
      setNotes(initialAsset.notes || '');
    } else if (isOpen) {
      setName('');
      setCategory('Tools');
      setSubCategory('');
      setManufacturer('');
      setModel('');
      setSerialNumber(`SN-${Date.now().toString().slice(-6)}`);
      setTagEpc(`E2801191A000001${Math.floor(100000 + Math.random() * 900000)}`);
      setCost(1200);
      setSiteId(sites[0]?.id || 'site-1');
      setZoneId(sites[0]?.zones?.[0]?.id || 'z-yard');
      setCondition('Excellent');
      setIsRental(false);
      setRentalCostPerDay(75);
      setPhotoUrl('https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600');
      setNotes('');
    }
  }, [initialAsset, isOpen, sites]);

  if (!isOpen) return null;

  const selectedSite = sites.find(s => s.id === siteId) || sites[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      category,
      subCategory: subCategory || category,
      manufacturer: manufacturer || 'Generic',
      model: model || 'Standard',
      serialNumber: serialNumber || `SN-${Date.now().toString().slice(-6)}`,
      tagEpc,
      cost: Number(cost),
      siteId,
      siteName: selectedSite?.name || 'Main Site',
      zoneId,
      zoneName: selectedSite?.zones?.find(z => z.id === zoneId)?.name || 'Laydown Yard',
      condition,
      isRental,
      rentalCostPerDay: isRental ? Number(rentalCostPerDay) : 0,
      photoUrl,
      notes
    });
    onClose();
  };

  const generateNewEpc = () => {
    setTagEpc(`E2801191A000001${Math.floor(100000 + Math.random() * 900000)}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">
                {initialAsset ? 'Edit Tracked Asset & RFID Tag' : 'Register New Asset & Bind UHF Tag'}
              </h2>
              <p className="text-xs text-slate-400">Add physical item into Aperture asset catalog</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Asset Name / Title *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Milwaukee M18 Fuel Sawzall Kit"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Asset Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as AssetCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Tools">Tools & Power Equipment</option>
                <option value="Heavy Equipment">Heavy Equipment & Machinery</option>
                <option value="Vehicles">Vehicles & Trailers</option>
                <option value="PPE">PPE & Fall Protection</option>
                <option value="Materials">Materials & Scaffolding</option>
                <option value="Containers">Containers & Storage Boxes</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Manufacturer</label>
              <input
                type="text"
                value={manufacturer}
                onChange={e => setManufacturer(e.target.value)}
                placeholder="e.g. DeWalt, Caterpillar, Hilti"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Model / Part No.</label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="e.g. DCH773Y2"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Serial Number</label>
              <input
                type="text"
                value={serialNumber}
                onChange={e => setSerialNumber(e.target.value)}
                placeholder="e.g. SN-8841029"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Replacement Value ($ USD)</label>
              <input
                type="number"
                value={cost}
                onChange={e => setCost(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

          </div>

          {/* RFID EPC Tag Assignment Box */}
          <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <TagIcon className="w-4 h-4" />
                <span>UHF RFID EPC Tag Binding</span>
              </span>
              <button
                type="button"
                onClick={generateNewEpc}
                className="text-[10px] text-amber-400 hover:underline font-mono"
              >
                Auto-Generate EPC Code
              </button>
            </div>
            <div>
              <input
                type="text"
                required
                value={tagEpc}
                onChange={e => setTagEpc(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 font-mono text-amber-300 font-bold tracking-wider text-xs focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Attach durable 860–960 MHz passive UHF tag (Impinj/Confidex metal-mount recommended for machinery).
              </p>
            </div>
          </div>

          {/* Location & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Initial Job Site</label>
              <select
                value={siteId}
                onChange={e => {
                  setSiteId(e.target.value);
                  const st = sites.find(s => s.id === e.target.value);
                  if (st && st.zones && st.zones.length > 0) setZoneId(st.zones[0].id);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                {(sites || []).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Initial Zone</label>
              <select
                value={zoneId}
                onChange={e => setZoneId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                {(selectedSite?.zones || []).map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Initial Condition</label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value as AssetCondition)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Damaged">Damaged / Requires Service</option>
              </select>
            </div>

          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Photo Image URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
              />
              <img src={photoUrl} className="w-9 h-9 rounded-lg object-cover border border-slate-700" />
            </div>
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-lg shadow-amber-500/20"
            >
              {initialAsset ? 'Save Changes' : 'Complete Asset Registration'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
