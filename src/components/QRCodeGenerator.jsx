import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, Printer, Check, ExternalLink } from 'lucide-react';

export function QRCodeGenerator({
  value,
  title,
  subtitle,
  size = 200,
  isStandPoster = false,
}) {
  const [copied, setCopied] = React.useState(false);
  const containerRef = useRef(null);

  // Full URL: ensure hostname is prepended if relative and points to public app
  const getCleanFullUrl = () => {
    if (!value || typeof value !== 'string') return '';
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }
    const path = value.startsWith('/') ? value : `/${value}`;
    if (typeof window !== 'undefined') {
      const customBase = localStorage.getItem('expo_qr_base_url');
      if (customBase && customBase.trim().startsWith('http')) {
        return `${customBase.trim().replace(/\/+$/, '')}${path}`;
      }
      let origin = window.location.origin;
      // If running inside AI Studio dev environment, redirect to public shared app URL
      if (origin.includes('ais-dev-')) {
        origin = origin.replace('ais-dev-', 'ais-pre-');
      }
      return `${origin}${path}`;
    }
    return value;
  };

  const fullUrl = getCleanFullUrl();

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = containerRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = size * 2;
    canvas.height = size * 2;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR-${title || 'expo'}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`flex flex-col items-center text-center ${isStandPoster ? 'p-8 bg-white text-slate-900 rounded-3xl shadow-2xl print:m-0' : 'p-6 rounded-2xl bg-[#0D192A] border border-white/10'}`}>
      {title && (
        <h4 className={`text-base font-bold mb-1 ${isStandPoster ? 'text-slate-900 text-xl' : 'text-white'}`}>
          {title}
        </h4>
      )}

      {subtitle && (
        <p className={`text-xs mb-4 max-w-xs ${isStandPoster ? 'text-slate-600' : 'text-slate-400'}`}>
          {subtitle}
        </p>
      )}

      {/* QR Code Container */}
      <div
        ref={containerRef}
        className="p-4 rounded-2xl bg-white shadow-md border border-slate-200 inline-block mb-4"
      >
        <QRCodeSVG
          value={fullUrl}
          size={size}
          level="H"
          includeMargin={false}
        />
      </div>

      <p className={`text-[11px] font-mono truncate max-w-[240px] mb-4 ${isStandPoster ? 'text-slate-500' : 'text-slate-400'}`}>
        {fullUrl}
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-2 print:hidden">
        <button
          type="button"
          onClick={handleCopy}
          className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-white/5 flex items-center gap-1.5 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copiado' : 'Copiar URL'}
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="py-1.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-medium border border-blue-500/30 flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Descargar PNG
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-white/5 flex items-center gap-1.5 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          Imprimir
        </button>
      </div>
    </div>
  );
}
