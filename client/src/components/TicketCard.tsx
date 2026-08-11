import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { TicketItem } from '../lib/api';
import { ShieldCheck, Calendar, MapPin, Ticket, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TicketCardProps {
  ticket: TicketItem;
  qrData?: string;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, qrData }) => {
  const event = ticket.events || {
    title: 'Evento Selecionado',
    venue: 'Local do Evento',
    date: new Date().toISOString(),
    banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
  };

  const seat = ticket.seats || { row_name: 'A', seat_number: 1 };
  
  // Format Payload for QR code display
  const finalQrString = qrData || JSON.stringify({
    ticketId: ticket.id,
    eventId: ticket.event_id,
    seatId: ticket.seat_id,
    userEmail: ticket.user_email,
    signature: ticket.qr_signature
  });

  const isUsed = ticket.status === 'used';

  return (
    <div className="w-full max-w-md mx-auto glass-panel rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative transition hover:border-indigo-500/40">
      {/* Ticket Banner Image */}
      <div className="h-36 w-full relative overflow-hidden">
        <img
          src={event.banner_url}
          alt={event.title}
          className="w-full h-full object-cover filter brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        <div className="absolute top-4 left-4">
          <span className="bg-indigo-600/90 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-indigo-400/40 shadow-lg">
            INGRESSO OFICIAL
          </span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          {isUsed ? (
            <span className="bg-amber-500/90 text-slate-950 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> UTILIZADO
            </span>
          ) : (
            <span className="bg-emerald-500/90 text-slate-950 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> VÁLIDO
            </span>
          )}
        </div>
      </div>

      {/* Ticket Content Body */}
      <div className="p-6">
        <h3 className="text-xl font-bold font-display text-white mb-2">{event.title}</h3>
        
        <div className="space-y-2 text-xs text-slate-300 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{new Date(event.date || Date.now()).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>

        {/* Dotted Perforated Ticket Line */}
        <div className="relative my-6">
          <div className="border-b-2 border-dashed border-slate-800 w-full"></div>
          <div className="absolute -left-9 -top-3 w-6 h-6 rounded-full bg-slate-950 border-r border-slate-800"></div>
          <div className="absolute -right-9 -top-3 w-6 h-6 rounded-full bg-slate-950 border-l border-slate-800"></div>
        </div>

        {/* Seat & Owner Details Grid */}
        <div className="grid grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 mb-6 text-xs">
          <div>
            <span className="text-slate-500 uppercase tracking-wider text-[10px]">Titular</span>
            <p className="font-semibold text-slate-200 truncate">{ticket.user_name || ticket.user_email}</p>
          </div>
          <div>
            <span className="text-slate-500 uppercase tracking-wider text-[10px]">Assento</span>
            <p className="font-bold text-indigo-400 font-mono text-sm">
              {seat.row_name} - N° {seat.seat_number}
            </p>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner relative group">
          <QRCodeSVG
            value={finalQrString}
            size={160}
            level="H"
            includeMargin={true}
          />
          <div className="mt-2 text-center">
            <span className="text-[10px] font-mono text-slate-500 block truncate max-w-[200px]">
              ID: {ticket.id}
            </span>
            <span className="text-[9px] font-bold text-indigo-600 tracking-wider flex items-center justify-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3" /> Assinado via HMAC-SHA256
            </span>
          </div>

          {isUsed && (
            <div className="absolute inset-0 bg-slate-950/90 rounded-2xl flex flex-col items-center justify-center text-amber-400 p-4 text-center">
              <AlertTriangle className="w-10 h-10 mb-2" />
              <span className="font-extrabold text-sm uppercase">Ingresso Já Validado</span>
              <span className="text-[10px] text-slate-400 mt-1">Entrada registrada na portaria</span>
            </div>
          )}
        </div>

        {/* Share Link Action */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Ingresso Transferível / Link Público</span>
          <button
            type="button"
            onClick={() => {
              const link = `${window.location.origin}/#ticket-${ticket.id}`;
              navigator.clipboard.writeText(link);
              alert('Link de compartilhamento copiado para a área de transferência!\n\nLink: ' + link);
            }}
            className="px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Copiar Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};
