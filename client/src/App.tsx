import React, { useState } from 'react';
import { Layout, SEED_PERSONAS, Persona } from './components/Layout';
import { Catalog } from './pages/Catalog';
import { EventManagement } from './pages/EventManagement';
import { EventDetails } from './pages/EventDetails';
import { MyTickets } from './pages/MyTickets';
import { Gatekeeper } from './pages/Gatekeeper';
import { api, TicketItem } from './lib/api';
import { useAuth } from './auth/AuthContext';
import { Login } from './pages/Login';
import { PasswordRecovery } from './pages/PasswordRecovery';

type Tab = 'catalog' | 'event-details' | 'my-tickets' | 'gatekeeper' | 'event-management';

export function App() {
  const { loading, session, profile, recoveryMode, isDemoMode, signIn, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('catalog');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activePersona, setActivePersona] = useState<Persona>(() => {
    if (profile?.email) {
      const match = SEED_PERSONAS.find((p) => p.email === profile.email);
      if (match) return match;
    }
    return SEED_PERSONAS[0];
  });

  React.useEffect(() => {
    if (profile?.email) {
      const match = SEED_PERSONAS.find((p) => p.email === profile.email);
      if (match) setActivePersona(match);
    }
  }, [profile?.email]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedTicketId = params.get('ticket') || (window.location.hash.startsWith('#ticket-') ? window.location.hash.replace('#ticket-', '') : null);
    if (sharedTicketId) {
      void api.getTicketById(sharedTicketId).then((ticket: TicketItem | null) => {
        if (ticket) {
          setTickets((prev) => (prev.some((t) => t.id === ticket.id) ? prev : [ticket, ...prev]));
          setActiveTab('my-tickets');
        }
      });
    }
  }, []);

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setActiveTab('event-details');
  };

  const handleTicketPurchased = (newTickets: TicketItem[]) => {
    setTickets((prev) => [...newTickets, ...prev]);
    setActiveTab('my-tickets');
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#09090b] text-zinc-500 grid place-items-center font-mono text-sm">
        Carregando Elite Tickets...
      </div>
    );
  }

  if (recoveryMode) {
    return <PasswordRecovery />;
  }

  // If user explicitly opened login
  if (showLoginModal) {
    return (
      <Login
        onBack={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
      />
    );
  }

  const effectiveRole = profile?.role ?? 'client';
  const effectiveName = profile?.name ?? 'Visitante';
  const isAuthenticated = !!profile;

  const handleTabChange = (tab: Tab) => {
    // RBAC Route Guard: If trying to access organizer or gatekeeper without auth, open login
    if ((tab === 'event-management' || tab === 'gatekeeper') && !isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setActiveTab(tab);
  };

  const handlePersonaSelect = async (persona: Persona) => {
    setActivePersona(persona);
    // Automatic real sign-in for the selected seed persona
    await signIn(persona.email, 'verzel2026');
    if (persona.role === 'gatekeeper') {
      setActiveTab('gatekeeper');
    } else if (persona.role === 'organizer') {
      setActiveTab('event-management');
    } else {
      setActiveTab('catalog');
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      ticketCount={tickets.length}
      role={effectiveRole}
      activePersona={activePersona}
      onSelectPersona={handlePersonaSelect}
      isDemoMode={!isAuthenticated}
      isAuthenticated={isAuthenticated}
      userName={effectiveName}
      onOpenLogin={() => setShowLoginModal(true)}
      onSignOut={signOut}
    >
      {activeTab === 'catalog' && (
        <Catalog onSelectEvent={handleSelectEvent} role={effectiveRole} />
      )}

      {activeTab === 'event-management' && (
        <EventManagement onSelectEvent={handleSelectEvent} />
      )}

      {activeTab === 'event-details' && selectedEventId && (
        <EventDetails
          eventId={selectedEventId}
          onBack={() => setActiveTab(effectiveRole === 'organizer' ? 'event-management' : 'catalog')}
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
    </Layout>
  );
}

