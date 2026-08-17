import React, { useRef, useState } from 'react';
import { X, QrCode, Copy, Check, ExternalLink, Printer, Download, ShieldCheck, MapPin, Radio, Tag } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Asset } from '../types';
import { downloadDataUrl } from '../lib/download';

interface QrCodeModalProps {
  asset: Asset | null;
  onClose: () => void;
  onOpenPublicView: (assetId: string) => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ asset, onClose, onOpenPublicView }) => {
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!asset) return null;

  // Build the secure public view URL
  const baseUrl = window.location.origin + window.location.pathname;
  const publicUrl = `${baseUrl}?publicAsset=${asset.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById(`qr-svg-${asset.id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 400, 400);
        ctx.drawImage(img, 20, 20, 360, 360);
        const pngFile = canvas.toDataURL('image/png');
        downloadDataUrl(pngFile, `QR_LABEL_${asset.id}_${asset.tagEpc}.png`);
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-8">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Asset QR Code Generator</h3>
              <p className="text-xs text-slate-400">Secure View-Only Public Tag & Label</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Printable Label Card Preview */}
          <div 
            ref={printRef}
            className="bg-white text-slate-900 p-5 rounded-2xl border-2 border-slate-300 shadow-xl space-y-4 print:border-none print:shadow-none print:p-0"
          >
            {/* Label Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-white font-mono font-bold text-xs">
                  AP
                </div>
                <div>
                  <span className="font-extrabold text-xs font-mono text-slate-900 block leading-tight">APERTURE ASSET TAG</span>
                  <span className="text-[9px] text-blue-700 font-bold uppercase tracking-wider block">Verified UHF RFID Asset</span>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 border border-slate-300 font-bold px-2 py-0.5 rounded text-slate-700">
                {asset.id}
              </span>
            </div>

            {/* QR + Asset Metadata Grid */}
            <div className="flex items-center gap-4">
              {/* QR SVG */}
              <div className="bg-slate-50 p-2 border border-slate-200 rounded-xl shadow-inner shrink-0 flex items-center justify-center">
                <QRCodeSVG
                  id={`qr-svg-${asset.id}`}
                  value={publicUrl}
                  size={120}
                  level="H"
                  includeMargin={true}
                  fgColor="#0f172a"
                  bgColor="#ffffff"
                />
              </div>

              {/* Text Info */}
              <div className="space-y-1.5 min-w-0 flex-1 text-xs">
                <h4 className="font-extrabold text-slate-900 text-sm truncate leading-snug">{asset.name}</h4>
                <p className="text-slate-600 text-[11px] font-medium">{asset.category} • {asset.manufacturer}</p>
                
                <div className="pt-1 space-y-1 font-mono text-[10px]">
                  <div className="flex items-center gap-1 text-slate-700">
                    <Tag className="w-3 h-3 text-blue-600 shrink-0" />
                    <span className="font-bold text-slate-900 truncate">EPC: {asset.tagEpc}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <Radio className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>SN: {asset.serialNumber}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{asset.zoneName} ({asset.siteName})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Security Footer */}
            <div className="bg-slate-100 border border-slate-200/80 rounded-xl p-2 flex items-center justify-between text-[10px] text-slate-600">
              <div className="flex items-center gap-1 font-semibold text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Scan for Real-Time Location & Status</span>
              </div>
              <span className="font-mono text-slate-500 font-bold">VIEW-ONLY SECURE LINK</span>
            </div>
          </div>

          {/* Public Link Box */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400 font-semibold block uppercase tracking-wider">
              Secure Public View URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-blue-300 focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 border border-slate-700 shrink-0 transition-colors"
                title="Copy URL"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Anyone scanning this QR code will be directed to a view-only status page without administrative edit rights.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800">
            <button
              onClick={() => { onClose(); onOpenPublicView(asset.id); }}
              className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Test Public View</span>
            </button>

            <button
              onClick={handleDownloadQr}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Download PNG</span>
            </button>

            <button
              onClick={handlePrint}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print Label</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
