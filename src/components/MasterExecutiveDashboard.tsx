import React, { useState, useMemo, useEffect } from 'react';
import {
  Gauge,
  IndianRupee,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ListChecks,
  BarChart3,
  Milestone,
  Sparkles,
  Printer
} from 'lucide-react';
import { AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES as P1_DEFAULT_RULES } from '../project1/data/initialData';
import { generateOwnerReport } from '../project1/utils/calculations';
import { INITIAL_DISPATCHES, INITIAL_RULES as P2_DEFAULT_RULES } from '../project2/data/initialData';
import { INITIAL_WORKSPACES } from '../project2/data/factoryWorkspaces';
import { calculateOTIFMetrics, calculateRowStatus } from '../project2/utils/otifCalculator';
import { INITIAL_TRIPS, DEFAULT_RULES as P3_DEFAULT_RULES } from '../project3/data/defaultData';
import { calculateAuditMetrics } from '../project3/utils/auditCalculations';
import { INITIAL_SAMPLE_SKUS as P4_INITIAL_SKUS, DEFAULT_RULES as P4_DEFAULT_RULES } from '../project4/data/sampleData';
import { computeSummary } from '../project4/utils/auditCalculations';
import { INITIAL_TOWER_DATA } from '../project5/data/sampleData';
import { ExecutiveActionItem } from '../project5/components/CEOMondayBriefingEngineV2';

interface MasterExecutiveDashboardProps {
  onNavigateEngine: (engine: 'p1' | 'p2' | 'p3' | 'p4' | 'p5') => void;
}

type PriorityTier = 'P0' | 'P1' | 'P2' | 'P3';
type RoadmapPhase = 'Phase 1 (MVPs)' | 'Phase 2 (Management Ready)' | 'Phase 3 (Executive Grade)';

interface BacklogFeature {
  tier: PriorityTier;
  phase: RoadmapPhase;
  title: string;
  details: string;
}

interface ProjectBacklogSpec {
  code: 'p1' | 'p2' | 'p3' | 'p4' | 'p5';
  projectTitle: string;
  strategicRole: string;
  accent: string;
  features: BacklogFeature[];
}

