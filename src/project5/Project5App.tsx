/**
 * Project 5: The Monday Control Tower
 * The 6-number Monday morning WhatsApp habit and supply chain operational control tower.
 * Sample week ending 05 Oct 2026, Ambattur sample unit.
 */

import React, { useState, useEffect } from 'react';
import { MondayTowerData, Language, UserRole } from './types';
import { INITIAL_TOWER_DATA } from './data/sampleData';
import { TRANSLATIONS } from './utils/translations';
import { TopBar } from './components/TopBar';
import { DelayAlertsBanner } from './components/DelayAlertsBanner';
import { MondayNoteCard } from './components/MondayNoteCard';
import { SixNumbersGrid } from './components/SixNumbersGrid';
import { ProjectDrillDownModal } from './components/ProjectDrillDownModal';
import { ThisWeekSheet } from './components/ThisWeekSheet';
import { FleetMonitor } from './components/FleetMonitor';
import { EncryptedChat } from './components/EncryptedChat';
import { ERPSyncModal } from './components/ERPSyncModal';
import { QuarterlyAnalytics } from './components/QuarterlyAnalytics';
import { RetainerHabitExplainer } from './components/RetainerHabitExplainer';

import { RefreshCw, CheckCircle2, Layers } from 'lucide-react';
import { AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES as P1_DEFAULT_RULES } from '../project1/data/initialData';
import { generateOwnerReport } from '../project1/utils/calculations';
import { INITIAL_DISPATCHES, INITIAL_RULES as P2_DEFAULT_RULES } from '../project2/data/initialData';
import { INITIAL_WORKSPACES } from '../project2/data/factoryWorkspaces';
import { calculateOTIFMetrics } from '../project2/utils/otifCalculator';
import { INITIAL_TRIPS, DEFAULT_RULES as P3_DEFAULT_RULES } from '../project3/data/defaultData';
import { calculateAuditMetrics } from '../project3/utils/auditCalculations';
import { INITIAL_SAMPLE_SKUS as P4_INITIAL_SKUS, DEFAULT_RULES as P4_DEFAULT_RULES } from '../project4/data/sampleData';
import { computePredictiveShortages } from '../project4/utils/auditCalculations';

interface Project5AppProps {
  onJumpToEngine?: (engine: 'p1' | 'p2' | 'p3' | 'p4') => void;
}

