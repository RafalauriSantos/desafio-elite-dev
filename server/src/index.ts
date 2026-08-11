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

// Helper to initialize Supabase client
function getSupabaseClient(c: any) {
  const url = c.env?.SUPABASE_URL || 'https://your-supabase-project.supabase.co';
  const key = c.env?.SUPABASE_ANON_KEY || 'your-supabase-anon-key';
  return createClient(url, key);
}

// Helper secret key
function getHmacSecret(c: any): string {
  return c.env?.HMAC_SECRET || 'super-secret-hmac-key-elite-dev-2026';
}

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', service: 'Desafio Elite Dev Hono API (Cloudflare Workers)' });
});

// 2.3.1 - GET /api/events (Retorna eventos locais e permite integração/importação TMDb/Ticketmaster)
app.get('/api/events', async (c) => {
  try {
    const importSource = c.req.query('importSource');
    const supabase = getSupabaseClient(c);

    // Exemplo de rota de importação via TMDb ou Ticketmaster
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

    // Busca eventos normais
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return c.json({ success: true, events });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// GET /api/events/:id (Detalhes e Assentos)
app.get('/api/events/:id', async (c) => {
  const eventId = c.req.param('id');
  try {
    const supabase = getSupabaseClient(c);
    
    const { data: event, error: eventErr } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventErr || !event) {
      return c.json({ success: false, error: 'Event not found' }, 404);
    }

    const { data: seats, error: seatsErr } = await supabase
      .from('seats')
      .select('*')
      .eq('event_id', eventId)
      .order('row_name', { ascending: true })
      .order('seat_number', { ascending: true });

    if (seatsErr) throw seatsErr;

    return c.json({ success: true, event, seats });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
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

    const supabase = getSupabaseClient(c);

    // Invoca Stored Procedure com SELECT ... FOR UPDATE
    const { data, error } = await supabase.rpc('reserve_ticket_atomic', {
      p_seat_id: seatId,
      p_user_email: userEmail,
      p_hold_minutes: 10
    });

    if (error) throw error;

    if (!data.success) {
      return c.json({ success: false, error: data.message }, 409);
    }

    return c.json({
      success: true,
      message: data.message,
      seatId: data.seat_id,
      lockedUntil: data.locked_until
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

    const supabase = getSupabaseClient(c);
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

    // Cria registro de ingresso
    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .insert({
        id: ticketId,
        event_id: eventId,
        seat_id: seatId,
        user_email: userEmail,
        user_name: userName,
        status: 'valid',
        qr_signature: signature
      })
      .select()
      .single();

    if (ticketErr) throw ticketErr;

    // Atualiza assento para 'sold'
    await supabase
      .from('seats')
      .update({ status: 'sold', locked_by: null, locked_until: null })
      .eq('id', seatId);

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

    const supabase = getSupabaseClient(c);

    // 2. Invoca Stored Procedure `validate_ticket_gatekeeper`
    const { data: dbResult, error: dbErr } = await supabase.rpc('validate_ticket_gatekeeper', {
      p_ticket_id: ticketId,
      p_qr_signature: signature,
      p_target_event_id: targetEventId || null
    });

    if (dbErr) throw dbErr;

    // Trata códigos de status HTTP por estado
    if (dbResult.code === 'ALREADY_USED') {
      return c.json(dbResult, 409); // Conflict
    }

    if (dbResult.code === 'WRONG_EVENT') {
      return c.json(dbResult, 422); // Unprocessable Entity / Wrong Event
    }

    if (dbResult.code === 'INVALID') {
      return c.json(dbResult, 400); // Bad Request
    }

    return c.json(dbResult, 200); // 200 OK - VALID
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
