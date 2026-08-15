import React from 'react';
import { TicketItem } from '../lib/api';
import { Mail, Calendar, MapPin, CheckCircle2, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BottomSheet } from './BottomSheet';

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
    venue: 'Arena Innovation Hub - São Paulo',
    date: new Date().toISOString(),
    banner_url: '',
  };

  const seat = ticket.seats || { row_name: 'A', seat_number: 1, category: 'VIP' };
  const finalQrString = qrData || JSON.stringify({
    ticketId: ticket.id,
    eventId: ticket.event_id,
    seatId: ticket.seat_id,
    userEmail: ticket.user_email,
    signature: ticket.qr_signature,
  });

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
      maxWidthClass="sm:max-w-lg"
      maxHeightClass="max-h-[85dvh] sm:max-h-[88dvh]"
      footer={footerActions}
    >
      {/* Email Metadata */}
      <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80 space-y-1.5 text-xs">
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
            Seu ingresso para {event.title} foi emitido!
          </span>
        </div>
      </div>

      {/* Email Body Content */}
      <div className="space-y-4 text-sm text-zinc-300">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Pagamento Confirmado • Bilhete Assinado via Web Crypto API</span>
        </div>

        <p className="text-xs">
          Olá, <strong className="text-white font-semibold">{ticket.user_name || 'Cliente'}</strong>!
        </p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Sua reserva para <strong className="text-zinc-200">{event.title}</strong> foi confirmada. Apresente o QR Code abaixo diretamente na portaria do evento.
        </p>

        {/* Embedded Ticket Card */}
        <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 space-y-3 shadow-inner">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <span className="text-[11px] font-bold font-mono text-emerald-400 uppercase tracking-wider">
              ELITE TICKETS • COMPROVANTE DIGITAL
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">2026</span>
          </div>

          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-white text-sm leading-snug">{event.title}</h4>
              <p className="text-xs text-zinc-400 mt-0.5">{event.venue}</p>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                {new Date(event.date || Date.now()).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold">Assento</span>
              <p className="text-sm font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/60">
                {seat.row_name}{seat.seat_number} ({seat.category || 'VIP'})
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl pt-4 shadow-md">
            <QRCodeSVG value={finalQrString} size={150} level="H" />
            <span className="text-[10px] font-mono text-zinc-800 font-bold mt-2">ID: {ticket.id}</span>
            <span className="text-[9px] text-emerald-800 font-mono font-bold tracking-wider">
              ✓ ASSINATURA HMAC-SHA256
            </span>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
