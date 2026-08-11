import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { TicketItem } from '../lib/api';
import { ShieldCheck, Calendar, MapPin, Ticket, CheckCircle2, AlertTriangle, Copy, Check, Barcode, Sparkles } from 'lucide-react';

interface TicketCardProps {
  ticket: TicketItem;
  qrData?: string;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, qrData }) => {
  const [copied, setCopied] = useState(false);

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

  const handleCopyLink = () => {
    const link = `${window.location.origin}/#ticket-${ticket.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-md mx-auto ticket-stub rounded-3xl overflow-hidden shadow-2xl relative transition-all duration-300 hover:border-emerald-500/50 bg-[#141417] border border-zinc-800">
      {/* Ticket Banner Image Header */}
      <div className="h-40 w-full relative overflow-hidden bg-zinc-950">
        <img
          src={event.banner_url}
          alt={event.title}
          className="w-full h-full object-cover filter brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141417] via-[#141417]/40 to-transparent"></div>
        
        {/* Holographic Official Seal */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-emerald-950/90 backdrop-blur-md text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full border border-emerald-500/50 shadow-xl">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>BILHETE AUTÊNTICO 2026</span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          {isUsed ? (
            <span className="bg-amber-500 text-zinc-950 font-extrabold text-[10px] uppercase px-3 py-1.5 rounded-full flex items-center gap-1 shadow-xl">
              <CheckCircle2 className="w-3.5 h-3.5" /> UTILIZADO
            </span>
          ) : (
            <span className="bg-emerald-400 text-zinc-950 font-extrabold text-[10px] uppercase px-3 py-1.5 rounded-full flex items-center gap-1 shadow-xl">
              <ShieldCheck className="w-3.5 h-3.5" /> VÁLIDO 🟢
            </span>
          )}
        </div>
      </div>

      {/* Ticket Body Content */}
      <div className="p-6">
        <h3 className="text-2xl font-black font-display text-white mb-2 leading-tight">{event.title}</h3>
        
        <div className="space-y-2.5 text-xs text-zinc-300 mb-6 font-medium">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{new Date(event.date || Date.now()).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>

        {/* Perforated Line */}
        <div className="relative my-6">
          <div className="border-b-2 border-dashed border-zinc-700/80 w-full"></div>
        </div>

        {/* Seat & Owner Details Grid */}
        <div className="grid grid-cols-2 gap-4 bg-[#09090b] p-4 rounded-2xl border border-zinc-800 mb-6 text-xs shadow-inner">
          <div>
            <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold font-mono">Titular</span>
            <p className="font-bold text-zinc-200 truncate mt-0.5">{ticket.user_name || ticket.user_email}</p>
          </div>
          <div>
            <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold font-mono">Assento</span>
            <p className="font-extrabold text-emerald-400 font-mono text-sm mt-0.5">
              {seat.row_name} - N° {seat.seat_number}
            </p>
          </div>
        </div>

        {/* QR Code Container with Barcode */}
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-2xl relative group border-2 border-zinc-800">
          <QRCodeSVG
            value={finalQrString}
            size={170}
            level="H"
            includeMargin={true}
          />

          {/* Simulated Barcode */}
          <div className="w-full mt-3 pt-3 border-t border-zinc-200 flex flex-col items-center">
            <div className="h-6 w-full max-w-[200px] flex items-center justify-between opacity-80">
              {[...Array(24)].map((_, i) => (
                <span
                  key={i}
                  className={`h-full bg-zinc-950 ${i % 3 === 0 ? 'w-1' : i % 5 === 0 ? 'w-1.5' : 'w-0.5'}`}
                ></span>
              ))}
            </div>
            <span className="text-[10px] font-mono font-bold text-zinc-600 mt-1">
              ID: {ticket.id}
            </span>
          </div>

          <span className="text-[10px] font-bold text-emerald-700 tracking-wider flex items-center justify-center gap-1 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Assinado por HMAC-SHA256
          </span>

          {isUsed && (
            <div className="absolute inset-0 bg-[#09090b]/95 rounded-2xl flex flex-col items-center justify-center text-amber-400 p-4 text-center">
              <AlertTriangle className="w-12 h-12 mb-2 animate-bounce text-amber-400" />
              <span className="font-black text-base uppercase font-display">Ingresso Já Validado</span>
              <span className="text-xs text-zinc-400 mt-1">Entrada registrada na portaria</span>
            </div>
          )}
        </div>

        {/* Share Link Action */}
        <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 font-medium">Link Público de Validação</span>
          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
              copied
                ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-lg shadow-emerald-500/30'
                : 'bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border-zinc-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-zinc-950" />
                <span>Copiado com Sucesso!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
