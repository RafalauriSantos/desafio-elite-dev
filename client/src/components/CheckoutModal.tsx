import React, { useState } from 'react';
import { SeatItem, EventItem } from '../lib/api';
import { X } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  event: EventItem;
  seat?: SeatItem;
  seats?: SeatItem[];
  onClose: () => void;
  onSuccess: (tickets: any[], qrData: string[]) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  event,
  seat,
  seats,
  onClose,
  onSuccess,
}) => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentOutcome, setPaymentOutcome] = useState<'approved' | 'declined'>('approved');

  if (!isOpen) return null;

  const targetSeats = seats && seats.length > 0 ? seats : seat ? [seat] : [];
  const totalPrice = targetSeats.reduce((sum, s) => sum + s.price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      setError('Informe seu nome e e-mail.');
      return;
    }

    if (targetSeats.length === 0) {
      setError('Nenhum assento selecionado.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { api } = await import('../lib/api');
      const reservation = await api.reserveSeatsBatch(targetSeats.map((targetSeat) => targetSeat.id), userEmail);
      if (!reservation.success) {
        setError(reservation.message || 'Um ou mais assentos ficaram indisponíveis.');
        return;
      }
      
      const res = await api.checkout({
        seatIds: targetSeats.map((targetSeat) => targetSeat.id),
        eventId: event.id,
        userEmail,
        userName,
        paymentOutcome,
      });

      if (res.success && res.tickets?.length && res.qrCodes?.length) {
        onSuccess(res.tickets, res.qrCodes);
      } else {
        setError(res.error || 'Erro ao processar checkout.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Mobile Bottom Sheet / Desktop Modal Container */}
      <div className="w-full sm:max-w-md bg-[#111113] rounded-t-2xl sm:rounded-2xl border border-zinc-800/80 shadow-2xl relative max-h-[92dvh] sm:max-h-[85dvh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="shrink-0 p-5 pb-3 border-b border-zinc-800/40 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-semibold text-white">Finalizar compra</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Seus dados para emissão dos ingressos digitais.</p>
        </div>

        {/* Scrollable Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
            
            {/* Order summary */}
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/40 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-white">{event.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{event.venue}</p>
                </div>
                <span className="text-[11px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded font-medium shrink-0 ml-2">
                  {targetSeats.length} {targetSeats.length === 1 ? 'ingresso' : 'ingressos'}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {targetSeats.map((s) => (
                  <span key={s.id} className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                    {s.row_name}{s.seat_number}
                  </span>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs border-t border-zinc-800/40 pt-2.5">
                <span className="text-zinc-400">Total a pagar:</span>
                <span className="text-emerald-400 font-mono font-bold text-base">
                  R$ {totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-400 text-xs rounded-lg animate-in fade-in">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Nome completo</label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Rafael Santos"
                autoComplete="name"
                autoCapitalize="words"
                className="w-full bg-zinc-900/70 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">E-mail para recebimento</label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="rafael@exemplo.com"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                className="w-full bg-zinc-900/70 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Resultado do pagamento simulado</label>
              <select
                value={paymentOutcome}
                onChange={(e) => setPaymentOutcome(e.target.value as 'approved' | 'declined')}
                className="w-full bg-zinc-900/70 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-white outline-none focus:border-zinc-600 transition-colors cursor-pointer"
              >
                <option value="approved">Aprovar pagamento</option>
                <option value="declined">Recusar pagamento</option>
              </select>
              <p className="text-[11px] text-zinc-500 mt-1.5">A recusa libera os assentos e não emite ingressos.</p>
            </div>
          </div>

          {/* Action Footer (Always Pinned, Safe from Mobile Nav) */}
          <div className="sticky bottom-0 shrink-0 p-4 sm:p-5 pt-3 pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] bg-[#111113] border-t border-zinc-800/80 flex gap-2.5 shadow-2xl z-10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/60 text-sm font-medium transition-colors touch-manipulation active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-colors disabled:opacity-40 flex items-center justify-center shadow-lg shadow-emerald-950/20 touch-manipulation active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
              ) : (
                'Confirmar e emitir'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
