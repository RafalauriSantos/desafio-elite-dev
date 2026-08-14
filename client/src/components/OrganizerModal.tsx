import React, { useEffect, useState } from 'react';
import { Plus, X, Film, Music, Calendar, MapPin, ArrowRight, CheckCircle2, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { api, EventItem } from '../lib/api';

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
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, source]);

  const loadCatalog = async () => {
    setLoading(true);
    const results = await api.fetchExternalCatalog(source, '');
    setExternalResults(results);
    setLoading(false);
  };

  const handleToggleExternalItem = (item: any) => {
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
      banner_url: item.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !venue || !date) return;

    setLoading(true);
    setActionError(null);

    const eventData = {
      title,
      description: description || 'Evento publicado pelo organizador.',
      venue,
      date: new Date(date).toISOString(),
      price: parseFloat(price) || 200.00,
      banner_url: bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Bottom Sheet Mobile / Centered Modal Desktop */}
      <div className="bg-[#111113] border border-zinc-800/60 rounded-t-2xl sm:rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-0">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/40 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-semibold text-white">Publicar evento / Importação em lote</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Selecione eventos das APIs externas ou configure manualmente.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="flex border-b border-zinc-800/40 bg-zinc-900/30 shrink-0">
          <button
            type="button"
            onClick={() => setStep('select')}
            className={`flex-1 py-2.5 text-[12px] font-medium text-center transition-colors ${
              step === 'select' ? 'text-white border-b-2 border-emerald-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            1. Seleção individual / lote
          </button>
          <button
            type="button"
            onClick={() => setStep('configure')}
            className={`flex-1 py-2.5 text-[12px] font-medium text-center transition-colors ${
              step === 'configure' ? 'text-white border-b-2 border-emerald-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            2. Configurar detalhes
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {actionError && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
          {step === 'select' ? (
            <>
              {/* Source tabs */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 bg-zinc-900/60 p-1 rounded-lg border border-zinc-800/40 w-fit">
                  <button
                    type="button"
                    onClick={() => setSource('tmdb')}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                      source === 'tmdb' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Film className="w-3 h-3" />
                    TMDb (Filmes)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSource('ticketmaster')}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                      source === 'ticketmaster' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Music className="w-3 h-3" />
                    Ticketmaster
                  </button>
                </div>

                {selectedExternalItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkImport}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
                  >
                    {loading ? (
                      <div className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                    ) : (
                      <>Importar em Lote ({selectedExternalItems.length})</>
                    )}
                  </button>
                )}
              </div>

              {/* Results with Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {externalResults.map((item) => {
                  const isSelected = selectedExternalItems.some((i) => i.externalId === item.externalId);
                  return (
                    <div
                      key={item.externalId}
                      onClick={() => handleToggleExternalItem(item)}
                      className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/20 border-emerald-700/50'
                          : 'bg-zinc-900/40 border-zinc-800/40 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex gap-2.5 items-start">
                        <div className="shrink-0 pt-0.5 text-emerald-400">
                          {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-zinc-600" />}
                        </div>
                        <img
                          src={item.banner_url}
                          alt={item.title}
                          className="w-12 h-12 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white truncate">{item.title}</p>
                          <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5 leading-tight">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-zinc-800/30 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-600">{item.source.toUpperCase()}</span>
                        {isSelected ? (
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

              {selectedExternalItems.length > 0 && (
                <div className="flex justify-end pt-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('configure')}
                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
                  >
                    Editar detalhes
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkImport}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    Importar ({selectedExternalItems.length}) em Lote
                  </button>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Título *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoCapitalize="words"
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-zinc-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Data *</label>
                  <input
                    type="datetime-local"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Preço (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Local *</label>
                <input
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  autoCapitalize="words"
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-zinc-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Descrição</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-zinc-600 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="px-3 py-2.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors"
                >
                  Publicar evento
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
