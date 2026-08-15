import React, { useState, useEffect } from 'react';
import { QRScanner } from '../components/QRScanner';
import { CheckCircle2, Clock, ChevronDown, ChevronUp, Sliders, PlayCircle } from 'lucide-react';
import { api, EventItem } from '../lib/api';

export const Gatekeeper: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedTargetEventId, setSelectedTargetEventId] = useState<string>('all');
  const [history, setHistory] = useState<Array<{ timestamp: string; status: 'valid' | 'invalid'; details: string }>>([]);
  const [showTestPresets, setShowTestPresets] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const data = await api.getEvents();
    setEvents(data);
  };

  const handleResult = (result: any) => {
    const newEntry = {
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      status: result.valid ? ('valid' as const) : ('invalid' as const),
      details: result.valid ? result.message : (result.error || 'Acesso Recusado'),
    };
    setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);
  };

  const validCount = history.filter((h) => h.status === 'valid').length;
  const blockedCount = history.filter((h) => h.status === 'invalid').length;

  const triggerPresetValidation = async (type: 'valid' | 'used' | 'invalid' | 'wrong_event') => {
    const now = Date.now();
    let payload = '';

    if (type === 'valid') {
      const tickets = api.getTickets();
      const validTicket = tickets.find((t) => t.status !== 'used');
      if (validTicket) {
        payload = JSON.stringify({
          ticketId: validTicket.id,
          eventId: validTicket.event_id,
          seatId: validTicket.seat_id,
          userEmail: validTicket.user_email,
          clientId: validTicket.clientId || validTicket.user_email,
          issuedAt: validTicket.issuedAt || new Date(validTicket.created_at).getTime(),
          signature: validTicket.qr_signature,
        });
      } else {
        payload = JSON.stringify({
          ticketId: 't-demo-001',
          eventId: 'e1111111-1111-1111-1111-111111111111',
          seatId: 's-demo-001',
          userEmail: 'dev@verzel.com.br',
          clientId: 'dev@verzel.com.br',
          issuedAt: now,
          signature: 'sig_demo_test_preset',
        });
      }
    } else if (type === 'used') {
      const tickets = api.getTickets();
      const usedTicket = tickets.find((t) => t.status === 'used');
      if (usedTicket) {
        payload = JSON.stringify({
          ticketId: usedTicket.id,
          eventId: usedTicket.event_id,
          seatId: usedTicket.seat_id,
          userEmail: usedTicket.user_email,
          clientId: usedTicket.clientId || usedTicket.user_email,
          issuedAt: usedTicket.issuedAt || new Date(usedTicket.created_at).getTime(),
          signature: usedTicket.qr_signature,
        });
      } else {
        payload = JSON.stringify({
          ticketId: 't-used-sample',
          eventId: 'e1111111-1111-1111-1111-111111111111',
          seatId: 's-used-001',
          userEmail: 'cliente.antigo@exemplo.com',
          clientId: 'cliente.antigo@exemplo.com',
          issuedAt: now - 3600000,
          signature: 'sig_already_used_sample',
        });
      }
    } else if (type === 'invalid') {
      payload = JSON.stringify({
        ticketId: 't-fake-hacker',
        eventId: 'e1111111-1111-1111-1111-111111111111',
        seatId: 's-fake-999',
        userEmail: 'hacker@malicious.com',
        signature: 'invalid_tampered_hmac_hash_sample',
      });
    } else if (type === 'wrong_event') {
      payload = JSON.stringify({
        ticketId: 't-wrong-event-001',
        eventId: 'e-other-non-matching-event-id',
        seatId: 's-wrong-001',
        userEmail: 'visitante@outroshow.com',
        signature: 'sig_wrong_event_valid_hash',
      });
    }

    try {
      const res = await api.validateTicket(payload, selectedTargetEventId);
      handleResult(res);
    } catch (err: any) {
      handleResult({ valid: false, error: err.message || 'Falha na validação' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-28 sm:pb-12">
      {/* Top Header & Compact Scoreboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111113] p-4 rounded-3xl border border-zinc-800 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400 shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Portaria Ativa:</span>
            <select
              value={selectedTargetEventId}
              onChange={(e) => setSelectedTargetEventId(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-white outline-none cursor-pointer truncate max-w-[200px] sm:max-w-xs"
            >
              <option value="all" className="bg-zinc-900 text-white">Todos os Eventos (Portão Geral)</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id} className="bg-zinc-900 text-white">
                  {evt.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Compact Live Scoreboard */}
        <div className="flex items-center gap-2 font-mono text-xs shrink-0 self-end sm:self-center">
          <span className="px-3 py-1 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-400 font-bold">
            🟢 {validCount} Válidos
          </span>
          <span className="px-3 py-1 rounded-xl bg-red-950/50 border border-red-800/50 text-red-400 font-bold">
            🔴 {blockedCount} Barrados
          </span>
        </div>
      </div>

      {/* Main Focus: The Scanner */}
      <QRScanner targetEventId={selectedTargetEventId} onResult={handleResult} />

      {/* Accordion: Simulador de 4 Estados do Edital (Verzel QA) */}
      <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setShowTestPresets(!showTestPresets)}
          className="w-full px-4 py-3 text-xs font-semibold text-zinc-300 hover:text-white flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-cyan-400" />
            <span>Simulador de Cenários do Edital (4 Estados)</span>
          </div>
          {showTestPresets ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </button>

        {showTestPresets && (
          <div className="p-4 border-t border-zinc-800/60 bg-zinc-950/40 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => triggerPresetValidation('valid')}
              className="p-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 rounded-xl text-xs font-bold text-emerald-300 text-center transition-all active:scale-95"
            >
              🟢 1. VÁLIDO
            </button>
            <button
              type="button"
              onClick={() => triggerPresetValidation('used')}
              className="p-2.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 rounded-xl text-xs font-bold text-amber-300 text-center transition-all active:scale-95"
            >
              🟡 2. JÁ USADO
            </button>
            <button
              type="button"
              onClick={() => triggerPresetValidation('invalid')}
              className="p-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 rounded-xl text-xs font-bold text-red-300 text-center transition-all active:scale-95"
            >
              🔴 3. FORJADO
            </button>
            <button
              type="button"
              onClick={() => triggerPresetValidation('wrong_event')}
              className="p-2.5 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/50 rounded-xl text-xs font-bold text-blue-300 text-center transition-all active:scale-95"
            >
              🔵 4. SHOW ERRADO
            </button>
          </div>
        )}
      </div>

      {/* Accordion: Histórico de Acessos Recentes */}
      <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full px-4 py-3 text-xs font-semibold text-zinc-300 hover:text-white flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span>Histórico de Leituras ({history.length})</span>
          </div>
          {showHistory ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </button>

        {showHistory && (
          <div className="p-4 border-t border-zinc-800/60 bg-zinc-950/40">
            {history.length === 0 ? (
              <p className="text-xs text-zinc-500 py-1 text-center">Nenhuma leitura registrada nesta sessão.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 py-1.5 text-xs border-b border-zinc-800/40 last:border-0"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          h.status === 'valid' ? 'bg-emerald-400' : 'bg-red-400'
                        }`}
                      />
                      <span className="text-zinc-300 truncate">{h.details}</span>
                    </div>
                    <span className="text-zinc-500 font-mono shrink-0 text-[10px]">{h.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
