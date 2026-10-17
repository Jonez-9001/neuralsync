import React, { useState } from 'react';
import { 
  X, 
  ArrowLeft, 
  AlertTriangle, 
  PackageX, 
  Layers, 
  Clock, 
  Truck, 
  CheckCircle2, 
  IndianRupee, 
  FileSpreadsheet,
  Download,
  Share2,
  Calendar,
  Send,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { 
  MondayTowerData, 
  SKUItem, 
  LateOrder, 
  FreightTrip, 
  UnpaidBill, 
  DeadStockItem,
  Language 
} from '../types';
import { 
  SAMPLE_STOCKOUT_SKUS, 
  SAMPLE_LATE_ORDERS, 
  SAMPLE_FREIGHT_TRIPS, 
  SAMPLE_UNPAID_BILLS, 
  SAMPLE_DEAD_STOCK 
} from '../data/sampleData';
import { formatINR, formatPercent } from '../utils/formatters';

interface ProjectDrillDownModalProps {
  projectId: number | null;
  onClose: () => void;
  towerData: MondayTowerData;
  isDarkMode: boolean;
  language: Language;
}

export const ProjectDrillDownModal: React.FC<ProjectDrillDownModalProps> = ({
  projectId,
  onClose,
  towerData,
  isDarkMode,
  language,
}) => {
  if (!projectId) return null;

  const freightPerTrip = towerData.tripsCount > 0 
    ? towerData.freightPaidRupees / towerData.tripsCount 
    : 0;
  
  const otifPercent = towerData.dispatchesCount > 0 
    ? (towerData.otifPassesCount / towerData.dispatchesCount) * 100 
    : 0;

  const projectMeta = [
    {
      id: 1,
      title: 'Dead Cash Inventory (Project 1)',
      headline: `₹${towerData.deadCashRupees.toLocaleString('en-IN')}`,
      sub: 'Rupees in items that have not moved for 180 days. Refreshed only when a new stock file arrives.',
      icon: PackageX,
      color: 'text-rose-400',
    },
    {
      id: 2,
      title: 'Stockout Risk (Project 4 / P1 Opposite)',
      headline: `${towerData.stockoutRiskCount} SKUs`,
      sub: 'Important A-items or fast movers with less than two weeks of use left on the shelf. Counted SKUs, not rupees.',
      icon: Layers,
      color: 'text-amber-400',
    },
    {
      id: 3,
      title: 'Orders Late (Project 2 Clock Fail)',
      headline: `${towerData.ordersLateCount} of ${towerData.dispatchesCount} Dispatches`,
      sub: 'Loads that missed the promised dispatch time. Pure clock fail, separate from quantity shortages.',
      icon: Clock,
      color: 'text-orange-400',
    },
    {
      id: 4,
      title: 'Freight per Trip (Project 3 Lane Economics)',
      headline: `₹${Math.round(freightPerTrip).toLocaleString('en-IN')}`,
      sub: `Freight paid (${formatINR(towerData.freightPaidRupees)}) divided by ${towerData.tripsCount} trips. Compared with his own previous Monday.`,
      icon: Truck,
      color: 'text-yellow-400',
    },
    {
      id: 5,
      title: 'OTIF (Project 2 Strict Pass/Fail)',
      headline: `${Math.round(otifPercent)}% (${towerData.otifPassesCount} / ${towerData.dispatchesCount})`,
      sub: 'Passes divided by dispatches. Strict rule: late full load and on-time short load both fail.',
      icon: CheckCircle2,
      color: 'text-purple-400',
    },
    {
      id: 6,
      title: 'Unpaid Bills (Tally Outstandings)',
      headline: `₹${towerData.unpaidBillsRupees.toLocaleString('en-IN')}`,
      sub: `Customers holding cash older than normal credit (${towerData.normalCreditDays} days). Excludes current week invoices.`,
      icon: IndianRupee,
      color: 'text-red-400',
    },
  ];

  const currentMeta = projectMeta.find(m => m.id === projectId) || projectMeta[0];
  const Icon = currentMeta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
        isDarkMode 
          ? 'bg-neutral-900 border-neutral-800 text-neutral-100' 
          : 'bg-white border-neutral-200 text-neutral-900'
      }`}>
        {/* Modal Top Bar */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-4 ${
          isDarkMode ? 'bg-neutral-950/80 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-neutral-800 border border-neutral-700 ${currentMeta.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {towerData.clientName}
                </span>
                <span className="text-xs text-neutral-500">
                  Week Ending: {towerData.weekEndingDate}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                {currentMeta.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 transition-colors"
            title="Close drill-down"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Subhead Banner */}
        <div className={`px-5 py-3 border-b text-xs flex flex-wrap items-center justify-between gap-2 ${
          isDarkMode ? 'bg-neutral-950/40 border-neutral-800' : 'bg-neutral-100/50 border-neutral-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-amber-400">
              {currentMeta.headline}
            </span>
            <span className="text-neutral-400 hidden sm:inline">—</span>
            <span className="text-neutral-400">{currentMeta.sub}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const csvData = `Project Drill-Down Export: ${currentMeta.title}\nClient: ${towerData.clientName}\nWeek: ${towerData.weekEndingDate}\nValue: ${currentMeta.headline}`;
                const blob = new Blob([csvData], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `project-${projectId}-breakdown.csv`;
                a.click();
              }}
              className="px-2.5 py-1 text-xs rounded border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 flex items-center gap-1.5 font-medium transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* PROJECT 1: Dead Cash */}
          {projectId === 1 && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
                isDarkMode ? 'bg-neutral-950 border-neutral-800 text-neutral-300' : 'bg-amber-50/50 border-amber-200 text-neutral-800'
              }`}>
                <p className="font-semibold text-amber-400">Project 1 Ground Rules:</p>
                <p>
                  Rupees in items that have not moved for 180 days. Refresh it only when he sends a new stock file. 
                  Do not invent a new dead number every Monday from memory. If the file has not changed, the number stays, and you say so.
                </p>
                <p className="text-neutral-500 pt-1 font-mono">
                  Current Status: File unchanged since 28 Sep 2026. Prior count retained.
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-neutral-800">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b font-mono ${isDarkMode ? 'bg-neutral-950 text-neutral-400 border-neutral-800' : 'bg-neutral-100 text-neutral-700 border-neutral-300'}`}>
                    <tr>
                      <th className="py-2.5 px-3">Part No & Description</th>
                      <th className="py-2.5 px-3">Storage Location</th>
                      <th className="py-2.5 px-3 text-right">Idle Days</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Dead Rupees</th>
                      <th className="py-2.5 px-3">Resolution Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono">
                    {SAMPLE_DEAD_STOCK.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-semibold text-neutral-200">{item.partNo}</div>
                          <div className="text-[11px] text-neutral-500 font-sans">{item.description}</div>
                        </td>
                        <td className="py-2.5 px-3 text-neutral-400">{item.locationBin}</td>
                        <td className="py-2.5 px-3 text-right text-rose-400 font-bold">{item.daysIdle}d</td>
                        <td className="py-2.5 px-3 text-right">{item.qty}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-neutral-200">{formatINR(item.totalValueRupees)}</td>
                        <td className="py-2.5 px-3 font-sans">
                          <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-amber-300">
                            {item.recommendation}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t-2 border-neutral-700 bg-neutral-950/50">
                      <td colSpan={4} className="py-3 px-3 text-right font-sans">Total 180+ Day Dead Cash:</td>
                      <td className="py-3 px-3 text-right text-rose-400 text-sm">{formatINR(towerData.deadCashRupees)}</td>
                      <td className="py-3 px-3 text-[11px] text-neutral-400 font-sans">4 idle SKU lines</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PROJECT 2 / 4: Stockout Risk */}
          {projectId === 2 && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
                isDarkMode ? 'bg-neutral-950 border-neutral-800 text-neutral-300' : 'bg-amber-50/50 border-amber-200 text-neutral-800'
              }`}>
                <p className="font-semibold text-amber-400">Stockout Risk Definition:</p>
                <p>
                  This is the opposite of dead stock. An important item with less than two weeks of use left on the shelf. 
                  You count SKUs, not rupees. He needs to buy, not admire a chart. 
                  "Important" means an A-item or a fast mover. Four means four parts may run out inside a fortnight. You do not guess this. You count them.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SAMPLE_STOCKOUT_SKUS.map((sku) => (
                  <div 
                    key={sku.id} 
                    className={`p-4 rounded-xl border ${
                      sku.urgency === 'critical'
                        ? 'border-red-800/80 bg-red-950/20'
                        : 'border-amber-800/80 bg-amber-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs text-neutral-200">{sku.partNumber}</span>
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        sku.urgency === 'critical' 
                          ? 'bg-red-500/10 text-red-400 border-red-500/30' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {sku.daysRemaining} days left
                      </span>
                    </div>

                    <h4 className="font-semibold text-xs text-neutral-100 mb-2">
                      {sku.description}
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-neutral-400 mb-3 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800">
                      <div>Stock: <strong className="text-white">{sku.stockOnHand} {sku.unit}</strong></div>
                      <div>Burn rate: <strong className="text-white">{sku.dailyBurnRate} {sku.unit}/day</strong></div>
                      <div>Lead time: <strong className="text-amber-400">{sku.leadTimeDays} days</strong></div>
                      <div>Category: <strong className="text-white">{sku.category}</strong></div>
                    </div>

                    <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                      <span>Vendor: {sku.supplier}</span>
                      <button 
                        onClick={() => alert(`PO Reorder triggered for ${sku.partNumber} to ${sku.supplier}`)}
                        className="text-amber-400 hover:text-amber-300 font-semibold underline text-xs"
                      >
                        Raise PO ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROJECT 3: Orders Late */}
          {projectId === 3 && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
                isDarkMode ? 'bg-neutral-950 border-neutral-800 text-neutral-300' : 'bg-orange-50/50 border-orange-200 text-neutral-800'
              }`}>
                <p className="font-semibold text-orange-400">Orders Late (Project 2 Clock Test):</p>
                <p>
                  A late load missed the promised time. It is not the same as an OTIF fail. 
                  OTIF also fails a short load that left on time. Late is only the clock. 
                  Seven late out of 18 dispatches is the line.
                </p>
              </div>

              <div className="space-y-2.5">
                {SAMPLE_LATE_ORDERS.map((ord) => (
                  <div 
                    key={ord.id}
                    className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/60 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">{ord.orderNumber}</span>
                        <span className="text-neutral-400">·</span>
                        <span className="font-medium text-neutral-200">{ord.customer}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        Route: {ord.destination} · Carrier: {ord.carrier} ({ord.vehicleNo})
                      </div>
                      <div className="text-rose-400 text-[11px]">
                        <strong>Root Cause:</strong> {ord.reason}
                      </div>
                    </div>

                    <div className="text-right font-mono text-[11px] shrink-0">
                      <div className="text-neutral-400">Promised: {ord.promisedTime}</div>
                      <div className="text-neutral-400">Actual: {ord.actualDepartureTime}</div>
                      <div className="text-rose-400 font-bold">Delay: +{ord.delayMinutes} mins</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROJECT 4: Freight per Trip */}
          {projectId === 4 && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
                isDarkMode ? 'bg-neutral-950 border-neutral-800 text-neutral-300' : 'bg-yellow-50/50 border-yellow-200 text-neutral-800'
              }`}>
                <p className="font-semibold text-yellow-400">Freight per Trip (Project 3 Economics):</p>
                <p>
                  Freight paid divided by trips. The sample inputs are ₹58,000 over 12 trips (₹4,833/trip). 
                  A rise against last Monday means the lane got dearer or the loads got smaller. 
                  Compare it with his own previous Monday (₹4,420), not with a national freight average.
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-neutral-800">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b font-mono ${isDarkMode ? 'bg-neutral-950 text-neutral-400 border-neutral-800' : 'bg-neutral-100 text-neutral-700 border-neutral-300'}`}>
                    <tr>
                      <th className="py-2.5 px-3">Trip & Date</th>
                      <th className="py-2.5 px-3">Lane Corridor</th>
                      <th className="py-2.5 px-3">Carrier / Vehicle Type</th>
                      <th className="py-2.5 px-3 text-right">Tons</th>
                      <th className="py-2.5 px-3 text-right">Utilization</th>
                      <th className="py-2.5 px-3 text-right">Freight Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono">
                    {SAMPLE_FREIGHT_TRIPS.map((trip) => (
                      <tr key={trip.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-2 px-3">
                          <div className="font-bold text-neutral-200">{trip.tripNumber}</div>
                          <div className="text-[10px] text-neutral-500">{trip.date}</div>
                        </td>
                        <td className="py-2 px-3 text-neutral-300 font-sans">{trip.route}</td>
                        <td className="py-2 px-3 text-neutral-400 font-sans">
                          {trip.carrier} <span className="text-neutral-500">({trip.truckType})</span>
                        </td>
                        <td className="py-2 px-3 text-right text-neutral-300">{trip.weightTons} T</td>
                        <td className="py-2 px-3 text-right text-neutral-300">{trip.utilizationPct}%</td>
                        <td className="py-2 px-3 text-right font-bold text-amber-400">{formatINR(trip.costRupees)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t-2 border-neutral-700 bg-neutral-950/50">
                      <td colSpan={3} className="py-3 px-3 text-right font-sans">12 Trips Total Freight:</td>
                      <td colSpan={2} className="py-3 px-3 text-right font-sans">Avg Cost per Trip:</td>
                      <td className="py-3 px-3 text-right text-amber-400 text-sm">{formatINR(Math.round(freightPerTrip))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PROJECT 5: OTIF */}
          {projectId === 5 && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
                isDarkMode ? 'bg-neutral-950 border-neutral-800 text-neutral-300' : 'bg-purple-50/50 border-purple-200 text-neutral-800'
              }`}>
                <p className="font-semibold text-purple-400">Strict OTIF (Project 2 Standard):</p>
                <p>
                  OTIF is 50%. Passes divided by dispatches. Nine passes out of 18. 
                  Same definition as Project 2. Do not soften it here. 
                  A late full load and an on-time short load both fail.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-4 rounded-xl border border-emerald-800/60 bg-emerald-950/20">
                  <div className="text-2xl font-bold font-mono text-emerald-400">9 Passes</div>
                  <div className="text-xs text-neutral-400 mt-1">On-Time & In-Full (50%)</div>
                </div>
                <div className="p-4 rounded-xl border border-orange-800/60 bg-orange-950/20">
                  <div className="text-2xl font-bold font-mono text-orange-400">7 Time Fails</div>
                  <div className="text-xs text-neutral-400 mt-1">Left past promised clock</div>
                </div>
                <div className="p-4 rounded-xl border border-rose-800/60 bg-rose-950/20">
                  <div className="text-2xl font-bold font-mono text-rose-400">2 Quantity Fails</div>
                  <div className="text-xs text-neutral-400 mt-1">On-time but short shipped</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 text-xs space-y-2">
                <h4 className="font-semibold text-neutral-200">Why OTIF dropped from 62.5% to 50%:</h4>
                <ul className="list-disc list-inside space-y-1 text-neutral-400">
                  <li>Bay 2 crane failure pushed 2 morning dispatches into 2+ hour delays.</li>
                  <li>Koyambedu flyover bottleneck delayed the Hosur inter-city vehicle by 165 minutes.</li>
                  <li>Customer QA inspector held Royal Enfield truck at gate for 90 minutes over missing hardness cert.</li>
                </ul>
              </div>
            </div>
          )}

          {/* PROJECT 6: Unpaid Bills */}
          {projectId === 6 && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
                isDarkMode ? 'bg-neutral-950 border-neutral-800 text-neutral-300' : 'bg-red-50/50 border-red-200 text-neutral-800'
              }`}>
                <p className="font-semibold text-red-400">Unpaid Bills (Tally Outstandings):</p>
                <p>
                  Customers who have the goods and have not paid. Cash blocked outside the factory. 
                  Only bills older than his normal credit days ({towerData.normalCreditDays} days). 
                  Do not include this week's invoices. If his credit is 30 days, a bill from last Thursday is not in this number. 
                  This one comes from Tally outstandings, not from Projects 1 to 4.
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-neutral-800">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b font-mono ${isDarkMode ? 'bg-neutral-950 text-neutral-400 border-neutral-800' : 'bg-neutral-100 text-neutral-700 border-neutral-300'}`}>
                    <tr>
                      <th className="py-2.5 px-3">Invoice & Customer</th>
                      <th className="py-2.5 px-3">Invoice Date</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-right">Days Overdue</th>
                      <th className="py-2.5 px-3 text-right">Blocked Cash</th>
                      <th className="py-2.5 px-3">Collection Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono">
                    {SAMPLE_UNPAID_BILLS.map((bill) => (
                      <tr key={bill.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-bold text-neutral-200">{bill.customerName}</div>
                          <div className="text-[11px] text-neutral-500 font-mono">{bill.invoiceNo} · {bill.tallyLedger}</div>
                        </td>
                        <td className="py-2.5 px-3 text-neutral-400">{bill.invoiceDate}</td>
                        <td className="py-2.5 px-3 text-neutral-400">{bill.dueDate}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-400">+{bill.daysOverdue}d</td>
                        <td className="py-2.5 px-3 text-right font-bold text-white">{formatINR(bill.amountRupees)}</td>
                        <td className="py-2.5 px-3 font-sans">
                          <button
                            onClick={() => alert(`WhatsApp payment reminder dispatched for ${bill.invoiceNo} (${formatINR(bill.amountRupees)})`)}
                            className="px-2 py-1 text-[11px] font-medium rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Remind</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t-2 border-neutral-700 bg-neutral-950/50">
                      <td colSpan={4} className="py-3 px-3 text-right font-sans">Total Overdue ({`>${towerData.normalCreditDays}d`}):</td>
                      <td className="py-3 px-3 text-right text-rose-400 text-sm font-mono">{formatINR(towerData.unpaidBillsRupees)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 text-xs ${
          isDarkMode ? 'bg-neutral-950/80 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <div className="text-neutral-500 flex items-center gap-2">
            <span>Client: {towerData.clientName}</span>
            <span>·</span>
            <span>Week ending {towerData.weekEndingDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
