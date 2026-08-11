import React, { useEffect, useState } from 'react';
import { api, EventItem } from '../lib/api';
import { Calendar, MapPin, Search, ArrowRight, Sparkles, Ticket, Plus, Film, Music, Compass, Star } from 'lucide-react';
import { OrganizerModal } from '../components/OrganizerModal';

interface CatalogProps {
  onSelectEvent: (eventId: string) => void;
}

export const Catalog: React.FC<CatalogProps> = ({ onSelectEvent }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategory === 'all') return matchesSearch;
    if (selectedCategory === 'cinema') return matchesSearch && (e.venue.toLowerCase().includes('cinemark') || e.venue.toLowerCase().includes('imax') || e.venue.toLowerCase().includes('cinema'));
    if (selectedCategory === 'shows') return matchesSearch && (e.venue.toLowerCase().includes('parque') || e.venue.toLowerCase().includes('arena') || e.venue.toLowerCase().includes('stadium'));
    return matchesSearch;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Hero Banner Header (Bento Grid Style - UI/UX Pro Max) */}
      <div className="relative rounded-3xl overflow-hidden bg-[#141417] p-8 sm:p-12 border border-zinc-800/80 shadow-2xl shadow-black/80">
        {/* Background Ambient Glows */}
        <div className="absolute -right-16 -top-16 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-ambient-glow"></div>
        <div className="absolute -left-16 -bottom-16 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-ambient-glow"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-5">
            <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-400 shadow-sm">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Plataforma Oficial de Eventos 2026</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-white leading-[1.1]">
              A experiência definitiva de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-300">ingressos & assentos numerados</span>.
            </h1>

            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
              Escolha seu assento em mapas 3D interativos com concorrência pessimista no banco, pagamento simulado seguro e QR Code infalsificável assinado por HMAC.
            </p>

            {/* Search Input Bar */}
            <div className="pt-2 flex items-center gap-3 max-w-xl">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar espetáculos, arenas ou filmes no catálogo..."
                  className="w-full bg-[#09090b] border border-zinc-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder-zinc-500 outline-none transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Quick Bento Stats Badge (UI/UX Pro Max) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3">
            <div className="bg-[#09090b]/80 border border-zinc-800 p-4 rounded-2xl flex flex-col justify-between backdrop-blur-md">
              <span className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider">Eventos Ativos</span>
              <span className="text-3xl font-black text-emerald-400 font-mono mt-2">{events.length}</span>
            </div>
            <div className="bg-[#09090b]/80 border border-zinc-800 p-4 rounded-2xl flex flex-col justify-between backdrop-blur-md">
              <span className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider">Garantia DB</span>
              <span className="text-sm font-bold text-cyan-400 font-mono mt-2 flex items-center gap-1">
                <Star className="w-4 h-4 text-cyan-400 fill-cyan-400/20" /> FOR UPDATE
              </span>
            </div>
            <div className="col-span-2 bg-[#09090b]/80 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                <span className="text-xs font-semibold text-zinc-200">Portaria HMAC Ativa</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">API Worker 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Categories Bar & Organizer CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'bg-[#141417] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Todos os Eventos ({events.length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('cinema')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap ${
              selectedCategory === 'cinema'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'bg-[#141417] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Cinemas & IMAX</span>
          </button>

          <button
            onClick={() => setSelectedCategory('shows')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap ${
              selectedCategory === 'shows'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'bg-[#141417] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Shows & Arenas</span>
          </button>
        </div>

        {/* Organizer Modal Button */}
        <button
          onClick={() => setIsOrganizerOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#141417] hover:bg-emerald-950/60 text-emerald-400 border border-zinc-700 hover:border-emerald-500/60 text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Publicar Evento (Organizador)</span>
        </button>
      </div>

      {/* Events Card Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 rounded-3xl bg-[#141417] border border-zinc-800 animate-pulse"></div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-[#141417] rounded-3xl border border-zinc-800">
          <Ticket className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm font-medium">Nenhum evento encontrado para a busca especificada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => onSelectEvent(event.id)}
              className="group bg-[#141417] rounded-3xl overflow-hidden border border-zinc-800/80 cursor-pointer flex flex-col justify-between hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 active:scale-[0.99]"
            >
              {/* Event Poster Header */}
              <div className="h-56 w-full relative overflow-hidden bg-zinc-950">
                <img
                  src={event.banner_url}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141417] via-[#141417]/30 to-transparent"></div>
                
                {/* Price Tag Badge */}
                <div className="absolute top-4 right-4 bg-zinc-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-zinc-700/80 text-xs font-mono font-extrabold text-emerald-400 shadow-xl">
                  R$ {event.price.toFixed(2)}
                </div>

                {/* Rating / Badge */}
                <div className="absolute top-4 left-4 bg-emerald-950/90 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-800/80 text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1 shadow-md">
                  <Star className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  <span>ASSENTOS DISPONÍVEIS</span>
                </div>
              </div>

              {/* Event Info Details */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-xl font-extrabold font-display text-white group-hover:text-emerald-400 transition-colors mb-2 leading-snug">
                    {event.title}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <div className="space-y-2.5 text-xs text-zinc-300 border-t border-zinc-800/80 pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-medium">{new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate font-medium">{event.venue}</span>
                  </div>
                </div>

                {/* Main Action Button */}
                <button className="w-full mt-2 py-3.5 rounded-xl bg-zinc-900 group-hover:bg-emerald-500 border border-zinc-700 group-hover:border-emerald-400 text-white group-hover:text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 shadow-md">
                  <span>Escolher Assento no Mapa</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <OrganizerModal
        isOpen={isOrganizerOpen}
        onClose={() => setIsOrganizerOpen(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
};
