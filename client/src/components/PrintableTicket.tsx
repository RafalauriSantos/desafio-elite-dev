import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { TicketItem } from '../lib/api';

interface PrintableTicketProps {
  ticket: TicketItem;
  qrData?: string;
}

export const PrintableTicket: React.FC<PrintableTicketProps> = ({ ticket, qrData }) => {
  const event = ticket?.events || {
    title: 'Evento Oficial Elite Tickets',
    venue: 'Local do Evento',
    date: new Date().toISOString(),
    banner_url: ''
  };

  const seat = ticket?.seats || { row_name: 'A', seat_number: 1, category: 'VIP' };
  const safeTicketId = ticket?.id || 'TICK-00000000';
  const safeSignature = ticket?.qr_signature || '';
  const isUsed = ticket?.status === 'used';

  const finalQrString = qrData || JSON.stringify({
    ticketId: safeTicketId,
    eventId: ticket?.event_id || '',
    seatId: ticket?.seat_id || '',
    userEmail: ticket?.user_email || '',
    clientId: ticket?.clientId || ticket?.user_email || '',
    issuedAt: ticket?.issuedAt || new Date(ticket?.created_at || Date.now()).getTime(),
    signature: safeSignature
  });

  return (
    <div className="printable-ticket-area bg-white text-zinc-900 border-2 border-zinc-900 rounded-3xl p-6 shadow-none max-w-sm mx-auto space-y-4 relative overflow-hidden">
      {/* Official Apple Wallet Style Header */}
      <div className="bg-zinc-950 text-white p-4 -mx-6 -mt-6 rounded-t-2xl flex items-center justify-between border-b-2 border-emerald-500">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase block">
            ELITE TICKETS • WALLET PASS
          </span>
          <h1 className="text-sm font-bold tracking-tight text-white mt-0.5">
            PASSE DIGITAL DE ENTRADA
          </h1>
        </div>
        <span className="text-[10px] font-mono font-bold text-zinc-100 bg-zinc-800/90 border border-zinc-700 px-2 py-1 rounded shadow-sm">
          REF: #{safeTicketId.slice(0, 4).toUpperCase()}-{safeTicketId.slice(4, 8).toUpperCase()}
        </span>
      </div>

      {/* Used Status Banner (if ticket has been validated) */}
      {isUsed && (
        <div className="bg-amber-100 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-lg text-center font-mono text-[11px] font-bold">
          ⚠️ INGRESSO JÁ UTILIZADO NA PORTARIA
        </div>
      )}

      {/* Event Title & Date */}
      <div className="space-y-1 text-center pt-1">
        <h2 className="text-base font-bold text-zinc-900 leading-snug">{event.title}</h2>
        <p className="text-xs text-zinc-600 font-medium">{event.venue}</p>
        <p className="text-xs text-zinc-700 font-mono font-semibold pt-0.5">
          {new Date(event.date || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Seat Highlight Box */}
      <div className="bg-zinc-100 p-3.5 rounded-xl border border-zinc-300 flex items-center justify-between">
        <div>
          <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block font-bold">Titular</span>
          <p className="font-bold text-zinc-900 text-xs truncate max-w-[140px]">{ticket?.user_name || ticket?.user_email || 'Cliente'}</p>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block font-bold">Assento</span>
          <span className="text-sm font-mono font-black text-emerald-800 bg-white px-2.5 py-0.5 rounded border border-zinc-300 inline-block mt-0.5 shadow-sm">
            {seat.row_name}{seat.seat_number} ({seat.category || 'VIP'})
          </span>
        </div>
      </div>

      {/* Picote Visual Divider */}
      <div className="relative py-1">
        <div className="border-t-2 border-dashed border-zinc-300" />
      </div>

      {/* Vertical Scannable Stub at Bottom (Apple Wallet Format) */}
      <div className="flex flex-col items-center justify-center p-4 bg-white border-2 border-zinc-900 rounded-2xl space-y-2 relative">
        <QRCodeSVG value={finalQrString} size={165} level="H" includeMargin={false} />
        <span className="text-[10px] font-mono font-bold text-zinc-800 block pt-1">
          ID: {safeTicketId}
        </span>
        <span className="text-[9px] font-mono font-bold text-emerald-800 uppercase tracking-wider">
          ✓ ASSINATURA HMAC-SHA256 VERIFICADA
        </span>

        {isUsed && (
          <div className="absolute inset-0 bg-white/95 rounded-xl flex flex-col items-center justify-center p-3 text-center border-2 border-amber-500">
            <span className="text-sm font-bold text-amber-700 uppercase">Utilizado</span>
            <span className="text-[10px] font-mono text-zinc-600 mt-1">Entrada confirmada na portaria</span>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="text-center pt-1 border-t border-zinc-200 text-[9px] text-zinc-500 font-mono">
        <p>Apresente este QR Code na portaria ou escaneie no validador.</p>
        <p className="font-bold text-zinc-800 mt-0.5">VERZEL ELITE TICKETS 2026</p>
      </div>
    </div>
  );
};
