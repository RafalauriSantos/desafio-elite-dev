import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, CheckCircle2, QrCode } from 'lucide-react';
import { api } from '../lib/api';

interface QRScannerProps {
  onResult: (result: { success: boolean; valid: boolean; message?: string; error?: string; ticket?: any }) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onResult }) => {
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (mode === 'camera') {
      scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        async (decodedText) => {
          scanner?.clear();
          handleValidate(decodedText);
        },
        () => {}
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [mode]);

  const handleValidate = async (data: string) => {
    if (!data.trim()) return;
    setLoading(true);
    try {
      const res = await api.validateTicket(data);
      onResult(res);
    } catch (err: any) {
      onResult({
        success: false,
        valid: false,
        error: err.message || 'Falha ao validar.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#111113] p-5 rounded-xl border border-zinc-800/60">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <QrCode className="w-4 h-4 text-zinc-400" />
          Leitor QR
        </h3>

        <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800/60">
          <button
            onClick={() => setMode('manual')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              mode === 'manual'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Manual
          </button>
          <button
            onClick={() => setMode('camera')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors ${
              mode === 'camera'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Camera className="w-3 h-3" />
            Câmera
          </button>
        </div>
      </div>

      {mode === 'camera' ? (
        <div className="flex flex-col items-center">
          <div id="qr-reader" className="w-full max-w-sm rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900" />
          <p className="text-xs text-zinc-600 mt-3 text-center">
            Aproxime o QR Code da câmera.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            rows={3}
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder='{"ticketId":"...", "signature":"..."}'
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 font-mono placeholder-zinc-700 outline-none focus:border-zinc-600 transition-colors resize-none"
          />

          <button
            onClick={() => handleValidate(manualInput)}
            disabled={loading || !manualInput.trim()}
            className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Validar entrada
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
