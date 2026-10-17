import React from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Package, 
  Layers, 
  ShieldAlert, 
  ArrowUpRight,
  Sparkles,
  MapPin
} from 'lucide-react';
import { AuditItem, AuditRules, AuditSummary } from '../types/audit';
import { computePredictiveShortages, formatINR } from '../utils/auditCalculations';

interface PredictiveAnalyticsProps {
  items: AuditItem[];
  rules: AuditRules;
  summary: AuditSummary;
}

export const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({
  items,
  rules,
  summary,
}) => {
  const shortages = computePredictiveShortages(items, rules);

  // Group shrinkage by spot
  const shrinkageBySpot: Record<string, number> = {};
  items.forEach((item) => {
    if ((item.gapRupees ?? 0) < 0) {
      const spot = item.spot || 'Unassigned';
      shrinkageBySpot[spot] = (shrinkageBySpot[spot] || 0) + Math.abs(item.gapRupees ?? 0);
    }
  });

  // Slotting efficiency: Fast movers at counter vs total fast movers
  const totalFastMovers = items.filter((it) => it.issuesPerMonth >= rules.fastMoverCutoff);
  const fastMoversAtCounter = totalFastMovers.filter((it) => it.spot.trim().toLowerCase() === 'counter');
  const slottingScore = totalFastMovers.length > 0 
    ? Math.round((fastMoversAtCounter.length / totalFastMovers.length) * 100)
    : 100;

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Slotting Efficiency */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Selling Face Slotting Efficiency
            </span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-white font-mono">{slottingScore}%</div>
            <div className="text-xs text-slate-300 mt-0.5">
              {fastMoversAtCounter.length} of {totalFastMovers.length} top velocity SKUs visible at counter
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                slottingScore >= 80
                  ? 'bg-emerald-500'
                  : slottingScore >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${slottingScore}%` }}
            />
          </div>
        </div>

        {/* Shrinkage Leakage by Zone */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Highest Shrinkage Zone
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-rose-400 font-mono">
              Back Rack: {formatINR(shrinkageBySpot['Back rack'] || 0)}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Charger units missing where customer cannot see them
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Mezzanine: {formatINR(shrinkageBySpot['Mezzanine'] || 0)}</span>
            <span>•</span>
            <span>Drawer: {formatINR(shrinkageBySpot['Drawer'] || 0)}</span>
          </div>
        </div>

        {/* Immediate Run-Out Risk */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Critical Stock Run-out Alert
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-amber-400 font-mono">
              {shortages.filter((s) => s.severity === 'critical').length} SKUs &lt;15 Days
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Brake pads &amp; chargers will run dry before next cycle
            </div>
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">
            Automated purchase reorder draft ready
          </div>
        </div>
      </div>

      {/* Predictive Stock Shortage Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Predictive Stock Shortage &amp; Days of Inventory</span>
            </h3>
            <p className="text-xs text-slate-400">
              Anticipate stock-outs based on physical hand counts and verified 30-day velocity.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3 font-semibold">SKU Code</th>
                <th className="py-2.5 px-3 font-semibold">Part Name</th>
                <th className="py-2.5 px-3 font-semibold text-right">Physical Count</th>
                <th className="py-2.5 px-3 font-semibold text-right">Monthly Velocity</th>
                <th className="py-2.5 px-3 font-semibold text-right">Days Left</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Suggested Reorder (45-Day Cover)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {shortages.slice(0, 8).map((shortage) => (
                <tr key={shortage.code} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                    {shortage.code}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-white">
                    {shortage.part}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                    {shortage.physicalQty} pcs
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    {shortage.monthlyVelocity} / mo
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    <span
                      className={
                        shortage.daysRemaining <= 15
                          ? 'text-rose-400'
                          : shortage.daysRemaining <= 30
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }
                    >
                      {shortage.daysRemaining} days
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        shortage.severity === 'critical'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : shortage.severity === 'warning'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {shortage.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-300">
                    +{shortage.recommendedReorderQty} units
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
