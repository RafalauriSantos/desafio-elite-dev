import React, { useState } from 'react';
import { SeatItem, EventItem } from '../lib/api';
import { X } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  event: EventItem;
  seat: SeatItem;
  onClose: () => void;
  onSuccess: (ticket: any, qrData: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  event,
  seat,
  onClose,
  onSuccess,
}) => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      setError('Informe seu nome e e-mail.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { api } = await import('../lib/api');
      const res = await api.checkout({
        seatId: seat.id,
        eventId: event.id,
        userEmail,
        userName,
      });

      if (res.success && res.ticket && res.qrCodeData) {
        onSuccess(res.ticket, res.qrCodeData);
      } else {
        setError(res.error || 'Erro ao processar.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#111113] p-6 rounded-2xl border border-zinc-800/60 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-lg font-semibold text-white mb-1">Finalizar compra</h2>
        <p className="text-xs text-zinc-500 mb-5">Seus dados para emissão do ingresso digital.</p>

        {/* Order summary */}
        <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800/40 mb-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-white">{event.title}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{event.venue}</p>
            </div>
            <span className="text-[11px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded font-medium">
              {seat.category}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs border-t border-zinc-800/40 pt-2 mt-1">
            <span className="text-zinc-500">
              Assento <span className="text-zinc-300 font-mono">{seat.row_name}{seat.seat_number}</span>
            </span>
            <span className="text-emerald-400 font-mono font-semibold text-sm">
              R$ {seat.price.toFixed(2)}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-950/30 border border-red-900/40 text-red-400 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Nome completo</label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Rafael Santos"
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">E-mail</label>
            <input
              type="email"
              required
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="rafael@exemplo.com"
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-600 transition-colors"
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
                'Confirmar compra'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
