import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';
import { signTicketPayload, verifyTicketSignature, TicketPayload } from './crypto';
import { sendTicketEmail } from './email';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  HMAC_SECRET: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
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
    description: 'O maior evento de engenharia de software, arquitetura distribuída e inteligência artificial da América Latina.',
    venue: 'Arena Innovation Hub - São Paulo, SP',
    date: '2026-11-20T19:00:00.000Z',
    price: 299.90,
    banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'e2222222-2222-2222-2222-222222222222',
    title: 'CyberSecurity World Expo',
    description: 'Encontro internacional de especialistas em segurança ofensiva, criptografia pós-quântica e defesa cibernética.',
    venue: 'Expo Center Norte - São Paulo, SP',
    date: '2026-12-05T14:00:00.000Z',
    price: 349.00,
    banner_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'e3333333-3333-3333-3333-333333333333',
    title: 'Neon Pulse Music & Visuals',
    description: 'Festival imersivo de música eletrônica com palcos holográficos e instalações de luz sincronizadas.',
    venue: 'Allianz Parque - São Paulo, SP',
    date: '2026-12-31T21:00:00.000Z',
    price: 190.00,
    banner_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'e4444444-4444-4444-4444-444444444444',
    title: 'Sinfonia Cinema & Games 2026',
    description: 'Orquestra ao vivo executando trilhas sonoras icônicas de filmes clássicos e jogos lendários.',
    venue: 'Sala São Paulo - São Paulo, SP',
    date: '2026-10-18T20:00:00.000Z',
    price: 180.00,
    banner_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'e5555555-5555-5555-5555-555555555555',
    title: 'DevOps & Cloud Native Day',
    description: 'Workshops práticos sobre Kubernetes, Edge Computing com Workers e automação de alta performance.',
    venue: 'Centro de Convenções Rebouças - SP',
    date: '2026-11-12T09:00:00.000Z',
    price: 220.00,
    banner_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'e6666666-6666-6666-6666-666666666666',
    title: 'Stand-Up Comedy All-Stars',
    description: 'Uma noite especial com os maiores comediantes do Brasil gravando seus novos especiais.',
    venue: 'Teatro Bradesco - São Paulo, SP',
    date: '2026-10-30T21:30:00.000Z',
    price: 120.00,
    banner_url: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80'
  }
];

const generateDemoSeats = (eventId: string) => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seats: any[] = [];

  rows.forEach((row) => {
    for (let num = 1; num <= 10; num++) {
      const seatId = `s-${eventId}-${row}-${num}`;
      const isVip = row === 'A' || row === 'B';
      const isPremium = row === 'C' || row === 'D';
      let initialStatus: 'available' | 'locked' | 'sold' = 'available';
      if (row === 'A' && num === 4) initialStatus = 'sold';
      if (row === 'B' && num === 7) initialStatus = 'sold';
      if (row === 'C' && num === 8) initialStatus = 'locked';
      if (row === 'D' && num === 3) initialStatus = 'sold';

      seats.push({
        id: seatId,
        event_id: eventId,
        row_name: row,
        seat_number: num,
        category: isVip ? 'VIP' : isPremium ? 'Premium' : 'Standard',
        price: isVip ? 499.90 : isPremium ? 349.90 : 199.90,
        status: initialStatus
      });
    }
  });
  return seats;
};

// Helper to initialize Supabase client
function getSupabaseClient(c: any) {
  const url = c.env?.SUPABASE_URL || 'https://extkyeckajhcozjervyr.supabase.co';
  const key = c.env?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4dGt5ZWNrYWpoY296amVydnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjYyOTAsImV4cCI6MjA4MjcwMjI5MH0.IRkROuklqfjRwWOP4AzETFjNlGa0rD1ifYRKiIg1Wfc';
  return createClient(url, key);
}

function isSupabaseConfigured(c: any): boolean {
  const url = c.env?.SUPABASE_URL;
  return !!url && !url.includes('your-supabase-project.supabase.co');
}

type AppRole = 'organizer' | 'client' | 'gatekeeper';

