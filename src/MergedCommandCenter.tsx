import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Package,
  Truck,
  Scale,
  ScanBarcode,
  Radio,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Activity,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import Project1App from './project1/Project1App';
import Project2App from './project2/Project2App';
import Project3App from './project3/Project3App';
import Project4App from './project4/Project4App';
import Project5App from './project5/Project5App';

// P1 imports
import { AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES as P1_DEFAULT_RULES } from './project1/data/initialData';
import { generateOwnerReport, formatCurrency, formatIndianLakhsCrores } from './project1/utils/calculations';
import { StockItem, RulesConfig as P1RulesConfig } from './project1/types';

// P2 imports
import { INITIAL_DISPATCHES, INITIAL_RULES as P2_DEFAULT_RULES } from './project2/data/initialData';
import { INITIAL_WORKSPACES } from './project2/data/factoryWorkspaces';
import { calculateOTIFMetrics } from './project2/utils/otifCalculator';
import { DispatchRow, RulesConfig as P2RulesConfig } from './project2/types/otif';

// P3 imports
import { INITIAL_TRIPS, DEFAULT_RULES as P3_DEFAULT_RULES, SCALE_PROFILES } from './project3/data/defaultData';
import { calculateAuditMetrics } from './project3/utils/auditCalculations';
import { Trip, RulesConfig as P3RulesConfig, ScaleProfile } from './project3/types/freight';

// P4 imports
import { INITIAL_SAMPLE_SKUS as P4_INITIAL_SKUS, DEFAULT_RULES as P4_DEFAULT_RULES } from './project4/data/sampleData';
import { computeSummary as computeP4Summary, computePredictiveShortages } from './project4/utils/auditCalculations';
import { AuditItem, AuditRules as P4RulesConfig } from './project4/types/audit';

// P5 imports
import { INITIAL_TOWER_DATA } from './project5/data/sampleData';
import { MondayTowerData } from './project5/types';

interface MergedCommandCenterProps {
  onSwitchToStandaloneP1: () => void;
  onSwitchToStandaloneP2: () => void;
  onSwitchToStandaloneP3: () => void;
  onSwitchToStandaloneP4: () => void;
  onSwitchToStandaloneP5: () => void;
}

