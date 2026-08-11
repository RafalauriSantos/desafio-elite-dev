import React, { useEffect, useState } from 'react';
import { api, EventItem, SeatItem } from '../lib/api';
import { SeatMap } from '../components/SeatMap';
import { CheckoutModal } from '../components/CheckoutModal';
import { EmailPreviewModal } from '../components/EmailPreviewModal';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';

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

  const handleSelectSeat = async (seat: SeatItem) => {
    setSelectedSeat(seat);
    setReserveMessage(null);
  };

  const handleProceedToCheckout = async () => {
    if (!selectedSeat) return;
    setIsReserving(true);

    const res = await api.reserveSeat(selectedSeat.id, 'usuario@exemplo.com');

    setIsReserving(false);
    if (res.success) {
      setIsModalOpen(true);
    } else {
      setReserveMessage(res.message || 'Assento indisponível.');
      loadEventData();
    }
  };

  if (loading || !event) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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

        {/* Selection summary */}
        <div className="w-full lg:w-72 bg-[#111113] p-4 rounded-xl border border-zinc-800/60 shrink-0">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">Assento selecionado</p>
          {selectedSeat ? (
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="font-mono font-semibold text-white">
                  {selectedSeat.row_name}{selectedSeat.seat_number}
                </span>
                <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                  {selectedSeat.category}
                </span>
              </div>
              <p className="text-lg font-semibold text-emerald-400 font-mono">
                R$ {selectedSeat.price.toFixed(2)}
              </p>
              <button
                onClick={handleProceedToCheckout}
                disabled={isReserving}
                className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isReserving ? (
                  <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                ) : (
                  'Reservar'
                )}
              </button>
            </div>
          ) : (
            <p className="text-xs text-zinc-600">Clique em um assento no mapa.</p>
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
