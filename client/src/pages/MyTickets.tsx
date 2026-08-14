import React, { useState } from 'react';
import { TicketItem, api } from '../lib/api';
import { TicketCard } from '../components/TicketCard';
import { PrintableTicket } from '../components/PrintableTicket';
import { Calendar, MapPin, CheckCircle2, Ticket, Printer, Clock } from 'lucide-react';

interface MyTicketsProps {
  tickets: TicketItem[];
  onBrowseEvents: () => void;
}

export const MyTickets: React.FC<MyTicketsProps> = ({ tickets, onBrowseEvents }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'used'>('active');
  const userTickets = tickets.length > 0 ? tickets : api.getTickets();

  const activeTickets = userTickets.filter((t) => t.status !== 'used');
  const usedTickets = userTickets.filter((t) => t.status === 'used');

  const handlePrintSpecific = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-28 sm:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Meus ingressos</h1>
          <p className="text-xs text-zinc-400 mt-1">Gerencie seus passes digitais e histórico de acessos.</p>
        </div>

        <button
          type="button"
          onClick={onBrowseEvents}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 transition-colors shrink-0 touch-manipulation shadow-sm w-fit"
        >
          + Comprar mais
        </button>
      </div>

      {/* Segmented Filter Tabs: Ativos vs Histórico Utilizados */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 touch-manipulation ${
            activeTab === 'active'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Ingressos Ativos ({activeTickets.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('used')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 touch-manipulation ${
            activeTab === 'used'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Histórico / Utilizados ({usedTickets.length})</span>
        </button>
      </div>

      {/* Tab: Ingressos Ativos */}
      {activeTab === 'active' && (
        <>
          {activeTickets.length === 0 ? (
            <div className="text-center py-16 bg-[#111113]/60 rounded-3xl border border-zinc-800/60 p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Você não possui ingressos ativos no momento.</p>
                <p className="text-xs text-zinc-500 mt-1">Explore as principais atrações disponíveis e reserve seu assento.</p>
              </div>
              <button
                type="button"
                onClick={onBrowseEvents}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-950/20 touch-manipulation"
              >
                Explorar catálogo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTickets.map((t) => (
                <TicketCard key={t.id} ticket={t} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: Histórico de Utilizados (Rastro de Ingresso Limpo & Minimalista) */}
      {activeTab === 'used' && (
        <>
          {usedTickets.length === 0 ? (
            <div className="text-center py-12 bg-[#111113]/40 rounded-2xl border border-zinc-800/40 p-6 text-xs text-zinc-500">
              Nenhum ingresso foi utilizado na portaria ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {usedTickets.map((ticket) => {
                const event = ticket.events || {
                  title: 'Evento Oficial Elite Tickets',
                  venue: 'Local do Evento',
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
                  <div
                    key={ticket.id}
                    className="p-4 bg-[#111113] rounded-2xl border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-zinc-700"
                  >
                    {/* Event & Seat details */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          UTILIZADO
                        </span>
                        <h3 className="text-sm font-semibold text-zinc-200 truncate">{event.title}</h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                        <span className="flex items-center gap-1 text-zinc-300 font-mono">
                          Assento {seat.row_name}{seat.seat_number} {seat.category ? `(${seat.category})` : ''}
                        </span>
                        <span className="flex items-center gap-1 text-zinc-500">
                          <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span className="truncate max-w-[200px]">{event.venue}</span>
                        </span>
                        <span className="flex items-center gap-1 text-zinc-500">
                          <Calendar className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span>{new Date(event.date || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </span>
                      </div>

                      <p className="text-[11px] font-mono text-zinc-500">
                        Entrada registrada: <span className="text-zinc-400 font-semibold">{usedTime}</span> • REF: #{ticket.id.slice(0, 4).toUpperCase()}-{ticket.id.slice(4, 8).toUpperCase()}
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

                      {/* Hidden PDF Printable Ticket for Print Mode */}
                      <div className="hidden print:block">
                        <PrintableTicket ticket={ticket} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
