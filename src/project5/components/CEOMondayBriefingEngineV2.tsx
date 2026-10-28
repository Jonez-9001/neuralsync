import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Flame,
  UserCheck,
  Calendar,
  FileText,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Printer,
  Plus,
  Layers,
  Award,
  IndianRupee
} from 'lucide-react';
import { MondayTowerData } from '../types';
import { AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES as P1_DEFAULT_RULES } from '../../project1/data/initialData';
import { generateOwnerReport } from '../../project1/utils/calculations';
import { INITIAL_DISPATCHES, INITIAL_RULES as P2_DEFAULT_RULES } from '../../project2/data/initialData';
import { INITIAL_WORKSPACES } from '../../project2/data/factoryWorkspaces';
import { calculateOTIFMetrics, calculateRowStatus } from '../../project2/utils/otifCalculator';
import { INITIAL_TRIPS, DEFAULT_RULES as P3_DEFAULT_RULES } from '../../project3/data/defaultData';
import { calculateAuditMetrics } from '../../project3/utils/auditCalculations';
import { INITIAL_SAMPLE_SKUS as P4_INITIAL_SKUS, DEFAULT_RULES as P4_DEFAULT_RULES } from '../../project4/data/sampleData';
import { computeSummary, calculateItemFields } from '../../project4/utils/auditCalculations';

export interface ExecutiveActionItem {
  id: string;
  rank: number;
  pillar: 'P1 • Cash' | 'P2 • Revenue' | 'P3 • Profit' | 'P4 • Inventory' | 'P5 • Debtors';
  engineKey: 'p1' | 'p2' | 'p3' | 'p4' | 'p5';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  whatIssue: string;
  whyRootCause: string;
  financialImpactRupees: number;
  aiRecommendation: string;
  potentialRecoveryRupees: number;
  owner: string;
  dueDate: string;
  status: 'Open' | 'In Progress' | 'Closed';
}

interface CEOMondayBriefingEngineV2Props {
  towerData: MondayTowerData;
  isDarkMode: boolean;
  onOpenProject: (projectId: number) => void;
  onJumpToEngine?: (engine: 'p1' | 'p2' | 'p3' | 'p4') => void;
}

const ACTION_STORAGE_KEY = 'p5_executive_actions_v2';

