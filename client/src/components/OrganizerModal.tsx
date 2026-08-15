import React, { useEffect, useState } from 'react';
import { Film, Music, ArrowRight, CheckCircle2, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { api, EventItem } from '../lib/api';
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
  const [externalResults, setExternalResults] = useState<any[]>([]);
  const [selectedExternalItems, setSelectedExternalItems] = useState<any[]>([]);
  const [existingEventTitles, setExistingEventTitles] = useState<string[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('Arena Anhembi - São Paulo, SP');
  const [date, setDate] = useState('2026-11-25T20:00');
  const [price, setPrice] = useState('250.00');
  const [bannerUrl, setBannerUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCatalog();
    }
  }, [isOpen, source]);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const [results, liveEvents] = await Promise.all([
        api.fetchExternalCatalog(source, ''),
        api.getEvents(),
      ]);
      setExternalResults(results);
      setExistingEventTitles(liveEvents.map((e) => e.title.toLowerCase().trim()));
    } catch {
      const results = await api.fetchExternalCatalog(source, '');
      setExternalResults(results);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExternalItem = (item: any) => {
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

    const sanitizedItems = selectedExternalItems.map((item, idx) => ({
      title: item.title?.trim() || 'Espetáculo Oficial',
      description: item.description?.trim() || 'Evento oficial importado pelo catálogo do organizador.',
      venue: item.venue || (item.source === 'tmdb' ? 'Cinemark Shopping Eldorado - Sala IMAX' : 'Allianz Parque - São Paulo, SP'),
      date: item.date || new Date(Date.now() + 86400000 * (20 + idx * 5)).toISOString(),
      price: item.price ? parseFloat(item.price) : (item.source === 'tmdb' ? 45.00 : 280.00),
      banner_url: item.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    }));

    const res = await api.bulkImportEvents(sanitizedItems);
    setLoading(false);

    if (res.success && res.events && res.events.length > 0) {
      onEventCreated(res.events);
      onClose();
    } else {
      setActionError(res.message || 'Não foi possível importar os eventos. Verifique sua sessão de organizador.');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title || !venue || !date) {
      setActionError('Título, local e data são obrigatórios.');
      return;
    }

    setLoading(true);
    setActionError(null);

    const eventData = {
      title: title.trim(),
      description: description || 'Evento publicado pelo organizador.',
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
      <>
        <button
          type="button"
          onClick={() => setStep('configure')}
          className="flex-1 min-h-[48px] px-3 rounded-xl border border-zinc-700/80 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all touch-manipulation active:scale-[0.98]"
        >
          Editar detalhes
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleBulkImport}
          disabled={loading}
          className="flex-[2] min-h-[48px] px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40 touch-manipulation active:scale-[0.98] disabled:opacity-40"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
          ) : (
            `Importar (${selectedExternalItems.length}) em Lote`
          )}
        </button>
      </>
    ) : null
  ) : (
    <>
      <button
        type="button"
        onClick={() => setStep('select')}
        className="flex-1 min-h-[48px] px-4 rounded-xl border border-zinc-700/80 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition-all touch-manipulation active:scale-[0.98]"
      >
        Voltar à seleção
      </button>
      <button
        type="button"
        onClick={() => handleSubmit()}
        disabled={loading}
        className="flex-[2] min-h-[48px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40 touch-manipulation active:scale-[0.98] disabled:opacity-40"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
        ) : (
          'Publicar evento (80 Assentos)'
        )}
      </button>
    </>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Publicar evento / Importação"
      subtitle="Catálogo externo (TMDb / Ticketmaster) ou criação manual."
      maxWidthClass="sm:max-w-xl"
      maxHeightClass="max-h-[85dvh] sm:max-h-[88dvh]"
      footer={footerActions}
    >
      {/* Steps Switcher */}
      <div className="flex border-b border-zinc-800 bg-zinc-900/40 rounded-xl p-1 mb-2">
        <button
          type="button"
          onClick={() => setStep('select')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg text-center transition-all ${
            step === 'select'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          1. Seleção em Lote ({selectedExternalItems.length})
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
          2. Configurar Detalhes
        </button>
      </div>

      {actionError && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-800/60 bg-red-950/40 p-3 text-xs text-red-300 animate-in fade-in">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <span>{actionError}</span>
        </div>
      )}

      {step === 'select' ? (
        <div className="space-y-4">
          {/* Source tabs */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 w-fit">
              <button
                type="button"
                onClick={() => setSource('tmdb')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  source === 'tmdb' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-emerald-400" />
                TMDb (Filmes)
              </button>
              <button
                type="button"
                onClick={() => setSource('ticketmaster')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  source === 'ticketmaster' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Music className="w-3.5 h-3.5 text-cyan-400" />
                Ticketmaster
              </button>
            </div>

            <span className="text-[11px] font-mono text-zinc-500">
              {externalResults.length} atrações
            </span>
          </div>

          {/* Results with Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {externalResults.map((item) => {
              const isSelected = selectedExternalItems.some((i) => i.externalId === item.externalId);
              const isAlreadyImported = existingEventTitles.includes(item.title.toLowerCase().trim());

              return (
                <div
                  key={item.externalId}
                  onClick={() => !isAlreadyImported && handleToggleExternalItem(item)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isAlreadyImported
                      ? 'bg-zinc-900/20 border-zinc-800/30 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-emerald-950/30 border-emerald-600/60 cursor-pointer shadow-sm'
                      : 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700 cursor-pointer'
                  }`}
                >
                  <div className="flex gap-2.5 items-start">
                    <div className="shrink-0 pt-0.5 text-emerald-400">
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
                      className="w-12 h-12 rounded-lg object-cover shrink-0 border border-zinc-800"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5 leading-tight">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-zinc-800/40 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 font-mono text-[10px]">{item.source.toUpperCase()}</span>
                    {isAlreadyImported ? (
                      <span className="text-zinc-400 font-mono text-[10px] bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                        ✓ Já no Catálogo
                      </span>
                    ) : isSelected ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Selecionado
                      </span>
                    ) : (
                      <span className="text-zinc-500">Clique para selecionar</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Título do Evento *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoCapitalize="words"
              className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Data & Horário *</label>
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Preço Base (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Local / Arena *</label>
            <input
              type="text"
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              autoCapitalize="words"
              className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Descrição</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>
        </form>
      )}
    </BottomSheet>
  );
};
