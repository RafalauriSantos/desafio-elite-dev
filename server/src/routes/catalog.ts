import { Hono } from 'hono';
import { Bindings } from '../types';
import { EXTERNAL_CATALOG } from '../data/externalCatalog';

const catalogRouter = new Hono<{ Bindings: Bindings }>();

// GET /api/external-catalog (Busca filmes e shows nas APIs externas TMDb / Ticketmaster)
catalogRouter.get('/external-catalog', async (c) => {
  const source = c.req.query('source') || 'tmdb';
  const query = c.req.query('query') || '';

  let filtered = EXTERNAL_CATALOG.filter(item => item.source === source || source === 'all');
  if (query) {
    filtered = filtered.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
  }

  return c.json({ success: true, results: filtered });
});

export default catalogRouter;
