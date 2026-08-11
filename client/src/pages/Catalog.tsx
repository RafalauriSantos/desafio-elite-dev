import React, { useEffect, useState } from 'react';
import { api, EventItem } from '../lib/api';
import { Calendar, MapPin, Search, ArrowRight, Sparkles, Ticket } from 'lucide-react';

interface CatalogProps {
  onSelectEvent: (eventId: string) => void;
}

export const Catalog: React.FC<CatalogProps> = ({ onSelectEvent }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const data = await api.getEvents();
    setEvents(data);
    setLoading(false);
  };

  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner Header */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-8 sm:p-12 border border-indigo-500/20 shadow-2xl">
        <div className="absolute -right-12 -top-12 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-indigo-950/80 border border-indigo-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Reserva de Assentos em Tempo Real & Anti-Fraude</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            Garanta seu lugar nos maiores eventos com <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">trava de segurança otimista</span>.
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Plataforma de alta concorrência com assentos numerados, validação de ingressos por assinatura HMAC e leitura instantânea por QR Code.
          </p>

          {/* Search Bar */}
          <div className="pt-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar eventos por nome, local ou palavra-chave..."
                className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-display text-white flex items-center gap-2">
            <Ticket className="w-6 h-6 text-indigo-400" />
            Próximos Eventos em Destaque
          </h2>
          <span className="text-xs text-slate-400 font-mono">{filteredEvents.length} eventos disponíveis</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-3xl bg-slate-900/50 border border-slate-800 animate-pulse"></div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-3xl border border-slate-800">
            <p className="text-slate-400 text-sm">Nenhum evento encontrado para a busca especificada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event.id)}
                className="group glass-card rounded-3xl overflow-hidden cursor-pointer flex flex-col justify-between"
              >
                {/* Event Image */}
                <div className="h-48 w-full relative overflow-hidden">
                  <img
                    src={event.banner_url}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                  
                  <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/60 text-xs font-bold text-indigo-300">
                    A partir de R$ {event.price.toFixed(2)}
                  </div>
                </div>

                {/* Event Info */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xl font-bold font-display text-white group-hover:text-indigo-400 transition-colors mb-2">
                      {event.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>

                  <button className="w-full mt-2 py-3 rounded-xl bg-slate-900 group-hover:bg-indigo-600 border border-slate-700 group-hover:border-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all">
                    <span>Selecionar Assentos</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
