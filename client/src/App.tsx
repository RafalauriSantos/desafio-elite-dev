import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Catalog } from './pages/Catalog';
import { EventDetails } from './pages/EventDetails';
import { MyTickets } from './pages/MyTickets';
import { Gatekeeper } from './pages/Gatekeeper';
import { TicketItem } from './lib/api';
import { useAuth } from './auth/AuthContext';
import { Login } from './pages/Login';

type Tab = 'catalog' | 'event-details' | 'my-tickets' | 'gatekeeper';

export function App() {
  const { loading, session, profile, isDemoMode, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('catalog');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<TicketItem[]>([]);

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setActiveTab('event-details');
  };

  const handleTicketPurchased = (newTickets: TicketItem[]) => {
    setTickets((prev) => [...newTickets, ...prev]);
    setActiveTab('my-tickets');
  };

  if (loading) return <div className="min-h-[100dvh] bg-[#09090b] text-zinc-500 grid place-items-center">Carregando sessão...</div>;
  if (!isDemoMode && (!session || !profile)) return <Login />;
  const role = profile?.role ?? 'client';
  return (
    <Layout
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab)}
      ticketCount={tickets.length}
      role={role}
      isDemoMode={isDemoMode}
      userName={profile?.name}
      onSignOut={isDemoMode ? undefined : signOut}
    >
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

      {activeTab === 'gatekeeper' && (role === 'gatekeeper' || isDemoMode) && <Gatekeeper />}
    </Layout>
  );
}
