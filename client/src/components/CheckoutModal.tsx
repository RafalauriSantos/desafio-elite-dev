import React, { useState, useEffect } from 'react';
import { SeatItem, EventItem, TicketItem } from '../lib/api';
import { BottomSheet } from './BottomSheet';
import { QRCodeSVG } from 'qrcode.react';
import {
  Lock,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Clock,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  event: EventItem;
  seat?: SeatItem;
  seats?: SeatItem[];
  onClose: () => void;
  onSuccess: (tickets: TicketItem[], qrData: string[]) => void;
}

type PaymentMethod = 'credit_card' | 'pix';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  event,
  seat,
  seats,
  onClose,
  onSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [userName, setUserName] = useState('Ana Cliente');
  const [userEmail, setUserEmail] = useState('ana.cliente@verzel.com');

  // Credit Card Form
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [cardHolder, setCardHolder] = useState('ANA C SANTOS');
  const [installments, setInstallments] = useState('1');

  // Simulation Outcome
  const [scenario, setScenario] = useState<'approved' | 'declined'>('approved');

  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(600); // 10 min hold

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(600);
      setLoading(false);
      setErrorMessage(null);
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

  const handleCardNumberChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);

    if (cleaned.endsWith('0002') || cleaned.endsWith('0051')) {
      setScenario('declined');
    } else {
      setScenario('approved');
    }
  };

  const handleExpiryChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  const fillTestCard = (type: 'approved' | 'declined') => {
    setPaymentMethod('credit_card');
    setErrorMessage(null);
    if (type === 'approved') {
      setCardNumber('4242 4242 4242 4242');
      setCardExpiry('12/28');
      setCardCvc('123');
      setCardHolder('ANA C SANTOS');
      setScenario('approved');
    } else {
      setCardNumber('4000 0000 0000 0051');
      setCardExpiry('08/25');
      setCardCvc('511');
      setCardHolder('ANA C SANTOS');
      setScenario('declined');
    }
  };

  const fakePixPayload = `00020126580014br.gov.bcb.pix0136elite-tickets-${event.id}-${Date.now()}520400005303986540${totalPrice.toFixed(2)}5802BR5913ELITE TICKETS6009SAO PAULO62070503***6304`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(fakePixPayload);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handlePay = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!userName.trim() || !userEmail.trim()) {
      setErrorMessage('Preencha seu nome e e-mail.');
      return;
    }

    if (targetSeats.length === 0) {
      setErrorMessage('Nenhum assento selecionado.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const { api } = await import('../lib/api');

      // 1. Hold seats
      const reservation = await api.reserveSeatsBatch(
        targetSeats.map((s) => s.id),
        userEmail
      );

      if (!reservation.success) {
        setLoading(false);
        setErrorMessage(reservation.message || 'Assento indisponível no momento.');
        return;
      }

      // Small natural network simulation
      await new Promise((r) => setTimeout(r, 600));

      // 2. Process checkout
      const res = await api.checkout({
        seatIds: targetSeats.map((s) => s.id),
        eventId: event.id,
        userEmail,
        userName,
        paymentOutcome: scenario,
      });

      if (scenario === 'declined' || !res.success) {
        setLoading(false);
        setErrorMessage(
          res.error ||
            'Não foi possível concluir o pagamento. Seu cartão foi recusado pela instituição financeira.'
        );
        return;
      }

      if (res.success && res.tickets?.length && res.qrCodes?.length) {
        onSuccess(res.tickets, res.qrCodes);
      } else {
        setLoading(false);
        setErrorMessage(res.error || 'Erro ao emitir os ingressos.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão.';
      setLoading(false);
      setErrorMessage(msg);
    }
  };

  const footerActions = (
    <div className="w-full space-y-2">
      <button
        type="button"
        onClick={() => handlePay()}
        disabled={loading}
        className="w-full min-h-[50px] rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] touch-manipulation"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
        ) : (
          <span>Pagar R$ {totalPrice.toFixed(2)}</span>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 pt-1">
        <Lock className="w-3 h-3" />
        <span>Pagamento processado com segurança</span>
      </div>
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Pagamento"
      subtitle="Finalize sua compra para receber seus ingressos."
      maxWidthClass="sm:max-w-md"
      maxHeightClass="max-h-[90dvh]"
      footer={footerActions}
    >
      {/* Test mode discreet banner (Stripe style) */}
      <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Modo de teste:</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fillTestCard('approved')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
              scenario === 'approved'
                ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Aprovar
          </button>
          <span className="text-zinc-700">·</span>
          <button
            type="button"
            onClick={() => fillTestCard('declined')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
              scenario === 'declined'
                ? 'bg-zinc-800 text-red-400 border border-zinc-700'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Recusar
          </button>
        </div>
      </div>

      {/* Order Summary Line */}
      <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800/80 flex items-center justify-between gap-3 text-xs">
        <div className="min-w-0">
          <p className="font-semibold text-white truncate">{event.title}</p>
          <p className="text-zinc-400 text-[11px] truncate">
            {targetSeats.length} {targetSeats.length === 1 ? 'assento' : 'assentos'} ({targetSeats.map((s) => `${s.row_name}${s.seat_number}`).join(', ')})
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="font-mono font-bold text-sm text-white">
            R$ {totalPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-red-950/60 border border-red-900/60 text-red-300 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{errorMessage}</p>
            <p className="text-[11px] text-red-400/90">Os assentos selecionados foram liberados de volta ao mapa.</p>
          </div>
        </div>
      )}

      {/* Contact Info (Stripe style) */}
      <div className="space-y-2.5">
        <label className="block text-xs font-semibold text-zinc-300">
          Dados do comprador
        </label>
        <div className="space-y-2">
          <input
            type="text"
            required
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Nome completo"
            autoComplete="name"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-700 transition-colors"
          />
          <input
            type="email"
            required
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="E-mail"
            autoComplete="email"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-700 transition-colors"
          />
        </div>
      </div>

      {/* Payment Method Selector (Stripe Tabs) */}
      <div className="space-y-2.5">
        <label className="block text-xs font-semibold text-zinc-300">
          Forma de pagamento
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPaymentMethod('credit_card')}
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              paymentMethod === 'credit_card'
                ? 'bg-zinc-800 border-zinc-600 text-white shadow-sm'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Cartão de crédito</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('pix')}
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              paymentMethod === 'pix'
                ? 'bg-zinc-800 border-zinc-600 text-white shadow-sm'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Pix</span>
          </button>
        </div>
      </div>

      {/* Stripe Credit Card Elements (Unified Card Input Group) */}
      {paymentMethod === 'credit_card' && (
        <div className="space-y-2.5 animate-in fade-in duration-150">
          <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900 focus-within:border-zinc-700 transition-colors">
            {/* Card Number */}
            <div className="px-3.5 py-2.5 border-b border-zinc-800/80 flex items-center justify-between">
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                placeholder="Número do cartão"
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 outline-none font-mono tracking-wider"
              />
              <div className="flex items-center gap-1 shrink-0">
                <div className="w-4 h-4 rounded-full bg-red-500/80" />
                <div className="w-4 h-4 rounded-full bg-amber-500/80 -ml-2" />
              </div>
            </div>

            {/* Expiry & CVC Grid */}
            <div className="grid grid-cols-2 divide-x divide-zinc-800/80">
              <div className="px-3.5 py-2.5">
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => handleExpiryChange(e.target.value)}
                  placeholder="MM / AA"
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 outline-none font-mono"
                />
              </div>
              <div className="px-3.5 py-2.5">
                <input
                  type="password"
                  maxLength={4}
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                  placeholder="CVC"
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <input
              type="text"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
              placeholder="Nome no cartão"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-700 transition-colors uppercase"
            />
          </div>

          <div>
            <select
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-zinc-700 cursor-pointer"
            >
              <option value="1">1x de R$ {totalPrice.toFixed(2)} sem juros</option>
              <option value="2">2x de R$ {(totalPrice / 2).toFixed(2)} sem juros</option>
              <option value="3">3x de R$ {(totalPrice / 3).toFixed(2)} sem juros</option>
            </select>
          </div>
        </div>
      )}

      {/* Pix Tab */}
      {paymentMethod === 'pix' && (
        <div className="space-y-3.5 text-center py-2 animate-in fade-in duration-150">
          <div className="p-3 bg-white rounded-xl w-44 h-44 mx-auto flex items-center justify-center shadow-md">
            <QRCodeSVG value={fakePixPayload} size={150} level="M" />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-white">Escaneie o QR Code no aplicativo do seu banco</p>
            <p className="text-[11px] text-zinc-400">A confirmação é imediata.</p>
          </div>

          <button
            type="button"
            onClick={handleCopyPix}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-zinc-700"
          >
            {copiedPix ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Código Pix copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copiar código Pix</span>
              </>
            )}
          </button>
        </div>
      )}
    </BottomSheet>
  );
};
