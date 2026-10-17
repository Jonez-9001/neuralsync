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

export default function App() {
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

  // Sync state to local cache for offline reliability
  useEffect(() => {
    localStorage.setItem('monday_tower_data_v1', JSON.stringify(towerData));
  }, [towerData]);

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
