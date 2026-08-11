import React, { useState } from 'react';
import { Plus, X, Film, Music, Sparkles, Calendar, MapPin, DollarSign, Image } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'create' | 'import'>('create');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [price, setPrice] = useState('299.90');
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !venue || !date) return;

    setLoading(true);
    setMessage(null);

    try {
      const newEvent: EventItem = {
        id: `e-${Date.now()}`,
        title,
        description: description || 'Evento incrível de tecnologia e entretenimento.',
        venue,
        date: new Date(date).toISOString(),
        price: parseFloat(price) || 299.90,
        banner_url: bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
      };

      onEventCreated(newEvent);
      onClose();
    } catch (err: any) {
      setMessage('Erro ao criar evento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportSource = async (source: 'tmdb' | 'ticketmaster') => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.importExternalEvent(source);
      if (res.success && res.event) {
        onEventCreated(res.event);
        onClose();
      } else {
        setMessage('Falha ao importar evento via ' + source.toUpperCase());
      }
    } catch (err: any) {
      setMessage('Erro ao sincronizar com API externa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
              <Plus className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-base font-display text-white">Painel do Organizador</h3>
              <p className="text-xs text-slate-400">Criar evento ou importar de API externa</p>
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
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'create'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Criar Evento Manual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'import'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Importar de API Externa
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {message && (
            <div className="mb-4 p-3 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-medium">
              {message}
            </div>
          )}

          {activeTab === 'create' ? (
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Título do Evento *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Rock Festival 2026 ou Premiere de Cinema"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Data e Hora *
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
                    Preço Base (R$) *
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
                  Local / Arena *
                </label>
                <input
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Ex: Allianz Parque - São Paulo, SP"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Resumo do espetáculo, atores ou artistas principais..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
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
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Sincronize eventos ao vivo diretamente do catálogo das APIs internacionais recomendadas no desafio:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleImportSource('tmdb')}
                  disabled={loading}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 text-left transition flex flex-col gap-2 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                    <Film className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">API TMDb (Filmes)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Importar lançamentos e cartazes de cinema</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleImportSource('ticketmaster')}
                  disabled={loading}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 text-left transition flex flex-col gap-2 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center">
                    <Music className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Ticketmaster Discovery</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Importar shows e turnês internacionais</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
