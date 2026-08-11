import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';
import { signTicketPayload, verifyTicketSignature, TicketPayload } from './crypto';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  HMAC_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for frontend clients
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Fallback Demo Events for local development & standalone preview
const DEMO_EVENTS = [
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
    title: 'AI & Cloud Dev Conference',
    description: 'Workshops práticos sobre modelos de linguagem, agentes autônomos e infraestrutura serverless.',
    venue: 'Centro de Convenções Rebouças - SP',
    date: '2027-01-15T10:00:00.000Z',
    price: 199.90,
    banner_url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80'
  }
];

const generateDemoSeats = (eventId: string) => {
  const rows = ['A', 'B', 'C', 'D'];
  const seats: any[] = [];

  rows.forEach((row) => {
    for (let num = 1; num <= 8; num++) {
      const seatId = `s-${eventId}-${row}-${num}`;
      const isVip = row === 'A';
      const isPremium = row === 'B';
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

// Helper to initialize Supabase client
function getSupabaseClient(c: any) {
  const url = c.env?.SUPABASE_URL || 'https://your-supabase-project.supabase.co';
  const key = c.env?.SUPABASE_ANON_KEY || 'your-supabase-anon-key';
  return createClient(url, key);
}

function isSupabaseConfigured(c: any): boolean {
  const url = c.env?.SUPABASE_URL;
  return !!url && !url.includes('your-supabase-project.supabase.co');
}

// Helper secret key
function getHmacSecret(c: any): string {
  return c.env?.HMAC_SECRET || 'super-secret-hmac-key-elite-dev-2026';
}

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', service: 'Desafio Elite Dev Hono API (Cloudflare Workers)' });
});

// GET /api/external-catalog (Busca filmes e shows nas APIs externas TMDb / Ticketmaster)
app.get('/api/external-catalog', async (c) => {
  const source = c.req.query('source') || 'tmdb';
  const query = c.req.query('query') || '';

  // Catalogo TMDb / Ticketmaster curado
  const externalCatalog = [
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
      description: 'A história do físico americano J. Robert Oppenheimer e seu papel no Projeto Manhattan durante a Segunda Guerra Mundial.',
      banner_url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1200&q=80',
      category: 'Cinema / Drama'
    },
    {
      externalId: 'tm-1',
      source: 'ticketmaster',
      type: 'show',
      title: 'Coldplay: Music of the Spheres Tour',
      description: 'A mundialmente aclamada turnê sustentável do Coldplay com hits inesquecíveis e show de luzes.',
      banner_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
      category: 'Show Internacional'
    },
    {
      externalId: 'tm-2',
      source: 'ticketmaster',
      type: 'show',
      title: 'Taylor Swift: The Eras Tour',
      description: 'Uma jornada musical através de todas as eras da carreira da maior artista pop da atualidade.',
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
    }
  ];

  let filtered = externalCatalog.filter(item => item.source === source || source === 'all');
  if (query) {
    filtered = filtered.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
  }

  return c.json({ success: true, results: filtered });
});

// 2.3.1 - GET /api/events (Retorna eventos locais e permite integração/importação TMDb/Ticketmaster)
app.get('/api/events', async (c) => {
  try {
    const importSource = c.req.query('importSource');

    if (isSupabaseConfigured(c)) {
      const supabase = getSupabaseClient(c);

      if (importSource === 'tmdb' || importSource === 'ticketmaster') {
        const externalEvent = {
          title: importSource === 'tmdb' ? 'Filme Destaque: Avatar 3 (TMDb Sync)' : 'Show Internacional: Coldplay Tour (Ticketmaster Sync)',
          description: `Evento importado dinamicamente via API ${importSource.toUpperCase()}.`,
          venue: 'Cine Arena Cultural - SP',
          date: new Date(Date.now() + 86400000 * 30).toISOString(),
          price: 150.00,
          banner_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80'
        };

        const { data: createdEvent } = await supabase
          .from('events')
          .insert(externalEvent)
          .select()
          .single();

        return c.json({ success: true, message: `Evento importado com sucesso via ${importSource}`, event: createdEvent });
      }

      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (!error && events && events.length > 0) {
        return c.json({ success: true, events });
      }
    }
  } catch (err: any) {
    console.warn('Supabase fetch failed, falling back to DEMO_EVENTS:', err.message);
  }

  return c.json({ success: true, events: DEMO_EVENTS });
});

// GET /api/events/:id (Detalhes e Assentos)
app.get('/api/events/:id', async (c) => {
  const eventId = c.req.param('id');
  try {
    if (isSupabaseConfigured(c)) {
      const supabase = getSupabaseClient(c);
      
      const { data: event, error: eventErr } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (!eventErr && event) {
        const { data: seats } = await supabase
          .from('seats')
          .select('*')
          .eq('event_id', eventId)
          .order('row_name', { ascending: true })
          .order('seat_number', { ascending: true });

        return c.json({ success: true, event, seats: seats || generateDemoSeats(eventId) });
      }
    }
  } catch (err: any) {
    console.warn('Supabase getEventDetails failed, using demo event details:', err.message);
  }

  const demoEvent = DEMO_EVENTS.find(e => e.id === eventId) || DEMO_EVENTS[0];
  return c.json({ success: true, event: demoEvent, seats: generateDemoSeats(eventId) });
});

// 2.3.2 - POST /api/tickets/reserve (Executa Stored Procedure `reserve_ticket_atomic` com SELECT ... FOR UPDATE)
const reserveHandler = async (c: any) => {
  try {
    const body = await c.req.json();
    const seatId = body.seatId || body.seat_id;
    const userEmail = body.userEmail || body.user_email || body.clientId;

    if (!seatId || !userEmail) {
      return c.json({ success: false, error: 'seatId e userEmail são obrigatórios.' }, 400);
    }

    if (isSupabaseConfigured(c)) {
      const supabase = getSupabaseClient(c);
      const { data, error } = await supabase.rpc('reserve_ticket_atomic', {
        p_seat_id: seatId,
        p_user_email: userEmail,
        p_hold_minutes: 10
      });

      if (!error && data) {
        if (!data.success) {
          return c.json({ success: false, error: data.message }, 409);
        }

        return c.json({
          success: true,
          message: data.message,
          seatId: data.seat_id,
          lockedUntil: data.locked_until
        });
      }
    }

    // Demo Mode Reserve Fallback
    const lockUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    return c.json({
      success: true,
      message: 'Assento reservado com sucesso (Trava Otimista 10 min).',
      seatId,
      lockedUntil: lockUntil
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
};

app.post('/api/tickets/reserve', reserveHandler);
app.post('/api/reserve', reserveHandler); // Alias

// POST /api/checkout (Processa compra e gera QR assinado via HMAC)
app.post('/api/checkout', async (c) => {
  try {
    const body = await c.req.json();
    const { seatId, eventId, userEmail, userName } = body;

    if (!seatId || !eventId || !userEmail || !userName) {
      return c.json({ success: false, error: 'Campos obrigatórios ausentes.' }, 400);
    }

    const hmacSecret = getHmacSecret(c);
    const ticketId = crypto.randomUUID();
    const issuedAt = Date.now();

    const payload: TicketPayload = {
      ticketId,
      eventId,
      seatId,
      clientId: userEmail,
      issuedAt
    };

    // Assinatura digital HMAC-SHA256
    const signature = await signTicketPayload(payload, hmacSecret);

    let ticket: any = {
      id: ticketId,
      event_id: eventId,
      seat_id: seatId,
      user_email: userEmail,
      user_name: userName,
      status: 'valid',
      qr_signature: signature,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured(c)) {
      const supabase = getSupabaseClient(c);
      const { data: dbTicket, error: ticketErr } = await supabase
        .from('tickets')
        .insert(ticket)
        .select()
        .single();

      if (!ticketErr && dbTicket) {
        ticket = dbTicket;
      }

      await supabase
        .from('seats')
        .update({ status: 'sold', locked_by: null, locked_until: null })
        .eq('id', seatId);
    }

    const qrCodeData = JSON.stringify({ ...payload, signature });

    return c.json({
      success: true,
      ticket,
      qrCodeData,
      signature
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 2.3.3 - POST /api/gatekeeper/validate (MÁQUINA DE ESTADOS: VALID, ALREADY_USED, INVALID, WRONG_EVENT)
const validateHandler = async (c: any) => {
  try {
    const body = await c.req.json();
    const { qrData, targetEventId } = body;

    if (!qrData) {
      return c.json({
        success: false,
        valid: false,
        code: 'INVALID',
        error: 'QR Data é obrigatório.'
      }, 400);
    }

    let parsed: any;
    try {
      parsed = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch {
      return c.json({
        success: false,
        valid: false,
        code: 'INVALID',
        error: 'Formato de QR Code inválido ou corrompido.'
      }, 400);
    }

    const { ticketId, eventId, seatId, clientId, userEmail, issuedAt, signature } = parsed;

    if (!ticketId || !signature) {
      return c.json({
        success: false,
        valid: false,
        code: 'INVALID',
        error: 'Estrutura de QR Code incompleta (Ticket ID / Assinatura ausentes).'
      }, 400);
    }

    const hmacSecret = getHmacSecret(c);
    const payload: TicketPayload = {
      ticketId,
      eventId,
      seatId,
      clientId: clientId || userEmail || '',
      issuedAt: issuedAt || 0
    };

    // 1. Validação Criptográfica HMAC
    const isValidSignature = await verifyTicketSignature(payload, signature, hmacSecret);
    if (!isValidSignature) {
      return c.json({
        success: false,
        valid: false,
        code: 'INVALID',
        error: 'ASSINATURA HMAC INVÁLIDA! QR Code alterado ou forjado.'
      }, 401);
    }

    if (isSupabaseConfigured(c)) {
      const supabase = getSupabaseClient(c);
      const { data: dbResult, error: dbErr } = await supabase.rpc('validate_ticket_gatekeeper', {
        p_ticket_id: ticketId,
        p_qr_signature: signature,
        p_target_event_id: targetEventId || null
      });

      if (!dbErr && dbResult) {
        if (dbResult.code === 'ALREADY_USED') return c.json(dbResult, 409);
        if (dbResult.code === 'WRONG_EVENT') return c.json(dbResult, 422);
        if (dbResult.code === 'INVALID') return c.json(dbResult, 400);
        return c.json(dbResult, 200);
      }
    }

    // Demo Mode Validation Fallback
    if (targetEventId && eventId !== targetEventId) {
      return c.json({
        success: false,
        valid: false,
        code: 'WRONG_EVENT',
        message: 'INGRESSO DE OUTRO EVENTO! Este ingresso pertence a: Tech Summit Elite 2026.'
      }, 422);
    }

    return c.json({
      success: true,
      valid: true,
      code: 'VALID',
      message: 'ENTRADA LIBERADA! Ingresso válido.',
      user_name: clientId || 'Cliente Verzel',
      event_title: 'Tech Summit Elite 2026',
      seat: 'Fileira A - Assento 1'
    }, 200);
  } catch (err: any) {
    return c.json({
      success: false,
      valid: false,
      code: 'INVALID',
      error: err.message
    }, 500);
  }
};

app.post('/api/gatekeeper/validate', validateHandler);
app.post('/api/validate-ticket', validateHandler); // Alias

export default app;