function formatINR(val: number): string {
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

function formatCompactLakhs(val: number): string {
  if (Math.abs(val) >= 100000) {
    return `₹${(val / 100000).toFixed(2)}L`;
  }
  return formatINR(val);
}

export const CEOMondayBriefingEngineV2: React.FC<CEOMondayBriefingEngineV2Props> = ({
  towerData,
  isDarkMode,
  onOpenProject,
  onJumpToEngine,
}) => {
  const [activeView, setActiveView] = useState<'priorities' | 'top10_kpis' | 'scorecards' | 'mbr_pack'>('priorities');
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionOwner, setNewActionOwner] = useState('Operations Head');
  const [newActionDue, setNewActionDue] = useState('2026-11-02');

  // Consolidate Live Cross-Engine Intelligence from P1, P2, P3, P4 & P5
  const liveSuite = useMemo(() => {
    // 1. P1: Cash Recovery Engine
    let p1Items = AMBATTUR_FABRICATION_SAMPLE;
    let p1Rules = P1_DEFAULT_RULES;
    try {
      const sItems = JSON.parse(localStorage.getItem('p1_stock_items') || 'null');
      const sRules = JSON.parse(localStorage.getItem('p1_stock_rules') || 'null');
      if (Array.isArray(sItems) && sItems.length > 0) p1Items = sItems;
      if (sRules) p1Rules = sRules;
    } catch {}
    const p1Report = generateOwnerReport(p1Items, p1Rules);
    const deadCash = towerData.deadCashRupees || p1Report.deadCash;
    const cashRecoveryPotential = Math.round(deadCash * 0.62 + p1Report.slowCash * 0.35);

    // 2. P2: Customer Promise Reliability Engine (OTIF)
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
    const otifPercent =
      towerData.dispatchesCount > 0
        ? Math.round((towerData.otifPassesCount / towerData.dispatchesCount) * 100)
        : Math.round(p2Metrics.otifPercent);

    // Identify worst OTIF customer & order revenue at risk
    const custStats: Record<string, { total: number; fails: number }> = {};
    p2Dispatches.forEach((d) => {
      const c = calculateRowStatus(d, p2Rules);
      if (!custStats[d.customer]) custStats[d.customer] = { total: 0, fails: 0 };
      custStats[d.customer].total++;
      if (!c.otif) custStats[d.customer].fails++;
    });
    const worstCustomerEntry = Object.entries(custStats).sort((a, b) => b[1].fails - a[1].fails)[0];
    const worstCustomerName = worstCustomerEntry ? worstCustomerEntry[0] : 'TVS Motor';
    const worstCustomerOtif = worstCustomerEntry
      ? Math.round(((worstCustomerEntry[1].total - worstCustomerEntry[1].fails) / Math.max(1, worstCustomerEntry[1].total)) * 100)
      : 67;
    const atRiskCustomersCount = Object.values(custStats).filter(
      (s) => (s.total - s.fails) / Math.max(1, s.total) < 0.85
    ).length || 2;
    const otifRevenueExposure = Math.max(380000, towerData.ordersLateCount * 85000);

    // 3. P3: Profit Protection Engine (Freight Audit)
    let p3Trips = INITIAL_TRIPS;
    let p3Rules = P3_DEFAULT_RULES;
    try {
      const sTrips = JSON.parse(localStorage.getItem('freight_audit_trips_v1') || 'null');
      const sRules = JSON.parse(localStorage.getItem('freight_audit_rules_v1') || 'null');
      if (Array.isArray(sTrips) && sTrips.length > 0) p3Trips = sTrips;
      if (sRules) p3Rules = sRules;
    } catch {}
    const p3Audit = calculateAuditMetrics(p3Trips, p3Rules);
    const freightLeakage = p3Audit.totals.totalLeak;
    const annualizedMonthlyFreightLeak = Math.round(freightLeakage * 2.2);
    const worstLane = [...p3Audit.laneSummaries].sort((a, b) => b.totalWaste - a.totalWaste)[0];
    const worstCarrier = p3Audit.transporterSummaries[0];
    const marginRiskPct =
      p3Audit.totals.freightPaid > 0
        ? Math.round((freightLeakage / p3Audit.totals.freightPaid) * 100)
        : 18;

    // 4. P4: Warehouse Reliability Engine (Bin Accuracy)
    let p4Items = P4_INITIAL_SKUS;
    let p4Rules = P4_DEFAULT_RULES;
    try {
      const sItems = JSON.parse(localStorage.getItem('binaudit_skus_v1') || 'null');
      const sRules = JSON.parse(localStorage.getItem('binaudit_rules_v1') || 'null');
      if (Array.isArray(sItems) && sItems.length > 0) p4Items = sItems;
      if (sRules) p4Rules = sRules;
    } catch {}
    const p4Summary = computeSummary(p4Items, p4Rules);
    const p4Enriched = p4Items.map((it) => calculateItemFields(it, p4Rules));
    const worstBinItem = [...p4Enriched].sort((a, b) => Math.abs(b.gapRupees || 0) - Math.abs(a.gapRupees || 0))[0];
    const inventoryAccuracyPct =
      p4Summary.skusCounted > 0
        ? Math.round((p4Summary.linesMatched / p4Summary.skusCounted) * 100)
        : 91;
    const grossVarianceRupees = p4Summary.shelfShortRupees + p4Summary.foundStockRupees;
    // Financial translation of warehouse inaccuracy (variance + emergency buy/stoppage buffer)
    const accuracyLossImpactRupees = Math.max(grossVarianceRupees, Math.round(grossVarianceRupees * 2.4 + 95000));

    // Department Health Scores (0 - 100)
    const inventoryDeptScore = Math.max(45, Math.min(98, Math.round(100 - p1Report.deadCashPercent * 1.1)));
    const dispatchDeptScore = Math.max(40, Math.min(99, otifPercent));
    const logisticsDeptScore = Math.max(48, Math.min(97, Math.round(100 - marginRiskPct * 1.15)));
    const warehouseDeptScore = Math.max(50, Math.min(99, inventoryAccuracyPct));

    // Operations Health Score (0 - 100) & V2.0 Executive Risk Index (0 - 100)
    const operationsHealthScore = Math.round(
      inventoryDeptScore * 0.25 +
        dispatchDeptScore * 0.3 +
        logisticsDeptScore * 0.2 +
        warehouseDeptScore * 0.25
    );
    const executiveRiskIndex = Math.min(
      96,
      Math.max(12, Math.round(100 - operationsHealthScore + (otifPercent < 85 ? 18 : 0) + (deadCash > 200000 ? 12 : 0)))
    );

    // Management Escalation Logic (Auto-escalates critical thresholds to CEO queue)
    const escalations: { id: string; rule: string; current: string; impact: string; dept: string; engine: 'p1' | 'p2' | 'p3' | 'p4' }[] = [];
    if (otifPercent < 90) {
      escalations.push({
        id: 'esc-otif',
        rule: otifPercent < 85 ? 'CRITICAL ESCALATION: OTIF Below 85% Leadership Floor' : 'WARNING: OTIF Below 90% Target',
        current: `${otifPercent}% OTIF (${towerData.ordersLateCount} late loads)`,
        impact: `${formatINR(otifRevenueExposure)} OEM order value exposed`,
        dept: 'Dispatch Manager (P2)',
        engine: 'p2',
      });
    }
    if (deadCash >= 200000) {
      escalations.push({
        id: 'esc-dead',
        rule: 'CASH ESCALATION: Dead Inventory Above ₹2.0L Working Capital Ceiling',
        current: `${formatINR(deadCash)} locked >180 days`,
        impact: `${formatINR(cashRecoveryPotential)} recoverable via clearance`,
        dept: 'Inventory / Sales Head (P1)',
        engine: 'p1',
      });
    }
    if (annualizedMonthlyFreightLeak >= 25000) {
      escalations.push({
        id: 'esc-freight',
        rule: 'MARGIN ESCALATION: Freight Leakage Eroding Gross Margin',
        current: `${formatINR(freightLeakage)} leak (${formatINR(annualizedMonthlyFreightLeak)}/mo run-rate)`,
        impact: `${marginRiskPct}% of freight bill wasted on rate/detention leaks`,
        dept: 'Logistics Manager (P3)',
        engine: 'p3',
      });
    }
    if (inventoryAccuracyPct < 95) {
      escalations.push({
        id: 'esc-bin',
        rule: 'WAREHOUSE ESCALATION: Bin Accuracy Below 95% ERP Trust Threshold',
        current: `${inventoryAccuracyPct}% (${p4Summary.linesMismatch} mismatched bins)`,
        impact: `${formatINR(accuracyLossImpactRupees)} production/variance exposure`,
        dept: 'Stores Head (P4)',
        engine: 'p4',
      });
    }

    return {
      deadCash,
      cashRecoveryPotential,
      deadItemCount: p1Report.deadItemCount,
      otifPercent,
      atRiskCustomersCount,
      worstCustomerName,
      worstCustomerOtif,
      otifRevenueExposure,
      freightLeakage,
      annualizedMonthlyFreightLeak,
      marginRiskPct,
      worstLaneName: worstLane ? worstLane.lane : 'Chennai → Hosur',
      worstLaneWaste: worstLane ? worstLane.totalWaste : 14500,
      worstCarrierName: worstCarrier ? worstCarrier.transporter : 'Siva Transport',
      inventoryAccuracyPct,
      grossVarianceRupees,
      accuracyLossImpactRupees,
      linesMismatch: p4Summary.linesMismatch,
      worstBinSpot: worstBinItem ? `${worstBinItem.spot} (${worstBinItem.part})` : 'Bin B07 (Bearing Housing)',
      inventoryDeptScore,
      dispatchDeptScore,
      logisticsDeptScore,
      warehouseDeptScore,
      operationsHealthScore,
      executiveRiskIndex,
      escalations,
    };
  }, [towerData]);

  // Default Seeded Top 5 Monday Priorities (What? Why? Impact? AI Recommendation? Owner? Due Date? Status?)
  const defaultActions: ExecutiveActionItem[] = useMemo(
    () => [
      {
        id: 'act-p2-otif',
        rank: 1,
        pillar: 'P2 • Revenue',
        engineKey: 'p2',
        priority: 'Critical',
        whatIssue: `Fix ${liveSuite.worstCustomerName} OTIF (${liveSuite.worstCustomerOtif}% vs 95% SLA)`,
        whyRootCause: 'Production tool-change bottleneck + late gate slot allocation causing multi-day dispatch slips.',
        financialImpactRupees: liveSuite.otifRevenueExposure,
        aiRecommendation: `Lock T-24h pre-dispatch gate buffer for ${liveSuite.worstCustomerName} & shift loads to 96% OTIF benchmark carrier.`,
        potentialRecoveryRupees: Math.round(liveSuite.otifRevenueExposure * 0.85),
        owner: 'Dispatch Manager',
        dueDate: '2026-10-30',
        status: 'Open',
      },
      {
        id: 'act-p1-cash',
        rank: 2,
        pillar: 'P1 • Cash',
        engineKey: 'p1',
        priority: 'Critical',
        whatIssue: `Clear ${formatCompactLakhs(liveSuite.deadCash)} Dead Inventory (${liveSuite.deadItemCount} idle SKUs)`,
        whyRootCause: 'Zero movement >180 days from cancelled batch specs locking working capital & rack space.',
        financialImpactRupees: liveSuite.deadCash,
        aiRecommendation: `Liquidate Top 5 Class-A dead SKUs via secondary metal buyer / 25% buyer discount clearance.`,
        potentialRecoveryRupees: liveSuite.cashRecoveryPotential,
        owner: 'Stores & Commercial Head',
        dueDate: '2026-11-02',
        status: 'In Progress',
      },
      {
        id: 'act-p5-debtors',
        rank: 3,
        pillar: 'P5 • Debtors',
        engineKey: 'p5',
        priority: 'High',
        whatIssue: `Collect ${formatCompactLakhs(towerData.unpaidBillsRupees)} Overdue Receivables (> ${towerData.normalCreditDays}d credit)`,
        whyRootCause: 'Customers holding invoice cash past credit window without credit-hold gate enforcement.',
        financialImpactRupees: towerData.unpaidBillsRupees,
        aiRecommendation: 'Send 9 AM WhatsApp ledger reminders to >45d accounts & pause fresh dispatch until part-payment.',
        potentialRecoveryRupees: Math.round(towerData.unpaidBillsRupees * 0.75),
        owner: 'Accounts & Finance Head',
        dueDate: '2026-10-31',
        status: 'Open',
      },
      {
        id: 'act-p4-bin',
        rank: 4,
        pillar: 'P4 • Inventory',
        engineKey: 'p4',
        priority: 'High',
        whatIssue: `Audit ${liveSuite.linesMismatch} Mismatched Bins (${liveSuite.inventoryAccuracyPct}% ERP Accuracy)`,
        whyRootCause: `Unlogged night-shift floor withdrawals at ${liveSuite.worstBinSpot} creating phantom ERP stock.`,
        financialImpactRupees: liveSuite.accuracyLossImpactRupees,
        aiRecommendation: `Recount ${liveSuite.worstBinSpot} before 11 AM & move fast-mover A-items to locked issue counter.`,
        potentialRecoveryRupees: liveSuite.grossVarianceRupees,
        owner: 'Warehouse / Stores Head',
        dueDate: '2026-10-29',
        status: 'Open',
      },
      {
        id: 'act-p3-freight',
        rank: 5,
        pillar: 'P3 • Profit',
        engineKey: 'p3',
        priority: 'Medium',
        whatIssue: `Audit ${liveSuite.worstLaneName} Overspend & ${liveSuite.worstCarrierName}`,
        whyRootCause: 'Ad-hoc spot lorry rate variance + gate waiting detention bills paid without contract check.',
        financialImpactRupees: liveSuite.annualizedMonthlyFreightLeak,
        aiRecommendation: `Hold unverified bills above lane benchmark & issue debit note for ${formatINR(liveSuite.freightLeakage)} overcharge.`,
        potentialRecoveryRupees: liveSuite.freightLeakage,
        owner: 'Logistics Manager',
        dueDate: '2026-10-31',
        status: 'Open',
      },
    ],
    [liveSuite, towerData.unpaidBillsRupees, towerData.normalCreditDays]
  );

  const [actions, setActions] = useState<ExecutiveActionItem[]>(() => {
    try {
      const saved = localStorage.getItem(ACTION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return defaultActions;
  });

  useEffect(() => {
    try {
      localStorage.setItem(ACTION_STORAGE_KEY, JSON.stringify(actions));
    } catch {}
  }, [actions]);

  const handleCycleStatus = (id: string) => {
    setActions((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const nextStatus: ExecutiveActionItem['status'] =
          a.status === 'Open' ? 'In Progress' : a.status === 'In Progress' ? 'Closed' : 'Open';
        return { ...a, status: nextStatus };
      })
    );
  };

  const handleUpdateOwnerOrDue = (id: string, field: 'owner' | 'dueDate', val: string) => {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: val } : a)));
  };

  const handleAddCustomAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTitle.trim()) return;
    const nextItem: ExecutiveActionItem = {
      id: `act-custom-${Date.now()}`,
      rank: actions.length + 1,
      pillar: 'P2 • Revenue',
      engineKey: 'p2',
      priority: 'High',
      whatIssue: newActionTitle.trim(),
      whyRootCause: 'Flagged during Monday 9 AM CEO Control Tower review.',
      financialImpactRupees: 125000,
      aiRecommendation: 'Execute assigned floor corrective action and verify in next Monday briefing.',
      potentialRecoveryRupees: 100000,
      owner: newActionOwner,
      dueDate: newActionDue,
      status: 'Open',
    };
    setActions((prev) => [...prev, nextItem]);
    setNewActionTitle('');
  };

  const handleResetToLiveAI = () => {
    setActions(defaultActions);
  };

  // Top 10 Focused Executive KPIs (Strictly Capped at 10 — With Financial Translation, RAG & Last Week -> This Week)
  const top10KPIs = useMemo(() => {
    const prevDead = towerData.previousMonday.deadCashRupees || Math.round(liveSuite.deadCash * 1.08);
    const prevOtif = towerData.previousMonday.otifPercent || Math.min(92, liveSuite.otifPercent + 6);
    const prevFreightTrip = towerData.previousMonday.freightPerTrip || 4400;
    const currFreightTrip =
      towerData.tripsCount > 0 ? Math.round(towerData.freightPaidRupees / towerData.tripsCount) : 4833;
    const prevUnpaid = towerData.previousMonday.unpaidBillsRupees || Math.round(towerData.unpaidBillsRupees * 1.05);

    return [
      {
        num: 1,
        pillar: 'Cash (P1)',
        kpi: 'Dead Inventory Locked (>180d)',
        value: formatINR(liveSuite.deadCash),
        financialMeaning: `${liveSuite.deadItemCount} idle SKUs freezing working capital`,
        wow: `${formatCompactLakhs(prevDead)} ➔ ${formatCompactLakhs(liveSuite.deadCash)} (${liveSuite.deadCash <= prevDead ? 'Improved' : 'Worsened'})`,
        rag: liveSuite.deadCash > 200000 ? 'critical' : liveSuite.deadCash > 100000 ? 'monitor' : 'good',
        owner: 'Stores & Sales Head',
        engine: 'p1' as const,
      },
      {
        num: 2,
        pillar: 'Cash (P1)',
        kpi: '90-Day Cash Recovery Potential',
        value: formatINR(liveSuite.cashRecoveryPotential),
        financialMeaning: 'Immediate cash unlockable via clearance & scrap',
        wow: 'Target: Recover 60%+ in 60 days',
        rag: 'monitor' as const,
        owner: 'Commercial Head',
        engine: 'p1' as const,
      },
      {
        num: 3,
        pillar: 'Revenue (P2)',
        kpi: 'Customer Promise OTIF %',
        value: `${liveSuite.otifPercent}%`,
        financialMeaning: `${formatINR(liveSuite.otifRevenueExposure)} order revenue exposed to SLA risk`,
        wow: `${prevOtif}% ➔ ${liveSuite.otifPercent}% (${liveSuite.otifPercent >= prevOtif ? 'Improved' : 'Declined'})`,
        rag: liveSuite.otifPercent >= 95 ? 'good' : liveSuite.otifPercent >= 85 ? 'monitor' : 'critical',
        owner: 'Dispatch Manager',
        engine: 'p2' as const,
      },
      {
        num: 4,
        pillar: 'Revenue (P2)',
        kpi: 'At-Risk OEM Accounts',
        value: `${liveSuite.atRiskCustomersCount} Accounts`,
        financialMeaning: `Worst: ${liveSuite.worstCustomerName} at ${liveSuite.worstCustomerOtif}% OTIF`,
        wow: 'Requires T-24h pre-dispatch buffer',
        rag: liveSuite.atRiskCustomersCount > 1 ? 'critical' : 'monitor',
        owner: 'Key Account Lead',
        engine: 'p2' as const,
      },
      {
        num: 5,
        pillar: 'Profit (P3)',
        kpi: 'Verified Freight Leakage',
        value: formatINR(liveSuite.freightLeakage),
        financialMeaning: `${formatINR(liveSuite.annualizedMonthlyFreightLeak)}/mo annualized profit erosion`,
        wow: `Freight/Trip: ${formatINR(prevFreightTrip)} ➔ ${formatINR(currFreightTrip)}`,
        rag: liveSuite.freightLeakage > 15000 ? 'critical' : liveSuite.freightLeakage > 5000 ? 'monitor' : 'good',
        owner: 'Logistics Manager',
        engine: 'p3' as const,
      },
      {
        num: 6,
        pillar: 'Profit (P3)',
        kpi: 'Freight Bill Margin Erosion %',
        value: `${liveSuite.marginRiskPct}%`,
        financialMeaning: `Top leak route: ${liveSuite.worstLaneName} (${formatINR(liveSuite.worstLaneWaste)})`,
        wow: 'Pre-payment rate card gate active',
        rag: liveSuite.marginRiskPct > 15 ? 'critical' : liveSuite.marginRiskPct > 8 ? 'monitor' : 'good',
        owner: 'Finance & Logistics',
        engine: 'p3' as const,
      },
      {
        num: 7,
        pillar: 'Reliability (P4)',
        kpi: 'Warehouse Bin Accuracy %',
        value: `${liveSuite.inventoryAccuracyPct}%`,
        financialMeaning: `Accuracy Loss Impact: ${formatINR(liveSuite.accuracyLossImpactRupees)}`,
        wow: `90% ➔ ${liveSuite.inventoryAccuracyPct}% (${liveSuite.linesMismatch} bins mismatched)`,
        rag: liveSuite.inventoryAccuracyPct >= 97 ? 'good' : liveSuite.inventoryAccuracyPct >= 92 ? 'monitor' : 'critical',
        owner: 'Stores Head',
        engine: 'p4' as const,
      },
      {
        num: 8,
        pillar: 'Reliability (P4)',
        kpi: 'Gross Physical Stock Variance',
        value: formatINR(liveSuite.grossVarianceRupees),
        financialMeaning: 'Unrecorded shelf shortages + unentered GRN receipts',
        wow: `Priority recount: ${liveSuite.worstBinSpot}`,
        rag: liveSuite.grossVarianceRupees > 40000 ? 'critical' : 'monitor',
        owner: 'Cycle Count Lead',
        engine: 'p4' as const,
      },
      {
        num: 9,
        pillar: 'Reliability (P4)',
        kpi: 'A-Item Stockout Risk (<14 Days)',
        value: `${towerData.stockoutRiskCount} Critical SKUs`,
        financialMeaning: `Est. ${formatINR(towerData.stockoutRiskCount * 65000)} line-stoppage risk if unreplenished`,
        wow: `${towerData.previousMonday.stockoutRiskCount} SKUs ➔ ${towerData.stockoutRiskCount} SKUs`,
        rag: towerData.stockoutRiskCount >= 4 ? 'critical' : towerData.stockoutRiskCount >= 2 ? 'monitor' : 'good',
        owner: 'Materials Planner',
        engine: 'p4' as const,
      },
      {
        num: 10,
        pillar: 'Cash Flow (P5)',
        kpi: 'Overdue Customer Receivables',
        value: formatINR(towerData.unpaidBillsRupees),
        financialMeaning: `Cash held past ${towerData.normalCreditDays}-day credit norm`,
        wow: `${formatCompactLakhs(prevUnpaid)} ➔ ${formatCompactLakhs(towerData.unpaidBillsRupees)}`,
        rag: towerData.unpaidBillsRupees > 300000 ? 'critical' : 'monitor',
        owner: 'Accounts Head',
        engine: 'p5' as const,
      },
    ];
  }, [liveSuite, towerData]);

  const handleEngineClick = (eng: 'p1' | 'p2' | 'p3' | 'p4' | 'p5') => {
    if (eng === 'p5') {
      onOpenProject(6);
      return;
    }
    if (onJumpToEngine) {
      onJumpToEngine(eng);
    } else {
      const map: Record<'p1' | 'p2' | 'p3' | 'p4', number> = { p1: 1, p2: 5, p3: 4, p4: 2 };
      onOpenProject(map[eng]);
    }
  };

  const handleCopyCEOBriefing = () => {
    const lines = [
      `*CEO MONDAY BRIEFING — ${towerData.clientName.toUpperCase()}*`,
      `Week Ending: ${towerData.weekEndingDate} | Operations Health: *${liveSuite.operationsHealthScore}/100* | Risk Index: *${liveSuite.executiveRiskIndex}/100*`,
      ``,
      `*15-SECOND EXECUTIVE SNAPSHOT:*`,
      `• Cash (P1 Dead Stock): ${formatINR(liveSuite.deadCash)} (Recoverable: ${formatINR(liveSuite.cashRecoveryPotential)})`,
      `• Revenue (P2 OTIF): ${liveSuite.otifPercent}% (${formatINR(liveSuite.otifRevenueExposure)} order value at risk)`,
      `• Profit (P3 Freight Leak): ${formatINR(liveSuite.freightLeakage)} (${liveSuite.marginRiskPct}% bill waste)`,
      `• Trust (P4 Bin Accuracy): ${liveSuite.inventoryAccuracyPct}% (Impact: ${formatINR(liveSuite.accuracyLossImpactRupees)})`,
      ``,
      `*TOP 5 PRIORITIES THIS WEEK (Accountable Owners):*`,
      ...actions.slice(0, 5).map(
        (a, i) => `${i + 1}. [${a.priority.toUpperCase()}] ${a.whatIssue} ➔ Owner: ${a.owner} (Due: ${a.dueDate} | ${a.status})`
      ),
    ].join('\n');
    navigator.clipboard.writeText(lines);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2500);
  };

  const overallRag =
    liveSuite.operationsHealthScore >= 85
      ? { badge: '🟢 Good — Operations Healthy', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' }
      : liveSuite.operationsHealthScore >= 70
      ? { badge: '🟡 Attention Required — Focus Top 5 Actions', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40' }
      : { badge: '🔴 Critical — Leadership Escalation Active', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };

  const renderRagPill = (rag: string) => {
    if (rag === 'good') {
      return (
        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold whitespace-nowrap">
          🟢 Good
        </span>
      );
    }
    if (rag === 'monitor') {
      return (
        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold whitespace-nowrap">
          🟡 Monitor
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold whitespace-nowrap">
        🔴 Critical
      </span>
    );
  };

  return (
    <section
      className={`rounded-2xl border p-5 sm:p-6 space-y-6 shadow-2xl ${
        isDarkMode ? 'bg-neutral-900 border-amber-500/40 text-neutral-100' : 'bg-white border-amber-400 text-neutral-900'
      }`}
    >
      {/* Top Executive Identity & Rebranding Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono uppercase font-bold">
              P5 Version 2.0 • CEO Monday Briefing Engine
            </span>
            <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold ${overallRag.cls}`}>
              {overallRag.badge}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Executive Operations Control Tower: Where Leadership Must Focus This Week
          </h2>
          <p className="text-xs text-neutral-400">
            <strong>P1</strong> recovers trapped cash · <strong>P2</strong> protects customer revenue · <strong>P3</strong> stops profit leaks · <strong>P4</strong> protects inventory trust · <strong>P5 tells leadership What, Why, ₹ Impact, Owner &amp; Due Date in 15 seconds.</strong>
          </p>
        </div>

        {/* Quick Export & MBR Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 no-print">
          <button
            onClick={handleCopyCEOBriefing}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-md"
          >
            {copiedBrief ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedBrief ? 'CEO Briefing Copied!' : 'Copy CEO Monday Brief'}</span>
          </button>
          <button
            onClick={() => {
              setActiveView('mbr_pack');
              setTimeout(() => window.print(), 150);
            }}
            className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Export MBR Board PDF</span>
          </button>
        </div>
      </div>

      {/* 15-Second CEO Executive Summary + Operations Health Score + Risk Index */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Operations Health Score & V2.0 Risk Index Card */}
        <div className="lg:col-span-4 rounded-xl bg-neutral-950 border border-neutral-800 p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                Operations Health Score
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black font-mono text-white">
                  {liveSuite.operationsHealthScore}
                </span>
                <span className="text-sm font-mono text-neutral-400">/ 100</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-mono uppercase text-rose-400 font-bold">
                Executive Risk Index
              </div>
              <div className="flex items-baseline justify-end gap-1 mt-0.5">
                <span className="text-2xl font-black font-mono text-rose-400">
                  {liveSuite.executiveRiskIndex}
                </span>
                <span className="text-xs font-mono text-neutral-500">/ 100</span>
              </div>
            </div>
          </div>

          {/* 4-Department Mini Scorecards */}
          <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-neutral-800 text-center font-mono">
            <div className="p-1.5 rounded bg-neutral-900 border border-neutral-800">
              <div className="text-[9px] text-neutral-400">Inventory</div>
              <div className="text-xs font-bold text-amber-300">{liveSuite.inventoryDeptScore}</div>
            </div>
            <div className="p-1.5 rounded bg-neutral-900 border border-neutral-800">
              <div className="text-[9px] text-neutral-400">Dispatch</div>
              <div className="text-xs font-bold text-emerald-300">{liveSuite.dispatchDeptScore}</div>
            </div>
            <div className="p-1.5 rounded bg-neutral-900 border border-neutral-800">
              <div className="text-[9px] text-neutral-400">Logistics</div>
              <div className="text-xs font-bold text-cyan-300">{liveSuite.logisticsDeptScore}</div>
            </div>
            <div className="p-1.5 rounded bg-neutral-900 border border-neutral-800">
              <div className="text-[9px] text-neutral-400">Warehouse</div>
              <div className="text-xs font-bold text-fuchsia-300">{liveSuite.warehouseDeptScore}</div>
            </div>
          </div>
        </div>

        {/* 15-Second 4-Question Owner Snapshot (Cash, Revenue, Profit, Inventory Trust) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            onClick={() => handleEngineClick('p1')}
            className="rounded-xl bg-neutral-950 border border-amber-500/30 p-3.5 cursor-pointer hover:border-amber-400 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-300">Q1 · Dead Cash (P1)</span>
              {renderRagPill(liveSuite.deadCash > 200000 ? 'critical' : 'monitor')}
            </div>
            <div className="text-xl font-black font-mono text-white mt-1.5">
              {formatCompactLakhs(liveSuite.deadCash)}
            </div>
            <div className="text-[11px] text-emerald-400 font-mono mt-1">
              Recoverable: {formatCompactLakhs(liveSuite.cashRecoveryPotential)}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              WoW: {formatCompactLakhs(towerData.previousMonday.deadCashRupees || liveSuite.deadCash * 1.08)} ➔ Now
            </div>
          </div>

          <div
            onClick={() => handleEngineClick('p2')}
            className="rounded-xl bg-neutral-950 border border-emerald-500/30 p-3.5 cursor-pointer hover:border-emerald-400 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-300">Q2 · OTIF % (P2)</span>
              {renderRagPill(liveSuite.otifPercent >= 90 ? 'good' : liveSuite.otifPercent >= 80 ? 'monitor' : 'critical')}
            </div>
            <div className="text-xl font-black font-mono text-white mt-1.5">
              {liveSuite.otifPercent}%
            </div>
            <div className="text-[11px] text-rose-400 font-mono mt-1">
              At Risk: {formatCompactLakhs(liveSuite.otifRevenueExposure)} ({liveSuite.atRiskCustomersCount} OEMs)
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              WoW: {towerData.previousMonday.otifPercent}% ➔ {liveSuite.otifPercent}%
            </div>
          </div>

          <div
            onClick={() => handleEngineClick('p3')}
            className="rounded-xl bg-neutral-950 border border-cyan-500/30 p-3.5 cursor-pointer hover:border-cyan-400 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-cyan-300">Q3 · Freight Leak (P3)</span>
              {renderRagPill(liveSuite.freightLeakage > 15000 ? 'critical' : 'monitor')}
            </div>
            <div className="text-xl font-black font-mono text-white mt-1.5">
              {formatINR(liveSuite.freightLeakage)}
            </div>
            <div className="text-[11px] text-amber-300 font-mono mt-1">
              Margin Erosion: {liveSuite.marginRiskPct}% of bills
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              Run-rate: {formatINR(liveSuite.annualizedMonthlyFreightLeak)}/mo
            </div>
          </div>

          <div
            onClick={() => handleEngineClick('p4')}
            className="rounded-xl bg-neutral-950 border border-fuchsia-500/30 p-3.5 cursor-pointer hover:border-fuchsia-400 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-fuchsia-300">Q4 · Bin Trust (P4)</span>
              {renderRagPill(liveSuite.inventoryAccuracyPct >= 95 ? 'good' : 'monitor')}
            </div>
            <div className="text-xl font-black font-mono text-white mt-1.5">
              {liveSuite.inventoryAccuracyPct}%
            </div>
            <div className="text-[11px] text-fuchsia-300 font-mono mt-1">
              Loss Impact: {formatCompactLakhs(liveSuite.accuracyLossImpactRupees)}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              {liveSuite.linesMismatch} bins mismatched in ERP
            </div>
          </div>
        </div>
      </div>

      {/* Automatic Management Escalation Banner (Active When Thresholds Breach) */}
      {liveSuite.escalations.length > 0 && (
        <div className="rounded-xl bg-rose-950/30 border border-rose-500/40 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold uppercase text-rose-300 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Automatic Management Escalation Logic ({liveSuite.escalations.length} Leadership Triggers Breached)</span>
            </span>
            <span className="text-[11px] text-neutral-400 hidden sm:inline">
              Auto-promoted to CEO Monday Agenda
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {liveSuite.escalations.map((esc) => (
              <div
                key={esc.id}
                onClick={() => handleEngineClick(esc.engine)}
                className="p-2.5 rounded-lg bg-neutral-950/90 border border-rose-500/30 flex items-center justify-between gap-2 text-xs cursor-pointer hover:border-rose-400 transition"
              >
                <div>
                  <div className="font-bold text-rose-200">{esc.rule}</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    {esc.current} · <strong className="text-amber-300">{esc.impact}</strong> · Owner: {esc.dept}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-rose-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Navigation Tabs (Clean Decision Architecture — Zero Clutter) */}
      <div className="flex flex-wrap items-center gap-1.5 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800 no-print">
        <button
          onClick={() => setActiveView('priorities')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
            activeView === 'priorities' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>1. Top 5 Monday Priorities &amp; Action Tracker</span>
        </button>
        <button
          onClick={() => setActiveView('top10_kpis')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
            activeView === 'top10_kpis' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
          }`}
        >
          2. Top 10 Executive KPIs (RAG + WoW)
        </button>
        <button
          onClick={() => setActiveView('scorecards')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
            activeView === 'scorecards' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
          }`}
        >
          3. Department Scorecards
        </button>
        <button
          onClick={() => setActiveView('mbr_pack')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
            activeView === 'mbr_pack' ? 'bg-indigo-500 text-white' : 'text-indigo-300 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>4. Monthly Business Review (MBR) Presentation</span>
        </button>
      </div>

      {/* SUB-VIEW 1: Top 5 Priorities Engine + AI Recommendations + Accountable Action Tracker */}
      {activeView === 'priorities' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="text-neutral-300">
              <strong>Q5 Answered (&ldquo;What should management do first?&rdquo;):</strong> Ranked by Rupee exposure. Every item enforces <strong>What · Why · ₹ Impact · AI Action · Owner · Due Date</strong>.
            </div>
            <button
              onClick={handleResetToLiveAI}
              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-[11px] cursor-pointer"
            >
              Re-Rank from Live P1–P4 Data
            </button>
          </div>

          <div className="space-y-3">
            {actions.map((item, idx) => (
              <div
                key={item.id}
                className={`rounded-xl border p-4 transition ${
                  item.status === 'Closed'
                    ? 'bg-neutral-950/50 border-emerald-500/30 opacity-75'
                    : item.priority === 'Critical'
                    ? 'bg-neutral-950 border-rose-500/40'
                    : 'bg-neutral-950 border-neutral-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left: Priority, What & Why */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-neutral-950 font-mono text-[11px] font-black">
                        #{idx + 1} PRIORITY
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                          item.priority === 'Critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : item.priority === 'High'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}
                      >
                        {item.priority}
                      </span>
                      <button
                        onClick={() => handleEngineClick(item.engineKey)}
                        className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-[10px] font-mono text-neutral-300 hover:text-amber-300 cursor-pointer"
                      >
                        {item.pillar} ➔
                      </button>
                      <span className="font-mono text-xs font-bold text-rose-400">
                        Exposure: {formatINR(item.financialImpactRupees)}
                      </span>
                    </div>

                    <div className="text-sm sm:text-base font-bold text-white">
                      <span className="text-neutral-400 font-mono text-xs mr-1.5">WHAT:</span>
                      {item.whatIssue}
                    </div>
                    <div className="text-xs text-neutral-400">
                      <strong className="text-neutral-300 font-mono">WHY:</strong> {item.whyRootCause}
                    </div>

                    {/* AI Decision Recommendation Box */}
                    <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs flex flex-wrap items-center justify-between gap-2 mt-1">
                      <div className="text-emerald-200">
                        <strong className="text-emerald-400 font-mono uppercase">AI Recommended Action:</strong>{' '}
                        {item.aiRecommendation}
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[11px] shrink-0">
                        Potential Recovery: {formatINR(item.potentialRecoveryRupees)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Accountability Owner, Due Date & Persistent Status Toggle */}
                  <div className="flex flex-wrap sm:flex-nowrap lg:flex-col items-start lg:items-end justify-between gap-2 shrink-0 lg:w-56 pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-800">
                    <div className="w-full flex items-center justify-between gap-2 text-xs">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase">Owner:</span>
                      <input
                        type="text"
                        value={item.owner}
                        onChange={(e) => handleUpdateOwnerOrDue(item.id, 'owner', e.target.value)}
                        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-semibold text-white w-36 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="w-full flex items-center justify-between gap-2 text-xs">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase">Due:</span>
                      <input
                        type="date"
                        value={item.dueDate}
                        onChange={(e) => handleUpdateOwnerOrDue(item.id, 'dueDate', e.target.value)}
                        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-neutral-200 w-36 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <button
                      onClick={() => handleCycleStatus(item.id)}
                      className={`w-full py-1.5 px-3 rounded-lg font-mono text-xs font-bold border cursor-pointer transition text-center ${
                        item.status === 'Closed'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : item.status === 'In Progress'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                      title="Click to cycle status: Open ➔ In Progress ➔ Closed"
                    >
                      Status: {item.status} (Click)
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Custom Weekly Action Row */}
          <form
            onSubmit={handleAddCustomAction}
            className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-wrap items-center gap-2 text-xs no-print"
          >
            <input
              type="text"
              placeholder="Assign new Monday floor action (e.g. 'Scrap Disposal of Batch #14 by Friday')..."
              value={newActionTitle}
              onChange={(e) => setNewActionTitle(e.target.value)}
              className="flex-1 min-w-[220px] bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
            />
            <input
              type="text"
              value={newActionOwner}
              onChange={(e) => setNewActionOwner(e.target.value)}
              placeholder="Owner"
              className="w-36 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white"
            />
            <input
              type="date"
              value={newActionDue}
              onChange={(e) => setNewActionDue(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 font-mono text-neutral-200"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Action</span>
            </button>
          </form>
        </div>
      )}

      {/* SUB-VIEW 2: Strictly Capped Top 10 Executive KPIs with Financial Translation & WoW */}
      {activeView === 'top10_kpis' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>
              <strong>Anti-Clutter Executive Rule:</strong> Strictly capped at the <strong>Top 10 Executive KPIs</strong> across Cash, Revenue, Profit, and Warehouse Trust — every metric translated into Rupees.
            </span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900 text-neutral-400 font-mono text-[10px] uppercase border-b border-neutral-800">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Pillar</th>
                  <th className="py-2.5 px-3">Executive KPI</th>
                  <th className="py-2.5 px-3 text-right">This Week</th>
                  <th className="py-2.5 px-3">Financial Translation (&ldquo;So What?&rdquo;)</th>
                  <th className="py-2.5 px-3">Last Week ➔ This Week</th>
                  <th className="py-2.5 px-3 text-center">RAG</th>
                  <th className="py-2.5 px-3">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70">
                {top10KPIs.map((row) => (
                  <tr
                    key={row.num}
                    onClick={() => handleEngineClick(row.engine)}
                    className="hover:bg-neutral-900/70 cursor-pointer transition"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-neutral-500">{row.num}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-300 whitespace-nowrap">{row.pillar}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{row.kpi}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-white whitespace-nowrap">
                      {row.value}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-300">{row.financialMeaning}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-400">{row.wow}</td>
                    <td className="py-2.5 px-3 text-center">{renderRagPill(row.rag)}</td>
                    <td className="py-2.5 px-3 font-semibold text-neutral-300 whitespace-nowrap">{row.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: Department Scorecards */}
      {activeView === 'scorecards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              dept: 'Inventory Control',
              engine: 'p1' as const,
              score: liveSuite.inventoryDeptScore,
              head: 'Stores & Commercial Head',
              metric: `Dead Stock: ${formatCompactLakhs(liveSuite.deadCash)}`,
              rupeeImpact: `Recoverable: ${formatCompactLakhs(liveSuite.cashRecoveryPotential)}`,
            },
            {
              dept: 'Customer Dispatch',
              engine: 'p2' as const,
              score: liveSuite.dispatchDeptScore,
              head: 'Dispatch Manager',
              metric: `OTIF Score: ${liveSuite.otifPercent}%`,
              rupeeImpact: `SLA Exposure: ${formatCompactLakhs(liveSuite.otifRevenueExposure)}`,
            },
            {
              dept: 'Outbound Logistics',
              engine: 'p3' as const,
              score: liveSuite.logisticsDeptScore,
              head: 'Logistics Manager',
              metric: `Freight Leak: ${formatINR(liveSuite.freightLeakage)}`,
              rupeeImpact: `Annualized: ${formatINR(liveSuite.annualizedMonthlyFreightLeak)}/mo`,
            },
            {
              dept: 'Warehouse & Stores',
              engine: 'p4' as const,
              score: liveSuite.warehouseDeptScore,
              head: 'Warehouse Lead',
              metric: `Bin Accuracy: ${liveSuite.inventoryAccuracyPct}%`,
              rupeeImpact: `Loss Impact: ${formatCompactLakhs(liveSuite.accuracyLossImpactRupees)}`,
            },
          ].map((d) => (
            <div
              key={d.dept}
              onClick={() => handleEngineClick(d.engine)}
              className="rounded-xl bg-neutral-950 border border-neutral-800 p-4 space-y-3 cursor-pointer hover:border-amber-500/50 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{d.dept}</span>
                {renderRagPill(d.score >= 85 ? 'good' : d.score >= 75 ? 'monitor' : 'critical')}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black font-mono text-amber-400">{d.score}</span>
                <span className="text-xs font-mono text-neutral-500">/ 100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-900 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    d.score >= 85 ? 'bg-emerald-500' : d.score >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${d.score}%` }}
                />
              </div>
              <div className="text-xs text-neutral-300 space-y-0.5 pt-1 border-t border-neutral-800">
                <div>{d.metric}</div>
                <div className="font-mono text-amber-300 font-semibold">{d.rupeeImpact}</div>
                <div className="text-[11px] text-neutral-500">Accountable: {d.head}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-VIEW 4: Auto-Generated Monthly Business Review (MBR) Management Presentation Pack */}
      {activeView === 'mbr_pack' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/40 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono uppercase font-bold text-indigo-300">
                Auto-Generated Management Presentation Deck • {towerData.clientName}
              </div>
              <h3 className="text-base font-black text-white">
                Monthly Business Review (MBR) — Executive Board Pack ({towerData.weekEndingDate})
              </h3>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer no-print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save Board Deck PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slide 1: Executive Health & Financial Pool */}
            <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-4 space-y-3">
              <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                Slide 01 · Plant Health &amp; Total Recoverable Value Pool
              </div>
              <div className="text-lg font-black text-white">
                Operations Health: {liveSuite.operationsHealthScore}/100 · Risk Index: {liveSuite.executiveRiskIndex}/100
              </div>
              <ul className="space-y-2 text-xs text-neutral-300">
                <li className="flex justify-between border-b border-neutral-800 pb-1.5">
                  <span>1. Cash Recovery Pool (P1 Dead + Slow Stock):</span>
                  <strong className="font-mono text-amber-300">{formatINR(liveSuite.cashRecoveryPotential)}</strong>
                </li>
                <li className="flex justify-between border-b border-neutral-800 pb-1.5">
                  <span>2. Revenue Protected from OTIF Escalation (P2):</span>
                  <strong className="font-mono text-emerald-300">{formatINR(liveSuite.otifRevenueExposure)}</strong>
                </li>
                <li className="flex justify-between border-b border-neutral-800 pb-1.5">
                  <span>3. Annualized Freight Margin Savings (P3):</span>
                  <strong className="font-mono text-cyan-300">{formatINR(liveSuite.annualizedMonthlyFreightLeak * 12)}/yr</strong>
                </li>
                <li className="flex justify-between">
                  <span>4. Warehouse Variance &amp; Line-Stoppage Shield (P4):</span>
                  <strong className="font-mono text-fuchsia-300">{formatINR(liveSuite.accuracyLossImpactRupees)}</strong>
                </li>
              </ul>
            </div>

            {/* Slide 2: Accountable Decisions & Sign-Off */}
            <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-4 space-y-3">
              <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                Slide 02 · Leadership Action Sign-Off &amp; Completion Status
              </div>
              <div className="text-lg font-black text-white">
                {actions.filter((a) => a.status === 'Closed').length} of {actions.length} Assigned Decisions Closed
              </div>
              <div className="space-y-2 text-xs">
                {actions.slice(0, 5).map((a, i) => (
                  <div key={a.id} className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-1.5">
                    <span className="text-neutral-200 truncate">
                      <strong>#{i + 1}</strong> {a.whatIssue}
                    </span>
                    <span className="font-mono text-[11px] text-neutral-400 shrink-0">
                      {a.owner} · <strong className="text-amber-300">{a.status}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
