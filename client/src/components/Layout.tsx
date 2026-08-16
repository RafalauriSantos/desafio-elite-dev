import React, { useState } from 'react';
import { ChevronDown, Sparkles, LogOut, Calendar, Ticket, ShieldCheck, Plus } from 'lucide-react';
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
  onTabChange: (tab: 'catalog' | 'event-details' | 'my-tickets' | 'gatekeeper' | 'event-management') => void;
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

  const effectiveRole = activePersona.role;

  interface NavItem {
    id: 'catalog' | 'my-tickets' | 'gatekeeper' | 'event-management';
    label: string;
    icon: typeof Calendar;
    badge?: number;
  }

  const navItems: NavItem[] =
    effectiveRole === 'gatekeeper'
      ? [{ id: 'gatekeeper', label: 'Portaria', icon: ShieldCheck }]
      : effectiveRole === 'organizer'
      ? [{ id: 'event-management', label: 'Gestão de Eventos', icon: Calendar }]
      : [
          { id: 'catalog', label: 'Catálogo', icon: Calendar },
          { id: 'my-tickets', label: 'Meus Ingressos', icon: Ticket, badge: ticketCount },
        ];

  return (
    <div className="flex flex-col flex-1 w-full h-[100dvh] md:min-h-[100dvh] md:h-auto overflow-hidden md:overflow-visible bg-transparent text-zinc-100 antialiased">
      {/* Header Fixo/Sticky */}
      <header className="shrink-0 w-full border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Logo */}
          <button
            onClick={() => onTabChange('catalog')}
            className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white hover:opacity-80 transition-opacity shrink-0"
          >
            <span className="w-6 h-6 rounded-md bg-white text-zinc-950 flex items-center justify-center font-bold text-xs">E</span>
            <span className="tracking-tight">Elite Tickets</span>
          </button>

          {/* Navegação Desktop (escondida no mobile para evitar overflow) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors relative flex items-center gap-1.5 ${
                  activeTab === item.id
                    ? 'text-white bg-zinc-800'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="w-4 h-4 bg-emerald-500 text-[10px] font-semibold text-white rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
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
                <span className="font-mono text-[11px] sm:text-xs">{activePersona.label}</span>
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

            {/* Discreet Logout if session active */}
            {isAuthenticated && (
              <button
                onClick={() => void onSignOut?.()}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-md transition-colors"
                title={`Logado como: ${userName}`}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal (scroll suave interno no mobile) */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 flex flex-col overflow-y-auto md:overflow-visible overscroll-contain">
        {children}
      </main>

      {/* Rodapé institucional minimalista — Exclusivo Desktop */}
      <footer className="hidden md:block shrink-0 w-full border-t border-zinc-800/60 py-6 text-xs text-zinc-500 mt-auto bg-[#09090b]/40">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-medium text-zinc-400">Elite Tickets</span>
            <span className="text-zinc-700">·</span>
            <span>Plataforma Oficial de Ingressos & Eventos</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-zinc-500 font-mono">
            <span>Validação Criptográfica em Tempo Real</span>
            <span className="text-zinc-700">·</span>
            <span>© 2026</span>
          </div>
        </div>
      </footer>

      {/* Bottom Navigation Bar para Mobile (True Viewport Fixed Anchoring) */}
      <nav
        aria-label="Navegação móvel"
        className="md:hidden shrink-0 z-30 bg-[#09090b]/95 backdrop-blur-xl border-t border-zinc-800/80 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative ${
                  isActive ? 'text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                  {item.badge ? (
                    <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-emerald-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}


