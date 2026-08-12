import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: 'catalog' | 'event-details' | 'my-tickets' | 'gatekeeper') => void;
  ticketCount: number;
}

export function Layout({ children, activeTab, onTabChange, ticketCount }: LayoutProps) {
  const tabs: Array<{ id: 'catalog' | 'my-tickets' | 'gatekeeper'; label: string }> = [
    { id: 'catalog', label: 'Eventos' },
    { id: 'my-tickets', label: 'Ingressos' },
    { id: 'gatekeeper', label: 'Portaria' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100 antialiased overflow-x-hidden">
      {/* Header Fixo/Sticky */}
      <header className="w-full border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => onTabChange('catalog')}
            className="text-[15px] font-semibold tracking-tight text-white hover:opacity-80 transition-opacity"
          >
            Elite Tickets
          </button>

          <nav className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-white bg-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
                {tab.id === 'my-tickets' && ticketCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-[10px] font-semibold text-white rounded-full flex items-center justify-center">
                    {ticketCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Conteúdo Principal com flex-1 para empurrar o footer de forma fluida */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col">
        {children}
      </main>

      {/* Rodapé fixado na base do conteúdo sem espaço abaixo dele */}
      <footer className="w-full border-t border-zinc-800/60 py-6 text-center text-xs font-mono text-zinc-500 bg-[#09090b]">
        © 2026 Elite Tickets
      </footer>
    </div>
  );
}
