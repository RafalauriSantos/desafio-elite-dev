import React, { useState } from 'react';
import { QRScanner } from '../components/QRScanner';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Clock, QrCode } from 'lucide-react';

export const Gatekeeper: React.FC = () => {
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    valid: boolean;
    message?: string;
    error?: string;
    ticket?: any;
  } | null>(null);

  const [history, setHistory] = useState<Array<{ timestamp: string; status: 'valid' | 'invalid'; details: string }>>([]);

  const handleResult = (result: any) => {
    setScanResult(result);
    const newEntry = {
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      status: result.valid ? ('valid' as const) : ('invalid' as const),
      details: result.valid ? result.message : result.error
    };
    setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-950/80 border border-indigo-500/30 px-3 py-1 rounded-full text-[11px] font-semibold text-indigo-300 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Validador Portaria</span>
          </div>
          <h1 className="text-3xl font-extrabold font-display text-white">Controle de Acesso</h1>
          <p className="text-xs text-slate-400 mt-1">Leitura instantânea de QR Code e verificação de autorização de entrada</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: QR Scanner */}
        <div className="lg:col-span-7">
          <QRScanner onResult={handleResult} />
        </div>

        {/* Right Column: Scan Feedback & Audit Log */}
        <div className="lg:col-span-5 space-y-6">
          {/* Result Alert Box */}
          {scanResult && (
            <div
              className={`p-6 rounded-3xl border shadow-2xl transition-all ${
                scanResult.valid
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                  : 'bg-red-950/80 border-red-500/50 text-red-200'
              }`}
            >
              <div className="flex items-start gap-4">
                {scanResult.valid ? (
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-10 h-10 text-red-400 shrink-0" />
                )}

                <div className="space-y-1">
                  <h4 className="text-lg font-bold font-display uppercase tracking-wide">
                    {scanResult.valid ? 'ENTRADA LIBERADA' : 'ACESSO NEGADO'}
                  </h4>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {scanResult.valid ? scanResult.message : scanResult.error}
                  </p>

                  {scanResult.ticket && (
                    <div className="mt-4 pt-3 border-t border-white/10 text-xs space-y-1 font-mono">
                      <div><span className="opacity-60">Ticket ID:</span> {scanResult.ticket.id}</div>
                      <div><span className="opacity-60">Titular:</span> {scanResult.ticket.user_name || scanResult.ticket.user_email}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Audit History Log */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h4 className="font-bold text-sm font-display text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Histórico de Leitura Recente
            </h4>

            {history.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Nenhum QR Code lido nesta sessão.</p>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {history.map((h, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      {h.status === 'valid' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span className="text-slate-300 truncate">{h.details}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">{h.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
