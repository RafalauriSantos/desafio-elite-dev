/**
 * Funções utilitárias desacopladas para manipulação e formatação de ingressos.
 */

import { TicketItem } from './api';

/**
 * Gera a URL do Google Calendar para um evento e assento específicos.
 */
export function buildGoogleCalendarUrl(ticket: TicketItem): string {
  const event = ticket.events || {
    title: 'Evento Elite Tickets',
    venue: 'Local do Evento',
    date: new Date().toISOString(),
  };
  const seat = ticket.seats || { row_name: 'A', seat_number: 1, category: 'VIP' };

  const rawDate = event.date || new Date().toISOString();
  const eventTitle = event.title || 'Evento';
  const eventVenue = event.venue || 'Local do Evento';
  const startDate = new Date(rawDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const endDate = new Date(new Date(rawDate).getTime() + 3 * 3600 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');

  const seatLabel = seat.row_name && seat.seat_number ? `Assento: ${seat.row_name}${seat.seat_number}` : '';
  const details = `Ingresso autenticado emitido via Elite Tickets. ${seatLabel}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(eventVenue)}`;
}

/**
 * Monta o link público de compartilhamento de um ingresso.
 */
export function buildTicketShareLink(ticketId: string): string {
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://elite-tickets.pages.dev';
  return `${origin}/?ticket=${ticketId}`;
}

/**
 * Retorna o payload serializado do QR Code padronizado.
 */
export function buildTicketQrPayload(ticket: TicketItem): string {
  return JSON.stringify({
    ticketId: ticket.id,
    eventId: ticket.event_id,
    seatId: ticket.seat_id,
    clientId: ticket.clientId || ticket.user_email,
    issuedAt: ticket.issuedAt || (ticket.created_at ? new Date(ticket.created_at).getTime() : Date.now()),
    signature: ticket.qr_signature,
  });
}

/**
 * Formata data de evento em padrão brasileiro (ex: 20 NOV 2026 • 19:00).
 */
export function formatEventDate(dateString?: string): string {
  const eventDateObj = dateString && !isNaN(new Date(dateString).getTime()) ? new Date(dateString) : new Date();
  const day = eventDateObj.getDate();
  const monthStr = eventDateObj
    .toLocaleDateString('pt-BR', { month: 'short' })
    .replace('.', '')
    .toUpperCase();
  const year = eventDateObj.getFullYear();
  const hours = String(eventDateObj.getHours()).padStart(2, '0');
  const minutes = String(eventDateObj.getMinutes()).padStart(2, '0');
  return `${day} ${monthStr} ${year} • ${hours}:${minutes}`;
}

/**
 * Formata a etiqueta do assento (ex: VIP • A-01).
 */
export function formatSeatLabel(seat?: { row_name?: string; seat_number?: number | string; category?: string }): string {
  const row = seat?.row_name || 'A';
  const rawNum = seat?.seat_number;
  const numPadded =
    typeof rawNum === 'number' && !isNaN(rawNum)
      ? String(rawNum).padStart(2, '0')
      : rawNum
      ? String(rawNum).padStart(2, '0')
      : '01';
  const cat = seat?.category || 'VIP';
  return `${cat} • ${row}-${numPadded}`;
}
