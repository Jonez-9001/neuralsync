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
  Briefcase,
  Building2,
  Plus,
  Gauge,
  Menu,
  X,
  Smartphone
} from 'lucide-react';
import Project1App from './project1/Project1App';
import Project2App from './project2/Project2App';
import Project3App from './project3/Project3App';
import Project4App from './project4/Project4App';
import Project5App from './project5/Project5App';
import { MergedCommandCenter } from './MergedCommandCenter';
import { CustomBundleCombinator } from './components/CustomBundleCombinator';
import { SmartTallyMapperModal, TargetEngineType } from './components/SmartTallyMapperModal';
import { MultiDeviceSyncModal, SYNC_KEYS } from './components/MultiDeviceSyncModal';
import { MasterExecutiveDashboard } from './components/MasterExecutiveDashboard';

type ArchitectureVersion =
  | 'ceo_master'
  | 'standalone_p1'
  | 'standalone_p2'
  | 'standalone_p3'
  | 'standalone_p4'
  | 'standalone_p5'
  | 'custom_combos'
  | 'merged_suite';

interface ClientWorkspaceSlot {
  id: string;
  name: string;
  snapshots: Record<string, string>;
}

const STORAGE_KEY_VERSION_MODE = 'industrial_architecture_version_mode_v6';
const STORAGE_KEY_CLIENTS = 'suite_client_workspaces_v1';
const STORAGE_KEY_ACTIVE_CLIENT = 'suite_active_client_id_v1';

function parseRequestedArchitecture(): ArchitectureVersion | null {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const hashRaw = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(hashRaw);

    const target = (
      searchParams.get('project') ||
      searchParams.get('p') ||
      searchParams.get('engine') ||
      hashParams.get('project') ||
      hashParams.get('p') ||
      hashParams.get('engine') ||
      hashRaw
    ).toLowerCase();

    if (target === 'p2' || target === 'otif' || target === 'dispatch' || target === 'standalone_p2') {
      return 'standalone_p2';
    }
    if (target === 'p1' || target === 'cash' || target === 'inventory' || target === 'standalone_p1') {
      return 'standalone_p1';
    }
    if (target === 'p3' || target === 'freight' || target === 'profit' || target === 'standalone_p3') {
      return 'standalone_p3';
    }
    if (target === 'p4' || target === 'binaudit' || target === 'warehouse' || target === 'standalone_p4') {
      return 'standalone_p4';
    }
    if (target === 'p5' || target === 'tower' || target === 'controltower' || target === 'standalone_p5') {
      return 'standalone_p5';
    }
    if (target === 'ceo' || target === 'master' || target === 'ceo_master') {
      return 'ceo_master';
    }
  } catch {}
  return null;
}

