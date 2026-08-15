import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { TicketItem } from '../lib/api';
import { Sparkles, Calendar, MapPin, Check, Lock, Smartphone } from 'lucide-react';
import { buildTicketQrPayload } from '../lib/ticketUtils';

interface PrintableTicketProps {
  ticket: TicketItem;
  qrData?: string;
}

export const PrintableTicket: React.FC<PrintableTicketProps> = ({ ticket, qrData }) => {
  const event = ticket?.events || {
    title: 'Evento Oficial Elite Tickets',
    venue: 'Local do Evento',
    date: new Date().toISOString(),
    banner_url: '',
  };

  const seat = ticket?.seats || { row_name: 'A', seat_number: 1, category: 'VIP' };
  const safeTicketId = ticket?.id || 'T-DEMO';
  const isUsed = ticket?.status === 'used';

  const finalQrString = qrData || buildTicketQrPayload(ticket);

  const eventDateObj = event?.date && !isNaN(new Date(event.date).getTime()) ? new Date(event.date) : new Date();
  const day = eventDateObj.getDate();
  const monthStr = eventDateObj
    .toLocaleDateString('pt-BR', { month: 'short' })
    .replace('.', '')
    .toUpperCase();
  const year = eventDateObj.getFullYear();
  const hours = String(eventDateObj.getHours()).padStart(2, '0');
  const minutes = String(eventDateObj.getMinutes()).padStart(2, '0');
  const formattedDate = `${day} ${monthStr} ${year} • ${hours}:${minutes}`;

  const usedDateStr = ticket?.used_at && !isNaN(new Date(ticket.used_at).getTime())
    ? new Date(ticket.used_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Portaria';

  const rawId = safeTicketId.replace(/^t-|^T-|^#/, '');
  const refCode = `#T-${rawId.slice(0, 6).toUpperCase() || 'DEMO'}`;
  const rowName = seat?.row_name || 'A';
  const rawSeatNum = seat?.seat_number;
  const seatNumberPadded = typeof rawSeatNum === 'number' && !isNaN(rawSeatNum)
    ? String(rawSeatNum).padStart(2, '0')
    : (rawSeatNum ? String(rawSeatNum).padStart(2, '0') : '01');
  const categoryName = seat?.category || 'VIP';

  const cleanUserName = (ticket?.user_name || ticket?.user_email || 'Cliente')
    .replace(/\s*\(Já Entrou\)/gi, '')
    .replace(/\s*\(Utilizado\)/gi, '')
    .trim();

  return (
    <div className="printable-ticket-area bg-white text-zinc-950 rounded-[32px] border border-zinc-200 shadow-xl p-6 sm:p-7 max-w-[380px] mx-auto space-y-4 font-sans print:shadow-none print:mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-4 h-4 fill-white" />
          </div>
          <span className="text-sm font-black tracking-wider text-black uppercase font-sans">
            ELITE TICKETS
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block leading-none">
            REF
          </span>
          <span className="text-xs font-mono font-black text-zinc-900 mt-0.5 block whitespace-nowrap">
            {refCode}
          </span>
        </div>
      </div>

      <div className="border-t border-dashed border-zinc-200 my-2" />

      {/* Used Status Banner (only if used) */}
      {isUsed && (
        <div className="bg-[#fff7ed] border border-[#ffedd5] rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#ea580c] flex items-center justify-center text-white shrink-0">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div>
            <p className="text-xs font-black text-[#c2410c] uppercase tracking-wide">
              INGRESSO UTILIZADO
            </p>
            <p className="text-[11px] text-[#9a3412] mt-0.5">
              Entrada registrada na portaria
            </p>
          </div>
        </div>
      )}

      {/* Event Title & Date/Location */}
      <div className="space-y-2 pt-1">
        <h1 className="text-xl font-black text-black uppercase tracking-tight leading-tight">
          {event.title}
        </h1>

        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2 font-bold text-zinc-800">
            <Calendar className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-600 font-medium">
            <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span>{event.venue}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-200/80 my-2" />

      {/* 2-Column Metadata Grid */}
      <div className="grid grid-cols-2 gap-4 py-1">
        <div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            TITULAR
          </span>
          <p className="text-sm font-black text-zinc-950 truncate mt-0.5">
            {cleanUserName}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            CATEGORIA / ASSENTO
          </span>
          <p className="text-sm font-black text-zinc-950 mt-0.5">
            {categoryName} • {rowName}-{seatNumberPadded}
          </p>
        </div>
      </div>

      <div className="border-t border-dashed border-zinc-200 my-2" />

      {/* Centered QR Code Container */}
      <div className="w-full flex flex-col items-center justify-center space-y-2 py-1">
        <div className="w-[200px] h-[200px] bg-white border border-zinc-200 rounded-2xl p-2.5 flex items-center justify-center relative mx-auto shadow-sm">
          <QRCodeSVG
            value={finalQrString}
            size={175}
            level="M"
            includeMargin={true}
            className="w-[175px] h-[175px] block mx-auto"
          />

          {/* Centered Circular Lock Badge if Used */}
          {isUsed && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-18 h-18 rounded-full bg-white shadow-xl border border-zinc-300 flex flex-col items-center justify-center p-2 text-center">
                <Lock className="w-5 h-5 text-zinc-900 mb-0.5 stroke-[2.5]" />
                <span className="text-[8px] font-black text-zinc-900 uppercase tracking-wider">
                  UTILIZADO
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic usage stamp only when ticket is used */}
        {isUsed && (
          <p className="text-center text-[11px] text-zinc-500 font-mono">
            Entrada registrada em {usedDateStr}
          </p>
        )}
      </div>

      {/* Instructions Box */}
      <div className="border-t border-zinc-200/80 pt-3 flex items-center gap-3">
        <Smartphone className="w-6 h-6 text-zinc-700 shrink-0" />
        <div>
          <p className="text-xs font-bold text-zinc-950">
            Apresente este ingresso na portaria.
          </p>
          <p className="text-[11px] text-zinc-500 font-medium">
            Impresso ou no smartphone.
          </p>
        </div>
      </div>

      {/* Bottom Micro-Footer */}
      <div className="border-t border-zinc-100 pt-2 flex items-center justify-between text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
        <span>ELITE TICKETS • 2026</span>
      </div>
    </div>
  );
};
