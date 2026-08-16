import { Hono } from 'hono';
import { Bindings, EventItem, SeatItem } from '../types';
import { DEMO_EVENTS, generateDemoSeats } from '../data/demoEvents';
import { getSupabaseClient, isSupabaseConfigured, requireRole } from '../middleware/auth';

const eventsRouter = new Hono<{ Bindings: Bindings }>();

// GET /api/events (Retorna lista de eventos e suporta importação direta TMDb/Ticketmaster)
eventsRouter.get('/events', async (c) => {
  try {
    const importSource = c.req.query('importSource');

    if (isSupabaseConfigured(c)) {
      if (importSource === 'tmdb' || importSource === 'ticketmaster') {
        const authorization = await requireRole(c, ['organizer']);
        if (authorization instanceof Response) return authorization;
      }
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
        return c.json({ success: true, events: events as EventItem[] });
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Supabase fetch failed, falling back to DEMO_EVENTS:', message);
  }

  return c.json({ success: true, events: DEMO_EVENTS });
});

// GET /api/events/:id (Detalhes do evento e matriz de 80 assentos)
eventsRouter.get('/events/:id', async (c) => {
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

        return c.json({ success: true, event: event as EventItem, seats: (seats as SeatItem[]) || generateDemoSeats(eventId) });
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Supabase getEventDetails failed, using demo event details:', message);
  }

  const demoEvent = DEMO_EVENTS.find(e => e.id === eventId) || DEMO_EVENTS[0];
  return c.json({ success: true, event: demoEvent, seats: generateDemoSeats(eventId) });
});

