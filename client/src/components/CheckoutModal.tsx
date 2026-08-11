import React, { useState } from 'react';
import { SeatItem, EventItem } from '../lib/api';
import { X, CreditCard, Lock, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

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
      setError('Por favor, informe seu nome e e-mail.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Import api lazily or directly
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
        setError(res.error || 'Erro ao processar o pagamento do ingresso.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-2xl border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-white">Finalizar Compra</h2>
            <p className="text-xs text-slate-400">Reserva temporária garantida por trava otimista</p>
          </div>
        </div>

        {/* Event & Seat Ticket Summary */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 mb-6 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">{event.title}</h3>
              <p className="text-xs text-slate-400">{event.venue}</p>
            </div>
            <span className="text-xs font-bold bg-indigo-950 text-indigo-400 border border-indigo-800 px-2.5 py-1 rounded-full">
              {seat.category}
            </span>
          </div>

          <div className="border-t border-slate-800 pt-3 mt-1 flex justify-between items-center text-xs">
            <span className="text-slate-400">
              Assento: <strong className="text-white font-mono">Fileira {seat.row_name} - N° {seat.seat_number}</strong>
            </span>
            <span className="text-base font-extrabold text-indigo-400">
              R$ {seat.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-lg flex items-center gap-2">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nome Completo
            </label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Ex: Rafael Lauri"
              className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              E-mail para Recebimento do Ingresso
            </label>
            <input
              type="email"
              required
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="rafael@exemplo.com"
              className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
            />
          </div>

          <div className="pt-2 text-slate-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Assinatura Digital HMAC-SHA256</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sem Taxas Extras</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Confirmar & Emitir QR</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
