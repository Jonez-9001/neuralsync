import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X, Download, FileText, Check, Copy, Sparkles, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { DispatchRow, DelayReason } from '../types/otif';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportDispatches: (rows: DispatchRow[], mode: 'replace' | 'append') => void;
}

interface ParsedPreviewRow {
  customer: string;
  po: string;
  part: string;
  orderedQty: number;
  shippedQty: number;
  promisedDate: string;
  actualOut: string;
  vehicle: string;
  delayReason: DelayReason;
  notes: string;
  isValid: boolean;
  errors: string[];
}

export const SAMPLE_AUTOMOTIVE_DATASET = [
  {
    customer: 'Hyundai vendor park',
    po: 'PO-HMI-8810',
    part: 'Front Suspension Arm M12',
    orderedQty: 120,
    shippedQty: 120,
    promisedDate: '2026-09-21T14:00',
    actualOut: '2026-09-21T13:40',
    vehicle: 'TN-21-AZ-4410',
    delayReason: '' as DelayReason,
    notes: 'On-Time & In-Full (Cleared gate 20 min early)',
    isValid: true,
    errors: []
  },
  {
    customer: 'Maruti Suzuki Manesar',
    po: 'PO-MSIL-7021',
    part: 'Brake Caliper Mounting Bracket',
    orderedQty: 200,
    shippedQty: 200,
    promisedDate: '2026-09-21T18:00',
    actualOut: '2026-09-21T17:30',
    vehicle: 'HR-26-BQ-1190',
    delayReason: '' as DelayReason,
    notes: 'Direct JIT dock feed (Zero defect batch)',
    isValid: true,
    errors: []
  },
  {
    customer: 'Ashok Leyland line',
    po: 'PO-ALL-5520',
    part: 'Flywheel Housing Ring Flange',
    orderedQty: 80,
    shippedQty: 50,
    promisedDate: '2026-09-22T11:00',
    actualOut: '2026-09-22T10:50',
    vehicle: 'TN-04-E-8812',
    delayReason: 'Material short' as DelayReason,
    notes: 'Quantity Shortage (50/80): Raw ductile iron casting batch delay from foundry',
    isValid: true,
    errors: []
  },
  {
    customer: 'Royal Enfield supplier',
    po: 'PO-RE-3391',
    part: 'Gear Shift Selector Fork',
    orderedQty: 300,
    shippedQty: 300,
    promisedDate: '2026-09-22T16:00',
    actualOut: '2026-09-22T19:30',
    vehicle: 'TN-11-F-3342',
    delayReason: 'QC hold' as DelayReason,
    notes: '3.5 hr Gate Delay: CMM hardness testing re-validation after tooling change',
    isValid: true,
    errors: []
  },
  {
    customer: 'Tata Motors line',
    po: 'PO-TML-4412',
    part: 'Steering Knuckle Pivot Pin',
    orderedQty: 150,
    shippedQty: 150,
    promisedDate: '2026-09-23T12:00',
    actualOut: '2026-09-23T11:20',
    vehicle: 'GJ-01-AX-9921',
    delayReason: '' as DelayReason,
    notes: 'Clean Pass: Dispatched 40 mins ahead of plant cut-off',
    isValid: true,
    errors: []
  },
  {
    customer: 'Hyundai vendor park',
    po: 'PO-HMI-8815',
    part: 'Exhaust Hanger Flange Bracket',
    orderedQty: 250,
    shippedQty: 180,
    promisedDate: '2026-09-23T17:00',
    actualOut: '2026-09-23T20:45',
    vehicle: 'TN-21-AZ-4410',
    delayReason: 'Labour short' as DelayReason,
    notes: 'Double Breach: Short 70 pcs & 3hr 45m late due to shift absenteeism',
    isValid: true,
    errors: []
  },
  {
    customer: 'Mahindra Chakan',
    po: 'PO-MM-6120',
    part: 'Axle Differential Spacer Shim',
    orderedQty: 100,
    shippedQty: 100,
    promisedDate: '2026-09-24T10:00',
    actualOut: '2026-09-24T09:30',
    vehicle: 'MH-14-GH-5544',
    delayReason: '' as DelayReason,
    notes: 'Pass: Laser engraved batch inspection signed off',
    isValid: true,
    errors: []
  },
  {
    customer: 'Bosch Mobility',
    po: 'PO-BOSCH-902',
    part: 'Fuel Rail Adapter M14',
    orderedQty: 500,
    shippedQty: 500,
    promisedDate: '2026-09-24T15:00',
    actualOut: '2026-09-24T17:15',
    vehicle: 'KA-04-ME-3120',
    delayReason: 'No vehicle' as DelayReason,
    notes: '2hr 15m Gate Delay: Dedicated transporter truck had highway tyre failure',
    isValid: true,
    errors: []
  },
  {
    customer: 'Local Tier-2',
    po: 'PO-LOC-1102',
    part: 'Spacer Bushing 25mm OD',
    orderedQty: 400,
    shippedQty: 400,
    promisedDate: '2026-09-25T11:00',
    actualOut: '2026-09-25T10:40',
    vehicle: 'TN-02-CC-8761',
    delayReason: '' as DelayReason,
    notes: 'Pass: Sub-assembly supplier prompt turnaround',
    isValid: true,
    errors: []
  },
  {
    customer: 'Ashok Leyland line',
    po: 'WA-AL-EMERG-04',
    part: 'Radiator Lower Bracket Assy',
    orderedQty: 60,
    shippedQty: 60,
    promisedDate: '2026-09-25T14:00',
    actualOut: '2026-09-25T13:15',
    vehicle: 'TN-70-H-1904',
    delayReason: '' as DelayReason,
    notes: 'WhatsApp Emergency Rush PO: Fabricated in 4 hrs, cleared gate 45m early',
    isValid: true,
    errors: []
  }
];

