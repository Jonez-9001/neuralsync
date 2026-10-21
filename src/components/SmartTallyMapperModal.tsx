import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Upload,
  Wand2,
  Database,
  Filter
} from 'lucide-react';
import { StockItem } from '../project1/types';
import { DispatchRow } from '../project2/types/otif';
import { Trip } from '../project3/types/freight';
import { AuditItem } from '../project4/types/audit';
import { INITIAL_WORKSPACES } from '../project2/data/factoryWorkspaces';

export type TargetEngineType = 'p1' | 'p2' | 'p3' | 'p4';

interface SmartTallyMapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEngine?: TargetEngineType;
  onImportSuccess?: (engine: TargetEngineType, count: number) => void;
}

interface FieldSchema {
  key: string;
  label: string;
  required: boolean;
  synonyms: string[];
}

const ENGINE_SCHEMAS: Record<TargetEngineType, { name: string; badge: string; fields: FieldSchema[]; messySample: string }> = {
  p1: {
    name: 'P1: Tally Stock Summary (Dead Stock & Working Capital)',
    badge: 'Tally Prime Alt+F1 Export',
    fields: [
      { key: 'itemCode', label: 'Part Code / Alias', required: true, synonyms: ['code', 'part', 'alias', 'sku', 'item code', 'part no'] },
      { key: 'itemName', label: 'Particulars / Item Name', required: true, synonyms: ['particulars', 'name', 'description', 'item name', 'material'] },
      { key: 'category', label: 'Stock Group / Category', required: false, synonyms: ['group', 'category', 'stock group', 'type'] },
      { key: 'qtyOnHand', label: 'Closing Qty (Cl. Balance)', required: true, synonyms: ['cl. qty', 'closing qty', 'qty', 'balance', 'quantity', 'on hand'] },
      { key: 'costRate', label: 'Effective Rate (₹/Unit)', required: true, synonyms: ['eff. rate', 'rate', 'cost', 'unit cost', 'price', 'std cost'] },
      { key: 'lastMovement', label: 'Last Voucher / Outward Date', required: true, synonyms: ['vch date', 'last movement', 'last issue', 'date', 'outward date'] },
    ],
    messySample: `Tally Prime - Ambattur Auto Components Pvt Ltd (Stock Summary As Of 1-Oct-2026)
Particulars\tPart Alias\tStock Group\tCl. Balance Qty\tEff. Rate (INR)\tLast Outward Vch Date
Grand Header Row - Ignore\t\t\t\t\t
EN24 Forged Gear Blank 110mm\tRM-GB-110\tRaw Material\t480 Nos\t₹ 1,250.00\t12-Jan-2026
SS304 Laser Cut Bracket Rev-A (Obsolete)\tFG-BRK-09\tFinished Goods\t920 Pcs\t₹ 440.00\t19-Nov-2025
M12 High Tensile Hex Bolt Grade 10.9\tCONSUM-M12\tConsumables\t3,500 Nos\t₹ 18.50\t25-Sep-2026
 Hydraulic Seal Kit Parker 60mm\tSP-HYD-60\tSpares\t45 Kits\t₹ 3,800.00\t04-Feb-2026
 Phosphor Bronze Bush Machined\tWIP-PB-22\tWIP\t310 Pcs\t₹ 890.00\t14-Mar-2026
Grand Total\t\t\t5,255\t\t`,
  },
  p2: {
    name: 'P2: Gate Outward & Customer PO Register (Dispatch OTIF)',
    badge: 'Security Gate + ERP Log',
    fields: [
      { key: 'po', label: 'PO / Invoice No', required: true, synonyms: ['po', 'invoice', 'order no', 'challan', 'so no'] },
      { key: 'customer', label: 'Customer / OEM Party', required: true, synonyms: ['party', 'customer', 'client', 'consignee', 'buyer'] },
      { key: 'part', label: 'Part Description', required: true, synonyms: ['part', 'item', 'particulars', 'material'] },
      { key: 'orderedQty', label: 'PO Scheduled Qty', required: true, synonyms: ['po qty', 'ordered', 'sched qty', 'target qty'] },
      { key: 'shippedQty', label: 'Gate Challan Shipped Qty', required: true, synonyms: ['shipped', 'billed qty', 'actual qty', 'dispatched'] },
      { key: 'promisedDate', label: 'Promised Slot (Date/Time)', required: true, synonyms: ['promised', 'cutoff', 'slot', 'due date', 'schedule date'] },
      { key: 'actualOut', label: 'Gate Out Timestamp', required: true, synonyms: ['gate out', 'actual out', 'out time', 'eway time'] },
      { key: 'delayReason', label: 'Hold / Delay Reason', required: false, synonyms: ['reason', 'remark', 'hold', 'delay'] },
    ],
    messySample: `PO Ref\tParty Name\tItem Particulars\tSched Qty\tChallan Qty\tPromised Cutoff\tGate Out Time\tSecurity Remarks
PO-TVS-8841\tTVS Motor Hosur\tSwingarm Pivot Assembly\t500 Nos\t500 Nos\t2026-09-23 14:00\t2026-09-23 13:40\tOn time
PO-ASH-9912\tAshok Leyland Ennore\tAir Brake Bracket LH\t800 Pcs\t650 Pcs\t2026-09-24 16:00\t2026-09-24 19:30\tFinal QC Hold
PO-CAT-3310\tCaterpillar Thiruvallur\tHeavy Flange Plate 16mm\t200 Nos\t200 Nos\t2026-09-25 11:00\t2026-09-25 14:45\tTransporter Late
Total Dispatches\t\t\t1500\t1350\t\t\t`,
  },
  p3: {
    name: 'P3: Transporter Lorry Bill & LR Register (Freight Leak Audit)',
    badge: 'Accounts Payable LR Export',
    fields: [
      { key: 'id', label: 'LR No / Bill ID', required: true, synonyms: ['lr', 'lr no', 'bill no', 'trip id', 'voucher'] },
      { key: 'date', label: 'Dispatch Date', required: true, synonyms: ['date', 'lr date', 'trip date', 'vch date'] },
      { key: 'lane', label: 'Origin–Destination Corridor', required: true, synonyms: ['lane', 'corridor', 'route', 'from to', 'destination'] },
      { key: 'transporter', label: 'Transporter / Fleet Name', required: true, synonyms: ['transporter', 'vendor', 'carrier', 'lorry owner', 'party'] },
      { key: 'vehicleType', label: 'Vehicle Type (19ft/32ft)', required: false, synonyms: ['vehicle', 'truck', 'type', 'lorry type'] },
      { key: 'tonnes', label: 'Net Weight (Tonnes)', required: true, synonyms: ['tonnes', 'wt', 'weight', 'mt', 'net wt'] },
      { key: 'bill', label: 'Total Lorry Bill Paid (₹)', required: true, synonyms: ['bill', 'freight', 'amount', 'total paid', 'invoice amt'] },
      { key: 'waitHours', label: 'Gate Detention Wait (Hrs)', required: false, synonyms: ['wait', 'detention', 'halting', 'hours', 'gate hours'] },
    ],
    messySample: `LR Number\tLR Date\tRoute Corridor\tTransporter Party\tLorry Type\tNet Wt (MT)\tTotal Bill Amt\tGate Halting Hrs
LR-9081\t14-Sep-2026\tChennai-Hosur\tSri Murugan Roadways\t19ft Open\t9.5 MT\t₹ 24,800.00\t4.5 hrs
LR-9084\t16-Sep-2026\tChennai-Hosur\tKPN Cargo Movers\t19ft Open\t10.0 MT\t₹ 18,200.00\t1.5 hrs
LR-9092\t19-Sep-2026\tChennai-Pune\tVRL Logistics\t32ft MXL\t15.2 MT\t₹ 64,500.00\t5.0 hrs
LR-9099\t22-Sep-2026\tChennai-Coimbatore\tABT Parcel Service\t19ft Open\t8.8 MT\t₹ 21,900.00\t3.5 hrs
Sub Total\t\t\t\t\t43.5 MT\t₹ 1,29,400.00\t`,
  },
  p4: {
    name: 'P4: Spares Bin Ledger vs Physical Count (BinAudit EV)',
    badge: 'Store Bin Card + Tally Qty',
    fields: [
      { key: 'code', label: 'SKU / Part Code', required: true, synonyms: ['code', 'sku', 'part no', 'item code'] },
      { key: 'part', label: 'Spare Part Name', required: true, synonyms: ['part', 'name', 'particulars', 'description'] },
      { key: 'spot', label: 'Bin / Rack Location', required: true, synonyms: ['spot', 'bin', 'rack', 'location', 'zone'] },
      { key: 'bookQty', label: 'Tally System Qty (Book)', required: true, synonyms: ['book', 'system qty', 'tally qty', 'computer qty'] },
      { key: 'physicalQty', label: 'Physical Hand Count', required: true, synonyms: ['physical', 'hand count', 'actual', 'counted'] },
      { key: 'unitCost', label: 'Store Cost Rate (₹)', required: true, synonyms: ['cost', 'rate', 'unit cost', 'purchase rate'] },
      { key: 'issuesPerMonth', label: '30-Day Counter Issues (Velocity)', required: true, synonyms: ['issues', 'velocity', 'monthly', 'sales', 'outward'] },
    ],
    messySample: `SKU Code\tParticulars\tRack Location\tTally Book Qty\tHand Counted\tPurchase Cost\t30-Day Issues
EV-CHG-48V\t48V 15A Lithium Fast Charger\tBack rack\t18 Nos\t13 Nos\t₹ 3,450\t28
EV-BRK-PAD\tFront Disc Ceramic Brake Pad Set\tBack rack\t42 Sets\t31 Sets\t₹ 380\t64
EV-THROT-01\tHall Sensor Twist Throttle Grip\tCounter\t25 Pcs\t25 Pcs\t₹ 520\t35
EV-CTRL-72V\t72V Sinewave BLDC Controller\tMezzanine\t9 Nos\t7 Nos\t₹ 6,200\t14
Grand Total\t\t\t94\t76\t\t141`,
  },
};

