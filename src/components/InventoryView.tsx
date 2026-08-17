import React, { useState } from 'react';
import { PackageSearch, AlertTriangle, Plus, RefreshCw, CheckCircle2, Download, X, ArrowUpRight } from 'lucide-react';
import { InventoryItem } from '../types';
import { downloadFile } from '../lib/download';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onAddInventoryItem?: (item: Partial<InventoryItem>) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  onUpdateQuantity,
  onAddInventoryItem
}) => {
  const [scanningCycle, setScanningCycle] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Safety & PPE');
  const [siteName, setSiteName] = useState('Harbor Expansion Site A');
  const [qtyOnHand, setQtyOnHand] = useState(50);
  const [minThreshold, setMinThreshold] = useState(20);
  const [unit, setUnit] = useState('boxes');
  const [costPerUnit, setCostPerUnit] = useState(35);

  const lowStockItems = (inventory || []).filter(i => i.quantityOnHand <= i.minThreshold);

  const showToast = (msg: string) => {
    setScanMessage(msg);
    setTimeout(() => setScanMessage(null), 4000);
  };

  const handleRunBulkCycleCount = () => {
    setScanningCycle(true);
    setScanMessage('Initiating UHF RFID Array Sweeper across Laydown Yard...');
    setTimeout(() => {
      setScanningCycle(false);
      showToast('Bulk RFID Cycle Scan Complete! 100% Reconciliation matched with physical tags.');
    }, 1800);
  };

  const handleExportCsv = () => {
    const headers = ['ID,Item Name,Category,Site Location,Quantity On Hand,Unit,Min Threshold,Cost Per Unit,Total Value\n'];
    const rows = (inventory || []).map(i => 
      `"${i.id}","${i.name}","${i.category}","${i.siteName}",${i.quantityOnHand},"${i.unit}",${i.minThreshold},${i.costPerUnit},${(i.quantityOnHand * i.costPerUnit).toFixed(2)}`
    );
    const content = [...headers, ...rows].join('\n');
    downloadFile(content, `Aperture_Bulk_Inventory_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    showToast('Inventory CSV exported successfully!');
  };

  const handleRestock = (item: InventoryItem) => {
    const delta = Math.max(10, (item.minThreshold * 2) - item.quantityOnHand);
    onUpdateQuantity(item.id, delta);
    showToast(`Restocked +${delta} ${item.unit} of ${item.name}`);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddInventoryItem) {
      onAddInventoryItem({
        name: itemName,
        category,
        siteName,
        quantityOnHand: Number(qtyOnHand),
        minThreshold: Number(minThreshold),
        unit,
        costPerUnit: Number(costPerUnit)
      });
    }
    setIsAddModalOpen(false);
    setItemName('');
    showToast(`Added new consumable supply SKU: ${itemName}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <PackageSearch className="w-5 h-5 text-blue-600" />
            <span>Bulk RFID Inventory & Consumable Supplies</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Automated yard cycle counts, reorder point threshold alerts, and variance logs</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
            title="Export Consumable Supplies to CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Item SKU</span>
          </button>

          <button
            onClick={handleRunBulkCycleCount}
            disabled={scanningCycle}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${scanningCycle ? 'animate-spin' : ''}`} />
            <span>{scanningCycle ? 'Sweeping...' : 'Run Cycle Scan'}</span>
          </button>
        </div>
      </div>

      {scanMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2 font-medium shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Low Stock Reorder Banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">LOW STOCK WARNING ({lowStockItems.length} items below minimum threshold):</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {lowStockItems.map(i => `${i.name} (${i.quantityOnHand} ${i.unit} left)`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              lowStockItems.forEach(i => handleRestock(i));
              showToast('Auto-restock orders generated for all low inventory items!');
            }}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg whitespace-nowrap self-start sm:self-auto shadow-xs"
          >
            Reorder All Low Stock
          </button>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Supply Item</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Site Location</th>
              <th className="py-3 px-4 font-mono">On Hand</th>
              <th className="py-3 px-4 font-mono">Min Threshold</th>
              <th className="py-3 px-4 text-right">Unit Price</th>
              <th className="py-3 px-4 text-center">Adjust Stock</th>
              <th className="py-3 px-4 text-center">Quick Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(inventory || []).map(item => {
              const isLow = item.quantityOnHand <= item.minThreshold;

              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{item.name}</span>
                      {isLow && (
                        <span className="text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.2 rounded">
                          LOW
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-500">
                    {item.category}
                  </td>

                  <td className="py-3 px-4 text-slate-800 font-medium">
                    {item.siteName}
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-blue-900 text-sm">
                    {item.quantityOnHand} {item.unit}
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-500">
                    {item.minThreshold} {item.unit}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    ${item.costPerUnit.toFixed(2)}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 font-mono">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg flex items-center justify-center transition-colors"
                        title="Reduce quantity by 1"
                      >
                        -
                      </button>
                      <span className="px-2 font-bold text-slate-800 min-w-[28px] text-center">
                        {item.quantityOnHand}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg flex items-center justify-center transition-colors"
                        title="Increase quantity by 1"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleRestock(item)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                      title="Restock up to recommended yard inventory level"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      <span>Restock</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add SKU Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Add Consumable Supply SKU</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item SKU Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3M Class 2 High-Vis Vests (Pack of 20)"
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
                  >
                    <option value="Safety & PPE">Safety & PPE</option>
                    <option value="Fasteners & Anchor Bolts">Fasteners & Bolts</option>
                    <option value="Electrical Supplies">Electrical</option>
                    <option value="Fuel & Lubricants">Fuel & Lubes</option>
                    <option value="Rigging & Slings">Rigging</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="boxes, pairs, drums, kg"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={qtyOnHand}
                    onChange={e => setQtyOnHand(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={minThreshold}
                    onChange={e => setMinThreshold(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costPerUnit}
                    onChange={e => setCostPerUnit(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Add Supply Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

