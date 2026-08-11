import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { TicketItem } from '../lib/api';
import { Calendar, MapPin, Copy, Check, Printer, CalendarPlus } from 'lucide-react';
import { PrintableTicket } from './PrintableTicket';

interface TicketCardProps {
  ticket: TicketItem;
  qrData?: string;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, qrData }) => {
  const [copied, setCopied] = useState(false);

  const event = ticket.events || {
    title: 'Evento',
    venue: 'Local',
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

  const isUsed = ticket.status === 'used';

  const handleCopyLink = () => {
    const link = `${window.location.origin}/#ticket-${ticket.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddToCalendar = () => {
    const rawDate = event.date || new Date().toISOString();
    const eventTitle = event.title || 'Evento';
    const eventVenue = event.venue || 'Local do Evento';
    const startDate = new Date(rawDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endDate = new Date(new Date(rawDate).getTime() + 3 * 3600 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDate}/${endDate}&details=${encodeURIComponent('Ingresso emitido via Elite Tickets. Assento: ' + seat.row_name + seat.seat_number)}&location=${encodeURIComponent(eventVenue)}`;
    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <>
      {/* Screen View Ticket Card */}
      <div className="w-full max-w-sm mx-auto bg-[#111113] rounded-2xl overflow-hidden border border-zinc-800/60 no-print">
        {/* Banner */}
        {event.banner_url && (
          <div className="h-32 w-full relative overflow-hidden">
            <img
              src={event.banner_url}
              alt={event.title}
              className="w-full h-full object-cover brightness-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-transparent to-transparent" />
          </div>
        )}

        <div className="p-5 space-y-4">
          {/* Title + status */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-white leading-snug">{event.title}</h3>
            <span className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded ${
              isUsed
                ? 'text-amber-400 bg-amber-950/30'
                : 'text-emerald-400 bg-emerald-950/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isUsed ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              {isUsed ? 'Usado' : 'Válido'}
            </span>
          </div>

          {/* Meta */}
          <div className="space-y-1.5 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{new Date(event.date || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>

          {/* Seat info */}
          <div className="flex items-center justify-between bg-zinc-900/60 px-3 py-2.5 rounded-lg border border-zinc-800/40 text-xs">
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-mono">Titular</span>
              <p className="text-zinc-200 font-medium truncate">{ticket.user_name || ticket.user_email}</p>
            </div>
            <div className="text-right">
              <span className="text-zinc-500 text-[10px] uppercase font-mono">Assento</span>
              <p className="text-emerald-400 font-mono font-semibold">{seat.row_name}{seat.seat_number}</p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center p-4 bg-white rounded-xl relative">
            <QRCodeSVG
              value={finalQrString}
              size={150}
              level="H"
              includeMargin={false}
            />
            <p className="text-[10px] text-zinc-600 font-mono font-bold mt-2">ID: {ticket.id}</p>

            {isUsed && (
              <div className="absolute inset-0 bg-zinc-950/90 rounded-xl flex flex-col items-center justify-center">
                <span className="text-sm font-semibold text-amber-400">Já utilizado</span>
                <span className="text-xs text-zinc-500 mt-0.5">Entrada registrada</span>
              </div>
            )}
          </div>

          {/* Actions bar: Calendar & Print & Copy */}
          <div className="pt-2 border-t border-zinc-800/40 flex items-center justify-between text-xs text-zinc-400">
            <button
              type="button"
              onClick={handleAddToCalendar}
              className="flex items-center gap-1 hover:text-white transition-colors"
              title="Adicionar ao Google Calendar"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Agenda</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1 hover:text-white transition-colors"
              title="Baixar PDF / Imprimir"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-300" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden PDF Printable Ticket Pass (Renders only during print) */}
      <div className="hidden print:block">
        <PrintableTicket ticket={ticket} qrData={finalQrString} />
      </div>
    </>
  );
};
