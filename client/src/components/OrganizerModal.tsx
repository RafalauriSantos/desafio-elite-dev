import React, { useEffect, useState } from 'react';
import { Plus, X, Film, Music, Sparkles, Calendar, MapPin, DollarSign, Search, CheckCircle2, ArrowRight } from 'lucide-react';
import { api, EventItem } from '../lib/api';

interface OrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (newEvent: EventItem) => void;
}

export const OrganizerModal: React.FC<OrganizerModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'manual'>('import');
  const [source, setSource] = useState<'tmdb' | 'ticketmaster'>('tmdb');
  const [searchQuery, setSearchQuery] = useState('');
  const [externalResults, setExternalResults] = useState<any[]>([]);
  const [selectedExternalItem, setSelectedExternalItem] = useState<any | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('Arena Anhembi - São Paulo, SP');
  const [date, setDate] = useState('2026-11-25T20:00');
  const [price, setPrice] = useState('250.00');
  const [bannerUrl, setBannerUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCatalog();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, source]);

  const loadCatalog = async () => {
    setLoading(true);
    const results = await api.fetchExternalCatalog(source, searchQuery);
    setExternalResults(results);
    setLoading(false);
  };

  const handleSelectExternalItem = (item: any) => {
    setSelectedExternalItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setBannerUrl(item.banner_url);
    if (item.source === 'tmdb') {
      setVenue('Cinemark Shopping Eldorado - Sala IMAX');
      setPrice('45.00');
    } else {
      setVenue('Allianz Parque - São Paulo, SP');
      setPrice('380.00');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !venue || !date) return;

    setLoading(true);
    const newEvent: EventItem = {
      id: `e-org-${Date.now()}`,
      title,
      description: description || 'Evento oficial publicado pelo organizador.',
      venue,
      date: new Date(date).toISOString(),
      price: parseFloat(price) || 200.00,
      banner_url: bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
    };

    onEventCreated(newEvent);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
              <Plus className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-base font-display text-white">Painel do Organizador</h3>
              <p className="text-xs text-slate-400">Monte um evento a partir das APIs TMDb (Filmes) ou Ticketmaster (Shows)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1.5 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'import'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1. Selecionar de API Externa (TMDb / Ticketmaster)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'manual'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>2. Definir Data, Local & Preço</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'import' ? (
            <div className="space-y-4">
              {/* API Source Switcher */}
              <div className="flex items-center justify-between gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSource('tmdb')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                      source === 'tmdb'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    TMDb (Filmes Cinema)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSource('ticketmaster')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                      source === 'ticketmaster'
                        ? 'bg-pink-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" />
                    Ticketmaster (Shows)
                  </button>
                </div>

                <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">API Externa Ativa</span>
              </div>

              {/* External Catalog Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {externalResults.map((item) => {
                  const isSelected = selectedExternalItem?.externalId === item.externalId;
                  return (
                    <div
                      key={item.externalId}
                      onClick={() => handleSelectExternalItem(item)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/30'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        <img
                          src={item.banner_url}
                          alt={item.title}
                          className="w-16 h-16 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider block">
                            {item.category}
                          </span>
                          <h4 className="font-bold text-xs text-white truncate mt-0.5">{item.title}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-tight">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Fonte: {item.source.toUpperCase()}</span>
                        {isSelected ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selecionado
                          </span>
                        ) : (
                          <span className="text-indigo-400 font-semibold flex items-center gap-1">
                            Montar Evento <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedExternalItem && (
                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab('manual')}
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition"
                  >
                    <span>Avançar para Definir Data, Local e Preço</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Título do Evento *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Avatar: O Caminho da Água (Sessão Especial IMAX)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Data & Horário do Evento *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Preço Base do Ingresso (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Local / Arena / Sala de Cinema *
                </label>
                <input
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Ex: Cinemark Shopping Eldorado - Sala IMAX 3D"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Descrição Completa
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('import')}
                  className="px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
                >
                  Voltar às APIs
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Publicar Evento no Catálogo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
