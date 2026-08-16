import React, { useState, useEffect } from 'react';
import { SeatItem, EventItem, TicketItem } from '../lib/api';
import { BottomSheet } from './BottomSheet';
import { QRCodeSVG } from 'qrcode.react';
import {
  Timer,
  ShieldCheck,
  Lock,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertOctagon,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  RefreshCw,
  HelpCircle,
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
type ProcessingStep = 'idle' | 'encrypting' | 'authorizing' | 'issuing' | 'declined';

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

  // Credit card form state
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState('ANA C SANTOS');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [installments, setInstallments] = useState('1');

  // Simulation outcome target: 'approved' | 'declined'
  const [scenario, setScenario] = useState<'approved' | 'declined'>('approved');

  // Processing & Error states
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(600); // 10 min countdown

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(600);
      setProcessingStep('idle');
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

  // Card number input formatter
  const handleCardNumberChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);

    // If user types the known declined test number, automatically switch scenario
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

  // Fast-fill test helpers (Stripe Sandbox style)
  const applyTestCardApproved = () => {
    setPaymentMethod('credit_card');
    setCardNumber('4242 4242 4242 4242');
    setCardHolder('ANA C SANTOS');
    setCardExpiry('12/28');
    setCardCvv('888');
    setScenario('approved');
    setErrorMessage(null);
    setProcessingStep('idle');
  };

  const applyTestCardDeclined = () => {
    setPaymentMethod('credit_card');
    setCardNumber('4000 0000 0000 0051');
    setCardHolder('ANA C SANTOS (SEM LIMITE)');
    setCardExpiry('08/25');
    setCardCvv('511');
    setScenario('declined');
    setErrorMessage(null);
    setProcessingStep('idle');
  };

  const fakePixPayload = `00020126580014br.gov.bcb.pix0136elite-tickets-${event.id}-${Date.now()}520400005303986540${totalPrice.toFixed(2)}5802BR5913ELITE TICKETS6009SAO PAULO62070503***6304`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(fakePixPayload);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleProcessPayment = async () => {
    if (!userName.trim() || !userEmail.trim()) {
      setErrorMessage('Informe seu nome completo e e-mail para emissão.');
      return;
    }

    if (targetSeats.length === 0) {
      setErrorMessage('Nenhum assento selecionado.');
      return;
    }

    setErrorMessage(null);
    setProcessingStep('encrypting');

    try {
      // Step 1: Encrypting
      await new Promise((r) => setTimeout(r, 600));
      setProcessingStep('authorizing');

      // Step 2: Reserving & Calling API
      const { api } = await import('../lib/api');
      const reservation = await api.reserveSeatsBatch(
        targetSeats.map((s) => s.id),
        userEmail
      );

      if (!reservation.success) {
        setProcessingStep('idle');
        setErrorMessage(reservation.message || 'Um ou mais assentos selecionados ficaram indisponíveis.');
        return;
      }

      await new Promise((r) => setTimeout(r, 700));

      const res = await api.checkout({
        seatIds: targetSeats.map((s) => s.id),
        eventId: event.id,
        userEmail,
        userName,
        paymentOutcome: scenario,
      });

      if (scenario === 'declined' || !res.success) {
        setProcessingStep('declined');
        setErrorMessage(
          res.error ||
            'Transação não autorizada pela emissora (Código 51: Saldo Insuficiente). A reserva de 10 min foi cancelada e seus assentos foram liberados.'
        );
        return;
      }

      setProcessingStep('issuing');
      await new Promise((r) => setTimeout(r, 500));

      if (res.success && res.tickets?.length && res.qrCodes?.length) {
        onSuccess(res.tickets, res.qrCodes);
      } else {
        setProcessingStep('idle');
        setErrorMessage(res.error || 'Erro ao emitir ingresso com assinatura HMAC.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha na conexão com o gateway.';
      setProcessingStep('idle');
      setErrorMessage(message);
    }
  };

  const isLoading =
    processingStep === 'encrypting' ||
    processingStep === 'authorizing' ||
    processingStep === 'issuing';

  const footerActions = (
    <div className="w-full flex flex-col gap-2">
      {processingStep === 'declined' ? (
        <button
          type="button"
          onClick={() => {
            setProcessingStep('idle');
            setScenario('approved');
            setErrorMessage(null);
          }}
          className="w-full min-h-[52px] rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all border border-zinc-700"
        >
          <RefreshCw className="w-4 h-4 text-emerald-400" />
          <span>Tentar com Outro Cartão / PIX</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleProcessPayment}
          disabled={isLoading}
          className="w-full min-h-[54px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-black text-sm sm:text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-2xl shadow-emerald-950/60 touch-manipulation active:scale-[0.99]"
        >
          {isLoading ? (
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
              <span className="font-bold text-sm">
                {processingStep === 'encrypting'
                  ? 'Criptografando payload...'
                  : processingStep === 'authorizing'
                  ? 'Consultando adquirente...'
                  : 'Emitindo bilhete HMAC...'}
              </span>
            </div>
          ) : (
            <>
              <Lock className="w-4 h-4 text-zinc-950" />
              <span>
                Pagar R$ {totalPrice.toFixed(2)}{' '}
                {installments !== '1' && `(em ${installments}x)`}
              </span>
            </>
          )}
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
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
      title="Checkout Seguro"
      subtitle="Processamento com criptografia de ponta a ponta."
      maxWidthClass="sm:max-w-lg"
      maxHeightClass="max-h-[90dvh]"
      footer={footerActions}
    >
      {/* Timer & Security Badge */}
      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-semibold text-zinc-300">Tempo de reserva:</span>
          <span className="font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
            {formatTimer(secondsRemaining)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>SSL 256-bit</span>
        </div>
      </div>

      {/* Stripe Sandbox Test Bar */}
      <div className="p-3 bg-[#111113] rounded-2xl border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-zinc-400 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            SIMULADOR SANDBOX (TESTES DA BANCA):
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              scenario === 'approved'
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                : 'bg-red-950/80 text-red-400 border border-red-800/60'
            }`}
          >
            {scenario === 'approved' ? '✓ Modo: Aprovação' : '✕ Modo: Recusa (Cód 51)'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={applyTestCardApproved}
            className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all touch-manipulation ${
              scenario === 'approved'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cartão Válido</span>
          </button>

          <button
            type="button"
            onClick={applyTestCardDeclined}
            className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all touch-manipulation ${
              scenario === 'declined'
                ? 'bg-red-500/10 text-red-300 border border-red-500/40 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            <span>Cartão Sem Saldo</span>
          </button>
        </div>
      </div>

      {/* Declined State Banner */}
      {processingStep === 'declined' && (
        <div className="p-4 bg-red-950/70 border border-red-800/80 rounded-2xl space-y-2 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
            <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
            <span>Pagamento Recusado pela Operadora</span>
          </div>
          <p className="text-xs text-red-200/90 leading-relaxed">
            {errorMessage ||
              'A transação foi negada pela instituição financeira (Código 51: Saldo insuficiente ou bloqueio preventivo).'}
          </p>
          <div className="pt-1 text-[11px] font-mono text-red-400 border-t border-red-900/60">
            ✓ Os assentos foram liberados de volta ao mapa em conformidade com o edital.
          </div>
        </div>
      )}

      {/* Order Brief Summary */}
      <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800 flex items-center justify-between gap-3 text-xs">
        <div className="min-w-0">
          <p className="font-semibold text-white truncate">{event.title}</p>
          <p className="text-zinc-400 text-[11px] truncate">
            {targetSeats.length} {targetSeats.length === 1 ? 'assento' : 'assentos'} (
            {targetSeats.map((s) => `${s.row_name}${s.seat_number}`).join(', ')})
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] text-zinc-400 font-mono block">Total:</span>
          <span className="text-emerald-400 font-mono font-black text-base">
            R$ {totalPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Payment Method Selector Tabs */}
      <div className="flex gap-2 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800">
        <button
          type="button"
          onClick={() => {
            setPaymentMethod('credit_card');
            setScenario('approved');
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            paymentMethod === 'credit_card'
              ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span>Cartão de Crédito</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setPaymentMethod('pix');
            setScenario('approved');
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            paymentMethod === 'pix'
              ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <QrCode className="w-4 h-4 text-teal-400" />
          <span>PIX Instantâneo</span>
        </button>
      </div>

      {/* Credit Card Form (Stripe Elements Aesthetic) */}
      {paymentMethod === 'credit_card' && processingStep !== 'declined' && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* Virtual Visual Card */}
          <div className="w-full bg-gradient-to-br from-zinc-900 via-[#18181b] to-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-700/80 shadow-2xl relative overflow-hidden space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
                Elite Tickets Virtual
              </span>
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-red-500/80" />
                <div className="w-5 h-5 rounded-full bg-amber-500/80 -ml-2.5" />
              </div>
            </div>

            <div className="font-mono text-base sm:text-lg font-bold tracking-widest text-white">
              {cardNumber || '•••• •••• •••• ••••'}
            </div>

            <div className="flex justify-between items-end text-xs font-mono">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">Titular</span>
                <span className="font-bold text-zinc-200 truncate max-w-[160px] block">
                  {cardHolder || 'NOME DO TITULAR'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">Validade</span>
                <span className="font-bold text-zinc-200">{cardExpiry || 'MM/AA'}</span>
              </div>
            </div>
          </div>

          {/* Form Inputs */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Número do Cartão
            </label>
            <div className="relative">
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                placeholder="4242 4242 4242 4242"
                className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 font-mono tracking-wider"
              />
              <CreditCard className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Validade (MM/AA)
              </label>
              <input
                type="text"
                value={cardExpiry}
                onChange={(e) => handleExpiryChange(e.target.value)}
                placeholder="12/28"
                className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 font-mono text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                CVV / CVC
              </label>
              <input
                type="password"
                maxLength={4}
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                placeholder="888"
                className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 font-mono text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Nome Impresso no Cartão
            </label>
            <input
              type="text"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
              placeholder="ANA C SANTOS"
              className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Opções de Parcelamento
            </label>
            <select
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
              className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-4 py-3 text-xs sm:text-sm text-white outline-none focus:border-emerald-500 cursor-pointer font-medium"
            >
              <option value="1">1x de R$ {totalPrice.toFixed(2)} (à vista sem juros)</option>
              <option value="2">2x de R$ {(totalPrice / 2).toFixed(2)} sem juros</option>
              <option value="3">3x de R$ {(totalPrice / 3).toFixed(2)} sem juros</option>
              <option value="6">6x de R$ {(totalPrice / 6).toFixed(2)} sem juros</option>
            </select>
          </div>
        </div>
      )}

      {/* PIX Instantâneo */}
      {paymentMethod === 'pix' && processingStep !== 'declined' && (
        <div className="space-y-4 text-center py-2 animate-in fade-in duration-200">
          <div className="p-4 bg-white rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-xl border border-zinc-300 relative">
            <QRCodeSVG value={fakePixPayload} size={160} level="M" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-white">Escaneie o QR Code no app do seu banco</p>
            <p className="text-xs text-zinc-400">Aprovação instantânea em até 5 segundos.</p>
          </div>

          <button
            type="button"
            onClick={handleCopyPix}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-zinc-700"
          >
            {copiedPix ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Código PIX Copiado com Sucesso!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-400" />
                <span>Copiar Código PIX (Copia e Cola)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Customer Identifiers for HMAC generation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
            Nome do Titular do Ingresso
          </label>
          <input
            type="text"
            required
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Ex: Rafael Santos"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
            E-mail para Envio do Bilhete
          </label>
          <input
            type="email"
            required
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="Ex: rafael@exemplo.com"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
          />
        </div>
      </div>
    </BottomSheet>
  );
};
