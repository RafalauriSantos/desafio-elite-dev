import React, { useEffect, useState } from 'react';
import { api, EventItem } from '../lib/api';
import { OrganizerModal } from '../components/OrganizerModal';
import { BottomSheet } from '../components/BottomSheet';
import {
  Calendar,
  MapPin,
  Plus,
  Search,
  Edit3,
  Trash2,
  ExternalLink,
  DollarSign,
  Ticket,
  AlertOctagon,
  CheckCircle2,
  Film,
  Music,
  ChevronRight,
  MoreVertical,
  Clock,
  Sparkles
} from 'lucide-react';

interface EventManagementProps {
  onSelectEvent: (eventId: string) => void;
}

export const EventManagement: React.FC<EventManagementProps> = ({ onSelectEvent }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'movies' | 'shows'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Edit Modal State
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Confirm State
  const [deletingEvent, setDeletingEvent] = useState<EventItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const data = await api.getEvents();
    setEvents(data);
    setLoading(false);
  };

  const handleOpenEdit = (evt: EventItem) => {
    setEditingEvent(evt);
    setEditTitle(evt.title);
    setEditVenue(evt.venue);
    setEditDate(evt.date ? new Date(evt.date).toISOString().slice(0, 16) : '');
    setEditPrice(String(evt.price));
    setEditDescription(evt.description || '');
    setEditBannerUrl(evt.banner_url || '');
    setEditError(null);
  };

  const handleSaveEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingEvent) return;

    if (!editTitle.trim() || !editVenue.trim() || !editDate) {
      setEditError('Título, local e data são obrigatórios.');
      return;
    }

    setEditLoading(true);
    setEditError(null);

    const res = await api.updateEvent(editingEvent.id, {
      title: editTitle.trim(),
      venue: editVenue.trim(),
      date: new Date(editDate).toISOString(),
      price: parseFloat(editPrice) || editingEvent.price,
      description: editDescription.trim(),
      banner_url: editBannerUrl.trim(),
    });

    setEditLoading(false);

    if (res.success) {
      setToastMessage('Evento atualizado com sucesso.');
      setTimeout(() => setToastMessage(null), 3000);
      setEditingEvent(null);
      await loadEvents();
    } else {
      setEditError(res.error || 'Erro ao atualizar evento.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;

    setDeleteLoading(true);
    setDeleteError(null);

    const res = await api.deleteEvent(deletingEvent.id);
    setDeleteLoading(false);

    if (res.success) {
      setToastMessage('Evento excluído do catálogo.');
      setTimeout(() => setToastMessage(null), 3000);
      setDeletingEvent(null);
      await loadEvents();
    } else {
      setDeleteError(res.error || 'Erro ao excluir evento.');
    }
  };

  const handleEventCreated = (newEvent: EventItem | EventItem[]) => {
    const newItems = Array.isArray(newEvent) ? newEvent : [newEvent];
    setEvents((prev) => [...newItems, ...prev.filter((e) => !newItems.some((n) => n.id === e.id))]);
    setToastMessage(`${newItems.length} novo(s) evento(s) publicado(s).`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterCategory === 'movies') {
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
    if (filterCategory === 'shows') {
      return (
        e.title.includes('Show') ||
        e.title.includes('Tour') ||
        e.title.includes('Coldplay') ||
        e.title.includes('Festival') ||
        e.title.includes('Taylor') ||
        e.venue.includes('Allianz') ||
        e.venue.includes('Arena')
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-28 sm:pb-16 max-w-6xl mx-auto">
      {/* Top Minimalist Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Gestão de Eventos
            </h1>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              {events.length} {events.length === 1 ? 'evento' : 'eventos'}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Painel operacional para publicação, edição de preços e exclusão de espetáculos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.98] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Publicar Evento</span>
        </button>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-zinc-900 border border-emerald-500/40 text-zinc-200 text-xs rounded-xl flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Search & Segmented Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 w-fit">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterCategory === 'all'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todos ({events.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('movies')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterCategory === 'movies'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Cinema / TMDb</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('shows')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterCategory === 'shows'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Shows & Festivais</span>
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por nome ou local..."
            className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-700 transition-colors"
          />
        </div>
      </div>

      {/* Main Unified Linear Data Table */}
      {loading ? (
        <div className="rounded-2xl border border-zinc-800/80 bg-[#0e0e11] divide-y divide-zinc-800/60 overflow-hidden">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="p-4 flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-zinc-800" />
                <div className="space-y-2">
                  <div className="w-48 h-3.5 rounded bg-zinc-800" />
                  <div className="w-32 h-2.5 rounded bg-zinc-800/60" />
                </div>
              </div>
              <div className="w-20 h-4 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-[#0e0e11] rounded-2xl border border-zinc-800/80 p-8 space-y-3">
          <Ticket className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-sm font-medium text-white">Nenhum evento encontrado</p>
          <p className="text-xs text-zinc-500">Tente ajustar o termo de busca ou publique um novo evento.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800/80 bg-[#0e0e11] overflow-hidden shadow-xl">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-mono uppercase tracking-wider text-zinc-500 border-b border-zinc-800/80 bg-zinc-900/40">
            <span className="col-span-5">Atração / Espetáculo</span>
            <span className="col-span-3">Data & Horário</span>
            <span className="col-span-2">Preço Base</span>
            <span className="col-span-2 text-right">Ações</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-zinc-800/60">
            {filteredEvents.map((evt) => {
              const eventDateObj = new Date(evt.date);
              const formattedDate = !isNaN(eventDateObj.getTime())
                ? eventDateObj.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Data a definir';

              const priceFormatted =
                typeof evt.price === 'number'
                  ? evt.price.toFixed(2)
                  : parseFloat(evt.price || '0').toFixed(2);

              return (
                <div
                  key={evt.id}
                  className="px-4 sm:px-5 py-3.5 flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center hover:bg-zinc-900/50 transition-colors group"
                >
                  {/* Column 1: Event Title & Venue */}
                  <div className="col-span-5 flex items-center gap-3.5 min-w-0 w-full">
                    <img
                      src={
                        evt.banner_url ||
                        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={evt.title}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-zinc-800 shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white truncate max-w-[220px] sm:max-w-xs">
                          {evt.title}
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-400 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </p>
                    </div>
                  </div>

                  {/* Column 2: Date */}
                  <div className="col-span-3 text-xs text-zinc-300 font-mono flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0 md:hidden" />
                    <span>{formattedDate}</span>
                  </div>

                  {/* Column 3: Price & Seat Capacity */}
                  <div className="col-span-2 flex items-baseline gap-2 md:block">
                    <span className="text-xs md:text-sm font-bold font-mono text-emerald-400">
                      R$ {priceFormatted}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono block">80 assentos</span>
                  </div>

                  {/* Column 4: Action Buttons */}
                  <div className="col-span-2 flex items-center justify-end gap-1.5 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800/60">
                    <button
                      type="button"
                      onClick={() => onSelectEvent(evt.id)}
                      title="Ver mapa de assentos"
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">Mapa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(evt)}
                      title="Editar informações do evento"
                      className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeletingEvent(evt);
                        setDeleteError(null);
                      }}
                      title="Excluir evento do catálogo"
                      className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Organizer Create / Bulk Import Modal */}
      <OrganizerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={handleEventCreated}
      />

      {/* Edit Event Bottom Sheet */}
      {editingEvent && (
        <BottomSheet
          isOpen={!!editingEvent}
          onClose={() => setEditingEvent(null)}
          title="Editar Evento"
          subtitle="Atualize os dados cadastrais do espetáculo."
          maxWidthClass="sm:max-w-md"
          maxHeightClass="max-h-[85dvh]"
          footer={
            <div className="w-full flex gap-2">
              <button
                type="button"
                onClick={() => handleSaveEdit()}
                disabled={editLoading}
                className="flex-[2] min-h-[48px] rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 shadow-sm touch-manipulation active:scale-[0.98]"
              >
                {editLoading ? (
                  <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                ) : (
                  <span>Salvar Alterações</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="flex-1 min-h-[48px] rounded-xl border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 text-xs font-semibold transition-all touch-manipulation active:scale-[0.98]"
              >
                Cancelar
              </button>
            </div>
          }
        >
          {editError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 text-red-300 text-xs rounded-xl flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Título do Evento
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-zinc-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Local / Arena</label>
              <input
                type="text"
                value={editVenue}
                onChange={(e) => setEditVenue(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-zinc-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Data e Hora</label>
                <input
                  type="datetime-local"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-zinc-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Preço Base (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-zinc-700 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Descrição</label>
              <textarea
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-zinc-700 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                URL do Banner / Pôster
              </label>
              <input
                type="text"
                value={editBannerUrl}
                onChange={(e) => setEditBannerUrl(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-zinc-700 font-mono truncate"
              />
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEvent && (
        <BottomSheet
          isOpen={!!deletingEvent}
          onClose={() => setDeletingEvent(null)}
          title="Excluir Evento"
          subtitle="Atenção: esta ação não pode ser desfeita."
          maxWidthClass="sm:max-w-sm"
          footer={
            <div className="w-full flex gap-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="flex-[2] min-h-[48px] rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 shadow-sm touch-manipulation active:scale-[0.98]"
              >
                {deleteLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Excluir Definitivamente</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setDeletingEvent(null)}
                className="flex-1 min-h-[48px] rounded-xl border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 text-xs font-semibold transition-all touch-manipulation active:scale-[0.98]"
              >
                Cancelar
              </button>
            </div>
          }
        >
          {deleteError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 text-red-300 text-xs rounded-xl flex items-center gap-2 mb-3">
              <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="space-y-3 text-center py-2">
            <p className="text-xs sm:text-sm text-zinc-300">
              Deseja remover este espetáculo do catálogo ativo?
            </p>
            <p className="text-sm font-bold text-white bg-zinc-900 p-3 rounded-xl border border-zinc-800 font-mono">
              {deletingEvent.title}
            </p>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              A matriz de 80 assentos vinculada será excluída da base de dados.
            </p>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};
