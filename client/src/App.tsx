import React, { useState } from 'react';
import { Catalog } from './pages/Catalog';
import { EventDetails } from './pages/EventDetails';
import { MyTickets } from './pages/MyTickets';
import { Gatekeeper } from './pages/Gatekeeper';
import { TicketItem } from './lib/api';
import { Ticket, ShieldCheck, QrCode, Sparkles, Activity, Lock } from 'lucide-react';

type Tab = 'catalog' | 'event-details' | 'my-tickets' | 'gatekeeper';

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('catalog');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<TicketItem[]>([]);

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setActiveTab('event-details');
  };

  const handleTicketPurchased = (newTicket: TicketItem) => {
    setTickets((prev) => [newTicket, ...prev]);
    setActiveTab('my-tickets');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#09090b]/85 backdrop-blur-xl border-b border-[#27272a] shadow-lg shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <button
            onClick={() => setActiveTab('catalog')}
            className="flex items-center gap-3 group text-left transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-[#27272a] p-0.5 shadow-sm group-hover:border-emerald-500/50 transition-all duration-300">
              <div className="w-full h-full bg-[#121215] rounded-[10px] flex items-center justify-center group-hover:bg-emerald-950/30 transition-colors">
                <Ticket className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight font-display text-white">
                  ELITE<span className="text-emerald-400">TICKETS</span>
                </span>
                <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider">
                  2026
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">
                Eventos & Portaria
              </p>
            </div>
          </button>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 bg-[#121215]/90 p-1.5 rounded-2xl border border-[#27272a]">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                activeTab === 'catalog'
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-md shadow-black/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Catálogo</span>
            </button>

            <button
              onClick={() => setActiveTab('my-tickets')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 relative ${
                activeTab === 'my-tickets'
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-md shadow-black/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Meus Ingressos</span>
              {tickets.length > 0 && (
                <span className="bg-emerald-400 text-zinc-950 font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm shadow-emerald-500/50 animate-pulse">
                  {tickets.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('gatekeeper')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                activeTab === 'gatekeeper'
                  ? 'bg-emerald-500 text-zinc-950 font-bold shadow-lg shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Portaria (Gatekeeper)</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'catalog' && (
          <Catalog onSelectEvent={handleSelectEvent} />
        )}

        {activeTab === 'event-details' && selectedEventId && (
          <EventDetails
            eventId={selectedEventId}
            onBack={() => setActiveTab('catalog')}
            onTicketPurchased={handleTicketPurchased}
          />
        )}

        {activeTab === 'my-tickets' && (
          <MyTickets
            tickets={tickets}
            onBrowseEvents={() => setActiveTab('catalog')}
          />
        )}

        {activeTab === 'gatekeeper' && <Gatekeeper />}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#27272a] bg-[#09090b] py-8 mt-12 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Elite Tickets • Plataforma Oficial de Ingressos & Validação de Entrada</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Cloudflare Workers API Active</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-zinc-400">
              <Lock className="w-3 h-3 text-indigo-400" />
              <span>Supabase Postgres RLS Protected</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
