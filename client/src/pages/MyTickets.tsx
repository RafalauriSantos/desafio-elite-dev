import React from 'react';
import { TicketItem, api } from '../lib/api';
import { TicketCard } from '../components/TicketCard';

interface MyTicketsProps {
  tickets: TicketItem[];
  onBrowseEvents: () => void;
}

export const MyTickets: React.FC<MyTicketsProps> = ({ tickets, onBrowseEvents }) => {
  const userTickets = tickets.length > 0 ? tickets : api.getTickets();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Meus ingressos</h1>
          <p className="text-sm text-zinc-500 mt-1">Apresente o QR Code na portaria para validação.</p>
        </div>

        <button
          onClick={onBrowseEvents}
          className="px-3 py-2 rounded-lg text-[13px] font-medium text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/50 transition-colors shrink-0"
        >
          Comprar mais
        </button>
      </div>

      {userTickets.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-zinc-500 mb-4">Você ainda não tem ingressos.</p>
          <button
            onClick={onBrowseEvents}
            className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-colors"
          >
            Explorar eventos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userTickets.map((t) => (
            <TicketCard key={t.id} ticket={t} />
          ))}
        </div>
      )}
    </div>
  );
};
