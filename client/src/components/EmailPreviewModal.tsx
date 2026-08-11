import React from 'react';
import { TicketItem } from '../lib/api';
import { X, Mail, Calendar, MapPin, CheckCircle2, Download, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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
    title: 'Evento Selecionado',
    venue: 'Local do Evento',
    date: new Date().toISOString(),
    banner_url: ''
  };

  const seat = ticket.seats || { row_name: 'A', seat_number: 1 };
  const finalQrString = qrData || JSON.stringify({
    ticketId: ticket.id,
    eventId: ticket.event_id,
    seatId: ticket.seat_id,
    userEmail: ticket.user_email,
    signature: ticket.qr_signature
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#111113] rounded-2xl border border-zinc-800/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Email Client Header Bar */}
        <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Mail className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-zinc-300">Simulador de E-mail de Confirmação</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Email Metadata */}
        <div className="bg-zinc-900/40 p-4 border-b border-zinc-800/60 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">De:</span>
            <span className="text-zinc-300 font-medium">confirmacao@elitetickets.com.br</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Para:</span>
            <span className="text-emerald-400 font-mono font-medium">{ticket.user_email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Assunto:</span>
            <span className="text-white font-semibold">Seu ingresso para {event.title} foi emitido!</span>
          </div>
        </div>

        {/* Email Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-zinc-300">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Pagamento Confirmado & Bilhete Assinado Criptograficamente</span>
          </div>

          <p>Olá, <strong className="text-white">{ticket.user_name || 'Cliente'}</strong>!</p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Sua reserva para <strong>{event.title}</strong> foi confirmada. Apresente o QR Code abaixo diretamente no seu celular ou impresso na portaria do evento.
          </p>

          {/* Embedded Ticket Preview */}
          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-white text-sm">{event.title}</h4>
                <p className="text-xs text-zinc-500 mt-0.5">{event.venue}</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                {seat.row_name}{seat.seat_number}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg pt-4">
              <QRCodeSVG value={finalQrString} size={140} level="H" />
              <span className="text-[10px] font-mono text-zinc-500 mt-2">ID: {ticket.id}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Baixar / Imprimir PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
            >
              Fechar Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