export const SAMPLE_LINE_STOP_DATASET = [
  {
    customer: 'Hyundai vendor park',
    po: 'PO-HMI-CRISIS-1',
    part: 'Sub-Frame Cross Member Bolt',
    orderedQty: 500,
    shippedQty: 250,
    promisedDate: '2026-09-22T08:00',
    actualOut: '2026-09-22T13:00',
    vehicle: 'TN-21-AZ-9999',
    delayReason: 'Material short' as DelayReason,
    notes: 'CRITICAL LINE-STOP RISK: 5-hour late gate out + 50% under-delivery due to forge breakdown',
    isValid: true,
    errors: []
  },
  {
    customer: 'Maruti Suzuki Manesar',
    po: 'PO-MSIL-CRISIS-2',
    part: 'Transmission Output Flange',
    orderedQty: 180,
    shippedQty: 180,
    promisedDate: '2026-09-22T12:00',
    actualOut: '2026-09-22T17:30',
    vehicle: 'HR-26-BQ-4411',
    delayReason: 'QC hold' as DelayReason,
    notes: '5.5 hr Delay: Metallurgical surface crack audit held at gate',
    isValid: true,
    errors: []
  },
  {
    customer: 'Ashok Leyland line',
    po: 'PO-ALL-CRISIS-3',
    part: 'Propeller Shaft Center Bearing Cage',
    orderedQty: 90,
    shippedQty: 45,
    promisedDate: '2026-09-23T09:00',
    actualOut: '2026-09-23T14:15',
    vehicle: 'TN-04-E-1122',
    delayReason: 'Paperwork' as DelayReason,
    notes: '5h 15m Delay + 50% Short: E-Way bill portal server outage at security dispatch',
    isValid: true,
    errors: []
  },
  {
    customer: 'Royal Enfield supplier',
    po: 'PO-RE-CRISIS-4',
    part: 'Sprocket Carrier Hub',
    orderedQty: 220,
    shippedQty: 220,
    promisedDate: '2026-09-23T14:00',
    actualOut: '2026-09-23T13:30',
    vehicle: 'TN-11-F-7788',
    delayReason: '' as DelayReason,
    notes: 'On-Time In-Full: Dedicated expedited express tempo bypass',
    isValid: true,
    errors: []
  },
  {
    customer: 'Hyundai vendor park',
    po: 'PO-HMI-CRISIS-5',
    part: 'Front Brake Disc Shield',
    orderedQty: 300,
    shippedQty: 150,
    promisedDate: '2026-09-24T10:00',
    actualOut: '2026-09-24T09:45',
    vehicle: 'TN-21-AZ-8812',
    delayReason: 'Material short' as DelayReason,
    notes: 'Partial Delivery (150/300): Sheet metal stamping press tooling break',
    isValid: true,
    errors: []
  },
  {
    customer: 'Maruti Suzuki Manesar',
    po: 'PO-MSIL-CRISIS-6',
    part: 'Catalytic Converter Bracket',
    orderedQty: 100,
    shippedQty: 100,
    promisedDate: '2026-09-24T15:00',
    actualOut: '2026-09-24T14:40',
    vehicle: 'HR-26-BQ-9910',
    delayReason: '' as DelayReason,
    notes: 'On-Time In-Full: Cleared 20 min before shift gate closure',
    isValid: true,
    errors: []
  }
];

