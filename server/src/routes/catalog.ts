import { Hono } from 'hono';
import { Bindings } from '../types';
import { EXTERNAL_CATALOG, ExternalCatalogItem } from '../data/externalCatalog';

const catalogRouter = new Hono<{ Bindings: Bindings }>();

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

interface TmdbResponse {
  page: number;
  results: TmdbMovie[];
  total_results: number;
}

const TMDB_GENRE_MAP: Record<number, string> = {
  28: 'Ação', 12: 'Aventura', 16: 'Animação', 35: 'Comédia',
  80: 'Crime', 99: 'Documentário', 18: 'Drama', 14: 'Fantasia',
  27: 'Terror', 10402: 'Música', 9648: 'Mistério', 10749: 'Romance',
  878: 'Ficção Científica', 53: 'Thriller', 10752: 'Guerra', 37: 'Faroeste',
};

function mapTmdbToItem(movie: TmdbMovie): ExternalCatalogItem {
  const genreName = movie.genre_ids?.length
    ? TMDB_GENRE_MAP[movie.genre_ids[0]] || 'Cinema'
    : 'Cinema';

  return {
    externalId: `tmdb-${movie.id}`,
    source: 'tmdb',
    type: 'movie',
    title: movie.title,
    description: movie.overview || 'Filme disponível no catálogo TMDb.',
    banner_url: movie.poster_path
      ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
    category: `Cinema / ${genreName}`,
  };
}

interface TicketmasterImage {
  url: string;
  ratio?: string;
  width?: number;
}

interface TicketmasterEvent {
  id: string;
  name: string;
  url?: string;
  images?: TicketmasterImage[];
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
      dateTime?: string;
    };
  };
  _embedded?: {
    venues?: {
      name: string;
      city?: { name: string };
      state?: { stateCode: string };
    }[];
  };
  classifications?: {
    segment?: { name: string };
    genre?: { name: string };
  }[];
}

interface TicketmasterResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page?: {
    totalElements: number;
  };
}

function mapTicketmasterToItem(event: TicketmasterEvent): ExternalCatalogItem {
  const venue = event._embedded?.venues?.[0];
  const venueStr = venue ? `${venue.name} - ${venue.city?.name || 'Brasil'}` : 'Arena Principal';
  const genre = event.classifications?.[0]?.genre?.name || event.classifications?.[0]?.segment?.name || 'Show';
  const bestImage = event.images?.find((img) => img.width && img.width >= 600)?.url || event.images?.[0]?.url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80';

  return {
    externalId: `tm-${event.id}`,
    source: 'ticketmaster',
    type: 'show',
    title: event.name,
    description: `Apresentação oficial ${event.name} em ${venueStr}.`,
    banner_url: bestImage,
    category: `Show / ${genre}`,
    venue: venueStr,
    date: event.dates?.start?.dateTime || event.dates?.start?.localDate,
  };
}

// GET /api/external-catalog (Busca filmes e shows nas APIs externas TMDb / Ticketmaster)
catalogRouter.get('/external-catalog', async (c) => {
  const source = c.req.query('source') || 'tmdb';
  const query = c.req.query('query') || '';

  // -------------------------------------------------------------------
  // 1. TMDb Live Fetch: chamada REAL para api.themoviedb.org
  // -------------------------------------------------------------------
  if (source === 'tmdb' || source === 'all') {
    const apiKey = c.env?.TMDB_API_KEY || '';

    if (apiKey) {
      try {
        const endpoint = query
          ? `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`
          : `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=pt-BR&page=1`;

        const res = await fetch(endpoint, {
          headers: { Accept: 'application/json' },
        });

        if (res.ok) {
          const data = (await res.json()) as TmdbResponse;
          const liveResults = data.results
            .filter((m) => m.title && m.poster_path)
            .slice(0, 20)
            .map(mapTmdbToItem);

          if (source === 'tmdb') {
            return c.json({
              success: true,
              results: liveResults,
              source: 'tmdb-live',
              totalResults: data.total_results,
            });
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('TMDb API fetch failed, falling back to static catalog:', message);
      }
    }
  }

  // -------------------------------------------------------------------
  // 2. Ticketmaster Live Fetch: chamada REAL para Discovery API v2
  // -------------------------------------------------------------------
  if (source === 'ticketmaster' || source === 'all') {
    const tmApiKey = c.env?.TICKETMASTER_API_KEY || '';

    if (tmApiKey) {
      try {
        const tmEndpoint = query
          ? `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${tmApiKey}&keyword=${encodeURIComponent(query)}&size=20`
          : `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${tmApiKey}&classificationName=music&size=20`;

        const tmRes = await fetch(tmEndpoint, {
          headers: { Accept: 'application/json' },
        });

        if (tmRes.ok) {
          const tmData = (await tmRes.json()) as TicketmasterResponse;
          const liveEvents = tmData._embedded?.events || [];
          const liveResults = liveEvents.map(mapTicketmasterToItem);

          if (source === 'ticketmaster') {
            return c.json({
              success: true,
              results: liveResults,
              source: 'ticketmaster-live',
              totalResults: tmData.page?.totalElements || liveResults.length,
            });
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('Ticketmaster Discovery API fetch failed, using curated catalog:', message);
      }
    }
  }

  // -------------------------------------------------------------------
  // 3. Catálogo curado oficial (Fallback estável de demonstração)
  // -------------------------------------------------------------------
  let filtered = EXTERNAL_CATALOG.filter((item) => item.source === source || source === 'all');
  if (query) {
    filtered = filtered.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );
  }

  return c.json({
    success: true,
    results: filtered,
    source: source === 'ticketmaster' ? 'ticketmaster-curated' : 'curated-fallback',
  });
});

export default catalogRouter;

