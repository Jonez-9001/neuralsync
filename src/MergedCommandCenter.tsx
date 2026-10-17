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
  Scale,
  MapPin,
  Clock
} from 'lucide-react';
import Project1App from './project1/Project1App';
import Project2App from './project2/Project2App';
import Project3App from './project3/Project3App';
import { AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES as P1_DEFAULT_RULES } from './project1/data/initialData';
import { generateOwnerReport, formatCurrency, formatIndianLakhsCrores } from './project1/utils/calculations';
import { StockItem, RulesConfig as P1RulesConfig } from './project1/types';
import { INITIAL_DISPATCHES, INITIAL_RULES as P2_DEFAULT_RULES } from './project2/data/initialData';
import { INITIAL_WORKSPACES } from './project2/data/factoryWorkspaces';
import { calculateOTIFMetrics } from './project2/utils/otifCalculator';
import { DispatchRow, RulesConfig as P2RulesConfig } from './project2/types/otif';
import { INITIAL_TRIPS, DEFAULT_RULES as P3_DEFAULT_RULES, SCALE_PROFILES } from './project3/data/defaultData';
import { calculateAuditMetrics } from './project3/utils/auditCalculations';
import { Trip, RulesConfig as P3RulesConfig, ScaleProfile } from './project3/types/freight';

interface MergedCommandCenterProps {
  onSwitchToStandaloneP1: () => void;
  onSwitchToStandaloneP2: () => void;
  onSwitchToStandaloneP3: () => void;
}

