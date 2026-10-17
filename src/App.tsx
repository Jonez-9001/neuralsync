/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Layers, Truck, Package, Scale, ScanBarcode, Radio } from 'lucide-react';
import Project1App from './project1/Project1App';
import Project2App from './project2/Project2App';
import Project3App from './project3/Project3App';
import Project4App from './project4/Project4App';
import Project5App from './project5/Project5App';
import { MergedCommandCenter } from './MergedCommandCenter';

type ArchitectureVersion =
  | 'standalone_p1'
  | 'standalone_p2'
  | 'standalone_p3'
  | 'standalone_p4'
  | 'standalone_p5'
  | 'merged_suite';

const STORAGE_KEY_VERSION_MODE = 'industrial_architecture_version_mode_v5';

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
        saved === 'merged_suite'
      ) {
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
      {/* Top 6-Mode Architecture Switcher Bar: P1 | P2 | P3 | P4 | P5 | P1+P2+P3+P4+P5 (Hidden when printing) */}
      <div className="bg-slate-950 border-b border-indigo-500/30 px-4 py-1.5 sticky top-0 z-50 no-print shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono text-[10px] font-bold uppercase tracking-wider">
              Suite Selector
            </span>
            <span className="text-slate-300 font-medium hidden lg:inline">
              Switch between standalone modules (<strong className="text-white">P1–P5</strong>) or the unified operating system (<strong className="text-white">P1+P2+P3+P4+P5</strong>):
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setVersionMode('standalone_p1')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                versionMode === 'standalone_p1'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Run Project 1 (Dead Stock & Working Capital Sheet) standalone"
            >
              <Package className="w-3.5 h-3.5" />
              <span>P1 (Dead Stock)</span>
            </button>

            <button
              onClick={() => setVersionMode('standalone_p2')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                versionMode === 'standalone_p2'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Run Project 2 (Dispatch OTIF & Owner Report) standalone"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>P2 (Dispatch OTIF)</span>
            </button>

            <button
              onClick={() => setVersionMode('standalone_p3')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                versionMode === 'standalone_p3'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Run Project 3 (Freight Leak & Lorry Detention Audit) standalone"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>P3 (Freight Leak)</span>
            </button>

            <button
              onClick={() => setVersionMode('standalone_p4')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                versionMode === 'standalone_p4'
                  ? 'bg-fuchsia-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Run Project 4 (BinAudit EV — Spares Cycle Count & Slotting Audit) standalone"
            >
              <ScanBarcode className="w-3.5 h-3.5" />
              <span>P4 (Bin Audit)</span>
            </button>

            <button
              onClick={() => setVersionMode('standalone_p5')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 text-[11px] ${
                versionMode === 'standalone_p5'
                  ? 'bg-rose-500 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Run Project 5 (Monday Control Tower — 6-Number Executive Habit) standalone"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>P5 (Monday Tower)</span>
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
              <span>P1 + P2 + P3 + P4 + P5</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Selected Version */}
      <div className="flex-1">
        {versionMode === 'standalone_p1' && <Project1App />}
        {versionMode === 'standalone_p2' && <Project2App />}
        {versionMode === 'standalone_p3' && <Project3App />}
        {versionMode === 'standalone_p4' && <Project4App />}
        {versionMode === 'standalone_p5' && <Project5App />}
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
    </div>
  );
}
