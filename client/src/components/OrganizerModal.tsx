import React, { useEffect, useState } from 'react';
import { Film, Music, ArrowRight, CheckCircle2, CheckSquare, Square, AlertCircle, Plus, Search, Loader2 } from 'lucide-react';
import { api, EventItem, ExternalCatalogItem } from '../lib/api';
import { BottomSheet } from './BottomSheet';

interface OrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (newEvent: EventItem | EventItem[]) => void;
}

export const OrganizerModal: React.FC<OrganizerModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
}) => {
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [source, setSource] = useState<'tmdb' | 'ticketmaster'>('tmdb');
  const [searchQuery, setSearchQuery] = useState('');
  const [externalResults, setExternalResults] = useState<ExternalCatalogItem[]>([]);
  const [selectedExternalItems, setSelectedExternalItems] = useState<ExternalCatalogItem[]>([]);
  const [existingEventTitles, setExistingEventTitles] = useState<string[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('Arena Anhembi - São Paulo, SP');
  const [date, setDate] = useState('2026-11-25T20:00');
  const [price, setPrice] = useState('250.00');
  const [bannerUrl, setBannerUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Debounced live search against TMDb / Ticketmaster
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      void loadCatalog(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [isOpen, source, searchQuery]);

  const loadCatalog = async (query: string = '') => {
    setLoading(true);
    try {
      const [results, liveEvents] = await Promise.all([
        api.fetchExternalCatalog(source, query),
        api.getEvents(),
      ]);
      setExternalResults(results);
      setExistingEventTitles(liveEvents.map((e) => e.title.toLowerCase().trim()));
    } catch {
      const results = await api.fetchExternalCatalog(source, query);
      setExternalResults(results);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExternalItem = (item: ExternalCatalogItem) => {
    if (existingEventTitles.includes(item.title.toLowerCase().trim())) return;

    setSelectedExternalItems((prev) => {
      const exists = prev.some((i) => i.externalId === item.externalId);
      if (exists) {
        return prev.filter((i) => i.externalId !== item.externalId);
      } else {
        return [...prev, item];
      }
    });

    // Populate single form fields with latest selected item
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

  const handleBulkImport = async () => {
    if (selectedExternalItems.length === 0) return;
    setLoading(true);
    setActionError(null);

    const sanitizedItems: ExternalCatalogItem[] = selectedExternalItems.map((item, idx) => ({
      ...item,
      title: item.title?.trim() || 'Espetáculo Oficial',
      description: item.description?.trim() || 'Evento oficial importado pelo catálogo do organizador.',
      venue: item.venue || (item.source === 'tmdb' ? 'Cinemark Shopping Eldorado - Sala IMAX' : 'Allianz Parque - São Paulo, SP'),
      date: item.date || new Date(Date.now() + 86400000 * (20 + idx * 5)).toISOString(),
      price: typeof item.price === 'number' ? item.price : (item.price ? parseFloat(item.price) : (item.source === 'tmdb' ? 45.00 : 280.00)),
      banner_url: item.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    }));

    const res = await api.bulkImportEvents(sanitizedItems);
    setLoading(false);

    if (res.success && res.events && res.events.length > 0) {
      onEventCreated(res.events);
      onClose();
    } else {
      setActionError(res.message || 'Falha ao importar eventos selecionados.');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !venue.trim() || !date) {
      setActionError('Título, local e data são obrigatórios.');
      return;
    }

    setLoading(true);
    setActionError(null);

    const eventData: Omit<EventItem, 'id'> = {
      title: title.trim(),
      description: description.trim(),
      venue: venue.trim(),
      date: new Date(date).toISOString(),
      price: parseFloat(price) || 200.0,
      banner_url: bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    };

    const res = await api.createEvent(eventData);
    setLoading(false);

    if (res.success && res.event) {
      onEventCreated(res.event);
      onClose();
    } else {
      setActionError(res.message || 'Erro ao publicar evento.');
    }
  };

  const footerActions = step === 'select' ? (
    selectedExternalItems.length > 0 ? (
      <div className="w-full flex gap-2">
        <button
          type="button"
          onClick={() => setStep('configure')}
          className="flex-1 min-h-[48px] px-3 rounded-xl border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all touch-manipulation active:scale-[0.98]"
        >
          <span>Personalizar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleBulkImport}
          disabled={loading}
          className="flex-[2] min-h-[48px] px-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm touch-manipulation active:scale-[0.98] disabled:opacity-40"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
          ) : (
            `Importar ${selectedExternalItems.length} ${selectedExternalItems.length === 1 ? 'Atração' : 'Atrações'}`
          )}
        </button>
      </div>
    ) : (
      <div className="w-full">
        <button
          type="button"
          onClick={() => setStep('configure')}
          className="w-full min-h-[48px] px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm touch-manipulation active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Manualmente</span>
        </button>
      </div>
    )
  ) : (
    <div className="w-full flex gap-2">
      <button
        type="button"
        onClick={() => setStep('select')}
        className="flex-1 min-h-[48px] px-4 rounded-xl border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 text-xs font-semibold transition-all touch-manipulation active:scale-[0.98]"
      >
        Voltar
      </button>
      <button
        type="button"
        onClick={() => handleSubmit()}
        disabled={loading}
        className="flex-[2] min-h-[48px] px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm touch-manipulation active:scale-[0.98] disabled:opacity-40"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
        ) : (
          'Publicar Evento'
        )}
      </button>
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Publicação de Eventos"
      subtitle="Busque qualquer título no TMDb ou importe em lote."
      maxWidthClass="sm:max-w-2xl"
      maxHeightClass="max-h-[85dvh] sm:max-h-[88dvh]"
      footer={footerActions}
    >
      {/* Steps Switcher */}
      <div className="flex border-b border-zinc-800/80 bg-zinc-900/60 rounded-xl p-1 mb-2">
        <button
          type="button"
          onClick={() => setStep('select')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg text-center transition-all ${
            step === 'select'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          1. Catálogo Externo ({selectedExternalItems.length})
        </button>
        <button
          type="button"
          onClick={() => setStep('configure')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg text-center transition-all ${
            step === 'configure'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          2. Detalhes & Assentos
        </button>
      </div>

      {actionError && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-800/60 bg-red-950/40 p-3 text-xs text-red-300 animate-in fade-in">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <span>{actionError}</span>
        </div>
      )}

      {step === 'select' ? (
        <div className="space-y-3">
          {/* Source Switcher and Live Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Source tabs */}
            <div className="flex gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 shrink-0 w-fit">
              <button
                type="button"
                onClick={() => {
                  setSource('tmdb');
                  setSearchQuery('');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  source === 'tmdb' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cinema (TMDb)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSource('ticketmaster');
                  setSearchQuery('');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  source === 'ticketmaster' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Music className="w-3.5 h-3.5 text-cyan-400" />
                <span>Shows (Ticketmaster)</span>
              </button>
            </div>

            {/* Live Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  source === 'tmdb'
                    ? 'Pesquisar qualquer filme no TMDb (ex: Interestelar, Matrix, Barbie)...'
                    : 'Pesquisar shows ou festivais...'
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-700 transition-colors"
              />
              {loading && (
                <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>
          </div>

          {/* Results Grid with Checkboxes */}
          {loading && externalResults.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-zinc-900/40 border border-zinc-800/60 animate-pulse" />
              ))}
            </div>
          ) : externalResults.length === 0 ? (
            <div className="text-center py-10 bg-zinc-900/30 rounded-2xl border border-zinc-800/60 p-6 space-y-1">
              <p className="text-xs font-semibold text-white">Nenhum resultado encontrado no TMDb</p>
              <p className="text-[11px] text-zinc-500">Tente buscar por outro termo ou limpe o campo de busca.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[48dvh] overflow-y-auto pr-1">
              {externalResults.map((item) => {
                const isSelected = selectedExternalItems.some((i) => i.externalId === item.externalId);
                const isAlreadyImported = existingEventTitles.includes(item.title.toLowerCase().trim());

                return (
                  <div
                    key={item.externalId}
                    onClick={() => !isAlreadyImported && handleToggleExternalItem(item)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isAlreadyImported
                        ? 'bg-zinc-900/20 border-zinc-800/30 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-zinc-800/90 border-zinc-600 cursor-pointer shadow-md'
                        : 'bg-zinc-900/40 border-zinc-800/70 hover:border-zinc-700 cursor-pointer'
                    }`}
                  >
                    <div className="flex gap-2.5 items-start">
                      <div className="shrink-0 pt-0.5">
                        {isAlreadyImported ? (
                          <CheckCircle2 className="w-4 h-4 text-zinc-500" />
                        ) : isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-600" />
                        )}
                      </div>
                      <img
                        src={item.banner_url}
                        alt={item.title}
                        className="w-12 h-12 rounded-lg object-cover shrink-0 border border-zinc-800 bg-zinc-900"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5 leading-tight">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-zinc-800/40 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500 font-mono text-[10px] uppercase">{item.source}</span>
                      {isAlreadyImported ? (
                        <span className="text-zinc-400 font-mono text-[10px]">
                          ✓ Já no catálogo
                        </span>
                      ) : isSelected ? (
                        <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                          ✓ Selecionado
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[11px]">Selecionar</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Título do Evento *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-zinc-700 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Data & Horário *</label>
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-zinc-700 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Preço Base (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-zinc-700 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Local / Arena *</label>
            <input
              type="text"
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-zinc-700 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Descrição</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-zinc-700 transition-colors resize-none"
            />
          </div>
        </form>
      )}
    </BottomSheet>
  );
};
