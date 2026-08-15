import React, { useState, useEffect } from 'react';
import { SeatItem, EventItem } from '../lib/api';
import { BottomSheet } from './BottomSheet';
import { Timer, ShieldCheck, Lock } from 'lucide-react';

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
  const [secondsRemaining, setSecondsRemaining] = useState(600); // 10 minutes reservation timer

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(600);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  const targetSeats = seats && seats.length > 0 ? seats : seat ? [seat] : [];
  const totalPrice = targetSeats.reduce((sum, s) => sum + s.price, 0);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const footerActions = (
    <div className="w-full flex flex-col gap-2">
      <button
        type="button"
        onClick={() => handleSubmit()}
        disabled={loading}
        className="w-full min-h-[52px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm sm:text-base transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50 touch-manipulation active:scale-[0.99]"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
        ) : (
          <>
            <ShieldCheck className="w-5 h-5 text-zinc-950" />
            <span>Confirmar e Emitir ({targetSeats.length}) • R$ {totalPrice.toFixed(2)}</span>
          </>
        )}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="w-full py-2 text-center text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        Cancelar e liberar assentos
      </button>
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Finalizar compra"
      subtitle="Emissão de ingressos com assinatura HMAC-SHA256."
      maxWidthClass="sm:max-w-md"
      maxHeightClass="max-h-[82dvh] sm:max-h-[85dvh]"
      footer={footerActions}
    >
      {/* Reservation Countdown Timer Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-semibold">Assentos reservados por:</span>
        </div>
        <span className="font-mono font-bold text-sm text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
          {formatTimer(secondsRemaining)}
        </span>
      </div>

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
        <label className="block text-xs text-zinc-300 mb-1.5 font-semibold">Nome completo do titular</label>
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
        <label className="block text-xs text-zinc-300 mb-1.5 font-semibold">E-mail para recebimento do QR Code</label>
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
        <label className="block text-xs text-zinc-300 mb-1.5 font-semibold">Simulação de Pagamento</label>
        <select
          value={paymentOutcome}
          onChange={(e) => setPaymentOutcome(e.target.value as 'approved' | 'declined')}
          className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-4 py-3 text-base sm:text-sm text-white outline-none focus:border-emerald-500 transition-all cursor-pointer font-medium"
        >
          <option value="approved">✓ Aprovar Pagamento (Emitir Ingressos Criptografados)</option>
          <option value="declined">✕ Recusar Pagamento (Liberar Assentos de Volta)</option>
        </select>
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-400">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Protegido por concorrência pessimista (PostgreSQL FOR UPDATE)</span>
        </div>
      </div>
    </BottomSheet>
  );
};
