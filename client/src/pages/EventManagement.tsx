import React, { useEffect, useState } from 'react';
import { api, EventItem } from '../lib/api';
import { OrganizerModal } from '../components/OrganizerModal';
import { BottomSheet } from '../components/BottomSheet';
import {
  Calendar,
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  DollarSign,
  Ticket,
  AlertTriangle,
  CheckCircle2,
  Sliders
} from 'lucide-react';

interface EventManagementProps {
  onSelectEvent: (eventId: string) => void;
}

export const EventManagement: React.FC<EventManagementProps> = ({ onSelectEvent }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      setSuccessMessage('Evento atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
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
      setSuccessMessage('Evento excluído com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
      setDeletingEvent(null);
      await loadEvents();
    } else {
      setDeleteError(res.error || 'Erro ao excluir evento.');
    }
  };

  const handleEventCreated = (newEvent: EventItem | EventItem[]) => {
    const newItems = Array.isArray(newEvent) ? newEvent : [newEvent];
    setEvents((prev) => [...newItems, ...prev.filter((e) => !newItems.some((n) => n.id === e.id))]);
    setSuccessMessage(`${newItems.length} evento(s) publicado(s) com sucesso!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-8 pb-28 sm:pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/60 font-semibold">
              Painel do Organizador
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1.5">
            Gestão de Eventos
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Crie, edite, monitore e gerencie os espetáculos publicados na plataforma.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-emerald-950/30 touch-manipulation active:scale-[0.98] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Publicar evento</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-xs sm:text-sm rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#111113] p-4 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
            <Ticket className="w-4 h-4 text-emerald-400" />
            <span>Eventos Publicados</span>
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-2">{events.length}</p>
        </div>

        <div className="bg-[#111113] p-4 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Capacidade Padrão</span>
          </div>
          <p className="text-2xl font-bold font-mono text-cyan-400 mt-2">80 assentos</p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-[#111113] p-4 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>Preço Médio</span>
          </div>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-2">
            R$ {events.length > 0 ? (events.reduce((acc, e) => acc + (typeof e.price === 'number' ? e.price : parseFloat(e.price || '0')), 0) / events.length).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 bg-[#111113] p-2.5 rounded-2xl border border-zinc-800">
        <Search className="w-4 h-4 text-zinc-500 ml-2 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por título ou local do evento..."
          className="w-full bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs text-zinc-500 hover:text-zinc-300 px-2 font-mono"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Events List / Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-[#111113] rounded-3xl border border-zinc-800 p-8 space-y-3">
          <p className="text-sm font-medium text-white">Nenhum evento encontrado.</p>
          <p className="text-xs text-zinc-500">Tente ajustar a busca ou publique uma nova atração.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-[#111113] p-4 sm:p-5 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Event Info */}
              <div className="flex items-start gap-4 min-w-0">
                <img
                  src={evt.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=300&q=80'}
                  alt={evt.title}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-zinc-800 shrink-0"
                />
                <div className="min-w-0 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                    Publicado
                  </span>
                  <h3 className="text-base font-bold text-white truncate">{evt.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      {new Date(evt.date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-xs">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      {evt.venue}
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      R$ {typeof evt.price === 'number' ? evt.price.toFixed(2) : parseFloat(evt.price || '0').toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => onSelectEvent(evt.id)}
                  title="Visualizar Mapa de Assentos"
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors flex items-center gap-1.5 touch-manipulation"
                >
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Ver Mapa</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(evt)}
                  title="Editar Evento"
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors flex items-center gap-1.5 touch-manipulation"
                >
                  <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeletingEvent(evt);
                    setDeleteError(null);
                  }}
                  title="Excluir Evento"
                  className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-300 font-semibold text-xs transition-colors flex items-center gap-1.5 touch-manipulation"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          ))}
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
          subtitle="Atualize as informações do espetáculo publicado."
          maxWidthClass="sm:max-w-md"
          maxHeightClass="max-h-[85dvh]"
          footer={
            <div className="w-full flex gap-2">
              <button
                type="button"
                onClick={() => handleSaveEdit()}
                disabled={editLoading}
                className="flex-[2] min-h-[48px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 shadow-lg shadow-emerald-950/40 touch-manipulation active:scale-[0.98]"
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
                className="flex-1 min-h-[48px] rounded-xl border border-zinc-700/80 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition-all touch-manipulation active:scale-[0.98]"
              >
                Cancelar
              </button>
            </div>
          }
        >
          {editError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 text-red-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Título do Evento</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Local / Arena</label>
            <input
              type="text"
              value={editVenue}
              onChange={(e) => setEditVenue(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Data e Hora</label>
              <input
                type="datetime-local"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Preço Base (R$)</label>
              <input
                type="number"
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Descrição</label>
            <textarea
              rows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">URL do Banner / Pôster</label>
            <input
              type="text"
              value={editBannerUrl}
              onChange={(e) => setEditBannerUrl(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono truncate"
            />
          </div>
        </BottomSheet>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEvent && (
        <BottomSheet
          isOpen={!!deletingEvent}
          onClose={() => setDeletingEvent(null)}
          title="Confirmar Exclusão"
          subtitle="Atenção: esta ação é irreversível."
          maxWidthClass="sm:max-w-sm"
          footer={
            <div className="w-full flex gap-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="flex-[2] min-h-[48px] rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 shadow-lg shadow-red-950/40 touch-manipulation active:scale-[0.98]"
              >
                {deleteLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Sim, Excluir Evento</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setDeletingEvent(null)}
                className="flex-1 min-h-[48px] rounded-xl border border-zinc-700/80 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition-all touch-manipulation active:scale-[0.98]"
              >
                Voltar
              </button>
            </div>
          }
        >
          {deleteError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 text-red-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="space-y-2 text-center py-2">
            <p className="text-sm text-zinc-200">
              Tem certeza que deseja excluir o evento:
            </p>
            <p className="text-base font-bold text-white bg-zinc-900 p-3 rounded-xl border border-zinc-800">
              {deletingEvent.title}
            </p>
            <p className="text-xs text-zinc-500">
              Todos os 80 assentos associados a este evento serão removidos da base.
            </p>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};
