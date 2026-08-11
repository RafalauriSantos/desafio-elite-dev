import React, { useEffect, useState } from 'react';
import { api, EventItem } from '../lib/api';
import { Calendar, MapPin, Search, ArrowRight, Sparkles, Ticket, Plus } from 'lucide-react';
import { OrganizerModal } from '../components/OrganizerModal';

interface CatalogProps {
  onSelectEvent: (eventId: string) => void;
}

export const Catalog: React.FC<CatalogProps> = ({ onSelectEvent }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOrganizerOpen, setIsOrganizerOpen] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const data = await api.getEvents();
    setEvents(data);
    setLoading(false);
  };

  const handleEventCreated = (newEvent: EventItem) => {
    setEvents((prev) => [newEvent, ...prev]);
  };

  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner Header */}
      <div className="relative rounded-3xl overflow-hidden bg-[#121215] p-8 sm:p-12 border border-zinc-800 shadow-2xl">
        <div className="absolute -right-12 -top-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-ambient-glow"></div>
        <div className="absolute -left-12 -bottom-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-ambient-glow"></div>

        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-800/60 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Eventos & Espetáculos Exclusivos 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            Garanta seu lugar nos melhores eventos com <span className="text-emerald-400">seleção de assentos em tempo real</span>.
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Escolha seu assento no mapa interativo com trava de concorrência, obtenha confirmação instantânea e receba seu ingresso digital assinado criptograficamente.
          </p>

          {/* Search Bar */}
          <div className="pt-2 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar eventos por nome, local ou palavra-chave..."
                className="w-full bg-zinc-950/90 border border-zinc-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-zinc-500 outline-none transition-all shadow-inner"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid Header */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold font-display text-white flex items-center gap-2.5">
            <Ticket className="w-6 h-6 text-emerald-400" />
            <span>Próximos Eventos em Destaque</span>
          </h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-zinc-400 font-mono hidden sm:inline">{filteredEvents.length} eventos disponíveis</span>
            <button
              onClick={() => setIsOrganizerOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-emerald-950/50 text-emerald-400 border border-zinc-700 hover:border-emerald-500/50 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 ml-auto sm:ml-0"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Painel do Organizador</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-3xl bg-zinc-900/60 border border-zinc-800 animate-pulse"></div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-[#121215] rounded-3xl border border-zinc-800">
            <p className="text-zinc-400 text-sm">Nenhum evento encontrado para a busca especificada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event.id)}
                className="group panel-card rounded-3xl overflow-hidden cursor-pointer flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 active:scale-[0.99]"
              >
                {/* Event Image */}
                <div className="h-52 w-full relative overflow-hidden bg-zinc-950">
                  <img
                    src={event.banner_url}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-transparent"></div>
                  
                  <div className="absolute top-4 right-4 bg-zinc-950/90 backdrop-blur-md px-3.5 py-1 rounded-full border border-zinc-700/80 text-xs font-mono font-bold text-emerald-400 shadow-md">
                    A partir de R$ {event.price.toFixed(2)}
                  </div>
                </div>

                {/* Event Info */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xl font-bold font-display text-white group-hover:text-emerald-400 transition-colors mb-2">
                      {event.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-zinc-300 border-t border-zinc-800/80 pt-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>

                  <button className="w-full mt-2 py-3 rounded-xl bg-zinc-900 group-hover:bg-emerald-500 border border-zinc-700 group-hover:border-emerald-400 text-white group-hover:text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300">
                    <span>Selecionar Assentos</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <OrganizerModal
        isOpen={isOrganizerOpen}
        onClose={() => setIsOrganizerOpen(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
};
