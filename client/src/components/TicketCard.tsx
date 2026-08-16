import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { TicketItem } from '../lib/api';
import { Calendar, MapPin, Check, Printer, CalendarPlus, Share2, CheckCircle2, ShieldCheck, Copy, Maximize2, X } from 'lucide-react';
import { PrintableTicket } from './PrintableTicket';
import { buildGoogleCalendarUrl, buildTicketShareLink, buildTicketQrPayload, formatEventDate, formatSeatLabel } from '../lib/ticketUtils';

interface TicketCardProps {
  ticket: TicketItem;
  qrData?: string;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, qrData }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

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

  // Handle ESC key to close zoomed QR code modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZoomed) {
        setIsZoomed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomed]);

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

  // Pure user name display without concatenated status suffixes
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

          {/* QR Code Voucher Stub with Click to Zoom */}
          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            className="w-full max-w-[190px] aspect-square mx-auto flex items-center justify-center p-3 bg-white rounded-2xl relative shadow-md group cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            title="Toque para ampliar o QR Code"
          >
            <QRCodeSVG
              value={finalQrString}
              size={165}
              level="M"
              includeMargin={true}
              className="w-full h-full object-contain mx-auto"
            />

            {/* Hover Zoom Cue */}
            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm p-1 rounded-md text-white opacity-80 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="w-3.5 h-3.5" />
            </div>

            {isUsed && (
              <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center p-4 text-center border-2 border-amber-500/60 animate-in fade-in">
                <CheckCircle2 className="w-8 h-8 text-amber-400 mb-1" />
                <span className="text-xs font-bold text-amber-300 tracking-wide uppercase font-mono">Ingresso Utilizado</span>
                <span className="text-[11px] text-zinc-300 font-mono mt-0.5">Entrada: {usedTimeStr}</span>
              </div>
            )}
          </button>

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
      </div>

      {/* Fullscreen Zoomed QR Code Modal for Optimal Gatekeeper Scanning */}
      {isZoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="QR Code Ampliado"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="w-full max-w-sm bg-[#0e0e11] rounded-3xl border border-zinc-700/80 p-6 space-y-5 shadow-2xl relative text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors border border-zinc-800"
              aria-label="Fechar ampliação"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header info */}
            <div className="space-y-1 pr-8 text-left">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                Apresente na Catraca / Portaria
              </span>
              <h3 className="text-base font-bold text-white truncate">{event.title}</h3>
              <p className="text-xs text-zinc-400 font-mono">
                {seat.row_name}{seat.seat_number} • {cleanUserName} • #{shortRef}
              </p>
            </div>

            {/* Ultra High-Contrast Large QR Container */}
            <div className="w-full max-w-[270px] aspect-square mx-auto p-4 bg-white rounded-3xl shadow-2xl flex items-center justify-center relative">
              <QRCodeSVG
                value={finalQrString}
                size={238}
                level="H"
                includeMargin={true}
                className="w-full h-full object-contain mx-auto"
              />

              {isUsed && (
                <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center p-4 text-center border-2 border-amber-500">
                  <CheckCircle2 className="w-10 h-10 text-amber-400 mb-1" />
                  <span className="text-sm font-bold text-amber-300 uppercase font-mono">Ingresso Já Utilizado</span>
                  <span className="text-xs text-zinc-300 font-mono mt-0.5">Entrada: {usedTimeStr}</span>
                </div>
              )}
            </div>

            {/* Brightness / Scan Tip */}
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Posicione o QR Code diretamente em frente ao leitor óptico.
            </p>

            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              className="w-full py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs transition-colors shadow-sm"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      )}

      {/* High-Resolution Printable Ticket for PDF Export */}
      <div className="hidden print:block printable-container">
        <PrintableTicket ticket={ticket} />
      </div>
    </>
  );
};
