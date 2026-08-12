import React, { useState } from 'react';
import { SeatItem, EventItem } from '../lib/api';
import { X } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  event: EventItem;
  seat?: SeatItem;
  seats?: SeatItem[];
  onClose: () => void;
  onSuccess: (ticket: any, qrData: string) => void;
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
      
      // Issue ticket for the primary/first seat in batch or single
      const primarySeat = targetSeats[0];
      const res = await api.checkout({
        seatId: primarySeat.id,
        eventId: event.id,
        userEmail,
        userName,
      });

      if (res.success && res.ticket && res.qrCodeData) {
        onSuccess(res.ticket, res.qrCodeData);
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
      <div className="w-full sm:max-w-md bg-[#111113] p-6 rounded-t-2xl sm:rounded-2xl border border-zinc-800/80 shadow-2xl relative max-h-[90vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-lg font-semibold text-white mb-1">Finalizar compra</h2>
        <p className="text-xs text-zinc-500 mb-5">Seus dados para emissão dos ingressos digitais.</p>

        {/* Order summary */}
        <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/40 mb-5 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-white">{event.title}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{event.venue}</p>
            </div>
            <span className="text-[11px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded font-medium">
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
          <div className="mb-4 p-3 bg-red-950/40 border border-red-900/50 text-red-400 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Nome completo</label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Rafael Santos"
              autoComplete="name"
              autoCapitalize="words"
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">E-mail para recebimento</label>
            <input
              type="email"
              required
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="rafael@exemplo.com"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/60 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-colors disabled:opacity-40 flex items-center justify-center"
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