export default function App() {
  const [versionMode, setVersionMode] = useState<ArchitectureVersion>(() => {
    const fromUrl = parseRequestedArchitecture();
    if (fromUrl) return fromUrl;

    try {
      const saved = localStorage.getItem(STORAGE_KEY_VERSION_MODE) as ArchitectureVersion | null;
      if (
        saved === 'ceo_master' ||
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
    return 'standalone_p2';
  });

  // Commercial Rebranding Mode (P1-P5 Codes vs Manufacturing Control Tower Commercial Names)
  const [useCommercialNames, setUseCommercialNames] = useState<boolean>(() => {
    return localStorage.getItem('suite_commercial_names_v1') === 'true';
  });

  // Client Presentation Lock (Hides top multi-project switcher bar during live client screen-share)
  const [isClientLocked, setIsClientLocked] = useState<boolean>(false);

  // Multi-Client Workspace Switcher (Prevents overwriting Client A when auditing Client B)
  const [clientSlots, setClientSlots] = useState<ClientWorkspaceSlot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLIENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      { id: 'client-ambattur', name: 'Ambattur Baseline Unit', snapshots: {} },
    ];
  });

  const [activeClientId, setActiveClientId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_CLIENT) || 'client-ambattur';
  });

  // Universal Modals (Dirty Tally Mapper & Multi-Device Sync Hub)
  const [showSmartMapper, setShowSmartMapper] = useState<boolean>(false);
  const [mapperDefaultEngine, setMapperDefaultEngine] = useState<TargetEngineType>('p1');
  const [showDeviceSync, setShowDeviceSync] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [syncRefreshKey, setSyncRefreshKey] = useState<number>(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VERSION_MODE, versionMode);
    } catch {}
  }, [versionMode]);

  useEffect(() => {
    try {
      localStorage.setItem('suite_commercial_names_v1', String(useCommercialNames));
    } catch {}
  }, [useCommercialNames]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clientSlots));
      localStorage.setItem(STORAGE_KEY_ACTIVE_CLIENT, activeClientId);
    } catch {}
  }, [clientSlots, activeClientId]);

  // Hydrate 1-Click Shareable Client Link (#client_sync=... or ?client_sync=...) on mount & hashchange
  useEffect(() => {
    const hydrateFromUrl = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashRaw = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hashRaw);
        const encoded = hashParams.get('client_sync') || searchParams.get('client_sync');
        if (encoded) {
          const decoded = decodeURIComponent(escape(atob(encoded)));
          const parsed = JSON.parse(decoded);
          const engines = parsed.engines || parsed;
          SYNC_KEYS.forEach((k) => {
            if (engines[k] !== undefined) {
              localStorage.setItem(
                k,
                typeof engines[k] === 'string' ? engines[k] : JSON.stringify(engines[k])
              );
            }
          });
          setUseCommercialNames(true);
          setIsClientLocked(true);
          setSyncRefreshKey((k) => k + 1);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        console.warn('Failed to hydrate client_sync URL param', err);
      }
    };
    hydrateFromUrl();
    const handleUrlNavigation = () => {
      const requested = parseRequestedArchitecture();
      if (requested) {
        setVersionMode(requested);
      }
    };
    window.addEventListener('hashchange', hydrateFromUrl);
    window.addEventListener('hashchange', handleUrlNavigation);
    window.addEventListener('popstate', handleUrlNavigation);
    return () => {
      window.removeEventListener('hashchange', hydrateFromUrl);
      window.removeEventListener('hashchange', handleUrlNavigation);
      window.removeEventListener('popstate', handleUrlNavigation);
    };
  }, []);

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

  const captureCurrentSnapshots = (): Record<string, string> => {
    const snap: Record<string, string> = {};
    SYNC_KEYS.forEach((k) => {
      const val = localStorage.getItem(k);
      if (val !== null) snap[k] = val;
    });
    return snap;
  };

  const handleSwitchClientSlot = (nextClientId: string) => {
    if (nextClientId === activeClientId) return;
    const outgoingSnap = captureCurrentSnapshots();
    const updatedSlots = clientSlots.map((slot) =>
      slot.id === activeClientId ? { ...slot, snapshots: outgoingSnap } : slot
    );
    const targetSlot = updatedSlots.find((s) => s.id === nextClientId);

    // Clear active keys and restore target client's snapshot (or clean baseline defaults)
    SYNC_KEYS.forEach((k) => localStorage.removeItem(k));
    if (targetSlot && targetSlot.snapshots) {
      Object.entries(targetSlot.snapshots).forEach(([k, val]) => {
        localStorage.setItem(k, String(val));
      });
    }

    setClientSlots(updatedSlots);
    setActiveClientId(nextClientId);
    setSyncRefreshKey((k) => k + 1);
    window.dispatchEvent(new Event('storage'));
  };

  const handleAddNewClientSlot = () => {
    const name = window.prompt('Enter new Factory / Client Workspace name (e.g., "Sri Murugan Auto Parts - Hosur"):');
    if (!name || !name.trim()) return;
    const outgoingSnap = captureCurrentSnapshots();
    const newId = `client-${Date.now()}`;
    const newSlot: ClientWorkspaceSlot = {
      id: newId,
      name: name.trim(),
      snapshots: {},
    };
    const updated = [
      ...clientSlots.map((s) => (s.id === activeClientId ? { ...s, snapshots: outgoingSnap } : s)),
      newSlot,
    ];
    SYNC_KEYS.forEach((k) => localStorage.removeItem(k));
    setClientSlots(updated);
    setActiveClientId(newId);
    setSyncRefreshKey((k) => k + 1);
    window.dispatchEvent(new Event('storage'));
  };

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
    } else if (versionMode === 'standalone_p5') {
      setMapperDefaultEngine('p5');
    } else {
      setMapperDefaultEngine('p1');
    }
    setShowSmartMapper(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Architecture & Commercial Controls Bar (Compact App Bar on Mobile, Full Strip on Desktop) */}
      {!isClientLocked ? (
        <div className="bg-slate-950/95 backdrop-blur-md border-b border-indigo-500/30 px-3 sm:px-4 py-1.5 sticky top-0 z-50 no-print shadow-md">
          {/* MOBILE COMPACT TOP BAR (< md) — Prevents vertical screen crowding on phones */}
          <div className="flex md:hidden items-center justify-between gap-2 h-10">
            <div className="flex items-center gap-2 min-w-0">
              <Gauge className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-black text-white truncate">
                {versionMode === 'ceo_master'
                  ? 'CEO Command Center'
                  : versionMode === 'standalone_p1'
                  ? 'P1 Cash Recovery'
                  : versionMode === 'standalone_p2'
                  ? 'P2 Promise OTIF'
                  : versionMode === 'standalone_p3'
                  ? 'P3 Profit Protection'
                  : versionMode === 'standalone_p4'
                  ? 'P4 Warehouse Bins'
                  : versionMode === 'standalone_p5'
                  ? 'P5 CEO Briefing'
                  : versionMode === 'custom_combos'
                  ? 'Modular Bundles'
                  : '5-Engine Suite'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => openMapperForEngine()}
                className="px-2 py-1.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] flex items-center gap-1"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Tally</span>
              </button>
              <button
                onClick={() => setShowDeviceSync(true)}
                className="px-2 py-1.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold text-[11px] flex items-center gap-1"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Sync/QR</span>
              </button>
              <button
                onClick={() => setShowMobileMenu((v) => !v)}
                className="p-1.5 rounded-md bg-slate-900 border border-slate-700 text-slate-200"
                aria-label="Toggle Mobile Suite Menu"
              >
                {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* MOBILE SLIDE-DOWN DRAWER (< md) */}
          {showMobileMenu && (
            <div className="md:hidden pt-2.5 pb-2 mt-1.5 border-t border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <select
                    value={activeClientId}
                    onChange={(e) => handleSwitchClientSlot(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-white focus:outline-none w-full"
                  >
                    {clientSlots.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddNewClientSlot}
                  className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[11px]"
                >
                  + Client
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    setVersionMode('custom_combos');
                    setShowMobileMenu(false);
                  }}
                  className="py-2 px-2.5 rounded-lg bg-slate-900 border border-amber-500/30 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Modular Bundles</span>
                </button>
                <button
                  onClick={() => {
                    setVersionMode('merged_suite');
                    setShowMobileMenu(false);
                  }}
                  className="py-2 px-2.5 rounded-lg bg-slate-900 border border-indigo-500/30 text-indigo-300 font-bold text-[11px] flex items-center justify-center gap-1"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Full 5-Engine Suite</span>
                </button>
                <button
                  onClick={() => setUseCommercialNames((prev) => !prev)}
                  className="py-2 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-semibold text-[11px]"
                >
                  {useCommercialNames ? 'Brand Names: ON' : 'P1–P5 Codes: ON'}
                </button>
                <button
                  onClick={() => {
                    setIsClientLocked(true);
                    setShowMobileMenu(false);
                  }}
                  className="py-2 px-2.5 rounded-lg bg-slate-900 border border-rose-500/30 text-rose-300 font-semibold text-[11px]"
                >
                  Client Screen Lock
                </button>
              </div>
            </div>
          )}

          {/* DESKTOP FULL BAR (md and up) */}
          <div className="hidden md:flex max-w-7xl mx-auto flex-wrap items-center justify-between gap-2 text-xs">
            {/* Left: Mode Switcher Buttons */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setVersionMode('ceo_master')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                  versionMode === 'ceo_master'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-sm font-black'
                    : 'text-emerald-300 hover:text-white hover:bg-slate-800 border border-emerald-500/30'
                }`}
                title="2-Minute CEO Master Executive Dashboard (Factory Health Score) + PM Backlog (P0-P3) & 3-Phase Roadmap"
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>{useCommercialNames ? 'Factory Health & Roadmap' : 'CEO Master & Roadmap'}</span>
              </button>

              <button
                onClick={() => setVersionMode('standalone_p1')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                  versionMode === 'standalone_p1'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Project 1: Cash Recovery Engine (Recovers Cash Locked in Dead Inventory Only)"
              >
                <Package className="w-3.5 h-3.5" />
                <span>{useCommercialNames ? 'Cash Recovery Engine' : 'P1 (Cash Recovery)'}</span>
              </button>

              <button
                onClick={() => setVersionMode('standalone_p2')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                  versionMode === 'standalone_p2'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Project 2: Customer Promise Reliability Engine (Protects Customer Service & Revenue via Strict OTIF)"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{useCommercialNames ? 'Customer Promise Engine' : 'P2 (Promise OTIF)'}</span>
              </button>

              <button
                onClick={() => setVersionMode('standalone_p3')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                  versionMode === 'standalone_p3'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Project 3: Profit Protection Engine (Protects Profit Margin from Freight Leaks)"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{useCommercialNames ? 'Profit Protection Engine' : 'P3 (Profit Protection)'}</span>
              </button>

              <button
                onClick={() => setVersionMode('standalone_p4')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                  versionMode === 'standalone_p4'
                    ? 'bg-fuchsia-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Project 4: Warehouse Reliability Engine (Protects Inventory Integrity & Bin Accuracy)"
              >
                <ScanBarcode className="w-3.5 h-3.5" />
                <span>{useCommercialNames ? 'Warehouse Reliability Engine' : 'P4 (Warehouse Trust)'}</span>
              </button>

              <button
                onClick={() => setVersionMode('standalone_p5')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                  versionMode === 'standalone_p5'
                    ? 'bg-rose-500 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Project 5: CEO Monday Briefing Engine (Executive Operations Control Tower — Tells Leadership What To Do Next)"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{useCommercialNames ? 'CEO Monday Briefing' : 'P5 (CEO Briefing)'}</span>
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
                <span>{useCommercialNames ? 'Modular Control Bundles' : 'Custom Combos'}</span>
              </button>

              <button
                onClick={() => setVersionMode('merged_suite')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                  versionMode === 'merged_suite'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold border border-indigo-400/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Run Unified Manufacturing Intelligence Suite (P1 + P2 + P3 + P4 + P5)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{useCommercialNames ? 'Operations Control Tower' : 'P1+P2+P3+P4+P5'}</span>
              </button>
            </div>

            {/* Right: Multi-Client Switcher & Commercial Utilities */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Multi-Client Workspace Switcher */}
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-md px-2 py-0.5 gap-1">
                <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                <select
                  value={activeClientId}
                  onChange={(e) => handleSwitchClientSlot(e.target.value)}
                  className="bg-transparent text-[11px] font-semibold text-slate-200 focus:outline-none max-w-[145px] cursor-pointer"
                  title="Switch isolated Client Factory Workspace without overwriting other clients"
                >
                  {clientSlots.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddNewClientSlot}
                  className="p-0.5 rounded hover:bg-slate-800 text-amber-300 cursor-pointer"
                  title="Create isolated workspace for a new factory client"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <button
                onClick={() => openMapperForEngine()}
                className="px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
                title="Import messy Tally Prime / Excel CSV files with automatic column mapping & Grand Total stripping"
              >
                <Wand2 className="w-3 h-3" />
                <span>Smart Tally Import</span>
              </button>

              <button
                onClick={() => setShowDeviceSync(true)}
                className="px-2.5 py-1 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
                title="Sync Gate Guard Tablet (P2), Storekeeper Phone (P4) & Share 1-Click Client Link"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Device &amp; Client Sync</span>
              </button>

              <button
                onClick={() => setUseCommercialNames((prev) => !prev)}
                className={`px-2.5 py-1 rounded-md border font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition ${
                  useCommercialNames
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Toggle between internal P1–P5 codes and Executive Control Tower Brand Names"
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

      {/* Render Selected Version (pb-20 on mobile reserves space for the thumb-friendly bottom nav bar) */}
      <div className="flex-1 pb-20 md:pb-0" key={`${activeClientId}-${syncRefreshKey}`}>
        {versionMode === 'ceo_master' && (
          <MasterExecutiveDashboard
            onNavigateEngine={(eng) => {
              if (eng === 'p1') setVersionMode('standalone_p1');
              if (eng === 'p2') setVersionMode('standalone_p2');
              if (eng === 'p3') setVersionMode('standalone_p3');
              if (eng === 'p4') setVersionMode('standalone_p4');
              if (eng === 'p5') setVersionMode('standalone_p5');
            }}
          />
        )}
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

      {/* MOBILE THUMB-FRIENDLY FIXED BOTTOM NAVIGATION BAR (< md) */}
      {!isClientLocked && (
        <nav
          aria-label="Mobile Engine Switcher"
          className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-1 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] grid grid-cols-6 gap-0.5 no-print shadow-2xl"
        >
          {[
            { id: 'ceo_master' as const, label: 'CEO', icon: Gauge, activeCls: 'text-emerald-400 bg-emerald-500/15' },
            { id: 'standalone_p1' as const, label: 'P1 Cash', icon: Package, activeCls: 'text-amber-400 bg-amber-500/15' },
            { id: 'standalone_p2' as const, label: 'P2 OTIF', icon: Truck, activeCls: 'text-emerald-400 bg-emerald-500/15' },
            { id: 'standalone_p3' as const, label: 'P3 Frt', icon: Scale, activeCls: 'text-cyan-400 bg-cyan-500/15' },
            { id: 'standalone_p4' as const, label: 'P4 Bins', icon: ScanBarcode, activeCls: 'text-fuchsia-400 bg-fuchsia-500/15' },
            { id: 'standalone_p5' as const, label: 'P5 Brief', icon: Radio, activeCls: 'text-rose-400 bg-rose-500/15' },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = versionMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setVersionMode(tab.id);
                  setShowMobileMenu(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition ${
                  active ? `${tab.activeCls} font-black` : 'text-slate-400 font-medium'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] mt-0.5 leading-none">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}

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
