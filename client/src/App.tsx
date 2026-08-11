import React, { useState } from 'react';
import { Catalog } from './pages/Catalog';
import { EventDetails } from './pages/EventDetails';
import { MyTickets } from './pages/MyTickets';
import { Gatekeeper } from './pages/Gatekeeper';
import { TicketItem, api } from './lib/api';
import { Ticket, QrCode, Sparkles, ShieldCheck, Compass } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'event-details' | 'my-tickets' | 'gatekeeper'>('catalog');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<TicketItem[]>(api.getTickets());

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setActiveTab('event-details');
  };

  const handleTicketPurchased = (ticket: TicketItem, qrData: string) => {
    setTickets((prev) => [ticket, ...prev]);
    setActiveTab('my-tickets');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 bg-slate-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => setActiveTab('catalog')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl font-display tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                ELITE<span className="text-indigo-500">TICKETS</span>
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-500">
                High Concurrency Platform
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'catalog' || activeTab === 'event-details'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="hidden sm:inline">Catálogo</span>
            </button>

            <button
              onClick={() => setActiveTab('my-tickets')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition relative ${
                activeTab === 'my-tickets'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span className="hidden sm:inline">Meus Ingressos</span>
              {tickets.length > 0 && (
                <span className="bg-pink-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {tickets.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('gatekeeper')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'gatekeeper'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-pink-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Portaria (Gatekeeper)</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full">
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
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-8 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Desafio Elite Dev • Trava Otimista RPC (`FOR UPDATE`) & Assinatura HMAC-SHA256</span>
          </div>
          <p>© 2026 Elite Tickets. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