function cleanNumber(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = String(val).replace(/[₹$,\sA-Za-z/]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function normalizeMessyDate(val: string | undefined): string {
  if (!val) return '2026-09-25';
  const raw = val.trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.substring(0, 10);
  // DD-MMM-YYYY or DD-MMM-YY (e.g., 12-Jan-2026)
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const mMatch = raw.match(/^(\d{1,2})[-/\s]([A-Za-z]{3})[-/\s](\d{2,4})/);
  if (mMatch) {
    const day = mMatch[1].padStart(2, '0');
    const mon = months[mMatch[2].toLowerCase()] || '09';
    const yr = mMatch[3].length === 2 ? `20${mMatch[3]}` : mMatch[3];
    return `${yr}-${mon}-${day}`;
  }
  // DD/MM/YYYY
  const dMatch = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dMatch) {
    return `${dMatch[3]}-${dMatch[2].padStart(2, '0')}-${dMatch[1].padStart(2, '0')}`;
  }
  return '2026-09-20';
}

export const SmartTallyMapperModal: React.FC<SmartTallyMapperModalProps> = ({
  isOpen,
  onClose,
  defaultEngine = 'p1',
  onImportSuccess,
}) => {
  const [targetEngine, setTargetEngine] = useState<TargetEngineType>(defaultEngine);
  const [rawText, setRawText] = useState<string>(ENGINE_SCHEMAS[defaultEngine].messySample);
  const [columnMap, setColumnMap] = useState<Record<string, number>>({});
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const schema = ENGINE_SCHEMAS[targetEngine];

  // Parse raw text into header + valid data rows (automatically filtering out Tally Grand Total / Sub Total / title noise)
  const parsedTable = useMemo(() => {
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return { headers: [] as string[], rows: [] as string[][], skippedNoiseCount: 0 };

    // Detect delimiter (Tab from Excel paste vs Comma from CSV)
    const delimiter = lines.some((l) => l.includes('\t')) ? '\t' : ',';

    // Find the first row that looks like a real multi-column header (at least 3 columns)
    let headerIdx = 0;
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const cols = lines[i].split(delimiter).map((c) => c.trim());
      if (cols.filter(Boolean).length >= 3) {
        headerIdx = i;
        break;
      }
    }

    const headers = lines[headerIdx].split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim());
    const dataRows: string[][] = [];
    let skippedNoiseCount = headerIdx;

    for (let i = headerIdx + 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());
      const firstCell = (cols[0] || '').toLowerCase();
      const nonEmptyCount = cols.filter(Boolean).length;

      // Skip Tally summary/noise rows ("Grand Total", "Sub Total", "Total", or rows with < 3 populated cells)
      if (
        nonEmptyCount < 3 ||
        firstCell.startsWith('grand total') ||
        firstCell.startsWith('sub total') ||
        firstCell === 'total' ||
        firstCell.includes('header row') ||
        firstCell.startsWith('total ')
      ) {
        skippedNoiseCount++;
        continue;
      }
      dataRows.push(cols);
    }

    return { headers, rows: dataRows, skippedNoiseCount };
  }, [rawText]);

  // Auto-map columns whenever headers or targetEngine changes
  React.useEffect(() => {
    const nextMap: Record<string, number> = {};
    schema.fields.forEach((field) => {
      const foundIdx = parsedTable.headers.findIndex((h) => {
        const lower = h.toLowerCase();
        return field.synonyms.some((syn) => lower.includes(syn));
      });
      if (foundIdx !== -1) {
        nextMap[field.key] = foundIdx;
      } else {
        nextMap[field.key] = 0;
      }
    });
    setColumnMap(nextMap);
  }, [parsedTable.headers, targetEngine]);

  if (!isOpen) return null;

  const handleEngineSwitch = (eng: TargetEngineType) => {
    setTargetEngine(eng);
    setRawText(ENGINE_SCHEMAS[eng].messySample);
    setStatusMsg(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === 'string') {
        setRawText(content);
      }
    };
    reader.readAsText(file);
  };

  const executeCleanImport = () => {
    if (parsedTable.rows.length === 0) return;

    const getCell = (row: string[], key: string): string => {
      const idx = columnMap[key] ?? 0;
      return row[idx] || '';
    };

    try {
      if (targetEngine === 'p1') {
        const existing: StockItem[] = importMode === 'append'
          ? JSON.parse(localStorage.getItem('p1_stock_items') || '[]')
          : [];
        const newItems: StockItem[] = parsedTable.rows.map((row, idx) => {
          const rawCat = getCell(row, 'category');
          const validCat = ['Raw Material', 'WIP', 'Finished Goods', 'Spares', 'Consumables'].includes(rawCat)
            ? (rawCat as StockItem['category'])
            : 'Raw Material';
          return {
            id: `tally-p1-${Date.now()}-${idx}`,
            itemCode: getCell(row, 'itemCode') || `SKU-${idx + 100}`,
            itemName: getCell(row, 'itemName') || 'Unnamed Material',
            category: validCat,
            qtyOnHand: cleanNumber(getCell(row, 'qtyOnHand')),
            costRate: cleanNumber(getCell(row, 'costRate')),
            lastMovement: normalizeMessyDate(getCell(row, 'lastMovement')),
          };
        });
        localStorage.setItem('p1_stock_items', JSON.stringify([...newItems, ...existing]));
      } else if (targetEngine === 'p2') {
        const savedWsList = localStorage.getItem('otif_workspaces_v2');
        const savedActiveId = localStorage.getItem('otif_active_workspace_id_v2') || INITIAL_WORKSPACES[0].id;
        const workspaces = savedWsList ? JSON.parse(savedWsList) : INITIAL_WORKSPACES;
        const newRows: DispatchRow[] = parsedTable.rows.map((row, idx) => {
          const promRaw = getCell(row, 'promisedDate').replace(' ', 'T').substring(0, 16);
          const actRaw = getCell(row, 'actualOut').replace(' ', 'T').substring(0, 16);
          return {
            id: `tally-p2-${Date.now()}-${idx}`,
            po: getCell(row, 'po') || `PO-${idx + 500}`,
            customer: getCell(row, 'customer') || 'OEM Customer',
            part: getCell(row, 'part') || 'Machined Component',
            orderedQty: cleanNumber(getCell(row, 'orderedQty')) || 100,
            shippedQty: cleanNumber(getCell(row, 'shippedQty')) || 100,
            promisedDate: promRaw.includes('T') ? promRaw : `${normalizeMessyDate(promRaw)}T16:00`,
            actualOut: actRaw.includes('T') ? actRaw : `${normalizeMessyDate(actRaw)}T15:45`,
            vehicle: 'TN-01-AB-4411',
            delayReason: (getCell(row, 'delayReason') || '') as any,
          };
        });
        const updatedWs = workspaces.map((w: any) => {
          if (w.id === savedActiveId) {
            return {
              ...w,
              dispatches: importMode === 'append' ? [...newRows, ...(w.dispatches || [])] : newRows,
            };
          }
          return w;
        });
        localStorage.setItem('otif_workspaces_v2', JSON.stringify(updatedWs));
      } else if (targetEngine === 'p3') {
        const existing: Trip[] = importMode === 'append'
          ? JSON.parse(localStorage.getItem('freight_audit_trips_v1') || '[]')
          : [];
        const newTrips: Trip[] = parsedTable.rows.map((row, idx) => ({
          id: getCell(row, 'id') || `LR-${Date.now().toString().slice(-4)}-${idx}`,
          date: normalizeMessyDate(getCell(row, 'date')),
          lane: getCell(row, 'lane') || 'Chennai-Hosur',
          transporter: getCell(row, 'transporter') || 'Regional Carrier',
          vehicleType: (getCell(row, 'vehicleType') as any) || '19ft Open',
          tonnes: cleanNumber(getCell(row, 'tonnes')) || 9.0,
          bill: cleanNumber(getCell(row, 'bill')) || 18000,
          waitHours: cleanNumber(getCell(row, 'waitHours')) || 1.5,
          status: 'Flagged',
        }));
        localStorage.setItem('freight_audit_trips_v1', JSON.stringify([...newTrips, ...existing]));
        // Auto-expand P3 date rules so all imported dates are visible
        const savedRules = JSON.parse(localStorage.getItem('freight_audit_rules_v1') || 'null');
        if (savedRules) {
          const allDates = newTrips.map((t) => t.date).sort();
          if (allDates[0] && allDates[0] < savedRules.startDate) savedRules.startDate = allDates[0];
          if (allDates[allDates.length - 1] && allDates[allDates.length - 1] > savedRules.endDate) {
            savedRules.endDate = allDates[allDates.length - 1];
          }
          localStorage.setItem('freight_audit_rules_v1', JSON.stringify(savedRules));
        }
      } else if (targetEngine === 'p4') {
        const existing: AuditItem[] = importMode === 'append'
          ? JSON.parse(localStorage.getItem('binaudit_skus_v1') || '[]')
          : [];
        const newBins: AuditItem[] = parsedTable.rows.map((row, idx) => ({
          id: `tally-p4-${Date.now()}-${idx}`,
          code: getCell(row, 'code') || `EV-SKU-${idx + 50}`,
          part: getCell(row, 'part') || 'EV Spare Component',
          spot: getCell(row, 'spot') || 'Back rack',
          bookQty: cleanNumber(getCell(row, 'bookQty')),
          physicalQty: cleanNumber(getCell(row, 'physicalQty')),
          unitCost: cleanNumber(getCell(row, 'unitCost')) || 450,
          issuesPerMonth: cleanNumber(getCell(row, 'issuesPerMonth')) || 12,
        }));
        localStorage.setItem('binaudit_skus_v1', JSON.stringify([...newBins, ...existing]));
      }

      // Trigger storage event for live cross-component refresh
      window.dispatchEvent(new Event('storage'));
      setStatusMsg(`Successfully cleaned & imported ${parsedTable.rows.length} rows into ${targetEngine.toUpperCase()}! (${parsedTable.skippedNoiseCount} messy Tally header/total rows automatically stripped)`);
      if (onImportSuccess) {
        onImportSuccess(targetEngine, parsedTable.rows.length);
      }
    } catch (err) {
      setStatusMsg('Error importing rows. Check column mappings.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight">
                  Universal Dirty Tally / Excel Smart Column-Mapper
                </h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold uppercase">
                  Fixes Messy Client Exports
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Paste raw Tally Prime / BUSY / Excel exports with any column names. Automatically strips &ldquo;Grand Total&rdquo; noise, normalizes Indian dates &amp; ₹ symbols, and maps columns via dropdowns.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Target Engine Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>1. Select Target Engine to Feed:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['p1', 'p2', 'p3', 'p4'] as TargetEngineType[]).map((eng) => (
                <button
                  key={eng}
                  onClick={() => handleEngineSwitch(eng)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    targetEngine === eng
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {eng.toUpperCase()} — {ENGINE_SCHEMAS[eng].badge}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Raw Paste / File Upload */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>2. Paste Messy Tally / Excel Export (TSV or CSV):</span>
                </label>
                <label className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3 text-indigo-400" />
                  <span>Upload .CSV / .TXT</span>
                  <input type="file" accept=".csv,.tsv,.txt" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              <textarea
                rows={9}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-[11px] font-mono text-slate-200 focus:border-indigo-500 focus:outline-none"
                placeholder="Paste raw rows directly from Excel or Tally Prime..."
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800/80">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Filter className="w-3.5 h-3.5" />
                  Auto-Detected: {parsedTable.rows.length} valid data rows
                </span>
                <span className="text-amber-400 font-mono">
                  Stripped {parsedTable.skippedNoiseCount} Tally header / &ldquo;Grand Total&rdquo; noise rows
                </span>
              </div>
            </div>

            {/* Step 3: Interactive Column Mapping Dropdowns */}
            <div className="lg:col-span-6 space-y-3">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>3. Fuzzy-Matched Column Mapping (Override if needed):</span>
                <span className="text-[10px] font-mono text-indigo-400">Auto-mapped via Indian ERP synonyms</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5 max-h-64 overflow-y-auto">
                {schema.fields.map((field) => (
                  <div key={field.key} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-200">{field.label}</span>
                      {field.required && <span className="text-rose-400 font-bold">*</span>}
                    </div>
                    <select
                      value={columnMap[field.key] ?? 0}
                      onChange={(e) =>
                        setColumnMap((prev) => ({ ...prev, [field.key]: parseInt(e.target.value, 10) }))
                      }
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-300 focus:border-indigo-500 focus:outline-none min-w-[190px]"
                    >
                      {parsedTable.headers.map((h, i) => (
                        <option key={i} value={i}>
                          Col {i + 1}: {h || `(Column ${i + 1})`}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Import Mode */}
              <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 font-medium">Injection Mode:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setImportMode('append')}
                    className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                      importMode === 'append'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Append to Existing Ledger
                  </button>
                  <button
                    onClick={() => setImportMode('replace')}
                    className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                      importMode === 'replace'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Replace Entire Ledger
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Cleaned Preview Table */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300">
              4. Live Cleaned &amp; Normalized Preview (First 4 Rows):
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-[11px] font-mono">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    {schema.fields.map((f) => (
                      <th key={f.key} className="py-2 px-3">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {parsedTable.rows.slice(0, 4).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-900/40">
                      {schema.fields.map((f) => {
                        const rawVal = row[columnMap[f.key] ?? 0] || '';
                        const isNumeric = ['qtyOnHand', 'costRate', 'orderedQty', 'shippedQty', 'tonnes', 'bill', 'waitHours', 'bookQty', 'physicalQty', 'unitCost', 'issuesPerMonth'].includes(f.key);
                        const isDate = ['lastMovement', 'date'].includes(f.key);
                        const displayVal = isNumeric
                          ? cleanNumber(rawVal).toLocaleString('en-IN')
                          : isDate
                          ? normalizeMessyDate(rawVal)
                          : rawVal;
                        return (
                          <td key={f.key} className="py-2 px-3 text-slate-200">
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {statusMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Ready to inject <strong>{parsedTable.rows.length}</strong> normalized records into <strong>{schema.name}</strong>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={executeCleanImport}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Clean &amp; Inject {parsedTable.rows.length} Rows into {targetEngine.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