export const SAMPLE_ZERO_DEFECT_DATASET = [
  {
    customer: 'Hyundai vendor park',
    po: 'PO-HMI-GOLD-01',
    part: 'Lower Arm Front LH',
    orderedQty: 200,
    shippedQty: 200,
    promisedDate: '2026-09-21T11:00',
    actualOut: '2026-09-21T10:30',
    vehicle: 'TN-21-AZ-1100',
    delayReason: '' as DelayReason,
    notes: 'Pristine dispatch: Zero defects, cleared gate 30m early',
    isValid: true,
    errors: []
  },
  {
    customer: 'Maruti Suzuki Manesar',
    po: 'PO-MSIL-GOLD-02',
    part: 'Brake Caliper Bracket RH',
    orderedQty: 150,
    shippedQty: 150,
    promisedDate: '2026-09-21T15:00',
    actualOut: '2026-09-21T14:20',
    vehicle: 'HR-26-BQ-2200',
    delayReason: '' as DelayReason,
    notes: 'Pristine dispatch: Cleared 40m before dock cut-off',
    isValid: true,
    errors: []
  },
  {
    customer: 'Ashok Leyland line',
    po: 'PO-ALL-GOLD-03',
    part: 'Flywheel Cover Ring',
    orderedQty: 80,
    shippedQty: 80,
    promisedDate: '2026-09-22T10:00',
    actualOut: '2026-09-22T09:45',
    vehicle: 'TN-04-E-3300',
    delayReason: '' as DelayReason,
    notes: 'Pristine dispatch: 100% quantity verified by QA barcoder',
    isValid: true,
    errors: []
  },
  {
    customer: 'Royal Enfield supplier',
    po: 'PO-RE-GOLD-04',
    part: 'Handlebar Cross Clamps',
    orderedQty: 250,
    shippedQty: 250,
    promisedDate: '2026-09-22T14:00',
    actualOut: '2026-09-22T13:35',
    vehicle: 'TN-11-F-4400',
    delayReason: '' as DelayReason,
    notes: 'Pristine dispatch: Cleared security gate 25m early',
    isValid: true,
    errors: []
  },
  {
    customer: 'Tata Motors line',
    po: 'PO-TML-GOLD-05',
    part: 'Tie Rod End Housing',
    orderedQty: 120,
    shippedQty: 120,
    promisedDate: '2026-09-23T11:30',
    actualOut: '2026-09-23T11:00',
    vehicle: 'GJ-01-AX-5500',
    delayReason: '' as DelayReason,
    notes: 'Pristine dispatch: Full Lot acceptance certificate attached',
    isValid: true,
    errors: []
  },
  {
    customer: 'Local Tier-2',
    po: 'PO-LOC-GOLD-06',
    part: 'Pin Bushing 18mm',
    orderedQty: 300,
    shippedQty: 300,
    promisedDate: '2026-09-23T16:00',
    actualOut: '2026-09-23T15:30',
    vehicle: 'TN-02-CC-6600',
    delayReason: '' as DelayReason,
    notes: 'Pristine dispatch: Zero hold, 100% OTIF compliance',
    isValid: true,
    errors: []
  }
];

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImportDispatches,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<ParsedPreviewRow[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCsv, setCopiedCsv] = useState(false);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const templateData = SAMPLE_AUTOMOTIVE_DATASET.map(row => ({
      'Customer': row.customer,
      'PO Number': row.po,
      'Part Description': row.part,
      'Ordered Qty': row.orderedQty,
      'Shipped Qty': row.shippedQty,
      'Promised Date Time': row.promisedDate.replace('T', ' '),
      'Actual Gate Out': row.actualOut.replace('T', ' '),
      'Vehicle Plate': row.vehicle,
      'Delay Reason': row.delayReason,
      'Notes': row.notes
    }));

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dispatches_Template');
    XLSX.writeFile(wb, 'OTIF_Dispatch_Register_Bulk_Template.xlsx');
  };

  const handleDownloadCSV = () => {
    const headers = 'Customer,PO Number,Part Description,Ordered Qty,Shipped Qty,Promised Date Time,Actual Gate Out,Vehicle Plate,Delay Reason,Notes\n';
    const rows = SAMPLE_AUTOMOTIVE_DATASET.map(r => 
      `"${r.customer}","${r.po}","${r.part}",${r.orderedQty},${r.shippedQty},"${r.promisedDate.replace('T', ' ')}","${r.actualOut.replace('T', ' ')}","${r.vehicle}","${r.delayReason}","${r.notes}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'OTIF_Dispatch_Sample_Dataset.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCSV = () => {
    const headers = 'Customer,PO Number,Part Description,Ordered Qty,Shipped Qty,Promised Date Time,Actual Gate Out,Vehicle Plate,Delay Reason,Notes\n';
    const rows = SAMPLE_AUTOMOTIVE_DATASET.map(r => 
      `"${r.customer}","${r.po}","${r.part}",${r.orderedQty},${r.shippedQty},"${r.promisedDate.replace('T', ' ')}","${r.actualOut.replace('T', ' ')}","${r.vehicle}","${r.delayReason}","${r.notes}"`
    ).join('\n');
    navigator.clipboard.writeText(headers + rows);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2500);
  };

  const handleLoadSampleDataset = (dataset: ParsedPreviewRow[]) => {
    setErrorMsg(null);
    setFile(null);
    setPreviewRows(dataset);
  };

  const normalizeDate = (val: any): string => {
    if (!val) return '2026-09-20T12:00';
    if (typeof val === 'number') {
      // Excel serial date
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      return date.toISOString().slice(0, 16);
    }
    const str = String(val).trim();
    if (str.includes('T')) return str.slice(0, 16);
    // Replace space with T if YYYY-MM-DD HH:mm
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(str)) {
      return str.replace(/\s+/, 'T').slice(0, 16);
    }
    // Fallback if Date parses
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 16);
    }
    return '2026-09-20T12:00';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setErrorMsg(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setErrorMsg('The selected spreadsheet contains no data rows.');
          setIsProcessing(false);
          return;
        }

        const validReasons: DelayReason[] = [
          'Material short',
          'QC hold',
          'No vehicle',
          'Labour short',
          'Paperwork',
          'Customer hold',
          ''
        ];

        const parsed: ParsedPreviewRow[] = rawJson.map((row) => {
          // Flexible column key resolver (case-insensitive & fuzzy)
          const findKey = (candidates: string[]): any => {
            for (const key of Object.keys(row)) {
              const clean = key.toLowerCase().replace(/[^a-z0-9]/g, '');
              for (const cand of candidates) {
                if (clean.includes(cand)) return row[key];
              }
            }
            return '';
          };

          const customer = String(findKey(['cust', 'client', 'buyer']) || row['Customer'] || 'OEM Customer').trim();
          const po = String(findKey(['po', 'order', 'purchase']) || row['PO Number'] || `PO-${Math.floor(1000 + Math.random() * 9000)}`).trim();
          const part = String(findKey(['part', 'item', 'desc', 'product']) || row['Part Description'] || 'Industrial Component').trim();
          const orderedQty = Math.max(1, Number(findKey(['orderqty', 'ordered', 'targetqty']) || row['Ordered Qty']) || 100);
          const shippedQty = Math.max(0, Number(findKey(['shipqty', 'shipped', 'actualqty', 'dispatchqty']) || row['Shipped Qty']) || orderedQty);
          
          const promisedDate = normalizeDate(findKey(['promis', 'sched', 'duedate', 'expected']) || row['Promised Date Time']);
          const actualOut = normalizeDate(findKey(['actual', 'gateout', 'outtime', 'dispatchtime']) || row['Actual Gate Out']);
          const vehicle = String(findKey(['veh', 'truck', 'plate', 'lorry']) || row['Vehicle Plate'] || 'TN-GATE-01').trim();
          
          let rawReason = String(findKey(['reason', 'delay', 'cause']) || row['Delay Reason'] || '').trim();
          let delayReason: DelayReason = '';
          for (const vr of validReasons) {
            if (vr && rawReason.toLowerCase().includes(vr.toLowerCase())) {
              delayReason = vr;
              break;
            }
          }

          const notes = String(findKey(['note', 'remark', 'comment']) || row['Notes'] || '').trim();

          const errors: string[] = [];
          if (!customer) errors.push('Customer missing');
          if (orderedQty <= 0) errors.push('Ordered Qty must be > 0');

          return {
            customer,
            po,
            part,
            orderedQty,
            shippedQty,
            promisedDate,
            actualOut,
            vehicle,
            delayReason,
            notes,
            isValid: errors.length === 0,
            errors,
          };
        });

        setPreviewRows(parsed);
      } catch (err: any) {
        console.error('File parsing error:', err);
        setErrorMsg('Failed to parse file. Please upload a valid .xlsx or .csv dispatch spreadsheet.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(uploadedFile);
  };

  const handleConfirmImport = () => {
    if (previewRows.length === 0) return;

    const formattedRows: DispatchRow[] = previewRows.map((r, idx) => ({
      id: `disp-imp-${Date.now()}-${idx}`,
      customer: r.customer,
      po: r.po,
      part: r.part,
      orderedQty: r.orderedQty,
      shippedQty: r.shippedQty,
      promisedDate: r.promisedDate,
      actualOut: r.actualOut,
      vehicle: r.vehicle,
      delayReason: r.delayReason,
      notes: r.notes,
    }));

    onImportDispatches(formattedRows, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Excel &amp; CSV Bulk Dispatch Importer</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Instant ERP Sync
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload today's gate register or SAP/Tally export (.xlsx, .csv) with automatic column mapping.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Pre-loaded Test Datasets (1-Click Evaluation) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 via-slate-950 to-slate-950 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Pre-built Test Datasets (Instant 1-Click Evaluation)
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready to Test
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleCopyCSV}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-md font-mono text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedCsv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedCsv ? 'Copied CSV!' : 'Copy Raw CSV'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-md font-mono text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download .csv</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Click any scenario below to immediately load authentic factory dispatches into the preview, verify calculations, and push into the live dashboard:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleLoadSampleDataset(SAMPLE_AUTOMOTIVE_DATASET)}
                className="p-3 bg-slate-900 hover:bg-slate-850 hover:border-indigo-500/50 border border-slate-800 rounded-xl text-left transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200">
                    1. Tier-1 Automotive Mix
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                    10 Dispatches
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Hyundai, Maruti, Ashok Leyland, RE &amp; Bosch. Contains 6 passes, QC holds, material delay &amp; WhatsApp rush PO.
                </p>
                <div className="mt-2 text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <span>Load into Preview →</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSampleDataset(SAMPLE_LINE_STOP_DATASET)}
                className="p-3 bg-slate-900 hover:bg-slate-850 hover:border-rose-500/50 border border-slate-800 rounded-xl text-left transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-rose-300 group-hover:text-rose-200">
                    2. Line-Stop Crisis Test
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400">
                    6 Dispatches
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  High penalty stress test. 4 severe failures: 5hr gate delay, 50% under-delivery, press tooling break &amp; portal outage.
                </p>
                <div className="mt-2 text-[10px] font-bold text-rose-400 flex items-center gap-1">
                  <span>Load into Preview →</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSampleDataset(SAMPLE_ZERO_DEFECT_DATASET)}
                className="p-3 bg-slate-900 hover:bg-slate-850 hover:border-emerald-500/50 border border-slate-800 rounded-xl text-left transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
                    3. 100% Zero-Defect Benchmark
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    6 Dispatches
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Gold standard factory performance. All dispatches 100% on-time, in-full with zero security gate delays.
                </p>
                <div className="mt-2 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <span>Load into Preview →</span>
                </div>
              </button>
            </div>
          </div>

          {/* Top Actions: Template Download & Drag-drop */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-5 text-center bg-slate-950/60 transition group relative cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 text-slate-300 group-hover:text-emerald-400 flex items-center justify-center transition">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-sm font-semibold text-white">
                  {file ? file.name : 'Click to select or drag & drop factory dispatch file'}
                </div>
                <div className="text-xs text-slate-400">
                  Supports Microsoft Excel (.xlsx, .xls) and CSV exports from SAP, Tally, or Google Sheets
                </div>
              </div>
            </div>

            {/* Template download helper */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Standard Format
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Download our pre-built factory dispatch template pre-filled with test data for instant testing.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="mt-3 w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Download Template (.xlsx)</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Import Mode Radio Switch */}
          {previewRows.length > 0 && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">Import Action Mode:</span>
                <span className="text-[11px] text-slate-400">
                  Choose whether to replace existing fortnight records or append newly cleared loads.
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition cursor-pointer ${
                    importMode === 'replace'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Replace Current Register ({previewRows.length} rows)
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('append')}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition cursor-pointer ${
                    importMode === 'append'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Append as New Records
                </button>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {previewRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold">
                  Parsed Data Preview ({previewRows.length} dispatch rows detected):
                </span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {previewRows.filter(r => r.isValid).length} of {previewRows.length} lines verified
                </span>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Customer</th>
                      <th className="py-2 px-3">PO &amp; Part</th>
                      <th className="py-2 px-3">Qty (Ship/Ord)</th>
                      <th className="py-2 px-3">Promised Date</th>
                      <th className="py-2 px-3">Gate Out</th>
                      <th className="py-2 px-3">Vehicle</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                    {previewRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                        <td className="py-2 px-3 font-semibold text-white">{r.customer}</td>
                        <td className="py-2 px-3 text-slate-300">
                          <div>{r.po}</div>
                          <div className="text-[10px] text-slate-500">{r.part}</div>
                        </td>
                        <td className="py-2 px-3">
                          <span className={r.shippedQty >= r.orderedQty ? 'text-emerald-400' : 'text-amber-400'}>
                            {r.shippedQty}
                          </span>
                          <span className="text-slate-500"> / {r.orderedQty}</span>
                        </td>
                        <td className="py-2 px-3 text-slate-400">{r.promisedDate.replace('T', ' ')}</td>
                        <td className="py-2 px-3 text-slate-400">{r.actualOut.replace('T', ' ')}</td>
                        <td className="py-2 px-3 text-slate-300 font-semibold">{r.vehicle}</td>
                        <td className="py-2 px-3">
                          {r.isValid ? (
                            <span className="text-emerald-400 text-[11px] font-bold">✓ Ready</span>
                          ) : (
                            <span className="text-rose-400 text-[11px] font-bold">⚠️ Fix</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              {previewRows.length > 0 ? `${previewRows.length} loads ready for engine ingestion` : 'Awaiting file'}
            </span>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={previewRows.length === 0 || isProcessing}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Import Dispatches to Engine</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
