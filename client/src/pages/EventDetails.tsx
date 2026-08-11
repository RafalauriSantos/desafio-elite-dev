import React, { useEffect, useState } from 'react';
import { api, EventItem, SeatItem } from '../lib/api';
import { SeatMap } from '../components/SeatMap';
import { CheckoutModal } from '../components/CheckoutModal';
import { ArrowLeft, Calendar, MapPin, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

interface EventDetailsProps {
  eventId: string;
  onBack: () => void;
  onTicketPurchased: (ticket: any, qrData: string) => void;
}

export const EventDetails: React.FC<EventDetailsProps> = ({
  eventId,
  onBack,
  onTicketPurchased,
}) => {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState<SeatItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [reserveMessage, setReserveMessage] = useState<string | null>(null);

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const loadEventData = async () => {
    setLoading(true);
    const data = await api.getEventDetails(eventId);
    setEvent(data.event);
    setSeats(data.seats);
    setLoading(false);
  };

  const handleSelectSeat = async (seat: SeatItem) => {
    setSelectedSeat(seat);
    setReserveMessage(null);
  };

  const handleProceedToCheckout = async () => {
    if (!selectedSeat) return;
    setIsReserving(true);
    
    // Call optimistic lock RPC reservation endpoint
    const res = await api.reserveSeat(selectedSeat.id, 'usuario@exemplo.com');

    setIsReserving(false);
    if (res.success) {
      setIsModalOpen(true);
    } else {
      setReserveMessage(res.message || 'Assento indisponível ou já reservado por outro usuário.');
      // Refresh seat status
      loadEventData();
    }
  };

  if (loading || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs mt-4">Carregando mapa de assentos em tempo real...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Back Header */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar ao Catálogo</span>
      </button>

      {/* Event Header Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between relative overflow-hidden">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-indigo-950/80 border border-indigo-500/30 px-3 py-1 rounded-full text-[11px] font-semibold text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Seleção Numerada de Assentos</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold font-display text-white">{event.title}</h1>
          
          <div className="flex flex-wrap gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>{new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span>{event.venue}</span>
            </div>
          </div>
        </div>

        {/* Selected Seat Checkout Card Floating */}
        <div className="w-full md:w-auto bg-slate-900/90 p-5 rounded-2xl border border-slate-700/80 min-w-[260px] flex flex-col gap-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Assento Selecionado</span>
          {selectedSeat ? (
            <div>
              <div className="flex justify-between items-baseline">
                <span className="font-extrabold text-lg text-white font-mono">
                  Fileira {selectedSeat.row_name} - N° {selectedSeat.seat_number}
                </span>
                <span className="text-xs text-indigo-400 font-bold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                  {selectedSeat.category}
                </span>
              </div>
              <p className="text-xl font-black text-indigo-400 mt-1">
                R$ {selectedSeat.price.toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Nenhum assento clicado até o momento</p>
          )}

          <button
            onClick={handleProceedToCheckout}
            disabled={!selectedSeat || isReserving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition disabled:opacity-40"
          >
            {isReserving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Reservar & Ir para Checkout</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Reservation Error Banner */}
      {reserveMessage && (
        <div className="p-4 bg-amber-950/70 border border-amber-800 text-amber-300 text-xs rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{reserveMessage}</span>
        </div>
      )}

      {/* Interactive Seat Map Component */}
      <SeatMap
        seats={seats}
        selectedSeatId={selectedSeat?.id || null}
        onSelectSeat={handleSelectSeat}
        isReserving={isReserving}
      />

      {/* Checkout Modal */}
      {selectedSeat && (
        <CheckoutModal
          isOpen={isModalOpen}
          event={event}
          seat={selectedSeat}
          onClose={() => setIsModalOpen(false)}
          onSuccess={(ticket, qrData) => {
            setIsModalOpen(false);
            onTicketPurchased(ticket, qrData);
          }}
        />
      )}
    </div>
  );
};
