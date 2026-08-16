import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { TicketItem } from '../lib/api';
import { Calendar, MapPin, Check, Printer, CalendarPlus, Share2, CheckCircle2, ShieldCheck, Copy } from 'lucide-react';
import { PrintableTicket } from './PrintableTicket';
import { buildGoogleCalendarUrl, buildTicketShareLink, buildTicketQrPayload, formatEventDate, formatSeatLabel } from '../lib/ticketUtils';

interface TicketCardProps {
  ticket: TicketItem;
  qrData?: string;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, qrData }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const event = ticket.events || {
    title: 'Evento Oficial Elite Tickets',
    venue: 'Local do Evento',
    date: new Date().toISOString(),
    banner_url: '',
  };

  const seat = ticket.seats || { row_name: 'A', seat_number: 1, category: 'VIP' };
  const finalQrString = qrData || buildTicketQrPayload(ticket);
  const isUsed = ticket.status === 'used';
  const shortRef = (ticket.id || '').replace(/^t-|^T-|^#/, '').slice(0, 6).toUpperCase() || 'DEMO';

  const handleShare = async () => {
    const link = buildTicketShareLink(ticket.id);
    const shareText = `🎟️ Ingresso Oficial: ${event.title}\nAssento: ${seat.row_name}${seat.seat_number}\nVeja o comprovante autenticado: ${link}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: shareText,
          url: link,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyPayload = () => {
    const codeToCopy = ticket.id || finalQrString;
    navigator.clipboard.writeText(codeToCopy);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddToCalendar = () => {
    window.open(buildGoogleCalendarUrl(ticket), '_blank');
  };

  const usedTimeStr = ticket.used_at
    ? new Date(ticket.used_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : 'Portaria';

  // Ensure pure user name display without any concatenated status suffixes
  const cleanUserName = (ticket.user_name || ticket.user_email || 'Cliente')
    .replace(/\s*\(Já Entrou\)/gi, '')
    .replace(/\s*\(Utilizado\)/gi, '')
    .trim();

  return (
    <>
      {/* Screen View Ticket Card with Physical Ticket-Stub Notches */}
      <div
        className={`w-full max-w-sm mx-auto bg-[#0e0e11] rounded-3xl overflow-hidden border transition-all no-print relative shadow-2xl ${
          isUsed ? 'border-amber-500/30 opacity-90' : 'border-zinc-800/90 hover:border-zinc-700'
        }`}
      >
        {/* Security Header Bar */}
        <div className="px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Passe Oficial Autenticado</span>
          </div>
          <span className="text-zinc-400 font-mono text-[11px] font-bold tracking-wider whitespace-nowrap">
            #{shortRef}
          </span>
        </div>

        {/* Banner */}
        {event.banner_url && (
          <div className="h-32 w-full relative overflow-hidden bg-zinc-900">
            <img
              src={event.banner_url}
              alt={event.title}
              className={`w-full h-full object-cover ${isUsed ? 'grayscale brightness-50' : 'brightness-75'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e11] via-transparent to-transparent" />
          </div>
        )}

        <div className="p-5 space-y-4">
          {/* Title + Status Badge */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-white leading-snug tracking-tight">{event.title}</h3>
            <span
              className={`shrink-0 inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                isUsed
                  ? 'text-amber-400 bg-amber-950/40 border-amber-800/40'
                  : 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isUsed ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              {isUsed ? 'Utilizado' : 'Válido'}
            </span>
          </div>

          {/* Event Metadata */}
          <div className="space-y-1.5 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
              <span>{formatEventDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>

          {/* Titular and Seat Information */}
          <div className="flex items-center justify-between bg-zinc-900/80 px-4 py-3 rounded-2xl border border-zinc-800 text-xs">
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-mono font-bold">Titular</span>
              <p className="text-zinc-200 font-semibold truncate max-w-[140px]">{cleanUserName}</p>
            </div>
            <div className="text-right">
              <span className="text-zinc-500 text-[10px] uppercase font-mono font-bold">Assento</span>
              <p className={`font-mono font-bold text-sm ${isUsed ? 'text-zinc-400' : 'text-emerald-400'}`}>
                {formatSeatLabel(seat)}
              </p>
            </div>
          </div>

          {/* Physical Ticket Stub Tear Line & Cutouts */}
          <div className="relative my-4 flex items-center justify-between">
            {/* Left Notch */}
            <div className="w-5 h-5 rounded-full bg-[#09090b] border-r border-zinc-800/90 -ml-7 z-10" />
            {/* Dashed Tear Line */}
            <div className="flex-1 border-b-2 border-dashed border-zinc-800/80 mx-1" />
            {/* Right Notch */}
            <div className="w-5 h-5 rounded-full bg-[#09090b] border-l border-zinc-800/90 -mr-7 z-10" />
          </div>

          {/* QR Code Voucher Stub */}
          <div className="w-full max-w-[190px] aspect-square mx-auto flex items-center justify-center p-3 bg-white rounded-2xl relative shadow-md">
            <QRCodeSVG
              value={finalQrString}
              size={165}
              level="M"
              includeMargin={true}
              className="w-full h-full object-contain mx-auto"
            />

            {isUsed && (
              <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center p-4 text-center border-2 border-amber-500/60 animate-in fade-in">
                <CheckCircle2 className="w-8 h-8 text-amber-400 mb-1" />
                <span className="text-xs font-bold text-amber-300 tracking-wide uppercase font-mono">Ingresso Utilizado</span>
                <span className="text-[11px] text-zinc-300 font-mono mt-0.5">Entrada: {usedTimeStr}</span>
              </div>
            )}
          </div>

          {/* Barcode lines graphic */}
          <div className="flex justify-center items-center gap-0.5 py-1 opacity-40">
            {[4, 2, 8, 1, 6, 3, 7, 2, 5, 8, 3, 2, 6, 4, 8, 1, 3, 5, 2, 7, 4].map((h, i) => (
              <span key={i} className="w-0.5 bg-zinc-400 rounded-full" style={{ height: `${h * 2 + 4}px` }} />
            ))}
          </div>

          {/* Quick Copy */}
          <button
            type="button"
            onClick={handleCopyPayload}
            className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            title="Copiar código do ingresso"
          >
            {copiedPayload ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Código Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copiar Código</span>
              </>
            )}
          </button>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 h-9 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors touch-manipulation active:scale-[0.98]"
              title="Baixar PDF do Ingresso"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Salvar PDF</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex-1 h-9 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors touch-manipulation active:scale-[0.98]"
              title="Compartilhar Link do Ingresso"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400 font-semibold">Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Compartilhar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleAddToCalendar}
              className="h-9 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center transition-colors touch-manipulation active:scale-[0.98]"
              title="Adicionar ao Google Agenda"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Hidden PDF Printable Ticket for Print Mode */}
        <div className="hidden print:block">
          <PrintableTicket ticket={ticket} />
        </div>
      </div>
    </>
  );
};
