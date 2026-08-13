import React, { useState } from 'react';
import { ChevronDown, User, Shield, Sparkles, LogIn, LogOut, Ticket } from 'lucide-react';
import { UserRole } from '../auth/AuthContext';

export interface Persona {
  role: UserRole;
  name: string;
  email: string;
  label: string;
  badge: string;
}

export const SEED_PERSONAS: Persona[] = [
  { role: 'client', name: 'Ana Cliente', email: 'ana.cliente@verzel.com', label: 'Cliente', badge: '🎟️' },
  { role: 'organizer', name: 'Carlos Organizador', email: 'organizador@verzel.com', label: 'Organizador', badge: '🎪' },
  { role: 'gatekeeper', name: 'Roberto Portaria', email: 'portaria@verzel.com', label: 'Portaria', badge: '🛡️' },
];

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: 'catalog' | 'event-details' | 'my-tickets' | 'gatekeeper') => void;
  ticketCount: number;
  role: UserRole;
  activePersona: Persona;
  onSelectPersona: (persona: Persona) => void;
  isDemoMode?: boolean;
  isAuthenticated?: boolean;
  userName?: string;
  onOpenLogin?: () => void;
  onSignOut?: () => Promise<void>;
}

export function Layout({
  children,
  activeTab,
  onTabChange,
  ticketCount,
  role,
  activePersona,
  onSelectPersona,
  isDemoMode = false,
  isAuthenticated = false,
  userName,
  onOpenLogin,
  onSignOut,
}: LayoutProps) {
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);

  const tabs: Array<{ id: 'catalog' | 'my-tickets' | 'gatekeeper'; label: string; icon?: React.ReactNode }> = [
    { id: 'catalog', label: 'Eventos' },
    { id: 'my-tickets', label: 'Meus Ingressos' },
    { id: 'gatekeeper', label: 'Portaria' },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col flex-1 bg-[#09090b] text-zinc-100 antialiased overflow-x-hidden">
      {/* Header Fixo/Sticky */}
      <header className="w-full border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          {/* Logo */}
          <button
            onClick={() => onTabChange('catalog')}
            className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white hover:opacity-80 transition-opacity shrink-0"
          >
            <span className="w-6 h-6 rounded-md bg-white text-zinc-950 flex items-center justify-center font-bold text-xs">E</span>
            <span>Elite Tickets</span>
          </button>

          {/* Navegação Principal */}
          <nav className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors relative flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'text-white bg-zinc-800'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.id === 'my-tickets' && ticketCount > 0 && (
                  <span className="w-4 h-4 bg-emerald-500 text-[10px] font-semibold text-white rounded-full flex items-center justify-center">
                    {ticketCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Seletor de Persona & Auth */}
          <div className="flex items-center gap-2">
            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-300 hover:text-white transition-all shadow-sm"
                title="Alternar Papel de Demonstração"
              >
                <span className="text-sm">{activePersona.badge}</span>
                <span className="hidden sm:inline font-mono">{activePersona.label}</span>
                <ChevronDown className="w-3 h-3 text-zinc-500" />
              </button>

              {personaMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setPersonaMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-900 border border-zinc-800 p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-500 border-b border-zinc-800/60 mb-1">
                      Persona da Banca
                    </div>
                    {SEED_PERSONAS.map((p) => (
                      <button
                        key={p.role}
                        onClick={() => {
                          onSelectPersona(p);
                          setPersonaMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                          activePersona.role === p.role
                            ? 'bg-zinc-800 text-white font-semibold'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-left">
                          <span>{p.badge}</span>
                          <div>
                            <p className="leading-none">{p.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{p.email}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Auth Action */}
            {isAuthenticated ? (
              <button
                onClick={() => void onSignOut?.()}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-md transition-colors"
                title={`Logado como: ${userName}`}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sair</span>
              </button>
            ) : onOpenLogin ? (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col">
        {children}
      </main>

      {/* Rodapé fixado */}
      <footer className="w-full border-t border-zinc-800/60 py-6 text-center text-xs font-mono text-zinc-500 bg-[#09090b] mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Elite Tickets · Desafio Elite Dev (Verzel)</span>
          <span className="text-zinc-600">Postgres FOR UPDATE · HMAC-SHA256 · Cloudflare Workers</span>
        </div>
      </footer>
    </div>
  );
}

