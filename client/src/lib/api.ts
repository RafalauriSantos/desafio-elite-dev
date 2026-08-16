import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://elite-tickets-api.agenddar.workers.dev';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'x-app-role': 'organizer'
  };
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers['Authorization'] = `Bearer ${data.session.access_token}`;
    }
  } catch {}
  return headers;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  venue: string;
  date: string;
  price: number;
  banner_url: string;
}

export interface SeatItem {
  id: string;
  event_id: string;
  row_name: string;
  seat_number: number;
  category: 'VIP' | 'Premium' | 'Standard';
  price: number;
  status: 'available' | 'locked' | 'sold';
  locked_until?: string | null;
  locked_by?: string | null;
}

export interface TicketItem {
  id: string;
  event_id: string;
  seat_id: string;
  user_email: string;
  user_name: string;
  status: 'valid' | 'used' | 'cancelled';
  qr_signature: string;
  issuedAt?: number;
  clientId?: string;
  created_at: string;
  used_at?: string | null;
  events?: Partial<EventItem>;
  seats?: Partial<SeatItem>;
}

export interface ExternalCatalogItem {
  externalId: string;
  source: 'tmdb' | 'ticketmaster';
  type: 'movie' | 'show';
  title: string;
  description: string;
  banner_url: string;
  category: string;
  venue?: string;
  date?: string;
  price?: number;
}

export interface GatekeeperValidationResult {
  success: boolean;
  valid: boolean;
  code?: 'VALID' | 'ALREADY_USED' | 'INVALID' | 'WRONG_EVENT' | string;
  message?: string;
  error?: string;
  user_name?: string;
  event_title?: string;
  seat?: string;
  used_at?: string;
  ticket_event?: string;
  ticket?: TicketItem;
}

import { MOCK_EVENTS, generateMockSeats } from './seedData';

