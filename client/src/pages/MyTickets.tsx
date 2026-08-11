import React from 'react';
import { TicketItem, api } from '../lib/api';
import { TicketCard } from '../components/TicketCard';
import { Ticket, ShieldCheck, Sparkles } from 'lucide-react';

interface MyTicketsProps {
  tickets: TicketItem[];
  onBrowseEvents: () => void;
}

export const MyTickets: React.FC<MyTicketsProps> = ({ tickets, onBrowseEvents }) => {
  const userTickets = tickets.length > 0 ? tickets : api.getTickets();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-full text-[11px] font-semibold text-emerald-300 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Criptografia HMAC-SHA256 Ativa</span>
          </div>
          <h1 className="text-3xl font-extrabold font-display text-white">Meus Ingressos Emitidos</h1>
          <p className="text-xs text-slate-400 mt-1">Apresente o QR Code na portaria do evento para validação instantânea</p>
        </div>

        <button
          onClick={onBrowseEvents}
          className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          Comprar Mais Ingressos
        </button>
      </div>

      {/* Tickets List */}
      {userTickets.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl border border-slate-800 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-300 font-display">Você ainda não possui ingressos</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Navegue pelo catálogo de eventos e escolha seus assentos para emitir ingressos assinados digitalmente.
          </p>
          <button
            onClick={onBrowseEvents}
            className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 transition"
          >
            Explorar Eventos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {userTickets.map((t) => (
            <TicketCard key={t.id} ticket={t} />
          ))}
        </div>
      )}
    </div>
  );
};
