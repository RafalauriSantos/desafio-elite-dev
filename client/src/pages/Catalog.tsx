import React, { useEffect, useState } from 'react';
import { api, EventItem } from '../lib/api';
import { Search, ArrowRight, Plus, Calendar, MapPin, Film, Music } from 'lucide-react';
import { OrganizerModal } from '../components/OrganizerModal';
import { useAuth } from '../auth/AuthContext';

interface CatalogProps {
  onSelectEvent: (eventId: string) => void;
  role?: string;
}

export const Catalog: React.FC<CatalogProps> = ({ onSelectEvent, role }) => {
  const { profile } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isOrganizerOpen, setIsOrganizerOpen] = useState(false);
  const effectiveRole = role || profile?.role;

  const categories = [
    { id: 'all', label: 'Todos os Eventos' },
    { id: 'movies', label: 'Cinema / TMDb' },
    { id: 'shows', label: 'Shows & Festivais' },
  ];

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const data = await api.getEvents();
    setEvents(data);
    setLoading(false);
  };

  const handleEventCreated = (newEvent: EventItem | EventItem[]) => {
    setSelectedCategory('all');
    setSearchQuery('');
    const newItems = Array.isArray(newEvent) ? newEvent : [newEvent];
    setEvents((prev) => [...newItems, ...prev.filter((e) => !newItems.some((n) => n.id === e.id))]);
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'movies') {
      return (
        e.title.includes('Filme') ||
        e.title.includes('Avatar') ||
        e.title.includes('Duna') ||
        e.title.includes('Oppenheimer') ||
        e.title.includes('Deadpool') ||
        e.venue.includes('Cine') ||
        e.venue.includes('Cinemark')
      );
    }
    if (selectedCategory === 'shows') {
      return (
        e.title.includes('Show') ||
        e.title.includes('Tour') ||
        e.title.includes('Coldplay') ||
        e.title.includes('Taylor') ||
        e.title.includes('Festival') ||
        e.venue.includes('Allianz') ||
        e.venue.includes('Arena')
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-28 sm:pb-12 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Espetáculos em Cartaz
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Selecione uma atração para reservar seus assentos numerados.
          </p>
        </div>

        {effectiveRole === 'organizer' && (
          <button
            onClick={() => setIsOrganizerOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-zinc-950 bg-white hover:bg-zinc-100 transition-all shadow-sm w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Publicar Evento</span>
          </button>
        )}
      </div>

      {/* Search & Category Filter Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 w-fit">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título ou local..."
            className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-700 transition-colors"
          />
        </div>
      </div>

      {/* Event Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 animate-pulse" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-[#0e0e11] rounded-2xl border border-zinc-800/80 p-8 space-y-2">
          <p className="text-sm font-semibold text-white">Nenhum evento encontrado</p>
          <p className="text-xs text-zinc-500">Tente ajustar o termo de pesquisa ou selecionar outra categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event) => {
            const eventDate = new Date(event.date);
            const dateStr = !isNaN(eventDate.getTime())
              ? eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
              : 'Data a definir';

            return (
              <button
                key={event.id}
                onClick={() => onSelectEvent(event.id)}
                className="group bg-[#0e0e11] rounded-2xl overflow-hidden border border-zinc-800/80 text-left flex flex-col hover:border-zinc-700 transition-all shadow-md hover:shadow-xl"
              >
                {/* Poster Container */}
                <div className="h-44 w-full relative overflow-hidden bg-zinc-900">
                  <img
                    src={event.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80'}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e11] via-transparent to-transparent" />

                  <span className="absolute bottom-3 right-3 text-xs font-mono font-bold text-white bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shadow-sm">
                    R$ {typeof event.price === 'number' ? event.price.toFixed(2) : parseFloat(event.price || '0').toFixed(2)}
                  </span>
                </div>

                {/* Info Content */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <h3 className="text-sm sm:text-base font-bold text-white leading-snug tracking-tight line-clamp-2" style={{ textWrap: 'balance' }}>
                    {event.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                      <span>{dateStr}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs font-semibold text-zinc-300 group-hover:text-emerald-400 transition-colors">
                    <span>Selecionar assentos</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            );
          })}
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
