import React from 'react';
import { TicketItem } from '../lib/api';
import { Download } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { PrintableTicket } from './PrintableTicket';

interface EmailPreviewModalProps {
  isOpen: boolean;
  ticket: TicketItem | null;
  qrData?: string;
  onClose: () => void;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  ticket,
  qrData,
  onClose,
}) => {
  if (!isOpen || !ticket) return null;

  const event = ticket.events || {
    title: 'Tech Summit Elite 2026',
    venue: 'Arena Innovation Hub',
    date: new Date().toISOString(),
    banner_url: '',
  };

  const handlePrint = () => {
    window.print();
  };

  const footerActions = (
    <>
      <button
        type="button"
        onClick={handlePrint}
        className="flex-[2] min-h-[48px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 touch-manipulation active:scale-[0.98]"
      >
        <Download className="w-4 h-4" />
        <span>Imprimir / Salvar PDF</span>
      </button>
      <button
        type="button"
        onClick={onClose}
        className="flex-1 min-h-[48px] px-4 rounded-xl border border-zinc-700/80 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition-all touch-manipulation active:scale-[0.98]"
      >
        Fechar
      </button>
    </>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="E-mail de Confirmação"
      subtitle="Simulador de entrega digital de ingresso."
      maxWidthClass="sm:max-w-md"
      maxHeightClass="max-h-[85dvh] sm:max-h-[88dvh]"
      footer={footerActions}
    >
      {/* Email Metadata */}
      <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-zinc-500 font-medium">De:</span>
          <span className="text-zinc-300 font-medium">confirmacao@elitetickets.com.br</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500 font-medium">Para:</span>
          <span className="text-emerald-400 font-mono font-medium">{ticket.user_email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500 font-medium">Assunto:</span>
          <span className="text-white font-semibold truncate max-w-[200px] sm:max-w-xs">
            Seu ingresso para {event.title}
          </span>
        </div>
      </div>

      {/* Email Body Content with Exact Ticket Pass */}
      <div className="space-y-3">
        <p className="text-xs text-zinc-400 leading-relaxed">
          Olá, <strong className="text-white">{ticket.user_name || 'Cliente'}</strong>! Seu pedido foi confirmado. Apresente o passe digital abaixo na portaria do evento:
        </p>

        {/* Exact Ticket Pass from Spec Photo */}
        <PrintableTicket ticket={ticket} qrData={qrData} />
      </div>
    </BottomSheet>
  );
};
