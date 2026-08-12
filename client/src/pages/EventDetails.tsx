import React, { useEffect, useState } from 'react';
import { api, EventItem, SeatItem } from '../lib/api';
import { SeatMap } from '../components/SeatMap';
import { CheckoutModal } from '../components/CheckoutModal';
import { EmailPreviewModal } from '../components/EmailPreviewModal';
import { ArrowLeft, Calendar, MapPin, X } from 'lucide-react';

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
  const [selectedSeats, setSelectedSeats] = useState<SeatItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [reserveMessage, setReserveMessage] = useState<string | null>(null);

  // Email preview state
  const [purchasedTicket, setPurchasedTicket] = useState<any | null>(null);
  const [purchasedQrData, setPurchasedQrData] = useState<string>('');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  useEffect(() => {
    loadEventData();

    // Silent background polling every 3s to sync seat map locks in realtime across browsers
    const pollingInterval = setInterval(async () => {
      try {
        const data = await api.getEventDetails(eventId);
        setSeats(data.seats);
      } catch {
        // Ignore silent background refresh errors
      }
    }, 3000);

    return () => clearInterval(pollingInterval);
  }, [eventId]);

  const loadEventData = async () => {
    setLoading(true);
    const data = await api.getEventDetails(eventId);
    setEvent(data.event);
    setSeats(data.seats);
    setLoading(false);
  };

  const handleToggleSeat = (seat: SeatItem) => {
    setReserveMessage(null);
    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.id === seat.id);
      if (exists) {
        return prev.filter((s) => s.id !== seat.id);
      } else {
        return [...prev, seat];
      }
    });
  };

  const handleProceedToCheckout = async () => {
    if (selectedSeats.length === 0) return;
    setIsReserving(true);

    const seatIds = selectedSeats.map((s) => s.id);
    const res = await api.reserveSeatsBatch(seatIds, 'usuario@exemplo.com');

    setIsReserving(false);
    if (res.success) {
      setIsModalOpen(true);
    } else {
      setReserveMessage(res.message || 'Um ou mais assentos estão indisponíveis.');
      loadEventData();
    }
  };

  const totalPrice = selectedSeats.reduce((acc, s) => acc + s.price, 0);

  if (loading || !event) {
    return (
      <div className="flex items-center justify-center py-20 w-full flex-1">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar
      </button>

      {/* Event header + sidebar */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white tracking-tight">{event.title}</h1>
          <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {event.venue}
            </span>
          </div>
        </div>

        {/* Selection summary with multi-seat support */}
        <div className="w-full lg:w-80 bg-[#111113] p-4 rounded-xl border border-zinc-800/60 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-bold">
              Assentos selecionados ({selectedSeats.length})
            </p>
            {selectedSeats.length > 0 && (
              <button
                onClick={() => setSelectedSeats([])}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5"
              >
                <X className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>

          {selectedSeats.length > 0 ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {selectedSeats.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded text-xs font-mono font-semibold text-emerald-400 border border-zinc-700/60"
                  >
                    {s.row_name}{s.seat_number}
                  </span>
                ))}
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t border-zinc-800/60">
                <span className="text-xs text-zinc-400">Total do Lote:</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">
                  R$ {totalPrice.toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleProceedToCheckout}
                disabled={isReserving}
                className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isReserving ? (
                  <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                ) : (
                  `Reservar Lote (${selectedSeats.length})`
                )}
              </button>
            </div>
          ) : (
            <p className="text-xs text-zinc-600 py-2">Clique em uma ou mais poltronas no mapa para seleção múltipla.</p>
          )}
        </div>
      </div>

      {/* Error */}
      {reserveMessage && (
        <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-400 text-xs rounded-lg">
          {reserveMessage}
        </div>
      )}

      {/* Seat Map */}
      <SeatMap
        seats={seats}
        selectedSeatIds={selectedSeats.map((s) => s.id)}
        onToggleSeat={handleToggleSeat}
        isReserving={isReserving}
      />

      {/* Checkout Modal */}
      {selectedSeats.length > 0 && (
        <CheckoutModal
          isOpen={isModalOpen}
          event={event}
          seats={selectedSeats}
          onClose={() => setIsModalOpen(false)}
          onSuccess={(ticket, qrData) => {
            setIsModalOpen(false);
            setPurchasedTicket(ticket);
            setPurchasedQrData(qrData);
            setIsEmailModalOpen(true);
            onTicketPurchased(ticket, qrData);
          }}
        />
      )}

      {/* Email Confirmation Preview Modal */}
      <EmailPreviewModal
        isOpen={isEmailModalOpen}
        ticket={purchasedTicket}
        qrData={purchasedQrData}
        onClose={() => setIsEmailModalOpen(false)}
      />
    </div>
  );
};
