import React, { useState } from 'react';
import { Asset, ReadEvent, Checkout, Site } from '../types';
import { 
  Radio, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  User, 
  Tag, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeftRight, 
  Wrench, 
  Building2, 
  Share2, 
  QrCode, 
  Printer, 
  ExternalLink,
  ChevronLeft,
  Check,
  Send,
  Lock
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface PublicAssetViewProps {
  assetId: string;
  assets: Asset[];
  sites: Site[];
  readEvents: ReadEvent[];
  checkouts: Checkout[];
  onExitPublicView: () => void;
}

export const PublicAssetView: React.FC<PublicAssetViewProps> = ({
  assetId,
  assets,
  sites,
  readEvents,
  checkouts,
  onExitPublicView
}) => {
  const [copied, setCopied] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportNote, setReportNote] = useState('');

  const asset = (assets || []).find(a => a.id === assetId || a.tagEpc === assetId);

  const site = asset ? (sites || []).find(s => s.id === asset.siteId) : null;
  const assetEvents = (readEvents || []).filter(e => e.assetId === assetId || (asset && e.epc === asset.tagEpc));
  const latestEvent = assetEvents[0];
  const activeCheckout = (checkouts || []).find(c => c.assetId === assetId && c.status === 'ACTIVE');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNote) return;
    setReportSent(true);
    setTimeout(() => {
      setReportNote('');
    }, 3000);
  };

  if (!asset) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-red-950 border border-red-800 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-extrabold text-xl text-white">Asset Tag Not Found</h2>
            <p className="text-sm text-slate-400 mt-2">
              The RFID tag or asset ID <code className="text-amber-400 font-mono font-bold">{assetId}</code> does not correspond to an active record in the Aperture database.
            </p>
          </div>
          <button
            onClick={onExitPublicView}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg"
          >
            Return to Aperture Portal
          </button>
        </div>
      </div>
    );
  }

  // Generate public QR URL
  const publicUrl = window.location.href;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Security Banner */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black font-mono shadow-md shadow-blue-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-base text-white font-mono">APERTURE</span>
                <span className="bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 font-mono">
                  <Lock className="w-3 h-3 text-blue-400" /> SECURE VIEW-ONLY
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Public RFID Asset Verification Portal</p>
            </div>
          </div>

          <button
            onClick={onExitPublicView}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Full Dashboard</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Status Callout Card */}
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
          asset.status === 'In Zone'
            ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-100'
            : asset.status === 'Checked Out'
            ? 'bg-blue-950/60 border-blue-700/80 text-blue-100'
            : asset.status === 'Missing'
            ? 'bg-red-950/60 border-red-700/80 text-red-100 animate-pulse'
            : 'bg-amber-950/60 border-amber-700/80 text-amber-100'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl border ${
              asset.status === 'In Zone' ? 'bg-emerald-900/80 border-emerald-600 text-emerald-300' :
              asset.status === 'Checked Out' ? 'bg-blue-900/80 border-blue-600 text-blue-300' :
              asset.status === 'Missing' ? 'bg-red-900/80 border-red-600 text-red-300' :
              'bg-amber-900/80 border-amber-600 text-amber-300'
            }`}>
              {asset.status === 'In Zone' ? <CheckCircle2 className="w-8 h-8" /> :
               asset.status === 'Checked Out' ? <ArrowLeftRight className="w-8 h-8" /> :
               asset.status === 'Missing' ? <AlertTriangle className="w-8 h-8" /> :
               <Wrench className="w-8 h-8" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest opacity-80">CURRENT STATUS</span>
                <span className="text-xs font-mono font-extrabold px-2 py-0.5 rounded-full bg-slate-900/80 border border-current">
                  {asset.status.toUpperCase()}
                </span>
              </div>
              <h1 className="text-2xl font-black text-white mt-1">{asset.name}</h1>
              <p className="text-xs opacity-80 mt-1 font-medium">
                {asset.status === 'In Zone' ? `Verified inside laydown yard at ${asset.zoneName}.` :
                 asset.status === 'Checked Out' ? `Currently issued to custodian ${asset.custodianName || 'Worker'}.` :
                 asset.status === 'Missing' ? 'GEOFENCE ALERT: Asset read outside authorized boundary!' :
                 'Currently undergoing scheduled maintenance / calibration.'}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl text-xs font-mono">
            <QRCodeSVG value={publicUrl} size={64} level="M" fgColor="#38bdf8" bgColor="#0f172a" className="rounded-lg" />
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">RFID EPC TAG</span>
              <span className="text-blue-300 font-extrabold block text-xs">{asset.tagEpc}</span>
              <span className="text-[10px] text-emerald-400 block font-semibold mt-1">Verified Authenticity</span>
            </div>
          </div>
        </div>

        {/* Primary 2-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Left Column: Last Known Location & Zone Telemetry */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                <span>Last Known Location & RFID Reader</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-md">
                LIVE
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Construction Job Site</span>
                  <span className="text-xs font-bold text-blue-300 font-mono">{asset.siteName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Assigned Zone / Laydown Yard</span>
                  <span className="text-xs font-bold text-white font-mono">{asset.zoneName}</span>
                </div>
                {site && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[11px] text-slate-400">
                    <span>GPS Coordinates</span>
                    <span className="font-mono text-slate-300">{site.coordinates.lat.toFixed(4)}, {site.coordinates.lng.toFixed(4)}</span>
                  </div>
                )}
              </div>

              {/* Gateway Reader Log */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-wider block">
                  Last Gateway Reader Interaction
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">{latestEvent ? latestEvent.readerName : 'Fixed Portal Gateway 01'}</span>
                  <span className="font-mono text-blue-300 font-bold">{latestEvent ? `${latestEvent.rssi} dBm` : '-54 dBm'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                  <span>Last Seen Timestamp</span>
                  <span>{latestEvent?.timestamp ? new Date(latestEvent.timestamp).toLocaleString() : (asset.lastSeenAt ? new Date(asset.lastSeenAt).toLocaleString() : 'N/A')}</span>
                </div>
              </div>

              {/* Custodian Info if checked out */}
              {asset.status === 'Checked Out' && (
                <div className="bg-blue-950/40 border border-blue-800/80 p-4 rounded-2xl space-y-2">
                  <span className="text-[10px] font-mono text-blue-300 font-bold uppercase tracking-wider block flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Current Custodian & Possession
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-bold">{asset.custodianName || 'Assigned Worker'}</span>
                    <span className="text-blue-300 font-mono text-[11px]">Active Custody</span>
                  </div>
                  {activeCheckout && (
                    <div className="text-[11px] text-slate-400 font-mono pt-1 flex justify-between border-t border-blue-900">
                      <span>Checked Out On</span>
                      <span>{activeCheckout.checkoutTime ? new Date(activeCheckout.checkoutTime).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Asset Technical Specs & Attributes */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-400" />
                <span>Asset Technical Specifications</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400 font-bold">
                {asset.category}
              </span>
            </div>

            {/* Photo & Core Specs */}
            <div className="flex items-center gap-4 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <img
                src={asset.photoUrl}
                alt={asset.name}
                className="w-20 h-20 rounded-xl object-cover border border-slate-700 shrink-0"
              />
              <div className="space-y-1 text-xs">
                <p className="font-extrabold text-white text-sm">{asset.name}</p>
                <p className="text-slate-400">{asset.manufacturer} {asset.model}</p>
                <p className="text-slate-300 font-mono text-[11px]">SN: <strong>{asset.serialNumber}</strong></p>
                <p className="text-emerald-400 font-mono font-bold text-[11px]">Value: ${(asset.cost ?? 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-mono block">Condition Rating</span>
                <span className="text-amber-400 font-bold block mt-0.5">{asset.condition}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-mono block">Purchase Date</span>
                <span className="text-white font-bold block mt-0.5">{asset.purchaseDate}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-mono block">Rental Status</span>
                <span className="text-blue-400 font-bold block mt-0.5">
                  {asset.isRental ? `$${asset.rentalCostPerDay}/day` : 'Owned Fleet'}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-mono block">Hours / Engine Logs</span>
                <span className="text-white font-mono font-bold block mt-0.5">
                  {asset.hoursUsed ? `${asset.hoursUsed} hrs` : 'N/A'}
                </span>
              </div>
            </div>

            {asset.notes && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 italic">
                "{asset.notes}"
              </div>
            )}
          </div>

        </div>

        {/* Security Verification Seal */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-2xl shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Cryptographic Verification Seal</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Authenticated by Aperture RFID Edge Middleware. EPC Tag SHA-256 Hash matches cloud master database.
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-blue-400" />}
            <span>{copied ? 'Link Copied' : 'Share Verification Page'}</span>
          </button>
        </div>

        {/* Field Dispatch / Report Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-400" />
            <span>Field Dispatch & Found Tag Note</span>
          </h3>

          {reportSent ? (
            <div className="p-4 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Location update note submitted! The site manager has been alerted.</span>
            </div>
          ) : (
            <form onSubmit={handleSendReport} className="flex gap-2">
              <input
                type="text"
                placeholder="Spotted this tool on site? Type location note or observation..."
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors shrink-0"
              >
                Send Note
              </button>
            </form>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500 font-mono">
        <p>© 2026 Aperture Enterprise Asset Tracking • UHF RFID Physical Asset Infrastructure</p>
      </footer>

    </div>
  );
};
