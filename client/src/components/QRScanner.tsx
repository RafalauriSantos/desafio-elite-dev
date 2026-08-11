import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Camera, CheckCircle2, XCircle, RefreshCw, AlertOctagon } from 'lucide-react';
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
        /* verbose= */ false
      );

      scanner.render(
        async (decodedText) => {
          scanner?.clear();
          handleValidate(decodedText);
        },
        (error) => {
          // Ignores minor frame scanning glitches
        }
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
        error: err.message || 'Falha ao validar QR Code.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
      {/* Mode Selector */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <h3 className="font-bold text-lg font-display text-white flex items-center gap-2">
          <QrCode className="w-5 h-5 text-indigo-400" />
          Leitor de QR Code
        </h3>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode('manual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'manual'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Entrada Manual / Teste
          </button>
          <button
            onClick={() => setMode('camera')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              mode === 'camera'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Câmera Vivo
          </button>
        </div>
      </div>

      {mode === 'camera' ? (
        <div className="flex flex-col items-center">
          <div id="qr-reader" className="w-full max-w-sm rounded-2xl overflow-hidden border border-slate-700 bg-slate-900"></div>
          <p className="text-xs text-slate-400 mt-4 text-center">
            Aproxime o QR Code do ingresso da câmera do dispositivo para leitura automática.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Cole o Payload do QR Code ou insira o código do ingresso:
            </label>
            <textarea
              rows={4}
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder='{"ticketId":"t-123", "signature":"hmac_sha256_..."}'
              className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-3.5 text-xs text-slate-200 font-mono placeholder-slate-600 outline-none transition"
            />
          </div>

          <button
            onClick={() => handleValidate(manualInput)}
            disabled={loading || !manualInput.trim()}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Validar Assinatura & Autorizar Entrada</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
