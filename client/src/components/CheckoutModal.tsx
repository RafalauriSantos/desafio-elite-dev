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
      setError('Informe seu nome completo e e-mail.');
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
        setError(reservation.message || 'Um ou mais assentos selecionados ficaram indisponíveis.');
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
        setError(res.error || 'Erro ao processar pagamento simulado.');
      }
    } catch (err: any) {
      setError(err.message || 'Falha na conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Mobile Drawer / Desktop Centered Container */}
      <div className="w-full sm:max-w-md bg-[#111113] rounded-t-3xl sm:rounded-2xl border border-zinc-800 shadow-2xl relative max-h-[82dvh] sm:max-h-[85dvh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        
        {/* Mobile Pull Handle Indicator */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-700/60" />
        </div>

        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-zinc-800/60 flex items-center justify-between relative">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Finalizar compra</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Emissão de ingressos com assinatura digital.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800/80 transition-colors touch-manipulation"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
            
            {/* Order summary */}
            <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 space-y-3 shadow-inner">
              <div className="flex justify-between items-start">
                <div className="pr-2">
                  <p className="text-sm font-semibold text-white leading-snug">{event.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{event.venue}</p>
                </div>
                <span className="text-[11px] font-mono text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded-md font-semibold shrink-0">
                  {targetSeats.length} {targetSeats.length === 1 ? 'ingresso' : 'ingressos'}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {targetSeats.map((s) => (
                  <span key={s.id} className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/50">
                    {s.row_name}{s.seat_number} ({s.category || 'VIP'})
                  </span>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs border-t border-zinc-800 pt-2.5">
                <span className="text-zinc-400 font-medium">Total a pagar:</span>
                <span className="text-emerald-400 font-mono font-black text-lg">
                  R$ {totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800/60 text-red-300 text-xs rounded-xl animate-in fade-in flex items-center gap-2">
                <span className="text-red-400 font-bold">✕</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs text-zinc-300 mb-1.5 font-semibold">Nome completo</label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ex: Rafael Santos"
                autoComplete="name"
                autoCapitalize="words"
                className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-4 py-3 text-base sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1.5 font-semibold">E-mail para recebimento</label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Ex: rafael@exemplo.com"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-4 py-3 text-base sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1.5 font-semibold">Resultado da simulação</label>
              <select
                value={paymentOutcome}
                onChange={(e) => setPaymentOutcome(e.target.value as 'approved' | 'declined')}
                className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-4 py-3 text-base sm:text-sm text-white outline-none focus:border-emerald-500 transition-all cursor-pointer font-medium"
              >
                <option value="approved">Aprovar pagamento (Emitir Ingressos)</option>
                <option value="declined">Recusar pagamento (Liberar Assentos)</option>
              </select>
              <p className="text-[11px] text-zinc-500 mt-1.5">A recusa libera os assentos de volta ao estoque em tempo real.</p>
            </div>
          </div>

          {/* Action Footer (Always Pinned, Elevated, Safe from Bottom Nav) */}
          <div className="sticky bottom-0 shrink-0 p-4 sm:p-5 pt-3 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] bg-[#111113]/98 backdrop-blur-md border-t border-zinc-800 flex gap-3 shadow-[0_-10px_25px_rgba(0,0,0,0.8)] z-20">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] rounded-xl border border-zinc-700/80 text-zinc-300 hover:text-white hover:bg-zinc-800 text-sm font-semibold transition-all touch-manipulation active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] min-h-[48px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition-all disabled:opacity-40 flex items-center justify-center shadow-lg shadow-emerald-950/40 touch-manipulation active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
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
