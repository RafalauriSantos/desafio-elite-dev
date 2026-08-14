import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { TicketItem } from '../lib/api';

interface PrintableTicketProps {
  ticket: TicketItem;
  qrData?: string;
}

export const PrintableTicket: React.FC<PrintableTicketProps> = ({ ticket, qrData }) => {
  const event = ticket?.events || {
    title: 'Tech Summit Elite 2026',
    venue: 'Arena Innovation Hub - São Paulo, SP',
    date: '2026-11-20T19:00:00.000Z',
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

  const formattedDate = new Date(event.date || Date.now()).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const cleanDateCapitalized = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="printable-ticket-area bg-white text-zinc-950 border-2 border-zinc-950 rounded-2xl p-6 shadow-none max-w-sm mx-auto space-y-4 font-sans print:max-w-none print:w-full print:border-2">
      {/* Top Bar / Header */}
      <div className="flex items-center justify-between border-b-2 border-zinc-950 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-zinc-950 text-white font-bold text-xs flex items-center justify-center font-mono">
            E
          </span>
          <span className="text-xs font-black tracking-widest uppercase font-mono text-zinc-950">
            ELITE TICKETS • PASSE DIGITAL
          </span>
        </div>
        <span className="text-[11px] font-mono font-black text-zinc-950 border border-zinc-950 px-2 py-0.5 rounded">
          REF: #{safeTicketId.slice(0, 4).toUpperCase()}-{safeTicketId.slice(4, 8).toUpperCase()}
        </span>
      </div>

      {/* Used Status Stamped Watermark */}
      {isUsed && (
        <div className="border-2 border-amber-600 bg-amber-50 text-amber-900 px-3 py-1.5 rounded-lg text-center font-mono text-xs font-bold uppercase tracking-wider">
          ⚠️ Entrada Registrada na Portaria (Utilizado)
        </div>
      )}

      {/* Event Title */}
      <div className="space-y-0.5 pt-1">
        <span className="text-[10px] font-mono uppercase font-bold text-zinc-600 tracking-wider">Atração Oficial</span>
        <h1 className="text-lg font-black text-zinc-950 leading-tight tracking-tight">{event.title}</h1>
      </div>

      {/* 2x2 Clean Industrial Metadata Grid */}
      <div className="grid grid-cols-2 gap-3 py-2 border-y border-zinc-300 text-xs">
        <div>
          <span className="text-[9px] font-mono uppercase font-bold text-zinc-600 block">Data & Horário</span>
          <p className="font-bold text-zinc-950 text-[11px] leading-snug mt-0.5">{cleanDateCapitalized}</p>
        </div>
        <div>
          <span className="text-[9px] font-mono uppercase font-bold text-zinc-600 block">Local do Espetáculo</span>
          <p className="font-bold text-zinc-950 text-[11px] leading-snug mt-0.5">{event.venue}</p>
        </div>
        <div>
          <span className="text-[9px] font-mono uppercase font-bold text-zinc-600 block">Titular do Ingresso</span>
          <p className="font-bold text-zinc-950 text-[11px] truncate max-w-[140px] mt-0.5">{ticket?.user_name || ticket?.user_email || 'Titular do Ingresso'}</p>
        </div>
        <div>
          <span className="text-[9px] font-mono uppercase font-bold text-zinc-600 block">Assento Numerado</span>
          <p className="font-black font-mono text-zinc-950 text-xs mt-0.5">
            {seat.category || 'VIP'} • Fileira {seat.row_name} • Assento {seat.seat_number}
          </p>
        </div>
      </div>

      {/* High-Resolution QR Stub */}
      <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 border-2 border-dashed border-zinc-400 rounded-xl space-y-2 relative">
        <QRCodeSVG value={finalQrString} size={165} level="H" includeMargin={false} />
        <div className="text-center pt-1">
          <span className="text-[10px] font-mono font-bold text-zinc-800 block">
            ID: {safeTicketId}
          </span>
          <span className="text-[9px] font-mono font-bold text-emerald-800 uppercase tracking-widest">
            ✓ AUTENTICAÇÃO DIGITAL HMAC-SHA256
          </span>
        </div>

        {isUsed && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-[1px] rounded-lg flex flex-col items-center justify-center p-3 text-center border-2 border-amber-600">
            <span className="text-sm font-black text-amber-800 uppercase tracking-wider">Ingresso Já Utilizado</span>
            <span className="text-[10px] font-mono text-zinc-600 mt-1">Uso único registrado no sistema</span>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="text-center pt-1 border-t border-zinc-300 text-[9px] text-zinc-600 font-mono space-y-0.5">
        <p>Apresente este código impresso ou no smartphone na portaria.</p>
        <p className="font-bold text-zinc-950">VERZEL ELITE TICKETS 2026 • TODOS OS DIREITOS RESERVADOS</p>
      </div>
    </div>
  );
};
