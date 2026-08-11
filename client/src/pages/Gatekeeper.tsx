import React, { useState } from 'react';
import { QRScanner } from '../components/QRScanner';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Controle de acesso</h1>
        <p className="text-sm text-zinc-500 mt-1">Leia o QR Code do ingresso para validação de entrada.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <QRScanner onResult={handleResult} />
        </div>

        <div className="lg:col-span-5 space-y-4">
          {/* Result */}
          {scanResult && (
            <div
              className={`p-4 rounded-xl border ${
                scanResult.valid
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                  : 'bg-red-950/20 border-red-800/40 text-red-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {scanResult.valid ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-semibold">
                    {scanResult.valid ? 'Entrada liberada' : 'Acesso negado'}
                  </p>
                  <p className="text-xs opacity-80 mt-0.5">
                    {scanResult.valid ? scanResult.message : scanResult.error}
                  </p>
                  {scanResult.ticket && (
                    <p className="text-xs text-zinc-400 font-mono mt-2">
                      {scanResult.ticket.user_name || scanResult.ticket.user_email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History */}
          <div className="bg-[#111113] p-4 rounded-xl border border-zinc-800/60">
            <h4 className="text-xs font-medium text-zinc-400 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Histórico recente
            </h4>

            {history.length === 0 ? (
              <p className="text-xs text-zinc-600">Nenhuma leitura.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 py-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        h.status === 'valid' ? 'bg-emerald-400' : 'bg-red-400'
                      }`} />
                      <span className="text-zinc-400 truncate">{h.details}</span>
                    </div>
                    <span className="text-zinc-600 font-mono shrink-0">{h.timestamp}</span>
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
