import React, { useState, useEffect } from 'react';
import { QRScanner } from '../components/QRScanner';
import { CheckCircle2, XCircle, Clock, ShieldAlert, Sliders } from 'lucide-react';
import { api, EventItem } from '../lib/api';

export const Gatekeeper: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedTargetEventId, setSelectedTargetEventId] = useState<string>('e1111111-1111-1111-1111-111111111111');
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    valid: boolean;
    code?: string;
    message?: string;
    error?: string;
    ticket?: any;
  } | null>(null);

  const [history, setHistory] = useState<Array<{ timestamp: string; status: 'valid' | 'invalid'; details: string }>>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const data = await api.getEvents();
    setEvents(data);
  };

  const handleResult = (result: any) => {
    setScanResult(result);
    const newEntry = {
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      status: result.valid ? ('valid' as const) : ('invalid' as const),
      details: result.valid ? result.message : (result.error || 'Acesso Recusado')
    };
    setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);
  };

  return (
    <div className="space-y-6">
      {/* Header & Target Event Selector */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800/40 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Controle de acesso / Portaria</h1>
          <p className="text-sm text-zinc-500 mt-1">Validação instantânea de bilhetes e verificação de máquina de estados.</p>
        </div>

        {/* Active Event Selector */}
        <div className="flex items-center gap-2 bg-[#111113] p-2 rounded-xl border border-zinc-800/60">
          <Sliders className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-left">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Portaria Ativa do Evento:</span>
            <select
              value={selectedTargetEventId}
              onChange={(e) => setSelectedTargetEventId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer pr-2"
            >
              <option value="all" className="bg-zinc-900 text-white">Todos os Eventos (Validação Geral)</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id} className="bg-zinc-900 text-white">
                  {evt.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <QRScanner targetEventId={selectedTargetEventId} onResult={handleResult} />
        </div>

        <div className="lg:col-span-5 space-y-4">
          {/* Result Alert Box */}
          {scanResult && (
            <div
              className={`p-4 rounded-xl border transition-all ${
                scanResult.valid
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                  : scanResult.code === 'WRONG_EVENT'
                  ? 'bg-blue-950/30 border-blue-800/50 text-blue-300'
                  : scanResult.code === 'ALREADY_USED'
                  ? 'bg-amber-950/30 border-amber-800/50 text-amber-300'
                  : 'bg-red-950/20 border-red-800/40 text-red-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {scanResult.valid ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold uppercase">
                      {scanResult.valid
                        ? 'ENTRADA LIBERADA'
                        : scanResult.code
                        ? scanResult.code
                        : 'ACESSO NEGADO'}
                    </p>
                  </div>
                  <p className="text-xs opacity-80 mt-1 leading-relaxed">
                    {scanResult.valid ? scanResult.message : scanResult.error}
                  </p>
                  {scanResult.ticket && (
                    <div className="mt-2 pt-2 border-t border-white/10 text-xs font-mono">
                      <div><span className="opacity-60">Titular:</span> {scanResult.ticket.user_name || scanResult.ticket.user_email}</div>
                      <div><span className="opacity-60">Ticket ID:</span> {scanResult.ticket.id}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History */}
          <div className="bg-[#111113] p-4 rounded-xl border border-zinc-800/60">
            <h4 className="text-xs font-medium text-zinc-400 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Histórico recente de acessos
            </h4>

            {history.length === 0 ? (
              <p className="text-xs text-zinc-600">Nenhuma leitura nesta sessão.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 py-1.5 text-xs border-b border-zinc-800/30 last:border-0"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        h.status === 'valid' ? 'bg-emerald-400' : 'bg-red-400'
                      }`} />
                      <span className="text-zinc-400 truncate">{h.details}</span>
                    </div>
                    <span className="text-zinc-600 font-mono shrink-0 text-[10px]">{h.timestamp}</span>
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
