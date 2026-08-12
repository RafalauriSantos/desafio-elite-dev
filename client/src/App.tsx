import React, { useState } from 'react';
import { Catalog } from './pages/Catalog';
import { EventDetails } from './pages/EventDetails';
import { MyTickets } from './pages/MyTickets';
import { Gatekeeper } from './pages/Gatekeeper';
import { TicketItem } from './lib/api';

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

  const tabs: { id: Tab; label: string }[] = [
    { id: 'catalog', label: 'Eventos' },
    { id: 'my-tickets', label: 'Ingressos' },
    { id: 'gatekeeper', label: 'Portaria' },
  ];

  return (
    <div className="min-h-screen flex flex-col flex-1 bg-[#09090b] text-zinc-100">
      <header className="sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => setActiveTab('catalog')}
            className="text-[15px] font-semibold tracking-tight text-white hover:opacity-80 transition-opacity"
          >
            Elite Tickets
          </button>

          <nav className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-white bg-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
                {tab.id === 'my-tickets' && tickets.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-[10px] font-semibold text-white rounded-full flex items-center justify-center">
                    {tickets.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
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

      <footer className="border-t border-zinc-800/40 py-6 text-center">
        <p className="text-xs text-zinc-600">© 2026 Elite Tickets</p>
      </footer>
    </div>
  );
}