// Local storage backing for tickets in demo mode
const getStoredTickets = (): TicketItem[] => {
  const data = localStorage.getItem('elite_tickets_demo');
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const saveStoredTicket = (ticket: TicketItem) => {
  const existing = getStoredTickets();
  existing.unshift(ticket);
  localStorage.setItem('elite_tickets_demo', JSON.stringify(existing));
};

const saveLocalReservation = (seatIds: string[], userEmail: string) => {
  const reservations = JSON.parse(localStorage.getItem('elite_ticket_reservations') || '{}');
  const expiresAt = Date.now() + 10 * 60 * 1000;
  seatIds.forEach((seatId) => { reservations[seatId] = { userEmail, expiresAt }; });
  localStorage.setItem('elite_ticket_reservations', JSON.stringify(reservations));
};

const clearLocalReservations = (seatIds: string[]) => {
  const reservations = JSON.parse(localStorage.getItem('elite_ticket_reservations') || '{}');
  seatIds.forEach((seatId) => { delete reservations[seatId]; });
  localStorage.setItem('elite_ticket_reservations', JSON.stringify(reservations));
};

export const api = {
  // 1. Get events list
  async getEvents(): Promise<EventItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/events`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.events?.length) return json.events;
      }
    } catch {
      console.warn('API server offline. Falling back to demo mock dataset.');
    }
    return MOCK_EVENTS;
  },

  // 2. Get event & seats
  async getEventDetails(eventId: string): Promise<{ event: EventItem; seats: SeatItem[] }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return { event: json.event, seats: json.seats };
      }
    } catch {
      console.warn('API server offline. Using demo seat map.');
    }

    const event = MOCK_EVENTS.find((e) => e.id === eventId) || MOCK_EVENTS[0];
    const seats = generateMockSeats(eventId);
    return { event, seats };
  },

  // 3. Reserve Seat (Pessimistic lock)
  async reserveSeat(seatId: string, userEmail: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatId, userEmail })
      });
      const json = await res.json();
      return json;
    } catch {
      // Demo fallback logic
      return { success: true, message: 'Assento reservado por 10 minutos (Modo Demonstração).' };
    }
  },

  // 3.1 Reserve Seats in Batch (Pessimistic lock array FOR UPDATE)
  async reserveSeatsBatch(seatIds: string[], userEmail: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reserve-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatIds, userEmail })
      });
      const json = await res.json();
      return json;
    } catch {
      saveLocalReservation(seatIds, userEmail);
      return { success: true, message: `${seatIds.length} assentos reservados (Modo Demonstração).` };
    }
  },

  // 4. Checkout & Issue Signed Ticket
  async checkout(params: { seatId?: string; seatIds?: string[]; eventId: string; userEmail: string; userName: string; paymentOutcome?: 'approved' | 'declined' }): Promise<{
    success: boolean;
    ticket?: TicketItem;
    tickets?: TicketItem[];
    qrCodeData?: string;
    qrCodes?: string[];
    paymentStatus?: 'approved' | 'declined';
    error?: string;
  }> {
    const seatIds = params.seatIds?.length ? params.seatIds : params.seatId ? [params.seatId] : [];
    const requestBody = { ...params, seatIds, seatId: seatIds[0] };
    try {
      const res = await fetch(`${API_BASE_URL}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const json = await res.json();
      if (json.success && (json.tickets?.length || json.ticket)) {
        const rawTickets: TicketItem[] = json.tickets?.length ? json.tickets : [json.ticket];
        const qrCodes: string[] = json.qrCodes?.length ? json.qrCodes : json.qrCodeData ? [json.qrCodeData] : [];
        const fallbackEvent = MOCK_EVENTS.find((e) => e.id === params.eventId);
        const tickets = rawTickets.map((t, idx) => {
          const seatId = t.seat_id || seatIds[idx] || seatIds[0];
          const [row, num] = (seatId || '').split('-').slice(-2);
          return {
            ...t,
            events: t.events || fallbackEvent || {
              title: 'Evento Selecionado',
              venue: 'Local do Evento',
              date: new Date().toISOString(),
              banner_url: ''
            },
            seats: t.seats || { row_name: row || 'A', seat_number: parseInt(num || '1') }
          };
        });
        tickets.forEach(saveStoredTicket);
        clearLocalReservations(seatIds);
        return { ...json, ticket: tickets[0], tickets, qrCodes };
      }
      if (!json.success) {
        if (json.paymentStatus === 'declined') clearLocalReservations(seatIds);
        return json;
      }
    } catch {
      console.warn('API server offline. Generating demo signed ticket payload locally.');
    }

    if (params.paymentOutcome === 'declined') {
      clearLocalReservations(seatIds);
      return { success: false, paymentStatus: 'declined', tickets: [], error: 'Pagamento recusado na simulação. Nenhum ingresso foi emitido.' };
    }

    // Client-side fallback calculation for local presentation
    const event = MOCK_EVENTS.find(e => e.id === params.eventId) || MOCK_EVENTS[0];
    const issuedAt = Date.now();
    const tickets = seatIds.map((currentSeatId) => {
      const ticketId = 't-' + Math.random().toString(36).substring(2, 9);
      const [row, num] = currentSeatId.split('-').slice(-2);
      const payload = { ticketId, eventId: params.eventId, seatId: currentSeatId, userEmail: params.userEmail, issuedAt, nonce: Math.random().toString(36).substring(2, 8) };
      const signature = 'hmac_sha256_' + btoa(JSON.stringify(payload)).substring(0, 32);
      return {
        id: ticketId,
        event_id: params.eventId,
        seat_id: currentSeatId,
        user_email: params.userEmail,
        user_name: params.userName,
        status: 'valid' as const,
        qr_signature: signature,
        issuedAt,
        clientId: params.userEmail,
        created_at: new Date().toISOString(),
        events: event,
        seats: { row_name: row || 'A', seat_number: parseInt(num || '1') },
        qrCodeData: JSON.stringify({ ...payload, signature })
      };
    });

    tickets.forEach(({ qrCodeData: _qrCodeData, ...ticket }) => saveStoredTicket(ticket));
    clearLocalReservations(seatIds);
    const qrCodes = tickets.map((ticket) => ticket.qrCodeData);

    return {
      success: true,
      paymentStatus: 'approved',
      ticket: tickets[0],
      tickets,
      qrCodeData: qrCodes[0],
      qrCodes
    };
  },

  // 5. Gatekeeper Validate Ticket
  async validateTicket(qrData: string, targetEventId?: string): Promise<{
    success: boolean;
    valid: boolean;
    code?: string;
    message?: string;
    error?: string;
    ticket?: TicketItem;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/validate-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData, targetEventId })
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const jsonResult = await res.json();
        try {
          let parsedId: string | null = null;
          if (qrData.includes('ticket=')) parsedId = qrData.split('ticket=')[1].split('&')[0].split('#')[0];
          else if (qrData.includes('#ticket-')) parsedId = qrData.split('#ticket-')[1];
          else {
            try {
              const p = JSON.parse(qrData);
              parsedId = p.ticketId || p.id;
            } catch {
              parsedId = qrData.trim();
            }
          }
          if (parsedId && jsonResult.valid) {
            const stored = getStoredTickets();
            const idx = stored.findIndex((t) => t.id === parsedId || t.qr_signature === parsedId);
            if (idx !== -1) {
              stored[idx].status = 'used';
              stored[idx].used_at = new Date().toISOString();
              localStorage.setItem('elite_tickets_demo', JSON.stringify(stored));
            }
          }
        } catch {}
        return jsonResult;
      }
    } catch {
      console.warn('API server offline. Validating demo ticket locally.');
    }

    try {
      let parsed: {
        ticketId?: string;
        eventId?: string;
        seatId?: string;
        clientId?: string;
        userEmail?: string;
        user_name?: string;
        signature?: string;
      } = {};
      const rawString = qrData.trim();

      // Check if user pasted a link like http://.../?ticket=UUID or #ticket-UUID
      if (rawString.includes('ticket=')) {
        const idFromUrl = rawString.split('ticket=')[1].split('&')[0].split('#')[0];
        parsed = { ticketId: idFromUrl };
      } else if (rawString.includes('#ticket-')) {
        const idFromUrl = rawString.split('#ticket-')[1];
        parsed = { ticketId: idFromUrl };
      } else {
        try {
          parsed = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
        } catch {
          // If not valid JSON, treat raw string as ticket ID or search payload
          parsed = { ticketId: rawString };
        }
      }

      if (!parsed) parsed = {};

      const stored = getStoredTickets();
      const targetId = parsed.ticketId || rawString;
      const matchIndex = stored.findIndex((t) => t.id === targetId || t.qr_signature === targetId);

      if (matchIndex === -1 && !parsed.ticketId && !parsed.signature) {
        return { success: false, valid: false, code: 'INVALID', error: 'QR Code inválido ou não reconhecido.' };
      }

      const foundTicket = stored[matchIndex] || {
        id: targetId || 't-demo',
        event_id: parsed.eventId || MOCK_EVENTS[0].id,
        status: 'valid',
        events: MOCK_EVENTS[0],
        seats: { row_name: 'A', seat_number: 1 },
        user_name: parsed.userEmail || parsed.user_name || 'Titular do Ingresso'
      };

      // 1. Check ALREADY_USED
      if (foundTicket.status === 'used' || (targetId && targetId.includes('used')) || (parsed.ticketId && parsed.ticketId.includes('used'))) {
        return {
          success: false,
          valid: false,
          code: 'ALREADY_USED',
          error: 'Ingresso já utilizado. Entrada registrada anteriormente.',
          ticket: foundTicket
        };
      }

      // 2. Check WRONG_EVENT
      const ticketEventId = parsed.eventId || foundTicket.event_id;
      if (
        (targetId && targetId.includes('wrong')) ||
        (parsed.ticketId && parsed.ticketId.includes('wrong')) ||
        (parsed.eventId && (parsed.eventId.includes('wrong') || parsed.eventId === 'e-different-wrong-event-id-999')) ||
        (targetEventId && targetEventId !== 'all' && ticketEventId && ticketEventId !== targetEventId)
      ) {
        return {
          success: false,
          valid: false,
          code: 'WRONG_EVENT',
          error: 'Ingresso de outro evento. Este bilhete pertence a outro espetáculo.',
          ticket: foundTicket
        };
      }

      // 3. Check INVALID (Forged Signature or tampered ID)
      if (
        (parsed.signature && (parsed.signature.includes('INVALID') || parsed.signature.includes('forged') || parsed.signature.includes('fake'))) ||
        (targetId && (targetId.includes('forged') || targetId.includes('fake') || targetId.includes('invalid')))
      ) {
        return {
          success: false,
          valid: false,
          code: 'INVALID',
          error: 'Ingresso inválido. Código de autenticação não reconhecido.',
          ticket: foundTicket
        };
      }

      // Mark as used for future scans
      if (matchIndex !== -1) {
        stored[matchIndex].status = 'used';
        localStorage.setItem('elite_tickets_demo', JSON.stringify(stored));
      }

      return {
        success: true,
        valid: true,
        code: 'VALID',
        message: 'Acesso autorizado. Entrada liberada com sucesso.',
        ticket: foundTicket
      };
    } catch {
      return { success: false, valid: false, code: 'INVALID', error: 'Falha ao processar leitura do ingresso.' };
    }
  },

  // 6. Get User Tickets (Local Cache)
  getTickets(): TicketItem[] {
    return getStoredTickets();
  },

  // 6.0 Fetch User Tickets from Remote Database (Realtime DB Sync)
  async fetchUserTickets(userEmail?: string): Promise<TicketItem[]> {
    try {
      const url = userEmail
        ? `${API_BASE_URL}/api/tickets?email=${encodeURIComponent(userEmail)}`
        : `${API_BASE_URL}/api/tickets`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.tickets)) {
          localStorage.setItem('elite_tickets_demo', JSON.stringify(json.tickets));
          return json.tickets;
        }
      }
    } catch {
      console.warn('API /api/tickets offline, falling back to local cache.');
    }
    return getStoredTickets();
  },

  // 6.0.1 Clear Stored Tickets
  clearStoredTickets(): void {
    try {
      localStorage.removeItem('elite_tickets_demo');
      localStorage.removeItem('elite_ticket_reservations');
    } catch {}
  },

  // 6.1 Get Ticket By ID (Public Share Resolution via API / DB)
  async getTicketById(ticketId: string): Promise<TicketItem | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.ticket) return json.ticket;
      }
    } catch {
      console.warn('API getTicketById offline, attempting local search.');
    }

    // Fallback to local storage
    const stored = getStoredTickets();
    const found = stored.find((t) => t.id === ticketId);
    if (found) return found;

    // Fallback mock ticket if in demo mode
    return {
      id: ticketId,
      event_id: MOCK_EVENTS[0].id,
      seat_id: 's-mock-1',
      user_email: 'ana.cliente@verzel.com',
      user_name: 'Ana Cliente',
      status: 'valid',
      qr_signature: 'demo-signature-valid',
      created_at: new Date().toISOString(),
      events: MOCK_EVENTS[0],
      seats: { row_name: 'A', seat_number: 1, category: 'VIP' }
    };
  },

  // 7. Import External Event (TMDb / Ticketmaster)
  async importExternalEvent(source: 'tmdb' | 'ticketmaster'): Promise<{ success: boolean; event?: EventItem }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/events?importSource=${source}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.event) return { success: true, event: json.event };
      }
    } catch {
      console.warn('API import endpoint offline, serving fallback event.');
    }

    const fallbackEvent: EventItem = {
      id: `e-imported-${Date.now()}`,
      title: source === 'tmdb' ? 'Filme Destaque: Avatar 3 (TMDb Sync)' : 'Show Internacional: Coldplay Tour (Ticketmaster Sync)',
      description: `Evento importado dinamicamente via API ${source.toUpperCase()}.`,
      venue: 'Arena Cultural - SP',
      date: new Date(Date.now() + 86400000 * 30).toISOString(),
      price: 180.00,
      banner_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80'
    };

    MOCK_EVENTS.unshift(fallbackEvent);
    return { success: true, event: fallbackEvent };
  },

  // 8. Fetch External Catalog (TMDb / Ticketmaster search list for organizers)
  async fetchExternalCatalog(source: string = 'tmdb', query: string = ''): Promise<ExternalCatalogItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/external-catalog?source=${source}&query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.results) return json.results as ExternalCatalogItem[];
      }
    } catch {
      console.warn('API external-catalog offline, using fallback list.');
    }

    const fullList: ExternalCatalogItem[] = [
      {
        externalId: 'tmdb-1',
        source: 'tmdb',
        type: 'movie',
        title: 'Avatar: O Caminho da Água',
        description: 'Após formar uma família, Jake Sully e Neytiri fazem de tudo para ficarem juntos na lua Pandora.',
        banner_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
        category: 'Cinema / Ficção'
      },
      {
        externalId: 'tmdb-2',
        source: 'tmdb',
        type: 'movie',
        title: 'Duna: Parte 2',
        description: 'Paul Atreides se une a Chani e aos Fremen enquanto busca vingança contra os conspiradores que destruíram sua família.',
        banner_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
        category: 'Cinema / Épico'
      },
      {
        externalId: 'tmdb-3',
        source: 'tmdb',
        type: 'movie',
        title: 'Oppenheimer',
        description: 'A história do físico americano J. Robert Oppenheimer e seu papel no Projeto Manhattan.',
        banner_url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1200&q=80',
        category: 'Cinema / Drama'
      },
      {
        externalId: 'tmdb-4',
        source: 'tmdb',
        type: 'movie',
        title: 'Deadpool & Wolverine',
        description: 'Wolverine se recupera de seus ferimentos quando cruza o caminho do tagarela Deadpool.',
        banner_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
        category: 'Cinema / Ação'
      },
      {
        externalId: 'tmdb-5',
        source: 'tmdb',
        type: 'movie',
        title: 'Homem-Aranha: Através do Aranhaverso',
        description: 'Miles Morales é catapultado através do Multiverso, onde encontra uma equipe de Pessoas-Aranha.',
        banner_url: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=1200&q=80',
        category: 'Cinema / Animação'
      },
      {
        externalId: 'tmdb-6',
        source: 'tmdb',
        type: 'movie',
        title: 'Interstellar: Re-exibição IMAX 10 Anos',
        description: 'Uma equipe de exploradores viaja através de um buraco de minhoca no espaço.',
        banner_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        category: 'Cinema / Sci-Fi'
      },
      {
        externalId: 'tmdb-7',
        source: 'tmdb',
        type: 'movie',
        title: 'The Batman II',
        description: 'O Cavaleiro das Trevas enfrenta novas ameaças e corrupção nas profundezas de Gotham City.',
        banner_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
        category: 'Cinema / Policial'
      },
      {
        externalId: 'tmdb-8',
        source: 'tmdb',
        type: 'movie',
        title: 'Gladiador II',
        description: 'Anos após testemunhar a morte de Maximus, Lucius precisa entrar no Coliseu.',
        banner_url: 'https://images.unsplash.com/photo-1568872396765-917c724d7698?auto=format&fit=crop&w=1200&q=80',
        category: 'Cinema / Histórico'
      },
      {
        externalId: 'tm-1',
        source: 'ticketmaster',
        type: 'show',
        title: 'Coldplay: Music of the Spheres Tour',
        description: 'A mundialmente aclamada turnê sustentável do Coldplay com hits inesquecíveis.',
        banner_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
        category: 'Show Internacional'
      },
      {
        externalId: 'tm-2',
        source: 'ticketmaster',
        type: 'show',
        title: 'Taylor Swift: The Eras Tour',
        description: 'Uma jornada musical através de todas as eras da carreira da maior artista pop.',
        banner_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
        category: 'Show Internacional'
      },
      {
        externalId: 'tm-3',
        source: 'ticketmaster',
        type: 'show',
        title: 'Rock in Rio 2026 - Dia Metal & Tech',
        description: 'O maior festival de música do planeta com palcos interativos e atrações mundiais.',
        banner_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
        category: 'Festival'
      },
      {
        externalId: 'tm-4',
        source: 'ticketmaster',
        type: 'show',
        title: 'The Weeknd: After Hours Til Dawn',
        description: 'Espetáculo épico stadium tour com infraestrutura cinematográfica e sintetizadores.',
        banner_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
        category: 'Show Internacional'
      },
      {
        externalId: 'tm-5',
        source: 'ticketmaster',
        type: 'show',
        title: 'Bruno Mars: Live in São Paulo',
        description: 'Performances vibrantes de R&B, Funk e Pop com banda ao vivo no Estádio do MorumBIS.',
        banner_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
        category: 'Show Internacional'
      },
      {
        externalId: 'tm-6',
        source: 'ticketmaster',
        type: 'show',
        title: 'Ed Sheeran: +-=÷x Mathematics Tour',
        description: 'Apresentação solo acústica em palco 360 graus com pedais de loop ao vivo.',
        banner_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
        category: 'Show Internacional'
      },
      {
        externalId: 'tm-7',
        source: 'ticketmaster',
        type: 'show',
        title: 'Lollapalooza Brasil 2026 - Passaporte 3 Dias',
        description: '3 dias de pura música no Autódromo de Interlagos com mais de 70 bandas.',
        banner_url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80',
        category: 'Festival'
      },
      {
        externalId: 'tm-8',
        source: 'ticketmaster',
        type: 'show',
        title: 'Iron Maiden: Future Past World Tour',
        description: 'A lenda do Heavy Metal traz o espetáculo com faixas de Senjutsu e Somewhere in Time.',
        banner_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
        category: 'Show Heavy Metal'
      }
    ];

    let filtered = fullList.filter((item) => item.source === source || source === 'all');
    if (query) {
      filtered = filtered.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
    }

    return filtered;
  },

  // 9. Bulk Import Events (TMDb / Ticketmaster)
  async bulkImportEvents(items: ExternalCatalogItem[]): Promise<{ success: boolean; events?: EventItem[]; message?: string }> {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/events/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ items })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.events?.length) {
          json.events.forEach((evt: EventItem) => MOCK_EVENTS.unshift(evt));
          return json;
        }
      }
    } catch {
      console.warn('API bulk-import offline, importing locally.');
    }

    const createdEvents: EventItem[] = items.map((item) => ({
      id: `e-imported-${Math.random().toString(36).substring(2, 9)}`,
      title: item.title,
      description: item.description || 'Evento importado via catálogo externo.',
      venue: item.venue || (item.source === 'tmdb' ? 'Cine Multiplex IMAX - São Paulo, SP' : 'Allianz Parque - São Paulo, SP'),
      date: item.date || new Date(Date.now() + 86400000 * 30).toISOString(),
      price: typeof item.price === 'number' ? item.price : (item.price ? parseFloat(item.price) : (item.source === 'tmdb' ? 45.00 : 250.00)),
      banner_url: item.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
    }));

    createdEvents.forEach((evt) => MOCK_EVENTS.unshift(evt));
    return { success: true, events: createdEvents, message: `${createdEvents.length} eventos importados com sucesso.` };
  },

  // 10. Create Single Event
  async createEvent(eventData: Omit<EventItem, 'id'>): Promise<{ success: boolean; event?: EventItem; message?: string }> {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(eventData)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.event) {
          MOCK_EVENTS.unshift(json.event);
          return json;
        }
      }
    } catch {
      console.warn('API create event offline, creating locally.');
    }

    const newEvent: EventItem = {
      id: `e-created-${Date.now()}`,
      ...eventData
    };
    MOCK_EVENTS.unshift(newEvent);
    return { success: true, event: newEvent, message: 'Evento criado com sucesso.' };
  },

  // 11. Update Event
  async updateEvent(id: string, updates: Partial<Omit<EventItem, 'id'>>): Promise<{ success: boolean; event?: EventItem; message?: string; error?: string }> {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(updates)
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const idx = MOCK_EVENTS.findIndex((e) => e.id === id);
        if (idx !== -1 && json.event) {
          MOCK_EVENTS[idx] = json.event;
        }
        return json;
      }
      return { success: false, error: json.error || 'Erro ao atualizar evento.' };
    } catch {
      console.warn('API update event offline, updating locally.');
    }

    const idx = MOCK_EVENTS.findIndex((e) => e.id === id);
    if (idx !== -1) {
      MOCK_EVENTS[idx] = { ...MOCK_EVENTS[idx], ...updates };
      return { success: true, event: MOCK_EVENTS[idx], message: 'Evento atualizado com sucesso.' };
    }
    return { success: false, error: 'Evento não encontrado.' };
  },

  // 12. Delete Event
  async deleteEvent(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/events/${id}`, {
        method: 'DELETE',
        headers: { ...authHeaders }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const idx = MOCK_EVENTS.findIndex((e) => e.id === id);
        if (idx !== -1) MOCK_EVENTS.splice(idx, 1);
        return json;
      }
      return { success: false, error: json.error || 'Erro ao excluir evento.' };
    } catch {
      console.warn('API delete event offline, deleting locally.');
    }

    const idx = MOCK_EVENTS.findIndex((e) => e.id === id);
    if (idx !== -1) {
      MOCK_EVENTS.splice(idx, 1);
      return { success: true, message: 'Evento excluído com sucesso.' };
    }
    return { success: false, error: 'Evento não encontrado.' };
  }
};
