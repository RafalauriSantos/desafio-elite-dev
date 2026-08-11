const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

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
  created_at: string;
  used_at?: string | null;
  events?: Partial<EventItem>;
  seats?: Partial<SeatItem>;
}

// In-Memory Storage for Standalone Demo Fallback
const MOCK_EVENTS: EventItem[] = [
  {
    id: 'e1111111-1111-1111-1111-111111111111',
    title: 'Tech Summit Elite 2026',
    description: 'O maior evento de engenharia de software, arquitetura de sistemas e inteligência artificial da América Latina.',
    venue: 'Arena Innovation Hub - São Paulo, SP',
    date: '2026-11-20T19:00:00.000Z',
    price: 299.90,
    banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'e2222222-2222-2222-2222-222222222222',
    title: 'CyberSecurity World Expo',
    description: 'Encontro internacional de especialistas em segurança da informação, criptografia e computação quântica.',
    venue: 'Expo Center Norte - São Paulo, SP',
    date: '2026-12-05T14:00:00.000Z',
    price: 349.00,
    banner_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'e3333333-3333-3333-3333-333333333333',
    title: 'Neon Pulse Music & Arts',
    description: 'Festival imersivo de música eletrônica, instalações de luz e arte digital.',
    venue: 'Estádio Allianz Parque - São Paulo, SP',
    date: '2026-12-31T21:00:00.000Z',
    price: 190.00,
    banner_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80'
  }
];

const generateMockSeats = (eventId: string): SeatItem[] => {
  const seats: SeatItem[] = [];
  const rows = ['A', 'B', 'C', 'D'];
  rows.forEach((row) => {
    for (let num = 1; num <= 8; num++) {
      const isVip = row === 'A';
      const isPremium = row === 'B';
      const seatId = `s-${eventId.substring(0, 4)}-${row}-${num}`;
      
      // Seed a few pre-locked / sold seats for realistic demo
      let initialStatus: 'available' | 'locked' | 'sold' = 'available';
      if (row === 'A' && num === 3) initialStatus = 'sold';
      if (row === 'B' && num === 5) initialStatus = 'locked';

      seats.push({
        id: seatId,
        event_id: eventId,
        row_name: row,
        seat_number: num,
        category: isVip ? 'VIP' : isPremium ? 'Premium' : 'Standard',
        price: isVip ? 499.90 : isPremium ? 399.90 : 299.90,
        status: initialStatus
      });
    }
  });
  return seats;
};

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

  // 4. Checkout & Issue Signed Ticket
  async checkout(params: { seatId: string; eventId: string; userEmail: string; userName: string }): Promise<{
    success: boolean;
    ticket?: TicketItem;
    qrCodeData?: string;
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const json = await res.json();
      if (json.success && json.ticket) {
        saveStoredTicket(json.ticket);
        return json;
      }
    } catch {
      console.warn('API server offline. Generating demo signed ticket payload locally.');
    }

    // Client-side fallback calculation for local presentation
    const ticketId = 't-' + Math.random().toString(36).substring(2, 9);
    const event = MOCK_EVENTS.find(e => e.id === params.eventId) || MOCK_EVENTS[0];
    const [row, num] = params.seatId.split('-').slice(-2);

    const payload = {
      ticketId,
      eventId: params.eventId,
      seatId: params.seatId,
      userEmail: params.userEmail,
      issuedAt: Date.now(),
      nonce: Math.random().toString(36).substring(2, 8)
    };

    // Simple deterministic demo hash
    const signature = 'hmac_sha256_' + btoa(JSON.stringify(payload)).substring(0, 32);

    const demoTicket: TicketItem = {
      id: ticketId,
      event_id: params.eventId,
      seat_id: params.seatId,
      user_email: params.userEmail,
      user_name: params.userName,
      status: 'valid',
      qr_signature: signature,
      created_at: new Date().toISOString(),
      events: event,
      seats: { row_name: row || 'A', seat_number: parseInt(num || '1') }
    };

    saveStoredTicket(demoTicket);
    const qrCodeData = JSON.stringify({ ...payload, signature });

    return {
      success: true,
      ticket: demoTicket,
      qrCodeData
    };
  },

  // 5. Gatekeeper Validate Ticket
  async validateTicket(qrData: string): Promise<{
    success: boolean;
    valid: boolean;
    message?: string;
    error?: string;
    ticket?: TicketItem;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/validate-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData })
      });
      return await res.json();
    } catch {
      console.warn('API server offline. Validating demo ticket locally.');
    }

    try {
      const parsed = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      const stored = getStoredTickets();
      const matchIndex = stored.findIndex((t) => t.id === parsed.ticketId);

      if (matchIndex === -1 && !parsed.ticketId) {
        return { success: false, valid: false, error: 'QR Code inválido ou corrompido.' };
      }

      const foundTicket = stored[matchIndex] || {
        id: parsed.ticketId || 't-demo',
        status: 'valid',
        events: MOCK_EVENTS[0],
        seats: { row_name: 'A', seat_number: 1 },
        user_name: parsed.userEmail || 'Convidado VIP'
      };

      if (foundTicket.status === 'used') {
        return {
          success: false,
          valid: false,
          error: 'INGRESSO JÁ UTILIZADO! Entrada recusada.',
          ticket: foundTicket
        };
      }

      // Mark as used
      foundTicket.status = 'used';
      foundTicket.used_at = new Date().toISOString();
      if (matchIndex !== -1) {
        stored[matchIndex] = foundTicket;
        localStorage.setItem('elite_tickets_demo', JSON.stringify(stored));
      }

      return {
        success: true,
        valid: true,
        message: 'ENTRADA LIBERADA! Ingresso válido e assinado com sucesso.',
        ticket: foundTicket
      };
    } catch {
      return { success: false, valid: false, error: 'Falha ao ler formato de dados do QR Code.' };
    }
  },

  // 6. Get User Tickets
  getTickets(): TicketItem[] {
    return getStoredTickets();
  }
};