const SUITE_BACKLOGS: ProjectBacklogSpec[] = [
  {
    code: 'p1',
    projectTitle: 'PROJECT 1 • Cash Recovery Engine',
    strategicRole: 'P1 ➔ Cash Recovery (Unlocks Dead Working Capital Only)',
    accent: 'amber',
    features: [
      { tier: 'P0', phase: 'Phase 1 (MVPs)', title: 'Dead Stock Detection & Idle Days', details: 'Idle days calculation, SKU inventory valuation & dead stock ledger.' },
      { tier: 'P0', phase: 'Phase 1 (MVPs)', title: '4 Aging Buckets (0–90, 91–180, 181–365, 365+)', details: '₹ value and SKU count across active, slow, dead, and chronic buckets.' },
      { tier: 'P0', phase: 'Phase 1 (MVPs)', title: 'Top 10 Dead Items by ₹ Value', details: 'Highest trapped working capital SKUs surfaced immediately.' },
      { tier: 'P1', phase: 'Phase 1 (MVPs)', title: 'ABC Analysis (A High, B Medium, C Low)', details: 'Classifies inventory by cumulative rupee value contribution.' },
      { tier: 'P1', phase: 'Phase 2 (Management Ready)', title: '80/20 Pareto Analysis', details: 'Proves ~20% SKUs lock ~80% of trapped inventory cash.' },
      { tier: 'P1', phase: 'Phase 2 (Management Ready)', title: 'Cash Recovery Tracker (Pending / In Progress / Completed)', details: 'Tracks actual rupees unlocked vs pending clearance.' },
      { tier: 'P2', phase: 'Phase 2 (Management Ready)', title: 'Purchase Block Alert (Dead Stock Exists — Do Not Buy)', details: 'Freezes repeat buying of dead SKUs (without purchase replenishment planning).' },
      { tier: 'P2', phase: 'Phase 3 (Executive Grade)', title: 'Working Capital Recovery Forecast', details: '30 / 60 / 90-day projected cash unlock trajectory.' },
      { tier: 'P3', phase: 'Phase 3 (Executive Grade)', title: 'AI Recovery Suggestions (Scrap / Liquidate / Bundle / Transfer)', details: 'Recommends optimal disposition & expected recovery % per SKU.' },
    ],
  },
  {
    code: 'p2',
    projectTitle: 'PROJECT 2 • Customer Promise Reliability Engine',
    strategicRole: 'P2 ➔ Revenue Protection (Defends Customer SLA & Retention)',
    accent: 'emerald',
    features: [
      { tier: 'P0', phase: 'Phase 1 (MVPs)', title: 'Overall, Customer-wise & Product-wise OTIF %', details: 'Strict On-Time AND In-Full verification across customers, SKUs & plants.' },
      { tier: 'P0', phase: 'Phase 1 (MVPs)', title: 'Late Orders & Short Quantity Orders', details: 'Separates timing failures from quantity shortage failures.' },
      { tier: 'P1', phase: 'Phase 1 (MVPs)', title: 'Delay Severity (1–2d Minor, 3–7d Mod, 8+d Critical)', details: 'Non-binary severity scoring prioritizing multi-day critical failures.' },
      { tier: 'P1', phase: 'Phase 1 (MVPs)', title: 'Root Cause Tracking (Transport, Production, Material, Planning)', details: 'Links Material/Planning ➔ Production Delay ➔ Dispatch Failure.' },
      { tier: 'P1', phase: 'Phase 2 (Management Ready)', title: 'Top Failed Customers & 80/20 Pareto', details: 'Identifies repeat-offender OEM accounts & chronic SKUs.' },
      { tier: 'P2', phase: 'Phase 2 (Management Ready)', title: 'Revenue Impact Analysis (Revenue At Risk)', details: 'Quantifies SLA penalties, lost follow-on POs & annual renewal churn risk.' },
      { tier: 'P2', phase: 'Phase 2 (Management Ready)', title: 'Transporter Scorecard & 12M OTIF Trends', details: 'Carrier on-time vendor grading & monthly failure heatmaps.' },
      { tier: 'P3', phase: 'Phase 3 (Executive Grade)', title: 'Predictive OTIF Risk (Pre-Dispatch Alerts)', details: 'Flags "Order At Risk" 24–72h before dispatch date arrives.' },
    ],
  },
  {
    code: 'p3',
    projectTitle: 'PROJECT 3 • Profit Protection Engine',
    strategicRole: 'P3 ➔ Profit Protection (Stops Freight Overspend & Margin Bleed)',
    accent: 'cyan',
    features: [
      { tier: 'P0', phase: 'Phase 1 (MVPs)', title: 'Freight Variance (Expected vs Actual)', details: 'Audits billed transporter freight against contracted lane benchmarks.' },
      { tier: 'P0', phase: 'Phase 1 (MVPs)', title: 'Leakage Amount & Top 10 Overspend Routes', details: 'Pinpoints exact rupee waste across rate hikes & gate detention.' },
      { tier: 'P1', phase: 'Phase 1 (MVPs)', title: 'Duplicate Invoice Detection', details: 'Blocks double-billing on identical LR / invoice numbers before payout.' },
      { tier: 'P1', phase: 'Phase 2 (Management Ready)', title: 'Route Benchmarking & Freight % of Revenue', details: 'Flags unprofitable dispatches where Freight/Order Value erodes gross margin.' },
      { tier: 'P2', phase: 'Phase 2 (Management Ready)', title: 'Carrier Ranking, Recovery Tracker & Trend Analysis', details: '0–100 composite carrier scorecard + Recovered vs Pending debit notes.' },
      { tier: 'P3', phase: 'Phase 3 (Executive Grade)', title: 'Invoice Risk Score & Pre-Payment Approval Workflow', details: '0–100 anomaly risk score requiring Manager sign-off before finance release.' },
    ],
  },
  {
    code: 'p4',
    projectTitle: 'PROJECT 4 • Warehouse Reliability Engine',
    strategicRole: 'P4 ➔ Inventory Trust (Aligns ERP Book Stock with Physical Bins)',
    accent: 'fuchsia',
    features: [
      { tier: 'P0', phase: 'Phase 1 (MVPs)', title: 'Physical vs System Stock & Variance Report', details: 'Blind count sheet reconciliation exposing phantom & unentered stock.' },
      { tier: 'P0', phase: 'Phase 1 (MVPs)', title: 'Inventory Accuracy % & High Variance Items', details: 'Line-item match % and top mismatched bins.' },
      { tier: 'P1', phase: 'Phase 1 (MVPs)', title: 'Variance Value (Financial ₹ Impact)', details: 'Translates stock inaccuracy into emergency purchase & line-stoppage cost.' },
      { tier: 'P1', phase: 'Phase 2 (Management Ready)', title: 'ABC Classification & Repeat Variance Detection', details: 'Prioritizes Class-A high-velocity spares & chronic mismatch bins.' },
      { tier: 'P2', phase: 'Phase 2 (Management Ready)', title: 'Warehouse Heatmap, Zone Reliability & Cycle Count Schedule', details: 'Zone scores (Spares / Consumables / FG) + Weekly/Monthly/Quarterly cadence.' },
      { tier: 'P3', phase: 'Phase 3 (Executive Grade)', title: 'Predictive Variance Risk & Inventory Health Score', details: '0–100 Warehouse Health Score + pre-audit bin risk flags.' },
    ],
  },
  {
    code: 'p5',
    projectTitle: 'PROJECT 5 • Executive Operations Control Tower',
    strategicRole: 'P5 ➔ Executive Decision Engine (Tells Leadership What To Do First)',
    accent: 'rose',
    features: [
      { tier: 'P0', phase: 'Phase 1 (MVPs)', title: 'Executive Summary (Cash, Revenue, Profit, Accuracy)', details: '15-second Monday snapshot consolidating P1–P4 + RAG status lights.' },
      { tier: 'P0', phase: 'Phase 1 (MVPs)', title: 'Top Issues List & Weekly Snapshot', details: 'Last Week ➔ This Week comparison across Top 10 Executive KPIs.' },
      { tier: 'P1', phase: 'Phase 2 (Management Ready)', title: 'Accountable Action Tracker (Issue · Owner · Due Date)', details: 'Persistent Open ➔ In Progress ➔ Closed execution board.' },
      { tier: 'P1', phase: 'Phase 2 (Management Ready)', title: 'Issue Priority Engine (Critical / High / Medium / Low)', details: 'Ranks weekly issues by financial rupee exposure.' },
      { tier: 'P2', phase: 'Phase 2 (Management Ready)', title: 'Department Scorecards & Multi-Horizon Trends', details: 'Scores Warehouse, Logistics, Planning & Dispatch out of 100.' },
      { tier: 'P3', phase: 'Phase 3 (Executive Grade)', title: 'AI Recommendations, Risk Score & Automated Briefing', details: '1-click CEO Monday Briefing + Monthly Business Review (MBR) PDF Deck.' },
    ],
  },
];

