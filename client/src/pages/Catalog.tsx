import React, { useEffect, useState } from 'react';
import { api, EventItem } from '../lib/api';
import { Search, ArrowRight, Plus, Calendar, MapPin } from 'lucide-react';
import { OrganizerModal } from '../components/OrganizerModal';
import { useAuth } from '../auth/AuthContext';

interface CatalogProps {
  onSelectEvent: (eventId: string) => void;
  role?: string;
}

export const Catalog: React.FC<CatalogProps> = ({ onSelectEvent, role }) => {
  const { profile, isDemoMode } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isOrganizerOpen, setIsOrganizerOpen] = useState(false);
  const effectiveRole = role || profile?.role;

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'tech', label: 'Tech & Inovação' },
    { id: 'music', label: 'Shows & Música' },
    { id: 'culture', label: 'Cinema & Artes' },
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
    if (selectedCategory === 'tech') return e.title.includes('Tech') || e.title.includes('Cyber') || e.title.includes('Cloud');
    if (selectedCategory === 'music') return e.title.includes('Pulse') || e.title.includes('Music');
    if (selectedCategory === 'culture') return e.title.includes('Sinfonia') || e.title.includes('Comedy');
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Eventos</h1>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
              Ao Vivo
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">Explore as principais atrações e reserve assentos em tempo real.</p>
        </div>

        {(isDemoMode || effectiveRole === 'organizer') && (
          <button
            onClick={() => setIsOrganizerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 transition-colors shadow-sm w-fit"
          >
            <Plus className="w-3.5 h-3.5" />
            Publicar evento
          </button>
        )}
      </div>

      {/* Search & Category Pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar evento ou local..."
            className="w-full bg-zinc-900/70 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-700 transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 rounded-2xl bg-zinc-900/50 animate-pulse" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-zinc-500">Nenhum evento encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => onSelectEvent(event.id)}
              className="group bg-[#111113] rounded-2xl overflow-hidden border border-zinc-800/60 text-left flex flex-col hover:border-zinc-700 transition-colors"
            >
              {/* Poster */}
              <div className="h-44 w-full relative overflow-hidden">
                <img
                  src={event.banner_url}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-transparent to-transparent" />

                <span className="absolute bottom-3 right-3 text-xs font-mono font-semibold text-white bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md">
                  R$ {event.price.toFixed(2)}
                </span>
              </div>

              {/* Info */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <h3 className="text-[15px] font-semibold text-white leading-snug group-hover:text-white transition-colors">
                  {event.title}
                </h3>

                <div className="space-y-1.5 text-xs text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-medium text-zinc-400 group-hover:text-emerald-400 transition-colors pt-1">
                  <span>Ver assentos</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </button>
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
