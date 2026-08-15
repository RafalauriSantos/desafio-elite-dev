import { Hono } from 'hono';
import { Bindings } from '../types';
import { DEMO_EVENTS, generateDemoSeats } from '../data/demoEvents';
import { getSupabaseClient, isSupabaseConfigured, getHmacSecret } from '../middleware/auth';
import { signTicketPayload, TicketPayload } from '../crypto';
import { sendTicketEmail } from '../email';

const ticketsRouter = new Hono<{ Bindings: Bindings }>();

// POST /api/tickets/reserve (Reserva individual ou múltipla)
const reserveHandler = async (c: any) => {
  try {
    const body = await c.req.json();
    const seatIds: string[] = body.seatIds || body.seat_ids || (body.seatId || body.seat_id ? [body.seatId || body.seat_id] : []);
    const userEmail = body.userEmail || body.user_email || body.clientId;

    if (!seatIds.length || !userEmail) {
      return c.json({ success: false, error: 'seatId/seatIds e userEmail são obrigatórios.' }, 400);
    }

    if (isSupabaseConfigured(c)) {
      const supabase = getSupabaseClient(c);
      if (seatIds.length === 1) {
        const { data, error } = await supabase.rpc('reserve_ticket_atomic', {
          p_seat_id: seatIds[0],
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
      } else {
        const { data, error } = await supabase.rpc('reserve_tickets_batch_atomic', {
          p_seat_ids: seatIds,
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
            reservedCount: data.reserved_count,
            lockedUntil: data.locked_until
          });
        }
      }
    }

    // Demo Mode Reserve Fallback
    const lockUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    return c.json({
      success: true,
      message: 'Assento reservado com sucesso (Trava Otimista 10 min).',
      seatId: seatIds[0],
      seatIds,
      lockedUntil: lockUntil
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
};

ticketsRouter.post('/tickets/reserve', reserveHandler);
ticketsRouter.post('/reserve', reserveHandler); // Alias

// POST /api/tickets/reserve-batch (Reserva em Lote)
const reserveBatchHandler = async (c: any) => {
  try {
    const body = await c.req.json();
    const seatIds: string[] = body.seatIds || body.seat_ids || [];
    const userEmail = body.userEmail || body.user_email;

    if (!seatIds.length || !userEmail) {
      return c.json({ success: false, error: 'seatIds (array) e userEmail são obrigatórios.' }, 400);
    }

    if (isSupabaseConfigured(c)) {
      const supabase = getSupabaseClient(c);
      const { data, error } = await supabase.rpc('reserve_tickets_batch_atomic', {
        p_seat_ids: seatIds,
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
          seatIds,
          lockedUntil: data.locked_until
        });
      }
    }

    // Demo Mode Batch Reserve Fallback
    const lockUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    return c.json({
      success: true,
      message: `${seatIds.length} assentos reservados com sucesso (Lote Demo).`,
      seatIds,
      lockedUntil: lockUntil
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
};

ticketsRouter.post('/tickets/reserve-batch', reserveBatchHandler);
ticketsRouter.post('/reserve-batch', reserveBatchHandler);

// POST /api/checkout (Processamento de compra simulada, emissão de tickets e HMAC)
ticketsRouter.post('/checkout', async (c) => {
  try {
    const body = await c.req.json();
    const { seatId, eventId, userEmail, userName } = body;
    const seatIds: string[] = Array.isArray(body.seatIds)
      ? Array.from(new Set(body.seatIds.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)))
      : seatId
      ? [seatId]
      : [];
    const paymentOutcome = body.paymentOutcome || body.payment_status || 'approved';

    if (!seatIds.length || !eventId || !userEmail || !userName) {
      return c.json({ success: false, error: 'Campos obrigatórios ausentes.' }, 400);
    }

    if (paymentOutcome !== 'approved' && paymentOutcome !== 'declined') {
      return c.json({ success: false, error: 'paymentOutcome deve ser approved ou declined.' }, 400);
    }

    if (paymentOutcome === 'declined') {
      if (isSupabaseConfigured(c)) {
        const supabase = getSupabaseClient(c);
        const { error } = await supabase.rpc('release_tickets_batch_atomic', {
          p_seat_ids: seatIds,
          p_user_email: userEmail
        });

        if (error) {
          return c.json({ success: false, paymentStatus: 'declined', error: 'Não foi possível liberar a reserva após a recusa.' }, 500);
        }
      }

      return c.json({
        success: false,
        paymentStatus: 'declined',
        tickets: [],
        error: 'Pagamento recusado na simulação. Nenhum ingresso foi emitido.'
      }, 402);
    }

    const hmacSecret = getHmacSecret(c);
    const issuedAt = Date.now();
    const ticketRows: any[] = [];
    const qrCodes: string[] = [];

    for (const currentSeatId of seatIds) {
      const ticketId = crypto.randomUUID();
      const payload: TicketPayload = {
        ticketId,
        eventId,
        seatId: currentSeatId,
        clientId: userEmail,
        issuedAt
      };
      const signature = await signTicketPayload(payload, hmacSecret);

      ticketRows.push({
        id: ticketId,
        event_id: eventId,
        seat_id: currentSeatId,
        user_email: userEmail,
        user_name: userName,
        clientId: userEmail,
        issuedAt,
        status: 'valid',
        qr_signature: signature,
        created_at: new Date().toISOString()
      });
      qrCodes.push(JSON.stringify({ ...payload, signature }));
    }

    const isUuid = (str?: string) => !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const areAllUuids = seatIds.every((id: string) => isUuid(id)) && isUuid(eventId);

    let eventData: any = DEMO_EVENTS.find((e) => e.id === eventId) || DEMO_EVENTS[0];
    const seatsMap: Record<string, any> = {};

    if (isSupabaseConfigured(c) && areAllUuids) {
      const supabase = getSupabaseClient(c);
      const { data: rpcResult, error } = await supabase.rpc('complete_checkout_batch_atomic', {
        p_seat_ids: seatIds,
        p_event_id: eventId,
        p_user_email: userEmail,
        p_ticket_rows: ticketRows
      });

      if (error || (rpcResult && !rpcResult.success)) {
        return c.json({ success: false, error: rpcResult?.message || error?.message || 'A reserva expirou ou não pertence a este comprador.' }, 409);
      }

      const { data: dbEvent } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle();
      if (dbEvent) eventData = dbEvent;

      const { data: dbSeats } = await supabase.from('seats').select('*').in('id', seatIds);
      if (dbSeats) {
        dbSeats.forEach((s: any) => { seatsMap[s.id] = s; });
      }
    }

    const hydratedTickets = ticketRows.map((row) => {
      const seatObj = seatsMap[row.seat_id] || { row_name: 'A', seat_number: 1, category: 'VIP' };
      return {
        ...row,
        events: eventData,
        seats: seatObj
      };
    });

    const ticket = hydratedTickets[0];

    const response = c.json({
      success: true,
      ticket,
      tickets: hydratedTickets,
      qrCodeData: qrCodes[0],
      qrCodes,
      signatures: ticketRows.map((row) => row.qr_signature),
      paymentStatus: 'approved'
    });

    let executionCtx: any;
    try { executionCtx = c.executionCtx; } catch { executionCtx = undefined; }
    const waitUntil = executionCtx?.waitUntil;
    if (typeof waitUntil === 'function') {
      hydratedTickets.forEach((row, index) => {
        const seatLabel = row.seats ? `${row.seats.row_name}${row.seats.seat_number} (${row.seats.category || 'Padrão'})` : row.seat_id;
        waitUntil.call(executionCtx,
          sendTicketEmail(c.env || {}, {
            to: row.user_email,
            userName: row.user_name,
            eventId: row.event_id,
            ticketId: row.id,
            seatId: row.seat_id,
            qrCodeData: qrCodes[index],
            eventTitle: eventData?.title,
            eventVenue: eventData?.venue,
            eventDate: eventData?.date,
            seatName: seatLabel
          }).catch((error) => console.warn('Ticket email delivery failed:', error.message))
        );
      });
    }

    return response;
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// GET /api/tickets/:id (Consulta pública para ingressos compartilhados)
ticketsRouter.get('/tickets/:id', async (c) => {
  try {
    const ticketId = c.req.param('id');
    if (!ticketId) {
      return c.json({ success: false, error: 'ID do ingresso é obrigatório.' }, 400);
    }

    if (isSupabaseConfigured(c)) {
      const supabase = getSupabaseClient(c);
      const { data: rpcTicket, error: rpcErr } = await supabase.rpc('get_public_ticket_by_id', {
        p_ticket_id: ticketId
      });

      if (!rpcErr && rpcTicket) {
        return c.json({ success: true, ticket: rpcTicket });
      }

      // Fallback direct table query if RPC is pending
      const { data: ticket, error } = await supabase
        .from('tickets')
        .select('*, events(*), seats(*)')
        .eq('id', ticketId)
        .maybeSingle();

      if (error || !ticket) {
        return c.json({ success: false, error: 'Ingresso não encontrado no sistema.' }, 404);
      }
      return c.json({ success: true, ticket });
    }

    // Demo Mode Ticket
    const demoEvent = DEMO_EVENTS[0];
    const demoSeat = generateDemoSeats(demoEvent.id)[0];
    const demoTicket = {
      id: ticketId,
      event_id: demoEvent.id,
      seat_id: demoSeat.id,
      user_email: 'ana.cliente@verzel.com',
      user_name: 'Ana Cliente',
      status: 'valid',
      qr_signature: 'demo-signature-valid',
      created_at: new Date().toISOString(),
      events: demoEvent,
      seats: demoSeat,
    };

    return c.json({ success: true, ticket: demoTicket });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default ticketsRouter;
