import React from 'react';
import { TrendingUp, Clock, AlertCircle, DollarSign, Calculator, ChevronRight } from 'lucide-react';
import { Asset } from '../types';

interface UtilizationRentalViewProps {
  assets: Asset[];
}

export const UtilizationRentalView: React.FC<UtilizationRentalViewProps> = ({ assets }) => {
  const rentalAssets = (assets || []).filter(a => a.isRental);
  const totalDailyRentalCost = rentalAssets.reduce((sum, a) => sum + (a.rentalCostPerDay || 0), 0);

  const activeCount = (assets || []).filter(a => a.status === 'Checked Out').length;
  const idleCount = (assets || []).filter(a => a.status === 'In Zone').length;
  const overallUtilizationPercent = (assets || []).length > 0 ? Math.round((activeCount / (assets || []).length) * 100) : 0;

  return (
    <div className="space-y-6">
      
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <span>Equipment Utilization & Rental Cost Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Detect idle rented machinery, track daily cost accrual, and optimize cross-site reallocation</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono">
            <span className="text-slate-500">Total Rental Accrual: </span>
            <span className="text-emerald-700 font-bold">${totalDailyRentalCost}/day</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Fleet Utilization Rate</span>
          <span className="text-3xl font-black font-mono text-amber-600 mt-1 block">{overallUtilizationPercent}%</span>
          <span className="text-[11px] text-slate-500 mt-1 block">{activeCount} of {assets.length} items active on jobs</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Active Rented Equipment</span>
          <span className="text-3xl font-black font-mono text-blue-600 mt-1 block">{rentalAssets.length}</span>
          <span className="text-[11px] text-slate-500 mt-1 block">Subject to daily rental invoice accrual</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Potential Idle Rental Savings</span>
          <span className="text-3xl font-black font-mono text-emerald-600 mt-1 block">${totalDailyRentalCost * 30}/mo</span>
          <span className="text-[11px] text-slate-500 mt-1 block">By returning underutilized rented boom lifts</span>
        </div>

      </div>

      {/* Rented Equipment Fleet Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-3 p-4">
        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Rented Equipment Fleet & Return Reminders</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Equipment</th>
                <th className="py-2.5 px-3">Site Location</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 font-mono">Daily Rate</th>
                <th className="py-2.5 px-3 font-mono">Rental Expiration</th>
                <th className="py-2.5 px-3 text-right">30-Day Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rentalAssets.map(ast => (
                <tr key={ast.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-bold text-slate-900">
                    {ast.name}
                  </td>

                  <td className="py-3 px-3 text-slate-700">
                    {ast.siteName}
                  </td>

                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ast.status === 'Checked Out' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {ast.status}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-amber-800">
                    ${ast.rentalCostPerDay}/day
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-500">
                    {ast.rentalEndDate || '2026-08-30'}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                    ${(ast.rentalCostPerDay || 0) * 30}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );

};
