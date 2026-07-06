/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Layers, Truck, Package, CheckCircle2 } from 'lucide-react';
import Project1App from './project1/Project1App';
import Project2App from './project2/Project2App';
import { MergedCommandCenter } from './MergedCommandCenter';

type ArchitectureVersion = 'standalone_p2' | 'standalone_p1' | 'merged_suite';

const STORAGE_KEY_VERSION_MODE = 'industrial_architecture_version_mode';

export default function App() {
  const [versionMode, setVersionMode] = useState<ArchitectureVersion>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VERSION_MODE) as ArchitectureVersion | null;
      if (saved === 'standalone_p2' || saved === 'standalone_p1' || saved === 'merged_suite') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'merged_suite';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VERSION_MODE, versionMode);
    } catch {
      // ignore
    }
  }, [versionMode]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Dual-Version Architecture Switcher Bar (Hidden when printing) */}
      <div className="bg-slate-950 border-b border-indigo-500/30 px-4 py-1.5 sticky top-0 z-50 no-print shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono text-[10px] font-bold uppercase tracking-wider">
              Edition Selector
            </span>
            <span className="text-slate-300 font-medium hidden sm:inline">
              Switch instantly between <strong className="text-white">Version 1 (Standalone / Unmerged)</strong> and <strong className="text-white">Version 2 (Merged P1 + P2 Suite)</strong>:
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setVersionMode('standalone_p2')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                versionMode === 'standalone_p2'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Run Project 2 (Dispatch OTIF & Owner Report) as a 100% standalone unmerged app"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>V1: Project 2 Standalone (Unmerged OTIF)</span>
            </button>

            <button
              onClick={() => setVersionMode('standalone_p1')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                versionMode === 'standalone_p1'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Run Project 1 (Dead Stock & Working Capital) as a 100% standalone unmerged app"
            >
              <Package className="w-3.5 h-3.5" />
              <span>V1: Project 1 Standalone (Unmerged Stock)</span>
            </button>

            <button
              onClick={() => setVersionMode('merged_suite')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                versionMode === 'merged_suite'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold border border-indigo-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Run Version 2: Merged Enterprise Suite uniting Project 1 (Dead Stock) + Project 2 (Dispatch OTIF)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>V2: Merged Suite (P1 + P2 Combined)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Selected Version */}
      <div className="flex-1">
        {versionMode === 'standalone_p2' && <Project2App />}
        {versionMode === 'standalone_p1' && <Project1App />}
        {versionMode === 'merged_suite' && (
          <MergedCommandCenter
            onSwitchToStandaloneP1={() => setVersionMode('standalone_p1')}
            onSwitchToStandaloneP2={() => setVersionMode('standalone_p2')}
          />
        )}
      </div>
    </div>
  );
}
