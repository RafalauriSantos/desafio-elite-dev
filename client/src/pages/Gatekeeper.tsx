import React, { useState, useEffect } from 'react';
import { QRScanner } from '../components/QRScanner';
import { CheckCircle2, XCircle, Clock, ShieldAlert, Sliders, Volume2, Activity } from 'lucide-react';
import { api, EventItem } from '../lib/api';

export const Gatekeeper: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedTargetEventId, setSelectedTargetEventId] = useState<string>('all');
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
      details: result.valid ? result.message : (result.error || 'Acesso Recusado'),
    };
    setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);
  };

  const validCount = history.filter((h) => h.status === 'valid').length;
  const blockedCount = history.filter((h) => h.status === 'invalid').length;
  const totalScans = history.length;
  const successRate = totalScans > 0 ? Math.round((validCount / totalScans) * 100) : 100;

  return (
    <div className="space-y-6 pb-28 sm:pb-12">
      {/* Header & Target Event Selector */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Controle de acesso / Portaria</h1>
          <p className="text-xs text-zinc-400 mt-1">Validação instantânea com áudio sintetizado e verificação atômica de 4 estados.</p>
        </div>

        {/* Active Event Selector */}
        <div className="flex items-center gap-2.5 bg-[#111113] p-2.5 rounded-2xl border border-zinc-800 shadow-sm">
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

      {/* Live Check-in Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#111113] p-3.5 rounded-2xl border border-zinc-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Liberados</span>
            <p className="text-lg font-mono font-bold text-emerald-400 leading-none mt-0.5">{validCount}</p>
          </div>
        </div>

        <div className="bg-[#111113] p-3.5 rounded-2xl border border-zinc-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-950/60 border border-red-800/50 flex items-center justify-center text-red-400 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Bloqueados</span>
            <p className="text-lg font-mono font-bold text-red-400 leading-none mt-0.5">{blockedCount}</p>
          </div>
        </div>

        <div className="bg-[#111113] p-3.5 rounded-2xl border border-zinc-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Eficácia</span>
            <p className="text-lg font-mono font-bold text-cyan-400 leading-none mt-0.5">{successRate}%</p>
          </div>
        </div>

        <div className="bg-[#111113] p-3.5 rounded-2xl border border-zinc-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-800/50 flex items-center justify-center text-purple-400 shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Áudio Web</span>
            <p className="text-xs font-semibold text-zinc-300 leading-none mt-1">Bip Ativo</p>
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
              className={`p-4 rounded-2xl border transition-all shadow-xl ${
                scanResult.valid
                  ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                  : scanResult.code === 'WRONG_EVENT'
                  ? 'bg-blue-950/40 border-blue-700/60 text-blue-300'
                  : scanResult.code === 'ALREADY_USED'
                  ? 'bg-amber-950/40 border-amber-700/60 text-amber-300'
                  : 'bg-red-950/40 border-red-700/60 text-red-300'
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
                    <p className="text-sm font-bold uppercase font-mono">
                      {scanResult.valid
                        ? 'ENTRADA LIBERADA'
                        : scanResult.code
                        ? scanResult.code
                        : 'ACESSO NEGADO'}
                    </p>
                  </div>
                  <p className="text-xs opacity-90 mt-1 leading-relaxed">
                    {scanResult.valid ? scanResult.message : scanResult.error}
                  </p>
                  {scanResult.ticket && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 text-xs font-mono space-y-0.5">
                      <div><span className="opacity-60">Titular:</span> {scanResult.ticket.user_name || scanResult.ticket.user_email}</div>
                      <div><span className="opacity-60">REF:</span> #{scanResult.ticket.id?.slice(0, 8)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History */}
          <div className="bg-[#111113] p-5 rounded-2xl border border-zinc-800 shadow-xl">
            <h4 className="text-xs font-bold text-zinc-300 mb-3.5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              Histórico recente de acessos na portaria
            </h4>

            {history.length === 0 ? (
              <p className="text-xs text-zinc-500 py-2">Nenhuma leitura nesta sessão ainda.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {history.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 py-2 text-xs border-b border-zinc-800/50 last:border-0"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          h.status === 'valid' ? 'bg-emerald-400' : 'bg-red-400'
                        }`}
                      />
                      <span className="text-zinc-300 truncate font-medium">{h.details}</span>
                    </div>
                    <span className="text-zinc-500 font-mono shrink-0 text-[10px]">{h.timestamp}</span>
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
