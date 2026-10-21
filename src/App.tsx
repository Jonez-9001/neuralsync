/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Truck,
  Package,
  Scale,
  ScanBarcode,
  Radio,
  Sparkles,
  Wand2,
  RefreshCw,
  Lock,
  Unlock,
  Briefcase
} from 'lucide-react';
import Project1App from './project1/Project1App';
import Project2App from './project2/Project2App';
import Project3App from './project3/Project3App';
import Project4App from './project4/Project4App';
import Project5App from './project5/Project5App';
import { MergedCommandCenter } from './MergedCommandCenter';
import { CustomBundleCombinator } from './components/CustomBundleCombinator';
import { SmartTallyMapperModal, TargetEngineType } from './components/SmartTallyMapperModal';
import { MultiDeviceSyncModal } from './components/MultiDeviceSyncModal';

type ArchitectureVersion =
  | 'standalone_p1'
  | 'standalone_p2'
  | 'standalone_p3'
  | 'standalone_p4'
  | 'standalone_p5'
  | 'custom_combos'
  | 'merged_suite';

const STORAGE_KEY_VERSION_MODE = 'industrial_architecture_version_mode_v6';

export default function App() {
  const [versionMode, setVersionMode] = useState<ArchitectureVersion>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VERSION_MODE) as ArchitectureVersion | null;
      if (
        saved === 'standalone_p1' ||
        saved === 'standalone_p2' ||
        saved === 'standalone_p3' ||
        saved === 'standalone_p4' ||
        saved === 'standalone_p5' ||
        saved === 'custom_combos' ||
        saved === 'merged_suite'
      ) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'custom_combos';
  });

  // Commercial Rebranding Mode (P1-P5 Codes vs Enterprise Commercial Names)
  const [useCommercialNames, setUseCommercialNames] = useState<boolean>(() => {
    return localStorage.getItem('suite_commercial_names_v1') === 'true';
  });

  // Client Presentation Lock (Hides top multi-project switcher bar during live client screen-share)
  const [isClientLocked, setIsClientLocked] = useState<boolean>(false);

  // Universal Modals (Dirty Tally Mapper & Multi-Device Sync Hub)
  const [showSmartMapper, setShowSmartMapper] = useState<boolean>(false);
  const [mapperDefaultEngine, setMapperDefaultEngine] = useState<TargetEngineType>('p1');
  const [showDeviceSync, setShowDeviceSync] = useState<boolean>(false);
  const [syncRefreshKey, setSyncRefreshKey] = useState<number>(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VERSION_MODE, versionMode);
    } catch {
      // ignore
    }
  }, [versionMode]);

  useEffect(() => {
    try {
      localStorage.setItem('suite_commercial_names_v1', String(useCommercialNames));
    } catch {}
  }, [useCommercialNames]);

  // Listen for cross-tab BroadcastChannel & storage updates so Gate Tablet (P2) & Store Count Sheet (P4) sync live
  useEffect(() => {
    const handleStorage = () => setSyncRefreshKey((k) => k + 1);
    window.addEventListener('storage', handleStorage);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('factory_suite_live_sync');
      bc.onmessage = () => setSyncRefreshKey((k) => k + 1);
    } catch {}

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
    };
  }, []);

  const openMapperForEngine = (eng?: TargetEngineType) => {
    if (eng) {
      setMapperDefaultEngine(eng);
    } else if (versionMode === 'standalone_p1') {
      setMapperDefaultEngine('p1');
    } else if (versionMode === 'standalone_p2') {
      setMapperDefaultEngine('p2');
    } else if (versionMode === 'standalone_p3') {
      setMapperDefaultEngine('p3');
    } else if (versionMode === 'standalone_p4') {
      setMapperDefaultEngine('p4');
    } else {
      setMapperDefaultEngine('p1');
    }
    setShowSmartMapper(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Architecture & Commercial Controls Bar (Hidden in Print & Hidden when Client Presentation Lock is active) */}
      {!isClientLocked ? (
        <div className="bg-slate-950 border-b border-indigo-500/30 px-3 sm:px-4 py-1.5 sticky top-0 z-50 no-print shadow-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Left: Mode Switcher Buttons */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setVersionMode('standalone_p1')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                  versionMode === 'standalone_p1'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Project 1: Dead Stock & Working Capital Cash-Release Engine"
              >
                <Package className="w-3.5 h-3.5" />
                <span>{useCommercialNames ? 'Working Capital Audit' : 'P1 (Dead Stock)'}</span>
              </button>

              <button
                onClick={() => setVersionMode('standalone_p2')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                  versionMode === 'standalone_p2'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Project 2: Dispatch OTIF & Gate Clock Bottleneck Engine"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{useCommercialNames ? 'Gate SLA & OTIF' : 'P2 (Dispatch OTIF)'}</span>
              </button>

              <button
                onClick={() => setVersionMode('standalone_p3')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                  versionMode === 'standalone_p3'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Project 3: Freight Leak & Lorry Detention Audit"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{useCommercialNames ? 'Freight Leak Audit' : 'P3 (Freight Leak)'}</span>
              </button>

              <button
                onClick={() => setVersionMode('standalone_p4')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                  versionMode === 'standalone_p4'
                    ? 'bg-fuchsia-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Project 4: BinAudit EV — Ghost Stock & Fast-Mover Cycle Count"
              >
                <ScanBarcode className="w-3.5 h-3.5" />
                <span>{useCommercialNames ? 'Ghost-Stock Bin Audit' : 'P4 (Bin Audit)'}</span>
              </button>

              <button
                onClick={() => setVersionMode('standalone_p5')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                  versionMode === 'standalone_p5'
                    ? 'bg-rose-500 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Project 5: Monday 9AM Control Tower & Overdue Debtors"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{useCommercialNames ? 'Monday 9AM Board' : 'P5 (Monday Tower)'}</span>
              </button>

              <button
                onClick={() => setVersionMode('custom_combos')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                  versionMode === 'custom_combos'
                    ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-sm font-bold border border-amber-400/50'
                    : 'text-amber-300 hover:text-white hover:bg-slate-800 border border-amber-500/20'
                }`}
                title="Explore Custom Order Combinations: P1+P4, P1+P3+P5, P2+P3, P2+P4, or build your own sequence"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{useCommercialNames ? 'Custom Bundles (P1+P4 / P1+P3+P5)' : 'Custom Combos (P1+P4, P1+P3+P5...)'}</span>
              </button>

              <button
                onClick={() => setVersionMode('merged_suite')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                  versionMode === 'merged_suite'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold border border-indigo-400/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Run Unified 5-Engine Enterprise Operating System (P1 + P2 + P3 + P4 + P5)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{useCommercialNames ? 'Full 5-Engine OS' : 'P1+P2+P3+P4+P5'}</span>
              </button>
            </div>

            {/* Right: Commercial Utilities (Smart Tally Importer, Device Sync, Brand Toggle, Client Lock) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => openMapperForEngine()}
                className="px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
                title="Import messy Tally Prime / Excel files with automatic column mapping & Grand Total stripping"
              >
                <Wand2 className="w-3 h-3" />
                <span>Smart Tally Import</span>
              </button>

              <button
                onClick={() => setShowDeviceSync(true)}
                className="px-2.5 py-1 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
                title="Sync Gate Guard Tablet (P2) & Storekeeper Phone (P4) with Owner Laptop"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Device Sync</span>
              </button>

              <button
                onClick={() => setUseCommercialNames((prev) => !prev)}
                className={`px-2.5 py-1 rounded-md border font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition ${
                  useCommercialNames
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Toggle between internal P1–P5 codes and client-facing Enterprise Module names"
              >
                <Briefcase className="w-3 h-3" />
                <span>{useCommercialNames ? 'Brand Names: ON' : 'P1–P5 Codes'}</span>
              </button>

              <button
                onClick={() => setIsClientLocked(true)}
                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition"
                title="Hide this top multi-project switcher bar when screen-sharing a single product with a client"
              >
                <Lock className="w-3 h-3" />
                <span>Client Lock</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Discreet Floating Unlock Pill when in Client Presentation Lock Mode */
        <button
          onClick={() => setIsClientLocked(false)}
          className="fixed bottom-4 left-4 z-50 no-print px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-indigo-600 text-slate-400 hover:text-white border border-slate-700 shadow-xl text-[11px] font-mono flex items-center gap-1.5 backdrop-blur-md transition cursor-pointer"
          title="Exit Client Presentation Mode and restore the top suite switcher bar"
        >
          <Unlock className="w-3 h-3" />
          <span>Exit Client Presentation Lock</span>
        </button>
      )}

      {/* Render Selected Version */}
      <div className="flex-1" key={syncRefreshKey}>
        {versionMode === 'standalone_p1' && <Project1App />}
        {versionMode === 'standalone_p2' && <Project2App />}
        {versionMode === 'standalone_p3' && <Project3App />}
        {versionMode === 'standalone_p4' && <Project4App />}
        {versionMode === 'standalone_p5' && (
          <Project5App
            onJumpToEngine={(engine) => {
              if (engine === 'p1') setVersionMode('standalone_p1');
              if (engine === 'p2') setVersionMode('standalone_p2');
              if (engine === 'p3') setVersionMode('standalone_p3');
              if (engine === 'p4') setVersionMode('standalone_p4');
            }}
          />
        )}
        {versionMode === 'custom_combos' && (
          <CustomBundleCombinator
            useCommercialNames={useCommercialNames}
            onOpenSmartMapper={(eng) => openMapperForEngine(eng)}
          />
        )}
        {versionMode === 'merged_suite' && (
          <MergedCommandCenter
            onSwitchToStandaloneP1={() => setVersionMode('standalone_p1')}
            onSwitchToStandaloneP2={() => setVersionMode('standalone_p2')}
            onSwitchToStandaloneP3={() => setVersionMode('standalone_p3')}
            onSwitchToStandaloneP4={() => setVersionMode('standalone_p4')}
            onSwitchToStandaloneP5={() => setVersionMode('standalone_p5')}
          />
        )}
      </div>

      {/* Universal Dirty Tally / Excel Smart Column-Mapper Modal */}
      <SmartTallyMapperModal
        isOpen={showSmartMapper}
        onClose={() => setShowSmartMapper(false)}
        defaultEngine={mapperDefaultEngine}
        onImportSuccess={() => {
          setSyncRefreshKey((k) => k + 1);
        }}
      />

      {/* Multi-Device Field-to-Owner Sync Modal */}
      <MultiDeviceSyncModal
        isOpen={showDeviceSync}
        onClose={() => setShowDeviceSync(false)}
        onSyncImported={() => {
          setSyncRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}
