import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { TicketItem } from '../lib/api';
import { ShieldCheck, Calendar, MapPin, Ticket as TicketIcon, Lock } from 'lucide-react';

interface PrintableTicketProps {
  ticket: TicketItem;
  qrData?: string;
}

export const PrintableTicket: React.FC<PrintableTicketProps> = ({ ticket, qrData }) => {
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

  return (
    <div className="printable-ticket-area bg-white text-zinc-900 border-2 border-zinc-900 rounded-2xl p-6 shadow-none max-w-2xl mx-auto space-y-6">
      {/* Official Header */}
      <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-4">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-emerald-700 uppercase">
            ELITE TICKETS • BILHETE ELETRÔNICO OFICIAL
          </span>
          <h1 className="text-xl font-black tracking-tight text-zinc-900 mt-0.5">
            PASSE DE ENTRADA & COMPROVANTE
          </h1>
        </div>
        <div className="text-right font-mono text-xs text-zinc-600">
          <p className="font-bold text-zinc-900">COD: {ticket.id.slice(0, 13)}</p>
          <p className="text-[10px] text-zinc-500">Emitido em {new Date(ticket.created_at || Date.now()).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      {/* Main Content Grid: Info (Left) + QR Control Stub (Right) */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Column: Event & Seat Info */}
        <div className="col-span-7 space-y-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">Evento</span>
            <h2 className="text-lg font-bold text-zinc-900 leading-snug">{event.title}</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs border-y border-zinc-200 py-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">Data & Horário</span>
              <p className="font-bold text-zinc-900 mt-0.5">
                {new Date(event.date || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-zinc-600 font-mono">
                {new Date(event.date || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">Local</span>
              <p className="font-bold text-zinc-900 mt-0.5 truncate">{event.venue}</p>
              <p className="text-zinc-500 text-[10px]">Portão Principal / Entradas B & C</p>
            </div>
          </div>

          {/* Seat Highlight Box */}
          <div className="bg-zinc-100 p-3.5 rounded-xl border border-zinc-300 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-bold">Titular do Ingresso</span>
              <p className="font-bold text-zinc-900 text-xs truncate max-w-[180px]">{ticket.user_name || ticket.user_email}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-bold">Assento Reservado</span>
              <span className="text-base font-mono font-black text-emerald-800 bg-white px-3 py-1 rounded border border-zinc-300 inline-block mt-0.5 shadow-sm">
                FILEIRA {seat.row_name} • N° {seat.seat_number}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Scannable Stub */}
        <div className="col-span-5 border-l-2 border-dashed border-zinc-300 pl-6 flex flex-col items-center justify-center space-y-3">
          <div className="bg-white p-3 border-2 border-zinc-900 rounded-xl shadow-sm">
            <QRCodeSVG value={finalQrString} size={150} level="H" includeMargin={false} />
          </div>

          <div className="text-center space-y-1">
            <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider block">
              ✓ ASSINATURA CRAM-HMAC
            </span>
            <p className="text-[9px] text-zinc-500 font-mono break-all leading-tight max-w-[170px]">
              {ticket.qr_signature ? ticket.qr_signature.slice(0, 30) + '...' : 'SECURED_HMAC_SHA256'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Security Terms & Barcode Pattern */}
      <div className="border-t border-zinc-200 pt-4 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
        <div>
          <p className="font-semibold text-zinc-700">INSTRUÇÕES DE ACESSO:</p>
          <p>Apresente este bilhete impresso ou na tela do dispositivo na portaria. Proibida a duplicidade.</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-zinc-900">VERZEL ELITE TICKETS 2026</p>
          <p>DOCUMENTO AUTÊNTICO DIGITAL</p>
        </div>
      </div>
    </div>
  );
};