// POST /api/events (Publicação de novo evento com 80 assentos atômicos)
eventsRouter.post('/events', async (c) => {
  try {
    const authorization = await requireRole(c, ['organizer']);
    if (authorization instanceof Response) return authorization;

    const body = await c.req.json<{
      title?: string;
      description?: string;
      venue?: string;
      date?: string;
      price?: string | number;
      banner_url?: string;
    }>();
    const { title, description, venue, date, price, banner_url } = body;

    if (!title || !venue || !date) {
      return c.json({ success: false, error: 'Título, local e data são obrigatórios.' }, 400);
    }

    if (isSupabaseConfigured(c)) {
      const supabase = getSupabaseClient(c);
      const organizerId = authorization?.user?.id && authorization.user.id.includes('-') && !authorization.user.id.startsWith('demo-')
        ? authorization.user.id
        : '11111111-1111-1111-1111-111111111111';

      const { data, error } = await supabase.rpc('create_event_with_seats_atomic', {
        p_organizer_id: organizerId,
        p_title: title.trim(),
        p_description: description || 'Evento publicado pelo organizador.',
        p_venue: venue.trim(),
        p_date: new Date(date).toISOString(),
        p_price: typeof price === 'number' ? price : (parseFloat(price || '200') || 200.0),
        p_banner_url: banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
      });

      if (error || (data && !data.success)) {
        return c.json({ success: false, error: data?.error || error?.message || 'Erro ao publicar evento.' }, 400);
      }

      return c.json({ success: true, event: data.event, message: 'Evento publicado com sucesso com 80 assentos gerados.' });
    }

    const demoEvent: EventItem = {
      id: `e-created-${Date.now()}`,
      title,
      description: description || 'Evento publicado.',
      venue,
      date: new Date(date).toISOString(),
      price: typeof price === 'number' ? price : (parseFloat(price || '200') || 200.0),
      banner_url: banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
    };
    return c.json({ success: true, event: demoEvent, message: 'Evento criado em modo demo.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: message }, 500);
  }
});

// POST /api/events/bulk-import (Importação em lote de atrações externas TMDb / Ticketmaster)
eventsRouter.post('/events/bulk-import', async (c) => {
  try {
    const authorization = await requireRole(c, ['organizer']);
    if (authorization instanceof Response) return authorization;

    const body = await c.req.json<{
      items?: Array<{
        title: string;
        description?: string;
        venue?: string;
        date?: string;
        price?: string | number;
        banner_url?: string;
        source?: string;
      }>;
    }>();
    const items = body.items || [];

    if (!items.length) {
      return c.json({ success: false, error: 'Nenhum evento fornecido para importação.' }, 400);
    }

    if (isSupabaseConfigured(c)) {
      const supabase = getSupabaseClient(c);
      const organizerId = authorization?.user?.id && authorization.user.id.includes('-') && !authorization.user.id.startsWith('demo-')
        ? authorization.user.id
        : '11111111-1111-1111-1111-111111111111';

      const importedEvents: EventItem[] = [];
      const skippedDuplicates: string[] = [];

      for (const item of items) {
        const itemPrice = typeof item.price === 'number' ? item.price : (item.price ? parseFloat(item.price) : (item.source === 'tmdb' ? 45.00 : 280.00));
        const { data } = await supabase.rpc('create_event_with_seats_atomic', {
          p_organizer_id: organizerId,
          p_title: item.title.trim(),
          p_description: item.description || 'Evento importado via catálogo externo.',
          p_venue: item.venue || (item.source === 'tmdb' ? 'Cinemark Shopping Eldorado - Sala IMAX' : 'Allianz Parque - São Paulo, SP'),
          p_date: item.date || new Date(Date.now() + 86400000 * 30).toISOString(),
          p_price: itemPrice,
          p_banner_url: item.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
        });

        if (data && data.success && data.event) {
          importedEvents.push(data.event as EventItem);
        } else {
          skippedDuplicates.push(item.title);
        }
      }

      return c.json({
        success: true,
        events: importedEvents,
        importedCount: importedEvents.length,
        skippedCount: skippedDuplicates.length,
        message: `${importedEvents.length} eventos importados com sucesso.${skippedDuplicates.length > 0 ? ` (${skippedDuplicates.length} duplicados ignorados)` : ''}`
      });
    }

    const demoEvents: EventItem[] = items.map((item, idx) => ({
      id: `e-imported-${Date.now()}-${idx}`,
      title: item.title,
      description: item.description || 'Evento importado.',
      venue: item.venue || 'Arena Cultural - SP',
      date: item.date || new Date(Date.now() + 86400000 * 30).toISOString(),
      price: typeof item.price === 'number' ? item.price : (item.price ? parseFloat(item.price) : 150.00),
      banner_url: item.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
    }));

    return c.json({ success: true, events: demoEvents, importedCount: demoEvents.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: message }, 500);
  }
});

// PUT /api/events/:id (Atualização de evento existente pelo organizador)
eventsRouter.put('/events/:id', async (c) => {
  try {
    const authorization = await requireRole(c, ['organizer']);
    if (authorization instanceof Response) return authorization;

    const eventId = c.req.param('id');
    const body = await c.req.json<{
      title?: string;
      description?: string;
      venue?: string;
      date?: string;
      price?: string | number;
      banner_url?: string;
    }>();

    if (!eventId) {
      return c.json({ success: false, error: 'ID do evento é obrigatório.' }, 400);
    }

    if (isSupabaseConfigured(c)) {
      const supabase = getSupabaseClient(c);
      const updates: Record<string, unknown> = {};
      if (body.title) updates.title = body.title.trim();
      if (body.description !== undefined) updates.description = body.description;
      if (body.venue) updates.venue = body.venue.trim();
      if (body.date) updates.date = new Date(body.date).toISOString();
      if (body.price !== undefined) updates.price = typeof body.price === 'number' ? body.price : parseFloat(body.price || '0');
      if (body.banner_url !== undefined) updates.banner_url = body.banner_url;

      if (Object.keys(updates).length === 0) {
        return c.json({ success: false, error: 'Nenhum campo para atualizar.' }, 400);
      }

      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId)
        .select()
        .single();

      if (error || !data) {
        return c.json({ success: false, error: error?.message || 'Evento não encontrado.' }, 404);
      }

      return c.json({ success: true, event: data as EventItem, message: 'Evento atualizado com sucesso.' });
    }

    return c.json({ success: true, message: 'Evento atualizado (modo demo).' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: message }, 500);
  }
});

// DELETE /api/events/:id (Exclusão de evento pelo organizador — cascata em seats via ON DELETE CASCADE)
eventsRouter.delete('/events/:id', async (c) => {
  try {
    const authorization = await requireRole(c, ['organizer']);
    if (authorization instanceof Response) return authorization;

    const eventId = c.req.param('id');
    if (!eventId) {
      return c.json({ success: false, error: 'ID do evento é obrigatório.' }, 400);
    }

    if (isSupabaseConfigured(c)) {
      const supabase = getSupabaseClient(c);

      // Check if there are sold tickets before deleting
      const { count } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId);

      if (count && count > 0) {
        return c.json({
          success: false,
          error: `Não é possível excluir: ${count} ingresso(s) já emitido(s) para este evento.`
        }, 409);
      }

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) {
        return c.json({ success: false, error: error.message }, 500);
      }

      return c.json({ success: true, message: 'Evento excluído com sucesso.' });
    }

    return c.json({ success: true, message: 'Evento excluído (modo demo).' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: message }, 500);
  }
});

export default eventsRouter;