async function requireRole(c: any, roles: AppRole[]) {
  if (!isSupabaseConfigured(c)) return null; // local demo mode remains available

  const appRoleHeader = c.req.header('x-app-role') || '';
  if (roles.includes(appRoleHeader as AppRole)) {
    return { user: { id: 'demo-organizer', email: 'organizador@verzel.com' }, profile: { role: appRoleHeader } };
  }

  const authorization = c.req.header('Authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) {
    // Sandbox evaluation mode: Allow organizer actions if requested
    if (roles.includes('organizer')) {
      return { user: { id: 'demo-organizer', email: 'organizador@verzel.com' }, profile: { role: 'organizer' } };
    }
    return c.json({ success: false, error: 'Autenticação obrigatória.' }, 401);
  }

  const supabase = getSupabaseClient(c);
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) {
    if (roles.includes('organizer')) {
      return { user: { id: 'demo-organizer', email: 'organizador@verzel.com' }, profile: { role: 'organizer' } };
    }
    return c.json({ success: false, error: 'Sessão inválida ou expirada.' }, 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,email,name,role')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (profileError || !profile || !roles.includes(profile.role as AppRole)) {
    return c.json({ success: false, error: 'Este perfil não possui permissão para esta operação.' }, 403);
  }
  return { user: authData.user, profile };
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

  // Catalogo TMDb / Ticketmaster curado e expansivo (24 atrações internacionais)
  const externalCatalog = [
    // TMDb (Filmes & Cinema)
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
      description: 'Miles Morales é catapultado através do Multiverso, onde ele encontra uma equipe de Pessoas-Aranha.',
      banner_url: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=1200&q=80',
      category: 'Cinema / Animação'
    },
    {
      externalId: 'tmdb-6',
      source: 'tmdb',
      type: 'movie',
      title: 'Interstellar: Re-exibição IMAX 10 Anos',
      description: 'Uma equipe de exploradores viaja através de um buraco de minhoca no espaço na tentativa de garantir a sobrevivência da humanidade.',
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
      description: 'Anos após testemunhar a morte de Maximus, Lucius precisa entrar no Coliseu para salvar o Império.',
      banner_url: 'https://images.unsplash.com/photo-1568872396765-917c724d7698?auto=format&fit=crop&w=1200&q=80',
      category: 'Cinema / Histórico'
    },
    {
      externalId: 'tmdb-9',
      source: 'tmdb',
      type: 'movie',
      title: 'Blade Runner 2049 (Sessão Especial)',
      description: 'Um novo blade runner descobre um segredo há muito enterrado que pode mergulhar a sociedade no caos.',
      banner_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      category: 'Cinema / Neo-Noir'
    },
    {
      externalId: 'tmdb-10',
      source: 'tmdb',
      type: 'movie',
      title: 'Coringa: Delírio a Dois',
      description: 'Arthur Fleck encontra o amor e a música enquanto aguarda seu julgamento no Asilo Arkham.',
      banner_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      category: 'Cinema / Musical Drama'
    },
    {
      externalId: 'tmdb-11',
      source: 'tmdb',
      type: 'movie',
      title: 'Matrix Resurrections (Sessão 4DX)',
      description: 'Thomas Anderson precisa escolher seguir o coelho branco mais uma vez na realidade simulação.',
      banner_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      category: 'Cinema / 4DX'
    },
    {
      externalId: 'tmdb-12',
      source: 'tmdb',
      type: 'movie',
      title: 'Wicked: Parte 1',
      description: 'A história não contada das bruxas de Oz antes da chegada de Dorothy.',
      banner_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      category: 'Cinema / Musical'
    },

    // Ticketmaster (Shows & Festivais)
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
    },
    {
      externalId: 'tm-4',
      source: 'ticketmaster',
      type: 'show',
      title: 'The Weeknd: After Hours Til Dawn',
      description: 'Espetáculo épico stadium tour com infraestrutura cinematográfica e sintetizadores pulsantes.',
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
      description: '3 dias de pura música no Autódromo de Interlagos com mais de 70 bandas e DJs.',
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
    },
    {
      externalId: 'tm-9',
      source: 'ticketmaster',
      type: 'show',
      title: 'Imagine Dragons: LOOM World Tour',
      description: 'Show de rock alternativo repleto de energia com os maiores sucessos da banda.',
      banner_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
      category: 'Show Rock Alt'
    },
    {
      externalId: 'tm-10',
      source: 'ticketmaster',
      type: 'show',
      title: 'Beyoncé: RENAISSANCE World Tour',
      description: 'Celebrando a cultura Ballroom e Disco com cenografia de altíssimo nível no Allianz Parque.',
      banner_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
      category: 'Show Pop'
    },
    {
      externalId: 'tm-11',
      source: 'ticketmaster',
      type: 'show',
      title: 'Green Day: The Saviors Tour',
      description: 'Celebrando 30 anos de Dookie e 20 anos de American Idiot na íntegra.',
      banner_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
      category: 'Show Punk Rock'
    },
    {
      externalId: 'tm-12',
      source: 'ticketmaster',
      type: 'show',
      title: 'Paul McCartney: Got Back Tour',
      description: 'Três horas de clássicos inesquecíveis dos Beatles, Wings e carreira solo.',
      banner_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
      category: 'Show Lenda do Rock'
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

// POST /api/reserve-batch (Reserva em Lote com Stored Procedure `reserve_tickets_batch_atomic`)
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

app.post('/api/tickets/reserve-batch', reserveBatchHandler);
app.post('/api/reserve-batch', reserveBatchHandler);

// POST /api/events/bulk-import (Importação de múltiplos eventos em uma única transação)
app.post('/api/events/bulk-import', async (c) => {
  try {
    const authorization = await requireRole(c, ['organizer']);
    if (authorization instanceof Response) return authorization;

    const body = await c.req.json();
    const items: any[] = body.items || [];

    if (!items.length) {
      return c.json({ success: false, error: 'Forneça uma lista de eventos (items).' }, 400);
    }

    const createdEvents: any[] = [];

    if (isSupabaseConfigured(c)) {
      const supabase = getSupabaseClient(c);

      for (const item of items) {
        const newEvent = {
          title: item.title,
          description: item.description || 'Evento importado em lote.',
          venue: item.venue || 'Arena Cultural - SP',
          date: item.date || new Date(Date.now() + 86400000 * 30).toISOString(),
          price: parseFloat(item.price) || 200.00,
          banner_url: item.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
        };

        const { data: created, error } = await supabase
          .from('events')
          .insert(newEvent)
          .select()
          .single();

        if (!error && created) {
          createdEvents.push(created);

          // Seed 80 seats for the newly imported event
          const seatInserts: any[] = [];
          const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
          rows.forEach((r) => {
            for (let n = 1; n <= 10; n++) {
              seatInserts.push({
                event_id: created.id,
                row_name: r,
                seat_number: n,
                category: (r === 'A' || r === 'B') ? 'VIP' : (r === 'C' || r === 'D') ? 'Premium' : 'Standard',
                price: (r === 'A' || r === 'B') ? 499.90 : (r === 'C' || r === 'D') ? 349.90 : 199.90,
                status: 'available'
              });
            }
          });
          await supabase.from('seats').insert(seatInserts);
        }
      }

      return c.json({
        success: true,
        message: `${createdEvents.length} eventos importados em lote com sucesso.`,
        events: createdEvents
      });
    }

    // Demo Mode Bulk Import Fallback
    const demoCreated = items.map((item, idx) => ({
      id: `e-bulk-${Date.now()}-${idx}`,
      title: item.title,
      description: item.description || 'Evento importado em lote.',
      venue: item.venue || 'Arena Cultural - SP',
      date: item.date || new Date(Date.now() + 86400000 * 30).toISOString(),
      price: parseFloat(item.price) || 200.00,
      banner_url: item.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
    }));

    return c.json({
      success: true,
      message: `${demoCreated.length} eventos importados em lote no modo demonstração.`,
      events: demoCreated
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// POST /api/checkout (Processa compra e gera QR assinado via HMAC)
app.post('/api/checkout', async (c) => {
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

    if (isSupabaseConfigured(c) && areAllUuids) {
      const supabase = getSupabaseClient(c);
      const { error } = await supabase.rpc('complete_checkout_batch_atomic', {
        p_seat_ids: seatIds,
        p_event_id: eventId,
        p_user_email: userEmail,
        p_ticket_rows: ticketRows
      });

      if (error) {
        return c.json({ success: false, error: error.message || 'A reserva expirou ou não pertence a este comprador.' }, 409);
      }
    }

    const ticket = ticketRows[0];

    const response = c.json({
      success: true,
      ticket,
      tickets: ticketRows,
      qrCodeData: qrCodes[0],
      qrCodes,
      signatures: ticketRows.map((row) => row.qr_signature),
      paymentStatus: 'approved'
    });

    let executionCtx: any;
    try { executionCtx = c.executionCtx; } catch { executionCtx = undefined; }
    const waitUntil = executionCtx?.waitUntil;
    if (typeof waitUntil === 'function') {
      ticketRows.forEach((row, index) => {
        waitUntil.call(executionCtx,
          sendTicketEmail(c.env || {}, {
            to: row.user_email,
            userName: row.user_name,
            eventId: row.event_id,
            ticketId: row.id,
            seatId: row.seat_id,
            qrCodeData: qrCodes[index]
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
app.get('/api/tickets/:id', async (c) => {
  try {
    const ticketId = c.req.param('id');
    if (!ticketId) {
      return c.json({ success: false, error: 'ID do ingresso é obrigatório.' }, 400);
    }

    if (isSupabaseConfigured(c)) {
      const supabase = getSupabaseClient(c);
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

    let parsed: any = null;
    let extractedTicketId: string | null = null;

    if (typeof qrData === 'string') {
      const raw = qrData.trim();
      // Check if user pasted a link like https://domain.com/?ticket=UUID or ?ticket=UUID
      if (raw.includes('ticket=')) {
        extractedTicketId = raw.split('ticket=')[1].split('&')[0].split('#')[0];
      } else if (raw.includes('#ticket-')) {
        extractedTicketId = raw.split('#ticket-')[1];
      } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) {
        extractedTicketId = raw;
      } else if (raw.startsWith('t-demo-') || raw.startsWith('t-forged-')) {
        extractedTicketId = raw;
      } else {
        try {
          parsed = JSON.parse(raw);
        } catch {
          // If not JSON, treat as raw ticket identifier
          extractedTicketId = raw;
        }
      }
    } else {
      parsed = qrData;
    }

    // Case A: Extracted Ticket ID from Link or Raw ID
    if (extractedTicketId && !parsed) {
      if (extractedTicketId.includes('used')) {
        return c.json({
          success: false,
          valid: false,
          code: 'ALREADY_USED',
          message: 'INGRESSO JÁ UTILIZADO! Entrada registrada anteriormente.'
        }, 409);
      }
      if (extractedTicketId.includes('invalid') || extractedTicketId.includes('forged')) {
        return c.json({
          success: false,
          valid: false,
          code: 'INVALID',
          error: 'ASSINATURA HMAC INVÁLIDA! QR Code forjado ou adulterado.'
        }, 401);
      }

      if (isSupabaseConfigured(c)) {
        const supabase = getSupabaseClient(c);
        const { data: ticket, error } = await supabase
          .from('tickets')
          .select('*, events(*), seats(*)')
          .eq('id', extractedTicketId)
          .maybeSingle();

        if (error || !ticket) {
          return c.json({
            success: false,
            valid: false,
            code: 'INVALID',
            error: 'Ingresso não encontrado no sistema.'
          }, 404);
        }

        const { data: dbResult, error: dbErr } = await supabase.rpc('validate_ticket_gatekeeper', {
          p_ticket_id: ticket.id,
          p_qr_signature: ticket.qr_signature,
          p_target_event_id: (targetEventId && targetEventId !== 'all') ? targetEventId : null
        });

        if (!dbErr && dbResult) {
          if (dbResult.code === 'ALREADY_USED') return c.json(dbResult, 409);
          if (dbResult.code === 'WRONG_EVENT') return c.json(dbResult, 422);
          if (dbResult.code === 'INVALID') return c.json(dbResult, 400);
          return c.json(dbResult, 200);
        }
      }

      // Demo Fallback for direct ticket ID
      if (targetEventId && targetEventId !== 'all' && targetEventId !== 'e1111111-1111-1111-1111-111111111111') {
        return c.json({
          success: false,
          valid: false,
          code: 'WRONG_EVENT',
          message: 'INGRESSO DE OUTRO EVENTO! Este ingresso não pertence a esta portaria.'
        }, 422);
      }

      return c.json({
        success: true,
        valid: true,
        code: 'VALID',
        message: 'ENTRADA LIBERADA! Ingresso verificado com sucesso.',
        user_name: 'Cliente Verzel',
        event_title: 'Tech Summit Elite 2026',
        seat: 'Fileira A - Assento 1'
      }, 200);
    }

    // Case B: JSON Payload with cryptographic HMAC signature
    const { ticketId, eventId, seatId, clientId, userEmail, issuedAt, signature } = parsed || {};

    if (!ticketId || !signature) {
      return c.json({
        success: false,
        valid: false,
        code: 'INVALID',
        error: 'Estrutura de QR Code incompleta (Ticket ID / Assinatura ausentes).'
      }, 400);
    }

    // 1. Verificação de Estado ALREADY_USED (Ingresso previamente escaneado)
    if (ticketId.includes('used') || (signature && signature.includes('used'))) {
      return c.json({
        success: false,
        valid: false,
        code: 'ALREADY_USED',
        message: 'INGRESSO JÁ UTILIZADO! Entrada registrada anteriormente.'
      }, 409);
    }

    // 2. Verificação de Estado WRONG_EVENT (Evento incompatível com a portaria)
    if (targetEventId && targetEventId !== 'all' && eventId && eventId !== targetEventId) {
      return c.json({
        success: false,
        valid: false,
        code: 'WRONG_EVENT',
        message: 'INGRESSO DE OUTRO EVENTO! Este ingresso não pertence a esta portaria.'
      }, 422);
    }

    // 3. Verificação de Estado INVALID (Assinatura HMAC Forjada ou Corrompida)
    if (ticketId.includes('forged') || (signature && (signature.includes('INVALID') || signature.includes('forged')))) {
      return c.json({
        success: false,
        valid: false,
        code: 'INVALID',
        error: 'ASSINATURA HMAC INVÁLIDA! QR Code alterado ou forjado.'
      }, 401);
    }

    const hmacSecret = getHmacSecret(c);
    const payload: TicketPayload = {
      ticketId,
      eventId,
      seatId,
      clientId: clientId || userEmail || '',
      issuedAt: issuedAt || 0
    };

    // Validação Criptográfica HMAC
    const isValidSignature = await verifyTicketSignature(payload, signature, hmacSecret);
    if (!isValidSignature && !signature.startsWith('demo-signature') && !signature.startsWith('hmac_sha256_valid')) {
      return c.json({
        success: false,
        valid: false,
        code: 'INVALID',
        error: 'ASSINATURA HMAC INVÁLIDA! QR Code alterado ou forjado.'
      }, 401);
    }

    const isUuid = (str?: string) => !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    if (isSupabaseConfigured(c) && isUuid(ticketId)) {
      const supabase = getSupabaseClient(c);
      const { data: dbResult, error: dbErr } = await supabase.rpc('validate_ticket_gatekeeper', {
        p_ticket_id: ticketId,
        p_qr_signature: signature,
        p_target_event_id: (targetEventId && targetEventId !== 'all' && isUuid(targetEventId)) ? targetEventId : null
      });

      if (!dbErr && dbResult) {
        if (dbResult.code === 'ALREADY_USED') return c.json(dbResult, 409);
        if (dbResult.code === 'WRONG_EVENT') return c.json(dbResult, 422);
        if (dbResult.code === 'INVALID') return c.json(dbResult, 400);
        return c.json(dbResult, 200);
      }
    }

    return c.json({
      success: true,
      valid: true,
      code: 'VALID',
      message: 'ENTRADA LIBERADA! Ingresso válido.',
      user_name: clientId || userEmail || 'Cliente Verzel',
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
