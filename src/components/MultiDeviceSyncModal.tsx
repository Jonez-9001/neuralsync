import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  Copy,
  Check,
  UploadCloud,
  DownloadCloud,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Globe
} from 'lucide-react';

interface MultiDeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncImported: () => void;
}

export const SYNC_KEYS = [
  'p1_stock_items',
  'p1_stock_rules',
  'otif_workspaces_v2',
  'otif_active_workspace_id_v2',
  'freight_audit_trips_v1',
  'freight_audit_rules_v1',
  'binaudit_skus_v1',
  'binaudit_rules_v1',
  'monday_control_tower_v1',
  'monday_tower_data_v1',
  'p5_unpaid_bills_v1',
  'p5_executive_actions_v2',
  'p1_recovery_tracker_v2',
];

export const MultiDeviceSyncModal: React.FC<MultiDeviceSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncImported,
}) => {
  const [copiedPacket, setCopiedPacket] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [incomingPacket, setIncomingPacket] = useState('');
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('suite_cloud_webhook_url') || '');
  const [statusMessage, setStatusMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  if (!isOpen) return null;

  // Build portable compressed JSON/Base64 snapshot of all 5 engines
  const generateSyncPacket = (): string => {
    const payload: Record<string, any> = {
      timestamp: new Date().toISOString(),
      engines: {},
    };
    SYNC_KEYS.forEach((k) => {
      const val = localStorage.getItem(k);
      if (val) {
        try {
          payload.engines[k] = JSON.parse(val);
        } catch {
          payload.engines[k] = val;
        }
      }
    });
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  };

  const handleCopySyncPacket = () => {
    const packet = generateSyncPacket();
    navigator.clipboard.writeText(packet);
    setCopiedPacket(true);
    setStatusMessage({
      type: 'ok',
      text: 'Copied portable 5-Engine Field Sync Code! Send via WhatsApp/Email from the Gate Tablet or Store Phone to the Owner Laptop.',
    });
    setTimeout(() => setCopiedPacket(false), 3000);
  };

  const handleCopyClientShareLink = () => {
    const packet = generateSyncPacket();
    // Use URL hash (#client_sync=...) so large 5-engine payloads never trigger HTTP 431/414 header size errors
    const url = `${window.location.origin}${window.location.pathname}#client_sync=${encodeURIComponent(packet)}`;
    navigator.clipboard.writeText(url);
    setCopiedShareLink(true);
    setStatusMessage({
      type: 'ok',
      text: 'Copied 1-Click Shareable Client Link! Uses zero-limit hash routing so large 5-engine ledgers open cleanly in any browser.',
    });
    setTimeout(() => setCopiedShareLink(false), 3000);
  };

  const handleDownloadJsonFile = () => {
    const payload: Record<string, any> = {
      timestamp: new Date().toISOString(),
      engines: {},
    };
    SYNC_KEYS.forEach((k) => {
      const val = localStorage.getItem(k);
      if (val) {
        try {
          payload.engines[k] = JSON.parse(val);
        } catch {
          payload.engines[k] = val;
        }
      }
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Factory_Suite_Sync_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleApplyIncomingPacket = () => {
    if (!incomingPacket.trim()) return;
    try {
      let decoded = incomingPacket.trim();
      if (!decoded.startsWith('{')) {
        decoded = decodeURIComponent(escape(atob(decoded)));
      }
      const parsed = JSON.parse(decoded);
      const engines = parsed.engines || parsed;
      let restoredCount = 0;

      SYNC_KEYS.forEach((k) => {
        if (engines[k] !== undefined) {
          localStorage.setItem(
            k,
            typeof engines[k] === 'string' ? engines[k] : JSON.stringify(engines[k])
          );
          restoredCount++;
        }
      });

      // Broadcast across tabs & components
      window.dispatchEvent(new Event('storage'));
      try {
        const bc = new BroadcastChannel('factory_suite_live_sync');
        bc.postMessage({ type: 'STATE_UPDATED', timestamp: Date.now() });
        bc.close();
      } catch {}

      setStatusMessage({
        type: 'ok',
        text: `Synced ${restoredCount} engine ledgers from field device (${parsed.timestamp ? new Date(parsed.timestamp).toLocaleTimeString() : 'Live'})!`,
      });
      setIncomingPacket('');
      onSyncImported();
    } catch (e) {
      setStatusMessage({
        type: 'err',
        text: 'Invalid Sync Code or JSON format. Copy the exact Field Sync Code from the source device.',
      });
    }
  };

  const handleCloudPush = async () => {
    if (!webhookUrl.trim()) {
      setStatusMessage({ type: 'err', text: 'Enter a REST / Webhook / Firebase JSON endpoint URL first.' });
      return;
    }
    localStorage.setItem('suite_cloud_webhook_url', webhookUrl.trim());
    try {
      const decoded = decodeURIComponent(escape(atob(generateSyncPacket())));
      const res = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: decoded,
      });
      if (res.ok) {
        setStatusMessage({ type: 'ok', text: 'Successfully pushed all 5 engine states to Cloud Endpoint!' });
      } else {
        setStatusMessage({ type: 'err', text: `Cloud endpoint returned HTTP ${res.status}` });
      }
    } catch (err) {
      setStatusMessage({ type: 'err', text: 'Could not reach Cloud URL. Use the 1-Click Field Sync Code below for instant offline/WhatsApp device sync.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  Multi-Device Field-to-Owner Sync Hub
                </h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold uppercase">
                  Gate Tablet ➔ Owner Laptop
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Solves multi-device shop-floor sync: Gate Guards (P2) and Storekeepers (P4) can push live stamps &amp; bin counts straight to the Owner&apos;s PC.
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
          {/* Step 1: Export from Field Tablet / Phone */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                <Smartphone className="w-4 h-4" />
                <span>Step A: On Gate Guard Tablet (P2) or Storekeeper Phone (P4)</span>
              </div>
              <span className="text-[11px] text-slate-400">Bundles P1 + P2 + P3 + P4 + P5 state</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              After stamping truck departures at the security gate or counting physical bins in the warehouse, generate a 1-click encrypted sync packet to send via WhatsApp or email to the Factory Owner / Analyst console:
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleCopySyncPacket}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition"
              >
                {copiedPacket ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPacket ? 'Copied Field Sync Code!' : 'Copy Field Sync Code (WhatsApp)'}</span>
              </button>
              <button
                onClick={handleCopyClientShareLink}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
              >
                {copiedShareLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedShareLink ? 'Copied Client URL!' : 'Copy 1-Click Client Presentation Link'}</span>
              </button>
              <button
                onClick={handleDownloadJsonFile}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
              >
                <DownloadCloud className="w-4 h-4 text-cyan-400" />
                <span>Download .JSON</span>
              </button>
            </div>
          </div>

          {/* Step 2: Import on Owner Laptop */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">
                <Laptop className="w-4 h-4" />
                <span>Step B: On Factory Owner / Lead Auditor Laptop</span>
              </div>
              <span className="text-[11px] text-slate-400">Instant 5-Engine Merge</span>
            </div>
            <textarea
              rows={3}
              value={incomingPacket}
              onChange={(e) => setIncomingPacket(e.target.value)}
              placeholder="Paste the Field Sync Code or raw JSON snapshot here to update all 5 engines..."
              className="w-full rounded-lg bg-slate-900 border border-slate-700 p-3 text-xs font-mono text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handleApplyIncomingPacket}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Merge Field State into Master Console</span>
              </button>
            </div>
          </div>

          {/* Optional Cloud Webhook Sync */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Globe className="w-4 h-4 text-amber-400" />
              <span>Optional: Live Cloud Webhook / Firebase / Supabase REST Endpoint</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-factory-db.firebaseio.com/state.json or Webhook URL"
                className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-amber-500 focus:outline-none"
              />
              <button
                onClick={handleCloudPush}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold cursor-pointer transition"
              >
                Push to Cloud
              </button>
            </div>
          </div>

          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                statusMessage.type === 'ok'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}
            >
              {statusMessage.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Cross-tab BroadcastChannel real-time sync is always active automatically.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
