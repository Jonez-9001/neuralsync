import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Package,
  Truck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Activity,
  BarChart3,
  Zap,
  RefreshCw,
  FileSpreadsheet,
  Sliders,
  Sparkles,
  Building2,
  ExternalLink
} from 'lucide-react';
import Project1App from './project1/Project1App';
import Project2App from './project2/Project2App';
import { AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES as P1_DEFAULT_RULES } from './project1/data/initialData';
import { generateOwnerReport, formatCurrency, formatIndianLakhsCrores } from './project1/utils/calculations';
import { StockItem, RulesConfig as P1RulesConfig } from './project1/types';
import { INITIAL_DISPATCHES, INITIAL_RULES as P2_DEFAULT_RULES } from './project2/data/initialData';
import { INITIAL_WORKSPACES } from './project2/data/factoryWorkspaces';
import { calculateOTIFMetrics } from './project2/utils/otifCalculator';
import { DispatchRow, RulesConfig as P2RulesConfig } from './project2/types/otif';

interface MergedCommandCenterProps {
  onSwitchToStandaloneP1: () => void;
  onSwitchToStandaloneP2: () => void;
}

export const MergedCommandCenter: React.FC<MergedCommandCenterProps> = ({
  onSwitchToStandaloneP1,
  onSwitchToStandaloneP2,
}) => {
  const [activeModule, setActiveModule] = useState<'synthesis' | 'p1_engine' | 'p2_engine'>('synthesis');
  const [refreshTick, setRefreshTick] = useState(0);

  // Re-sync live data from localStorage whenever tab switches back to synthesis
  useEffect(() => {
    setRefreshTick(t => t + 1);
  }, [activeModule]);

  // Load Project 1 live state
  const { p1Items, p1Rules } = useMemo(() => {
    let items: StockItem[] = AMBATTUR_FABRICATION_SAMPLE;
    let rules: P1RulesConfig = P1_DEFAULT_RULES;
    try {
      const savedItems = localStorage.getItem('p1_stock_items');
      if (savedItems) items = JSON.parse(savedItems);
      const savedRules = localStorage.getItem('p1_stock_rules');
      if (savedRules) rules = JSON.parse(savedRules);
    } catch {
      // fallback to defaults
    }
    return { p1Items: items, p1Rules: rules };
  }, [refreshTick]);

  // Load Project 2 live state
  const { p2Dispatches, p2Rules, activeWorkspaceName } = useMemo(() => {
    let dispatches: DispatchRow[] = INITIAL_DISPATCHES;
    let rules: P2RulesConfig = P2_DEFAULT_RULES;
    let wsName = INITIAL_WORKSPACES[0].name;
    try {
      const savedWsList = localStorage.getItem('otif_workspaces_v2');
      const savedActiveId = localStorage.getItem('otif_active_workspace_id_v2') || INITIAL_WORKSPACES[0].id;
      if (savedWsList) {
        const parsed = JSON.parse(savedWsList);
        const found = parsed.find((w: any) => w.id === savedActiveId) || parsed[0];
        if (found) {
          dispatches = found.dispatches || INITIAL_DISPATCHES;
          rules = found.rules || P2_DEFAULT_RULES;
          wsName = found.name || wsName;
        }
      }
    } catch {
      // fallback to defaults
    }
    return { p2Dispatches: dispatches, p2Rules: rules, activeWorkspaceName: wsName };
  }, [refreshTick]);

  // Compute live metrics from both engines
  const p1Summary = useMemo(() => generateOwnerReport(p1Items, p1Rules), [p1Items, p1Rules]);
  const p2Metrics = useMemo(() => calculateOTIFMetrics(p2Dispatches, p2Rules), [p2Dispatches, p2Rules]);

  // Combined CFO & Plant Operations Calculations
  const monthlyFailures = p2Metrics.fails * 2; // 2 fortnights per month
  const monthlyOemPenaltyBleed = monthlyFailures * (35000 + 12000 + 8000); // ₹55,000 avg loss per failed load
  const annualOemPenaltyBleed = monthlyOemPenaltyBleed * 12;
  const totalCapitalAtRisk = p1Summary.deadCash + p1Summary.slowCash + annualOemPenaltyBleed;

  // Material shortage correlation between P1 and P2
  const materialShortFails = p2Metrics.reasonStats.find(r => r.reason === 'Material short')?.count || 0;
  const projectedOtifAfterMaterialFix = p2Metrics.totalDispatches > 0
    ? Math.round(((p2Metrics.passes + materialShortFails) / p2Metrics.totalDispatches) * 100)
    : p2Metrics.otifPercent;
  const cashUnlockedAt25PctHaircut = Math.round(p1Summary.deadCash * 0.75);

  return (
    <div className="min-h-screen bg-industrial-grid text-slate-100 flex flex-col font-sans">
      {/* Unified Merged Suite Sub-Navigation Bar */}
      <div className="bg-slate-900/95 border-b border-slate-800 sticky top-10 z-30 backdrop-blur-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight">
                  Industrial Operations Command Suite (Merged P1 + P2)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Live Cross-Engine Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Connecting Working Capital &amp; Dead Inventory (Project 1) with Factory Gate Dispatch OTIF (Project 2)
              </p>
            </div>
          </div>

          {/* Sub-Module Switcher inside Merged Version */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveModule('synthesis')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeModule === 'synthesis'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Unified CFO &amp; Plant Synthesis</span>
            </button>
            <button
              onClick={() => setActiveModule('p1_engine')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeModule === 'p1_engine'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Engine 1: Dead Stock &amp; Cash ({p1Summary.totalItemCount} SKUs)</span>
            </button>
            <button
              onClick={() => setActiveModule('p2_engine')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeModule === 'p2_engine'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Engine 2: Dispatch OTIF ({p2Metrics.otifPercent}%)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Sub-Module Content */}
      {activeModule === 'p1_engine' && (
        <div className="flex-1">
          <Project1App />
        </div>
      )}

      {activeModule === 'p2_engine' && (
        <div className="flex-1">
          <Project2App />
        </div>
      )}

      {activeModule === 'synthesis' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Executive Hero Banner */}
          <div className="industrial-card rounded-2xl p-6 border border-white/10 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Unified Plant Turnaround Diagnostics
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Active Vault: <strong className="text-white">{activeWorkspaceName}</strong>
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Why Trucks Leave Short: The Dead Stock &amp; Gate OTIF Causal Link
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Your plant has <strong className="text-rose-400 font-mono">{formatCurrency(p1Summary.deadCash, 'INR')}</strong> trapped in Dead Inventory (&gt;{p1Rules.deadThresholdDays} days idle) and <strong className="text-amber-300 font-mono">{formatCurrency(p1Summary.slowCash, 'INR')}</strong> in Slow Stock. Meanwhile, <strong className="text-rose-400 font-mono">{materialShortFails} of {p2Metrics.fails} failed gate dispatches ({p2Metrics.topFailureReason?.percentageOfFails || 44}%)</strong> are failing due to <strong className="text-white">"Material short"</strong>. Liquidating dead stock funds the exact raw material safety buffer needed to jump Gate OTIF from <strong className="text-amber-400 font-mono">{p2Metrics.otifPercent}% → {projectedOtifAfterMaterialFix}%</strong>.
                </p>
              </div>

              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shrink-0 font-mono space-y-1 text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Combined Annual Plant Value at Risk
                </span>
                <div className="text-2xl sm:text-3xl font-black text-rose-400">
                  {formatIndianLakhsCrores(totalCapitalAtRisk)}
                </div>
                <div className="text-[11px] text-slate-400">
                  Dead/Slow Stock + Annualized OEM Penalties
                </div>
              </div>
            </div>
          </div>

          {/* 4 Cross-Engine KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: P1 Dead Cash */}
            <div className="industrial-card rounded-2xl p-5 border border-rose-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-bold">
                  P1 • Trapped Dead Cash
                </span>
                <Package className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black font-mono text-white">
                {formatCurrency(p1Summary.deadCash, 'INR')}
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between font-mono">
                <span>{p1Summary.deadItemCount} Dead SKUs ({p1Summary.deadCashPercent.toFixed(1)}%)</span>
                <span className="text-rose-300">Burn: {formatCurrency(p1Summary.annualHoldingBurn, 'INR')}/yr</span>
              </div>
            </div>

            {/* Card 2: P1 Immediate Cash Unlock */}
            <div className="industrial-card rounded-2xl p-5 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                  P1 • 7-Day Liquidation Unlock
                </span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400">
                {formatCurrency(cashUnlockedAt25PctHaircut, 'INR')}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                At 25% scrap/discount haircut • Funds Class-A raw stock
              </div>
            </div>

            {/* Card 3: P2 Gate OTIF Score */}
            <div className="industrial-card rounded-2xl p-5 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-300 font-bold">
                  P2 • Factory Gate OTIF
                </span>
                <Truck className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black font-mono text-white flex items-baseline gap-2">
                <span>{p2Metrics.otifPercent}%</span>
                <span className="text-xs text-emerald-400 font-bold">
                  → {projectedOtifAfterMaterialFix}% (Post-Buffer)
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {p2Metrics.passes} Pass / {p2Metrics.fails} Fail ({p2Metrics.totalDispatches} PO Lines)
              </div>
            </div>

            {/* Card 4: P2 Monthly OEM Penalty Bleed */}
            <div className="industrial-card rounded-2xl p-5 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
                  P2 • Monthly SLA Bleed
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black font-mono text-rose-400">
                {formatCurrency(monthlyOemPenaltyBleed, 'INR')}<span className="text-xs text-slate-400 font-normal">/mo</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Weakest OEM: <strong className="text-amber-300">{p2Metrics.weakestCustomer?.customer || 'N/A'}</strong> ({p2Metrics.weakestCustomer?.otifPercent ?? 0}%)
              </div>
            </div>
          </div>

          {/* Side-by-Side Engine Bridge: Project 1 vs Project 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Project 1 Top Dead Items to Liquidate */}
            <div className="industrial-card rounded-2xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      Step 1: Liquidate Top Dead Inventory (Project 1)
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Top frozen SKUs locking up working capital in the stores ledger
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModule('p1_engine')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                >
                  <span>Open Stock Engine</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {p1Summary.topDeadItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                          #{idx + 1} • Class {item.abcClass}
                        </span>
                        <span className="font-bold text-white">{item.itemName}</span>
                        <span className="font-mono text-slate-500 text-[11px]">({item.itemCode})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Idle: <strong className="text-rose-400">{item.daysIdle} days</strong> • Category: {item.category} • Action: <span className="text-amber-300">{item.action}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono shrink-0">
                      <div className="font-bold text-white text-sm">
                        {formatCurrency(item.closingValue || 0, 'INR')}
                      </div>
                      <div className="text-[10px] text-emerald-400">
                        Recover ~{formatCurrency(Math.round((item.closingValue || 0) * 0.75), 'INR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Project 2 Gate OTIF Failures to Eliminate */}
            <div className="industrial-card rounded-2xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      Step 2: Reinvest to Stop Gate OTIF Breaches (Project 2)
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      OEM customer scorecards &amp; Pareto delay root causes at the factory gate
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModule('p2_engine')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                >
                  <span>Open OTIF Engine</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {p2Metrics.customerStats.map((cust) => (
                  <div
                    key={cust.customer}
                    className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{cust.customer}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          cust.otifPercent >= 80
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : cust.otifPercent >= 50
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {cust.otifPercent}% OTIF
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {cust.passes} Pass / {cust.fails} Fail (On-Time: {cust.onTimeCount}/{cust.dispatches} • In-Full: {cust.inFullCount}/{cust.dispatches})
                      </div>
                    </div>
                    <div className="w-28 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 shrink-0">
                      <div
                        className={`h-full ${
                          cust.otifPercent >= 80 ? 'bg-emerald-500' : cust.otifPercent >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${cust.otifPercent}%` }}
                      />
                    </div>
                  </div>
                ))}

                {/* Root cause strip */}
                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs flex flex-wrap items-center justify-between gap-2">
                  <span className="text-indigo-200 font-medium">
                    Top Gate Failure Root Cause: <strong className="text-white font-mono">{p2Metrics.topFailureReason?.reason || 'None'}</strong> ({p2Metrics.topFailureReason?.count || 0} loads / {p2Metrics.topFailureReason?.percentageOfFails || 0}% of fails)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onSwitchToStandaloneP1}
                      className="text-[11px] font-mono text-amber-300 hover:underline cursor-pointer"
                    >
                      Launch P1 Standalone ↗
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      onClick={onSwitchToStandaloneP2}
                      className="text-[11px] font-mono text-emerald-300 hover:underline cursor-pointer"
                    >
                      Launch P2 Standalone ↗
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};