export const MergedCommandCenter: React.FC<MergedCommandCenterProps> = ({
  onSwitchToStandaloneP1,
  onSwitchToStandaloneP2,
  onSwitchToStandaloneP3,
}) => {
  const [activeModule, setActiveModule] = useState<'synthesis' | 'p1_engine' | 'p2_engine' | 'p3_engine'>('synthesis');
  const [refreshTick, setRefreshTick] = useState(0);

  // Re-sync live data from localStorage whenever tab switches back to synthesis
  useEffect(() => {
    setRefreshTick(t => t + 1);
  }, [activeModule]);

  // 1. Load Project 1 (Dead Stock & Working Capital) live state
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

  // 2. Load Project 2 (Dispatch OTIF & Factory Gate SLA) live state
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

  // 3. Load Project 3 (Freight Leak & Detention Audit) live state
  const { p3Trips, p3Rules, p3Scale } = useMemo(() => {
    let trips: Trip[] = INITIAL_TRIPS;
    let rules: P3RulesConfig = P3_DEFAULT_RULES;
    let scale: ScaleProfile = SCALE_PROFILES[0];
    try {
      const savedTrips = localStorage.getItem('freight_audit_trips_v1');
      if (savedTrips) {
        const parsed = JSON.parse(savedTrips);
        if (Array.isArray(parsed) && parsed.length > 0) trips = parsed;
      }
      const savedRules = localStorage.getItem('freight_audit_rules_v1');
      if (savedRules) rules = JSON.parse(savedRules);
      const savedScale = localStorage.getItem('freight_audit_scale_v1');
      if (savedScale) {
        const parsedScale = JSON.parse(savedScale);
        const found = SCALE_PROFILES.find(p => p.id === parsedScale.id);
        if (found) scale = found;
      }
    } catch {
      // fallback to defaults
    }
    return { p3Trips: trips, p3Rules: rules, p3Scale: scale };
  }, [refreshTick]);

  // Compute live metrics across all 3 engines
  const p1Summary = useMemo(() => generateOwnerReport(p1Items, p1Rules), [p1Items, p1Rules]);
  const p2Metrics = useMemo(() => calculateOTIFMetrics(p2Dispatches, p2Rules), [p2Dispatches, p2Rules]);
  const p3Audit = useMemo(() => calculateAuditMetrics(p3Trips, p3Rules), [p3Trips, p3Rules]);

  // Cross-Engine Financial & Operational Synthesis Math
  const monthlyFailures = p2Metrics.fails * 2; // 2 fortnights per month
  const monthlyOemPenaltyBleed = monthlyFailures * (35000 + 12000 + 8000); // ₹55,000 avg loss per failed load
  const annualOemPenaltyBleed = monthlyOemPenaltyBleed * 12;

  // Project 3 monthly & annualized freight leak (scaled by active scale profile multiplier)
  const scaledMonthlyFreightLeak = Math.round(p3Audit.totals.totalLeak * p3Scale.multiplier);
  const annualFreightLeak = scaledMonthlyFreightLeak * 12;

  // Total Plant Capital & Profit Exposure across P1 + P2 + P3
  const totalPlantValueAtRisk = p1Summary.deadCash + p1Summary.slowCash + annualOemPenaltyBleed + annualFreightLeak;

  // Causal links between P1 -> P2 -> P3
  const materialShortFails = p2Metrics.reasonStats.find(r => r.reason === 'Material short')?.count || 0;
  const gateDelayFails = p2Metrics.reasonStats
    .filter(r => r.reason === 'QC hold' || r.reason === 'Paperwork' || r.reason === 'Labour short')
    .reduce((acc, curr) => acc + curr.count, 0);
  const projectedOtifAfterMaterialFix = p2Metrics.totalDispatches > 0
    ? Math.round(((p2Metrics.passes + materialShortFails) / p2Metrics.totalDispatches) * 100)
    : p2Metrics.otifPercent;
  const cashUnlockedAt25PctHaircut = Math.round(p1Summary.deadCash * 0.75);

  const worstLane = p3Audit.laneSummaries[0];
  const primaryLeakCarrier = p3Audit.transporterSummaries[0];

  return (
    <div className="min-h-screen bg-industrial-grid text-slate-100 flex flex-col font-sans">
      {/* Unified Merged Suite Sub-Navigation Bar */}
      <div className="bg-slate-900/95 border-b border-slate-800 sticky top-10 z-30 backdrop-blur-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 via-emerald-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight">
                  Unified Factory Profit &amp; Turnaround Suite (P1 + P2 + P3)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  3-Engine Live Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Storehouse Dead Cash (P1) → Factory Gate OTIF (P2) → Outbound Lorry &amp; Detention Audit (P3)
              </p>
            </div>
          </div>

          {/* Sub-Module Switcher inside Merged Version */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveModule('synthesis')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeModule === 'synthesis'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>P1+P2+P3 Executive Synthesis</span>
            </button>
            <button
              onClick={() => setActiveModule('p1_engine')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeModule === 'p1_engine'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>P1: Dead Stock ({p1Summary.totalItemCount} SKUs)</span>
            </button>
            <button
              onClick={() => setActiveModule('p2_engine')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeModule === 'p2_engine'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>P2: Dispatch OTIF ({p2Metrics.otifPercent}%)</span>
            </button>
            <button
              onClick={() => setActiveModule('p3_engine')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeModule === 'p3_engine'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>P3: Freight Leak ({formatCurrency(p3Audit.totals.totalLeak, 'INR')})</span>
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

      {activeModule === 'p3_engine' && (
        <div className="flex-1">
          <Project3App />
        </div>
      )}

      {activeModule === 'synthesis' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Executive Hero Banner */}
          <div className="industrial-card rounded-2xl p-6 border border-white/10 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2.5 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    End-to-End Factory Profit Trilogy (P1 + P2 + P3)
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Plant Corridor: <strong className="text-white">Ambattur → Sriperumbudur → Oragadam</strong>
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  The 3-Stage Industrial Cash Bleed: Store → Gate → Highway
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  1. <strong className="text-amber-300">Storehouse (P1)</strong>: <strong className="text-rose-400 font-mono">{formatCurrency(p1Summary.deadCash, 'INR')}</strong> is frozen in Dead Stock (&gt;{p1Rules.deadThresholdDays}d idle), starving working capital for fast-moving raw materials.<br />
                  2. <strong className="text-emerald-300">Factory Gate (P2)</strong>: Raw stockouts trigger <strong className="text-rose-400 font-mono">{materialShortFails} "Material short"</strong> OTIF failures, while <strong className="text-rose-400 font-mono">{gateDelayFails} loads</strong> sit delayed by QC/Paperwork/Labour.<br />
                  3. <strong className="text-cyan-300">Outbound Freight (P3)</strong>: Those exact gate delays cause <strong className="text-rose-400 font-mono">{p3Audit.totals.totalWaitHours}h of lorry detention ({formatCurrency(p3Audit.totals.detention, 'INR')})</strong> and emergency broker rate-gouging (<strong className="text-rose-400 font-mono">{formatCurrency(p3Audit.totals.rateLeak, 'INR')} rate leak</strong>).
                </p>
              </div>

              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shrink-0 font-mono space-y-1.5 text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Combined Annual Plant Value at Risk (P1+P2+P3)
                </span>
                <div className="text-2xl sm:text-3xl font-black text-rose-400">
                  {formatIndianLakhsCrores(totalPlantValueAtRisk)}
                </div>
                <div className="text-[11px] text-slate-400">
                  Dead/Slow Stock + OEM SLA Debits + Annualized Freight Leak
                </div>
              </div>
            </div>
          </div>

          {/* 3-Pillar Executive Summary KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pillar 1: P1 Dead Stock & Working Capital */}
            <div className="industrial-card rounded-2xl p-5 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  P1 • Inventory &amp; Cash Engine
                </span>
                <Package className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Dead Cash Locked (&gt;{p1Rules.deadThresholdDays}d Idle):</span>
                <div className="text-2xl font-black font-mono text-white">
                  {formatCurrency(p1Summary.deadCash, 'INR')}
                  <span className="text-xs font-normal text-amber-300 ml-2">
                    ({p1Summary.deadCashPercent.toFixed(1)}% of stock)
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block">7-Day Unlock (75%):</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(cashUnlockedAt25PctHaircut, 'INR')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Holding Burn ({p1Rules.holdingCostPercent}%):</span>
                  <span className="text-rose-400 font-bold">{formatCurrency(p1Summary.annualHoldingBurn, 'INR')}/yr</span>
                </div>
              </div>
            </div>

            {/* Pillar 2: P2 Factory Gate OTIF & SLA */}
            <div className="industrial-card rounded-2xl p-5 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  P2 • Factory Gate OTIF Engine
                </span>
                <Truck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Current Fortnight Gate OTIF:</span>
                <div className="text-2xl font-black font-mono text-white flex items-baseline gap-2">
                  <span>{p2Metrics.otifPercent}%</span>
                  <span className="text-xs text-emerald-400 font-bold">
                    → {projectedOtifAfterMaterialFix}% (With P1 Buffer)
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block">Monthly OEM Bleed:</span>
                  <span className="text-rose-400 font-bold">{formatCurrency(monthlyOemPenaltyBleed, 'INR')}/mo</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Weakest OEM Account:</span>
                  <span className="text-amber-300 font-bold truncate block">{p2Metrics.weakestCustomer?.customer || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Pillar 3: P3 Outbound Freight Leak & Detention Audit */}
            <div className="industrial-card rounded-2xl p-5 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  P3 • Freight Leak Audit Engine
                </span>
                <Scale className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Sample Audit Leak ({p3Audit.totals.totalTrips} Trips):</span>
                <div className="text-2xl font-black font-mono text-rose-400 flex items-baseline gap-2">
                  <span>{formatCurrency(p3Audit.totals.totalLeak, 'INR')}</span>
                  <span className="text-xs text-cyan-300 font-bold">
                    ({Math.round((p3Audit.totals.totalLeak / (p3Audit.totals.freightPaid || 1)) * 100)}% of freight bill)
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block">Rate Gouging Leak:</span>
                  <span className="text-amber-300 font-bold">{formatCurrency(p3Audit.totals.rateLeak, 'INR')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Gate Wait Detention:</span>
                  <span className="text-rose-400 font-bold">{formatCurrency(p3Audit.totals.detention, 'INR')} ({p3Audit.totals.totalWaitHours}h)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3-Column Deep-Dive Action Bridge: P1 vs P2 vs P3 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Column 1: P1 Top Dead SKUs */}
            <div className="industrial-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">Stage 1 • Storehouse</span>
                    <h2 className="text-sm font-bold text-white">Top Dead Stock to Liquidate (P1)</h2>
                  </div>
                  <button
                    onClick={() => setActiveModule('p1_engine')}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <span>Open P1</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2">
                  {p1Summary.topDeadItems.slice(0, 4).map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-white truncate">{item.itemName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {item.daysIdle}d idle • Class {item.abcClass} • {item.category}
                        </div>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <div className="font-bold text-white">{formatCurrency(item.closingValue || 0, 'INR')}</div>
                        <div className="text-[10px] text-emerald-400">
                          Unlock {formatCurrency(Math.round((item.closingValue || 0) * 0.75), 'INR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Total Stock Value: {formatCurrency(p1Summary.totalStockValue, 'INR')}</span>
                <button
                  onClick={onSwitchToStandaloneP1}
                  className="text-amber-300 hover:underline cursor-pointer"
                >
                  Standalone P1 ↗
                </button>
              </div>
            </div>

            {/* Column 2: P2 Customer OTIF & Root Causes */}
            <div className="industrial-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Stage 2 • Factory Gate</span>
                    <h2 className="text-sm font-bold text-white">OEM Scorecards &amp; Gate Delays (P2)</h2>
                  </div>
                  <button
                    onClick={() => setActiveModule('p2_engine')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <span>Open P2</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2">
                  {p2Metrics.customerStats.map((cust) => (
                    <div
                      key={cust.customer}
                      className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{cust.customer}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {cust.passes}/{cust.dispatches} Pass • On-Time: {cust.onTimeCount} • In-Full: {cust.inFullCount}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        cust.otifPercent >= 80
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : cust.otifPercent >= 50
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {cust.otifPercent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">
                  #1 Cause: <strong className="text-rose-400">{p2Metrics.topFailureReason?.reason || 'None'}</strong>
                </span>
                <button
                  onClick={onSwitchToStandaloneP2}
                  className="text-emerald-300 hover:underline cursor-pointer"
                >
                  Standalone P2 ↗
                </button>
              </div>
            </div>

            {/* Column 3: P3 Freight Lanes & Transporter Leaks */}
            <div className="industrial-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">Stage 3 • Outbound Lorry Audit</span>
                    <h2 className="text-sm font-bold text-white">Transporter &amp; Lane Leaks (P3)</h2>
                  </div>
                  <button
                    onClick={() => setActiveModule('p3_engine')}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <span>Open P3</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2">
                  {p3Audit.transporterSummaries.map((carrier) => (
                    <div
                      key={carrier.transporter}
                      className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{carrier.transporter}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                            carrier.category === 'benchmark'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : carrier.category === 'primary_leak'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {carrier.category === 'benchmark' ? 'Benchmark' : carrier.category === 'primary_leak' ? 'Primary Leak' : 'Broker'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {carrier.tripsCount} trips • Rate Leak: {formatCurrency(carrier.totalRateLeak, 'INR')} • Wait: {carrier.totalWaitHours}h
                        </div>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <div className="font-bold text-rose-400">{formatCurrency(carrier.totalWaste, 'INR')}</div>
                        <div className="text-[10px] text-slate-500">Total Waste</div>
                      </div>
                    </div>
                  ))}

                  {worstLane && (
                    <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-[11px] font-mono text-cyan-200 flex items-center justify-between">
                      <span>Worst Lane: <strong className="text-white">{worstLane.lane}</strong></span>
                      <span className="text-rose-300 font-bold">{formatCurrency(worstLane.totalWaste, 'INR')} leak</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">
                  Primary Leak: <strong className="text-rose-400">{primaryLeakCarrier?.transporter || 'Siva'}</strong>
                </span>
                <button
                  onClick={onSwitchToStandaloneP3}
                  className="text-cyan-300 hover:underline cursor-pointer"
                >
                  Standalone P3 ↗
                </button>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};
