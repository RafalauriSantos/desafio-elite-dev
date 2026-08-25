import React, { useState, useEffect } from 'react';
import { TicketItem, api } from '../lib/api';
import { TicketCard } from '../components/TicketCard';
import { PrintableTicket } from '../components/PrintableTicket';
import { Calendar, MapPin, CheckCircle2, Ticket, Printer, Clock } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface MyTicketsProps {
  tickets: TicketItem[];
  onBrowseEvents: () => void;
}

export const MyTickets: React.FC<MyTicketsProps> = ({ tickets, onBrowseEvents }) => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'used'>('active');
  const [remoteTickets, setRemoteTickets] = useState<TicketItem[]>(tickets);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadTickets = async () => {
      setLoading(true);
      const effectiveEmail = profile?.email;
      let data: TicketItem[] = [];
      if (effectiveEmail) {
        data = await api.fetchUserTickets(effectiveEmail);
      } else {
        data = api.getTickets();
      }

      if (isMounted) {
        // Fusão idempotente: prioriza dados do banco remoto mas preserva ingressos recém-comprados deste usuário
        const combined = [...data];
        tickets.forEach((local) => {
          const belongsToUser = !effectiveEmail || local.user_email === effectiveEmail;
          if (belongsToUser && !combined.some((item) => item.id === local.id)) {
            combined.unshift(local);
          }
        });
        setRemoteTickets(combined);
        setLoading(false);
      }
    };

    void loadTickets();

    return () => {
      isMounted = false;
    };
  }, [tickets, profile?.email]);

  const userTickets = remoteTickets;
  const activeTickets = userTickets.filter((t) => t.status !== 'used');
  const usedTickets = userTickets.filter((t) => t.status === 'used');

  const handlePrintSpecific = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-28 sm:pb-16 max-w-6xl mx-auto w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Meus Ingressos</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Carteira digital de bilhetes e histórico de acessos na portaria.
          </p>
        </div>

        <button
          type="button"
          onClick={onBrowseEvents}
          className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-zinc-950 bg-white hover:bg-zinc-100 transition-all shadow-sm w-fit shrink-0 touch-manipulation"
        >
          + Adquirir Ingressos
        </button>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="grid grid-cols-2 sm:flex items-center gap-1.5 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 touch-manipulation truncate ${
            activeTab === 'active'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Ticket className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Ativos ({activeTickets.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('used')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 touch-manipulation truncate ${
            activeTab === 'used'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Utilizados ({usedTickets.length})</span>
        </button>
      </div>

      {/* Tab: Ingressos Ativos */}
      {activeTab === 'active' && (
        <>
          {activeTickets.length === 0 ? (
            <div className="text-center py-16 bg-[#0e0e11] rounded-2xl border border-zinc-800/80 p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                <Ticket className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Nenhum ingresso ativo no momento</p>
                <p className="text-xs text-zinc-500">Explore os espetáculos em cartaz e garanta sua reserva.</p>
              </div>
              <button
                type="button"
                onClick={onBrowseEvents}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs transition-colors shadow-sm touch-manipulation"
              >
                Explorar Espetáculos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
              {activeTickets.map((t) => (
                <TicketCard key={t.id} ticket={t} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: Histórico de Utilizados */}
      {activeTab === 'used' && (
        <>
          {usedTickets.length === 0 ? (
            <div className="text-center py-12 bg-[#0e0e11] rounded-2xl border border-zinc-800/80 p-6 text-xs text-zinc-500">
              Nenhum ingresso foi validado na portaria ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {usedTickets.map((ticket) => {
                const event = ticket.events || {
                  title: 'Espetáculo Oficial',
                  venue: 'Arena Principal',
                  date: new Date().toISOString(),
                };
                const seat = ticket.seats || { row_name: 'A', seat_number: 1, category: 'VIP' };
                const usedTime = ticket.used_at
                  ? new Date(ticket.used_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Validado na Portaria';

                return (
                  <React.Fragment key={ticket.id}>
                    <div className="p-4 bg-[#0e0e11] rounded-2xl border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-zinc-700 no-print">
                      {/* Event & Seat Details */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            UTILIZADO
                          </span>
                          <h3 className="text-sm font-semibold text-zinc-200 truncate">{event.title}</h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 font-mono">
                          <span className="text-zinc-300">
                            Poltrona {seat.row_name}{seat.seat_number} ({seat.category || 'VIP'})
                          </span>
                          <span className="flex items-center gap-1 text-zinc-500 font-sans">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[200px]">{event.venue}</span>
                          </span>
                          <span className="flex items-center gap-1 text-zinc-500">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>{new Date(event.date || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </span>
                        </div>

                        <p className="text-[11px] font-mono text-zinc-500">
                          Entrada: <span className="text-zinc-400 font-semibold">{usedTime}</span> • REF: #{ticket.id.slice(0, 4).toUpperCase()}-{ticket.id.slice(4, 8).toUpperCase()}
                        </p>
                      </div>

                      {/* Print / Proof Button */}
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handlePrintSpecific}
                          className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors touch-manipulation shadow-sm"
                          title="Baixar Comprovante"
                        >
                          <Printer className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Comprovante</span>
                        </button>
                      </div>
                    </div>

                    {/* Printable Voucher in Print Mode */}
                    <div className="hidden print:block printable-container">
                      <PrintableTicket ticket={ticket} />
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