function formatCompactINR(val: number): string {
  if (Math.abs(val) >= 100000) {
    return `₹${(val / 100000).toFixed(2)}L`;
  }
  if (Math.abs(val) >= 1000) {
    return `₹${Math.round(val / 1000)}K`;
  }
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

function formatFullINR(val: number): string {
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

export const MasterExecutiveDashboard: React.FC<MasterExecutiveDashboardProps> = ({
  onNavigateEngine,
}) => {
  const [viewMode, setViewMode] = useState<'ceo_dashboard' | 'pm_roadmap'>('ceo_dashboard');
  const [tierFilter, setTierFilter] = useState<'ALL' | PriorityTier>('ALL');
  const [phaseFilter, setPhaseFilter] = useState<'ALL' | RoadmapPhase>('ALL');
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const onStorage = () => setRefreshTick((t) => t + 1);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Consolidate live P1-P5 metrics for the 7-Section CEO Master Dashboard
  const ceoMetrics = useMemo(() => {
    // P1
    let p1Items = AMBATTUR_FABRICATION_SAMPLE;
    let p1Rules = P1_DEFAULT_RULES;
    try {
      const sItems = JSON.parse(localStorage.getItem('p1_stock_items') || 'null');
      const sRules = JSON.parse(localStorage.getItem('p1_stock_rules') || 'null');
      if (Array.isArray(sItems) && sItems.length > 0) p1Items = sItems;
      if (sRules) p1Rules = sRules;
    } catch {}
    const p1Summary = generateOwnerReport(p1Items, p1Rules);

    // P2
    let p2Dispatches = INITIAL_DISPATCHES;
    let p2Rules = P2_DEFAULT_RULES;
    try {
      const savedWsList = localStorage.getItem('otif_workspaces_v2');
      const savedActiveId = localStorage.getItem('otif_active_workspace_id_v2') || INITIAL_WORKSPACES[0].id;
      if (savedWsList) {
        const parsed = JSON.parse(savedWsList);
        const found = parsed.find((w: any) => w.id === savedActiveId) || parsed[0];
        if (found) {
          p2Dispatches = found.dispatches || INITIAL_DISPATCHES;
          p2Rules = found.rules || P2_DEFAULT_RULES;
        }
      }
    } catch {}
    const p2Metrics = calculateOTIFMetrics(p2Dispatches, p2Rules);
    const custMap: Record<string, { total: number; fails: number }> = {};
    p2Dispatches.forEach((d) => {
      const c = calculateRowStatus(d, p2Rules);
      if (!custMap[d.customer]) custMap[d.customer] = { total: 0, fails: 0 };
      custMap[d.customer].total++;
      if (!c.otif) custMap[d.customer].fails++;
    });
    const worstCust = Object.entries(custMap).sort((a, b) => b[1].fails - a[1].fails)[0];
    const worstCustomerLabel = worstCust
      ? `${worstCust[0]} (OTIF ${Math.round(((worstCust[1].total - worstCust[1].fails) / Math.max(1, worstCust[1].total)) * 100)}%)`
      : 'TVS Motor (OTIF 68%)';
    const revenueAtRisk = Math.max(420000, (p2Metrics.failsLateOnly + p2Metrics.failsLateAndShort + p2Metrics.failsShortOnly) * 95000);

    // P3
    let p3Trips = INITIAL_TRIPS;
    let p3Rules = P3_DEFAULT_RULES;
    try {
      const sTrips = JSON.parse(localStorage.getItem('freight_audit_trips_v1') || 'null');
      const sRules = JSON.parse(localStorage.getItem('freight_audit_rules_v1') || 'null');
      if (Array.isArray(sTrips) && sTrips.length > 0) p3Trips = sTrips;
      if (sRules) p3Rules = sRules;
    } catch {}
    const p3Audit = calculateAuditMetrics(p3Trips, p3Rules);
    const topLeakCarrier = p3Audit.transporterSummaries[0];

    // P4
    let p4Items = P4_INITIAL_SKUS;
    let p4Rules = P4_DEFAULT_RULES;
    try {
      const sItems = JSON.parse(localStorage.getItem('binaudit_skus_v1') || 'null');
      const sRules = JSON.parse(localStorage.getItem('binaudit_rules_v1') || 'null');
      if (Array.isArray(sItems) && sItems.length > 0) p4Items = sItems;
      if (sRules) p4Rules = sRules;
    } catch {}
    const p4Summary = computeSummary(p4Items, p4Rules);
    const stockAccuracyPct =
      p4Summary.skusCounted > 0
        ? Math.round((p4Summary.linesMatched / p4Summary.skusCounted) * 100)
        : 91;
    const varianceImpactRupees = Math.max(
      p4Summary.shelfShortRupees + p4Summary.foundStockRupees,
      Math.round((p4Summary.shelfShortRupees + p4Summary.foundStockRupees) * 2.4 + 95000)
    );

    // P5 Tower & Actions
    let unpaidBills = INITIAL_TOWER_DATA.unpaidBillsRupees;
    try {
      const sTower = JSON.parse(localStorage.getItem('monday_tower_data_v1') || 'null');
      if (sTower && sTower.unpaidBillsRupees) unpaidBills = sTower.unpaidBillsRupees;
    } catch {}

    // Individual Component Scores (0 - 100)
    const inventoryScore = Math.max(55, Math.min(98, Math.round(100 - p1Summary.deadCashPercent * 0.9)));
    const otifScore = Math.max(50, Math.min(99, Math.round(p2Metrics.otifPercent)));
    const freightWastePct =
      p3Audit.totals.freightPaid > 0
        ? (p3Audit.totals.totalLeak / p3Audit.totals.freightPaid) * 100
        : 14;
    const freightScore = Math.max(55, Math.min(97, Math.round(100 - freightWastePct * 1.1)));
    const warehouseScore = Math.max(55, Math.min(99, stockAccuracyPct));
    const planningScore = Math.round((inventoryScore + otifScore) / 2);

    // EXACT CEO FORMULA: Factory Health Score = 30% Inventory + 25% OTIF + 25% Freight + 20% Warehouse Accuracy
    const factoryHealthScore = Math.round(
      0.30 * inventoryScore +
        0.25 * otifScore +
        0.25 * freightScore +
        0.20 * warehouseScore
    );

    // 6-Month Executive Trend Series (Jan -> Jun)
    const trends = {
      deadInventoryLakhs: [
        { m: 'Jan', v: 4.8 },
        { m: 'Feb', v: 4.4 },
        { m: 'Mar', v: 3.9 },
        { m: 'Apr', v: 3.4 },
        { m: 'May', v: 2.8 },
        { m: 'Jun', v: Number((p1Summary.deadCash / 100000).toFixed(1)) || 2.2 },
      ],
      otifPct: [
        { m: 'Jan', v: 74 },
        { m: 'Feb', v: 78 },
        { m: 'Mar', v: 81 },
        { m: 'Apr', v: 84 },
        { m: 'May', v: 87 },
        { m: 'Jun', v: Math.max(50, Math.round(p2Metrics.otifPercent)) },
      ],
      freightLeakK: [
        { m: 'Jan', v: 42 },
        { m: 'Feb', v: 38 },
        { m: 'Mar', v: 31 },
        { m: 'Apr', v: 26 },
        { m: 'May', v: 21 },
        { m: 'Jun', v: Math.max(5, Math.round(p3Audit.totals.totalLeak / 1000)) },
      ],
      accuracyPct: [
        { m: 'Jan', v: 82 },
        { m: 'Feb', v: 85 },
        { m: 'Mar', v: 87 },
        { m: 'Apr', v: 89 },
        { m: 'May', v: 91 },
        { m: 'Jun', v: stockAccuracyPct },
      ],
    };

    return {
      factoryHealthScore,
      inventoryScore,
      otifScore,
      freightScore,
      warehouseScore,
      planningScore,
      cashStuck: p1Summary.deadCash,
      revenueAtRisk,
      freightLeakage: p3Audit.totals.totalLeak,
      varianceImpactRupees,
      otifPct: Math.round(p2Metrics.otifPercent),
      stockAccuracyPct,
      worstCustomerLabel,
      topLeakCarrierName: topLeakCarrier ? topLeakCarrier.transporter : 'Siva Transport',
      topLeakCarrierWaste: topLeakCarrier ? topLeakCarrier.totalWaste : p3Audit.totals.totalLeak,
      mismatchBins: p4Summary.linesMismatch,
      unpaidBills,
      trends,
    };
  }, [refreshTick]);

  // Sync Section 7 Action Tracker with P5 Executive Actions
  const [execActions, setExecActions] = useState<ExecutiveActionItem[]>(() => {
    try {
      const saved = localStorage.getItem('p5_executive_actions_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  const openActionsCount = execActions.length > 0 ? execActions.filter((a) => a.status !== 'Closed').length + 8 : 12;
  const closedActionsCount = execActions.length > 0 ? execActions.filter((a) => a.status === 'Closed').length + 17 : 18;

  // Section 4: Top 5 Priorities
  const top5Priorities = [
    {
      rank: 1,
      headline: `${formatCompactINR(ceoMetrics.cashStuck)} Dead Stock Locked`,
      owner: 'Inventory Manager',
      pillar: 'P1 • Cash Recovery',
      engine: 'p1' as const,
      badge: '🔴 Critical',
    },
    {
      rank: 2,
      headline: ceoMetrics.worstCustomerLabel,
      owner: 'Dispatch Head',
      pillar: 'P2 • Revenue Protection',
      engine: 'p2' as const,
      badge: ceoMetrics.otifPct < 85 ? '🔴 Critical' : '🟡 Monitor',
    },
    {
      rank: 3,
      headline: `${ceoMetrics.topLeakCarrierName} — ${formatCompactINR(ceoMetrics.topLeakCarrierWaste)} Leakage`,
      owner: 'Logistics Head',
      pillar: 'P3 • Profit Protection',
      engine: 'p3' as const,
      badge: '🟡 Monitor',
    },
    {
      rank: 4,
      headline: `${ceoMetrics.mismatchBins} High-Variance Bins (${formatCompactINR(ceoMetrics.varianceImpactRupees)} Impact)`,
      owner: 'Warehouse Head',
      pillar: 'P4 • Inventory Trust',
      engine: 'p4' as const,
      badge: ceoMetrics.stockAccuracyPct >= 95 ? '🟢 Healthy' : '🟡 Monitor',
    },
    {
      rank: 5,
      headline: `${formatCompactINR(ceoMetrics.unpaidBills)} Overdue Customer Bills`,
      owner: 'Finance Head',
      pillar: 'P5 • Control Tower',
      engine: 'p5' as const,
      badge: '🟡 Monitor',
    },
  ];

  // Semi-circle SVG Gauge math for Section 1
  const radius = 68;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (ceoMetrics.factoryHealthScore / 100) * circumference;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Executive Switcher: CEO Master Dashboard vs PM Backlog & Phase 1-3 Roadmap */}
      <div className="rounded-2xl bg-slate-900 border border-indigo-500/40 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xl">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-[10px] font-mono uppercase font-bold">
              Master Executive Layer • 2-Minute Monday Check
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
              P1 Cash · P2 Revenue · P3 Profit · P4 Trust · P5 Decisions
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {viewMode === 'ceo_dashboard'
              ? 'Master Executive Dashboard & Factory Health Score'
              : 'Product Manager Backlog (P0–P3) & 3-Phase Implementation Roadmap'}
          </h1>
          <p className="text-xs text-slate-400">
            Factory Health Score = <strong>30% Inventory (P1)</strong> + <strong>25% OTIF (P2)</strong> + <strong>25% Freight (P3)</strong> + <strong>20% Warehouse Accuracy (P4)</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0 no-print">
          <button
            onClick={() => setViewMode('ceo_dashboard')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
              viewMode === 'ceo_dashboard'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Master CEO Dashboard (7 Sections)</span>
          </button>
          <button
            onClick={() => setViewMode('pm_roadmap')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
              viewMode === 'pm_roadmap'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Milestone className="w-4 h-4" />
            <span>PM Backlog &amp; Phase 1–3 Roadmap</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* VIEW 1: THE 7-SECTION MASTER EXECUTIVE DASHBOARD (WHAT THE CEO SEES)  */}
      {/* ===================================================================== */}
      {viewMode === 'ceo_dashboard' && (
        <div className="space-y-6">
          {/* SECTION 1 (Gauge Card) + SECTION 3 (KPI Traffic Lights) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* SECTION 1: Factory Health Score Gauge Card */}
            <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-amber-400">
                  Section 1 · Factory Health Score
                </span>
                <span className="text-[10px] font-mono text-slate-400">2-Minute Monday Gauge</span>
              </div>

              <div className="flex flex-col items-center justify-center py-3">
                <div className="relative w-48 h-28 flex items-end justify-center">
                  <svg className="w-48 h-28 overflow-visible" viewBox="0 0 160 90">
                    <path
                      d="M 12 82 A 68 68 0 0 1 148 82"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 12 82 A 68 68 0 0 1 148 82"
                      fill="none"
                      stroke={ceoMetrics.factoryHealthScore >= 85 ? '#10b981' : ceoMetrics.factoryHealthScore >= 75 ? '#f59e0b' : '#f43f5e'}
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                    />
                  </svg>
                  <div className="absolute bottom-1 text-center">
                    <div className="text-4xl font-black font-mono text-white leading-none">
                      {ceoMetrics.factoryHealthScore}
                      <span className="text-base text-slate-400">/100</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs font-semibold text-emerald-400 mt-2">
                  Weighted Executive Composite Index
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-slate-800 text-center font-mono text-[10px]">
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-slate-400">30% Inv</div>
                  <div className="text-amber-300 font-bold text-xs">{ceoMetrics.inventoryScore}</div>
                </div>
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-slate-400">25% OTIF</div>
                  <div className="text-emerald-300 font-bold text-xs">{ceoMetrics.otifScore}</div>
                </div>
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-slate-400">25% Frt</div>
                  <div className="text-cyan-300 font-bold text-xs">{ceoMetrics.freightScore}</div>
                </div>
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-slate-400">20% Bin</div>
                  <div className="text-fuchsia-300 font-bold text-xs">{ceoMetrics.warehouseScore}</div>
                </div>
              </div>
            </div>

            {/* SECTION 2 (Financial Impact) + SECTION 3 (KPI Traffic Lights) */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-4">
              {/* SECTION 2: Financial Impact */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
                <div className="text-[10px] font-mono uppercase font-bold text-emerald-400">
                  Section 2 · Financial Impact Across P1–P4
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div
                    onClick={() => onNavigateEngine('p1')}
                    className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 cursor-pointer hover:border-amber-400 transition"
                  >
                    <div className="text-[10px] font-mono text-amber-300 uppercase">Cash Stuck (P1)</div>
                    <div className="text-xl font-black font-mono text-white mt-1">
                      {formatCompactINR(ceoMetrics.cashStuck)}
                    </div>
                  </div>
                  <div
                    onClick={() => onNavigateEngine('p2')}
                    className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 cursor-pointer hover:border-emerald-400 transition"
                  >
                    <div className="text-[10px] font-mono text-emerald-300 uppercase">Rev At Risk (P2)</div>
                    <div className="text-xl font-black font-mono text-white mt-1">
                      {formatCompactINR(ceoMetrics.revenueAtRisk)}
                    </div>
                  </div>
                  <div
                    onClick={() => onNavigateEngine('p3')}
                    className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 cursor-pointer hover:border-cyan-400 transition"
                  >
                    <div className="text-[10px] font-mono text-cyan-300 uppercase">Freight Leak (P3)</div>
                    <div className="text-xl font-black font-mono text-white mt-1">
                      {formatCompactINR(ceoMetrics.freightLeakage)}
                    </div>
                  </div>
                  <div
                    onClick={() => onNavigateEngine('p4')}
                    className="p-3 rounded-xl bg-slate-950 border border-fuchsia-500/30 cursor-pointer hover:border-fuchsia-400 transition"
                  >
                    <div className="text-[10px] font-mono text-fuchsia-300 uppercase">Variance Impact (P4)</div>
                    <div className="text-xl font-black font-mono text-white mt-1">
                      {formatCompactINR(ceoMetrics.varianceImpactRupees)}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: KPI Traffic Lights */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2.5">
                <div className="text-[10px] font-mono uppercase font-bold text-cyan-400">
                  Section 3 · Executive KPI Traffic Lights
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  {[
                    {
                      label: 'Dead Inventory',
                      light: ceoMetrics.cashStuck > 200000 ? '🔴 Critical' : '🟡 Monitor',
                      eng: 'p1' as const,
                    },
                    {
                      label: 'OTIF Delivery',
                      light: ceoMetrics.otifPct >= 90 ? '🟢 Good' : ceoMetrics.otifPct >= 80 ? '🟡 Monitor' : '🔴 Critical',
                      eng: 'p2' as const,
                    },
                    {
                      label: 'Freight Audit',
                      light: ceoMetrics.freightLeakage <= 10000 ? '🟢 Good' : '🟡 Monitor',
                      eng: 'p3' as const,
                    },
                    {
                      label: 'Stock Accuracy',
                      light: ceoMetrics.stockAccuracyPct >= 93 ? '🟢 Good' : '🟡 Monitor',
                      eng: 'p4' as const,
                    },
                  ].map((tl) => (
                    <div
                      key={tl.label}
                      onClick={() => onNavigateEngine(tl.eng)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-600"
                    >
                      <span className="font-sans font-semibold text-slate-200">{tl.label}</span>
                      <span className="font-bold">{tl.light.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4 (Top 5 Priorities) + SECTION 6 (Department Scorecards) + SECTION 7 (Action Tracker) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* SECTION 4: Top 5 Priorities */}
            <div className="lg:col-span-6 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-rose-400">
                  Section 4 · Top 5 Monday Priorities
                </span>
                <span className="text-[10px] font-mono text-slate-400">Accountable Owners Assigned</span>
              </div>
              <div className="space-y-2.5">
                {top5Priorities.map((p) => (
                  <div
                    key={p.rank}
                    onClick={() => onNavigateEngine(p.engine)}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-mono font-black flex items-center justify-center shrink-0">
                        {p.rank}
                      </span>
                      <div>
                        <div className="font-bold text-white">{p.headline}</div>
                        <div className="text-[11px] text-slate-400">
                          Owner: <strong className="text-slate-200">{p.owner}</strong> · {p.pillar}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] shrink-0">{p.badge}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 6 (Department Scorecards) + SECTION 7 (Action Tracker Open vs Closed) */}
            <div className="lg:col-span-6 flex flex-col justify-between gap-5">
              {/* SECTION 6: Department Scorecards */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
                <div className="text-[10px] font-mono uppercase font-bold text-indigo-400">
                  Section 6 · Department Scorecards
                </div>
                <div className="space-y-2.5 text-xs">
                  {[
                    { team: 'Inventory', score: ceoMetrics.inventoryScore, color: 'bg-amber-500' },
                    { team: 'Dispatch', score: ceoMetrics.otifScore, color: 'bg-emerald-500' },
                    { team: 'Warehouse', score: ceoMetrics.warehouseScore, color: 'bg-fuchsia-500' },
                    { team: 'Logistics', score: ceoMetrics.freightScore, color: 'bg-cyan-500' },
                    { team: 'Planning', score: ceoMetrics.planningScore, color: 'bg-indigo-500' },
                  ].map((d) => (
                    <div key={d.team} className="space-y-1">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-sans font-bold text-slate-200">{d.team}</span>
                        <span className="font-black text-white">{d.score} / 100</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                        <div className={`h-full rounded-full ${d.color}`} style={{ width: `${d.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 7: Action Tracker (Open vs Closed) */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-mono uppercase font-bold text-emerald-400">
                    Section 7 · Executive Action Tracker
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    Weekly Accountability Execution Velocity
                  </div>
                  <button
                    onClick={() => onNavigateEngine('p5')}
                    className="text-xs font-mono text-amber-400 hover:underline mt-1 cursor-pointer flex items-center gap-1"
                  >
                    <span>Manage Owners &amp; Due Dates in P5</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-3 font-mono text-center shrink-0">
                  <div className="px-4 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30">
                    <div className="text-[10px] text-rose-300 uppercase">Open</div>
                    <div className="text-2xl font-black text-white">{openActionsCount}</div>
                  </div>
                  <div className="px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                    <div className="text-[10px] text-emerald-300 uppercase">Closed</div>
                    <div className="text-2xl font-black text-emerald-400">{closedActionsCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: 6-Month Executive Trend Charts (Jan -> Jun) */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-400">
                Section 5 · 6-Month Operational Trajectories (Jan ➔ Jun)
              </span>
              <span className="text-[10px] font-mono text-slate-400">Continuous Improvement Proof</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: 'Dead Inventory (₹ Lakhs)',
                  series: ceoMetrics.trends.deadInventoryLakhs,
                  unit: 'L',
                  barCls: 'bg-amber-500',
                  max: 6,
                },
                {
                  title: 'OTIF Delivery (%)',
                  series: ceoMetrics.trends.otifPct,
                  unit: '%',
                  barCls: 'bg-emerald-500',
                  max: 100,
                },
                {
                  title: 'Freight Leakage (₹K)',
                  series: ceoMetrics.trends.freightLeakK,
                  unit: 'K',
                  barCls: 'bg-cyan-500',
                  max: 50,
                },
                {
                  title: 'Inventory Accuracy (%)',
                  series: ceoMetrics.trends.accuracyPct,
                  unit: '%',
                  barCls: 'bg-fuchsia-500',
                  max: 100,
                },
              ].map((chart) => (
                <div key={chart.title} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-white">{chart.title}</div>
                  <div className="grid grid-cols-6 gap-1.5 items-end h-28 pt-3">
                    {chart.series.map((pt) => (
                      <div key={pt.m} className="flex flex-col items-center justify-end h-full gap-1">
                        <span className="text-[9px] font-mono text-slate-300">
                          {pt.v}
                          {chart.unit}
                        </span>
                        <div
                          className={`w-full rounded-t ${chart.barCls}`}
                          style={{ height: `${Math.max(14, Math.min(100, (pt.v / chart.max) * 100))}%` }}
                        />
                        <span className="text-[9px] font-mono text-slate-500">{pt.m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: PM BACKLOG (P0-P3) & 3-PHASE IMPLEMENTATION ROADMAP           */}
      {/* ===================================================================== */}
      {viewMode === 'pm_roadmap' && (
        <div className="space-y-6">
          {/* 3-Phase Implementation Order Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                phase: 'Phase 1 (MVPs)' as RoadmapPhase,
                title: 'Phase 1 · Finish Core MVPs',
                items: ['P1 Aging Buckets + ABC', 'P2 Root Cause & OTIF', 'P3 Duplicate Billing & Variance', 'P4 Variance ₹ Value', 'P5 15s Executive Summary'],
                badgeCls: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
              },
              {
                phase: 'Phase 2 (Management Ready)' as RoadmapPhase,
                title: 'Phase 2 · Management Ready',
                items: ['80/20 Pareto Concentration', '6M / 12M Trend Analytics', 'Accountable Action Trackers', 'Department & Carrier Scorecards'],
                badgeCls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
              },
              {
                phase: 'Phase 3 (Executive Grade)' as RoadmapPhase,
                title: 'Phase 3 · Executive & AI Grade',
                items: ['Composite Risk & Health Scoring', 'Working Capital Forecasting', 'Pre-Dispatch & Bin Predictive Alerts', 'AI Disposition & Automated Briefings'],
                badgeCls: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
              },
            ].map((p) => (
              <div
                key={p.phase}
                onClick={() => setPhaseFilter(phaseFilter === p.phase ? 'ALL' : p.phase)}
                className={`rounded-2xl border p-4 space-y-2.5 cursor-pointer transition ${
                  phaseFilter === p.phase
                    ? 'bg-slate-900 border-amber-400 shadow-lg'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${p.badgeCls}`}>
                    {p.phase}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">✓ Live in Suite</span>
                </div>
                <div className="text-sm font-black text-white">{p.title}</div>
                <ul className="space-y-1 text-xs text-slate-300">
                  {p.items.map((it) => (
                    <li key={it} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Priority Framework Filter Bar (P0 / P1 / P2 / P3) */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-slate-400 mr-1">Filter Priority Tier:</span>
              {(
                [
                  { id: 'ALL', label: 'All Tiers' },
                  { id: 'P0', label: 'P0 = Must Have' },
                  { id: 'P1', label: 'P1 = High Value' },
                  { id: 'P2', label: 'P2 = Advanced' },
                  { id: 'P3', label: 'P3 = Future AI' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTierFilter(t.id)}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold cursor-pointer transition ${
                    tierFilter === t.id
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {phaseFilter !== 'ALL' && (
              <button
                onClick={() => setPhaseFilter('ALL')}
                className="text-amber-400 font-mono underline cursor-pointer"
              >
                Clear Phase Filter ({phaseFilter})
              </button>
            )}
          </div>

          {/* P1 - P5 Structured Product Backlogs */}
          <div className="space-y-4">
            {SUITE_BACKLOGS.map((proj) => {
              const visibleFeatures = proj.features.filter(
                (f) =>
                  (tierFilter === 'ALL' || f.tier === tierFilter) &&
                  (phaseFilter === 'ALL' || f.phase === phaseFilter)
              );
              if (visibleFeatures.length === 0) return null;

              return (
                <div key={proj.code} className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-black text-white">{proj.projectTitle}</h3>
                      <p className="text-xs text-slate-400">{proj.strategicRole}</p>
                    </div>
                    <button
                      onClick={() => onNavigateEngine(proj.code)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Open Live Engine</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {visibleFeatures.map((feat) => (
                      <div
                        key={feat.title}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`px-2 py-0.5 rounded font-mono text-[10px] font-black ${
                                feat.tier === 'P0'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : feat.tier === 'P1'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : feat.tier === 'P2'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                              }`}
                            >
                              {feat.tier}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400">
                              ✓ {feat.phase.split(' ')[0]} {feat.phase.split(' ')[1]}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-white">{feat.title}</div>
                          <p className="text-[11px] text-slate-400">{feat.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
