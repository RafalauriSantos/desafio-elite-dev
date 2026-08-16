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

// GET /api/external-catalog (Busca filmes e shows nas APIs externas TMDb / Ticketmaster)
catalogRouter.get('/external-catalog', async (c) => {
  const source = c.req.query('source') || 'tmdb';
  const query = c.req.query('query') || '';

  // -------------------------------------------------------------------
  // TMDb Live Fetch: chamada REAL para api.themoviedb.org
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

          // Se source=all, combinar com itens Ticketmaster estáticos
          const ticketmasterItems = source === 'all'
            ? EXTERNAL_CATALOG.filter((item) => item.source === 'ticketmaster')
            : [];

          return c.json({
            success: true,
            results: [...liveResults, ...ticketmasterItems],
            source: 'tmdb-live',
            totalResults: data.total_results,
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('TMDb API fetch failed, falling back to static catalog:', message);
      }
    }
  }

  // -------------------------------------------------------------------
  // Fallback: catálogo estático curado (24 itens TMDb + Ticketmaster)
  // -------------------------------------------------------------------
  let filtered = EXTERNAL_CATALOG.filter((item) => item.source === source || source === 'all');
  if (query) {
    filtered = filtered.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );
  }

  return c.json({ success: true, results: filtered, source: 'static-fallback' });
});

export default catalogRouter;
