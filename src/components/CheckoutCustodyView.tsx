import React, { useState } from 'react';
import { ArrowLeftRight, UserCheck, ShieldCheck, Clock, CheckCircle2, AlertTriangle, Search, Plus, FileText, Camera } from 'lucide-react';
import { Asset, Checkout, User } from '../types';

interface CheckoutCustodyViewProps {
  checkouts: Checkout[];
  assets: Asset[];
  users: User[];
  onCreateCheckout: (data: { assetId: string; userId: string; jobId?: string; expectedReturnHours?: number; notes?: string }) => void;
  onReturnCheckout: (checkoutId: string, condition: string) => void;
}

export const CheckoutCustodyView: React.FC<CheckoutCustodyViewProps> = ({
  checkouts,
  assets,
  users,
  onCreateCheckout,
  onReturnCheckout
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>((assets || []).find(a => a.status === 'In Zone')?.id || '');
  const [selectedUserId, setSelectedUserId] = useState<string>((users || [])[2]?.id || (users || [])[0]?.id || '');
  const [jobId, setJobId] = useState<string>('job-slab-l3');
  const [expectedHours, setExpectedHours] = useState<number>(8);
  const [notes, setNotes] = useState<string>('Checked out for site task');

  const [returnModalCheckout, setReturnModalCheckout] = useState<Checkout | null>(null);
  const [returnCondition, setReturnCondition] = useState<string>('Good');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const availableAssets = (assets || []).filter(a => a.status === 'In Zone');

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !selectedUserId) {
      setValidationError('Please select both an available asset and a worker RFID badge.');
      setTimeout(() => setValidationError(null), 4000);
      return;
    }
    setValidationError(null);
    onCreateCheckout({
      assetId: selectedAssetId,
      userId: selectedUserId,
      jobId,
      expectedReturnHours: Number(expectedHours),
      notes
    });
    setNotes('');
    setSuccessToast('Asset checkout authorized and custody recorded!');
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleConfirmReturn = () => {
    if (returnModalCheckout) {
      onReturnCheckout(returnModalCheckout.id, returnCondition);
      setReturnModalCheckout(null);
      setSuccessToast(`Asset return processed with condition: ${returnCondition}`);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-amber-600" />
            <span>Check-In / Check-Out & Custody Engine</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Scan-based worker badge checkout with expected return timers & condition proof</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg">
            {checkouts.filter(c => c.status === 'ACTIVE').length} Active Custody Loans
          </span>
          <span className="text-xs font-mono font-bold bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg">
            {checkouts.filter(c => c.status === 'OVERDUE').length} Overdue
          </span>
        </div>
      </div>

      {/* Main Grid: Fast Badge Scanner Form & Active Custody Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Scan & Issue Checkout Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-600" />
              <span>Issue New Asset Checkout</span>
            </h3>
            <p className="text-xs text-slate-500">Simulate RFID badge scan + Asset EPC scan</p>
          </div>

          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2 font-medium animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {successToast && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2 font-medium animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs">
            
            {/* Asset Selection */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Available Asset *</label>
              <select
                value={selectedAssetId}
                onChange={e => setSelectedAssetId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
              >
                {(availableAssets || []).length === 0 ? (
                  <option value="">No assets currently in yard</option>
                ) : (
                  (availableAssets || []).map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.category}) - EPC: {a.tagEpc ? a.tagEpc.slice(-8) : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Worker Badge Selection */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Worker RFID Badge / Custodian *</label>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
              >
                {(users || []).map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role}) - Badge: {u.badgeId}
                  </option>
                ))}
              </select>
            </div>

            {/* Job / Task Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Work Order / Job</label>
              <input
                type="text"
                value={jobId}
                onChange={e => setJobId(e.target.value)}
                placeholder="e.g. L3 Slab Core Anchor Drilling"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Expected Duration */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expected Loan Duration (Hours)</label>
              <input
                type="number"
                min={1}
                max={72}
                value={expectedHours}
                onChange={e => setExpectedHours(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notes / Accessories Issued</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Issued with 2x FlexVolt 9Ah batteries"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Confirm & Issue Checkout</span>
            </button>

          </form>
        </div>

        {/* Active Custody Loans Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">Active Custody & Checkout Log</h3>
            <span className="text-xs text-slate-500">Total Records: {(checkouts || []).length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Asset Name</th>
                  <th className="py-2.5 px-3">Custodian</th>
                  <th className="py-2.5 px-3">Checkout Time</th>
                  <th className="py-2.5 px-3">Expected Return</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(checkouts || []).map(chk => (
                  <tr key={chk.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{chk.assetName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        EPC: {chk.tagEpc ? (chk.tagEpc.length > 8 ? chk.tagEpc.slice(-8) : chk.tagEpc) : 'N/A'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-slate-800 font-semibold block">{chk.userName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Badge: {chk.badgeId}</span>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {chk.checkoutTime ? new Date(chk.checkoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {chk.expectedReturn ? new Date(chk.expectedReturn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        chk.status === 'RETURNED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        chk.status === 'OVERDUE' ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {chk.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {chk.status !== 'RETURNED' ? (
                        <button
                          onClick={() => setReturnModalCheckout(chk)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded transition-colors shadow-xs"
                        >
                          Scan Return
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Returned {chk.actualReturn ? new Date(chk.actualReturn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Return Confirmation Modal */}
      {returnModalCheckout && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-slate-900">Scan Asset Return & Condition Check</h3>
            <p className="text-xs text-slate-600">
              Confirm return of <strong>{returnModalCheckout.assetName}</strong> from custodian <strong>{returnModalCheckout.userName}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Return Condition</label>
              <select
                value={returnCondition}
                onChange={e => setReturnCondition(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs"
              >
                <option value="Excellent">Excellent - Unchanged</option>
                <option value="Good">Good - Minor normal wear</option>
                <option value="Fair">Fair - Needs clean or inspection</option>
                <option value="Damaged">Damaged - Send to Maintenance</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReturnModalCheckout(null)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

};