export default function App({ onJumpToEngine }: Project5AppProps = {}) {
  const [towerData, setTowerData] = useState<MondayTowerData>(() => {
    const saved = localStorage.getItem('monday_tower_data_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_TOWER_DATA;
      }
    }
    return INITIAL_TOWER_DATA;
  });

  const [currentTab, setCurrentTab] = useState<string>('tower');
  const [language, setLanguage] = useState<Language>('en');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [role, setRole] = useState<UserRole>('supply_chain_head');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [openedProjectId, setOpenedProjectId] = useState<number | null>(null);
  const [isHabitGuideOpen, setIsHabitGuideOpen] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Sync state to local cache for offline reliability (both keys so all cross-engine views stay synced)
  useEffect(() => {
    const serialized = JSON.stringify(towerData);
    localStorage.setItem('monday_tower_data_v1', serialized);
    localStorage.setItem('monday_control_tower_v1', serialized);
  }, [towerData]);

  const handlePullLiveFromP1ToP4 = (silent = false) => {
    try {
      // P1 Dead Cash
      const p1Items = JSON.parse(localStorage.getItem('p1_stock_items') || 'null') || AMBATTUR_FABRICATION_SAMPLE;
      const p1Rules = JSON.parse(localStorage.getItem('p1_stock_rules') || 'null') || P1_DEFAULT_RULES;
      const p1Summary = generateOwnerReport(p1Items, p1Rules);

      // P2 OTIF & Late Dispatches
      let p2Dispatches = INITIAL_DISPATCHES;
      let p2Rules = P2_DEFAULT_RULES;
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
      const p2Metrics = calculateOTIFMetrics(p2Dispatches, p2Rules);

      // P3 Freight
      const p3Trips = JSON.parse(localStorage.getItem('freight_audit_trips_v1') || 'null') || INITIAL_TRIPS;
      const p3Rules = JSON.parse(localStorage.getItem('freight_audit_rules_v1') || 'null') || P3_DEFAULT_RULES;
      const p3Audit = calculateAuditMetrics(p3Trips, p3Rules);

      // P4 Stockout Risk
      const p4Items = JSON.parse(localStorage.getItem('binaudit_skus_v1') || 'null') || P4_INITIAL_SKUS;
      const p4Rules = JSON.parse(localStorage.getItem('binaudit_rules_v1') || 'null') || P4_DEFAULT_RULES;
      const p4Shortages = computePredictiveShortages(p4Items, p4Rules);
      const stockoutRiskCount = p4Shortages.filter(s => s.severity === 'critical' || s.severity === 'warning').length || 4;

      // P5 Unpaid Bills (if imported via Smart Tally Mapper)
      const savedBills = JSON.parse(localStorage.getItem('p5_unpaid_bills_v1') || 'null');
      const liveUnpaidRupees = Array.isArray(savedBills) && savedBills.length > 0
        ? savedBills.reduce((s: number, b: any) => s + (Number(b.amountRupees) || 0), 0)
        : null;

      setTowerData(prev => ({
        ...prev,
        lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' (Live P1–P5 Sync)',
        deadCashRupees: p1Summary.deadCash,
        stockoutRiskCount,
        dispatchesCount: p2Metrics.totalDispatches,
        otifPassesCount: p2Metrics.passes,
        ordersLateCount: p2Metrics.failsLateOnly + p2Metrics.failsLateAndShort,
        freightPaidRupees: p3Audit.totals.freightPaid,
        tripsCount: p3Audit.totals.totalTrips,
        ...(liveUnpaidRupees !== null ? { unpaidBillsRupees: liveUnpaidRupees } : {}),
      }));
      if (!silent) {
        setSyncToast('Pulled live numbers from P1 (Cash Recovery), P2 (Promise OTIF), P3 (Profit Protection), P4 (Warehouse), and P5 (Debtors)!');
        setTimeout(() => setSyncToast(null), 3500);
      }
    } catch (err) {
      console.warn('Failed to sync live P1-P4 data', err);
    }
  };

  // Auto-sync live metrics on mount and when Smart Mapper / other tabs update localStorage
  useEffect(() => {
    handlePullLiveFromP1ToP4(true);
    const onStorage = () => handlePullLiveFromP1ToP4(true);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const t = TRANSLATIONS[language];

  return (
    <div className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'
    }`}>
      {/* 3-Zone Top Navigation Contract */}
      <TopBar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        language={language}
        setLanguage={setLanguage}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        role={role}
        setRole={setRole}
        isOffline={isOffline}
        onOpenHabitGuide={() => setIsHabitGuideOpen(true)}
        clientName={towerData.clientName}
      />

      {/* Main Viewport Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Live Cross-Engine Sync Bar */}
        <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
          isDarkMode ? 'bg-neutral-900/90 border-neutral-800 text-neutral-300' : 'bg-white border-neutral-200 text-neutral-700'
        }`}>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Live Cross-Engine Bridge:</strong> Pull real-time figures directly from your active <strong>P1, P2, P3 &amp; P4</strong> ledgers into this Monday 9 AM WhatsApp note.
            </span>
          </div>
          <button
            onClick={() => handlePullLiveFromP1ToP4(false)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Live P1–P4 Numbers Now</span>
          </button>
        </div>

        {syncToast && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{syncToast}</span>
          </div>
        )}

        {/* Automated Delay Alerts & 9 AM Gate Countdown Banner */}
        <DelayAlertsBanner
          language={language}
          isDarkMode={isDarkMode}
          onOpenProject={(id) => setOpenedProjectId(id)}
          ordersLateCount={towerData.ordersLateCount}
          stockoutCount={towerData.stockoutRiskCount}
        />

        {/* Tab 1: Control Tower Primary View */}
        {currentTab === 'tower' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* The Core WhatsApp Note (The Product) */}
            <MondayNoteCard
              towerData={towerData}
              language={language}
              isDarkMode={isDarkMode}
              onOpenProject={(id) => setOpenedProjectId(id)}
            />

            {/* The Six Numbers Grid with One-Line Readings */}
            <SixNumbersGrid
              towerData={towerData}
              language={language}
              isDarkMode={isDarkMode}
              onOpenProject={(id) => setOpenedProjectId(id)}
            />
          </div>
        )}

        {/* Tab 2: This Week Sheet (Every Yellow Cell) */}
        {currentTab === 'sheet' && (
          <div className="animate-in fade-in duration-150">
            <ThisWeekSheet
              towerData={towerData}
              setTowerData={setTowerData}
              language={language}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* Tab 3: Fleet Radar & Real-Time Logistics Tracking */}
        {currentTab === 'fleet' && (
          <div className="animate-in fade-in duration-150">
            <FleetMonitor
              language={language}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* Tab 4: Dispatcher Encrypted Comms & Discrepancy Resolution */}
        {currentTab === 'chat' && (
          <div className="animate-in fade-in duration-150">
            <EncryptedChat
              role={role}
              isDarkMode={isDarkMode}
              language={language}
            />
          </div>
        )}

        {/* Tab 5: ERP & Tally Prime Synchronization */}
        {currentTab === 'erp' && (
          <div className="animate-in fade-in duration-150">
            <ERPSyncModal
              towerData={towerData}
              setTowerData={setTowerData}
              isDarkMode={isDarkMode}
              language={language}
              isOffline={isOffline}
              setIsOffline={setIsOffline}
            />
          </div>
        )}

        {/* Tab 6: Quarterly Analytics & Reporting */}
        {currentTab === 'reports' && (
          <div className="animate-in fade-in duration-150">
            <QuarterlyAnalytics
              towerData={towerData}
              isDarkMode={isDarkMode}
              language={language}
            />
          </div>
        )}
      </main>

      {/* Drill-down Modal for Project 1 - 6 ("Reply with the one you want opened today") */}
      <ProjectDrillDownModal
        projectId={openedProjectId}
        onClose={() => setOpenedProjectId(null)}
        towerData={towerData}
        isDarkMode={isDarkMode}
        language={language}
        onJumpToEngine={onJumpToEngine}
      />

      {/* "What You Are Actually Selling" Philosophy Modal */}
      <RetainerHabitExplainer
        isOpen={isHabitGuideOpen}
        onClose={() => setIsHabitGuideOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