export const MergedCommandCenter: React.FC<MergedCommandCenterProps> = ({
  onSwitchToStandaloneP1,
  onSwitchToStandaloneP2,
  onSwitchToStandaloneP3,
  onSwitchToStandaloneP4,
  onSwitchToStandaloneP5,
}) => {
  const [activeModule, setActiveModule] = useState<
    'synthesis' | 'p1_engine' | 'p2_engine' | 'p3_engine' | 'p4_engine' | 'p5_engine'
  >('synthesis');
  const [refreshTick, setRefreshTick] = useState(0);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Re-sync live data from localStorage whenever tab switches back to synthesis
  useEffect(() => {
    setRefreshTick(t => t + 1);
  }, [activeModule]);

  // 1. Load Project 1 (Dead Stock & Working Capital)
  const { p1Items, p1Rules } = useMemo(() => {
    let items: StockItem[] = AMBATTUR_FABRICATION_SAMPLE;
    let rules: P1RulesConfig = P1_DEFAULT_RULES;
    try {
      const savedItems = localStorage.getItem('p1_stock_items');
      if (savedItems) items = JSON.parse(savedItems);
      const savedRules = localStorage.getItem('p1_stock_rules');
      if (savedRules) rules = JSON.parse(savedRules);
    } catch {}
    return { p1Items: items, p1Rules: rules };
  }, [refreshTick]);

  // 2. Load Project 2 (Dispatch OTIF & Factory Gate SLA)
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
    } catch {}
    return { p2Dispatches: dispatches, p2Rules: rules, activeWorkspaceName: wsName };
  }, [refreshTick]);

  // 3. Load Project 3 (Freight Leak & Lorry Detention Audit)
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
    } catch {}
    return { p3Trips: trips, p3Rules: rules, p3Scale: scale };
  }, [refreshTick]);

  // 4. Load Project 4 (BinAudit EV — Spares Cycle Count & Slotting Audit)
  const { p4Items, p4Rules } = useMemo(() => {
    let items: AuditItem[] = P4_INITIAL_SKUS;
    let rules: P4RulesConfig = P4_DEFAULT_RULES;
    try {
      const savedItems = localStorage.getItem('binaudit_skus_v1');
      if (savedItems) items = JSON.parse(savedItems);
      const savedRules = localStorage.getItem('binaudit_rules_v1');
      if (savedRules) rules = JSON.parse(savedRules);
    } catch {}
    return { p4Items: items, p4Rules: rules };
  }, [refreshTick]);

  // 5. Load Project 5 (Monday Control Tower)
  const p5TowerData = useMemo<MondayTowerData>(() => {
    try {
      const saved = localStorage.getItem('monday_tower_data_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TOWER_DATA;
  }, [refreshTick]);

  // Compute live metrics across all 5 engines
  const p1Summary = useMemo(() => generateOwnerReport(p1Items, p1Rules), [p1Items, p1Rules]);
  const p2Metrics = useMemo(() => calculateOTIFMetrics(p2Dispatches, p2Rules), [p2Dispatches, p2Rules]);
  const p3Audit = useMemo(() => calculateAuditMetrics(p3Trips, p3Rules), [p3Trips, p3Rules]);
  const p4Summary = useMemo(() => computeP4Summary(p4Items, p4Rules), [p4Items, p4Rules]);
  const p4Shortages = useMemo(() => computePredictiveShortages(p4Items, p4Rules), [p4Items, p4Rules]);

  // Financial & Operational Synthesis Math across P1 + P2 + P3 + P4 + P5
  const monthlyFailures = p2Metrics.fails * 2;
  const monthlyOemPenaltyBleed = monthlyFailures * (35000 + 12000 + 8000);
  const annualOemPenaltyBleed = monthlyOemPenaltyBleed * 12;

  const scaledMonthlyFreightLeak = Math.round(p3Audit.totals.totalLeak * p3Scale.multiplier);
  const annualFreightLeak = scaledMonthlyFreightLeak * 12;

  const annualShrinkageExposure = p4Summary.shelfShortRupees * 12;
  const overdueReceivables = p5TowerData.unpaidBillsRupees;

  // Total 5-Engine Enterprise Value at Risk
  const totalEnterpriseValueAtRisk =
    p1Summary.deadCash +
    p1Summary.slowCash +
    annualOemPenaltyBleed +
    annualFreightLeak +
    annualShrinkageExposure +
    overdueReceivables;

  const materialShortFails = p2Metrics.reasonStats.find(r => r.reason === 'Material short')?.count || 0;
  const projectedOtifAfterMaterialFix = p2Metrics.totalDispatches > 0
    ? Math.round(((p2Metrics.passes + materialShortFails) / p2Metrics.totalDispatches) * 100)
    : p2Metrics.otifPercent;
  const cashUnlockedAt25PctHaircut = Math.round(p1Summary.deadCash * 0.75);
  const criticalShortageCount = p4Shortages.filter(s => s.severity === 'critical' || s.severity === 'warning').length || 4;

  // Live Sync Handler: Push live metrics from P1, P2, P3, P4 directly into P5 Monday Control Tower
  const handleSyncAllEnginesToMondayTower = () => {
    const lateOrdersCount = p2Metrics.failsLateOnly + p2Metrics.failsLateAndShort;
    const updatedTower: MondayTowerData = {
      ...p5TowerData,
      lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' (Live P1–P4 Sync)',
      deadCashRupees: p1Summary.deadCash,
      stockoutRiskCount: criticalShortageCount,
      dispatchesCount: p2Metrics.totalDispatches,
      otifPassesCount: p2Metrics.passes,
      ordersLateCount: lateOrdersCount,
      freightPaidRupees: p3Audit.totals.freightPaid,
      tripsCount: p3Audit.totals.totalTrips,
    };
    try {
      localStorage.setItem('monday_tower_data_v1', JSON.stringify(updatedTower));
      setRefreshTick(t => t + 1);
      setSyncSuccessToast('Synced live P1 Dead Cash, P2 OTIF, P3 Freight & P4 Stockout Risk into P5 Monday Control Tower!');
      setTimeout(() => setSyncSuccessToast(null), 4000);
    } catch {}
  };

  // Unified 5-Project Monday Morning WhatsApp Executive Brief
  const unifiedWhatsAppBrief = `*MONDAY 9 AM CONTROL TOWER — 5-ENGINE BRIEF (${p5TowerData.weekEndingDate})*
• *P1 Dead Cash*: ${formatCurrency(p1Summary.deadCash, 'INR')} (${p1Summary.deadItemCount} SKUs >${p1Rules.deadThresholdDays}d idle)
• *P2 Gate OTIF*: ${p2Metrics.otifPercent}% (${p2Metrics.passes}/${p2Metrics.totalDispatches} pass, ${p2Metrics.failsLateOnly + p2Metrics.failsLateAndShort} late)
• *P3 Freight Leak*: ${formatCurrency(p3Audit.totals.totalLeak, 'INR')} leak across ${p3Audit.totals.totalTrips} trips (${p3Audit.totals.totalWaitHours}h gate wait)
• *P4 Bin & Slotting*: ${formatCurrency(p4Summary.shelfShortRupees, 'INR')} shelf short, ${p4Summary.fastMoversHidden} fast movers hidden in back
• *P5 Overdue Bills*: ${formatCurrency(overdueReceivables, 'INR')} past ${p5TowerData.normalCreditDays}d credit
Reply with *P1, P2, P3, P4, or P5* to open that drill-down today.`;

  const handleCopyBrief = () => {
    navigator.clipboard.writeText(unifiedWhatsAppBrief);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  return (
    <div className="min-h-screen bg-industrial-grid text-slate-100 flex flex-col font-sans">
      {/* Unified Merged Suite Sub-Navigation Bar */}
      <div className="bg-slate-900/95 border-b border-slate-800 sticky top-10 z-30 backdrop-blur-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 via-emerald-500/20 to-amber-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight">
                  Industrial Operations Command Suite (P1 + P2 + P3 + P4 + P5)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  5-Engine Live Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Dead Stock (P1) • Gate OTIF (P2) • Freight Audit (P3) • Bin &amp; Slotting (P4) • Monday Control Tower (P5)
              </p>
            </div>
          </div>

          {/* Sub-Module Switcher inside Merged Version */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
            <button
              onClick={() => setActiveModule('synthesis')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeModule === 'synthesis'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>5-Engine Synthesis</span>
            </button>
            <button
              onClick={() => setActiveModule('p1_engine')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                activeModule === 'p1_engine'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>P1: Stock</span>
            </button>
            <button
              onClick={() => setActiveModule('p2_engine')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                activeModule === 'p2_engine'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>P2: OTIF ({p2Metrics.otifPercent}%)</span>
            </button>
            <button
              onClick={() => setActiveModule('p3_engine')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                activeModule === 'p3_engine'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>P3: Freight</span>
            </button>
            <button
              onClick={() => setActiveModule('p4_engine')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                activeModule === 'p4_engine'
                  ? 'bg-fuchsia-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ScanBarcode className="w-3.5 h-3.5" />
              <span>P4: Bin Audit</span>
            </button>
            <button
              onClick={() => setActiveModule('p5_engine')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                activeModule === 'p5_engine'
                  ? 'bg-rose-500 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>P5: Monday Tower</span>
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

      {activeModule === 'p4_engine' && (
        <div className="flex-1">
          <Project4App />
        </div>
      )}

      {activeModule === 'p5_engine' && (
        <div className="flex-1">
          <Project5App />
        </div>
      )}

      {activeModule === 'synthesis' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {syncSuccessToast && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{syncSuccessToast}</span>
              </div>
              <button
                onClick={() => setActiveModule('p5_engine')}
                className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold cursor-pointer"
              >
                Open P5 Monday Tower →
              </button>
            </div>
          )}

          {/* Executive Hero Banner */}
          <div className="industrial-card rounded-2xl p-6 border border-white/10 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2.5 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Complete 5-Project Industrial Operating System (P1 + P2 + P3 + P4 + P5)
                  </span>
                  <button
                    onClick={handleSyncAllEnginesToMondayTower}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 cursor-pointer flex items-center gap-1 transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync P1–P4 Live Data → P5 Monday Tower</span>
                  </button>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  From Store Racks to Factory Gate to Monday 9 AM Executive Control
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  • <strong className="text-amber-300">P1 (Dead Stock)</strong> &amp; <strong className="text-fuchsia-300">P4 (Bin &amp; Slotting Audit)</strong> secure the storehouse: unlocking <strong className="text-white font-mono">{formatCurrency(p1Summary.deadCash, 'INR')}</strong> in dead stock, stopping <strong className="text-rose-400 font-mono">{formatCurrency(p4Summary.shelfShortRupees, 'INR')}</strong> in shelf shrinkage, and moving <strong className="text-white font-mono">{p4Summary.fastMoversHidden} hidden fast movers</strong> to the counter.<br />
                  • <strong className="text-emerald-300">P2 (Dispatch OTIF)</strong> &amp; <strong className="text-cyan-300">P3 (Freight Leak Audit)</strong> secure the gate &amp; highway: eliminating raw stockout delays (<strong className="text-amber-300 font-mono">{p2Metrics.otifPercent}% → {projectedOtifAfterMaterialFix}% OTIF</strong>) and cutting <strong className="text-rose-400 font-mono">{formatCurrency(p3Audit.totals.totalLeak, 'INR')}</strong> in lorry rate gouging &amp; gate wait detention.<br />
                  • <strong className="text-rose-300">P5 (Monday Control Tower)</strong> distills all 5 engines + <strong className="text-white font-mono">{formatCurrency(overdueReceivables, 'INR')}</strong> overdue Tally bills into the 6-number Monday 9 AM WhatsApp executive ritual.
                </p>
              </div>

              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shrink-0 font-mono space-y-1.5 text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Total 5-Engine Annual Value at Risk
                </span>
                <div className="text-2xl sm:text-3xl font-black text-rose-400">
                  {formatIndianLakhsCrores(totalEnterpriseValueAtRisk)}
                </div>
                <div className="text-[11px] text-slate-400">
                  Dead Stock + Shrinkage + SLA Debits + Freight Leak + Overdue Bills
                </div>
              </div>
            </div>
          </div>

          {/* 5-Pillar Executive KPI Cards (P1 through P5) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* P1 Card */}
            <div className="industrial-card rounded-2xl p-4 border border-amber-500/30 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
                    P1 • DEAD STOCK
                  </span>
                  <Package className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-black font-mono text-white">
                  {formatCurrency(p1Summary.deadCash, 'INR')}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  {p1Summary.deadItemCount} Dead SKUs ({p1Summary.deadCashPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-emerald-400">7d Unlock: {formatIndianLakhsCrores(cashUnlockedAt25PctHaircut)}</span>
                <button
                  onClick={() => setActiveModule('p1_engine')}
                  className="text-amber-300 hover:underline cursor-pointer font-bold"
                >
                  Open →
                </button>
              </div>
            </div>

            {/* P2 Card */}
            <div className="industrial-card rounded-2xl p-4 border border-emerald-500/30 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                    P2 • GATE OTIF
                  </span>
                  <Truck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-black font-mono text-white flex items-baseline gap-1.5">
                  <span>{p2Metrics.otifPercent}%</span>
                  <span className="text-xs text-emerald-400 font-bold">→ {projectedOtifAfterMaterialFix}%</span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  {p2Metrics.passes}/{p2Metrics.totalDispatches} Pass • {p2Metrics.fails} Fail
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-rose-400">Bleed: {formatIndianLakhsCrores(monthlyOemPenaltyBleed)}/mo</span>
                <button
                  onClick={() => setActiveModule('p2_engine')}
                  className="text-emerald-300 hover:underline cursor-pointer font-bold"
                >
                  Open →
                </button>
              </div>
            </div>

            {/* P3 Card */}
            <div className="industrial-card rounded-2xl p-4 border border-cyan-500/30 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300">
                    P3 • FREIGHT LEAK
                  </span>
                  <Scale className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-xl font-black font-mono text-rose-400">
                  {formatCurrency(p3Audit.totals.totalLeak, 'INR')}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Rate: {formatCurrency(p3Audit.totals.rateLeak, 'INR')} • Wait: {p3Audit.totals.totalWaitHours}h
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-cyan-300">{p3Audit.totals.totalTrips} Lorry Bills</span>
                <button
                  onClick={() => setActiveModule('p3_engine')}
                  className="text-cyan-300 hover:underline cursor-pointer font-bold"
                >
                  Open →
                </button>
              </div>
            </div>

            {/* P4 Card */}
            <div className="industrial-card rounded-2xl p-4 border border-fuchsia-500/30 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-fuchsia-500/20 text-fuchsia-300">
                    P4 • BIN &amp; SLOTTING
                  </span>
                  <ScanBarcode className="w-4 h-4 text-fuchsia-400" />
                </div>
                <div className="text-xl font-black font-mono text-rose-400">
                  {formatCurrency(p4Summary.shelfShortRupees, 'INR')}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Shelf Short • +{formatCurrency(p4Summary.foundStockRupees, 'INR')} Found
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-amber-300">{p4Summary.fastMoversHidden} Hidden Fast SKUs</span>
                <button
                  onClick={() => setActiveModule('p4_engine')}
                  className="text-fuchsia-300 hover:underline cursor-pointer font-bold"
                >
                  Open →
                </button>
              </div>
            </div>

            {/* P5 Card */}
            <div className="industrial-card rounded-2xl p-4 border border-rose-500/30 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300">
                    P5 • MONDAY TOWER
                  </span>
                  <Radio className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-xl font-black font-mono text-white">
                  {formatCurrency(overdueReceivables, 'INR')}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Overdue &gt;{p5TowerData.normalCreditDays}d • {criticalShortageCount} Stockout Risks
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-rose-300">6-Number Habit</span>
                <button
                  onClick={() => setActiveModule('p5_engine')}
                  className="text-rose-300 hover:underline cursor-pointer font-bold"
                >
                  Open →
                </button>
              </div>
            </div>
          </div>

          {/* Unified Monday 9 AM Executive WhatsApp Brief + P4/P5 Action Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 5 Cols: Live 5-Engine WhatsApp Executive Note */}
            <div className="lg:col-span-5 industrial-card rounded-2xl p-5 border border-emerald-500/30 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h2 className="text-sm font-bold text-white">
                        Unified P1–P5 Monday 9 AM WhatsApp Brief
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Auto-synthesized from all 5 live engines
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCopyBrief}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
                  >
                    {copiedWhatsApp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWhatsApp ? 'Copied!' : 'Copy Brief'}</span>
                  </button>
                </div>

                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {unifiedWhatsAppBrief}
                </pre>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono">
                <button
                  onClick={handleSyncAllEnginesToMondayTower}
                  className="text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Push Live P1–P4 Numbers to P5</span>
                </button>
                <button
                  onClick={onSwitchToStandaloneP5}
                  className="text-rose-300 hover:underline cursor-pointer"
                >
                  Launch Standalone P5 ↗
                </button>
              </div>
            </div>

            {/* Right 7 Cols: 5-Project Quick Launch & Cross-Engine Diagnostics */}
            <div className="lg:col-span-7 industrial-card rounded-2xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    5-Engine Turnaround Execution Roadmap (Click Any Engine to Drill Down)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Switch into any engine inside the Merged Suite or launch its standalone workspace
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Row P1 */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">P1</span>
                      <span className="font-bold text-white">Dead Stock &amp; Idle Cash Engine</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Top Dead SKU: <strong className="text-slate-200">{p1Summary.topDeadItems[0]?.itemName}</strong> ({formatCurrency(p1Summary.topDeadItems[0]?.closingValue || 0, 'INR')}) • Annual Holding Burn: {formatCurrency(p1Summary.annualHoldingBurn, 'INR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveModule('p1_engine')}
                      className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold cursor-pointer"
                    >
                      Open in Suite
                    </button>
                    <button
                      onClick={onSwitchToStandaloneP1}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px] cursor-pointer"
                    >
                      Standalone P1 ↗
                    </button>
                  </div>
                </div>

                {/* Row P2 */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">P2</span>
                      <span className="font-bold text-white">Dispatch OTIF &amp; Factory Gate SLA Engine</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Weakest Account: <strong className="text-slate-200">{p2Metrics.weakestCustomer?.customer} ({p2Metrics.weakestCustomer?.otifPercent}%)</strong> • Top Cause: <strong className="text-rose-400">{p2Metrics.topFailureReason?.reason}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveModule('p2_engine')}
                      className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold cursor-pointer"
                    >
                      Open in Suite
                    </button>
                    <button
                      onClick={onSwitchToStandaloneP2}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px] cursor-pointer"
                    >
                      Standalone P2 ↗
                    </button>
                  </div>
                </div>

                {/* Row P3 */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">P3</span>
                      <span className="font-bold text-white">Freight Leak &amp; Transporter Detention Audit</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Worst Lane: <strong className="text-slate-200">{p3Audit.laneSummaries[0]?.lane}</strong> • Primary Leak Carrier: <strong className="text-rose-400">{p3Audit.transporterSummaries[0]?.transporter} ({formatCurrency(p3Audit.transporterSummaries[0]?.totalWaste || 0, 'INR')})</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveModule('p3_engine')}
                      className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-semibold cursor-pointer"
                    >
                      Open in Suite
                    </button>
                    <button
                      onClick={onSwitchToStandaloneP3}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px] cursor-pointer"
                    >
                      Standalone P3 ↗
                    </button>
                  </div>
                </div>

                {/* Row P4 */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 font-mono text-[10px] font-bold">P4</span>
                      <span className="font-bold text-white">BinAudit EV — Spares Cycle Count &amp; Slotting Audit</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {p4Summary.skusCounted} SKUs Counted • <strong className="text-rose-400">{formatCurrency(p4Summary.shelfShortRupees, 'INR')} Short</strong> • <strong className="text-emerald-400">{formatCurrency(p4Summary.foundStockRupees, 'INR')} Found</strong> • {p4Summary.fastMoversHidden} Hidden Fast Movers
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveModule('p4_engine')}
                      className="px-2.5 py-1 rounded bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/30 font-semibold cursor-pointer"
                    >
                      Open in Suite
                    </button>
                    <button
                      onClick={onSwitchToStandaloneP4}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px] cursor-pointer"
                    >
                      Standalone P4 ↗
                    </button>
                  </div>
                </div>

                {/* Row P5 */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">P5</span>
                      <span className="font-bold text-white">Monday Control Tower — 6-Number Executive Habit</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Client: <strong className="text-slate-200">{p5TowerData.clientName}</strong> • Week Ending: {p5TowerData.weekEndingDate} • Multilingual (EN / தமிழ் / हिंदी / DE / ES)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveModule('p5_engine')}
                      className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-semibold cursor-pointer"
                    >
                      Open in Suite
                    </button>
                    <button
                      onClick={onSwitchToStandaloneP5}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px] cursor-pointer"
                    >
                      Standalone P5 ↗
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
